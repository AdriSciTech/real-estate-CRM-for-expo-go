// src/navigation/TabNavigator.tsx

import React, { useCallback, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { TabParamList } from '../types/navigation.types';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Button, Avatar, Card, FAB, Divider } from 'react-native-elements';
import { SafeAreaView } from 'react-native-safe-area-context';
import ClientsStackNavigator from './ClientsStackNavigator';
import PropertiesStackNavigator from './PropertiesStackNavigator';
import CollaboratorsStackNavigator from './CollaboratorsStackNavigator';
import TasksStackNavigator from './TasksStackNavigator';
import { useAuthStore } from '../store/authStore';

const Tab = createBottomTabNavigator<TabParamList>();

/** -------------------------------------------
 * Dashboard Screen (actionable)
 * - KPI cards (Leads, Properties, Tasks, Docs)
 * - Quick actions (Add Client/Property/Task, Import)
 * - Recent activity + Upcoming tasks
 * - Global FAB (quick add)
 * ------------------------------------------ */
const DashboardScreen = () => {
  const { signOut, isLoading, user } = useAuthStore();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data (replace with real selectors/queries)
  const kpis = [
    { label: 'Leads', value: 8, icon: 'person-search', color: '#0ea5e9' },
    { label: 'Properties', value: 12, icon: 'home-work', color: '#10b981' },
    { label: 'Tasks', value: 5, icon: 'checklist', color: '#f59e0b' },
    { label: 'Docs', value: 43, icon: 'description', color: '#6366f1' },
  ];

  const upcomingTasks = [
    { id: 't1', title: 'Send buyer-rep agreement (Sofia)', due: 'Today' },
    { id: 't2', title: 'Upload IBI receipt (Duplex)', due: 'Tomorrow' },
    { id: 't3', title: 'Confirm viewing with David', due: 'Wed' },
  ];

  const recentActivity = [
    { id: 'a1', icon: 'phone', text: 'Called Sofia – confirmed viewing', time: '2h' },
    { id: 'a2', icon: 'email', text: 'Sent buyer-rep agreement to David', time: '4h' },
    { id: 'a3', icon: 'photo', text: 'Added 12 photos to “2BR – Salamanca”', time: 'Yesterday' },
  ];

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // TODO: trigger refetch queries here
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Logout',
        onPress: async () => {
          try {
            await signOut();
          } catch (error: any) {
            Alert.alert('Logout Failed', error.message || 'An error occurred during logout.');
          }
        },
        style: 'destructive',
      },
    ]);
  };

  const QuickAction = ({
    icon,
    label,
    onPress,
  }: {
    icon: string;
    label: string;
    onPress?: () => void;
  }) => (
    <TouchableOpacity style={styles.quickAction} onPress={onPress}>
      <View style={styles.quickIconWrap}>
        <Icon name={icon} size={22} color="#2089dc" />
      </View>
      <Text style={styles.quickLabel}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBar}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Avatar
            rounded
            title={user?.email ? user.email[0]?.toUpperCase() : 'U'}
            containerStyle={{ backgroundColor: '#0F172A' }}
            size={40}
          />
          <View style={{ marginLeft: 12 }}>
            <Text style={styles.headerTop}>Solo Agent CRM</Text>
            <Text style={styles.headerTitle}>Your private command center</Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Button
            type="clear"
            icon={<Icon name="search" size={24} color="#fff" />}
            onPress={() => Alert.alert('Search', 'Open global search')}
          />
          <Button
            type="clear"
            icon={<Icon name="logout" size={24} color="#fff" />}
            onPress={handleLogout}
            loading={isLoading}
          />
        </View>
      </View>

      {/* Body */}
      <ScrollView
        contentContainerStyle={styles.scrollBody}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Welcome */}
        <Card containerStyle={styles.card}>
          <View style={styles.welcomeRow}>
            <View>
              <Text style={styles.welcome}>Welcome{user?.email ? `, ${user.email}` : ''}</Text>
              <Text style={styles.subtle}>Here’s what needs your attention today.</Text>
            </View>
            <Icon name="bolt" size={26} color="#f59e0b" />
          </View>
        </Card>

        {/* KPIs */}
        <View style={styles.kpiRow}>
          {kpis.map((k) => (
            <View key={k.label} style={styles.kpiCard}>
              <View style={[styles.kpiIcon, { backgroundColor: `${k.color}22` }]}>
                <Icon name={k.icon} size={20} color={k.color} />
              </View>
              <Text style={styles.kpiValue}>{k.value}</Text>
              <Text style={styles.kpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick Actions */}
        <Card containerStyle={styles.card}>
          <Text style={styles.sectionTitle}>Quick actions</Text>
          <View style={styles.quickRow}>
            <QuickAction icon="person-add-alt" label="Add Client" onPress={() => Alert.alert('Add', 'Add client flow')} />
            <QuickAction icon="add-home-work" label="Add Property" onPress={() => Alert.alert('Add', 'Add property flow')} />
            <QuickAction icon="add-task" label="New Task" onPress={() => Alert.alert('Add', 'Add task flow')} />
            <QuickAction icon="drive-folder-upload" label="Import" onPress={() => Alert.alert('Import', 'Drive/Dropbox import')} />
          </View>
        </Card>

        {/* Upcoming Tasks */}
        <Card containerStyle={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Upcoming</Text>
            <Button
              type="clear"
              title="View all"
              titleStyle={{ color: '#2089dc', fontSize: 14 }}
              onPress={() => Alert.alert('Tasks', 'Navigate to tasks')}
            />
          </View>
          {upcomingTasks.map((t, i) => (
            <View key={t.id}>
              <View style={styles.rowItem}>
                <Icon name="event" size={18} color="#64748b" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.itemTitle}>{t.title}</Text>
                  <Text style={styles.itemMeta}>Due: {t.due}</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#94a3b8" />
              </View>
              {i < upcomingTasks.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        {/* Recent Activity */}
        <Card containerStyle={styles.card}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent activity</Text>
            <Button
              type="clear"
              title="Refresh"
              titleStyle={{ color: '#2089dc', fontSize: 14 }}
              onPress={onRefresh}
            />
          </View>
          {recentActivity.map((a, i) => (
            <View key={a.id}>
              <View style={styles.rowItem}>
                <Icon name={a.icon} size={18} color="#64748b" />
                <View style={{ flex: 1, marginLeft: 10 }}>
                  <Text style={styles.itemTitle}>{a.text}</Text>
                  <Text style={styles.itemMeta}>{a.time} ago</Text>
                </View>
                <Icon name="chevron-right" size={20} color="#94a3b8" />
              </View>
              {i < recentActivity.length - 1 && <Divider />}
            </View>
          ))}
        </Card>

        {/* Logout */}
        <View style={{ marginHorizontal: 12, marginBottom: 90 }}>
          <Button
            title="Logout"
            onPress={handleLogout}
            loading={isLoading}
            disabled={isLoading}
            buttonStyle={styles.logoutButton}
            titleStyle={styles.logoutButtonText}
            icon={<Icon name="logout" size={20} color="white" style={{ marginRight: 10 }} />}
          />
        </View>
      </ScrollView>

      {/* Global FAB (quick add) */}
      <FAB
        placement="right"
        color="#2089dc"
        icon={<Icon name="add" size={24} color="#fff" />}
        onPress={() =>
          Alert.alert('Quick add', 'Choose what to add', [
            { text: 'Client', onPress: () => Alert.alert('Add client') },
            { text: 'Property', onPress: () => Alert.alert('Add property') },
            { text: 'Task', onPress: () => Alert.alert('Add task') },
            { text: 'Import', onPress: () => Alert.alert('Drive/Dropbox import') },
            { text: 'Cancel', style: 'cancel' },
          ])
        }
      />
    </SafeAreaView>
  );
};

export default function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ color, size }) => {
          let iconName: string;
          switch (route.name) {
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Properties':
              iconName = 'home';
              break;
            case 'Clients':
              iconName = 'business';
              break;
            case 'Tasks':
              iconName = 'task-alt';
              break;
            case 'Collaborators':
              iconName = 'people';
              break;
            default:
              iconName = 'circle';
          }
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#2089dc',
        tabBarInactiveTintColor: '#94a3b8',
        headerShown: false, // we render a custom header in Dashboard and stacks manage their own
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopWidth: StyleSheet.hairlineWidth,
          borderTopColor: '#e2e8f0',
          height: 58,
          paddingBottom: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarHideOnKeyboard: true,
      })}
    >
      <Tab.Screen name="Dashboard" component={DashboardScreen} options={{ tabBarLabel: 'Dashboard' }} />
      <Tab.Screen name="Properties" component={PropertiesStackNavigator} options={{ tabBarLabel: 'Properties', headerShown: false }} />
      <Tab.Screen name="Clients" component={ClientsStackNavigator} options={{ tabBarLabel: 'Clients', headerShown: false }} />
      <Tab.Screen name="Tasks" component={TasksStackNavigator} options={{ tabBarLabel: 'Tasks', headerShown: false }} />
      <Tab.Screen name="Collaborators" component={CollaboratorsStackNavigator} options={{ tabBarLabel: 'Collaborators', headerShown: false }} />
    </Tab.Navigator>
  );
}

