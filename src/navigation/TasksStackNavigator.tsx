// src/navigation/TasksStackNavigator.tsx
// ===========================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { TasksStackParamList } from '../types/navigation.types';

// Import screens
import TasksListScreen from '../screens/tasks/TasksListScreen';
import TaskDetailScreen from '../screens/tasks/TaskDetailScreen';
import AddTaskScreen from '../screens/tasks/AddTaskScreen';
import EditTaskScreen from '../screens/tasks/EditTaskScreen';

const Stack = createNativeStackNavigator<TasksStackParamList>();

export default function TasksStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="TasksList" 
        component={TasksListScreen}
        options={{ title: 'Tasks' }}
      />
      <Stack.Screen 
        name="TaskDetail" 
        component={TaskDetailScreen}
        options={{ title: 'Task Details' }}
      />
      <Stack.Screen 
        name="AddTask" 
        component={AddTaskScreen}
        options={{ title: 'Add Task' }}
      />
      <Stack.Screen 
        name="EditTask" 
        component={EditTaskScreen}
        options={{ title: 'Edit Task' }}
      />
    </Stack.Navigator>
  );
}