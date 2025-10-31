// src/navigation/DeveloperProjectsNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PropertiesStackParamList } from '../types/navigation.types';
import DeveloperProjectsListScreen from '../screens/developerProjects/DeveloperProjectsListScreen';
import DeveloperProjectDetailScreen from '../screens/developerProjects/DeveloperProjectDetailScreen';
import AddDeveloperProjectScreen from '../screens/developerProjects/AddDeveloperProjectScreen';
import EditDeveloperProjectScreen from '../screens/developerProjects/EditDeveloperProjectScreen';

const Stack = createStackNavigator<PropertiesStackParamList>();

export default function DeveloperProjectsNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="PropertiesWithTabs" 
        component={DeveloperProjectsListScreen} 
      />
      <Stack.Screen 
        name="DeveloperProjectDetail" 
        component={DeveloperProjectDetailScreen} 
      />
      <Stack.Screen 
        name="AddDeveloperProject" 
        component={AddDeveloperProjectScreen} 
      />
      <Stack.Screen 
        name="EditDeveloperProject" 
        component={EditDeveloperProjectScreen} 
      />
    </Stack.Navigator>
  );
}