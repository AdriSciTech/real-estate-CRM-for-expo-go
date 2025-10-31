// src/components/properties/PropertyImages.tsx - Fixed blob handling version

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Image,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';
import { supabase } from '../../services/supabase';
import { propertiesService } from '../../services/properties.service';
import { usePropertiesStore } from '../../store/propertiesStore';
import DraggableFlatList, {
  ScaleDecorator,
  RenderItemParams,
} from 'react-native-draggable-flatlist';
import { decode } from 'base64-arraybuffer';

interface PropertyImage {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string;
  display_order: number;
  caption?: string;
}

interface PropertyImagesProps {
  propertyId: string;
  images?: PropertyImage[];
  onImagesChange?: () => void;
  editable?: boolean;
  maxImages?: number;
}

const { width: screenWidth } = Dimensions.get('window');
const imageSize = (screenWidth - 40) / 3 - 10;

// Maximum file size in bytes (500KB for compressed images to stay under Supabase limits)
const MAX_IMAGE_SIZE = 500 * 1024;
// Target dimensions for resizing
const MAX_IMAGE_WIDTH = 1920;
const MAX_IMAGE_HEIGHT = 1920;
// Thumbnail dimensions
const THUMBNAIL_WIDTH = 300;
const THUMBNAIL_HEIGHT = 300;

