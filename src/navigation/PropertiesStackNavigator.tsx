// src/navigation/PropertiesNavigator.tsx

import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { PropertiesStackParamList } from '../types/navigation.types';
import PropertiesWithTabsScreen from '../screens/properties/PropertiesWithTabsScreen';
import PropertyDetailScreen from '../screens/properties/PropertyDetailScreen';
import AddPropertyScreen from '../screens/properties/AddPropertyScreen';
import EditPropertyScreen from '../screens/properties/EditPropertyScreen';
import DeveloperProjectDetailScreen from '../screens/developerProjects/DeveloperProjectDetailScreen';
import AddDeveloperProjectScreen from '../screens/developerProjects/AddDeveloperProjectScreen';
import EditDeveloperProjectScreen from '../screens/developerProjects/EditDeveloperProjectScreen';

const Stack = createStackNavigator<PropertiesStackParamList>();

export default function PropertiesNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="PropertiesWithTabs" 
        component={PropertiesWithTabsScreen} 
      />
      <Stack.Screen 
        name="PropertyDetail" 
        component={PropertyDetailScreen} 
      />
      <Stack.Screen 
        name="AddProperty" 
        component={AddPropertyScreen} 
      />
      <Stack.Screen 
        name="EditProperty" 
        component={EditPropertyScreen} 
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