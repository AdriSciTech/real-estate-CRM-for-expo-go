// src/navigation/CollaboratorsStackNavigator.tsx
// ===========================

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CollaboratorsStackParamList } from '../types/navigation.types';

// Import screens
import CollaboratorsListScreen from '../screens/collaborators/CollaboratorsListScreen';
import CollaboratorDetailScreen from '../screens/collaborators/CollaboratorDetailScreen';
import AddCollaboratorScreen from '../screens/collaborators/AddCollaboratorScreen';
import EditCollaboratorScreen from '../screens/collaborators/EditCollaboratorScreen';

const Stack = createNativeStackNavigator<CollaboratorsStackParamList>();

export default function CollaboratorsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="CollaboratorsList" 
        component={CollaboratorsListScreen}
        options={{ title: 'Collaborators' }}
      />
      <Stack.Screen 
        name="CollaboratorDetail" 
        component={CollaboratorDetailScreen}
        options={{ title: 'Collaborator Details' }}
      />
      <Stack.Screen 
        name="AddCollaborator" 
        component={AddCollaboratorScreen}
        options={{ title: 'Add Collaborator' }}
      />
      <Stack.Screen 
        name="EditCollaborator" 
        component={EditCollaboratorScreen}
        options={{ title: 'Edit Collaborator' }}
      />
    </Stack.Navigator>
  );
}