import { db } from './firebase';
import { collection, getDocs, setDoc, doc, deleteDoc, query, orderBy } from 'firebase/firestore';

export interface Sponsor {
  id: string;
  name: string;
  logo?: string;
  website?: string;
  description?: string;
  createdAt: number;
  updatedAt?: number;
}

class SponsorService {
  async getAllSponsors(): Promise<Sponsor[]> {
    try {
      const sponsorsRef = collection(db, 'sponsors');
      const q = query(sponsorsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Sponsor));
    } catch (error) {
      console.error('Failed to fetch sponsors:', error);
      throw error;
    }
  }

  async createSponsor(sponsor: Omit<Sponsor, 'id' | 'createdAt'>): Promise<string> {
    try {
      const sponsorsRef = collection(db, 'sponsors');
      const newDocRef = doc(sponsorsRef);
      await setDoc(newDocRef, {
        ...sponsor,
        createdAt: Date.now(),
      });
      return newDocRef.id;
    } catch (error) {
      console.error('Failed to create sponsor:', error);
      throw error;
    }
  }

  async updateSponsor(id: string, updates: Partial<Sponsor>): Promise<void> {
    try {
      await setDoc(
        doc(db, 'sponsors', id),
        {
          ...updates,
          updatedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to update sponsor:', error);
      throw error;
    }
  }

  async deleteSponsor(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'sponsors', id));
    } catch (error) {
      console.error('Failed to delete sponsor:', error);
      throw error;
    }
  }
}

export default new SponsorService();