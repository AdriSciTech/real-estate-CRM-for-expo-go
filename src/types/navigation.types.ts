// src/types/navigation.types.ts

import { NativeStackScreenProps, NativeStackNavigationProp } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, NavigatorScreenParams, RouteProp } from '@react-navigation/native';

// Auth Stack
export type AuthStackParamList = {
  Login: undefined;
  SignUp: undefined;
  ForgotPassword: undefined;
};

// Properties Stack - Now includes Developer Projects screens
export type PropertiesStackParamList = {
  PropertiesWithTabs: undefined;
  PropertyDetail: { propertyId: string };
  AddProperty: { 
    projectId?: string; 
    collaboratorId?: string; 
  };
  EditProperty: { propertyId: string };
  DeveloperProjectDetail: { projectId: string };
  AddDeveloperProject: undefined;
  EditDeveloperProject: { projectId: string };
};

// Clients Stack
export type ClientsStackParamList = {
  ClientsList: undefined;
  ClientDetail: { clientId: string };
  AddClient: { collaboratorId?: string };
  EditClient: { clientId: string };
};

// Tasks Stack
export type TasksStackParamList = {
  TasksList: undefined;
  TaskDetail: { taskId: string };
  AddTask: { 
    relatedToType?: 'client' | 'property' | 'deal' | 'other';
    relatedToId?: string;
  };
  EditTask: { taskId: string };
};

// Deals Stack
export type DealsStackParamList = {
  DealsList: undefined;
  DealDetail: { dealId: string };
  AddDeal: { 
    clientId?: string;
    propertyId?: string;
  };
  EditDeal: { dealId: string };
};

// Collaborators Stack
export type CollaboratorsStackParamList = {
  CollaboratorsList: undefined;
  CollaboratorDetail: { collaboratorId: string };
  AddCollaborator: undefined;
  EditCollaborator: { collaboratorId: string };
};

// Main Tab Navigator
export type TabParamList = {
  Dashboard: undefined;
  Properties: NavigatorScreenParams<PropertiesStackParamList>;
  Clients: NavigatorScreenParams<ClientsStackParamList>;
  Tasks: NavigatorScreenParams<TasksStackParamList>;
  Collaborators: NavigatorScreenParams<CollaboratorsStackParamList>;
};

// Root Navigator
export type RootStackParamList = {
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Main: NavigatorScreenParams<TabParamList>;
  PropertiesStack: NavigatorScreenParams<PropertiesStackParamList>;
  ClientsStack: NavigatorScreenParams<ClientsStackParamList>;
  TasksStack: NavigatorScreenParams<TasksStackParamList>;
  DealsStack: NavigatorScreenParams<DealsStackParamList>;
  CollaboratorsStack: NavigatorScreenParams<CollaboratorsStackParamList>;
};

// Screen Props Types
export type AuthScreenProps<T extends keyof AuthStackParamList> = NativeStackScreenProps<
  AuthStackParamList,
  T
>;

export type RootStackScreenProps<T extends keyof RootStackParamList> = NativeStackScreenProps<
  RootStackParamList,
  T
>;

export type TabScreenProps<T extends keyof TabParamList> = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type PropertiesStackScreenProps<T extends keyof PropertiesStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<PropertiesStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type ClientsStackScreenProps<T extends keyof ClientsStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<ClientsStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type TasksStackScreenProps<T extends keyof TasksStackParamList> = CompositeScreenProps<
  NativeStackScreenProps<TasksStackParamList, T>,
  RootStackScreenProps<keyof RootStackParamList>
>;

export type CollaboratorsStackScreenProps<T extends keyof CollaboratorsStackParamList> = 
  NativeStackScreenProps<CollaboratorsStackParamList, T>;