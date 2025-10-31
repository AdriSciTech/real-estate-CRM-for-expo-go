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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { FAB, Text } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useClientsStore } from '../../store/clientsStore';
import { ClientsStackScreenProps } from '../../types/navigation.types';
import ClientCard from '../../components/clients/ClientCard';
import ClientFilters from '../../components/clients/ClientFilters';
import CustomSearchBar from '../../components/common/CustomSearchBar';

export default function ClientsListScreen({ 
  navigation 
}: ClientsStackScreenProps<'ClientsList'>) {
  const insets = useSafeAreaInsets();
  const {
    clients,
    isLoading,
    filters,
    fetchClients,
    deleteClient,
    applyFilters,
  } = useClientsStore();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchClients();
  }, []);

  // Local search and filter
  const filteredClients = useMemo(() => {
    let result = [...clients];

    // Apply search term filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(client => {
        // Search in multiple fields
        const searchableText = [
          client.name,
          client.email,
          client.phone,
          client.notes,
          client.preferred_locations,
          client.status,
          client.priority,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return searchableText.includes(searchLower);
      });
    }

    // Apply other filters
    if (filters.status) {
      result = result.filter(c => c.status === filters.status);
    }
    if (filters.priority) {
      result = result.filter(c => c.priority === filters.priority);
    }
    if (filters.property_type) {
      result = result.filter(c => c.property_type === filters.property_type);
    }
    if (filters.source_type) {
      result = result.filter(c => c.source_type === filters.source_type);
    }
    if (filters.budget_min !== undefined) {
      result = result.filter(c => (c.budget_min || 0) >= filters.budget_min!);
    }
    if (filters.budget_max !== undefined) {
      result = result.filter(c => (c.budget_max || Infinity) <= filters.budget_max!);
    }

    return result;
  }, [clients, searchTerm, filters]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchClients();
    setRefreshing(false);
  };

  // Memoize handlers
  const handleSearch = useCallback((text: string) => {
    setSearchTerm(text);
  }, []);

  const handleEdit = useCallback((clientId: string) => {
    navigation.navigate('EditClient', { clientId });
  }, [navigation]);

  const handleDelete = useCallback((clientId: string, clientName: string) => {
    Alert.alert(
      'Delete Client',
      `Are you sure you want to delete ${clientName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteClient(clientId);
              Alert.alert('Success', 'Client deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete client');
            }
          },
        },
      ]
    );
  }, [deleteClient]);

  const handleClientPress = (clientId: string) => {
    navigation.navigate('ClientDetail', { clientId });
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <Icon name="people" size={80} color="#ccc" />
      <Text style={styles.emptyText}>No clients found</Text>
      <Text style={styles.emptySubtext}>
        {searchTerm ? 'Try a different search' : 'Add your first client'}
      </Text>
    </View>
  );

  const activeFiltersCount = Object.keys(filters).filter(
    key => filters[key as keyof typeof filters] !== undefined
  ).length;

  // Memoize the header
  const ListHeader = useMemo(() => (
    <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
      <View style={styles.searchContainer}>
        <CustomSearchBar
          placeholder="Search clients..."
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
        <ClientFilters onClose={() => setShowFilters(false)} />
      )}

      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          {filteredClients.length} of {clients.length} clients
        </Text>
        {isLoading && <ActivityIndicator size="small" color="#2089dc" style={{ marginLeft: 10 }} />}
      </View>
    </View>
  ), [searchTerm, showFilters, activeFiltersCount, filteredClients.length, clients.length, isLoading, insets.top]);

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ClientCard
            client={item}
            onPress={() => handleClientPress(item.id)}
            onEdit={() => handleEdit(item.id)}
            onDelete={() => handleDelete(item.id, item.name)}
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
        // Performance optimizations
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
      />

      <FAB
        placement="right"
        size="large"
        color="#2089dc"
        icon={<Icon name="person-add" size={24} color="white" />}
        onPress={() => navigation.navigate('AddClient', {})}
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