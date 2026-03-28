// User & Auth Types
export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  city?: string;
  role: 'user' | 'admin' | 'super_admin';
  createdAt: number;
  is_premium?: boolean;
  // Profile Details
  age?: number;
  place?: string;
  location?: string;
  aadharNumber?: string;
  dateOfBirth?: string; // ISO date format: YYYY-MM-DD
  sportsInterests?: string[]; // max 3 sports
  profileImage?: string; // base32 encoded image stored in Firebase
}

// Tournament Types
export interface Tournament {
  id: string;
  name: string;
  description: string;
  sport: string;
  status: 'draft' | 'active' | 'completed' | 'cancelled';
  startDate: number;
  endDate: number;
  location: string;
  totalTeams: number;
  maxTeams: number;
  entryFee: number;
  currency: string;
  image?: string;
  // Optional highlight / promo video for feed (YouTube Shorts, Drive, etc.)
  highlightVideoUrl?: string;
  createdBy: string;
  createdAt: number;
  updatedAt: number;
  rules?: string;
  schedule?: string;
  prizePool?: number;
  registrationFormConfig?: string;
}

// Match Types
export interface Match {
  id: string;
  tournamentId: string;
  team1Id: string;
  team2Id: string;
  team1Name?: string;
  team2Name?: string;
  startTime: number;
  endTime?: number;
  venue: string;
  status: 'scheduled' | 'live' | 'completed' | 'cancelled';
  team1Score?: number;
  team2Score?: number;
  team1Logo?: string;
  team2Logo?: string;
  createdAt: number;
  updatedAt: number;
}

// Team Registration Types
export interface TeamRegistration {
  id: string;
  tournamentId: string;
  teamName: string;
  teamLogo?: string;
  captain: string;
  captainPhone: string;
  captainEmail: string;
  players: string[];
  playersInfo?: Array<{
    userId?: string;
    name: string;
    phone?: string;
  }>;
  totalMembers: number;
  status: 'pending' | 'approved' | 'rejected';
  registeredAt: number;
  paymentStatus: 'pending' | 'completed' | 'failed';
  paymentId?: string;
  notes?: string;
}

// Payment Types
export interface Payment {
  id: string;
  userId: string;
  tournamentId: string;
  teamRegistrationId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentMethod: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  createdAt: number;
  updatedAt: number;
}

// Offline Sync Queue
export interface SyncQueueItem {
  id?: string | number;
  action: 'register_team' | 'update_match' | 'submit_result' | 'update_profile';
  data: any;
  timestamp: number;
  status?: 'pending' | 'synced' | 'failed';
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Filter Types
export interface TournamentFilter {
  sport?: string;
  status?: 'draft' | 'active' | 'completed';
  location?: string;
  sortBy?: 'startDate' | 'entryFee' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface MatchFilter {
  status?: 'scheduled' | 'live' | 'completed';
  tournamentId?: string;
  sortBy?: 'startTime' | 'createdAt';
}

// Tournament Bracket Types
export interface TournamentConfig {
  id: string;
  tournamentId: string;
  format: 'single_elimination' | 'double_elimination';
  bracketGeneratedAt?: number;
  status: 'pending' | 'active' | 'completed';
  totalRounds: number;
  currentRound: number;
  createdAt: number;
  updatedAt: number;
}

export interface BracketMatch {
  id: string;
  tournamentId: string;
  round: number;
  position: number;
  team1Id?: string;
  team2Id?: string;
  team1Name?: string;
  team2Name?: string;
  team1Logo?: string;
  team2Logo?: string;
  winnerId?: string;
  winnerName?: string;
  result?: {
    team1Score: number;
    team2Score: number;
    winnerByScore: boolean;
  };
  status: 'pending' | 'scheduled' | 'live' | 'completed' | 'bye';
  matchNumber: number;
  bracketType: 'winners' | 'losers';
  nextMatchId?: string;
  nextRound?: number;
  nextPosition?: number;
  createdAt: number;
  updatedAt: number;
}

export interface BracketTeam {
  id: string;
  tournamentId: string;
  registrationId: string;
  teamName: string;
  teamLogo?: string;
  captainId: string;
  captainName: string;
  members: string[];
  totalMembers: number;
  seed?: number;
  status: 'active' | 'eliminated';
  losses: number;
  createdAt: number;
  updatedAt: number;
}

export interface TournamentStats {
  id: string;
  tournamentId: string;
  totalMatches: number;
  completedMatches: number;
  totalTeams: number;
  remainingTeams: number;
  winnerId?: string;
  winnerName?: string;
  completedAt?: number;
}

export interface RegistrationDeadline {
  tournamentId: string;
  deadlineDate: number;
  autoGenerateBracket: boolean;
  notified: boolean;
}
