// src/store/propertiesStore.ts

import { create } from 'zustand';
import { propertiesService } from '../services/properties.service';
import { Database } from '../types/database.types';
import { useAuthStore } from './authStore';

type Property = Database['public']['Tables']['properties']['Row'] & {
  property_media?: Database['public']['Tables']['property_media']['Row'][];
  collaborators?: Database['public']['Tables']['collaborators']['Row'];
};

type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

interface PropertiesState {
  properties: Property[];
  selectedProperty: Property | null;
  isLoading: boolean;
  filters: {
    property_type?: string;
    min_price?: number;
    max_price?: number;
    bedrooms?: number;
    bathrooms?: number;
    city?: string;
    status?: string;
  };
  
  // Actions
  fetchProperties: () => Promise<void>;
  getProperty: (propertyId: string) => Promise<void>;
  createProperty: (property: PropertyInsert) => Promise<Property>;
  updateProperty: (propertyId: string, updates: PropertyUpdate) => Promise<void>;
  deleteProperty: (propertyId: string) => Promise<void>;
  applyFilters: (filters: PropertiesState['filters']) => void;
  clearFilters: () => void;
  setSelectedProperty: (property: Property | null) => void;
  refreshPropertyMedia: (propertyId: string) => Promise<void>;
}

export const usePropertiesStore = create<PropertiesState>((set, get) => ({
  properties: [],
  selectedProperty: null,
  isLoading: false,
  filters: {},

  fetchProperties: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      console.error('No user ID available for fetching properties');
      return;
    }

    set({ isLoading: true });
    try {
      const data = await propertiesService.getProperties(userId);
      
      // Debug logging
      console.log('Fetched properties count:', data.length);
      data.forEach((prop, index) => {
        if (prop.property_media && prop.property_media.length > 0) {
          console.log(`Property ${index}: ${prop.title} has ${prop.property_media.length} media items`);
          console.log('First media item:', prop.property_media[0]);
        }
      });
      
      set({ 
        properties: data || [], 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching properties:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  getProperty: async (propertyId: string) => {
    // First, try to get from local state for instant feedback
    const localProperty = get().properties.find(p => p.id === propertyId);
    if (localProperty) {
      set({ selectedProperty: localProperty });
    }

    // Then fetch fresh data from server
    set({ isLoading: true });
    try {
      const data = await propertiesService.getProperty(propertyId);
      set({ 
        selectedProperty: data,
        isLoading: false 
      });
      
      // Also update the property in the list if it exists
      if (data) {
        set((state) => ({
          properties: state.properties.map(p => 
            p.id === propertyId ? { ...p, ...data } : p
          )
        }));
      }
    } catch (error) {
      console.error('Error fetching property:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  createProperty: async (property: PropertyInsert) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');

    set({ isLoading: true });
    try {
      const newProperty = await propertiesService.createProperty({
        ...property,
        user_id: userId,
      });
      
      // Don't add to local state immediately since it doesn't have media yet
      // Instead, fetch all properties to get the complete data
      await get().fetchProperties();
      
      set({ isLoading: false });
      return newProperty;
    } catch (error) {
      console.error('Error creating property:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateProperty: async (propertyId: string, updates: PropertyUpdate) => {
    // Optimistic update
    set((state) => ({
      properties: state.properties.map(p => 
        p.id === propertyId ? { ...p, ...updates } : p
      ),
      selectedProperty: state.selectedProperty?.id === propertyId 
        ? { ...state.selectedProperty, ...updates }
        : state.selectedProperty
    }));

    try {
      await propertiesService.updateProperty(propertyId, updates);
      
      // Fetch fresh data to ensure consistency
      await get().fetchProperties();
    } catch (error) {
      console.error('Error updating property:', error);
      // Revert on error
      await get().fetchProperties();
      throw error;
    }
  },

  deleteProperty: async (propertyId: string) => {
    // Optimistic update
    set((state) => ({
      properties: state.properties.filter(p => p.id !== propertyId),
      selectedProperty: state.selectedProperty?.id === propertyId 
        ? null 
        : state.selectedProperty
    }));

    try {
      await propertiesService.deleteProperty(propertyId);
    } catch (error) {
      console.error('Error deleting property:', error);
      // Revert on error
      await get().fetchProperties();
      throw error;
    }
  },

  applyFilters: (filters: PropertiesState['filters']) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setSelectedProperty: (property: Property | null) => {
    set({ selectedProperty: property });
  },

  // New method to refresh a specific property's media
  refreshPropertyMedia: async (propertyId: string) => {
    try {
      const property = await propertiesService.getProperty(propertyId);
      if (property) {
        set((state) => ({
          properties: state.properties.map(p => 
            p.id === propertyId ? property : p
          ),
          selectedProperty: state.selectedProperty?.id === propertyId 
            ? property 
            : state.selectedProperty
        }));
      }
    } catch (error) {
      console.error('Error refreshing property media:', error);
    }
  },
}));