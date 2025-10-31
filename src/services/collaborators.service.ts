// src/services/collaborators.service.ts
// ===========================

import { supabase } from './supabase';
import { Database } from '../types/database.types';

type Collaborator = Database['public']['Tables']['collaborators']['Row'];
type CollaboratorInsert = Database['public']['Tables']['collaborators']['Insert'];
type CollaboratorUpdate = Database['public']['Tables']['collaborators']['Update'];
type CollaboratorDocument = Database['public']['Tables']['collaborator_documents']['Row'];
type CollaboratorDocumentInsert = Database['public']['Tables']['collaborator_documents']['Insert'];

type CollaboratorWithRelations = Collaborator & {
  collaborator_documents?: CollaboratorDocument[];
  properties?: Database['public']['Tables']['properties']['Row'][];
  clients?: Database['public']['Tables']['clients']['Row'][];
};

export const collaboratorsService = {
  // Get all collaborators with optimized query
  async getCollaborators(userId: string): Promise<CollaboratorWithRelations[]> {
    const { data, error } = await supabase
      .from('collaborators')
      .select(`
        *,
        collaborator_documents (
          id,
          file_name,
          file_url,
          file_type,
          file_size,
          upload_date
        ),
        properties!source_collaborator_id (
          id,
          title,
          status
        ),
        clients!source_collaborator_id (
          id,
          name,
          status
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get single collaborator with all relations
  async getCollaborator(collaboratorId: string): Promise<CollaboratorWithRelations | null> {
    const { data, error } = await supabase
      .from('collaborators')
      .select(`
        *,
        collaborator_documents (
          id,
          file_name,
          file_url,
          file_type,
          file_size,
          upload_date
        ),
        properties!source_collaborator_id (
          id,
          title,
          status,
          price,
          property_type
        ),
        clients!source_collaborator_id (
          id,
          name,
          status,
          priority
        )
      `)
      .eq('id', collaboratorId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create collaborator
  async createCollaborator(collaborator: CollaboratorInsert): Promise<Collaborator> {
    const { data, error } = await supabase
      .from('collaborators')
      .insert(collaborator)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update collaborator
  async updateCollaborator(collaboratorId: string, updates: CollaboratorUpdate): Promise<void> {
    const { error } = await supabase
      .from('collaborators')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', collaboratorId);

    if (error) throw error;
  },

  // Delete collaborator
  async deleteCollaborator(collaboratorId: string): Promise<void> {
    // Get all documents to delete from storage
    const { data: documents } = await supabase
      .from('collaborator_documents')
      .select('file_url')
      .eq('collaborator_id', collaboratorId);

    // Delete files from storage
    if (documents && documents.length > 0) {
      const filePaths = documents
        .map(doc => {
          try {
            const url = new URL(doc.file_url);
            const path = url.pathname.split('/').slice(-2).join('/');
            return path;
          } catch {
            return null;
          }
        })
        .filter(Boolean) as string[];

      if (filePaths.length > 0) {
        await supabase.storage
          .from('collaborators')
          .remove(filePaths);
      }
    }

    // Delete document records
    await supabase
      .from('collaborator_documents')
      .delete()
      .eq('collaborator_id', collaboratorId);

    // Delete the collaborator
    const { error } = await supabase
      .from('collaborators')
      .delete()
      .eq('id', collaboratorId);

    if (error) throw error;
  },

  // Add document to collaborator
  async addCollaboratorDocument(
    collaboratorId: string,
    document: {
      file_name: string;
      file_url: string;
      file_type?: string;
      file_size?: number;
    }
  ): Promise<CollaboratorDocument> {
    const { data, error } = await supabase
      .from('collaborator_documents')
      .insert({
        collaborator_id: collaboratorId,
        ...document,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete collaborator document
  async deleteCollaboratorDocument(documentId: string): Promise<void> {
    // Get the document to find the file URL
    const { data: document, error: fetchError } = await supabase
      .from('collaborator_documents')
      .select('file_url')
      .eq('id', documentId)
      .single();

    if (fetchError) throw fetchError;

    if (document?.file_url) {
      try {
        const url = new URL(document.file_url);
        const path = url.pathname.split('/').slice(-2).join('/');
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('collaborators')
          .remove([path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
        }
      } catch (error) {
        console.error('Error parsing file URL:', error);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('collaborator_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  // Get collaborator documents
  async getCollaboratorDocuments(collaboratorId: string): Promise<CollaboratorDocument[]> {
    const { data, error } = await supabase
      .from('collaborator_documents')
      .select('*')
      .eq('collaborator_id', collaboratorId)
      .order('upload_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};
