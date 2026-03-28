import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  signInWithPopup,
  User as FirebaseUser,
  updateProfile,
  sendPasswordResetEmail,
  onAuthStateChanged,
} from 'firebase/auth';
import { auth, googleProvider, db } from './firebase';
import { collection, doc, getDocs, query, setDoc, getDoc, Timestamp, where, updateDoc } from 'firebase/firestore';
import { User } from '../types/models';

class AuthService {
  private getSuperAdminEmails(): Set<string> {
    const raw = import.meta.env.VITE_SUPER_ADMIN_EMAILS;
    if (!raw) return new Set();

    return new Set(
      raw
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    );
  }

  private resolveRoleByEmail(email?: string | null): 'user' | 'super_admin' {
    if (!email) return 'user';
    const superAdminEmails = this.getSuperAdminEmails();
    return superAdminEmails.has(email.toLowerCase()) ? 'super_admin' : 'user';
  }

  private async ensureSuperAdminRoleIfConfigured(user: FirebaseUser): Promise<void> {
    const desiredRole = this.resolveRoleByEmail(user.email);
    if (desiredRole !== 'super_admin') return;

    const userRef = doc(db, 'users', user.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      await setDoc(userRef, {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName || 'Super Admin',
        photoURL: user.photoURL,
        role: 'super_admin',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return;
    }

    const role = userDoc.data()?.role;
    if (role !== 'super_admin') {
      await setDoc(
        userRef,
        {
          role: 'super_admin',
          updatedAt: Timestamp.now(),
        },
        { merge: true }
      );
    }
  }

  async signUp(
    email: string,
    password: string,
    displayName: string
  ): Promise<FirebaseUser> {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);

    await updateProfile(userCredential.user, { displayName });

    const role = this.resolveRoleByEmail(email);

    // Create user profile in Firestore
    await setDoc(doc(db, 'users', userCredential.user.uid), {
      uid: userCredential.user.uid,
      email,
      displayName,
      role,
      createdAt: Timestamp.now(),
    });

    return userCredential.user;
  }

  async signIn(email: string, password: string): Promise<FirebaseUser> {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    await this.ensureSuperAdminRoleIfConfigured(userCredential.user);
    return userCredential.user;
  }

  async signInWithGoogle(): Promise<FirebaseUser> {
    const userCredential = await signInWithPopup(auth, googleProvider);

    // Create user profile if first time
    const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
    if (!userDoc.exists()) {
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName,
        photoURL: userCredential.user.photoURL,
        role: this.resolveRoleByEmail(userCredential.user.email),
        createdAt: Timestamp.now(),
      });
    }

    await this.ensureSuperAdminRoleIfConfigured(userCredential.user);
    return userCredential.user;
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(auth);
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(auth, email);
  }

  async getUserProfile(uid: string): Promise<User | null> {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (!docSnap.exists()) {
        // Fallback for new users whose profile is still being created
        const currentUser = auth.currentUser;
        if (currentUser && currentUser.uid === uid) {
          return {
            uid: currentUser.uid,
            email: currentUser.email || '',
            displayName: currentUser.displayName || 'New User',
            photoURL: currentUser.photoURL || undefined,
            role: this.resolveRoleByEmail(currentUser.email),
            createdAt: Date.now(),
            sportsInterests: [],
          } as User;
        }
        return null;
      }

      const data = docSnap.data();
      return {
        uid: docSnap.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        phone: data.phone,
        city: data.city,
        role: data.role || 'user',
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
        age: data.age,
        place: data.place,
        location: data.location,
        aadharNumber: data.aadharNumber,
        dateOfBirth: data.dateOfBirth,
        sportsInterests: data.sportsInterests || [],
        profileImage: data.profileImage,
      };
    } catch (error) {
      console.error('Error in getUserProfile:', error);
      // If it's a permission error because the doc doesn't exist, handle it gracefully
      const currentUser = auth.currentUser;
      if (currentUser && currentUser.uid === uid) {
        return {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: currentUser.displayName || 'User',
          role: this.resolveRoleByEmail(currentUser.email),
          createdAt: Date.now(),
          sportsInterests: [],
        } as User;
      }
      throw error;
    }
  }

  async updateUserProfile(
    uid: string,
    data: Partial<User>
  ): Promise<void> {
    const updateData = { ...data, uid }; // Ensure uid is present for first-time creation via setDoc
    delete (updateData as any).createdAt;

    await setDoc(doc(db, 'users', uid), updateData, { merge: true });
  }

  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Upgrade the currently signed-in user to admin after successful payment.
   * This writes a payment record with id `admin_upgrade_<uid>` and then
   * updates the user document's role and premium flag.
   */
  async upgradeToAdmin(): Promise<void> {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      throw new Error('You must be signed in to upgrade.');
    }

    const uid = currentUser.uid;

    // 1) Create/overwrite the admin upgrade payment document expected by rules
    const paymentDocId = `admin_upgrade_${uid}`;
    const paymentRef = doc(db, 'payments', paymentDocId);
    await setDoc(paymentRef, {
      user_id: uid,
      amount: 199,
      currency: 'INR',
      status: 'success',
      upgrade_type: 'admin',
      created_at: Timestamp.now(),
      updated_at: Timestamp.now(),
    });

    // 2) Update the user document to admin with premium flag
    const userRef = doc(db, 'users', uid);
    await updateDoc(userRef, {
      role: 'admin',
      is_premium: true,
      updated_at: Timestamp.now(),
    });
  }

  async findUserByPhone(phone: string): Promise<User | null> {
    try {
      const q = query(
        collection(db, 'users'),
        where('phone', '==', phone)
      );

      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      const data = docSnap.data();

      return {
        uid: docSnap.id,
        email: data.email,
        displayName: data.displayName,
        photoURL: data.photoURL,
        phone: data.phone,
        city: data.city,
        role: data.role || 'user',
        createdAt: data.createdAt?.toMillis?.() || data.createdAt || Date.now(),
        age: data.age,
        place: data.place,
        location: data.location,
        aadharNumber: data.aadharNumber,
        dateOfBirth: data.dateOfBirth,
        sportsInterests: data.sportsInterests || [],
        profileImage: data.profileImage,
      } as User;
    } catch (error) {
      console.error('Error finding user by phone:', error);
      return null;
    }
  }

  onAuthStateChange(callback: (user: FirebaseUser | null) => void) {
    return onAuthStateChanged(auth, callback);
  }
}

export default new AuthService();
