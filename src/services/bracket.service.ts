import {
  collection,
  query,
  where,
  getDocs,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  limit,
  onSnapshot,
  orderBy,
  writeBatch,
  Timestamp,
  Unsubscribe,
} from 'firebase/firestore';
import { db } from './firebase';
import {
  BracketMatch,
  BracketTeam,
  MatchEvent,
  MatchEventType,
  TournamentConfig,
  TournamentStats,
} from '../types/models';

export interface AddLiveEventInput {
  type: MatchEventType;
  minute: number;
  teamSide?: 1 | 2;
  playerName?: string;
  secondaryPlayerName?: string;
  penaltyOutcome?: 'scored' | 'missed';
  note?: string;
}

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

  static async getBracketMatch(matchId: string): Promise<BracketMatch | null> {
    try {
      const matchSnap = await getDoc(doc(db, 'bracket_matches', matchId));
      if (!matchSnap.exists()) {
        return null;
      }

      return {
        id: matchSnap.id,
        ...matchSnap.data(),
      } as BracketMatch;
    } catch (error) {
      console.error('Error fetching bracket match:', error);
      throw error;
    }
  }

  static onBracketMatchChange(
    matchId: string,
    callback: (match: BracketMatch | null) => void
  ): Unsubscribe {
    return onSnapshot(doc(db, 'bracket_matches', matchId), (snapshot) => {
      if (!snapshot.exists()) {
        callback(null);
        return;
      }

      callback({
        id: snapshot.id,
        ...snapshot.data(),
      } as BracketMatch);
    });
  }

  static async getMatchEvents(matchId: string, maxEvents = 200): Promise<MatchEvent[]> {
    try {
      const eventsQ = query(
        collection(db, 'bracket_matches', matchId, 'events'),
        orderBy('createdAt', 'desc'),
        limit(maxEvents)
      );

      const snapshot = await getDocs(eventsQ);
      return snapshot.docs.map((eventDoc) => ({
        id: eventDoc.id,
        ...eventDoc.data(),
      })) as MatchEvent[];
    } catch (error) {
      console.error('Error fetching match events:', error);
      throw error;
    }
  }

  static onMatchEventsChange(
    matchId: string,
    callback: (events: MatchEvent[]) => void,
    maxEvents = 200
  ): Unsubscribe {
    const eventsQ = query(
      collection(db, 'bracket_matches', matchId, 'events'),
      orderBy('createdAt', 'desc'),
      limit(maxEvents)
    );

    return onSnapshot(eventsQ, (snapshot) => {
      callback(
        snapshot.docs.map((eventDoc) => ({
          id: eventDoc.id,
          ...eventDoc.data(),
        })) as MatchEvent[]
      );
    });
  }

  static async startMatchLive(matchId: string, actorId?: string): Promise<void> {
    const match = await this.requireMatch(matchId);
    if (match.status === 'completed') {
      throw new Error('Completed match cannot be restarted');
    }

    if (match.status !== 'pending' && match.status !== 'scheduled') {
      throw new Error('Only pending or scheduled matches can be started');
    }

    const now = Timestamp.now().toMillis();
    const minute = match.currentMinute ?? 0;

    await this.appendMatchEvent(match, {
      type: 'match_started',
      minute,
      note: 'Match started',
      createdBy: actorId,
    });

    await updateDoc(doc(db, 'bracket_matches', matchId), {
      status: 'live',
      currentPhase: 'first_half',
      currentMinute: minute,
      actualStartTime: match.actualStartTime || now,
      liveScore: this.getLiveScore(match),
      lastEventAt: now,
      lastEventType: 'match_started',
      eventsCount: this.getEventsCount(match) + 1,
      updatedAt: now,
    });
  }

  static async setMatchOnBreak(
    matchId: string,
    minute: number,
    note?: string,
    actorId?: string
  ): Promise<void> {
    this.validateMinute(minute);
    const match = await this.requireMatch(matchId);

    if (match.status !== 'live') {
      throw new Error('Only live matches can be moved to break');
    }

    const now = Timestamp.now().toMillis();

    await this.appendMatchEvent(match, {
      type: 'break',
      minute,
      note: note || 'Match break',
      createdBy: actorId,
    });

    await updateDoc(doc(db, 'bracket_matches', matchId), {
      status: 'break',
      currentPhase: 'break',
      currentMinute: minute,
      lastEventAt: now,
      lastEventType: 'break',
      eventsCount: this.getEventsCount(match) + 1,
      updatedAt: now,
    });
  }

  static async resumeMatchLive(
    matchId: string,
    minute: number,
    note?: string,
    actorId?: string
  ): Promise<void> {
    this.validateMinute(minute);
    const match = await this.requireMatch(matchId);

    if (match.status !== 'break') {
      throw new Error('Only break matches can be resumed');
    }

    const now = Timestamp.now().toMillis();

    await this.appendMatchEvent(match, {
      type: 'resume',
      minute,
      note: note || 'Match resumed',
      createdBy: actorId,
    });

    await updateDoc(doc(db, 'bracket_matches', matchId), {
      status: 'live',
      currentPhase: 'second_half',
      currentMinute: minute,
      lastEventAt: now,
      lastEventType: 'resume',
      eventsCount: this.getEventsCount(match) + 1,
      updatedAt: now,
    });
  }

  static async stopMatchLive(
    matchId: string,
    minute: number,
    note?: string,
    actorId?: string
  ): Promise<void> {
    this.validateMinute(minute);
    const match = await this.requireMatch(matchId);

    if (match.status !== 'live' && match.status !== 'break') {
      throw new Error('Only live or break matches can be stopped');
    }

    const now = Timestamp.now().toMillis();

    await this.appendMatchEvent(match, {
      type: 'match_stopped',
      minute,
      note: note || 'Match stopped',
      createdBy: actorId,
    });

    await updateDoc(doc(db, 'bracket_matches', matchId), {
      status: 'stopped',
      currentPhase: 'stopped',
      currentMinute: minute,
      actualStopTime: now,
      lastEventAt: now,
      lastEventType: 'match_stopped',
      eventsCount: this.getEventsCount(match) + 1,
      updatedAt: now,
    });
  }

  static async addLiveEvent(
    matchId: string,
    payload: AddLiveEventInput,
    actorId?: string
  ): Promise<void> {
    this.validateMinute(payload.minute);
    const match = await this.requireMatch(matchId);

    if (match.status !== 'live') {
      throw new Error('Live events can only be added while match is live');
    }

    const allowedTypes: MatchEventType[] = [
      'goal',
      'penalty',
      'yellow_card',
      'red_card',
      'substitution',
      'score_adjusted',
    ];

    if (!allowedTypes.includes(payload.type)) {
      throw new Error('Unsupported event type for live event form');
    }

    if (
      (payload.type === 'goal' ||
        payload.type === 'penalty' ||
        payload.type === 'yellow_card' ||
        payload.type === 'red_card' ||
        payload.type === 'substitution') &&
      !payload.teamSide
    ) {
      throw new Error('Team is required for this event');
    }

    if (payload.type === 'penalty' && !payload.penaltyOutcome) {
      throw new Error('Penalty outcome is required for penalty events');
    }

    const liveScore = this.getLiveScore(match);

    if (payload.type === 'goal' && payload.teamSide) {
      if (payload.teamSide === 1) {
        liveScore.team1 += 1;
      } else {
        liveScore.team2 += 1;
      }
    }

    if (
      payload.type === 'penalty' &&
      payload.penaltyOutcome === 'scored' &&
      payload.teamSide
    ) {
      if (payload.teamSide === 1) {
        liveScore.team1 += 1;
      } else {
        liveScore.team2 += 1;
      }
    }

    const now = Timestamp.now().toMillis();

    await this.appendMatchEvent(match, {
      ...payload,
      createdBy: actorId,
    });

    await updateDoc(doc(db, 'bracket_matches', matchId), {
      liveScore,
      currentMinute: payload.minute,
      lastEventAt: now,
      lastEventType: payload.type,
      eventsCount: this.getEventsCount(match) + 1,
      updatedAt: now,
    });
  }

  static async updateLiveScore(
    matchId: string,
    team1Score: number,
    team2Score: number,
    minute: number,
    actorId?: string
  ): Promise<void> {
    this.validateMinute(minute);

    if (team1Score < 0 || team2Score < 0) {
      throw new Error('Scores cannot be negative');
    }

    const match = await this.requireMatch(matchId);
    if (match.status === 'completed') {
      throw new Error('Cannot change score after completion');
    }

    const now = Timestamp.now().toMillis();

    await this.appendMatchEvent(match, {
      type: 'score_adjusted',
      minute,
      note: `Score adjusted to ${team1Score}-${team2Score}`,
      createdBy: actorId,
    });

    await updateDoc(doc(db, 'bracket_matches', matchId), {
      liveScore: {
        team1: team1Score,
        team2: team2Score,
      },
      currentMinute: minute,
      lastEventAt: now,
      lastEventType: 'score_adjusted',
      eventsCount: this.getEventsCount(match) + 1,
      updatedAt: now,
    });
  }

  static async confirmFinalResult(matchId: string, tournamentId: string): Promise<void> {
    const match = await this.requireMatch(matchId);
    if (match.status !== 'stopped') {
      throw new Error('Stop the match before confirming final result');
    }

    const liveScore = this.getLiveScore(match);

    if (liveScore.team1 === liveScore.team2) {
      throw new Error('Match cannot end in a draw');
    }

    await this.updateMatchResult(matchId, liveScore.team1, liveScore.team2, tournamentId);

    const completedMatch = await this.requireMatch(matchId);
    await this.appendMatchEvent(completedMatch, {
      type: 'match_completed',
      minute: completedMatch.currentMinute || 0,
      note: `Final result confirmed: ${liveScore.team1}-${liveScore.team2}`,
    });

    const now = Timestamp.now().toMillis();
    await updateDoc(doc(db, 'bracket_matches', matchId), {
      currentPhase: 'completed',
      eventsCount: this.getEventsCount(completedMatch) + 1,
      lastEventAt: now,
      lastEventType: 'match_completed',
      updatedAt: now,
    });
  }

  /**
   * Update match result and advance winner
   */
  static async updateMatchResult(
    matchId: string,
    team1Score: number,
    team2Score: number,
    tournamentId: string
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

      // Update current match
      await updateDoc(matchRef, {
        result: {
          team1Score,
          team2Score,
          winnerByScore: true,
        },
        winnerId,
        winnerName,
        status: 'completed',
        currentPhase: 'completed',
        lastEventType: 'match_completed',
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

  private static async requireMatch(matchId: string): Promise<BracketMatch> {
    const match = await this.getBracketMatch(matchId);
    if (!match) {
      throw new Error('Match not found');
    }

    return match;
  }

  private static getLiveScore(match: BracketMatch): { team1: number; team2: number } {
    if (match.liveScore) {
      return {
        team1: match.liveScore.team1 || 0,
        team2: match.liveScore.team2 || 0,
      };
    }

    if (match.result) {
      return {
        team1: match.result.team1Score || 0,
        team2: match.result.team2Score || 0,
      };
    }

    return { team1: 0, team2: 0 };
  }

  private static getEventsCount(match: BracketMatch): number {
    return typeof match.eventsCount === 'number' ? match.eventsCount : 0;
  }

  private static validateMinute(minute: number): void {
    if (!Number.isFinite(minute) || minute < 0 || minute > 300) {
      throw new Error('Minute must be between 0 and 300');
    }
  }

  private static async appendMatchEvent(
    match: BracketMatch,
    payload: Omit<MatchEvent, 'id' | 'tournamentId' | 'matchId' | 'createdAt'>
  ): Promise<void> {
    const eventData: Record<string, unknown> = {
      tournamentId: match.tournamentId,
      matchId: match.id,
      type: payload.type,
      minute: payload.minute,
      createdAt: Timestamp.now().toMillis(),
    };

    if (payload.teamSide !== undefined) {
      eventData.teamSide = payload.teamSide;
    }

    if (payload.playerName) {
      eventData.playerName = payload.playerName;
    }

    if (payload.secondaryPlayerName) {
      eventData.secondaryPlayerName = payload.secondaryPlayerName;
    }

    if (payload.penaltyOutcome) {
      eventData.penaltyOutcome = payload.penaltyOutcome;
    }

    if (payload.note) {
      eventData.note = payload.note;
    }

    if (payload.createdBy) {
      eventData.createdBy = payload.createdBy;
    }

    await addDoc(collection(db, 'bracket_matches', match.id, 'events'), eventData);
  }
}
