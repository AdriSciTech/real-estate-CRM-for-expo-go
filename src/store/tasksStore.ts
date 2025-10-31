// src/store/tasksStore.ts
// ===========================

import { create } from 'zustand';
import { tasksService } from '../services/tasks.service';
import { Database } from '../types/database.types';
import { useAuthStore } from './authStore';

type Task = Database['public']['Tables']['tasks']['Row'] & {
  clients?: Partial<Database['public']['Tables']['clients']['Row']> | null;
  properties?: Partial<Database['public']['Tables']['properties']['Row']> | null;
  deals?: Partial<Database['public']['Tables']['deals']['Row']> | null;
};

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

interface TasksState {
  tasks: Task[];
  selectedTask: Task | null;
  isLoading: boolean;
  filters: {
    status?: 'pending' | 'done';
    priority?: 'high' | 'medium' | 'low';
    relatedToType?: 'client' | 'property' | 'deal' | 'other';
    dueDateRange?: 'overdue' | 'today' | 'week' | 'month' | 'all';
  };
  
  // Actions
  fetchTasks: () => Promise<void>;
  getTask: (taskId: string) => Promise<void>;
  createTask: (task: TaskInsert) => Promise<Task>;
  updateTask: (taskId: string, updates: TaskUpdate) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  applyFilters: (filters: TasksState['filters']) => void;
  clearFilters: () => void;
  setSelectedTask: (task: Task | null) => void;
}

export const useTasksStore = create<TasksState>((set, get) => ({
  tasks: [],
  selectedTask: null,
  isLoading: false,
  filters: {},

  fetchTasks: async () => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) return;

    set({ isLoading: true });
    try {
      const data = await tasksService.getTasks(userId);
      set({ 
        tasks: data || [], 
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching tasks:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  getTask: async (taskId: string) => {
    // First, try to get from local state for instant feedback
    const localTask = get().tasks.find(t => t.id === taskId);
    if (localTask) {
      set({ selectedTask: localTask });
    }

    // Then fetch fresh data from server
    set({ isLoading: true });
    try {
      const data = await tasksService.getTask(taskId);
      set({ 
        selectedTask: data,
        isLoading: false 
      });
    } catch (error) {
      console.error('Error fetching task:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  createTask: async (task: TaskInsert) => {
    const userId = useAuthStore.getState().user?.id;
    if (!userId) throw new Error('User not authenticated');

    set({ isLoading: true });
    try {
      const newTask = await tasksService.createTask({
        ...task,
        user_id: userId,
      });
      
      // Update local state immediately
      set((state) => ({
        tasks: [...state.tasks, newTask],
        isLoading: false
      }));
      
      return newTask;
    } catch (error) {
      console.error('Error creating task:', error);
      set({ isLoading: false });
      throw error;
    }
  },

  updateTask: async (taskId: string, updates: TaskUpdate) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, ...updates } : t
      ),
      selectedTask: state.selectedTask?.id === taskId 
        ? { ...state.selectedTask, ...updates }
        : state.selectedTask
    }));

    try {
      await tasksService.updateTask(taskId, updates);
      
      // Fetch fresh data to ensure consistency
      if (get().selectedTask?.id === taskId) {
        await get().getTask(taskId);
      }
    } catch (error) {
      console.error('Error updating task:', error);
      // Revert on error
      await get().fetchTasks();
      throw error;
    }
  },

  deleteTask: async (taskId: string) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.filter(t => t.id !== taskId),
      selectedTask: state.selectedTask?.id === taskId 
        ? null 
        : state.selectedTask
    }));

    try {
      await tasksService.deleteTask(taskId);
    } catch (error) {
      console.error('Error deleting task:', error);
      // Revert on error
      await get().fetchTasks();
      throw error;
    }
  },

  completeTask: async (taskId: string) => {
    // Optimistic update
    set((state) => ({
      tasks: state.tasks.map(t => 
        t.id === taskId ? { ...t, status: 'done' } : t
      ),
      selectedTask: state.selectedTask?.id === taskId 
        ? { ...state.selectedTask, status: 'done' }
        : state.selectedTask
    }));

    try {
      await tasksService.completeTask(taskId);
    } catch (error) {
      console.error('Error completing task:', error);
      // Revert on error
      await get().fetchTasks();
      throw error;
    }
  },

  applyFilters: (filters: TasksState['filters']) => {
    set({ filters });
  },

  clearFilters: () => {
    set({ filters: {} });
  },

  setSelectedTask: (task: Task | null) => {
    set({ selectedTask: task });
  },
}));
