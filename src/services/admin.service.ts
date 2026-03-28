import { db } from './firebase';
import { collection, getDocs, setDoc, doc, query, orderBy } from 'firebase/firestore';

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
}

export default new AdminService();