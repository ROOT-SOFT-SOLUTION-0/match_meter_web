import { create } from 'zustand';
import { Tournament, Match } from '../types/models';
import firestoreService from '../services/firestore.service';

interface TournamentState {
  tournaments: Tournament[];
  selectedTournament: Tournament | null;
  matches: Match[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  pageSize: number;
  total: number;
  filters: {
    status?: string;
    createdBy?: string;
    searchQuery?: string;
  };

  // Actions
  setTournaments: (tournaments: Tournament[]) => void;
  setSelectedTournament: (tournament: Tournament | null) => void;
  setMatches: (matches: Match[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setCurrentPage: (page: number) => void;
  setFilters: (filters: TournamentState['filters']) => void;
  clearError: () => void;

  // Async actions
  loadTournaments: (page?: number, pageSize?: number) => Promise<void>;
  loadTournamentById: (id: string) => Promise<void>;
  createTournament: (tournament: Omit<Tournament, 'id' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  updateTournament: (id: string, updates: Partial<Tournament>) => Promise<void>;
  deleteTournament: (id: string) => Promise<void>;
  loadMatches: (tournamentId: string) => Promise<void>;
  addTournament: (tournament: Tournament) => void;
  removeTournament: (id: string) => void;
  updateTournamentInList: (id: string, updates: Partial<Tournament>) => void;
}

export const useTournamentStore = create<TournamentState>((set) => ({
  tournaments: [],
  selectedTournament: null,
  matches: [],
  loading: false,
  error: null,
  currentPage: 1,
  pageSize: 10,
  total: 0,
  filters: {},

  setTournaments: (tournaments) => set({ tournaments }),
  setSelectedTournament: (tournament) => set({ selectedTournament: tournament }),
  setMatches: (matches) => set({ matches }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  setFilters: (filters) => set({ filters }),
  clearError: () => set({ error: null }),

  loadTournaments: async (page = 1, pageSize = 10) => {
    set({ loading: true, error: null });
    try {
      const allTournaments = await firestoreService.getTournaments();
      const start = (page - 1) * pageSize;
      const paginated = allTournaments.slice(start, start + pageSize);
      set({
        tournaments: paginated,
        total: allTournaments.length,
        currentPage: page,
        pageSize,
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tournaments';
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  loadTournamentById: async (id) => {
    set({ loading: true, error: null });
    try {
      const tournament = await firestoreService.getTournamentById(id);
      set({ selectedTournament: tournament });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load tournament';
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  createTournament: async (tournament) => {
    set({ loading: true, error: null });
    try {
      await firestoreService.createTournament(tournament);
      const refreshed = await firestoreService.getTournaments();
      set({ tournaments: refreshed, total: refreshed.length });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to create tournament';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateTournament: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      await firestoreService.updateTournament(id, updates);
      set((state) => ({
        tournaments: state.tournaments.map((t) => (t.id === id ? { ...t, ...updates } : t)),
        selectedTournament: state.selectedTournament?.id === id ? { ...state.selectedTournament, ...updates } : state.selectedTournament,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to update tournament';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  deleteTournament: async (id) => {
    set({ loading: true, error: null });
    try {
      await firestoreService.deleteTournament(id);
      set((state) => ({
        tournaments: state.tournaments.filter((t) => t.id !== id),
        selectedTournament: state.selectedTournament?.id === id ? null : state.selectedTournament,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete tournament';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadMatches: async (tournamentId) => {
    set({ loading: true, error: null });
    try {
      const result = await firestoreService.getMatches(tournamentId);
      set({ matches: result });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load matches';
      set({ error: errorMessage });
    } finally {
      set({ loading: false });
    }
  },

  addTournament: (tournament) => {
    set((state) => ({
      tournaments: [tournament, ...state.tournaments],
    }));
  },

  removeTournament: (id) => {
    set((state) => ({
      tournaments: state.tournaments.filter((t) => t.id !== id),
    }));
  },

  updateTournamentInList: (id, updates) => {
    set((state) => ({
      tournaments: state.tournaments.map((t) => (t.id === id ? { ...t, ...updates } : t)),
    }));
  },
}));
