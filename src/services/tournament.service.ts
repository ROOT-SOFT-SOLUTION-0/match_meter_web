import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  deleteDoc,
  Timestamp,
  orderBy,
  limit,
  startAfter,
  QueryConstraint,
} from 'firebase/firestore';
import { db } from './firebase';
import { Tournament, RegistrationDeadline } from '../types/models';

export class TournamentService {
  /**
   * Create a new tournament (Admin only)
   */
  static async createTournament(
    data: {
      name: string;
      description: string;
      sport: string;
      location: string;
      maxTeams: number;
      entryFee: number;
      currency: string;
      startDate: number;
      endDate: number;
      image?: string;
      rules?: string;
      schedule?: string;
      registrationDeadline: number;
      bracketFormat: 'single_elimination' | 'double_elimination';
    },
    userId: string
  ): Promise<string> {
    try {
      const tournamentRef = await addDoc(collection(db, 'tournaments'), {
        ...data,
        createdBy: userId,
        totalTeams: 0,
        status: 'draft',
        createdAt: Timestamp.now().toMillis(),
        updatedAt: Timestamp.now().toMillis(),
      });

      // Create registration deadline document
      const { registrationDeadline, bracketFormat } = data;
      await addDoc(collection(db, 'registration_deadlines'), {
        tournamentId: tournamentRef.id,
        deadlineDate: registrationDeadline,
        autoGenerateBracket: true,
        bracketFormat,
        notified: false,
        createdAt: Timestamp.now().toMillis(),
      } as RegistrationDeadline);

      return tournamentRef.id;
    } catch (error) {
      console.error('Error creating tournament:', error);
      throw error;
    }
  }

  /**
   * Update tournament details (Admin only)
   */
  static async updateTournament(
    tournamentId: string,
    updates: Partial<Tournament>,
    userId: string
  ): Promise<void> {
    try {
      const tourRef = doc(db, 'tournaments', tournamentId);
      const tourSnap = await getDoc(tourRef);

      if (!tourSnap.exists()) {
        throw new Error('Tournament not found');
      }

      const tournament = tourSnap.data() as Tournament;

      // Verify user is the creator (admin)
      if (tournament.createdBy !== userId) {
        throw new Error('Unauthorized: Only tournament creator can update');
      }

      // Prevent updates to draft tournaments
      if (tournament.status !== 'draft') {
        throw new Error('Cannot update non-draft tournaments');
      }

      await updateDoc(tourRef, {
        ...updates,
        updatedAt: Timestamp.now().toMillis(),
      });
    } catch (error) {
      console.error('Error updating tournament:', error);
      throw error;
    }
  }

  /**
   * Get tournament by ID
   */
  static async getTournament(tournamentId: string): Promise<Tournament | null> {
    try {
      const tourSnap = await getDoc(doc(db, 'tournaments', tournamentId));

      if (!tourSnap.exists()) {
        return null;
      }

      return {
        id: tourSnap.id,
        ...tourSnap.data(),
      } as Tournament;
    } catch (error) {
      console.error('Error fetching tournament:', error);
      throw error;
    }
  }

