// src/screens/properties/PropertiesWithTabsScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  Animated,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-elements';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import PropertiesListScreen from './PropertiesListScreen';
import DeveloperProjectsListScreen from '../developerProjects/DeveloperProjectsListScreen';
import { PropertiesStackScreenProps } from '../../types/navigation.types';

const Tab = createMaterialTopTabNavigator();

const { width } = Dimensions.get('window');

// Custom Tab Bar Component for better control and styling
function CustomTabBar({ state, descriptors, navigation, position }: any) {
  const translateX = position.interpolate({
    inputRange: [0, 1],
    outputRange: [0, width / 2],
  });

  return (
    <View style={styles.tabBarContainer}>
      <View style={styles.tabBar}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label = options.tabBarLabel || options.title || route.name;
          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={styles.tabItem}
            >
              <Text style={[
                styles.tabLabel,
                isFocused && styles.tabLabelActive
              ]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <Animated.View
        style={[
          styles.tabIndicator,
          {
            transform: [{ translateX }],
          },
        ]}
      />
    </View>
  );
}

export default function PropertiesWithTabsScreen({
  navigation,
  route
}: PropertiesStackScreenProps<'PropertiesWithTabs'>) {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Properties</Text>
      </View>
      
      <Tab.Navigator
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{
          swipeEnabled: true,
          lazy: false, // Load both tabs for smoother experience
          animationEnabled: true,
        }}
      >
        <Tab.Screen
          name="AllProperties"
          component={PropertiesListScreen}
          options={{
            tabBarLabel: 'All Properties',
          }}
        />
        <Tab.Screen
          name="DeveloperProjects"
          component={DeveloperProjectsListScreen}
          options={{
            tabBarLabel: 'Developer Projects',
          }}
        />
      </Tab.Navigator>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2089dc',
    paddingVertical: 15,
    paddingHorizontal: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  tabBarContainer: {
    backgroundColor: 'white',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  tabBar: {
    flexDirection: 'row',
    paddingTop: 10,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#86939e',
  },
  tabLabelActive: {
    color: '#2089dc',
  },
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    width: width / 2,
    height: 3,
    backgroundColor: '#2089dc',
  },
});