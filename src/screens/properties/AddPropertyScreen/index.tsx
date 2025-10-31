//src\screens\properties\AddPropertyScreen\index.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';

import { PropertiesStackScreenProps } from '../../../types/navigation.types';
import { usePropertiesStore } from '../../../store/propertiesStore';
import { useCollaboratorsStore } from '../../../store/collaboratorsStore';
import { propertiesService } from '../../../services/properties.service';

import { PropertyFormData, PropertyInsert, CurrentStep } from './AddPropertyScreen.types';
import { propertyFormSchema, propertyTypes, conditions, energyRatings } from './AddPropertyScreen.constants';
import { styles } from './AddPropertyScreen.styles';

import { ProgressIndicator } from './components/ProgressIndicator';
import { PropertyForm } from './components/PropertyForm';
import { MediaUploadStep } from './components/MediaUploadStep';
import { usePropertySourceLogic } from '../../../hooks/usePropertySourceLogic';
import { usePropertyMediaLogic } from '../../../hooks/usePropertyMediaLogic';


export default function AddPropertyScreen({ 
  navigation,
  route 
}: PropertiesStackScreenProps<'AddProperty'>) {
  const { createProperty, isLoading } = usePropertiesStore();
  const { collaborators, fetchCollaborators } = useCollaboratorsStore();
  
  const [currentStep, setCurrentStep] = useState<CurrentStep>('form');
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [selectedEnergyIndex, setSelectedEnergyIndex] = useState(-1);
  const [selectedConditionIndex, setSelectedConditionIndex] = useState(1);
  const [createdPropertyId, setCreatedPropertyId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: yupResolver(propertyFormSchema),
    defaultValues: {
      title: '',
      description: '',
      price: null,
      property_type: 'apartment',
      address: '',
      city: '',
      postal_code: '',
      bedrooms: null,
      bathrooms: null,
      square_meters: null,
      floor_number: null,
      total_floors: null,
      has_terrace: false,
      has_garden: false,
      has_parking: false,
      has_elevator: false,
      source_type: null,
      source_collaborator_id: route.params?.collaboratorId || null,
    },
  });

  const { filteredCollaborators } = usePropertySourceLogic({
    sourceType: watch('source_type'),
    collaborators,
    setValue,
    watch,
    collaboratorId: route.params?.collaboratorId,
  });

  const {
    propertyImages,
    propertyDocuments,
    loadingImages,
    fetchPropertyMedia,
    handleImagesChange,
    handleDocumentsChange,
  } = usePropertyMediaLogic();

  useEffect(() => {
    fetchCollaborators();
  }, []);

  const onSubmit = async (data: PropertyFormData) => {
    try {
      const propertyData: PropertyInsert = {
        user_id: '', // This will be set by the store
        title: data.title,
        description: data.description || null,
        price: data.price,
        property_type: propertyTypes[selectedTypeIndex],
        address: data.address || null,
        city: data.city || null,
        postal_code: data.postal_code || null,
        country: 'Spain',
        bedrooms: data.bedrooms,
        bathrooms: data.bathrooms,
        square_meters: data.square_meters,
        floor_number: data.floor_number,
        total_floors: data.total_floors,
        has_terrace: data.has_terrace,
        has_garden: data.has_garden,
        has_parking: data.has_parking,
        has_elevator: data.has_elevator,
        status: 'available',
        price_currency: 'EUR',
        condition: conditions[selectedConditionIndex],
        energy_rating: selectedEnergyIndex >= 0 ? energyRatings[selectedEnergyIndex] : null,
        source_type: data.source_type,
        source_collaborator_id: data.source_collaborator_id,
        location: `${data.city || ''}, ${data.address || ''}`.trim() || null,
      };

      console.log('Submitting property data:', propertyData);

      const newProperty = await createProperty(propertyData);
      setCreatedPropertyId(newProperty.id);
      setCurrentStep('media');
      await fetchPropertyMedia(newProperty.id);
    } catch (error) {
      console.error('Error creating property:', error);
      Alert.alert('Error', 'Failed to create property. Please try again.');
    }
  };

  const handleFinish = async () => {
    if (propertyImages.length === 0) {
      Alert.alert(
        'No Images Added',
        'Properties with images get 3x more views. Are you sure you want to continue without images?',
        [
          { text: 'Add Images', style: 'cancel' },
          { 
            text: 'Continue Without Images', 
            onPress: async () => {
              // Refresh the properties list to include the new property
              await usePropertiesStore.getState().fetchProperties();
              Alert.alert('Success', 'Property created successfully!');
              navigation.goBack();
            }
          },
        ]
      );
    } else {
      // Refresh the properties list to include the new property with images
      await usePropertiesStore.getState().fetchProperties();
      Alert.alert('Success', 'Property created successfully!');
      navigation.goBack();
    }
  };

  const handleBack = () => {
    if (currentStep === 'media') {
      Alert.alert(
        'Go Back?',
        'You will lose any uploaded images. Are you sure?',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Go Back', 
            style: 'destructive',
            onPress: () => setCurrentStep('form')
          },
        ]
      );
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Header
        leftComponent={
          <Icon 
            name="arrow-back" 
            size={24} 
            color="white" 
            onPress={handleBack} 
          />
        }
        centerComponent={{ 
          text: currentStep === 'form' ? 'Add Property' : 'Add Images & Documents', 
          style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } 
        }}
        backgroundColor="#2089dc"
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.form}>
            <ProgressIndicator
              currentStep={currentStep === 'form' ? 1 : 2}
              totalSteps={2}
              stepText={`Step ${currentStep === 'form' ? 1 : 2} of 2: ${
                currentStep === 'form' ? 'Property Details' : 'Images & Documents'
              }`}
            />

            {currentStep === 'form' ? (
              <PropertyForm
                control={control}
                errors={errors}
                selectedTypeIndex={selectedTypeIndex}
                setSelectedTypeIndex={setSelectedTypeIndex}
                selectedEnergyIndex={selectedEnergyIndex}
                setSelectedEnergyIndex={setSelectedEnergyIndex}
                selectedConditionIndex={selectedConditionIndex}
                setSelectedConditionIndex={setSelectedConditionIndex}
                filteredCollaborators={filteredCollaborators}
                sourceType={watch('source_type')}
                setValue={setValue}
                onSubmit={handleSubmit(onSubmit)}
                isLoading={isLoading}
              />
            ) : (
              createdPropertyId && (
                <MediaUploadStep
                  propertyId={createdPropertyId}
                  propertyImages={propertyImages}
                  propertyDocuments={propertyDocuments}
                  onImagesChange={handleImagesChange}
                  onDocumentsChange={handleDocumentsChange}
                  onSkip={() => {
                    Alert.alert(
                      'Skip Images?',
                      'Properties with images get more views. Are you sure you want to skip?',
                      [
                        { text: 'Cancel', style: 'cancel' },
                        { 
                          text: 'Skip', 
                          onPress: async () => {
                            await usePropertiesStore.getState().fetchProperties();
                            Alert.alert('Success', 'Property created successfully!');
                            navigation.goBack();
                          }
                        },
                      ]
                    );
                  }}
                  onFinish={handleFinish}
                />
              )
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}