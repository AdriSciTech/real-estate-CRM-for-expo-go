// src/components/tasks/TaskCard.tsx
// ===========================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Badge, CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Database } from '../../types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

interface TaskCardProps {
  task: Task;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onComplete: () => void;
}

const { width } = Dimensions.get('window');

export default function TaskCard({
  task,
  onPress,
  onEdit,
  onDelete,
  onComplete,
}: TaskCardProps) {
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

  const getRelatedIcon = (type: string | null) => {
    switch (type) {
      case 'client':
        return 'person';
      case 'property':
        return 'home';
      case 'deal':
        return 'handshake';
      default:
        return null;
    }
  };

  const formatDueDate = (dateString: string | null) => {
    if (!dateString) return null;
    
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const taskDate = new Date(date);
    taskDate.setHours(0, 0, 0, 0);
    
    if (taskDate.getTime() === today.getTime()) {
      return { text: 'Today', isOverdue: false };
    } else if (taskDate.getTime() === tomorrow.getTime()) {
      return { text: 'Tomorrow', isOverdue: false };
    } else if (taskDate < today) {
      const daysOverdue = Math.floor((today.getTime() - taskDate.getTime()) / (1000 * 60 * 60 * 24));
      return { text: `${daysOverdue} day${daysOverdue > 1 ? 's' : ''} overdue`, isOverdue: true };
    } else {
      return { text: date.toLocaleDateString(), isOverdue: false };
    }
  };

  const dueDate = formatDueDate(task.due_date);
  const relatedIcon = getRelatedIcon(task.related_to_type);

  return (
    <TouchableOpacity
      style={[
        styles.card,
        task.status === 'done' && styles.completedCard
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.mainContent}>
        {/* Left side - Checkbox */}
        <CheckBox
          checked={task.status === 'done'}
          onPress={(e) => {
            e?.stopPropagation();
            if (task.status === 'pending') {
              onComplete();
            }
          }}
          checkedColor="#52c41a"
          uncheckedColor="#86939e"
          containerStyle={styles.checkbox}
        />

        {/* Center - Task details */}
        <View style={styles.detailsContainer}>
          <Text 
            style={[
              styles.title,
              task.status === 'done' && styles.completedTitle
            ]} 
            numberOfLines={2}
          >
            {task.title}
          </Text>

          <View style={styles.metaRow}>
            <Badge
              value={task.priority}
              badgeStyle={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(task.priority) },
              ]}
              textStyle={styles.badgeText}
            />
            
            {dueDate && (
              <View style={styles.dueDateContainer}>
                <Icon 
                  name="event" 
                  size={14} 
                  color={dueDate.isOverdue && task.status === 'pending' ? '#ff4d4f' : '#86939e'} 
                />
                <Text 
                  style={[
                    styles.dueDate,
                    dueDate.isOverdue && task.status === 'pending' && styles.overdueDueDate
                  ]}
                >
                  {dueDate.text}
                </Text>
              </View>
            )}

            {relatedIcon && (
              <View style={styles.relatedContainer}>
                <Icon name={relatedIcon} size={14} color="#2089dc" />
              </View>
            )}
          </View>

          {task.description && (
            <Text style={styles.description} numberOfLines={1}>
              {task.description}
            </Text>
          )}
        </View>

        {/* Right side - Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Icon name="edit" size={20} color="#2089dc" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Icon name="delete" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  completedCard: {
    opacity: 0.7,
  },
  mainContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  checkbox: {
    padding: 0,
    margin: 0,
    marginRight: 10,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#2c3e50',
    marginBottom: 4,
  },
  completedTitle: {
    textDecorationLine: 'line-through',
    color: '#86939e',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
    color: '#86939e',
  },
  overdueDueDate: {
    color: '#ff4d4f',
    fontWeight: '600',
  },
  relatedContainer: {
    marginLeft: 'auto',
  },
  description: {
    fontSize: 13,
    color: '#86939e',
    marginTop: 2,
  },
  actionsContainer: {
    justifyContent: 'center',
    gap: 8,
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
});