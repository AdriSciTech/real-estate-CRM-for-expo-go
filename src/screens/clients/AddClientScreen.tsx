// src/screens/clients/AddClientScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, ButtonGroup, Header } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { ClientsStackScreenProps } from '../../types/navigation.types';
import { useClientsStore } from '../../store/clientsStore';
import { useCollaboratorsStore } from '../../store/collaboratorsStore';
import { Database } from '../../types/database.types';

type ClientInsert = Database['public']['Tables']['clients']['Insert'];
type Collaborator = Database['public']['Tables']['collaborators']['Row'];

interface ClientFormData {
  name: string;
  email?: string;
  phone?: string;
  budget_min: number | null;
  budget_max: number | null;
  preferred_locations?: string;
  property_type: 'apartment' | 'house' | 'commercial' | 'land' | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  bathrooms_min: number | null;
  source_type: 'direct' | 'partner' | 'referral' | 'website' | null;
  source_collaborator_id: string | null;
  priority: 'high' | 'medium' | 'low';
  notes?: string;
}

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').optional(),
  phone: yup.string().optional(),
  budget_min: yup.number().positive().nullable().optional(),
  budget_max: yup.number().positive().nullable().optional(),
  preferred_locations: yup.string().optional(),
  property_type: yup.string().nullable().oneOf(['apartment', 'house', 'commercial', 'land', null]).optional(),
  bedrooms_min: yup.number().min(0).nullable().optional(),
  bedrooms_max: yup.number().min(0).nullable().optional(),
  bathrooms_min: yup.number().min(0).nullable().optional(),
  source_type: yup.string().nullable().oneOf(['direct', 'partner', 'referral', 'website', null]).optional(),
  source_collaborator_id: yup.string().nullable().optional(),
  priority: yup.string().oneOf(['high', 'medium', 'low']).default('medium'),
  notes: yup.string().optional(),
});

const propertyTypes = ['apartment', 'house', 'commercial', 'land'] as const;
const sourceTypes = ['direct', 'partner', 'referral', 'website'] as const;
const priorities = ['high', 'medium', 'low'] as const;

