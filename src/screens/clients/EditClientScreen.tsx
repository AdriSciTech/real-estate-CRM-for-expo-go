// src/screens/clients/EditClientScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
import { ClientsStackScreenProps } from '../../types/navigation.types';
import { useClientsStore } from '../../store/clientsStore';
import { useCollaboratorsStore } from '../../store/collaboratorsStore';
import { Database } from '../../types/database.types';
import ClientDocuments from '../../components/clients/ClientDocuments';
import { clientsService } from '../../services/clients.service';

type ClientUpdate = Database['public']['Tables']['clients']['Update'];
type Collaborator = Database['public']['Tables']['collaborators']['Row'];

interface ClientFormData extends ClientUpdate {
  source_type?: 'direct' | 'partner' | 'referral' | 'website' | null;
  source_collaborator_id?: string | null;
}

const schema = yup.object({
  name: yup.string().optional(),
  email: yup.string().email('Invalid email').nullable().optional(),
  phone: yup.string().nullable().optional(),
  notes: yup.string().nullable().optional(),
  budget_min: yup.number().positive('Budget must be positive').nullable().optional(),
  budget_max: yup.number()
    .positive('Budget must be positive')
    .nullable()
    .optional()
    .when('budget_min', (budget_min, schema) => {
      return budget_min && budget_min[0] ? schema.min(budget_min[0], 'Max budget must be greater than min budget') : schema;
    }),
  preferred_locations: yup.string().nullable().optional(),
  property_type: yup.string().oneOf(['apartment', 'house', 'commercial', 'land']).nullable().optional(),
  bedrooms_min: yup.number().min(0).nullable().optional(),
  bedrooms_max: yup.number()
    .min(0)
    .nullable()
    .optional()
    .when('bedrooms_min', (bedrooms_min, schema) => {
      return bedrooms_min && bedrooms_min[0] ? schema.min(bedrooms_min[0], 'Max bedrooms must be greater than min bedrooms') : schema;
    }),
  bathrooms_min: yup.number().min(0).nullable().optional(),
  source_type: yup.string().oneOf(['direct', 'partner', 'referral', 'website']).nullable().optional(),
  source_collaborator_id: yup.string().nullable().optional(),
  status: yup.string().oneOf(['new', 'contacted', 'visited', 'negotiating', 'closed', 'lost']).optional(),
  priority: yup.string().oneOf(['high', 'medium', 'low']).optional(),
}).shape({}) as yup.ObjectSchema<Partial<ClientFormData>>;

const propertyTypes = ['apartment', 'house', 'commercial', 'land'];
const sourceTypes = ['direct', 'partner', 'referral', 'website'] as const;
const statusOptions = ['new', 'contacted', 'visited', 'negotiating', 'closed', 'lost'];
const priorityOptions = ['high', 'medium', 'low'];

