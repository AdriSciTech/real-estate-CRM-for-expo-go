// src/screens/tasks/EditTaskScreen.tsx

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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Input, Button, ButtonGroup, Header } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import DateTimePicker from '@react-native-community/datetimepicker';
import { TasksStackScreenProps } from '../../types/navigation.types';
import { useTasksStore } from '../../store/tasksStore';
import { Database } from '../../types/database.types';

type TaskUpdate = Database['public']['Tables']['tasks']['Update'];

const schema = yup.object({
  title: yup.string().optional(),
  description: yup.string().nullable().optional(),
  status: yup.string().oneOf(['pending', 'done']).optional(),
  priority: yup.string().oneOf(['high', 'medium', 'low']).optional(),
  due_date: yup.date().nullable().optional(),
  notes: yup.string().nullable().optional(),
}).shape({}) as yup.ObjectSchema<Partial<TaskUpdate>>;

const priorities = ['high', 'medium', 'low'];
const statuses = ['pending', 'done'];

export default function EditTaskScreen({ 
  navigation,
  route 
}: TasksStackScreenProps<'EditTask'>) {
  const { taskId } = route.params;
  const { selectedTask, getTask, updateTask, isLoading } = useTasksStore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPriorityIndex, setSelectedPriorityIndex] = useState(1);
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(0);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    reset,
    watch,
    formState: { errors },
  } = useForm<TaskUpdate>({
    resolver: yupResolver(schema),
  });

  const watchedDueDate = watch('due_date');

  useEffect(() => {
    getTask(taskId);
  }, [taskId]);

  useEffect(() => {
    if (selectedTask && selectedTask.id === taskId) {
      reset({
        title: selectedTask.title,
        description: selectedTask.description || '',
        status: selectedTask.status,
        priority: selectedTask.priority,
        due_date: selectedTask.due_date || null,
        notes: selectedTask.notes || '',
      });

      setSelectedPriorityIndex(priorities.indexOf(selectedTask.priority));
      setSelectedStatusIndex(statuses.indexOf(selectedTask.status));
    }
  }, [selectedTask, taskId, reset]);

  const onSubmit = async (data: TaskUpdate) => {
    try {
      setIsSubmitting(true);
      const updateData = {
        ...data,
        priority: priorities[selectedPriorityIndex] as any,
        status: statuses[selectedStatusIndex] as any,
        due_date: data.due_date ? new Date(data.due_date).toISOString() : null,
      };

      await updateTask(taskId, updateData);
      Alert.alert('Success', 'Task updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to update task. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return 'Set due date';
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString();
  };

  if (isLoading || !selectedTask) {
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
          centerComponent={{ text: 'Edit Task', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
        centerComponent={{ text: 'Edit Task', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
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
                  value={value || ''}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />

            <Text style={styles.label}>Status</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedStatusIndex(index);
                setValue('status', statuses[index] as any);
              }}
              selectedIndex={selectedStatusIndex}
              buttons={['Pending', 'Done']}
              containerStyle={styles.buttonGroup}
              selectedButtonStyle={styles.selectedButton}
            />

            <Text style={styles.label}>Priority</Text>
            <ButtonGroup
              onPress={(index) => {
                setSelectedPriorityIndex(index);
                setValue('priority', priorities[index] as any);
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
                value={watchedDueDate ? (typeof watchedDueDate === 'string' ? new Date(watchedDueDate) : watchedDueDate) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, date) => {
                  setShowDatePicker(Platform.OS === 'ios');
                  if (date) {
                    setValue('due_date', date.toISOString());
                  }
                }}
                minimumDate={new Date()}
              />
            )}

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

            {selectedTask.related_to_type && (
              <View style={styles.relatedInfo}>
                <Text style={styles.relatedLabel}>Related to:</Text>
                <Text style={styles.relatedText}>
                  {selectedTask.related_to_type.charAt(0).toUpperCase() + selectedTask.related_to_type.slice(1)}
                </Text>
                {selectedTask.clients && (
                  <Text style={styles.relatedName}>{selectedTask.clients.name}</Text>
                )}
                {selectedTask.properties && (
                  <Text style={styles.relatedName}>{selectedTask.properties.title}</Text>
                )}
                {selectedTask.deals && (
                  <Text style={styles.relatedName}>Deal #{selectedTask.related_to_id?.slice(0, 8)}</Text>
                )}
              </View>
            )}

            <Button
              title="Update Task"
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
  relatedInfo: {
    backgroundColor: '#e3f2fd',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  relatedLabel: {
    fontSize: 14,
    color: '#86939e',
  },
  relatedText: {
    fontSize: 16,
    color: '#43484d',
    fontWeight: '500',
    marginTop: 2,
  },
  relatedName: {
    fontSize: 14,
    color: '#2089dc',
    marginTop: 4,
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