// src/services/properties.service.ts

import { 
  supabase,
  type PropertyRow as Property,
  type PropertyInsert,
  type PropertyUpdate,
  type PropertyMediaRow as PropertyMedia,
  type PropertyMediaInsert,
  type CollaboratorRow as Collaborator
} from './supabase-helpers';

type PropertyWithRelations = Property & {
  property_media?: PropertyMedia[];
  collaborators?: Collaborator;
};

export const propertiesService = {
  // Get all properties with optimized query
  async getProperties(userId: string): Promise<PropertyWithRelations[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_media (
          id,
          file_type,
          file_url,
          file_name,
          caption,
          display_order,
          created_at
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

  // Get single property with all relations
  async getProperty(propertyId: string): Promise<PropertyWithRelations | null> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_media (
          id,
          file_type,
          file_url,
          file_name,
          caption,
          display_order,
          created_at
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
      .eq('id', propertyId)
      .single();

    if (error) throw error;
    return data;
  },

  // Create property
  async createProperty(property: PropertyInsert): Promise<Property> {
    const { data, error } = await supabase
      .from('properties')
      .insert(property)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update property
  async updateProperty(propertyId: string, updates: PropertyUpdate): Promise<void> {
    const { error } = await supabase
      .from('properties')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', propertyId);

    if (error) throw error;
  },

  // Delete property
  async deleteProperty(propertyId: string): Promise<void> {
    // Get all media files to delete from storage
    const { data: mediaFiles } = await supabase
      .from('property_media')
      .select('file_url')
      .eq('property_id', propertyId);

    // Delete files from storage
    if (mediaFiles && mediaFiles.length > 0) {
      const filePaths = mediaFiles
        .map(media => {
          try {
            // Extract file path from URL
            const url = new URL(media.file_url);
            const path = url.pathname.split('/').slice(-2).join('/');
            return path;
          } catch {
            return null;
          }
        })
        .filter((path): path is string => path !== null);

      if (filePaths.length > 0) {
        await supabase.storage
          .from('properties')
          .remove(filePaths);
      }
    }

    // Delete media records first (due to foreign key constraints)
    await supabase
      .from('property_media')
      .delete()
      .eq('property_id', propertyId);

    // Then delete the property
    const { error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId);

    if (error) throw error;
  },

  // Add media to property
  async addPropertyMedia(
    propertyId: string,
    media: {
      file_type: 'image' | 'video' | 'document' | 'floorplan';
      file_url: string;
      file_name?: string;
      caption?: string;
      display_order?: number;
    }
  ): Promise<PropertyMedia> {
    const insertData: PropertyMediaInsert = {
      property_id: propertyId,
      file_type: media.file_type,
      file_url: media.file_url,
      file_name: media.file_name,
      caption: media.caption,
      display_order: media.display_order ?? 0,
    };

    const { data, error } = await supabase
      .from('property_media')
      .insert(insertData)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete property media with storage cleanup
  async deletePropertyMedia(mediaId: string): Promise<void> {
    // First get the media to find the file URL
    const { data: media, error: fetchError } = await supabase
      .from('property_media')
      .select('file_url')
      .eq('id', mediaId)
      .single();

    if (fetchError) throw fetchError;

    if (media?.file_url) {
      try {
        // Extract file path from URL
        const url = new URL(media.file_url);
        const path = url.pathname.split('/').slice(-2).join('/');
        
        // Delete from storage
        const { error: storageError } = await supabase.storage
          .from('properties')
          .remove([path]);

        if (storageError) {
          console.error('Storage deletion error:', storageError);
          // Continue with database deletion even if storage fails
        }
      } catch (error) {
        console.error('Error parsing file URL:', error);
      }
    }

    // Delete from database
    const { error } = await supabase
      .from('property_media')
      .delete()
      .eq('id', mediaId);

    if (error) throw error;
  },

  // Get property media with sorting
  async getPropertyMedia(propertyId: string): Promise<PropertyMedia[]> {
    const { data, error } = await supabase
      .from('property_media')
      .select('*')
      .eq('property_id', propertyId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  // Reorder property media
  async reorderPropertyMedia(propertyId: string, mediaUpdates: { id: string; display_order: number }[]): Promise<void> {
    const updates = mediaUpdates.map(update => 
      supabase
        .from('property_media')
        .update({ display_order: update.display_order })
        .eq('id', update.id)
        .eq('property_id', propertyId)
    );

    const results = await Promise.all(updates);
    const errors = results.filter(result => result.error);
    
    if (errors.length > 0) {
      throw new Error('Failed to reorder some media items');
    }
  },

  // Get storage usage for a property (if file_size column exists)
  async getPropertyStorageUsage(propertyId: string): Promise<number> {
    const { data, error } = await supabase
      .from('property_media')
      .select('file_size')
      .eq('property_id', propertyId);

    if (error) throw error;
    
    return data?.reduce((total, item) => total + (item.file_size || 0), 0) || 0;
  },

  // Update media caption
  async updateMediaCaption(mediaId: string, caption: string): Promise<void> {
    const { error } = await supabase
      .from('property_media')
      .update({ caption })
      .eq('id', mediaId);

    if (error) throw error;
  },

  // Get properties by status
  async getPropertiesByStatus(userId: string, status: string): Promise<PropertyWithRelations[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_media (
          id,
          file_type,
          file_url,
          file_name,
          caption,
          display_order,
          created_at
        ),
        collaborators!source_collaborator_id (
          id,
          name,
          email,
          company_name
        )
      `)
      .eq('user_id', userId)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Search properties
  async searchProperties(userId: string, searchTerm: string): Promise<PropertyWithRelations[]> {
    const { data, error } = await supabase
      .from('properties')
      .select(`
        *,
        property_media (
          id,
          file_type,
          file_url,
          file_name,
          caption,
          display_order,
          created_at
        ),
        collaborators!source_collaborator_id (
          id,
          name,
          email,
          company_name
        )
      `)
      .eq('user_id', userId)
      .or(`title.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%,location.ilike.%${searchTerm}%,city.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },
};