export default function PropertyImages({
  propertyId,
  images = [],
  onImagesChange,
  editable = true,
  maxImages = 20,
}: PropertyImagesProps) {
  const [uploading, setUploading] = useState(false);
  const [localImages, setLocalImages] = useState<PropertyImage[]>(images);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<PropertyImage | null>(null);
  const [isReordering, setIsReordering] = useState(false);
  
  const { refreshPropertyMedia } = usePropertiesStore();

  // Update local images when prop changes
  useEffect(() => {
    setLocalImages(images.sort((a, b) => a.display_order - b.display_order));
  }, [images]);

  // Check authentication status
  const checkAuth = async () => {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      Alert.alert('Authentication Error', 'Please log in to upload images');
      return false;
    }
    return true;
  };

  const pickImages = async () => {
    try {
      // Check auth first
      if (!await checkAuth()) return;

      // Request permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to select images.');
        return;
      }

      const remainingSlots = maxImages - localImages.length;
      if (remainingSlots <= 0) {
        Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images per property.`);
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: remainingSlots,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets.length > 0) {
        await uploadImages(result.assets);
      }
    } catch (error) {
      console.error('Error picking images:', error);
      Alert.alert('Error', 'Failed to pick images');
    }
  };

  const takePhoto = async () => {
    try {
      // Check auth first
      if (!await checkAuth()) return;

      // Request camera permissions
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera permissions to take photos.');
        return;
      }

      if (localImages.length >= maxImages) {
        Alert.alert('Maximum Images', `You can only upload up to ${maxImages} images per property.`);
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        exif: false,
      });

      if (!result.canceled && result.assets[0]) {
        await uploadImages([result.assets[0]]);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo');
    }
  };

  // Replace the resizeImage function in PropertyImages.tsx with this:

const resizeImage = async (uri: string, targetSize: number = 50 * 1024): Promise<{ uri: string; width: number; height: number }> => {
  try {
    let currentUri = uri;
    
    // Get original dimensions
    const originalInfo = await ImageManipulator.manipulateAsync(uri, [], { format: ImageManipulator.SaveFormat.JPEG });
    let { width, height } = originalInfo;
    
    console.log(`Original image: ${width}x${height}`);
    
    // Much more aggressive sizing
    const MAX_DIMENSION = 800;
    
    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const ratio = Math.max(width / MAX_DIMENSION, height / MAX_DIMENSION);
      width = Math.round(width / ratio);
      height = Math.round(height / ratio);
    }
    
    // Start with very low quality
    let compressionQuality = 0.4;
    
    // Initial compression
    const resized = await ImageManipulator.manipulateAsync(
      currentUri,
      [{ resize: { width, height } }],
      { compress: compressionQuality, format: ImageManipulator.SaveFormat.JPEG }
    );
    currentUri = resized.uri;
    
    // Check file size
    let fileInfo = await FileSystem.getInfoAsync(currentUri);
    console.log(`After initial resize: ${fileInfo.exists && !fileInfo.isDirectory ? (fileInfo.size / 1024).toFixed(2) : '0'} KB`);
    
    // Keep reducing until under 50KB
    let attempts = 0;
    while (fileInfo.exists && !fileInfo.isDirectory && fileInfo.size > targetSize && attempts < 5) {
      compressionQuality -= 0.1;
      
      // If still too large after 2 attempts, reduce dimensions more
      if (attempts >= 2) {
        width = Math.round(width * 0.7);
        height = Math.round(height * 0.7);
        console.log(`Reducing dimensions to: ${width}x${height}`);
      }
      
      const compressed = await ImageManipulator.manipulateAsync(
        currentUri,
        [{ resize: { width, height } }],
        { compress: Math.max(compressionQuality, 0.1), format: ImageManipulator.SaveFormat.JPEG }
      );
      
      currentUri = compressed.uri;
      fileInfo = await FileSystem.getInfoAsync(currentUri);
      console.log(`Attempt ${attempts + 1}: ${fileInfo.exists && !fileInfo.isDirectory ? (fileInfo.size / 1024).toFixed(2) : '0'} KB (quality: ${compressionQuality})`);
      attempts++;
    }
    
    console.log(`Final image: ${width}x${height}, ${fileInfo.exists && !fileInfo.isDirectory ? (fileInfo.size / 1024).toFixed(2) : '0'} KB`);
    return { uri: currentUri, width, height };
  } catch (error) {
    console.error('Error resizing image:', error);
    throw error;
  }
};

// Also update the constants at the top of the file:
const MAX_IMAGE_SIZE = 50 * 1024; // 50KB to be safe
const MAX_IMAGE_WIDTH = 800;
const MAX_IMAGE_HEIGHT = 800;
const THUMBNAIL_WIDTH = 150;
const THUMBNAIL_HEIGHT = 150;

  // Helper function to convert file to base64
  const fileToBase64 = async (uri: string): Promise<string> => {
    try {
      const base64 = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return base64;
    } catch (error) {
      console.error('Error converting to base64:', error);
      throw error;
    }
  };

  const uploadImages = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setUploading(true);
    const uploadedImages: PropertyImage[] = [];
    const currentMaxOrder = Math.max(...localImages.map(img => img.display_order), -1);

    try {
      // Check authentication
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('No authenticated user');
      }

      for (let i = 0; i < assets.length; i++) {
        const asset = assets[i];
        const timestamp = Date.now() + i;
        
        try {
          console.log(`Processing image ${i + 1}/${assets.length}...`);
          
          // Resize and compress image to stay under size limits
          const resized = await resizeImage(asset.uri, MAX_IMAGE_SIZE);
          
          // Generate filenames
          const mainFileName = `${propertyId}/${timestamp}_main.jpg`;
          const thumbFileName = `${propertyId}/${timestamp}_thumb.jpg`;
          const mainFilePath = `property-images/${mainFileName}`;
          const thumbFilePath = `property-images/${thumbFileName}`;

          // Create thumbnail with aggressive compression
          const thumbnail = await ImageManipulator.manipulateAsync(
            resized.uri,
            [{ resize: { width: THUMBNAIL_WIDTH, height: THUMBNAIL_HEIGHT } }],
            { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
          );

          // Convert to base64 and then to ArrayBuffer
          console.log('Converting main image to base64...');
          const mainBase64 = await fileToBase64(resized.uri);
          const mainArrayBuffer = decode(mainBase64);
          
          console.log('Main image size:', mainArrayBuffer.byteLength, 'bytes');
          
          // Upload main image
          const { error: mainError } = await supabase.storage
            .from('properties')
            .upload(mainFilePath, mainArrayBuffer, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false,
            });

          if (mainError) {
            console.error('Main upload error:', mainError);
            throw mainError;
          }

          // Convert thumbnail to base64 and then to ArrayBuffer
          console.log('Converting thumbnail to base64...');
          const thumbBase64 = await fileToBase64(thumbnail.uri);
          const thumbArrayBuffer = decode(thumbBase64);
          
          console.log('Thumbnail size:', thumbArrayBuffer.byteLength, 'bytes');
          
          // Upload thumbnail
          const { error: thumbError } = await supabase.storage
            .from('properties')
            .upload(thumbFilePath, thumbArrayBuffer, {
              contentType: 'image/jpeg',
              cacheControl: '3600',
              upsert: false,
            });

          if (thumbError) {
            console.error('Thumbnail upload error:', thumbError);
            // Delete main image if thumbnail fails
            await supabase.storage.from('properties').remove([mainFilePath]);
            throw thumbError;
          }

          // Get public URLs
          const { data: { publicUrl: mainUrl } } = supabase.storage
            .from('properties')
            .getPublicUrl(mainFilePath);
          
          const { data: { publicUrl: thumbUrl } } = supabase.storage
            .from('properties')
            .getPublicUrl(thumbFilePath);

          console.log('Main URL:', mainUrl);
          console.log('Thumb URL:', thumbUrl);

          // Save to database using the service
          const mediaData = await propertiesService.addPropertyMedia(propertyId, {
            file_type: 'image',
            file_url: mainUrl,
            file_name: `image_${timestamp}.jpg`,
            caption: thumbUrl, // Store thumbnail URL in caption
            display_order: currentMaxOrder + i + 1,
          });

          uploadedImages.push({
            id: mediaData.id,
            file_name: mediaData.file_name || '',
            file_url: mediaData.file_url,
            file_type: 'image',
            display_order: mediaData.display_order,
            caption: mediaData.caption || undefined,
          });
          
          console.log(`Image ${i + 1} uploaded successfully`);
        } catch (imageError) {
          console.error(`Error uploading image ${i + 1}:`, imageError);
          throw imageError;
        }
      }

      // Update local state
      setLocalImages(prev => [...prev, ...uploadedImages]);
      
      // Notify parent and refresh property data in store
      onImagesChange?.();
      await refreshPropertyMedia(propertyId);
      
      Alert.alert(
        'Success', 
        `${uploadedImages.length} image${uploadedImages.length > 1 ? 's' : ''} uploaded successfully`
      );
      
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed', 
        error instanceof Error ? error.message : 'An unknown error occurred'
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (image: PropertyImage) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(image.id);
            try {
              // Check auth first
              if (!await checkAuth()) {
                setDeletingId(null);
                return;
              }

              await propertiesService.deletePropertyMedia(image.id);
              
              setLocalImages(prev => prev.filter(img => img.id !== image.id));
              onImagesChange?.();
              await refreshPropertyMedia(propertyId);
              
              Alert.alert('Success', 'Image deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete image. Please ensure you have permission.');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const onDragEnd = async ({ data }: { data: PropertyImage[] }) => {
    setLocalImages(data);
    
    // Update display orders
    const updates = data.map((image, index) => ({
      id: image.id,
      display_order: index,
    }));

    try {
      await propertiesService.reorderPropertyMedia(propertyId, updates);
      onImagesChange?.();
      await refreshPropertyMedia(propertyId);
    } catch (error) {
      console.error('Error reordering images:', error);
      Alert.alert('Error', 'Failed to save image order');
      // Revert to original order
      setLocalImages(images.sort((a, b) => a.display_order - b.display_order));
    }
  };

  const renderImage = ({ item, drag, isActive }: RenderItemParams<PropertyImage>) => {
    const isDeleting = deletingId === item.id;
    const thumbnailUrl = item.caption && item.caption.includes('thumb') ? item.caption : item.file_url;

    return (
      <ScaleDecorator>
        <TouchableOpacity
          onPress={() => !isReordering && setSelectedImage(item)}
          onLongPress={editable ? drag : undefined}
          disabled={isActive || isDeleting}
          style={[
            styles.imageContainer,
            isActive && styles.imageContainerActive,
            isDeleting && styles.imageContainerDeleting,
          ]}
        >
          <Image source={{ uri: thumbnailUrl }} style={styles.image} />
          {editable && !isReordering && (
            <TouchableOpacity
              style={styles.deleteImageButton}
              onPress={() => deleteImage(item)}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Icon name="close" size={20} color="white" />
              )}
            </TouchableOpacity>
          )}
          {isReordering && (
            <View style={styles.dragHandle}>
              <Icon name="drag-handle" size={24} color="white" />
            </View>
          )}
        </TouchableOpacity>
      </ScaleDecorator>
    );
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Take Photo', onPress: takePhoto },
        { text: 'Choose from Gallery', onPress: pickImages },
        { text: 'Cancel', style: 'cancel' },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>
          Images ({localImages.length}/{maxImages})
        </Text>
        <View style={styles.headerButtons}>
          {editable && localImages.length > 1 && (
            <Button
              title={isReordering ? "Done" : "Reorder"}
              onPress={() => setIsReordering(!isReordering)}
              type="outline"
              buttonStyle={styles.reorderButton}
              titleStyle={styles.reorderButtonText}
            />
          )}
          {editable && localImages.length < maxImages && (
            <Button
              title="Add Images"
              onPress={showImageOptions}
              loading={uploading}
              disabled={uploading}
              icon={<Icon name="add-a-photo" size={20} color="white" style={{ marginRight: 5 }} />}
              buttonStyle={styles.addButton}
              titleStyle={styles.addButtonText}
            />
          )}
        </View>
      </View>

      {localImages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="image" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No images uploaded</Text>
          {editable && (
            <Text style={styles.emptySubtext}>
              Tap "Add Images" to upload photos
            </Text>
          )}
        </View>
      ) : (
        <DraggableFlatList
          data={localImages}
          onDragEnd={onDragEnd}
          keyExtractor={(item) => item.id}
          renderItem={renderImage}
          horizontal={false}
          numColumns={3}
          scrollEnabled={!isReordering}
          contentContainerStyle={styles.imageGrid}
        />
      )}

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#2089dc" />
          <Text style={styles.uploadingText}>Uploading images...</Text>
        </View>
      )}

      {/* Full screen image viewer */}
      <Modal
        visible={!!selectedImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedImage(null)}
      >
        <TouchableOpacity
          style={styles.modalContainer}
          activeOpacity={1}
          onPress={() => setSelectedImage(null)}
        >
          <View style={styles.modalContent}>
            {selectedImage && (
              <Image
                source={{ uri: selectedImage.file_url }}
                style={styles.fullImage}
                resizeMode="contain"
              />
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedImage(null)}
            >
              <Icon name="close" size={30} color="white" />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43484d',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  addButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
  },
  addButtonText: {
    fontSize: 14,
  },
  reorderButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderColor: '#2089dc',
  },
  reorderButtonText: {
    fontSize: 14,
    color: '#2089dc',
  },
  imageGrid: {
    paddingBottom: 20,
  },
  imageContainer: {
    width: imageSize,
    height: imageSize,
    margin: 5,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  imageContainerActive: {
    opacity: 0.8,
    transform: [{ scale: 1.05 }],
  },
  imageContainerDeleting: {
    opacity: 0.5,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  deleteImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(255, 77, 79, 0.9)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragHandle: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 5,
    alignItems: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  emptyText: {
    marginTop: 10,
    color: '#86939e',
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: 5,
    color: '#bdc6cf',
    fontSize: 14,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  uploadingText: {
    marginTop: 10,
    color: '#2089dc',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullImage: {
    width: '100%',
    height: '80%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 10,
  },
});