// src/screens/developerProjects/AddDeveloperProjectScreen.tsx

import React, { useState, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Text,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, Header } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { PropertiesStackScreenProps } from '../../types/navigation.types';
import { useDeveloperProjectsStore } from '../../store/developerProjectsStore';
import { Database } from '../../types/database.types';

type DeveloperProjectInsert = Database['public']['Tables']['developer_projects']['Insert'];

interface ProjectFormData {
  name: string;
  collaborator_id: string;
  location: string;
  description: string;
  delivery_date: Date | null;
  total_units: number | null;
}

const schema = yup.object({
  name: yup.string().required('Project name is required'),
  collaborator_id: yup.string().required('Developer is required'),
  location: yup.string().default(''),
  description: yup.string().default(''),
  delivery_date: yup.date().nullable().default(null),
  total_units: yup.number().positive('Total units must be positive').nullable().default(null),
}).required();

export default function AddDeveloperProjectScreen({ 
  navigation,
  route 
}: PropertiesStackScreenProps<'AddDeveloperProject'>) {
  const { createProject, fetchDevelopers, developers, isLoading } = useDeveloperProjectsStore();
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProjectFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      collaborator_id: '',
      location: '',
      description: '',
      delivery_date: null,
      total_units: null,
    },
  });

  const deliveryDate = watch('delivery_date');

  useEffect(() => {
    fetchDevelopers();
  }, []);

  const onSubmit = async (data: ProjectFormData) => {
    try {
      const projectData: DeveloperProjectInsert = {
        user_id: '', // This will be set by the store
        name: data.name,
        collaborator_id: data.collaborator_id,
        location: data.location || null,
        description: data.description || null,
        delivery_date: data.delivery_date ? data.delivery_date.toISOString().split('T')[0] : null,
        total_units: data.total_units,
      };

      await createProject(projectData);
      Alert.alert('Success', 'Developer project created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create developer project. Please try again.');
    }
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setValue('delivery_date', selectedDate);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select delivery date';
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
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
        centerComponent={{ text: 'Add Developer Project', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
            <Text style={styles.sectionTitle}>Project Information</Text>
            
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Project Name *"
                  placeholder="Sunset Residences"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  errorMessage={errors.name?.message}
                  leftIcon={<Icon name="apartment" size={20} color="#86939e" />}
                />
              )}
            />

            <Controller
              control={control}
              name="collaborator_id"
              render={({ field: { onChange, value } }) => (
                <View style={styles.pickerContainer}>
                  <Text style={styles.pickerLabel}>Developer *</Text>
                  <View style={styles.picker}>
                    <Picker
                      selectedValue={value}
                      onValueChange={onChange}
                      style={Platform.OS === 'ios' ? { height: 180 } : {}}
                    >
                      <Picker.Item label="Select Developer" value="" />
                      {developers.map((developer) => (
                        <Picker.Item
                          key={developer.id}
                          label={developer.company_name || developer.name}
                          value={developer.id}
                        />
                      ))}
                    </Picker>
                  </View>
                  {developers.length === 0 && (
                    <Text style={styles.helperText}>
                      No developers found. Please add a developer collaborator first.
                    </Text>
                  )}
                  {errors.collaborator_id && (
                    <Text style={styles.errorText}>{errors.collaborator_id.message}</Text>
                  )}
                </View>
              )}
            />

            <Controller
              control={control}
              name="location"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Location"
                  placeholder="Valencia, Spain"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  leftIcon={<Icon name="location-on" size={20} color="#86939e" />}
                />
              )}
            />

            <Controller
              control={control}
              name="total_units"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Total Units"
                  placeholder="50"
                  onBlur={onBlur}
                  onChangeText={(text) => onChange(text ? parseInt(text) : null)}
                  value={value?.toString() || ''}
                  keyboardType="numeric"
                  leftIcon={<Icon name="home" size={20} color="#86939e" />}
                />
              )}
            />

            <Text style={styles.sectionTitle}>Project Details</Text>

            <View style={styles.datePickerContainer}>
              <Text style={styles.dateLabel}>Expected Delivery Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="calendar-today" size={20} color="#86939e" />
                <Text style={styles.dateButtonText}>{formatDate(deliveryDate)}</Text>
              </TouchableOpacity>
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={deliveryDate || new Date()}
                mode="date"
                display="default"
                onChange={handleDateChange}
                minimumDate={new Date()}
              />
            )}

            <Controller
              control={control}
              name="description"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Description"
                  placeholder="Luxury residential complex with modern amenities..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />

            <View style={styles.infoBox}>
              <Icon name="info" size={20} color="#2089dc" />
              <Text style={styles.infoText}>
                After creating the project, you can add properties to it by selecting this project when adding a new property.
              </Text>
            </View>

            <Button
              title="Create Project"
              onPress={handleSubmit(onSubmit)}
              loading={isLoading}
              disabled={isLoading || developers.length === 0}
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
  errorText: {
    fontSize: 12,
    color: '#ff190c',
    marginTop: 5,
    marginLeft: 10,
  },
  datePickerContainer: {
    marginBottom: 20,
    marginHorizontal: 10,
  },
  dateLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#86939e',
    marginBottom: 10,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 15,
  },
  dateButtonText: {
    fontSize: 16,
    color: '#43484d',
    marginLeft: 10,
    flex: 1,
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginHorizontal: 10,
    marginTop: 20,
  },
  infoText: {
    fontSize: 14,
    color: '#1976d2',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
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