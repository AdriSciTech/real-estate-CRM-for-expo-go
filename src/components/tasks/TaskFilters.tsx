// src/components/tasks/TaskFilters.tsx
// ===========================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, ButtonGroup } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTasksStore } from '../../store/tasksStore';

interface TaskFiltersProps {
  onClose: () => void;
}

const statusOptions = ['pending', 'done'];
const priorityOptions = ['high', 'medium', 'low'];
const relatedOptions = ['client', 'property', 'deal', 'other'];
const dueDateOptions = ['overdue', 'today', 'week', 'month', 'all'];

export default function TaskFilters({ onClose }: TaskFiltersProps) {
  const { filters, applyFilters, clearFilters } = useTasksStore();
  
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || '',
    priority: filters.priority || '',
    relatedToType: filters.relatedToType || '',
    dueDateRange: filters.dueDateRange || '',
  });

  const [selectedStatusIndex, setSelectedStatusIndex] = useState(
    statusOptions.findIndex(status => status === filters.status)
  );
  
  const [selectedPriorityIndex, setSelectedPriorityIndex] = useState(
    priorityOptions.findIndex(priority => priority === filters.priority)
  );

  const [selectedRelatedIndex, setSelectedRelatedIndex] = useState(
    relatedOptions.findIndex(type => type === filters.relatedToType)
  );

  const [selectedDueDateIndex, setSelectedDueDateIndex] = useState(
    dueDateOptions.findIndex(range => range === filters.dueDateRange)
  );

  const handleApplyFilters = () => {
    const appliedFilters: any = {};
    
    if (localFilters.status) appliedFilters.status = localFilters.status;
    if (localFilters.priority) appliedFilters.priority = localFilters.priority;
    if (localFilters.relatedToType) appliedFilters.relatedToType = localFilters.relatedToType;
    if (localFilters.dueDateRange) appliedFilters.dueDateRange = localFilters.dueDateRange;
    
    applyFilters(appliedFilters);
    onClose();
  };

  const handleClearFilters = () => {
    setLocalFilters({
      status: '',
      priority: '',
      relatedToType: '',
      dueDateRange: '',
    });
    setSelectedStatusIndex(-1);
    setSelectedPriorityIndex(-1);
    setSelectedRelatedIndex(-1);
    setSelectedDueDateIndex(-1);
    clearFilters();
    onClose();
  };

  const updateStatus = (index: number) => {
    setSelectedStatusIndex(index);
    setLocalFilters({
      ...localFilters,
      status: index >= 0 ? statusOptions[index] : '',
    });
  };

  const updatePriority = (index: number) => {
    setSelectedPriorityIndex(index);
    setLocalFilters({
      ...localFilters,
      priority: index >= 0 ? priorityOptions[index] : '',
    });
  };

  const updateRelated = (index: number) => {
    setSelectedRelatedIndex(index);
    setLocalFilters({
      ...localFilters,
      relatedToType: index >= 0 ? relatedOptions[index] : '',
    });
  };

  const updateDueDate = (index: number) => {
    setSelectedDueDateIndex(index);
    setLocalFilters({
      ...localFilters,
      dueDateRange: index >= 0 ? dueDateOptions[index] : '',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter Tasks</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#86939e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <ButtonGroup
            onPress={updateStatus}
            selectedIndex={selectedStatusIndex}
            buttons={['Pending', 'Done']}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <ButtonGroup
            onPress={updatePriority}
            selectedIndex={selectedPriorityIndex}
            buttons={['High', 'Medium', 'Low']}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={[
              styles.selectedButton,
              selectedPriorityIndex === 0 && { backgroundColor: '#ff4d4f' },
              selectedPriorityIndex === 1 && { backgroundColor: '#faad14' },
              selectedPriorityIndex === 2 && { backgroundColor: '#52c41a' },
            ]}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Related To</Text>
          <ButtonGroup
            onPress={updateRelated}
            selectedIndex={selectedRelatedIndex}
            buttons={['Client', 'Property', 'Deal', 'Other']}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Due Date</Text>
          <ButtonGroup
            onPress={updateDueDate}
            selectedIndex={selectedDueDateIndex}
            buttons={['Overdue', 'Today', 'This Week', 'This Month', 'All']}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Clear"
          type="outline"
          onPress={handleClearFilters}
          buttonStyle={[styles.footerButton, styles.clearButton]}
          titleStyle={styles.clearButtonText}
        />
        <Button
          title="Apply Filters"
          onPress={handleApplyFilters}
          buttonStyle={[styles.footerButton, styles.applyButton]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ee',
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#43484d',
  },
  buttonGroup: {
    borderRadius: 8,
    height: 40,
  },
  selectedButton: {
    backgroundColor: '#2089dc',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ee',
    gap: 10,
  },
  footerButton: {
    flex: 1,
    borderRadius: 25,
  },
  clearButton: {
    borderColor: '#86939e',
  },
  clearButtonText: {
    color: '#86939e',
  },
  applyButton: {
    backgroundColor: '#2089dc',
  },
});