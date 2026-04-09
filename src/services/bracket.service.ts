import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  writeBatch,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BracketMatch,
  BracketTeam,
  TournamentConfig,
  TournamentStats,
} from '../types/models';

export class BracketService {
  /**
   * Generate tournament bracket on registration deadline
   */
  static async generateBracket(
    tournamentId: string,
    format: 'single_elimination' | 'double_elimination'
  ): Promise<{ matchesCreated: number; bracketConfigId: string }> {
    try {
      // Get all registered teams
      const teams = await this.getRegisteredTeams(tournamentId);

      if (teams.length < 2) {
        throw new Error('Minimum 2 teams required to generate bracket');
      }

      // Calculate total rounds needed
      const totalRounds = Math.ceil(Math.log2(teams.length));

      // Create bracket config
      const configRef = await addDoc(
        collection(db, 'tournament_configs'),
        {
          tournamentId,
          format,
          bracketGeneratedAt: Timestamp.now(),
          status: 'active',
          totalRounds,
          currentRound: 1,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
        }
      );

      // Generate matches based on format
      let matchesCreated = 0;
      if (format === 'single_elimination') {
        matchesCreated = await this.generateSingleElimination(
          tournamentId,
          teams,
          totalRounds
        );
      } else {
        matchesCreated = await this.generateDoubleElimination(
          tournamentId,
          teams,
          totalRounds
        );
      }

      // Create tournament stats document
      await addDoc(collection(db, 'tournament_stats'), {
        tournamentId,
        totalMatches: matchesCreated,
        completedMatches: 0,
        totalTeams: teams.length,
        remainingTeams: teams.length,
      } as TournamentStats);

      return {
        matchesCreated,
        bracketConfigId: configRef.id,
      };
    } catch (error) {
      console.error('Error generating bracket:', error);
      throw error;
    }
  }

  /**
   * Generate single elimination bracket
   */
  private static async generateSingleElimination(
    tournamentId: string,
    teams: BracketTeam[],
    totalRounds: number
  ): Promise<number> {
    const batch = writeBatch(db);
    let matchCount = 0;
    const matchesByRound: { [key: number]: BracketMatch[] } = {};
    const matchIds: string[] = [];

    // Seed teams
    const seededTeams = this.seedTeams(teams);

    // Generate first round matches
    for (let i = 0; i < seededTeams.length; i += 2) {
      const team1 = seededTeams[i];
      const team2 = seededTeams[i + 1];

      const matchId = `${tournamentId}_r1_m${matchCount + 1}`;

      // Build match object without undefined fields (Firestore rejects undefined)
      const match: any = {
        id: matchId,
        tournamentId,
        round: 1,
        position: matchCount + 1,
        team1Id: team1.id,
        team1Name: team1.teamName,
        status: team2 ? 'pending' : 'bye',
        matchNumber: matchCount + 1,
        bracketType: 'winners',
        createdAt: Timestamp.now().toMillis(),
        updatedAt: Timestamp.now().toMillis(),
      };

      if (team1.teamLogo) {
        match.team1Logo = team1.teamLogo;
      }

      if (team2) {
        match.team2Id = team2.id;
        match.team2Name = team2.teamName;
        if (team2.teamLogo) {
          match.team2Logo = team2.teamLogo;
        }
      }

      matchesByRound[1] = matchesByRound[1] || [];
      matchesByRound[1].push(match as BracketMatch);
      matchIds.push(matchId);
      batch.set(doc(db, 'bracket_matches', matchId), match);
      matchCount++;
    }

    // Generate subsequent rounds (with placeholder matches)
    for (let round = 2; round <= totalRounds; round++) {
      const prevRoundMatches = matchesByRound[round - 1].length;
      const matchesInRound = Math.ceil(prevRoundMatches / 2);

      for (let i = 0; i < matchesInRound; i++) {
        const matchId = `${tournamentId}_r${round}_m${i + 1}`;
        const match: BracketMatch = {
          id: matchId,
          tournamentId,
          round,
          position: i + 1,
          status: 'pending',
          matchNumber: matchCount + 1,
          bracketType: 'winners',
          createdAt: Timestamp.now().toMillis(),
          updatedAt: Timestamp.now().toMillis(),
        };

        matchesByRound[round] = matchesByRound[round] || [];
        matchesByRound[round].push(match);
        matchIds.push(matchId);
        batch.set(doc(db, 'bracket_matches', matchId), match);
        matchCount++;
      }
    }

    // Update first round matches with next round references
    matchesByRound[1].forEach((match, index) => {
      const nextRound = matchesByRound[2];
      if (nextRound && nextRound[Math.floor(index / 2)]) {
        match.nextMatchId = nextRound[Math.floor(index / 2)].id;
        match.nextRound = 2;
        match.nextPosition = Math.floor(index / 2) + 1;
        batch.update(doc(db, 'bracket_matches', match.id), {
          nextMatchId: match.nextMatchId,
          nextRound: match.nextRound,
          nextPosition: match.nextPosition,
        });
      }
    });

    // Link subsequent rounds
    for (let round = 2; round < totalRounds; round++) {
      const currentMatches = matchesByRound[round];
      const nextMatches = matchesByRound[round + 1];

      currentMatches.forEach((match, index) => {
        if (nextMatches && nextMatches[Math.floor(index / 2)]) {
          const nextMatch = nextMatches[Math.floor(index / 2)];
          batch.update(doc(db, 'bracket_matches', match.id), {
            nextMatchId: nextMatch.id,
            nextRound: round + 1,
            nextPosition: Math.floor(index / 2) + 1,
          });
        }
      });
    }

    await batch.commit();
    return matchCount;
  }

