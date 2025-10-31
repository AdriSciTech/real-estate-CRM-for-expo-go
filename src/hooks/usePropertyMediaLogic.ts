// src/screens/properties/AddPropertyScreen/hooks/usePropertyMediaLogic.ts

import { useState } from 'react';
import { PropertyMedia } from '../screens/properties/AddPropertyScreen/AddPropertyScreen.types';
import { propertiesService } from '../services/properties.service';

export const usePropertyMediaLogic = () => {
  const [propertyImages, setPropertyImages] = useState<PropertyMedia[]>([]);
  const [propertyDocuments, setPropertyDocuments] = useState<PropertyMedia[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const fetchPropertyMedia = async (propertyId: string) => {
    if (!propertyId) return;
    
    setLoadingImages(true);
    try {
      const mediaData = await propertiesService.getPropertyMedia(propertyId);
      const images = mediaData.filter(m => m.file_type === 'image');
      const documents = mediaData.filter(m => m.file_type === 'document');
      
      setPropertyImages(images);
      setPropertyDocuments(documents);
    } catch (error) {
      console.error('Error fetching property media:', error);
    } finally {
      setLoadingImages(false);
    }
  };

  const handleImagesChange = async () => {
    // This will be called by PropertyImages component when images are added/removed
    // The component should handle the refresh internally, but we can force a refresh if needed
  };

  const handleDocumentsChange = async () => {
    // This will be called by PropertyDocuments component when documents are added/removed
    // The component should handle the refresh internally, but we can force a refresh if needed
  };

  return {
    propertyImages,
    propertyDocuments,
    loadingImages,
    fetchPropertyMedia,
    handleImagesChange,
    handleDocumentsChange,
    setPropertyImages,
    setPropertyDocuments,
  };
};