export default function EditClientScreen({ 
  navigation,
  route 
}: ClientsStackScreenProps<'EditClient'>) {
  const { clientId } = route.params;
  const { selectedClient, getClient, updateClient, isLoading } = useClientsStore();
  const { collaborators, fetchCollaborators } = useCollaboratorsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [clientDocuments, setClientDocuments] = useState<any[]>([]);
  const [showCollaboratorPicker, setShowCollaboratorPicker] = useState(false);

  const [selectedTypeIndex, setSelectedTypeIndex] = useState(-1);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [selectedPriorityIndex, setSelectedPriorityIndex] = useState(1);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ClientFormData>({
    resolver: yupResolver(schema),
  });

  const sourceType = watch('source_type');

  useEffect(() => {
    getClient(clientId);
    loadClientDocuments();
    fetchCollaborators();
  }, [clientId]);

  const loadClientDocuments = async () => {
    try {
      const documents = await clientsService.getClientDocuments(clientId);
      setClientDocuments(documents);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  // Show/hide collaborator picker based on source type
  useEffect(() => {
    if (sourceType === 'partner' || sourceType === 'referral') {
      setShowCollaboratorPicker(true);
    } else {
      setShowCollaboratorPicker(false);
      setValue('source_collaborator_id', null);
    }
  }, [sourceType]);

  useEffect(() => {
    if (selectedClient && selectedClient.id === clientId) {
      // Set form values
      reset({
        name: selectedClient.name,
        email: selectedClient.email || '',
        phone: selectedClient.phone || '',
        notes: selectedClient.notes || '',
        budget_min: selectedClient.budget_min,
        budget_max: selectedClient.budget_max,
        preferred_locations: selectedClient.preferred_locations || '',
        property_type: selectedClient.property_type as any,
        bedrooms_min: selectedClient.bedrooms_min,
        bedrooms_max: selectedClient.bedrooms_max,
        bathrooms_min: selectedClient.bathrooms_min,
        source_type: selectedClient.source_type as any,
        source_collaborator_id: selectedClient.source_collaborator_id,
        status: selectedClient.status as any,
        priority: selectedClient.priority as any,
      });

      // Set button indices
      setSelectedTypeIndex(selectedClient.property_type ? propertyTypes.indexOf(selectedClient.property_type) : -1);
      setSelectedStatusIndex(statusOptions.indexOf(selectedClient.status || 'new'));
      setSelectedPriorityIndex(priorityOptions.indexOf(selectedClient.priority || 'medium'));
    }
  }, [selectedClient, clientId, reset]);

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
      setIsSubmitting(true);
      const updateData = {
        ...data,
        property_type: selectedTypeIndex >= 0 ? propertyTypes[selectedTypeIndex] as any : null,
        status: statusOptions[selectedStatusIndex] as any,
        priority: priorityOptions[selectedPriorityIndex] as any,
        source_type: data.source_type,
        source_collaborator_id: data.source_collaborator_id,
      };

      await updateClient(clientId, updateData);
      Alert.alert('Success', 'Client updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update client. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !selectedClient) {
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
          centerComponent={{ text: 'Edit Client', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
        centerComponent={{ text: 'Edit Client', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
                  value={value || ''}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  errorMessage={errors.email?.message}
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
                  placeholder="+34 600 123 456"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ''}
                  keyboardType="phone-pad"
                  leftIcon={<Icon name="phone" size={20} color="#86939e" />}
                />
              )}
            />

            <Text style={styles.label}>Status</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedStatusIndex(index);
                setValue('status', statusOptions[index] as any);
              }}
              selectedIndex={selectedStatusIndex}
              buttons={statusOptions.map(s => s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' '))}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
              buttonStyle={styles.button}
              textStyle={styles.buttonText}
            />

            <Text style={styles.label}>Priority</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedPriorityIndex(index);
                setValue('priority', priorityOptions[index] as any);
              }}
              selectedIndex={selectedPriorityIndex}
              buttons={priorityOptions.map(p => p.charAt(0).toUpperCase() + p.slice(1))}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
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

            <Text style={styles.sectionTitle}>Property Requirements</Text>

            <Text style={styles.label}>Property Type</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedTypeIndex(index);
                setValue('property_type', index >= 0 ? propertyTypes[index] as any : null);
              }}
              selectedIndex={selectedTypeIndex}
              buttons={['Any', ...propertyTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1))]}
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
                    errorMessage={errors.budget_min?.message}
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
                    errorMessage={errors.budget_max?.message}
                    containerStyle={styles.halfInput}
                  />
                )}
              />
            </View>

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
                    containerStyle={styles.thirdInput}
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
                    containerStyle={styles.thirdInput}
                  />
                )}
              />

              <Controller
                control={control}
                name="bathrooms_min"
                render={({ field: { onChange, onBlur, value } }) => (
                  <Input
                    label="Min Bathrooms"
                    placeholder="1"
                    onBlur={onBlur}
                    onChangeText={(text) => onChange(text ? parseInt(text) : null)}
                    value={value?.toString() || ''}
                    keyboardType="numeric"
                    containerStyle={styles.thirdInput}
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
                  placeholder="City center, Beach area, etc."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ''}
                  multiline
                  numberOfLines={2}
                  textAlignVertical="top"
                />
              )}
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
                  value={value || ''}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />

            <Text style={styles.sectionTitle}>Client Documents</Text>
            <ClientDocuments
              clientId={clientId}
              documents={clientDocuments}
              onDocumentsChange={loadClientDocuments}
              editable={true}
            />

            <Button
              title="Update Client"
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
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
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
    height: 40,
  },
  button: {
    padding: 5,
  },
  buttonText: {
    fontSize: 12,
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