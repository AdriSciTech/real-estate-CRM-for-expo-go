// src/services/developerProjects.service.ts

import { supabase } from './supabase';
import { Database } from '../types/database.types';

type DeveloperProject = Database['public']['Tables']['developer_projects']['Row'];
type DeveloperProjectInsert = Database['public']['Tables']['developer_projects']['Insert'];
type DeveloperProjectUpdate = Database['public']['Tables']['developer_projects']['Update'];
type Property = Database['public']['Tables']['properties']['Row'];
type Collaborator = Database['public']['Tables']['collaborators']['Row'];

type DeveloperProjectWithRelations = DeveloperProject & {
  collaborators?: Collaborator;
  properties?: Property[];
};

export const developerProjectsService = {
  // Get all developer projects with relations
  async getDeveloperProjects(userId: string): Promise<DeveloperProjectWithRelations[]> {
    const { data, error } = await supabase
      .from('developer_projects')
      .select(`
        *,
        collaborators!fk_developer_projects_collaborator (
          id,
          name,
          company_name,
          email,
          phone,
          type
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Also fetch properties separately if the direct relation doesn't work
    if (data && data.length > 0) {
      const projectIds = data.map(p => p.id);
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .in('project_id', projectIds);

      // Map properties to their projects
      const projectPropertiesMap = new Map();
      properties?.forEach(prop => {
        if (!projectPropertiesMap.has(prop.project_id)) {
          projectPropertiesMap.set(prop.project_id, []);
        }
        projectPropertiesMap.get(prop.project_id).push(prop);
      });

      // Add properties to projects
      data.forEach(project => {
        project.properties = projectPropertiesMap.get(project.id) || [];
      });
    }

    return data || [];
  },

  // Get single developer project
  async getDeveloperProject(projectId: string): Promise<DeveloperProjectWithRelations | null> {
    const { data, error } = await supabase
      .from('developer_projects')
      .select(`
        *,
        collaborators!fk_developer_projects_collaborator (
          id,
          name,
          company_name,
          email,
          phone,
          contact_person,
          type
        )
      `)
      .eq('id', projectId)
      .single();

    if (error) throw error;

    // Fetch properties for this project
    if (data) {
      const { data: properties } = await supabase
        .from('properties')
        .select('*')
        .eq('project_id', projectId);

      data.properties = properties || [];
    }

    return data;
  },

  // Create developer project
  async createDeveloperProject(project: DeveloperProjectInsert): Promise<DeveloperProject> {
    const { data, error } = await supabase
      .from('developer_projects')
      .insert(project)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update developer project
  async updateDeveloperProject(projectId: string, updates: DeveloperProjectUpdate): Promise<void> {
    const { error } = await supabase
      .from('developer_projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', projectId);

    if (error) throw error;
  },

  // Delete developer project
  async deleteDeveloperProject(projectId: string): Promise<void> {
    // First, unlink all properties from this project
    await supabase
      .from('properties')
      .update({ project_id: null })
      .eq('project_id', projectId);

    // Then delete the project
    const { error } = await supabase
      .from('developer_projects')
      .delete()
      .eq('id', projectId);

    if (error) throw error;
  },

  // Get properties for a specific project
  async getProjectProperties(projectId: string): Promise<Property[]> {
    const { data, error } = await supabase
      .from('properties')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get project statistics
  async getProjectStats(projectId: string): Promise<{
    totalUnits: number;
    availableUnits: number;
    soldUnits: number;
    rentedUnits: number;
    totalValue: number;
    soldValue: number;
  }> {
    const { data: properties, error } = await supabase
      .from('properties')
      .select('status, price, sold_price')
      .eq('project_id', projectId);

    if (error) throw error;

    const stats = {
      totalUnits: properties?.length || 0,
      availableUnits: 0,
      soldUnits: 0,
      rentedUnits: 0,
      totalValue: 0,
      soldValue: 0,
    };

    properties?.forEach(property => {
      if (property.status === 'available') stats.availableUnits++;
      if (property.status === 'sold') stats.soldUnits++;
      if (property.status === 'rented') stats.rentedUnits++;
      
      stats.totalValue += property.price || 0;
      if (property.status === 'sold') {
        stats.soldValue += property.sold_price || property.price || 0;
      }
    });

    return stats;
  },

  // Get developers only (for dropdown)
  async getDevelopers(userId: string): Promise<Collaborator[]> {
    const { data, error } = await supabase
      .from('collaborators')
      .select('*')
      .eq('user_id', userId)
      .eq('type', 'developer')
      .order('company_name', { ascending: true });

    if (error) throw error;
    return data || [];
  },
};