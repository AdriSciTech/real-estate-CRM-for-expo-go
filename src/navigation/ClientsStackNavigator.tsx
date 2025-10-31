import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ClientsStackParamList } from '../types/navigation.types';

// Import screens
import ClientsListScreen from '../screens/clients/ClientsListScreen';
import ClientDetailScreen from '../screens/clients/ClientDetailScreen';
import AddClientScreen from '../screens/clients/AddClientScreen';
import EditClientScreen from '../screens/clients/EditClientScreen';

const Stack = createNativeStackNavigator<ClientsStackParamList>();

export default function ClientsStackNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="ClientsList" 
        component={ClientsListScreen}
        options={{ title: 'Clients' }}
      />
      <Stack.Screen 
        name="ClientDetail" 
        component={ClientDetailScreen}
        options={{ title: 'Client Details' }}
      />
      <Stack.Screen 
        name="AddClient" 
        component={AddClientScreen}
        options={{ title: 'Add Client' }}
      />
      <Stack.Screen 
        name="EditClient" 
        component={EditClientScreen}
        options={{ title: 'Edit Client' }}
      />
    </Stack.Navigator>
  );
}