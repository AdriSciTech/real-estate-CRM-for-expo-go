// src/screens/tasks/AddTaskScreen.tsx
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
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, ButtonGroup, Header } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';
import { TasksStackScreenProps } from '../../types/navigation.types';
import { useTasksStore } from '../../store/tasksStore';
import { Database } from '../../types/database.types';
import { supabase } from '../../services/supabase';

type TaskInsert = Database['public']['Tables']['tasks']['Insert'];

interface TaskFormData {
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  due_date: Date | null;
  notes: string;
}

interface SelectedImage {
  uri: string;
  type?: string;
  name?: string;
}

const schema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().default(''),
  priority: yup.string().oneOf(['high', 'medium', 'low']).default('medium'),
  due_date: yup.date().nullable().default(null),
  notes: yup.string().default(''),
}).required();

const priorities = ['high', 'medium', 'low'] as const;

export default function AddTaskScreen({ 
  navigation,
  route 
}: TasksStackScreenProps<'AddTask'>) {
  const { createTask, isLoading } = useTasksStore();
  const [selectedPriorityIndex, setSelectedPriorityIndex] = useState(1); // Default to 'medium'
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedImages, setSelectedImages] = useState<SelectedImage[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<TaskFormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'medium',
      due_date: null,
      notes: '',
    },
  });

  const watchedDueDate = watch('due_date');

  // Request camera permissions
  const requestPermissions = async () => {
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    const { status: mediaStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (cameraStatus !== 'granted' || mediaStatus !== 'granted') {
      Alert.alert('Permissions needed', 'Please grant camera and media library permissions to add images.');
      return false;
    }
    return true;
  };

  // Pick image from gallery
  const pickImage = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets) {
      const newImages = result.assets.map(asset => ({
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `image_${Date.now()}.jpg`,
      }));
      setSelectedImages([...selectedImages, ...newImages]);
    }
  };

  // Take photo with camera
  const takePhoto = async () => {
    const hasPermissions = await requestPermissions();
    if (!hasPermissions) return;

    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      allowsEditing: false,
    });

    if (!result.canceled && result.assets[0]) {
      const asset = result.assets[0];
      setSelectedImages([...selectedImages, {
        uri: asset.uri,
        type: asset.mimeType || 'image/jpeg',
        name: asset.fileName || `photo_${Date.now()}.jpg`,
      }]);
    }
  };

  // Remove selected image
  const removeImage = (index: number) => {
    const newImages = [...selectedImages];
    newImages.splice(index, 1);
    setSelectedImages(newImages);
  };

  // Upload image to Supabase Storage using FileSystem and base64-arraybuffer
  const uploadImage = async (image: SelectedImage, taskId: string): Promise<string | null> => {
    try {
      // Check if user is authenticated
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No authenticated session');
        return null;
      }

      // Get file extension
      const uriParts = image.uri.split('.');
      const fileExt = uriParts[uriParts.length - 1] || 'jpg';
      const fileName = `tasks/${taskId}/${Date.now()}.${fileExt}`;
      
      console.log('Uploading image:', fileName);
      
      // Read file as base64
      const base64String = await FileSystem.readAsStringAsync(image.uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      
      // Convert base64 to ArrayBuffer using base64-arraybuffer
      const arrayBuffer = decode(base64String);
      
      // Upload to Supabase storage
      const { data, error } = await supabase.storage
        .from('property-images')
        .upload(fileName, arrayBuffer, {
          contentType: image.type || 'image/jpeg',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        console.error('Upload error:', error);
        return null;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('property-images')
        .getPublicUrl(fileName);

      console.log('Upload successful, URL:', publicUrl);
      return publicUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      return null;
    }
  };

  const onSubmit = async (data: TaskFormData) => {
    try {
      // First create the task
      const taskData: TaskInsert = {
        user_id: '', // This will be set by the store
        title: data.title,
        description: data.description || null,
        status: 'pending',
        priority: priorities[selectedPriorityIndex],
        due_date: data.due_date ? data.due_date.toISOString() : null,
        notes: data.notes || null,
        related_to_type: route.params?.relatedToType || null,
        related_to_id: route.params?.relatedToId || null,
      };

      const newTask = await createTask(taskData);
      
      if (newTask && selectedImages.length > 0) {
        setUploadingImages(true);
        
        try {
          // Upload all images in parallel
          const uploadPromises = selectedImages.map(image => uploadImage(image, newTask.id));
          const uploadedUrls = await Promise.all(uploadPromises);
          
          // Filter out failed uploads
          const successfulUrls = uploadedUrls.filter((url): url is string => url !== null);
          
          if (successfulUrls.length > 0) {
            // Update task with image URLs
            const { error: updateError } = await supabase
              .from('tasks')
              .update({ 
                images: successfulUrls,
                updated_at: new Date().toISOString() 
              })
              .eq('id', newTask.id);
              
            if (updateError) {
              console.error('Error updating task with images:', updateError);
            }
          } else {
            Alert.alert('Warning', 'Some images failed to upload, but the task was created.');
          }
        } catch (uploadError) {
          console.error('Error during image upload:', uploadError);
          Alert.alert('Warning', 'Task created but images failed to upload.');
        } finally {
          setUploadingImages(false);
        }
      }
      
      Alert.alert('Success', 'Task created successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error creating task:', error);
      Alert.alert('Error', 'Failed to create task. Please try again.');
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Set due date';
    return date.toLocaleDateString();
  };

  const showImageOptions = () => {
    Alert.alert(
      'Add Image',
      'Choose an option',
      [
        { text: 'Camera', onPress: takePhoto },
        { text: 'Gallery', onPress: pickImage },
        { text: 'Cancel', style: 'cancel' },
      ],
    );
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
        centerComponent={{ text: 'Add Task', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
            <Text style={styles.sectionTitle}>Task Information</Text>
            
            <Controller
              control={control}
              name="title"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Title *"
                  placeholder="Enter task title"
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
                  placeholder="Task description..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />

            <Text style={styles.label}>Priority</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedPriorityIndex(index);
                setValue('priority', priorities[index]);
              }}
              selectedIndex={selectedPriorityIndex}
              buttons={['High', 'Medium', 'Low']}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={[
                styles.selectedButton,
                { backgroundColor: 
                  selectedPriorityIndex === 0 ? '#ff4d4f' : 
                  selectedPriorityIndex === 1 ? '#faad14' : 
                  '#52c41a' 
                }
              ]}
            />

            <View style={styles.dateSection}>
              <Text style={styles.label}>Due Date</Text>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => setShowDatePicker(true)}
              >
                <Icon name="event" size={20} color="#86939e" />
                <Text style={styles.dateButtonText}>
                  {formatDate(watchedDueDate)}
                </Text>
              </TouchableOpacity>
              {watchedDueDate && (
                <TouchableOpacity
                  onPress={() => setValue('due_date', null)}
                  style={styles.clearDateButton}
                >
                  <Text style={styles.clearDateText}>Clear date</Text>
                </TouchableOpacity>
              )}
            </View>

            {showDatePicker && (
              <DateTimePicker
                value={watchedDueDate || new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setValue('due_date', date);
                  }
                }}
                minimumDate={new Date()}
              />
            )}

            {/* Image Section */}
            <View style={styles.imageSection}>
              <Text style={styles.label}>Images</Text>
              <TouchableOpacity
                style={styles.addImageButton}
                onPress={showImageOptions}
              >
                <Icon name="add-photo-alternate" size={24} color="#2089dc" />
                <Text style={styles.addImageText}>Add Image</Text>
              </TouchableOpacity>

              {selectedImages.length > 0 && (
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false}
                  style={styles.imagePreviewContainer}
                >
                  {selectedImages.map((image, index) => (
                    <View key={index} style={styles.imageWrapper}>
                      <Image source={{ uri: image.uri }} style={styles.imagePreview} />
                      <TouchableOpacity
                        style={styles.removeImageButton}
                        onPress={() => removeImage(index)}
                      >
                        <Icon name="close" size={18} color="white" />
                      </TouchableOpacity>
                    </View>
                  ))}
                </ScrollView>
              )}

              {uploadingImages && (
                <View style={styles.uploadingContainer}>
                  <ActivityIndicator size="small" color="#2089dc" />
                  <Text style={styles.uploadingText}>Uploading images...</Text>
                </View>
              )}
            </View>

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  label="Notes"
                  placeholder="Additional notes..."
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value || ''}
                  multiline
                  numberOfLines={4}
                  textAlignVertical="top"
                />
              )}
            />

            <Button
              title="Create Task"
              onPress={handleSubmit(onSubmit)}
              loading={isSubmitting || uploadingImages}
              disabled={isSubmitting || uploadingImages}
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
  dateSection: {
    marginBottom: 20,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ee',
  },
  dateButtonText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#43484d',
  },
  clearDateButton: {
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    color: '#2089dc',
    fontSize: 14,
  },
  imageSection: {
    marginBottom: 20,
  },
  addImageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ee',
    borderStyle: 'dashed',
  },
  addImageText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#2089dc',
  },
  imagePreviewContainer: {
    marginTop: 15,
  },
  imageWrapper: {
    marginRight: 10,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  removeImageButton: {
    position: 'absolute',
    top: 5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uploadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  uploadingText: {
    marginLeft: 10,
    color: '#86939e',
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