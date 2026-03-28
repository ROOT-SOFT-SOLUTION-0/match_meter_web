import { create } from 'zustand';
import { User } from '../types/models';
import authService from '../services/auth.service';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  signUp: (email: string, password: string, userData: Partial<User>) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (userData: Partial<User>) => Promise<void>;
  loadUserProfile: (userId: string) => Promise<void>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  error: null,

  setUser: (user) => set({ user }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  clearError: () => set({ error: null }),

  signUp: async (email, password, userData) => {
    set({ loading: true, error: null });
    try {
      await authService.signUp(email, password, userData.displayName || 'User');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign up failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signIn: async (email, password) => {
    set({ loading: true, error: null });
    try {
      await authService.signIn(email, password);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign in failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signInWithGoogle: async () => {
    set({ loading: true, error: null });
    try {
      await authService.signInWithGoogle();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Google sign in failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  signOut: async () => {
    set({ loading: true, error: null });
    try {
      await authService.signOut();
      set({ user: null });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Sign out failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  resetPassword: async (email) => {
    set({ loading: true, error: null });
    try {
      await authService.resetPassword(email);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  updateProfile: async (userData) => {
    set({ loading: true, error: null });
    try {
      const state = useAuthStore.getState();
      if (state.user?.uid) {
        await authService.updateUserProfile(state.user.uid, userData);
        set((prevState) => ({
          user: prevState.user ? { ...prevState.user, ...userData } : null,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },

  loadUserProfile: async (userId) => {
    set({ loading: true, error: null });
    try {
      const userProfile = await authService.getUserProfile(userId);
      set({ user: userProfile });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load profile';
      set({ error: errorMessage });
      throw error;
    } finally {
      set({ loading: false });
    }
  },
}));