  /**
   * Get all tournaments with pagination and filters
   */
  static async getTournaments(
    filters?: {
      sport?: string;
      status?: 'draft' | 'active' | 'completed';
      location?: string;
    },
    pageSize: number = 10,
    lastVisible?: any
  ): Promise<{ tournaments: Tournament[]; lastVisible: any }> {
    try {
      const constraints: QueryConstraint[] = [];

      if (filters?.status) {
        constraints.push(where('status', '==', filters.status));
      }

      if (filters?.sport) {
        constraints.push(where('sport', '==', filters.sport));
      }

      if (filters?.location) {
        constraints.push(where('location', '==', filters.location));
      }

      constraints.push(orderBy('createdAt', 'desc'));
      constraints.push(limit(pageSize + 1));

      if (lastVisible) {
        constraints.push(startAfter(lastVisible));
      }

      const q = query(collection(db, 'tournaments'), ...constraints);
      const snapshot = await getDocs(q);

      const tournaments = snapshot.docs
        .slice(0, pageSize)
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        } as Tournament));

      const newLastVisible =
        snapshot.docs.length > pageSize ? snapshot.docs[pageSize - 1] : null;

      return {
        tournaments,
        lastVisible: newLastVisible,
      };
    } catch (error) {
      console.error('Error fetching tournaments:', error);
      throw error;
    }
  }

  /**
   * Update tournament status
   */
  static async updateTournamentStatus(
    tournamentId: string,
    status: 'draft' | 'active' | 'completed' | 'cancelled'
  ): Promise<void> {
    try {
      const tourRef = doc(db, 'tournaments', tournamentId);
      await updateDoc(tourRef, {
        status,
        updatedAt: Timestamp.now().toMillis(),
      });
    } catch (error) {
      console.error('Error updating tournament status:', error);
      throw error;
    }
  }

  /**
   * Update registration count
   */
  static async incrementTeamCount(tournamentId: string): Promise<void> {
    try {
      const tourRef = doc(db, 'tournaments', tournamentId);
      const tourSnap = await getDoc(tourRef);

      if (!tourSnap.exists()) {
        throw new Error('Tournament not found');
      }

      const tournament = tourSnap.data() as Tournament;
      await updateDoc(tourRef, {
        totalTeams: tournament.totalTeams + 1,
        updatedAt: Timestamp.now().toMillis(),
      });
    } catch (error) {
      console.error('Error incrementing team count:', error);
      throw error;
    }
  }

  /**
   * Get registration deadline for tournament
   */
  static async getRegistrationDeadline(
    tournamentId: string
  ): Promise<RegistrationDeadline | null> {
    try {
      const q = query(
        collection(db, 'registration_deadlines'),
        where('tournamentId', '==', tournamentId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return {
          ...snapshot.docs[0].data(),
        } as RegistrationDeadline;
      }

      return null;
    } catch (error) {
      console.error('Error fetching registration deadline:', error);
      throw error;
    }
  }

  /**
   * Update registration deadline
   */
  static async updateRegistrationDeadline(
    tournamentId: string,
    deadlineDate: number
  ): Promise<void> {
    try {
      const q = query(
        collection(db, 'registration_deadlines'),
        where('tournamentId', '==', tournamentId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        await updateDoc(snapshot.docs[0].ref, {
          deadlineDate,
          updatedAt: Timestamp.now().toMillis(),
        });
      }
    } catch (error) {
      console.error('Error updating registration deadline:', error);
      throw error;
    }
  }

  /**
   * Check if registration deadline has passed and auto-generate bracket
   */
  static async checkAndGenerateBrackets(): Promise<
    Array<{ tournamentId: string; bracketConfigId: string }>
  > {
    try {
      const now = Date.now();
      const q = query(
        collection(db, 'registration_deadlines'),
        where('notified', '==', false),
        where('autoGenerateBracket', '==', true)
      );

      const snapshot = await getDocs(q);
      const generatedBrackets = [];

      for (const deadlineDoc of snapshot.docs) {
        const deadline = deadlineDoc.data() as RegistrationDeadline;

        if (deadline.deadlineDate <= now) {
          // Import here to avoid circular dependency
          const { BracketService } = await import('./bracket.service');

          try {
            const result = await BracketService.generateBracket(
              deadline.tournamentId,
              (deadline as any).bracketFormat || 'single_elimination'
            );

            // Mark deadline as notified
            await updateDoc(deadlineDoc.ref, {
              notified: true,
            });

            // Update tournament status to active
            await this.updateTournamentStatus(
              deadline.tournamentId,
              'active'
            );

            generatedBrackets.push({
              tournamentId: deadline.tournamentId,
              bracketConfigId: result.bracketConfigId,
            });
          } catch (error) {
            console.error(
              `Error generating bracket for tournament ${deadline.tournamentId}:`,
              error
            );
          }
        }
      }

      return generatedBrackets;
    } catch (error) {
      console.error('Error checking registration deadlines:', error);
      throw error;
    }
  }

  /**
   * Delete tournament (draft only)
   */
  static async deleteTournament(tournamentId: string): Promise<void> {
    try {
      const tourRef = doc(db, 'tournaments', tournamentId);
      const tourSnap = await getDoc(tourRef);

      if (!tourSnap.exists()) {
        throw new Error('Tournament not found');
      }

      const tournament = tourSnap.data() as Tournament;

      if (tournament.status !== 'draft') {
        throw new Error('Can only delete draft tournaments');
      }

      // Delete tournament
      await deleteDoc(tourRef);

      // Delete associated registration deadline
      const q = query(
        collection(db, 'registration_deadlines'),
        where('tournamentId', '==', tournamentId)
      );

      const snapshot = await getDocs(q);
      for (const doc of snapshot.docs) {
        await deleteDoc(doc.ref);
      }
    } catch (error) {
      console.error('Error deleting tournament:', error);
      throw error;
    }
  }

  /**
   * Get tournaments created by admin
   */
  static async getAdminTournaments(userId: string): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, 'tournaments'),
        where('createdBy', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Tournament));
    } catch (error) {
      console.error('Error fetching admin tournaments:', error);
      throw error;
    }
  }

  /**
   * Get active tournaments
   */
  static async getActiveTournaments(): Promise<Tournament[]> {
    try {
      const q = query(
        collection(db, 'tournaments'),
        where('status', '==', 'active'),
        orderBy('startDate', 'asc')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as Tournament));
    } catch (error) {
      console.error('Error fetching active tournaments:', error);
      throw error;
    }
  }
}
