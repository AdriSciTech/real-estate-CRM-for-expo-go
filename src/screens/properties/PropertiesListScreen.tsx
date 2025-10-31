// src/screens/properties/PropertiesListScreen.tsx
// Polished list UI: sticky header, chips for active filters, sort, nicer empty state, refined FAB

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  View,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ActionSheetIOS,
  Platform,
  ScrollView,
} from 'react-native';

import { FAB, Text, Badge, Divider, Button, Overlay } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePropertiesStore } from '../../store/propertiesStore';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PropertiesStackParamList } from '../../types/navigation.types';
import PropertyCard from '../../components/properties/PropertyCard';
import PropertyFilters from '../../components/properties/PropertyFilters';
import CustomSearchBar from '../../components/common/CustomSearchBar';

type NavigationProp = StackNavigationProp<PropertiesStackParamList>;

type SortKey = 'recent' | 'price_low' | 'price_high' | 'beds' | 'baths' | 'title';

export default function PropertiesListScreen() {
  const navigation = useNavigation<NavigationProp>();
  const {
    properties,
    isLoading,
    filters,
    fetchProperties,
    deleteProperty,
    applyFilters,
  } = usePropertiesStore();

  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('recent');
  const [showImportHint, setShowImportHint] = useState(false);

  useEffect(() => {
    fetchProperties();
  }, []);

  // ----- Derived state -----
  const activeFilters = useMemo(() => {
    const f: Record<string, any> = {};
    (Object.keys(filters) as (keyof typeof filters)[]).forEach((k) => {
      if (filters[k] !== undefined && filters[k] !== '' && filters[k] !== null) {
        f[String(k)] = filters[k];
      }
    });
    return f;
  }, [filters]);

  // Search + Filters + Sort
  const filteredProperties = useMemo(() => {
    let result = [...properties];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase().trim();
      result = result.filter((p) => {
        const searchableText = [
          p.title,
          p.description,
          p.location,
          p.address,
          p.city,
          p.property_type,
          p.price?.toString(),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        return searchableText.includes(q);
      });
    }

    if (filters.property_type) result = result.filter((p) => p.property_type === filters.property_type);
    if (filters.status) result = result.filter((p) => p.status === filters.status);
    if (filters.min_price !== undefined) result = result.filter((p) => (p.price || 0) >= (filters.min_price as number));
    if (filters.max_price !== undefined) result = result.filter((p) => (p.price || 0) <= (filters.max_price as number));
    if (filters.bedrooms !== undefined) result = result.filter((p) => (p.bedrooms || 0) >= (filters.bedrooms as number));
    if (filters.bathrooms !== undefined) result = result.filter((p) => (p.bathrooms || 0) >= (filters.bathrooms as number));
    if (filters.city) result = result.filter((p) => p.city?.toLowerCase().includes(String(filters.city).toLowerCase()));

    // Sort
    switch (sortKey) {
      case 'price_low':
        result.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_high':
        result.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'beds':
        result.sort((a, b) => (b.bedrooms || 0) - (a.bedrooms || 0));
        break;
      case 'baths':
        result.sort((a, b) => (b.bathrooms || 0) - (a.bathrooms || 0));
        break;
      case 'title':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || ''));
        break;
      case 'recent':
      default:
        result.sort((a, b) => {
          const da = new Date(a.updated_at || a.created_at || 0).getTime();
          const db = new Date(b.updated_at || b.created_at || 0).getTime();
          return db - da;
        });
        break;
    }

    return result;
  }, [properties, searchTerm, filters, sortKey]);

  // ----- Handlers -----
  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchProperties();
    setRefreshing(false);
  };

  const handleSearch = useCallback((text: string) => setSearchTerm(text), []);

  const handleEdit = useCallback(
    (propertyId: string) => navigation.navigate('EditProperty', { propertyId }),
    [navigation]
  );

  const handleDelete = useCallback(
    (propertyId: string) => {
      Alert.alert('Delete Property', 'Are you sure you want to delete this property?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProperty(propertyId);
              Alert.alert('Success', 'Property deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete property');
            }
          },
        },
      ]);
    },
    [deleteProperty]
  );

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetail', { propertyId });
  };

  const clearFilterKey = (k: string) => {
    const next = { ...filters, [k]: undefined };
    applyFilters(next);
  };

  const clearAllFilters = () => {
    const next = Object.keys(filters).reduce((acc, k) => ({ ...acc, [k]: undefined }), {});
    applyFilters(next as any);
  };

  const openSortSheet = () => {
    const options = ['Most recent', 'Price: Low → High', 'Price: High → Low', 'Bedrooms', 'Bathrooms', 'Title A→Z', 'Cancel'];
    const handlers: SortKey[] = ['recent', 'price_low', 'price_high', 'beds', 'baths', 'title'];

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options, cancelButtonIndex: options.length - 1, userInterfaceStyle: 'light' },
        (i) => {
          if (i >= 0 && i < handlers.length) setSortKey(handlers[i]);
        }
      );
    } else {
      // Simple fallback for Android
      Alert.alert('Sort by', '', [
        { text: options[0], onPress: () => setSortKey('recent') },
        { text: options[1], onPress: () => setSortKey('price_low') },
        { text: options[2], onPress: () => setSortKey('price_high') },
        { text: options[3], onPress: () => setSortKey('beds') },
        { text: options[4], onPress: () => setSortKey('baths') },
        { text: options[5], onPress: () => setSortKey('title') },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  // ----- Header (sticky) -----
  const ListHeader = useMemo(() => {
    const activeCount = Object.keys(activeFilters).length;

    return (
      <View style={styles.headerWrap}>
        {/* Top bar: Search + Filters + Sort */}
        <View style={styles.searchRow}>
          <View style={{ flex: 1 }}>
            <CustomSearchBar
              placeholder="Search properties…"
              onChangeText={handleSearch}
              value={searchTerm}
            />
          </View>

          <TouchableOpacity style={styles.iconBtn} onPress={() => setShowFilters(!showFilters)}>
            <Icon name="filter-list" size={22} color={activeCount > 0 ? '#2089dc' : '#64748b'} />
            {activeCount > 0 && <View style={styles.badgeDot} />}
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconBtn} onPress={openSortSheet}>
            <Icon name="sort" size={22} color="#64748b" />
          </TouchableOpacity>
        </View>

        {/* Filter chips */}
        {activeCount > 0 && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {Object.entries(activeFilters).map(([k, v]) => (
              <View key={k} style={styles.chip}>
                <Icon name="tune" size={14} color="#2089dc" />
                <Text style={styles.chipText}>
                  {k.replace('_', ' ')}: {String(v)}
                </Text>
                <TouchableOpacity onPress={() => clearFilterKey(k)}>
                  <Icon name="close" size={14} color="#0f172a" />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity style={styles.clearAllChip} onPress={clearAllFilters}>
              <Icon name="backspace" size={16} color="#dc2626" />
              <Text style={styles.clearAllText}>Clear all</Text>
            </TouchableOpacity>
          </ScrollView>
        )}

        {/* Stats */}
        <View style={styles.statsRow}>
          <Text style={styles.statsText}>
            <Text style={styles.statsStrong}>{filteredProperties.length}</Text> of{' '}
            <Text style={styles.statsStrong}>{properties.length}</Text> properties
          </Text>
          <View style={styles.rightActions}>
            {isLoading && <ActivityIndicator size="small" color="#2089dc" style={{ marginRight: 8 }} />}
            <TouchableOpacity onPress={handleRefresh} style={styles.refreshPill}>
              <Icon name="refresh" size={16} color="#2089dc" />
              <Text style={styles.refreshPillText}>Refresh</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showFilters && (
          <>
            <PropertyFilters onClose={() => setShowFilters(false)} />
            <Divider />
          </>
        )}
      </View>
    );
  }, [
    searchTerm,
    showFilters,
    activeFilters,
    filteredProperties.length,
    properties.length,
    isLoading,
  ]);

  // ----- Renderers -----
  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconWrap}>
        <Icon name="home-work" size={56} color="#94a3b8" />
      </View>
      <Text style={styles.emptyTitle}>No properties found</Text>
      <Text style={styles.emptySub}>
        {searchTerm ? 'Try a different search or clear filters.' : 'Add your first property or import from Drive/Dropbox.'}
      </Text>

      <View style={styles.emptyActions}>
        <Button
          title="Add Property"
          onPress={() => navigation.navigate('AddProperty', {})}
          buttonStyle={styles.primaryBtn}
          icon={<Icon name="add-home-work" size={18} color="#fff" style={{ marginRight: 8 }} />}
        />
        <Button
          title="Import"
          type="outline"
          onPress={() => setShowImportHint(true)}
          buttonStyle={styles.outlineBtn}
          titleStyle={{ color: '#2089dc', fontWeight: '700' }}
          icon={<Icon name="drive-folder-upload" size={18} color="#2089dc" style={{ marginRight: 8 }} />}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredProperties}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <PropertyCard
            property={item}
            onPress={() => handlePropertyPress(item.id)}
            onEdit={() => handleEdit(item.id)}
            onDelete={() => handleDelete(item.id)}
          />
        )}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={renderEmptyList}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#2089dc']} />
        }
        removeClippedSubviews
        maxToRenderPerBatch={10}
        windowSize={10}
        initialNumToRender={10}
        keyboardShouldPersistTaps="handled"
      />

      {/* Dual-purpose FAB */}
      <FAB
        placement="right"
        size="large"
        color="#2089dc"
        icon={<Icon name="add" size={24} color="white" />}
        onPress={() =>
          Alert.alert('Quick action', 'What would you like to do?', [
            { text: 'Add Property', onPress: () => navigation.navigate('AddProperty', {}) },
            { text: 'Import (Drive/Dropbox)', onPress: () => setShowImportHint(true) },
            { text: 'Cancel', style: 'cancel' },
          ])
        }
      />

      {/* Lightweight import hint (you can wire to your import flow) */}
      <Overlay isVisible={showImportHint} onBackdropPress={() => setShowImportHint(false)} overlayStyle={styles.overlay}>
        <View style={{ alignItems: 'center' }}>
          <Icon name="drive-folder-upload" size={36} color="#2089dc" />
          <Text style={styles.overlayTitle}>Import from Drive / Dropbox</Text>
          <Text style={styles.overlaySub}>
            Pick files from your cloud and attach them to a property. Fast and simple—no full sync needed.
          </Text>
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
            <Button
              title="Choose from Drive"
              onPress={() => {
                setShowImportHint(false);
                Alert.alert('Import', 'Open Google Picker');
              }}
              buttonStyle={styles.primaryBtn}
              icon={<Icon name="cloud" size={18} color="#fff" style={{ marginRight: 8 }} />}
            />
            <Button
              title="Choose from Dropbox"
              type="outline"
              onPress={() => {
                setShowImportHint(false);
                Alert.alert('Import', 'Open Dropbox Chooser');
              }}
              buttonStyle={styles.outlineBtn}
              titleStyle={{ color: '#2089dc', fontWeight: '700' }}
              icon={<Icon name="folder" size={18} color="#2089dc" style={{ marginRight: 8 }} />}
            />
          </View>
        </View>
      </Overlay>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f6f8fb' },
  listContent: { paddingBottom: 90, paddingTop: 4, paddingHorizontal: 10 },
  separator: { height: 8 },

  // Header
  headerWrap: {
    backgroundColor: '#ffffff',
    paddingTop: 6,
    paddingBottom: 10,
    paddingHorizontal: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
  },
  searchRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  iconBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
  badgeDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2089dc',
  },
  chipsRow: {
    paddingTop: 8,
    paddingBottom: 2,
    alignItems: 'center',
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eef6ff',
    borderColor: '#bfdbfe',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
    marginRight: 8,
  },
  chipText: { color: '#0f172a', fontSize: 12, fontWeight: '600' },
  clearAllChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#fff1f2',
    borderColor: '#fecaca',
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  clearAllText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },

  statsRow: {
    marginTop: 6,
    paddingHorizontal: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statsText: { color: '#64748b', fontSize: 13 },
  statsStrong: { color: '#0f172a', fontWeight: '800' },
  rightActions: { flexDirection: 'row', alignItems: 'center' },
  refreshPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  refreshPillText: { color: '#2089dc', fontWeight: '700', fontSize: 12 },

  // Empty state
  emptyContainer: { alignItems: 'center', paddingTop: 80, paddingHorizontal: 24 },
  emptyIconWrap: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#0f172a', marginTop: 16 },
  emptySub: { fontSize: 14, color: '#64748b', marginTop: 6, textAlign: 'center' },
  emptyActions: { flexDirection: 'row', gap: 10, marginTop: 16 },

  // Buttons
  primaryBtn: { backgroundColor: '#2089dc', borderRadius: 24, paddingVertical: 10, paddingHorizontal: 16 },
  outlineBtn: {
    borderColor: '#2089dc',
    borderWidth: 2,
    borderRadius: 24,
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },

  // Overlay
  overlay: { width: '88%', borderRadius: 18, padding: 18 },
  overlayTitle: { fontSize: 18, fontWeight: '700', color: '#0f172a', marginTop: 12, textAlign: 'center' },
  overlaySub: { fontSize: 14, color: '#64748b', marginTop: 8, textAlign: 'center', lineHeight: 20 },
});
