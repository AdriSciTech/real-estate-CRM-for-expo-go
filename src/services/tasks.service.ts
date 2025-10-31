// src/services/tasks.service.ts

import { supabase } from './supabase';
import { Database } from '../types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
type Client = Database['public']['Tables']['clients']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];
type Deal = Database['public']['Tables']['deals']['Row'];

type TaskWithRelations = Task & {
  clients?: Partial<Client> | null;
  properties?: Partial<Property> | null;
  deals?: Partial<Deal> | null;
};

export const tasksService = {
  // Get all tasks without relations first, then fetch relations separately
  async getTasks(userId: string): Promise<TaskWithRelations[]> {
    // First, get all tasks
    const { data: tasks, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .order('due_date', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!tasks) return [];

    // Now fetch relations for each task based on related_to_type
    const tasksWithRelations = await Promise.all(
      tasks.map(async (task) => {
        const taskWithRelation: TaskWithRelations = { ...task };

        if (task.related_to_id && task.related_to_type) {
          try {
            switch (task.related_to_type) {
              case 'client':
                const { data: client } = await supabase
                  .from('clients')
                  .select('id, name, status')
                  .eq('id', task.related_to_id)
                  .single();
                taskWithRelation.clients = client;
                break;

              case 'property':
                const { data: property } = await supabase
                  .from('properties')
                  .select('id, title, status')
                  .eq('id', task.related_to_id)
                  .single();
                taskWithRelation.properties = property;
                break;

              case 'deal':
                const { data: deal } = await supabase
                  .from('deals')
                  .select('id, status, final_amount')
                  .eq('id', task.related_to_id)
                  .single();
                taskWithRelation.deals = deal;
                break;
            }
          } catch (error) {
            console.warn(`Failed to fetch ${task.related_to_type} for task ${task.id}:`, error);
          }
        }

        return taskWithRelation;
      })
    );

    return tasksWithRelations;
  },

  // Get single task with relation
  async getTask(taskId: string): Promise<TaskWithRelations | null> {
    const { data: task, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', taskId)
      .single();

    if (error) throw error;
    if (!task) return null;

    const taskWithRelation: TaskWithRelations = { ...task };

    // Fetch the related entity if exists
    if (task.related_to_id && task.related_to_type) {
      try {
        switch (task.related_to_type) {
          case 'client':
            const { data: client } = await supabase
              .from('clients')
              .select('id, name, email, phone, status')
              .eq('id', task.related_to_id)
              .single();
            taskWithRelation.clients = client;
            break;

          case 'property':
            const { data: property } = await supabase
              .from('properties')
              .select('id, title, address, city, status')
              .eq('id', task.related_to_id)
              .single();
            taskWithRelation.properties = property;
            break;

          case 'deal':
            const { data: deal } = await supabase
              .from('deals')
              .select('id, status, final_amount, expected_closing_date')
              .eq('id', task.related_to_id)
              .single();
            taskWithRelation.deals = deal;
            break;
        }
      } catch (error) {
        console.warn(`Failed to fetch ${task.related_to_type} for task ${taskId}:`, error);
      }
    }

    return taskWithRelation;
  },

  // Create task
  async createTask(task: TaskInsert): Promise<Task> {
    const { data, error } = await supabase
      .from('tasks')
      .insert(task)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update task
  async updateTask(taskId: string, updates: TaskUpdate): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) throw error;
  },

  // Delete task
  async deleteTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) throw error;
  },

  // Mark task as complete
  async completeTask(taskId: string): Promise<void> {
    const { error } = await supabase
      .from('tasks')
      .update({
        status: 'done',
        updated_at: new Date().toISOString(),
      })
      .eq('id', taskId);

    if (error) throw error;
  },

  // Get tasks by related entity
  async getTasksByRelation(relatedToType: string, relatedToId: string): Promise<Task[]> {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('related_to_type', relatedToType)
      .eq('related_to_id', relatedToId)
      .order('due_date', { ascending: true })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get overdue tasks
  async getOverdueTasks(userId: string): Promise<Task[]> {
    const today = new Date().toISOString();
    
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .lt('due_date', today)
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Get upcoming tasks (next 7 days)
  async getUpcomingTasks(userId: string): Promise<Task[]> {
    const today = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .gte('due_date', today.toISOString())
      .lte('due_date', nextWeek.toISOString())
      .order('due_date', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Alternative: Get tasks with relations using RPC (if you create a function in Supabase)
  // This would be more efficient but requires a database function
  async getTasksWithRelationsRPC(userId: string): Promise<TaskWithRelations[]> {
    // This would call a Supabase RPC function that handles the polymorphic joins
    // Example:
    // const { data, error } = await supabase.rpc('get_tasks_with_relations', { p_user_id: userId });
    // if (error) throw error;
    // return data || [];
    
    // For now, use the method above
    return this.getTasks(userId);
  },
};