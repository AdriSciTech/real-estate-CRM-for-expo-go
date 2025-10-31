// src/screens/tasks/TaskDetailScreen.tsx
// ===========================

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Badge, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TasksStackScreenProps } from '../../types/navigation.types';
import { useTasksStore } from '../../store/tasksStore';

export default function TaskDetailScreen({ 
  navigation,
  route 
}: TasksStackScreenProps<'TaskDetail'>) {
  const { taskId } = route.params;
  const { selectedTask, getTask, isLoading, completeTask, deleteTask } = useTasksStore();

  useEffect(() => {
    getTask(taskId);
  }, [taskId]);

  const handleComplete = async () => {
    try {
      await completeTask(taskId);
      Alert.alert('Success', 'Task marked as complete');
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Task',
      'Are you sure you want to delete this task?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTask(taskId);
              navigation.goBack();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#52c41a';
      default:
        return '#86939e';
    }
  };

  const getStatusColor = (status: string) => {
    return status === 'done' ? '#52c41a' : '#1890ff';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No due date';
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) {
      return 'Today';
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return 'Tomorrow';
    } else if (taskDate < today) {
      return `Overdue (${date.toLocaleDateString()})`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const navigateToRelated = () => {
    if (!selectedTask?.related_to_type || !selectedTask?.related_to_id) return;

    switch (selectedTask.related_to_type) {
      case 'client':
        navigation.navigate('ClientDetail' as any, { clientId: selectedTask.related_to_id });
        break;
      case 'property':
        navigation.navigate('PropertyDetail' as any, { propertyId: selectedTask.related_to_id });
        break;
      case 'deal':
        navigation.navigate('DealDetail' as any, { dealId: selectedTask.related_to_id });
        break;
    }
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
          centerComponent={{ text: 'Task Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
          rightComponent={
            <Icon 
              name="edit" 
              size={24} 
              color="white" 
              onPress={() => navigation.navigate('EditTask', { taskId })} 
            />
          }
          backgroundColor="#2089dc"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2089dc" />
        </View>
      </SafeAreaView>
    );
  }

  const isOverdue = selectedTask.due_date && new Date(selectedTask.due_date) < new Date() && selectedTask.status === 'pending';

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
        centerComponent={{ text: 'Task Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
        rightComponent={
          <Icon 
            name="edit" 
            size={24} 
            color="white" 
            onPress={() => navigation.navigate('EditTask', { taskId })} 
          />
        }
        backgroundColor="#2089dc"
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.headerSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>{selectedTask.title}</Text>
            <Badge
              value={selectedTask.status}
              badgeStyle={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(selectedTask.status) },
              ]}
              textStyle={styles.badgeText}
            />
          </View>
          
          <View style={styles.metaRow}>
            <Badge
              value={selectedTask.priority}
              badgeStyle={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(selectedTask.priority) },
              ]}
              textStyle={styles.badgeText}
            />
            <Text style={[styles.dueDate, isOverdue && styles.overdueDueDate]}>
              <Icon name="event" size={16} color={isOverdue ? '#ff4d4f' : '#86939e'} />
              {' '}{formatDate(selectedTask.due_date)}
            </Text>
          </View>
        </View>

        {selectedTask.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{selectedTask.description}</Text>
          </View>
        )}

        {selectedTask.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{selectedTask.notes}</Text>
          </View>
        )}

        {selectedTask.related_to_type && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related To</Text>
            <TouchableOpacity
              style={styles.relatedItem}
              onPress={navigateToRelated}
            >
              <View style={styles.relatedInfo}>
                <Text style={styles.relatedType}>
                  {selectedTask.related_to_type.charAt(0).toUpperCase() + selectedTask.related_to_type.slice(1)}
                </Text>
                {selectedTask.clients && (
                  <Text style={styles.relatedName}>{selectedTask.clients.name}</Text>
                )}
                {selectedTask.properties && (
                  <Text style={styles.relatedName}>{selectedTask.properties.title}</Text>
                )}
                {selectedTask.deals && selectedTask.related_to_id && (
                  <Text style={styles.relatedName}>Deal #{selectedTask.related_to_id.slice(0, 8)}</Text>
                )}
              </View>
              <Icon name="chevron-right" size={24} color="#86939e" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Timeline</Text>
          <View style={styles.timelineItem}>
            <Icon name="add-circle" size={20} color="#86939e" />
            <View style={styles.timelineContent}>
              <Text style={styles.timelineText}>Created</Text>
              <Text style={styles.timelineDate}>
                {new Date(selectedTask.created_at).toLocaleString()}
              </Text>
            </View>
          </View>
          {selectedTask.updated_at !== selectedTask.created_at && (
            <View style={styles.timelineItem}>
              <Icon name="update" size={20} color="#86939e" />
              <View style={styles.timelineContent}>
                <Text style={styles.timelineText}>Last Updated</Text>
                <Text style={styles.timelineDate}>
                  {new Date(selectedTask.updated_at).toLocaleString()}
                </Text>
              </View>
            </View>
          )}
        </View>

        {selectedTask.status === 'pending' && (
          <View style={styles.actionButtons}>
            <Button
              title="Mark as Complete"
              onPress={handleComplete}
              buttonStyle={[styles.actionButton, styles.completeButton]}
              icon={<Icon name="check" size={20} color="white" style={{ marginRight: 5 }} />}
            />
          </View>
        )}

        <View style={styles.dangerZone}>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Icon name="delete" size={20} color="#ff4d4f" />
            <Text style={styles.deleteText}>Delete Task</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  content: {
    flex: 1,
  },
  headerSection: {
    backgroundColor: 'white',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
    color: '#2c3e50',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    fontSize: 12,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  dueDate: {
    fontSize: 14,
    color: '#86939e',
    flexDirection: 'row',
    alignItems: 'center',
  },
  overdueDueDate: {
    color: '#ff4d4f',
    fontWeight: '600',
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#43484d',
  },
  description: {
    fontSize: 15,
    color: '#43484d',
    lineHeight: 22,
  },
  notes: {
    fontSize: 14,
    color: '#43484d',
    lineHeight: 20,
    fontStyle: 'italic',
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e1e8ee',
    borderRadius: 8,
    paddingHorizontal: 15,
  },
  relatedInfo: {
    flex: 1,
  },
  relatedType: {
    fontSize: 12,
    color: '#86939e',
    textTransform: 'uppercase',
  },
  relatedName: {
    fontSize: 16,
    color: '#43484d',
    marginTop: 2,
  },
  timelineItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  timelineContent: {
    marginLeft: 10,
    flex: 1,
  },
  timelineText: {
    fontSize: 14,
    color: '#43484d',
    fontWeight: '500',
  },
  timelineDate: {
    fontSize: 12,
    color: '#86939e',
    marginTop: 2,
  },
  actionButtons: {
    padding: 20,
  },
  actionButton: {
    borderRadius: 25,
    paddingVertical: 15,
  },
  completeButton: {
    backgroundColor: '#52c41a',
  },
  dangerZone: {
    padding: 20,
    marginBottom: 20,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderWidth: 1,
    borderColor: '#ff4d4f',
    borderRadius: 25,
  },
  deleteText: {
    color: '#ff4d4f',
    fontSize: 16,
    marginLeft: 5,
  },
});
