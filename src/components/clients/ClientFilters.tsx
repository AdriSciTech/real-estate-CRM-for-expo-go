// src/components/clients/ClientFilters.tsx

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
import { useClientsStore } from '../../store/clientsStore';

interface ClientFiltersProps {
  onClose: () => void;
}

const statusOptions = ['new', 'contacted', 'visited', 'negotiating', 'closed', 'lost'];
const priorityOptions = ['high', 'medium', 'low'];
const propertyTypes = ['apartment', 'house', 'commercial', 'land'];
const sourceTypes = ['direct', 'partner', 'referral', 'website'];

export default function ClientFilters({ onClose }: ClientFiltersProps) {
  const { filters, applyFilters, clearFilters } = useClientsStore();
  
  const [localFilters, setLocalFilters] = useState({
    status: filters.status || '',
    priority: filters.priority || '',
    property_type: filters.property_type || '',
    source_type: filters.source_type || '',
    budget_min: filters.budget_min?.toString() || '',
    budget_max: filters.budget_max?.toString() || '',
  });

  const [selectedStatusIndex, setSelectedStatusIndex] = useState(
    statusOptions.findIndex(status => status === filters.status)
  );
  
  const [selectedPriorityIndex, setSelectedPriorityIndex] = useState(
    priorityOptions.findIndex(priority => priority === filters.priority)
  );

  const [selectedTypeIndex, setSelectedTypeIndex] = useState(
    propertyTypes.findIndex(type => type === filters.property_type)
  );

  const [selectedSourceIndex, setSelectedSourceIndex] = useState(
    sourceTypes.findIndex(source => source === filters.source_type)
  );

  const handleApplyFilters = () => {
    const appliedFilters: any = {};
    
    if (localFilters.status) appliedFilters.status = localFilters.status;
    if (localFilters.priority) appliedFilters.priority = localFilters.priority;
    if (localFilters.property_type) appliedFilters.property_type = localFilters.property_type;
    if (localFilters.source_type) appliedFilters.source_type = localFilters.source_type;
    if (localFilters.budget_min) appliedFilters.budget_min = parseFloat(localFilters.budget_min);
    if (localFilters.budget_max) appliedFilters.budget_max = parseFloat(localFilters.budget_max);
    
    applyFilters(appliedFilters);
    onClose();
  };

  const handleClearFilters = () => {
    setLocalFilters({
      status: '',
      priority: '',
      property_type: '',
      source_type: '',
      budget_min: '',
      budget_max: '',
    });
    setSelectedStatusIndex(-1);
    setSelectedPriorityIndex(-1);
    setSelectedTypeIndex(-1);
    setSelectedSourceIndex(-1);
    clearFilters();
    onClose();
  };

  const updateStatus = (index: number) => {
    setSelectedStatusIndex(index);
    setLocalFilters({
      ...localFilters,
      status: index >= 0 ? statusOptions[index] : '',
    });
  };

  const updatePriority = (index: number) => {
    setSelectedPriorityIndex(index);
    setLocalFilters({
      ...localFilters,
      priority: index >= 0 ? priorityOptions[index] : '',
    });
  };

  const updatePropertyType = (index: number) => {
    setSelectedTypeIndex(index);
    setLocalFilters({
      ...localFilters,
      property_type: index >= 0 ? propertyTypes[index] : '',
    });
  };

  const updateSourceType = (index: number) => {
    setSelectedSourceIndex(index);
    setLocalFilters({
      ...localFilters,
      source_type: index >= 0 ? sourceTypes[index] : '',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter Clients</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#86939e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Status</Text>
          <ButtonGroup
            onPress={updateStatus}
            selectedIndex={selectedStatusIndex}
            buttons={statusOptions.map(status => status.charAt(0).toUpperCase() + status.slice(1))}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            buttonStyle={styles.button}
            textStyle={styles.buttonText}
            selectedTextStyle={styles.selectedButtonText}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Priority</Text>
          <ButtonGroup
            onPress={updatePriority}
            selectedIndex={selectedPriorityIndex}
            buttons={priorityOptions.map(priority => priority.charAt(0).toUpperCase() + priority.slice(1))}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
          />
        </View>

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
          <Text style={styles.sectionTitle}>Source</Text>
          <ButtonGroup
            onPress={updateSourceType}
            selectedIndex={selectedSourceIndex}
            buttons={sourceTypes.map(source => source.charAt(0).toUpperCase() + source.slice(1))}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Budget Range</Text>
          <View style={styles.row}>
            <Input
              placeholder="Min Budget"
              value={localFilters.budget_min}
              onChangeText={(text) => setLocalFilters({ ...localFilters, budget_min: text })}
              keyboardType="numeric"
              leftIcon={<Text>€</Text>}
              containerStyle={styles.halfInput}
            />
            <Input
              placeholder="Max Budget"
              value={localFilters.budget_max}
              onChangeText={(text) => setLocalFilters({ ...localFilters, budget_max: text })}
              keyboardType="numeric"
              leftIcon={<Text>€</Text>}
              containerStyle={styles.halfInput}
            />
          </View>
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
    minHeight: 40,
  },
  button: {
    padding: 5,
  },
  buttonText: {
    fontSize: 12,
  },
  selectedButton: {
    backgroundColor: '#2089dc',
  },
  selectedButtonText: {
    fontSize: 12,
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