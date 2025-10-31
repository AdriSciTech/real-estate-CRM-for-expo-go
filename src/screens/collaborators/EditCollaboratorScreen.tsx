// src/screens/collaborators/EditCollaboratorScreen.tsx
// ===========================

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
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { CollaboratorsStackScreenProps } from '../../types/navigation.types';
import { useCollaboratorsStore } from '../../store/collaboratorsStore';
import { Database } from '../../types/database.types';
import CollaboratorDocuments from '../../components/collaborators/CollaboratorDocuments';
import { collaboratorsService } from '../../services/collaborators.service';

type CollaboratorUpdate = Database['public']['Tables']['collaborators']['Update'];

const schema = yup.object({
  name: yup.string().optional(),
  email: yup.string().email('Invalid email').optional(),
  company_name: yup.string().nullable().optional(),
  contact_person: yup.string().nullable().optional(),
  phone: yup.string().nullable().optional(),
  type: yup.string().oneOf(['landlord', 'developer', 'agency', 'other']).optional(),
  notes: yup.string().nullable().optional(),
}).shape({}) as yup.ObjectSchema<Partial<CollaboratorUpdate>>;

const collaboratorTypes = ['landlord', 'developer', 'agency', 'other'];

export default function EditCollaboratorScreen({ 
  navigation,
  route 
}: CollaboratorsStackScreenProps<'EditCollaborator'>) {
  const { collaboratorId } = route.params;
  const { selectedCollaborator, getCollaborator, updateCollaborator, isLoading } = useCollaboratorsStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [collaboratorDocuments, setCollaboratorDocuments] = useState<any[]>([]);
  const [selectedTypeIndex, setSelectedTypeIndex] = useState(3);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CollaboratorUpdate>({
    resolver: yupResolver(schema),
  });

  useEffect(() => {
    getCollaborator(collaboratorId);
    loadCollaboratorDocuments();
  }, [collaboratorId]);

  const loadCollaboratorDocuments = async () => {
    try {
      const documents = await collaboratorsService.getCollaboratorDocuments(collaboratorId);
      setCollaboratorDocuments(documents);
    } catch (error) {
      console.error('Error loading documents:', error);
    }
  };

  useEffect(() => {
    if (selectedCollaborator && selectedCollaborator.id === collaboratorId) {
      reset({
        name: selectedCollaborator.name,
        email: selectedCollaborator.email,
        company_name: selectedCollaborator.company_name || '',
        contact_person: selectedCollaborator.contact_person || '',
        phone: selectedCollaborator.phone || '',
        type: selectedCollaborator.type as any,
        notes: selectedCollaborator.notes || '',
      });

      setSelectedTypeIndex(collaboratorTypes.indexOf(selectedCollaborator.type || 'other'));
    }
  }, [selectedCollaborator, collaboratorId, reset]);

  const onSubmit = async (data: CollaboratorUpdate) => {
    try {
      setIsSubmitting(true);
      const updateData = {
        ...data,
        type: collaboratorTypes[selectedTypeIndex] as any,
        role: collaboratorTypes[selectedTypeIndex], // Keep role in sync
      };

      await updateCollaborator(collaboratorId, updateData);
      Alert.alert('Success', 'Collaborator updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update collaborator. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !selectedCollaborator) {
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
          centerComponent={{ text: 'Edit Collaborator', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
        centerComponent={{ text: 'Edit Collaborator', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
                  value={value || ''}
                  leftIcon={<Icon name="business" size={20} color="#86939e" />}
                />
              )}
            />

            <Text style={styles.label}>Type</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedTypeIndex(index);
                setValue('type', collaboratorTypes[index] as any);
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
                  value={value || ''}
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
                  value={value || ''}
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
                  value={value || ''}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />

            <Text style={styles.sectionTitle}>Documents</Text>
            <CollaboratorDocuments
              collaboratorId={collaboratorId}
              documents={collaboratorDocuments}
              onDocumentsChange={loadCollaboratorDocuments}
              editable={true}
            />

            <Button
              title="Update Collaborator"
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
