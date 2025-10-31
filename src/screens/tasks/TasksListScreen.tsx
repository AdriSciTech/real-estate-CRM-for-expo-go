// src/screens/tasks/TasksListScreen.tsx
// ===========================

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Text, CheckBox } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useTasksStore } from '../../store/tasksStore';
import { TasksStackScreenProps } from '../../types/navigation.types';
import TaskCard from '../../components/tasks/TaskCard';
import TaskFilters from '../../components/tasks/TaskFilters';
import CustomSearchBar from '../../components/common/CustomSearchBar';
import { Database } from '../../types/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];

export default function TasksListScreen({ 
  navigation 
}: TasksStackScreenProps<'TasksList'>) {
  const {
    tasks,
    isLoading,
    filters,
    fetchTasks,
    deleteTask,
    completeTask,
    applyFilters,
  } = useTasksStore();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grouped'>('list');

  useEffect(() => {
    fetchTasks();
  }, []);

  // Group tasks by date
  const groupTasksByDate = (tasksList: Task[]) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const week = new Date(today);
    week.setDate(week.getDate() + 7);

    const grouped = {
      overdue: [] as Task[],
      today: [] as Task[],
      tomorrow: [] as Task[],
      thisWeek: [] as Task[],
      later: [] as Task[],
      noDueDate: [] as Task[],
    };

    tasksList.forEach(task => {
      if (!task.due_date) {
        grouped.noDueDate.push(task);
      } else {
        const dueDate = new Date(task.due_date);
        dueDate.setHours(0, 0, 0, 0);

        if (dueDate < today) {
          grouped.overdue.push(task);
        } else if (dueDate.getTime() === today.getTime()) {
          grouped.today.push(task);
        } else if (dueDate.getTime() === tomorrow.getTime()) {
          grouped.tomorrow.push(task);
        } else if (dueDate < week) {
          grouped.thisWeek.push(task);
        } else {
          grouped.later.push(task);
        }
      }
    });

    return grouped;
  };

  // Local search and filter
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(task => {
        const searchableText = [
          task.title,
          task.description,
          task.notes,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    // Apply status filter
    if (filters.status) {
      result = result.filter(t => t.status === filters.status);
    }

    // Apply priority filter
    if (filters.priority) {
      result = result.filter(t => t.priority === filters.priority);
    }

    // Apply related type filter
    if (filters.relatedToType) {
      result = result.filter(t => t.related_to_type === filters.relatedToType);
    }

    // Apply due date range filter
    if (filters.dueDateRange) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      switch (filters.dueDateRange) {
        case 'overdue':
          result = result.filter(t => t.due_date && new Date(t.due_date) < today);
          break;
        case 'today':
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          result = result.filter(t => {
            if (!t.due_date) return false;
            const dueDate = new Date(t.due_date);
            return dueDate >= today && dueDate < tomorrow;
          });
          break;
        case 'week':
          const nextWeek = new Date(today);
          nextWeek.setDate(nextWeek.getDate() + 7);
          result = result.filter(t => {
            if (!t.due_date) return false;
            const dueDate = new Date(t.due_date);
            return dueDate >= today && dueDate < nextWeek;
          });
          break;
        case 'month':
          const nextMonth = new Date(today);
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          result = result.filter(t => {
            if (!t.due_date) return false;
            const dueDate = new Date(t.due_date);
            return dueDate >= today && dueDate < nextMonth;
          });
          break;
      }
    }

    return result;
  }, [tasks, searchTerm, filters]);

  // Prepare sections for grouped view
  const sections = useMemo(() => {
    if (viewMode !== 'grouped') return [];

    const grouped = groupTasksByDate(filteredTasks);
    const sections = [];

    if (grouped.overdue.length > 0) {
      sections.push({ title: 'Overdue', data: grouped.overdue, key: 'overdue' });
    }
    if (grouped.today.length > 0) {
      sections.push({ title: 'Today', data: grouped.today, key: 'today' });
    }
    if (grouped.tomorrow.length > 0) {
      sections.push({ title: 'Tomorrow', data: grouped.tomorrow, key: 'tomorrow' });
    }
    if (grouped.thisWeek.length > 0) {
      sections.push({ title: 'This Week', data: grouped.thisWeek, key: 'thisWeek' });
    }
    if (grouped.later.length > 0) {
      sections.push({ title: 'Later', data: grouped.later, key: 'later' });
    }
    if (grouped.noDueDate.length > 0) {
      sections.push({ title: 'No Due Date', data: grouped.noDueDate, key: 'noDueDate' });
    }

    return sections;
  }, [filteredTasks, viewMode]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchTasks();
    setRefreshing(false);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  const handleEdit = useCallback((taskId: string) => {
    navigation.navigate('EditTask', { taskId });
  }, [navigation]);

  const handleDelete = useCallback((taskId: string) => {
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
              Alert.alert('Success', 'Task deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete task');
            }
          },
        },
      ]
    );
  }, [deleteTask]);

  const handleComplete = useCallback(async (taskId: string) => {
    try {
      await completeTask(taskId);
    } catch (error) {
      Alert.alert('Error', 'Failed to complete task');
    }
  }, [completeTask]);

  const handleTaskPress = (taskId: string) => {
    navigation.navigate('TaskDetail', { taskId });
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="task-alt" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No tasks found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm ? 'Try a different search' : 'Add your first task'}
      </Text>
    </View>
  );

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof typeof filters] !== undefined
  ).length;

  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <View style={styles.searchContainer}>
        <CustomSearchBar
          placeholder="Search tasks..."
          onChangeText={handleSearch}
          value={searchTerm}
        />
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Icon 
            name="filter-list" 
            size={24} 
            color={activeFiltersCount > 0 ? '#2089dc' : '#86939e'} 
          />
          {activeFiltersCount > 0 && (
            <View style={styles.filterBadge} />
          )}
        </TouchableOpacity>
      </View>
      
      {showFilters && (
        <TaskFilters onClose={() => setShowFilters(false)} />
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredTasks.length} of {tasks.length} tasks
        </Text>
        <TouchableOpacity
          style={styles.viewModeButton}
          onPress={() => setViewMode(viewMode === 'list' ? 'grouped' : 'list')}
        >
          <Icon 
            name={viewMode === 'list' ? 'view-agenda' : 'view-list'} 
            size={20} 
            color="#2089dc" 
          />
          <Text style={styles.viewModeText}>
            {viewMode === 'list' ? 'Group by Date' : 'List View'}
          </Text>
        </TouchableOpacity>
        {isLoading && <ActivityIndicator size="small" color="#2089dc" style={{ marginLeft: 10 }} />}
      </View>
    </View>
  ), [searchTerm, showFilters, activeFiltersCount, filteredTasks.length, tasks.length, isLoading, viewMode]);

  const renderTask = ({ item }: { item: Task }) => (
    <TaskCard
      task={item}
      onPress={() => handleTaskPress(item.id)}
      onEdit={() => handleEdit(item.id)}
      onDelete={() => handleDelete(item.id)}
      onComplete={() => handleComplete(item.id)}
    />
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {viewMode === 'list' ? (
        <FlatList
          data={filteredTasks}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2089dc']}
            />
          }
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={10}
          initialNumToRender={10}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          renderItem={renderTask}
          renderSectionHeader={renderSectionHeader}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={renderEmptyList}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#2089dc']}
            />
          }
          stickySectionHeadersEnabled={true}
        />
      )}

      <FAB
        placement="right"
        size="large"
        color="#2089dc"
        icon={<Icon name="add" size={24} color="white" />}
        onPress={() => navigation.navigate('AddTask', {})}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  headerContainer: {
    backgroundColor: 'white',
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  filterButton: {
    padding: 10,
    marginRight: 10,
    position: 'relative',
  },
  filterBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2089dc',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  statsText: {
    color: '#86939e',
    fontSize: 14,
    flex: 1,
  },
  viewModeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  viewModeText: {
    color: '#2089dc',
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#86939e',
    marginTop: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc6cf',
    marginTop: 5,
  },
  sectionHeader: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43484d',
  },
});
