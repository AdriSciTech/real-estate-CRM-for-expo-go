// src/services/supabase-helpers.ts

import { createClient } from '@supabase/supabase-js';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Database } from '../types/database.types';

// Configuration
const supabaseUrl = 
  Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://alandtpefmuoaxqwiets.supabase.co";

const supabaseAnonKey = 
  Constants.expoConfig?.extra?.supabasePublishableKey || 
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  "sb_publishable_rwIpnRGZ71ejgulTMuhdxQ_T1bbopQ9";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// Storage adapter
const ExpoSecureStoreAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    try {
      return await SecureStore.getItemAsync(key);
    } catch (error) {
      console.error('SecureStore getItem error:', error);
      return null;
    }
  },
  setItem: async (key: string, value: string): Promise<void> => {
    try {
      await SecureStore.setItemAsync(key, value);
    } catch (error) {
      console.error('SecureStore setItem error:', error);
    }
  },
  removeItem: async (key: string): Promise<void> => {
    try {
      await SecureStore.deleteItemAsync(key);
    } catch (error) {
      console.error('SecureStore removeItem error:', error);
    }
  },
};

// Create typed Supabase client
export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      storage: ExpoSecureStoreAdapter as any,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  }
);

// Export types for easier usage
export type Tables = Database['public']['Tables'];
export type PropertyRow = Tables['properties']['Row'];
export type PropertyInsert = Tables['properties']['Insert'];
export type PropertyUpdate = Tables['properties']['Update'];
export type PropertyMediaRow = Tables['property_media']['Row'];
export type PropertyMediaInsert = Tables['property_media']['Insert'];
export type PropertyMediaUpdate = Tables['property_media']['Update'];
export type CollaboratorRow = Tables['collaborators']['Row'];
export type CollaboratorInsert = Tables['collaborators']['Insert'];
export type CollaboratorUpdate = Tables['collaborators']['Update'];
export type ClientRow = Tables['clients']['Row'];
export type ClientInsert = Tables['clients']['Insert'];
export type ClientUpdate = Tables['clients']['Update'];
export type DealRow = Tables['deals']['Row'];
export type DealInsert = Tables['deals']['Insert'];
export type DealUpdate = Tables['deals']['Update'];
export type TaskRow = Tables['tasks']['Row'];
export type TaskInsert = Tables['tasks']['Insert'];
export type TaskUpdate = Tables['tasks']['Update'];
export type ContactHistoryRow = Tables['contact_history']['Row'];
export type ContactHistoryInsert = Tables['contact_history']['Insert'];
export type ContactHistoryUpdate = Tables['contact_history']['Update'];
export type ClientDocumentRow = Tables['client_documents']['Row'];
export type ClientDocumentInsert = Tables['client_documents']['Insert'];
export type ClientDocumentUpdate = Tables['client_documents']['Update'];
export type ClientPropertyInterestRow = Tables['client_property_interests']['Row'];
export type ClientPropertyInterestInsert = Tables['client_property_interests']['Insert'];
export type ClientPropertyInterestUpdate = Tables['client_property_interests']['Update'];
export type CollaboratorDocumentRow = Tables['collaborator_documents']['Row'];
export type CollaboratorDocumentInsert = Tables['collaborator_documents']['Insert'];
export type CollaboratorDocumentUpdate = Tables['collaborator_documents']['Update'];
export type DeveloperProjectRow = Tables['developer_projects']['Row'];
export type DeveloperProjectInsert = Tables['developer_projects']['Insert'];
export type DeveloperProjectUpdate = Tables['developer_projects']['Update'];

// Helper function to handle Supabase errors
export function handleSupabaseError(error: any): never {
  console.error('Supabase error:', error);
  throw new Error(error.message || 'An error occurred with the database operation');
}