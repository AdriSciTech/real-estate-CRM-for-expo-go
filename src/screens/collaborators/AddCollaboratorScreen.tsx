// src/screens/collaborators/AddCollaboratorScreen.tsx
// ===========================

import React, { useState } from 'react';
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
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CollaboratorsStackScreenProps } from '../../types/navigation.types';
import { useCollaboratorsStore } from '../../store/collaboratorsStore';
import { Database } from '../../types/database.types';
import CollaboratorDocuments from '../../components/collaborators/CollaboratorDocuments';

type CollaboratorInsert = Database['public']['Tables']['collaborators']['Insert'];

interface CollaboratorFormData {
  name: string;
  email: string;
  company_name: string;
  contact_person: string;
  phone: string;
  type: 'landlord' | 'developer' | 'agency' | 'other';
  notes: string;
}

const schema = yup.object({
  name: yup.string().required('Name is required'),
  email: yup.string().email('Invalid email').required('Email is required'),
  company_name: yup.string().default(''),
  contact_person: yup.string().default(''),
  phone: yup.string().default(''),
  type: yup.string().oneOf(['landlord', 'developer', 'agency', 'other']).default('other'),
  notes: yup.string().default(''),
}).required();

const collaboratorTypes = ['landlord', 'developer', 'agency', 'other'] as const;

export default function AddCollaboratorScreen({ 
  navigation,
  route 
}: CollaboratorsStackScreenProps<'AddCollaborator'>) {
  const { createCollaborator, isLoading } = useCollaboratorsStore();
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(3); // Default to 'other'
  const [createdCollaboratorId, setCreatedCollaboratorId] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<CollaboratorFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      email: '',
      company_name: '',
      contact_person: '',
      phone: '',
      type: 'other',
      notes: '',
    },
  });

  const onSubmit = async (data: CollaboratorFormData) => {
    try {
      const collaboratorData: CollaboratorInsert = {
        user_id: '', // This will be set by the store
        name: data.name,
        email: data.email,
        company_name: data.company_name || null,
        contact_person: data.contact_person || null,
        phone: data.phone || null,
        type: collaboratorTypes[selectedTypeIndex],
        notes: data.notes || null,
        role: collaboratorTypes[selectedTypeIndex], // Keep role in sync with type
      };

      const newCollaborator = await createCollaborator(collaboratorData);
      setCreatedCollaboratorId(newCollaborator.id);
      Alert.alert('Success', 'Collaborator created successfully. You can now add documents.', [
        { text: 'OK' },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create collaborator. Please try again.');
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
        centerComponent={{ text: 'Add Collaborator', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
                  label="Email *"
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
              name="company_name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Company Name"
                  placeholder="ABC Real Estate"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  leftIcon={<Icon name="business" size={20} color="#86939e" />}
                />
              )}
            />

            <Text style={styles.label}>Type</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedTypeIndex(index);
                setValue('type', collaboratorTypes[index]);
              }}
              selectedIndex={selectedTypeIndex}
              buttons={['Landlord', 'Developer', 'Agency', 'Other']}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
            />

            <Text style={styles.sectionTitle}>Contact Details</Text>

            <Controller
              control={control}
              name="contact_person"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Contact Person"
                  placeholder="Jane Smith"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  leftIcon={<Icon name="person-outline" size={20} color="#86939e" />}
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

            <Text style={styles.sectionTitle}>Additional Information</Text>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Notes"
                  placeholder="Any additional notes about this collaborator..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />

            {createdCollaboratorId && (
              <>
                <Text style={styles.sectionTitle}>Documents</Text>
                <CollaboratorDocuments
                  collaboratorId={createdCollaboratorId}
                  documents={[]}
                  editable={true}
                />
              </>
            )}

            <Button
              title={createdCollaboratorId ? "Save and Close" : "Create Collaborator"}
              onPress={createdCollaboratorId ? () => navigation.goBack() : handleSubmit(onSubmit)}
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
});