// src/store/clientsStore.ts

import { create } from 'zustand';
import { clientsService } from '../services/clients.service';
import { Database } from '../types/database.types';
import { useAuthStore } from './authStore';

type Client = Database['public']['Tables']['clients']['Row'] & {
  client_documents?: Database['public']['Tables']['client_documents']['Row'][];
  client_property_interests?: Database['public']['Tables']['client_property_interests']['Row'][];
  collaborators?: Database['public']['Tables']['collaborators']['Row'];
};

type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];

interface ClientsState {
  clients: Client[];
  selectedClient: Client | null;
  isLoading: boolean;
  filters: {
    status?: string;
    priority?: string;
    property_type?: string;
    budget_min?: number;
    budget_max?: number;
    source_type?: string;
    search?: string;
  };
  
  // Actions
  fetchClients: () => Promise<void>;
  getClient: (clientId: string) => Promise<void>;
  createClient: (client: ClientInsert) => Promise<Client>;
  updateClient: (clientId: string, updates: ClientUpdate) => Promise<void>;
  deleteClient: (clientId: string) => Promise<void>;
  applyFilters: (filters: ClientsState['filters']) => void;
  clearFilters: () => void;
  setSelectedClient: (client: Client | null) => void;
  updateLastContacted: (clientId: string) => Promise<void>;
}

export const useClientsStore = create<ClientsState>((set, get) => ({
  clients: [],
  selectedClient: null,
  isLoading: false,
  filters: {},

  fetchClients: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ isLoading: true });
    try {
      const data = await clientsService.getClients(userId);
      set({ 
        clients: data || [], 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching clients:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  getClient: async (clientId: string) => {
    // First, try to get from local state for instant feedback
    const localClient = get().clients.find(c => c.id === clientId);
    if (localClient) {
      set({ selectedClient: localClient });
    }

    // Then fetch fresh data from server
    set({ isLoading: true });
    try {
      const data = await clientsService.getClient(clientId);
      set({ 
        selectedClient: data,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching client:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  createClient: async (client: ClientInsert) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');

    set({ isLoading: true });
    try {
      const newClient = await clientsService.createClient({
        ...client,
        user_id: userId,
      });
      
      // Update local state immediately
      set((state) => ({
        clients: [newClient, ...state.clients],
        isLoading: false
      }));
      
      return newClient;
    } catch (error) {
      console.error('Error creating client:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateClient: async (clientId: string, updates: ClientUpdate) => {
    // Optimistic update
    set((state) => ({
      clients: state.clients.map(c => 
        c.id === clientId ? { ...c, ...updates } : c
      ),
      selectedClient: state.selectedClient?.id === clientId 
        ? { ...state.selectedClient, ...updates }
        : state.selectedClient
    }));

    try {
      await clientsService.updateClient(clientId, updates);
      
      // Fetch fresh data to ensure consistency
      if (get().selectedClient?.id === clientId) {
        await get().getClient(clientId);
      }
    } catch (error) {
      console.error('Error updating client:', error);
      // Revert on error
      await get().fetchClients();
      throw error;
    }
  },

  deleteClient: async (clientId: string) => {
    // Optimistic update
    set((state) => ({
      clients: state.clients.filter(c => c.id !== clientId),
      selectedClient: state.selectedClient?.id === clientId 
        ? null 
        : state.selectedClient
    }));

    try {
      await clientsService.deleteClient(clientId);
    } catch (error) {
      console.error('Error deleting client:', error);
      // Revert on error
      await get().fetchClients();
      throw error;
    }
  },

  updateLastContacted: async (clientId: string) => {
    try {
      await clientsService.updateLastContacted(clientId);
      
      // Update local state
      set((state) => ({
        clients: state.clients.map(c => 
          c.id === clientId 
            ? { ...c, last_contacted_at: new Date().toISOString() }
            : c
        ),
        selectedClient: state.selectedClient?.id === clientId 
          ? { ...state.selectedClient, last_contacted_at: new Date().toISOString() }
          : state.selectedClient
      }));
    } catch (error) {
      console.error('Error updating last contacted:', error);
      throw error;
    }
  },

  applyFilters: (filters: ClientsState['filters']) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setSelectedClient: (client: Client | null) => {
    set({ selectedClient: client });
  },
}));