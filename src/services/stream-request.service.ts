import { db } from './firebase';
import { collection, getDocs, setDoc, doc, query, where, orderBy } from 'firebase/firestore';

export interface StreamRequest {
  id: string;
  tournamentId: string;
  tournamentName: string;
  userId: string;
  userName: string;
  status: 'pending' | 'approved' | 'rejected';
  streamKey?: string;
  youtubeLink?: string;
  requestedAt: number;
  approvedAt?: number;
  rejectedReason?: string;
}

class StreamRequestService {
  async getPendingRequests(): Promise<StreamRequest[]> {
    try {
      const requestsRef = collection(db, 'stream_requests');
      const q = query(
        requestsRef,
        where('status', '==', 'pending'),
        orderBy('requestedAt', 'desc')
      );
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as StreamRequest));
    } catch (error) {
      console.error('Failed to fetch pending requests:', error);
      throw error;
    }
  }

  async getAllRequests(): Promise<StreamRequest[]> {
    try {
      const requestsRef = collection(db, 'stream_requests');
      const q = query(requestsRef, orderBy('requestedAt', 'desc'));
      const snapshot = await getDocs(q);

      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as StreamRequest));
    } catch (error) {
      console.error('Failed to fetch stream requests:', error);
      throw error;
    }
  }

  async approveRequest(requestId: string, streamKey: string): Promise<void> {
    try {
      await setDoc(
        doc(db, 'stream_requests', requestId),
        {
          status: 'approved',
          streamKey,
          approvedAt: Date.now(),
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to approve request:', error);
      throw error;
    }
  }

  async rejectRequest(requestId: string, reason: string): Promise<void> {
    try {
      await setDoc(
        doc(db, 'stream_requests', requestId),
        {
          status: 'rejected',
          rejectedReason: reason,
        },
        { merge: true }
      );
    } catch (error) {
      console.error('Failed to reject request:', error);
      throw error;
    }
  }
}

export default new StreamRequestService();