// src/store/collaboratorsStore.ts
// ===========================

import { create } from 'zustand';
import { collaboratorsService } from '../services/collaborators.service';
import { Database } from '../types/database.types';
import { useAuthStore } from './authStore';

type Collaborator = Database['public']['Tables']['collaborators']['Row'] & {
  collaborator_documents?: Database['public']['Tables']['collaborator_documents']['Row'][];
  properties?: Database['public']['Tables']['properties']['Row'][];
  clients?: Database['public']['Tables']['clients']['Row'][];
};

type CollaboratorInsert = Database['public']['Tables']['collaborators']['Insert'];
type CollaboratorUpdate = Database['public']['Tables']['collaborators']['Update'];

interface CollaboratorsState {
  collaborators: Collaborator[];
  selectedCollaborator: Collaborator | null;
  isLoading: boolean;
  filters: {
    type?: string;
    search?: string;
  };
  
  // Actions
  fetchCollaborators: () => Promise<void>;
  getCollaborator: (collaboratorId: string) => Promise<void>;
  createCollaborator: (collaborator: CollaboratorInsert) => Promise<Collaborator>;
  updateCollaborator: (collaboratorId: string, updates: CollaboratorUpdate) => Promise<void>;
  deleteCollaborator: (collaboratorId: string) => Promise<void>;
  applyFilters: (filters: CollaboratorsState['filters']) => void;
  clearFilters: () => void;
  setSelectedCollaborator: (collaborator: Collaborator | null) => void;
}

export const useCollaboratorsStore = create<CollaboratorsState>((set, get) => ({
  collaborators: [],
  selectedCollaborator: null,
  isLoading: false,
  filters: {},

  fetchCollaborators: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ isLoading: true });
    try {
      const data = await collaboratorsService.getCollaborators(userId);
      set({ 
        collaborators: data || [], 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching collaborators:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  getCollaborator: async (collaboratorId: string) => {
    // First, try to get from local state for instant feedback
    const localCollaborator = get().collaborators.find(c => c.id === collaboratorId);
    if (localCollaborator) {
      set({ selectedCollaborator: localCollaborator });
    }

    // Then fetch fresh data from server
    set({ isLoading: true });
    try {
      const data = await collaboratorsService.getCollaborator(collaboratorId);
      set({ 
        selectedCollaborator: data,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching collaborator:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  createCollaborator: async (collaborator: CollaboratorInsert) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');

    set({ isLoading: true });
    try {
      const newCollaborator = await collaboratorsService.createCollaborator({
        ...collaborator,
        user_id: userId,
      });
      
      // Update local state immediately
      set((state) => ({
        collaborators: [...state.collaborators, newCollaborator],
        isLoading: false
      }));
      
      return newCollaborator;
    } catch (error) {
      console.error('Error creating collaborator:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateCollaborator: async (collaboratorId: string, updates: CollaboratorUpdate) => {
    // Optimistic update
    set((state) => ({
      collaborators: state.collaborators.map(c => 
        c.id === collaboratorId ? { ...c, ...updates } : c
      ),
      selectedCollaborator: state.selectedCollaborator?.id === collaboratorId 
        ? { ...state.selectedCollaborator, ...updates }
        : state.selectedCollaborator
    }));

    try {
      await collaboratorsService.updateCollaborator(collaboratorId, updates);
      
      // Fetch fresh data to ensure consistency
      if (get().selectedCollaborator?.id === collaboratorId) {
        await get().getCollaborator(collaboratorId);
      }
    } catch (error) {
      console.error('Error updating collaborator:', error);
      // Revert on error
      await get().fetchCollaborators();
      throw error;
    }
  },

  deleteCollaborator: async (collaboratorId: string) => {
    // Optimistic update
    set((state) => ({
      collaborators: state.collaborators.filter(c => c.id !== collaboratorId),
      selectedCollaborator: state.selectedCollaborator?.id === collaboratorId 
        ? null 
        : state.selectedCollaborator
    }));

    try {
      await collaboratorsService.deleteCollaborator(collaboratorId);
    } catch (error) {
      console.error('Error deleting collaborator:', error);
      // Revert on error
      await get().fetchCollaborators();
      throw error;
    }
  },

  applyFilters: (filters: CollaboratorsState['filters']) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setSelectedCollaborator: (collaborator: Collaborator | null) => {
    set({ selectedCollaborator: collaborator });
  },
}));