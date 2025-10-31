//src\screens\properties\AddPropertyScreen\AddPropertyScreen.types.ts

import { Database } from '../../../types/database.types';

export type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
export type Collaborator = Database['public']['Tables']['collaborators']['Row'];
export type PropertyMedia = Database['public']['Tables']['property_media']['Row'];

export interface PropertyFormData {
  title: string;
  description: string;
  price: number | null;
  property_type: 'apartment' | 'house' | 'commercial' | 'land';
  address: string;
  city: string;
  postal_code: string;
  bedrooms: number | null;
  bathrooms: number | null;
  square_meters: number | null;
  floor_number: number | null;
  total_floors: number | null;
  has_terrace: boolean;
  has_garden: boolean;
  has_parking: boolean;
  has_elevator: boolean;
  source_type: 'landlord' | 'developer' | 'partner' | null;
  source_collaborator_id: string | null;
}

export type CurrentStep = 'form' | 'media';