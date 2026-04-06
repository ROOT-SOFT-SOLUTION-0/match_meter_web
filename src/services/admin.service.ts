import { db } from './firebase';
import { collection, getDocs, setDoc, doc, query, orderBy, getDoc } from 'firebase/firestore';

export interface User {
  uid: string;
  email: string;
  displayName?: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: number;
  updatedAt?: number;
}

class AdminService {
  async getAllUsers(): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        uid: doc.id,
        ...doc.data(),
      } as User));
    } catch (error) {
      console.error('Failed to fetch users:', error);
      throw error;
    }
  }

  async updateUserRole(uid: string, role: 'user' | 'admin' | 'super_admin'): Promise<void> {
    try {
      await setDoc(
        doc(db, 'users', uid),
        {
          role,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to update user role:', error);
      throw error;
    }
  }

  /**
   * Get global pricing configuration such as tournament creation fee.
   * Stored under app_config/pricing in Firestore.
   */
  async getPricingConfig(): Promise<{ tournamentCreationFee: number } | null> {
    try {
      const ref = doc(db, 'app_config', 'pricing');
      const snap = await getDoc(ref);
      if (!snap.exists()) return null;

      const data = snap.data() as any;
      return {
        tournamentCreationFee: typeof data.tournamentCreationFee === 'number'
          ? data.tournamentCreationFee
          : 199,
      };
    } catch (error) {
      console.error('Failed to fetch pricing config:', error);
      return null;
    }
  }

  /**
   * Update global pricing configuration (super admin only via security rules).
   */
  async updatePricingConfig(tournamentCreationFee: number): Promise<void> {
    try {
      await setDoc(
        doc(db, 'app_config', 'pricing'),
        {
          tournamentCreationFee,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to update pricing config:', error);
      throw error;
    }
  }
}

export default new AdminService();