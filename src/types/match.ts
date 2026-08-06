export interface CandidateProfile {
  id: string;
  name: string;
  age: number;
  city: string;
  distanceKm?: number;
  bio?: string;
  photos: string[];
  interests: string[];
  compatibility: number;
}

export interface MatchParticipant {
  id: string;
  name: string;
  age: number;
  city: string;
  bio?: string;
  photos: string[];
  interests: string[];
}

export interface MatchSummary {
  matchId: string;
  matchedAt: Date;
  profile: MatchParticipant;
}
