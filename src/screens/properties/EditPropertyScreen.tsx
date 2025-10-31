// src/screens/properties/EditPropertyScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Switch,
  Text,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, ButtonGroup, Header } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PropertiesStackScreenProps } from '../../types/navigation.types';
import { usePropertiesStore } from '../../store/propertiesStore';
import { useCollaboratorsStore } from '../../store/collaboratorsStore';
import { Database } from '../../types/database.types';
import PropertyImages from '../../components/properties/PropertyImages';
import PropertyDocuments from '../../components/properties/PropertyDocuments';
import { propertiesService } from '../../services/properties.service';

type PropertyUpdate = Database['public']['Tables']['properties']['Update'];
type Collaborator = Database['public']['Tables']['collaborators']['Row'];
type PropertyMedia = Database['public']['Tables']['property_media']['Row'];

interface PropertyFormData extends PropertyUpdate {
  source_type?: 'landlord' | 'developer' | 'partner' | null;
  source_collaborator_id?: string | null;
}

const schema = yup.object({
  title: yup.string().optional(),
  description: yup.string().nullable().optional(),
  price: yup.number().positive('Price must be positive').nullable().optional(),
  property_type: yup.string().oneOf(['apartment', 'house', 'commercial', 'land']).optional(),
  address: yup.string().optional(),
  city: yup.string().optional(),
  postal_code: yup.string().optional(),
  bedrooms: yup.number().min(0).nullable().optional(),
  bathrooms: yup.number().min(0).nullable().optional(),
  square_meters: yup.number().positive().nullable().optional(),
  floor_number: yup.number().nullable().optional(),
  total_floors: yup.number().nullable().optional(),
  has_terrace: yup.boolean().optional(),
  has_garden: yup.boolean().optional(),
  has_parking: yup.boolean().optional(),
  has_elevator: yup.boolean().optional(),
  source_type: yup.string().nullable().oneOf(['landlord', 'developer', 'partner', null]).optional(),
  source_collaborator_id: yup.string().nullable().optional(),
}).shape({}) as yup.ObjectSchema<Partial<PropertyFormData>>;

const propertyTypes = ['apartment', 'house', 'commercial', 'land'];
const energyRatings = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
const conditions = ['new', 'good', 'needs_renovation'];
const statusOptions = ['available', 'reserved', 'sold', 'rented'];
const sourceTypes = ['landlord', 'developer', 'partner'] as const;

