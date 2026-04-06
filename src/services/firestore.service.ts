import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  addDoc,
  QueryConstraint,
  onSnapshot,
  Unsubscribe,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Tournament, Match, TeamRegistration, Payment } from '../types/models';
import { TournamentService } from './tournament.service';

class FirestoreService {
  // ==================== TOURNAMENTS ====================

  async getTournaments(filters?: QueryConstraint[]): Promise<Tournament[]> {
    try {
      const constraints: QueryConstraint[] = [
        orderBy('startDate', 'desc'),
        ...(filters || []),
      ];
      const q = query(collection(db, 'tournaments'), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as Tournament[];
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      return [];
    }
  }

  async getTournamentById(id: string): Promise<Tournament | null> {
    try {
      const docSnap = await getDoc(doc(db, 'tournaments', id));
      return docSnap.exists()
        ? ({ id: docSnap.id, ...this.convertTimestamps(docSnap.data()) } as Tournament)
        : null;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      return null;
    }
  }

  async createTournament(data: Partial<Tournament>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'tournaments'), {
        ...data,
        totalTeams: data.totalTeams ?? 0,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  async updateTournament(id: string, data: Partial<Tournament>): Promise<void> {
    try {
      await updateDoc(doc(db, 'tournaments', id), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  }

  async deleteTournament(id: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'tournaments', id));
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  }

  onTournamentChange(
    id: string,
    callback: (tournament: Tournament | null) => void
  ): Unsubscribe {
    return onSnapshot(doc(db, 'tournaments', id), (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...this.convertTimestamps(docSnap.data()),
        } as Tournament);
      } else {
        callback(null);
      }
    });
  }

  // ==================== TEAM REGISTRATIONS ====================

  async registerTeam(
    tournamentId: string,
    data: Partial<TeamRegistration>
  ): Promise<string> {
    try {
      const docRef = await addDoc(
        collection(db, 'tournaments', tournamentId, 'registrations'),
        {
          ...data,
          status: 'pending',
          paymentStatus: 'pending',
          registeredAt: Timestamp.now(),
        }
      );
      return docRef.id;
    } catch (error) {
      console.error('Error registering team:', error);
      throw error;
    }
  }

  async getTeamRegistrations(tournamentId: string): Promise<TeamRegistration[]> {
    try {
      const q = query(
        collection(db, 'tournaments', tournamentId, 'registrations'),
        orderBy('registeredAt', 'desc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as TeamRegistration[];
    } catch (error) {
      console.error('Error fetching team registrations:', error);
      return [];
    }
  }

  async getTeamRegistrationById(
    tournamentId: string,
    registrationId: string
  ): Promise<TeamRegistration | null> {
    try {
      const docSnap = await getDoc(
        doc(db, 'tournaments', tournamentId, 'registrations', registrationId)
      );
      return docSnap.exists()
        ? ({
            id: docSnap.id,
            ...this.convertTimestamps(docSnap.data()),
          } as TeamRegistration)
        : null;
    } catch (error) {
      console.error('Error fetching team registration:', error);
      return null;
    }
  }

  async getUserRegistrationForTournament(
    tournamentId: string,
    userId: string
  ): Promise<TeamRegistration | null> {
    try {
      const q = query(
        collection(db, 'tournaments', tournamentId, 'registrations'),
        where('userId', '==', userId),
        orderBy('registeredAt', 'desc')
      );
      const snapshot = await getDocs(q);
      if (snapshot.empty) return null;

      const docSnap = snapshot.docs[0];
      return {
        id: docSnap.id,
        ...this.convertTimestamps(docSnap.data()),
      } as TeamRegistration;
    } catch (error) {
      console.error('Error fetching user registration for tournament:', error);
      return null;
    }
  }

  async updateTeamRegistration(
    tournamentId: string,
    registrationId: string,
    data: Partial<TeamRegistration>
  ): Promise<void> {
    try {
      await updateDoc(
        doc(db, 'tournaments', tournamentId, 'registrations', registrationId),
        data
      );
    } catch (error) {
      console.error('Error updating team registration:', error);
      throw error;
    }
  }

  // ==================== MATCHES ====================

  async getMatches(
    tournamentId: string,
    filters?: QueryConstraint[]
  ): Promise<Match[]> {
    try {
      const constraints: QueryConstraint[] = [
        where('tournamentId', '==', tournamentId),
        orderBy('startTime', 'asc'),
        ...(filters || []),
      ];
      const q = query(collection(db, 'matches'), ...constraints);
      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...this.convertTimestamps(doc.data()),
      })) as Match[];
    } catch (error) {
      console.error('Error fetching matches:', error);
      return [];
    }
  }

  async getMatchById(matchId: string): Promise<Match | null> {
    try {
      const docSnap = await getDoc(doc(db, 'matches', matchId));
      return docSnap.exists()
        ? ({ id: docSnap.id, ...this.convertTimestamps(docSnap.data()) } as Match)
        : null;
    } catch (error) {
      console.error('Error fetching match:', error);
      return null;
    }
  }

  async createMatch(data: Partial<Match>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'matches'), {
        ...data,
        status: 'scheduled',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating match:', error);
      throw error;
    }
  }

  async updateMatch(matchId: string, data: Partial<Match>): Promise<void> {
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating match:', error);
      throw error;
    }
  }

  async updateMatchResult(
    matchId: string,
    team1Score: number,
    team2Score: number
  ): Promise<void> {
    try {
      await updateDoc(doc(db, 'matches', matchId), {
        team1Score,
        team2Score,
        status: 'completed',
        endTime: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
  }

  onMatchChange(matchId: string, callback: (match: Match | null) => void): Unsubscribe {
    return onSnapshot(doc(db, 'matches', matchId), (docSnap) => {
      if (docSnap.exists()) {
        callback({
          id: docSnap.id,
          ...this.convertTimestamps(docSnap.data()),
        } as Match);
      } else {
        callback(null);
      }
    });
  }

  // ==================== PAYMENTS ====================

  async createPayment(data: Partial<Payment>): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'payments'), {
        ...data,
        status: 'pending',
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
      });
      return docRef.id;
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }

  async getPayment(paymentId: string): Promise<Payment | null> {
    try {
      const docSnap = await getDoc(doc(db, 'payments', paymentId));
      return docSnap.exists()
        ? ({
            id: docSnap.id,
            ...this.convertTimestamps(docSnap.data()),
          } as Payment)
        : null;
    } catch (error) {
      console.error('Error fetching payment:', error);
      return null;
    }
  }

  async updatePayment(paymentId: string, data: Partial<Payment>): Promise<void> {
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        ...data,
        updatedAt: Timestamp.now(),
      });
    } catch (error) {
      console.error('Error updating payment:', error);
      throw error;
    }
  }

  // ==================== UTILITY FUNCTIONS ====================

  private convertTimestamps(data: any): any {
    const converted = { ...data };
    Object.keys(converted).forEach((key) => {
      if (converted[key]?.toMillis) {
        converted[key] = converted[key].toMillis();
      }
    });
    return converted;
  }
}

export default new FirestoreService();
