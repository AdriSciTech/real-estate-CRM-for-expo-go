// src/services/supabase-client.ts

import { createClient, SupabaseClient } from '@supabase/supabase-js';
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

// Create typed Supabase client with explicit type
export const supabase: SupabaseClient<Database> = createClient<Database>(
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

// Test the types are working
const testTypes = async () => {
  // This should work without errors if types are correct
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .limit(1);
  
  if (data) {
    // data should be typed as PropertyRow[]
    console.log(data[0]?.title);
  }
};