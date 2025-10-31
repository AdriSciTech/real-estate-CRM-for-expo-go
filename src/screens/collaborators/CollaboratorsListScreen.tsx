// src/screens/collaborators/CollaboratorsListScreen.tsx
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FAB, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCollaboratorsStore } from '../../store/collaboratorsStore';
import { CollaboratorsStackScreenProps } from '../../types/navigation.types';
import CollaboratorCard from '../../components/collaborators/CollaboratorCard';
import CollaboratorFilters from '../../components/collaborators/CollaboratorFilters';
import CustomSearchBar from '../../components/common/CustomSearchBar';

export default function CollaboratorsListScreen({ 
  navigation 
}: CollaboratorsStackScreenProps<'CollaboratorsList'>) {
  const {
    collaborators,
    isLoading,
    filters,
    fetchCollaborators,
    deleteCollaborator,
    applyFilters,
  } = useCollaboratorsStore();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchCollaborators();
  }, []);

  // Local search and filter
  const filteredCollaborators = useMemo(() => {
    let result = [...collaborators];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(collaborator => {
        const searchableText = [
          collaborator.name,
          collaborator.email,
          collaborator.company_name,
          collaborator.contact_person,
          collaborator.type,
          collaborator.phone,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    // Apply type filter
    if (filters.type) {
      result = result.filter(c => c.type === filters.type);
    }

    return result;
  }, [collaborators, searchTerm, filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCollaborators();
    setRefreshing(false);
  };

  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  const handleEdit = useCallback((collaboratorId: string) => {
    navigation.navigate('EditCollaborator', { collaboratorId });
  }, [navigation]);

  const handleDelete = useCallback((collaboratorId: string) => {
    Alert.alert(
      'Delete Collaborator',
      'Are you sure you want to delete this collaborator? This will also remove their association with any properties or clients.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCollaborator(collaboratorId);
              Alert.alert('Success', 'Collaborator deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete collaborator');
            }
          },
        },
      ]
    );
  }, [deleteCollaborator]);

  const handleCollaboratorPress = (collaboratorId: string) => {
    navigation.navigate('CollaboratorDetail', { collaboratorId });
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No collaborators found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm ? 'Try a different search' : 'Add your first collaborator'}
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
          placeholder="Search collaborators..."
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
        <CollaboratorFilters onClose={() => setShowFilters(false)} />
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredCollaborators.length} of {collaborators.length} collaborators
        </Text>
        {isLoading && <ActivityIndicator size="small" color="#2089dc" style={{ marginLeft: 10 }} />}
      </View>
    </View>
  ), [searchTerm, showFilters, activeFiltersCount, filteredCollaborators.length, collaborators.length, isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredCollaborators}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <CollaboratorCard
            collaborator={item}
            onPress={() => handleCollaboratorPress(item.id)}
            onEdit={() => handleEdit(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
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
        onPress={() => navigation.navigate('AddCollaborator')}
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
});