  /**
   * Generate double elimination bracket
   */
  private static async generateDoubleElimination(
    tournamentId: string,
    teams: BracketTeam[],
    totalRounds: number
  ): Promise<number> {
    // For now, start with single elimination winners bracket
    // Losers bracket will be created dynamically as matches are lost
    return this.generateSingleElimination(tournamentId, teams, totalRounds);
  }

  /**
   * Seed teams (shuffle using registration order)
   */
  private static seedTeams(teams: BracketTeam[]): BracketTeam[] {
    // Fisher-Yates shuffle for better bracket distribution
    const seeded = [...teams];
    for (let i = seeded.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [seeded[i], seeded[j]] = [seeded[j], seeded[i]];
    }
    return seeded;
  }

  /**
   * Get all registered teams for a tournament
   */
  static async getRegisteredTeams(tournamentId: string): Promise<BracketTeam[]> {
    try {
      const q = query(
        collection(db, 'bracket_teams'),
        where('tournamentId', '==', tournamentId),
        where('status', '==', 'active')
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      } as BracketTeam));
    } catch (error) {
      console.error('Error fetching registered teams:', error);
      throw error;
    }
  }

  /**
   * Get bracket for a tournament
   */
  static async getBracket(tournamentId: string): Promise<BracketMatch[]> {
    try {
      const q = query(
        collection(db, 'bracket_matches'),
        where('tournamentId', '==', tournamentId)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs
        .map((doc) => ({ id: doc.id, ...doc.data() } as BracketMatch))
        .sort((a, b) => (a.round - b.round) || (a.position - b.position));
    } catch (error) {
      console.error('Error fetching bracket:', error);
      throw error;
    }
  }

  /**
   * Update match result and advance winner
   */
  static async updateMatchResult(
    matchId: string,
    team1Score: number,
    team2Score: number,
    tournamentId: string,
    options?: {
      team1Scorers?: Array<{ playerId?: string; playerName: string; goals: number }>;
      team2Scorers?: Array<{ playerId?: string; playerName: string; goals: number }>;
    }
  ): Promise<void> {
    try {
      const matchRef = doc(db, 'bracket_matches', matchId);
      const matchSnap = await getDoc(matchRef);

      if (!matchSnap.exists()) {
        throw new Error('Match not found');
      }

      const match = matchSnap.data() as BracketMatch;
      const winnerId =
        team1Score > team2Score ? match.team1Id : match.team2Id;
      const winnerName =
        team1Score > team2Score ? match.team1Name : match.team2Name;

      if (!winnerId) {
        throw new Error('Invalid match participants');
      }

      // Build result payload including optional scorer breakdowns
      const resultPayload: any = {
        team1Score,
        team2Score,
        winnerByScore: true,
      };

      if (options?.team1Scorers && options.team1Scorers.length > 0) {
        resultPayload.team1Scorers = options.team1Scorers;
      }

      if (options?.team2Scorers && options.team2Scorers.length > 0) {
        resultPayload.team2Scorers = options.team2Scorers;
      }

      // Update current match
      await updateDoc(matchRef, {
        result: resultPayload,
        winnerId,
        winnerName,
        status: 'completed',
        updatedAt: Timestamp.now().toMillis(),
      });

      // Advance winner to next match
      if (match.nextMatchId && match.team1Id && match.team2Id) {
        await this.advanceWinner(
          match.nextMatchId,
          winnerId!,
          winnerName!,
          match.team1Id === winnerId ? 1 : 2
        );
      } else {
        // This is the final match - set tournament winner
        await this.setTournamentWinner(tournamentId, winnerId!, winnerName!);
      }

      // Handle loser if double elimination
      const config = await this.getTournamentConfig(tournamentId);
      if (config?.format === 'double_elimination') {
        const loserId =
          team1Score < team2Score ? match.team1Id : match.team2Id;
        if (loserId) {
          await this.advanceToLosersBracket(tournamentId, loserId);
        }
      }

      // Update stats
      await this.updateTournamentStats(tournamentId);
    } catch (error) {
      console.error('Error updating match result:', error);
      throw error;
    }
  }

  /**
   * Advance winner to next match
   */
  private static async advanceWinner(
    nextMatchId: string,
    teamId: string,
    teamName: string,
    position: 1 | 2
  ): Promise<void> {
    const matchRef = doc(db, 'bracket_matches', nextMatchId);
    const updates = {
      [`team${position}Id`]: teamId,
      [`team${position}Name`]: teamName,
      updatedAt: Timestamp.now().toMillis(),
    };

    await updateDoc(matchRef, updates);
  }

  /**
   * Set tournament winner
   */
  private static async setTournamentWinner(
    tournamentId: string,
    winnerId: string,
    winnerName: string
  ): Promise<void> {
    const q = query(
      collection(db, 'tournament_stats'),
      where('tournamentId', '==', tournamentId)
    );

    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const statsDoc = snapshot.docs[0];
      await updateDoc(statsDoc.ref, {
        winnerId,
        winnerName,
        completedAt: Timestamp.now().toMillis(),
      });
    }
  }

  /**
   * Advance loser to loser's bracket (double elimination)
   */
  private static async advanceToLosersBracket(
    tournamentId: string,
    loserId: string
  ): Promise<void> {
    // Implementation for losers bracket advancement
    // This will create new matches in the losers bracket
    console.log(`Advancing ${loserId} to losers bracket for tournament ${tournamentId}`);
  }

  /**
   * Get tournament config
   */
  static async getTournamentConfig(
    tournamentId: string
  ): Promise<TournamentConfig | null> {
    try {
      const q = query(
        collection(db, 'tournament_configs'),
        where('tournamentId', '==', tournamentId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        } as TournamentConfig;
      }
      return null;
    } catch (error) {
      console.error('Error fetching tournament config:', error);
      throw error;
    }
  }

  /**
   * Update tournament stats
   */
  private static async updateTournamentStats(tournamentId: string): Promise<void> {
    try {
      const q = query(
        collection(db, 'tournament_stats'),
        where('tournamentId', '==', tournamentId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        const statsDoc = snapshot.docs[0];

        const bracket = await this.getBracket(tournamentId);
        const completedMatches = bracket.filter(
          (m) => m.status === 'completed'
        ).length;
        const remainingTeams = bracket
          .filter((m) => m.status === 'pending' || m.status === 'bye')
          .reduce((acc, match) => {
            if (match.team1Id) acc.add(match.team1Id);
            if (match.team2Id) acc.add(match.team2Id);
            return acc;
          }, new Set()).size;

        await updateDoc(statsDoc.ref, {
          completedMatches,
          remainingTeams,
        });
      }
    } catch (error) {
      console.error('Error updating tournament stats:', error);
    }
  }

  /**
   * Get tournament statistics
   */
  static async getTournamentStats(tournamentId: string): Promise<TournamentStats | null> {
    try {
      const q = query(
        collection(db, 'tournament_stats'),
        where('tournamentId', '==', tournamentId)
      );

      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        return {
          id: snapshot.docs[0].id,
          ...snapshot.docs[0].data(),
        } as TournamentStats;
      }
      return null;
    } catch (error) {
      console.error('Error fetching tournament stats:', error);
      throw error;
    }
  }

  /**
   * Register team for bracket
   */
  static async registerTeamForBracket(
    tournamentId: string,
    registrationId: string,
    teamName: string,
    captainId: string,
    captainName: string,
    members: string[],
    teamLogo?: string
  ): Promise<string> {
    try {
      const data: BracketTeam = {
        tournamentId,
        registrationId,
        teamName,
        captainId,
        captainName,
        members,
        totalMembers: members.length,
        status: 'active',
        losses: 0,
        createdAt: Timestamp.now().toMillis(),
        updatedAt: Timestamp.now().toMillis(),
      } as BracketTeam;

      // Firestore does not allow undefined values; only add teamLogo when present
      if (teamLogo) {
        (data as any).teamLogo = teamLogo;
      }

      const docRef = await addDoc(collection(db, 'bracket_teams'), data);

      return docRef.id;
    } catch (error) {
      console.error('Error registering team for bracket:', error);
      throw error;
    }
  }

  /**
   * Delete bracket (for testing or recreation)
   */
  static async deleteBracket(tournamentId: string): Promise<void> {
    try {
      const batch = writeBatch(db);

      // Delete all bracket matches
      const matchesQ = query(
        collection(db, 'bracket_matches'),
        where('tournamentId', '==', tournamentId)
      );
      const matchesSnap = await getDocs(matchesQ);
      matchesSnap.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete bracket teams
      const teamsQ = query(
        collection(db, 'bracket_teams'),
        where('tournamentId', '==', tournamentId)
      );
      const teamsSnap = await getDocs(teamsQ);
      teamsSnap.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete tournament config
      const configQ = query(
        collection(db, 'tournament_configs'),
        where('tournamentId', '==', tournamentId)
      );
      const configSnap = await getDocs(configQ);
      configSnap.docs.forEach((doc) => batch.delete(doc.ref));

      // Delete tournament stats
      const statsQ = query(
        collection(db, 'tournament_stats'),
        where('tournamentId', '==', tournamentId)
      );
      const statsSnap = await getDocs(statsQ);
      statsSnap.docs.forEach((doc) => batch.delete(doc.ref));

      await batch.commit();
    } catch (error) {
      console.error('Error deleting bracket:', error);
      throw error;
    }
  }
}
