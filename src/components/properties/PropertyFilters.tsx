//src\components\properties\PropertyFilters.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Input, Button, ButtonGroup } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { usePropertiesStore } from '../../store/propertiesStore';

interface PropertyFiltersProps {
  onClose: () => void;
}

const propertyTypes = ['apartment', 'house', 'commercial', 'land'];
const statusOptions = ['available', 'reserved', 'sold', 'rented'];

export default function PropertyFilters({ onClose }: PropertyFiltersProps) {
  const { filters, applyFilters, clearFilters } = usePropertiesStore();
  
  const [localFilters, setLocalFilters] = useState({
    property_type: filters.property_type || '',
    min_price: filters.min_price?.toString() || '',
    max_price: filters.max_price?.toString() || '',
    bedrooms: filters.bedrooms?.toString() || '',
    bathrooms: filters.bathrooms?.toString() || '',
    city: filters.city || '',
    status: filters.status || '',
  });

  const [selectedTypeIndex, setSelectedTypeIndex] = useState(
    propertyTypes.findIndex(type => type === filters.property_type)
  );
  
  const [selectedStatusIndex, setSelectedStatusIndex] = useState(
    statusOptions.findIndex(status => status === filters.status)
  );

  const handleApplyFilters = () => {
    const appliedFilters: any = {};
    
    if (localFilters.property_type) appliedFilters.property_type = localFilters.property_type;
    if (localFilters.min_price) appliedFilters.min_price = parseFloat(localFilters.min_price);
    if (localFilters.max_price) appliedFilters.max_price = parseFloat(localFilters.max_price);
    if (localFilters.bedrooms) appliedFilters.bedrooms = parseInt(localFilters.bedrooms);
    if (localFilters.bathrooms) appliedFilters.bathrooms = parseInt(localFilters.bathrooms);
    if (localFilters.city) appliedFilters.city = localFilters.city;
    if (localFilters.status) appliedFilters.status = localFilters.status;
    
    applyFilters(appliedFilters);
    onClose();
  };

  const handleClearFilters = () => {
    setLocalFilters({
      property_type: '',
      min_price: '',
      max_price: '',
      bedrooms: '',
      bathrooms: '',
      city: '',
      status: '',
    });
    setSelectedTypeIndex(-1);
    setSelectedStatusIndex(-1);
    clearFilters();
    onClose();
  };

  const updatePropertyType = (index: number) => {
    setSelectedTypeIndex(index);
    setLocalFilters({
      ...localFilters,
      property_type: index >= 0 ? propertyTypes[index] : '',
    });
  };

  const updateStatus = (index: number) => {
    setSelectedStatusIndex(index);
    setLocalFilters({
      ...localFilters,
      status: index >= 0 ? statusOptions[index] : '',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter Properties</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#86939e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Type</Text>
          <ButtonGroup
            onPress={updatePropertyType}
            selectedIndex={selectedTypeIndex}
            buttons={propertyTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1))}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <ButtonGroup
            onPress={updateStatus}
            selectedIndex={selectedStatusIndex}
            buttons={statusOptions.map(status => status.charAt(0).toUpperCase() + status.slice(1))}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Price Range</Text>
          <View style={styles.row}>
            <Input
              placeholder="Min Price"
              value={localFilters.min_price}
              onChangeText={(text) => setLocalFilters({ ...localFilters, min_price: text })}
              keyboardType="numeric"
              leftIcon={<Text>€</Text>}
              containerStyle={styles.halfInput}
            />
            <Input
              placeholder="Max Price"
              value={localFilters.max_price}
              onChangeText={(text) => setLocalFilters({ ...localFilters, max_price: text })}
              keyboardType="numeric"
              leftIcon={<Text>€</Text>}
              containerStyle={styles.halfInput}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Rooms</Text>
          <View style={styles.row}>
            <Input
              placeholder="Bedrooms"
              value={localFilters.bedrooms}
              onChangeText={(text) => setLocalFilters({ ...localFilters, bedrooms: text })}
              keyboardType="numeric"
              leftIcon={<Icon name="bed" size={20} color="#86939e" />}
              containerStyle={styles.halfInput}
            />
            <Input
              placeholder="Bathrooms"
              value={localFilters.bathrooms}
              onChangeText={(text) => setLocalFilters({ ...localFilters, bathrooms: text })}
              keyboardType="numeric"
              leftIcon={<Icon name="bathtub" size={20} color="#86939e" />}
              containerStyle={styles.halfInput}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Input
            placeholder="City"
            value={localFilters.city}
            onChangeText={(text) => setLocalFilters({ ...localFilters, city: text })}
            leftIcon={<Icon name="location-city" size={20} color="#86939e" />}
          />
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="Clear"
          type="outline"
          onPress={handleClearFilters}
          buttonStyle={[styles.footerButton, styles.clearButton]}
          titleStyle={styles.clearButtonText}
        />
        <Button
          title="Apply Filters"
          onPress={handleApplyFilters}
          buttonStyle={[styles.footerButton, styles.applyButton]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e1e8ee',
    maxHeight: 500,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  content: {
    padding: 15,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
    color: '#43484d',
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  halfInput: {
    flex: 1,
  },
  buttonGroup: {
    borderRadius: 8,
    height: 40,
  },
  selectedButton: {
    backgroundColor: '#2089dc',
  },
  footer: {
    flexDirection: 'row',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#e1e8ee',
    gap: 10,
  },
  footerButton: {
    flex: 1,
    borderRadius: 25,
  },
  clearButton: {
    borderColor: '#86939e',
  },
  clearButtonText: {
    color: '#86939e',
  },
  applyButton: {
    backgroundColor: '#2089dc',
  },
});