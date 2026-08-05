export interface ProfilePreferences {
  ageRangeMin: number;
  ageRangeMax: number;
  maxDistance: number;
}

export interface Profile {
  name: string;
  age: number;
  city: string;
  bio: string;
  photos: string[];
  interests: string[];
  preferences: ProfilePreferences;
}
