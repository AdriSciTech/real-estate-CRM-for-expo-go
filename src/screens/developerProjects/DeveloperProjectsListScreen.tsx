// src/screens/developerProjects/DeveloperProjectsListScreen.tsx
// Updated version that works as a tab without its own header

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { FAB, Text, Card } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDeveloperProjectsStore } from '../../store/developerProjectsStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PropertiesStackParamList } from '../../types/navigation.types';
import CustomSearchBar from '../../components/common/CustomSearchBar';

type NavigationProp = StackNavigationProp<PropertiesStackParamList>;

export default function DeveloperProjectsListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    projects,
    isLoading,
    fetchProjects,
    deleteProject,
  } = useDeveloperProjectsStore();

  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
  }, []);

  // Local search
  const filteredProjects = useMemo(() => {
    if (!searchTerm.trim()) return projects;

    const searchLower = searchTerm.toLowerCase().trim();
    return projects.filter(project => {
      const searchableText = [
        project.name,
        project.location,
        project.description,
        project.collaborators?.name,
        project.collaborators?.company_name,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      return searchableText.includes(searchLower);
    });
  }, [projects, searchTerm]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProjects();
    setRefreshing(false);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  const handleEdit = useCallback((projectId: string) => {
    navigation.navigate('EditDeveloperProject', { projectId });
  }, [navigation]);

  const handleDelete = useCallback((projectId: string, projectName: string) => {
    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${projectName}"? Properties will be unlinked but not deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(projectId);
              Alert.alert('Success', 'Project deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  }, [deleteProject]);

  const handleProjectPress = (projectId: string) => {
    navigation.navigate('DeveloperProjectDetail', { projectId });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short',
      day: 'numeric'
    });
  };

  const renderProjectCard = ({ item }: { item: typeof projects[0] }) => {
    const propertyCount = item.properties?.length || 0;

    return (
      <TouchableOpacity onPress={() => handleProjectPress(item.id)}>
        <View style={styles.card}>
          <View style={styles.cardHeader}>
              <View style={styles.cardHeaderLeft}>
                <Text style={styles.projectName}>{item.name}</Text>
                <Text style={styles.developerName}>
                  {item.collaborators?.company_name || item.collaborators?.name}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.menuButton}
                onPress={() => {
                  Alert.alert(
                    'Project Options',
                    '',
                    [
                      { text: 'Edit', onPress: () => handleEdit(item.id) },
                      { 
                        text: 'Delete', 
                        onPress: () => handleDelete(item.id, item.name),
                        style: 'destructive'
                      },
                      { text: 'Cancel', style: 'cancel' }
                    ]
                  );
                }}
              >
                <Icon name="more-vert" size={24} color="#86939e" />
              </TouchableOpacity>
            </View>

            {item.location && (
              <View style={styles.locationContainer}>
                <Icon name="location-on" size={16} color="#86939e" />
                <Text style={styles.locationText}>{item.location}</Text>
              </View>
            )}

            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{item.total_units || 0}</Text>
                <Text style={styles.statLabel}>Total Units</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{propertyCount}</Text>
                <Text style={styles.statLabel}>Listed</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{formatDate(item.delivery_date)}</Text>
                <Text style={styles.statLabel}>Delivery</Text>
              </View>
            </View>

            {item.description && (
              <Text style={styles.description} numberOfLines={2}>
                {item.description}
              </Text>
            )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="apartment" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No developer projects found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm ? 'Try a different search' : 'Add your first developer project'}
      </Text>
    </View>
  );

  const ListHeader = useMemo(() => (
    <View style={styles.headerContainer}>
      <CustomSearchBar
        placeholder="Search projects..."
        onChangeText={handleSearch}
        value={searchTerm}
      />
      
      <View style={styles.statsHeaderContainer}>
        <Text style={styles.statsText}>
          {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''}
        </Text>
        {isLoading && <ActivityIndicator size="small" color="#2089dc" style={{ marginLeft: 10 }} />}
      </View>
    </View>
  ), [searchTerm, filteredProjects.length, isLoading]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProjects}
        keyExtractor={(item) => item.id}
        renderItem={renderProjectCard}
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

      <FAB
        placement="right"
        size="large"
        color="#2089dc"
        icon={<Icon name="add" size={24} color="white" />}
        onPress={() => navigation.navigate('AddDeveloperProject')}
      />
    </View>
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
  statsHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 5,
  },
  statsText: {
    color: '#86939e',
    fontSize: 14,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 80,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  cardHeaderLeft: {
    flex: 1,
  },
  projectName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43484d',
    marginBottom: 4,
  },
  developerName: {
    fontSize: 14,
    color: '#2089dc',
  },
  menuButton: {
    padding: 5,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  locationText: {
    fontSize: 14,
    color: '#86939e',
    marginLeft: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#43484d',
  },
  statLabel: {
    fontSize: 12,
    color: '#86939e',
    marginTop: 2,
  },
  description: {
    fontSize: 14,
    color: '#86939e',
    marginTop: 15,
    lineHeight: 20,
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
});