export default function EditPropertyScreen({ 
  navigation,
  route 
}: PropertiesStackScreenProps<'EditProperty'>) {
  const { propertyId } = route.params;
  const { selectedProperty, getProperty, updateProperty, isLoading, refreshPropertyMedia } = usePropertiesStore();
  const { collaborators, fetchCollaborators } = useCollaboratorsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [propertyImages, setPropertyImages] = useState<PropertyMedia[]>([]);
  const [propertyDocuments, setPropertyDocuments] = useState<PropertyMedia[]>([]);
  const [filteredCollaborators, setFilteredCollaborators] = useState<Collaborator[]>([]);

  const [selectedTypeIndex, setSelectedTypeIndex] = useState(0);
  const [selectedEnergyIndex, setSelectedEnergyIndex] = useState(-1);
  const [selectedConditionIndex, setSelectedConditionIndex] = useState(1);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<PropertyFormData>({
    resolver: yupResolver(schema),
  });

  const sourceType = watch('source_type');

  useEffect(() => {
    getProperty(propertyId);
    loadPropertyMedia();
    fetchCollaborators();
  }, [propertyId]);

  const loadPropertyMedia = async () => {
    try {
      const media = await propertiesService.getPropertyMedia(propertyId);
      setPropertyImages(media.filter(item => item.file_type === 'image'));
      setPropertyDocuments(media.filter(item => item.file_type === 'document'));
    } catch (error) {
      console.error('Error loading media:', error);
    }
  };

  const handleImagesChange = async () => {
    await loadPropertyMedia();
    await refreshPropertyMedia(propertyId);
  };

  const handleDocumentsChange = async () => {
    await loadPropertyMedia();
    await refreshPropertyMedia(propertyId);
  };

  // Filter collaborators based on source type
  useEffect(() => {
    if (!sourceType) {
      setFilteredCollaborators([]);
      return;
    }

    let filtered: Collaborator[] = [];
    
    switch (sourceType) {
      case 'landlord':
        filtered = collaborators.filter(c => c.type === 'landlord');
        break;
      case 'developer':
        filtered = collaborators.filter(c => c.type === 'developer');
        break;
      case 'partner':
        filtered = collaborators.filter(c => c.type === 'agency' || c.type === 'other');
        break;
    }
    
    setFilteredCollaborators(filtered);
    
    // Check if current collaborator is still valid for the selected source type
    const currentCollaboratorId = watch('source_collaborator_id');
    if (currentCollaboratorId && !filtered.find(c => c.id === currentCollaboratorId)) {
      setValue('source_collaborator_id', null);
    }
  }, [sourceType, collaborators]);

  useEffect(() => {
    if (selectedProperty && selectedProperty.id === propertyId) {
      // Set form values
      reset({
        title: selectedProperty.title,
        description: selectedProperty.description || '',
        price: selectedProperty.price,
        property_type: selectedProperty.property_type as any,
        address: selectedProperty.address || '',
        city: selectedProperty.city || '',
        postal_code: selectedProperty.postal_code || '',
        country: selectedProperty.country,
        bedrooms: selectedProperty.bedrooms,
        bathrooms: selectedProperty.bathrooms,
        square_meters: selectedProperty.square_meters,
        floor_number: selectedProperty.floor_number,
        total_floors: selectedProperty.total_floors,
        has_terrace: selectedProperty.has_terrace,
        has_garden: selectedProperty.has_garden,
        has_parking: selectedProperty.has_parking,
        has_elevator: selectedProperty.has_elevator,
        status: selectedProperty.status,
        condition: selectedProperty.condition as any,
        source_type: selectedProperty.source_type,
        source_collaborator_id: selectedProperty.source_collaborator_id,
      });

      // Set button indices
      setSelectedTypeIndex(propertyTypes.indexOf(selectedProperty.property_type || 'apartment'));
      setSelectedEnergyIndex(selectedProperty.energy_rating ? energyRatings.indexOf(selectedProperty.energy_rating) : -1);
      setSelectedConditionIndex(conditions.indexOf(selectedProperty.condition || 'good'));
      setSelectedStatusIndex(statusOptions.indexOf(selectedProperty.status || 'available'));
    }
  }, [selectedProperty, propertyId, reset]);

  const onSubmit = async (data: PropertyFormData) => {
    try {
      setIsSubmitting(true);
      const updateData = {
        ...data,
        property_type: propertyTypes[selectedTypeIndex] as any,
        energy_rating: selectedEnergyIndex >= 0 ? energyRatings[selectedEnergyIndex] as any : null,
        condition: conditions[selectedConditionIndex] as any,
        status: statusOptions[selectedStatusIndex],
        source_type: data.source_type,
        source_collaborator_id: data.source_collaborator_id,
      };

      await updateProperty(propertyId, updateData);
      Alert.alert('Success', 'Property updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update property. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !selectedProperty) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          leftComponent={
            <Icon 
              name="arrow-back" 
              size={24} 
              color="white" 
              onPress={() => navigation.goBack()} 
            />
          }
          centerComponent={{ text: 'Edit Property', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
          backgroundColor="#2089dc"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2089dc" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        leftComponent={
          <Icon 
            name="arrow-back" 
            size={24} 
            color="white" 
            onPress={() => navigation.goBack()} 
          />
        }
        centerComponent={{ text: 'Edit Property', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
            {/* Images Section - Added at the top */}
            <Text style={styles.sectionTitle}>Property Images</Text>
            <Text style={styles.sectionSubtitle}>
              Add high-quality images to attract more views
            </Text>
            <PropertyImages
              propertyId={propertyId}
              images={propertyImages}
              onImagesChange={handleImagesChange}
              editable={true}
              maxImages={20}
            />

            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Title *"
                  placeholder="Beautiful apartment in city center"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.title?.message}
                />
              )}
            />

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description"
                  placeholder="Property description..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ''}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />

            <Text style={styles.label}>Status</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedStatusIndex(index);
                setValue('status', statusOptions[index]);
              }}
              selectedIndex={selectedStatusIndex}
              buttons={statusOptions.map(status => status.charAt(0).toUpperCase() + status.slice(1))}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
            />

            <Text style={styles.label}>Property Type</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedTypeIndex(index);
                setValue('property_type', propertyTypes[index] as any);
              }}
              selectedIndex={selectedTypeIndex}
              buttons={propertyTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1))}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
            />

            <Controller
              control={control}
              name="price"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Price (€)"
                  placeholder="250000"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text ? parseFloat(text) : null)}
                  value={value?.toString() || ''}
                  keyboardType="numeric"
                  errorMessage={errors.price?.message}
                />
              )}
            />

            <Text style={styles.sectionTitle}>Property Source</Text>

            <Controller
              control={control}
              name="source_type"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Source Type</Text>
                  <View style={styles.picker}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={Platform.OS === 'ios' ? { height: 180 } : {}}
                    >
                      <Picker.Item label="Select Source Type" value={null} />
                      <Picker.Item label="Landlord" value="landlord" />
                      <Picker.Item label="Developer" value="developer" />
                      <Picker.Item label="Partner/Agency" value="partner" />
                    </Picker>
                  </View>
                </View>
              )}
            />

            {sourceType && (
              <Controller
                control={control}
                name="source_collaborator_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>
                      {sourceType === 'landlord' ? 'Landlord' : 
                       sourceType === 'developer' ? 'Developer' : 
                       'Partner/Agency'}
                    </Text>
                    <View style={styles.picker}>
                      <Picker
                        selectedValue={value}
                        onValueChange={onChange}
                        style={Platform.OS === 'ios' ? { height: 180 } : {}}
                      >
                        <Picker.Item 
                          label={`Select ${sourceType === 'partner' ? 'Partner/Agency' : sourceType}`} 
                          value={null} 
                        />
                        {filteredCollaborators.map((collaborator) => (
                          <Picker.Item
                            key={collaborator.id}
                            label={collaborator.company_name || collaborator.name}
                            value={collaborator.id}
                          />
                        ))}
                      </Picker>
                    </View>
                    {filteredCollaborators.length === 0 && (
                      <Text style={styles.helperText}>
                        No {sourceType === 'partner' ? 'partners/agencies' : sourceType + 's'} found. 
                        Please add one in the Collaborators section.
                      </Text>
                    )}
                  </View>
                )}
              />
            )}

            <Text style={styles.sectionTitle}>Location</Text>

            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Address"
                  placeholder="123 Main Street"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ''}
                />
              )}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="city"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="City"
                    placeholder="Madrid"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    containerStyle={styles.halfInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="postal_code"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Postal Code"
                    placeholder="28001"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    value={value || ''}
                    containerStyle={styles.halfInput}
                  />
                )}
              />
            </View>

            <Text style={styles.sectionTitle}>Property Details</Text>

            <View style={styles.row}>
              <Controller
                control={control}
                name="bedrooms"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Bedrooms"
                    placeholder="3"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? parseInt(text) : null)}
                    value={value?.toString() || ''}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="bathrooms"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Bathrooms"
                    placeholder="2"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? parseInt(text) : null)}
                    value={value?.toString() || ''}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />
                )}
              />
            </View>

            <Controller
              control={control}
              name="square_meters"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Square Meters"
                  placeholder="120"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text ? parseInt(text) : null)}
                  value={value?.toString() || ''}
                  keyboardType="numeric"
                />
              )}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="floor_number"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Floor Number"
                    placeholder="3"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? parseInt(text) : null)}
                    value={value?.toString() || ''}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="total_floors"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Total Floors"
                    placeholder="5"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? parseInt(text) : null)}
                    value={value?.toString() || ''}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />
                )}
              />
            </View>

            <Text style={styles.label}>Condition</Text>
            <ButtonGroup
              onPress={setSelectedConditionIndex}
              selectedIndex={selectedConditionIndex}
              buttons={['New', 'Good', 'Needs Renovation']}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
            />

            <Text style={styles.label}>Energy Rating</Text>
            <ButtonGroup
              onPress={setSelectedEnergyIndex}
              selectedIndex={selectedEnergyIndex}
              buttons={energyRatings}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
            />

            <Text style={styles.sectionTitle}>Features</Text>

            <Controller
              control={control}
              name="has_parking"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Parking</Text>
                  <Switch
                    value={value || false}
                    onValueChange={onChange}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={value ? '#2089dc' : '#f4f3f4'}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="has_elevator"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Elevator</Text>
                  <Switch
                    value={value || false}
                    onValueChange={onChange}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={value ? '#2089dc' : '#f4f3f4'}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="has_terrace"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Terrace</Text>
                  <Switch
                    value={value || false}
                    onValueChange={onChange}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={value ? '#2089dc' : '#f4f3f4'}
                  />
                </View>
              )}
            />

            <Controller
              control={control}
              name="has_garden"
              render={({ field: { onChange, value } }) => (
                <View style={styles.switchRow}>
                  <Text style={styles.switchLabel}>Garden</Text>
                  <Switch
                    value={value || false}
                    onValueChange={onChange}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={value ? '#2089dc' : '#f4f3f4'}
                  />
                </View>
              )}
            />

            <Text style={styles.sectionTitle}>Property Documents</Text>
            <Text style={styles.sectionSubtitle}>
              Floor plans, energy certificates, and other documents
            </Text>
            <PropertyDocuments
              propertyId={propertyId}
              documents={propertyDocuments}
              onDocumentsChange={handleDocumentsChange}
              editable={true}
            />

            <Button
              title="Update Property"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting}
              disabled={isSubmitting}
              buttonStyle={styles.submitButton}
              titleStyle={styles.submitButtonText}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  form: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43484d',
    marginTop: 20,
    marginBottom: 15,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#86939e',
    marginBottom: 15,
    marginLeft: 10,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#86939e',
    marginBottom: 10,
    marginLeft: 10,
  },
  buttonGroup: {
    borderRadius: 8,
    marginBottom: 20,
  },
  selectedButton: {
    backgroundColor: '#2089dc',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  switchLabel: {
    fontSize: 16,
    color: '#43484d',
  },
  submitButton: {
    borderRadius: 25,
    paddingVertical: 15,
    backgroundColor: '#2089dc',
    marginTop: 30,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  pickerContainer: {
    marginBottom: 20,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#86939e',
    marginBottom: 10,
    marginLeft: 10,
  },
  picker: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    marginHorizontal: 10,
  },
  helperText: {
    fontSize: 12,
    color: '#86939e',
    marginTop: 5,
    marginLeft: 10,
    fontStyle: 'italic',
  },
});