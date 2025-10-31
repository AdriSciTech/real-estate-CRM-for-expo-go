// src/services/imageService.ts

import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { supabase } from './supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Image } from 'react-native';

interface UploadResult {
  originalUrl: string;
  optimizedUrls: {
    thumbnail: string;
    mobile: string;
    desktop: string;
  };
  filePath: string;
  fileSize: number;
  mediaId?: string;
}

interface PropertyMediaInsert {
  property_id: string;
  file_type: 'image' | 'video' | 'document' | 'floorplan';
  file_url: string;
  file_name: string;
  caption?: string;
  display_order?: number;
  file_size?: number;
  uploaded_by?: string;
}

class ImageService {
  private static instance: ImageService;
  private imageCache = new Map<string, string>();
  
  // Supabase Storage bucket configuration
  private readonly BUCKET_NAME = 'property-images';
  private readonly MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
  private readonly CACHE_CONTROL = '31536000'; // 1 year

  private constructor() {}

  static getInstance(): ImageService {
    if (!ImageService.instance) {
      ImageService.instance = new ImageService();
    }
    return ImageService.instance;
  }

  /**
   * Main upload function - uses native fetch and Response.arrayBuffer()
   * No external dependencies required!
   */
  async uploadPropertyImage(
    propertyId: string,
    imageUri: string,
    options?: {
      caption?: string;
      displayOrder?: number;
    }
  ): Promise<UploadResult> {
    try {
      console.log('Starting image upload for property:', propertyId);
      console.log('Image URI:', imageUri);

      // Step 1: Optimize image before upload
      const optimizedImage = await this.optimizeImageForUpload(imageUri);
      console.log('Image optimized, approximate size:', optimizedImage.size);

      // Step 2: Generate unique filename
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `${propertyId}/${timestamp}_${randomId}.jpg`;

      // Step 3: Convert image to ArrayBuffer using native methods
      console.log('Converting to ArrayBuffer...');
      
      // Fetch the image URI as a blob
      const response = await fetch(optimizedImage.uri);
      const blob = await response.blob();
      
      // Convert blob to ArrayBuffer using Response
      const arrayBuffer = await new Response(blob).arrayBuffer();
      
      console.log('ArrayBuffer created, size:', arrayBuffer.byteLength);

      // Step 4: Upload to Supabase Storage
      console.log('Uploading to Supabase Storage...');
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          cacheControl: this.CACHE_CONTROL,
          upsert: false,
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw new Error(`Upload failed: ${uploadError.message}`);
      }

      console.log('Upload successful:', uploadData);

      // Step 5: Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);

      // Step 6: Generate transformation URLs
      const optimizedUrls = {
        thumbnail: this.getTransformationUrl(publicUrl, { 
          width: 300, 
          height: 300, 
          resize: 'cover',
          quality: 70 
        }),
        mobile: this.getTransformationUrl(publicUrl, { 
          width: 640, 
          quality: 80 
        }),
        desktop: this.getTransformationUrl(publicUrl, { 
          width: 1280, 
          quality: 85 
        }),
      };

      // Step 7: Save metadata to database
      const { data: authData } = await supabase.auth.getUser();
      const userId = authData?.user?.id;

      const { data: mediaData, error: mediaError } = await supabase
        .from('property_media')
        .insert({
          property_id: propertyId,
          file_type: 'image' as const,
          file_url: publicUrl,
          file_name: fileName,
          caption: options?.caption || null,
          display_order: options?.displayOrder || 0,
          file_size: arrayBuffer.byteLength,
          uploaded_by: userId || null,
        })
        .select()
        .single();

      if (mediaError) {
        console.error('Database insert error:', mediaError);
        // Clean up uploaded file if database insert fails
        await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
        throw new Error(`Database save failed: ${mediaError.message}`);
      }

      console.log('Image metadata saved:', mediaData);

      return {
        originalUrl: publicUrl,
        optimizedUrls,
        filePath: fileName,
        fileSize: arrayBuffer.byteLength,
        mediaId: mediaData?.id,
      };
    } catch (error) {
      console.error('Upload property image error:', error);
      throw error;
    }
  }

  /**
   * Alternative method using base64 (if needed for debugging)
   * Requires: expo install base64-arraybuffer
   */
  async uploadPropertyImageBase64Method(
    propertyId: string,
    imageUri: string,
    options?: {
      caption?: string;
      displayOrder?: number;
    }
  ): Promise<UploadResult> {
    try {
      console.log('Using base64 method for property:', propertyId);

      // Import dynamically to avoid dependency if not used
      const { decode } = await import('base64-arraybuffer');

      const optimizedImage = await this.optimizeImageForUpload(imageUri);
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substring(7);
      const fileName = `${propertyId}/${timestamp}_${randomId}.jpg`;

      // Read as base64
      const base64 = await FileSystem.readAsStringAsync(optimizedImage.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });

      // Decode to ArrayBuffer
      const arrayBuffer = decode(base64);

      // Upload to Supabase
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(fileName, arrayBuffer, {
          contentType: 'image/jpeg',
          cacheControl: this.CACHE_CONTROL,
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL and continue as before...
      const { data: { publicUrl } } = supabase.storage
        .from(this.BUCKET_NAME)
        .getPublicUrl(fileName);

      const optimizedUrls = {
        thumbnail: this.getTransformationUrl(publicUrl, { width: 300, height: 300, resize: 'cover' }),
        mobile: this.getTransformationUrl(publicUrl, { width: 640, quality: 80 }),
        desktop: this.getTransformationUrl(publicUrl, { width: 1280, quality: 85 }),
      };

      // Save to database...
      const { data: authData } = await supabase.auth.getUser();
      const { data: mediaData, error: mediaError } = await supabase
        .from('property_media')
        .insert({
          property_id: propertyId,
          file_type: 'image' as const,
          file_url: publicUrl,
          file_name: fileName,
          caption: options?.caption || null,
          display_order: options?.displayOrder || 0,
          file_size: arrayBuffer.byteLength,
          uploaded_by: authData?.user?.id || null,
        })
        .select()
        .single();

      if (mediaError) {
        await supabase.storage.from(this.BUCKET_NAME).remove([fileName]);
        throw mediaError;
      }

      return {
        originalUrl: publicUrl,
        optimizedUrls,
        filePath: fileName,
        fileSize: arrayBuffer.byteLength,
        mediaId: mediaData?.id,
      };
    } catch (error) {
      console.error('Base64 upload error:', error);
      throw error;
    }
  }

  /**
   * Optimize image for upload
   */
  private async optimizeImageForUpload(uri: string): Promise<{ uri: string; size: number }> {
    try {
      // First, just try to compress without resizing
      let compressed = await ImageManipulator.manipulateAsync(
        uri,
        [],
        { 
          compress: 0.8, 
          format: ImageManipulator.SaveFormat.JPEG 
        }
      );

      // Get the size by reading file info
      let size = 0;
      try {
        const fileInfo = await FileSystem.getInfoAsync(compressed.uri);
        if ('size' in fileInfo && typeof fileInfo.size === 'number') {
          size = fileInfo.size;
        }
      } catch (e) {
        // If we can't get size, estimate based on dimensions
        size = (compressed.width * compressed.height * 3) / 10; // Rough estimate
      }

      // If image is too large (>10MB), resize it
      if (size > this.MAX_FILE_SIZE || compressed.width > 3000 || compressed.height > 3000) {
        console.log('Image too large, resizing...');
        
        // Calculate new dimensions while maintaining aspect ratio
        const maxDimension = 2000;
        const { width, height } = compressed;
        let newWidth = width;
        let newHeight = height;

        if (width > height && width > maxDimension) {
          newWidth = maxDimension;
          newHeight = Math.round((height * maxDimension) / width);
        } else if (height > maxDimension) {
          newHeight = maxDimension;
          newWidth = Math.round((width * maxDimension) / height);
        }

        compressed = await ImageManipulator.manipulateAsync(
          uri,
          [{ resize: { width: newWidth, height: newHeight } }],
          { 
            compress: 0.7, 
            format: ImageManipulator.SaveFormat.JPEG 
          }
        );
        
        // Update size estimate
        size = (newWidth * newHeight * 3) / 12;
      }

      return { uri: compressed.uri, size };
    } catch (error) {
      console.error('Error optimizing image:', error);
      // Return original on error
      return { uri, size: 0 };
    }
  }

  /**
   * Generate transformation URL using Supabase's image transformation API
   */
  private getTransformationUrl(
    baseUrl: string,
    options: {
      width?: number;
      height?: number;
      resize?: 'cover' | 'contain' | 'fill';
      quality?: number;
    }
  ): string {
    const params = new URLSearchParams();
    
    if (options.width) params.append('width', options.width.toString());
    if (options.height) params.append('height', options.height.toString());
    if (options.resize) params.append('resize', options.resize);
    if (options.quality) params.append('quality', options.quality.toString());

    // Check if URL already has query parameters
    const separator = baseUrl.includes('?') ? '&' : '?';
    
    // For Supabase Storage v2, transformations work with the standard public URL
    // The transformation happens on-demand when the URL is accessed
    return `${baseUrl}${separator}${params.toString()}`;
  }

  /**
   * Upload multiple images in batch
   */
  async uploadMultipleImages(
    propertyId: string,
    imageUris: string[],
    onProgress?: (completed: number, total: number) => void
  ): Promise<UploadResult[]> {
    const results: UploadResult[] = [];
    const total = imageUris.length;

    for (let i = 0; i < imageUris.length; i++) {
      try {
        const result = await this.uploadPropertyImage(propertyId, imageUris[i], {
          displayOrder: i,
        });
        results.push(result);
        
        if (onProgress) {
          onProgress(i + 1, total);
        }
      } catch (error) {
        console.error(`Failed to upload image ${i + 1}:`, error);
        // Continue with other uploads even if one fails
      }
    }

    return results;
  }

  /**
   * Get optimized URL for different use cases
   */
  getOptimizedUrl(
    baseUrl: string,
    variant: 'thumbnail' | 'mobile' | 'desktop' | 'full' = 'desktop'
  ): string {
    // Check cache
    const cacheKey = `${baseUrl}-${variant}`;
    if (this.imageCache.has(cacheKey)) {
      return this.imageCache.get(cacheKey)!;
    }

    let optimizedUrl: string;

    switch (variant) {
      case 'thumbnail':
        optimizedUrl = this.getTransformationUrl(baseUrl, {
          width: 300,
          height: 300,
          resize: 'cover',
          quality: 70,
        });
        break;
      case 'mobile':
        optimizedUrl = this.getTransformationUrl(baseUrl, {
          width: 640,
          quality: 80,
        });
        break;
      case 'desktop':
        optimizedUrl = this.getTransformationUrl(baseUrl, {
          width: 1280,
          quality: 85,
        });
        break;
      case 'full':
        optimizedUrl = baseUrl;
        break;
    }

    // Cache the result
    this.imageCache.set(cacheKey, optimizedUrl);
    return optimizedUrl;
  }

  /**
   * Delete image from storage and database
   */
  async deletePropertyImage(mediaId: string): Promise<void> {
    try {
      // Get media record
      const { data: media, error: fetchError } = await supabase
        .from('property_media')
        .select('file_name')
        .eq('id', mediaId)
        .single();

      if (fetchError || !media) {
        throw new Error('Media not found');
      }

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(this.BUCKET_NAME)
        .remove([media.file_name]);

      if (storageError) {
        console.error('Storage deletion error:', storageError);
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('property_media')
        .delete()
        .eq('id', mediaId);

      if (dbError) {
        throw dbError;
      }
    } catch (error) {
      console.error('Delete property image error:', error);
      throw error;
    }
  }

  /**
   * Test upload function for debugging
   */
  async testSimpleUpload(imageUri: string): Promise<void> {
    try {
      console.log('Test upload starting...');
      
      // Method 1: Using fetch and Response
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const arrayBuffer = await new Response(blob).arrayBuffer();
      
      console.log('Blob size:', blob.size);
      console.log('ArrayBuffer byteLength:', arrayBuffer.byteLength);
      
      const testFileName = `test/${Date.now()}.jpg`;
      
      const { data, error } = await supabase.storage
        .from(this.BUCKET_NAME)
        .upload(testFileName, arrayBuffer, {
          contentType: 'image/jpeg',
        });
      
      if (error) {
        console.error('Test upload error:', error);
      } else {
        console.log('Test upload success:', data);
        
        // Clean up test file
        await supabase.storage.from(this.BUCKET_NAME).remove([testFileName]);
      }
    } catch (error) {
      console.error('Test failed:', error);
    }
  }

  /**
   * Clear image cache
   */
  clearCache(): void {
    this.imageCache.clear();
  }
}

export const imageService = ImageService.getInstance();

// Example usage:
/*
// In your component:
import { imageService } from './services/imageService';
import * as ImagePicker from 'expo-image-picker';

// Pick and upload image
const pickAndUploadImage = async (propertyId: string) => {
  try {
    // Pick image
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const imageUri = result.assets[0].uri;
      
      // Upload image
      const uploadResult = await imageService.uploadPropertyImage(propertyId, imageUri, {
        caption: 'Property front view',
        displayOrder: 0,
      });

      console.log('Upload successful:', uploadResult);
      
      // Use in your UI
      return uploadResult;
    }
  } catch (error) {
    console.error('Upload failed:', error);
    Alert.alert('Upload Failed', error.message);
  }
};
*/