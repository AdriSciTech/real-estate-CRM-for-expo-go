// src/store/developerProjectsStore.ts

import { create } from 'zustand';
import { developerProjectsService } from '../services/developerProjects.service';
import { Database } from '../types/database.types';
import { useAuthStore } from './authStore';

type DeveloperProject = Database['public']['Tables']['developer_projects']['Row'] & {
  collaborators?: Database['public']['Tables']['collaborators']['Row'];
  properties?: Database['public']['Tables']['properties']['Row'][];
};

type DeveloperProjectInsert = Database['public']['Tables']['developer_projects']['Insert'];
type DeveloperProjectUpdate = Database['public']['Tables']['developer_projects']['Update'];

interface DeveloperProjectsState {
  projects: DeveloperProject[];
  selectedProject: DeveloperProject | null;
  developers: Database['public']['Tables']['collaborators']['Row'][];
  isLoading: boolean;
  projectStats: {
    totalUnits: number;
    availableUnits: number;
    soldUnits: number;
    rentedUnits: number;
    totalValue: number;
    soldValue: number;
  } | null;
  
  // Actions
  fetchProjects: () => Promise<void>;
  getProject: (projectId: string) => Promise<void>;
  createProject: (project: DeveloperProjectInsert) => Promise<DeveloperProject>;
  updateProject: (projectId: string, updates: DeveloperProjectUpdate) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;
  fetchDevelopers: () => Promise<void>;
  fetchProjectStats: (projectId: string) => Promise<void>;
  setSelectedProject: (project: DeveloperProject | null) => void;
}

export const useDeveloperProjectsStore = create<DeveloperProjectsState>((set, get) => ({
  projects: [],
  selectedProject: null,
  developers: [],
  isLoading: false,
  projectStats: null,

  fetchProjects: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ isLoading: true });
    try {
      const data = await developerProjectsService.getDeveloperProjects(userId);
      set({ 
        projects: data || [], 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching developer projects:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  getProject: async (projectId: string) => {
    // First, try to get from local state for instant feedback
    const localProject = get().projects.find(p => p.id === projectId);
    if (localProject) {
      set({ selectedProject: localProject });
    }

    // Then fetch fresh data from server
    set({ isLoading: true });
    try {
      const data = await developerProjectsService.getDeveloperProject(projectId);
      set({ 
        selectedProject: data,
        isLoading: false 
      });

      // Also fetch stats
      if (data) {
        await get().fetchProjectStats(projectId);
      }
    } catch (error) {
      console.error('Error fetching developer project:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  createProject: async (project: DeveloperProjectInsert) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');

    set({ isLoading: true });
    try {
      const newProject = await developerProjectsService.createDeveloperProject({
        ...project,
        user_id: userId,
      });
      
      // Update local state immediately
      set((state) => ({
        projects: [...state.projects, newProject],
        isLoading: false
      }));
      
      return newProject;
    } catch (error) {
      console.error('Error creating developer project:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateProject: async (projectId: string, updates: DeveloperProjectUpdate) => {
    // Optimistic update
    set((state) => ({
      projects: state.projects.map(p => 
        p.id === projectId ? { ...p, ...updates } : p
      ),
      selectedProject: state.selectedProject?.id === projectId 
        ? { ...state.selectedProject, ...updates }
        : state.selectedProject
    }));

    try {
      await developerProjectsService.updateDeveloperProject(projectId, updates);
      
      // Fetch fresh data to ensure consistency
      if (get().selectedProject?.id === projectId) {
        await get().getProject(projectId);
      }
    } catch (error) {
      console.error('Error updating developer project:', error);
      // Revert on error
      await get().fetchProjects();
      throw error;
    }
  },

  deleteProject: async (projectId: string) => {
    // Optimistic update
    set((state) => ({
      projects: state.projects.filter(p => p.id !== projectId),
      selectedProject: state.selectedProject?.id === projectId 
        ? null 
        : state.selectedProject
    }));

    try {
      await developerProjectsService.deleteDeveloperProject(projectId);
    } catch (error) {
      console.error('Error deleting developer project:', error);
      // Revert on error
      await get().fetchProjects();
      throw error;
    }
  },

  fetchDevelopers: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    try {
      const data = await developerProjectsService.getDevelopers(userId);
      set({ developers: data || [] });
    } catch (error) {
      console.error('Error fetching developers:', error);
      throw error;
    }
  },

  fetchProjectStats: async (projectId: string) => {
    try {
      const stats = await developerProjectsService.getProjectStats(projectId);
      set({ projectStats: stats });
    } catch (error) {
      console.error('Error fetching project stats:', error);
      set({ projectStats: null });
    }
  },

  setSelectedProject: (project: DeveloperProject | null) => {
    set({ selectedProject: project });
  },
}));