// src/services/clients.service.ts

import { supabase } from './supabase';
import { Database } from '../types/database.types';

type Client = Database['public']['Tables']['clients']['Row'];
type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type ClientUpdate = Database['public']['Tables']['clients']['Update'];
type ClientDocument = Database['public']['Tables']['client_documents']['Row'];
type ClientDocumentInsert = Database['public']['Tables']['client_documents']['Insert'];
type ClientPropertyInterest = Database['public']['Tables']['client_property_interests']['Row'];
type ClientWithRelations = Client & {
  client_documents?: ClientDocument[];
  client_property_interests?: ClientPropertyInterest[];
  collaborators?: Database['public']['Tables']['collaborators']['Row'];
};

export const clientsService = {
  // Get all clients with optimized query
  async getClients(userId: string): Promise<ClientWithRelations[]> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        client_documents (
          id,
          file_name,
          file_url,
          file_type,
          document_type,
          description,
          upload_date
        ),
        client_property_interests (
          id,
          property_id,
          interest_level,
          viewed_at,
          feedback
        ),
        collaborators!source_collaborator_id (
          id,
          name,
          email,
          company_name
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get single client with all relations
  async getClient(clientId: string): Promise<ClientWithRelations | null> {
    const { data, error } = await supabase
      .from('clients')
      .select(`
        *,
        client_documents (
          id,
          file_name,
          file_url,
          file_type,
          document_type,
          description,
          upload_date
        ),
        client_property_interests (
          id,
          property_id,
          interest_level,
          viewed_at,
          feedback
        ),
        collaborators!source_collaborator_id (
          id,
          name,
          email,
          company_name,
          type,
          phone
        )
      `)
      .eq('id', clientId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create client
  async createClient(client: ClientInsert): Promise<Client> {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update client
  async updateClient(clientId: string, updates: ClientUpdate): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (error) throw error;
  },

  // Delete client
  async deleteClient(clientId: string): Promise<void> {
    // Get all document files to delete from storage
    const { data: documents } = await supabase
      .from('client_documents')
      .select('file_url')
      .eq('client_id', clientId);

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
          .from('clients')
          .remove(filePaths);
      }
    }

    // Delete document records
    await supabase
      .from('client_documents')
      .delete()
      .eq('client_id', clientId);

    // Delete property interests
    await supabase
      .from('client_property_interests')
      .delete()
      .eq('client_id', clientId);

    // Then delete the client
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', clientId);

    if (error) throw error;
  },

  // Add document to client
  async addClientDocument(
    clientId: string,
    document: {
      file_name: string;
      file_url: string;
      file_type?: string;
      document_type?: ClientDocumentInsert['document_type'];
      description?: string;
    }
  ): Promise<ClientDocument> {
    const { data, error } = await supabase
      .from('client_documents')
      .insert({
        client_id: clientId,
        ...document,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete client document with storage cleanup
  async deleteClientDocument(documentId: string): Promise<void> {
    // First get the document to find the file URL
    const { data: document, error: fetchError } = await supabase
      .from('client_documents')
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
          .from('clients')
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
      .from('client_documents')
      .delete()
      .eq('id', documentId);

    if (error) throw error;
  },

  // Get client documents
  async getClientDocuments(clientId: string): Promise<ClientDocument[]> {
    const { data, error } = await supabase
      .from('client_documents')
      .select('*')
      .eq('client_id', clientId)
      .order('upload_date', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Update last contacted date
  async updateLastContacted(clientId: string): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .update({
        last_contacted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', clientId);

    if (error) throw error;
  },

  // Add or update property interest
  async setPropertyInterest(
    clientId: string,
    propertyId: string,
    interestLevel: 'interested' | 'viewed' | 'rejected' | 'favorite',
    feedback?: string
  ): Promise<void> {
    const { error } = await supabase
      .from('client_property_interests')
      .upsert({
        client_id: clientId,
        property_id: propertyId,
        interest_level: interestLevel,
        feedback,
        viewed_at: new Date().toISOString(),
      });

    if (error) throw error;
  },

  // Get client property interests
  async getClientPropertyInterests(clientId: string): Promise<ClientPropertyInterest[]> {
    const { data, error } = await supabase
      .from('client_property_interests')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};