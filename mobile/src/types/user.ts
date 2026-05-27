export interface UserProfile {
  id: string;
  short_code: string | null;
  is_anonymous: boolean;
  gender: string | null;
  height: number | null;
  weight: number | null;
  goal: string | null;
  available_days: number | null;
  available_minutes: number | null;
  environment: string | null;
  experience: string | null;
  diet_restrictions: string[];
  equipment: string[];
  created_at: string;
}

export interface ProfileFormData {
  gender: string;
  height: string;
  weight: string;
  goal: string;
  availableDays: number;
  availableMinutes: number;
  environment: string;
  experience: string;
  dietRestrictions: string[];
  equipment: string[];
}