export default function AddClientScreen({ 
  navigation,
  route 
}: ClientsStackScreenProps<'AddClient'>) {
  const { createClient, isLoading } = useClientsStore();
  const { collaborators, fetchCollaborators } = useCollaboratorsStore();
  
  const [selectedPropertyTypeIndex, setSelectedPropertyTypeIndex] = useState(-1);
  const [selectedPriorityIndex, setSelectedPriorityIndex] = useState(1); // Default to 'medium'
  const [showCollaboratorPicker, setShowCollaboratorPicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      budget_min: null,
      budget_max: null,
      preferred_locations: '',
      property_type: null,
      bedrooms_min: null,
      bedrooms_max: null,
      bathrooms_min: null,
      source_type: null,
      source_collaborator_id: route.params?.collaboratorId || null,
      priority: 'medium',
      notes: '',
    },
  });

  const sourceType = watch('source_type');

  // Fetch collaborators on mount
  useEffect(() => {
    fetchCollaborators();
  }, []);

  // Show/hide collaborator picker based on source type
  useEffect(() => {
    if (sourceType === 'partner' || sourceType === 'referral') {
      setShowCollaboratorPicker(true);
    } else {
      setShowCollaboratorPicker(false);
      setValue('source_collaborator_id', null);
    }
  }, [sourceType]);

  // Set initial source type if collaboratorId is provided
  useEffect(() => {
    if (route.params?.collaboratorId) {
      const collaborator = collaborators.find(c => c.id === route.params.collaboratorId);
      if (collaborator) {
        // Set source type based on collaborator type
        if (collaborator.type === 'agency') {
          setValue('source_type', 'partner');
        } else {
          setValue('source_type', 'referral');
        }
      }
    }
  }, [route.params?.collaboratorId, collaborators]);

  const getFilteredCollaborators = (): Collaborator[] => {
    if (sourceType === 'partner') {
      // For partners, show only agencies
      return collaborators.filter(c => c.type === 'agency');
    } else if (sourceType === 'referral') {
      // For referrals, show all collaborators
      return collaborators;
    }
    return [];
  };

  const onSubmit = async (data: ClientFormData) => {
    try {
      const clientData: ClientInsert = {
        user_id: '', // This will be set by the store
        name: data.name,
        email: data.email || null,
        phone: data.phone || null,
        budget_min: data.budget_min,
        budget_max: data.budget_max,
        preferred_locations: data.preferred_locations || null,
        property_type: selectedPropertyTypeIndex >= 0 ? propertyTypes[selectedPropertyTypeIndex] : null,
        bedrooms_min: data.bedrooms_min,
        bedrooms_max: data.bedrooms_max,
        bathrooms_min: data.bathrooms_min,
        source_type: data.source_type,
        source_collaborator_id: data.source_collaborator_id,
        status: 'new',
        priority: priorities[selectedPriorityIndex],
        notes: data.notes || null,
      };

      await createClient(clientData);
      Alert.alert('Success', 'Client created successfully!', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create client. Please try again.');
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
            onPress={() => navigation.goBack()} 
          />
        }
        centerComponent={{ text: 'Add Client', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
            <Text style={styles.sectionTitle}>Basic Information</Text>
            
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Name *"
                  placeholder="John Doe"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.name?.message}
                  leftIcon={<Icon name="person" size={20} color="#86939e" />}
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Email"
                  placeholder="john@example.com"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  leftIcon={<Icon name="email" size={20} color="#86939e" />}
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Phone"
                  placeholder="+34 600 000 000"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  keyboardType="phone-pad"
                  leftIcon={<Icon name="phone" size={20} color="#86939e" />}
                />
              )}
            />

            <Text style={styles.sectionTitle}>Client Source</Text>

            <Controller
              control={control}
              name="source_type"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>How did they find you?</Text>
                  <View style={styles.picker}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={Platform.OS === 'ios' ? { height: 180 } : {}}
                    >
                      <Picker.Item label="Select Source" value={null} />
                      <Picker.Item label="Direct Contact" value="direct" />
                      <Picker.Item label="Partner Agency" value="partner" />
                      <Picker.Item label="Referral" value="referral" />
                      <Picker.Item label="Website" value="website" />
                    </Picker>
                  </View>
                </View>
              )}
            />

            {showCollaboratorPicker && (
              <Controller
                control={control}
                name="source_collaborator_id"
                render={({ field: { onChange, value } }) => (
                  <View style={styles.pickerContainer}>
                    <Text style={styles.pickerLabel}>
                      {sourceType === 'partner' ? 'Partner Agency' : 'Referred By'}
                    </Text>
                    <View style={styles.picker}>
                      <Picker
                        selectedValue={value}
                        onValueChange={onChange}
                        style={Platform.OS === 'ios' ? { height: 180 } : {}}
                      >
                        <Picker.Item 
                          label={`Select ${sourceType === 'partner' ? 'Agency' : 'Referrer'}`} 
                          value={null} 
                        />
                        {getFilteredCollaborators().map((collaborator) => (
                          <Picker.Item
                            key={collaborator.id}
                            label={collaborator.company_name || collaborator.name}
                            value={collaborator.id}
                          />
                        ))}
                      </Picker>
                    </View>
                    {getFilteredCollaborators().length === 0 && (
                      <Text style={styles.helperText}>
                        No {sourceType === 'partner' ? 'agencies' : 'collaborators'} found. 
                        Please add one in the Collaborators section.
                      </Text>
                    )}
                  </View>
                )}
              />
            )}

            <Text style={styles.sectionTitle}>Property Preferences</Text>

            <Text style={styles.label}>Property Type</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedPropertyTypeIndex(index);
                setValue('property_type', propertyTypes[index]);
              }}
              selectedIndex={selectedPropertyTypeIndex}
              buttons={propertyTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1))}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="budget_min"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Min Budget (€)"
                    placeholder="100000"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : null)}
                    value={value?.toString() || ''}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="budget_max"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Max Budget (€)"
                    placeholder="300000"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? parseFloat(text) : null)}
                    value={value?.toString() || ''}
                    keyboardType="numeric"
                    containerStyle={styles.halfInput}
                  />
                )}
              />
            </View>

            <Controller
              control={control}
              name="preferred_locations"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Preferred Locations"
                  placeholder="Madrid, Barcelona, Valencia..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={2}
                />
              )}
            />

            <View style={styles.row}>
              <Controller
                control={control}
                name="bedrooms_min"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Min Bedrooms"
                    placeholder="2"
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
                name="bedrooms_max"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Max Bedrooms"
                    placeholder="4"
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
              name="bathrooms_min"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Minimum Bathrooms"
                  placeholder="1"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text ? parseInt(text) : null)}
                  value={value?.toString() || ''}
                  keyboardType="numeric"
                />
              )}
            />

            <Text style={styles.sectionTitle}>Priority & Notes</Text>

            <Text style={styles.label}>Priority</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedPriorityIndex(index);
                setValue('priority', priorities[index]);
              }}
              selectedIndex={selectedPriorityIndex}
              buttons={['High', 'Medium', 'Low']}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Notes"
                  placeholder="Additional notes about the client..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />

            <Button
              title="Create Client"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading}
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