/* -------------------- Styles -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f5f7fb' },
  headerBar: {
    backgroundColor: '#2089dc',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTop: { color: 'rgba(255,255,255,0.85)', fontSize: 12 },
  headerTitle: { color: '#fff', fontWeight: '700', fontSize: 16 },
  scrollBody: { paddingTop: 12 },
  card: { borderRadius: 16, borderWidth: 0, shadowColor: '#000', shadowOpacity: 0.08, shadowRadius: 8 },
  welcomeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  welcome: { fontSize: 18, fontWeight: '700', color: '#0f172a' },
  subtle: { color: '#64748b', marginTop: 2 },

  kpiRow: {
    marginTop: 4,
    marginHorizontal: 12,
    flexDirection: 'row',
    gap: 10,
    justifyContent: 'space-between',
  },
  kpiCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
  },
  kpiIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  kpiValue: { fontSize: 18, fontWeight: '800', color: '#0f172a' },
  kpiLabel: { fontSize: 12, color: '#64748b' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },

  quickRow: {
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  quickAction: {
    flex: 1,
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#e6f2fb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  quickLabel: { fontSize: 12, fontWeight: '600', color: '#0f172a' },

  rowItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  itemTitle: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  itemMeta: { fontSize: 12, color: '#64748b', marginTop: 2 },

  logoutButton: { backgroundColor: '#dc3545', borderRadius: 25, paddingVertical: 12 },
  logoutButtonText: { fontSize: 16, fontWeight: '700' },
});
