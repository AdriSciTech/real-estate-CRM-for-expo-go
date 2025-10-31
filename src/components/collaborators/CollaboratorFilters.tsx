// src/components/collaborators/CollaboratorFilters.tsx
// ===========================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Button, ButtonGroup } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useCollaboratorsStore } from '../../store/collaboratorsStore';

interface CollaboratorFiltersProps {
  onClose: () => void;
}

const collaboratorTypes = ['landlord', 'developer', 'agency', 'other'];

export default function CollaboratorFilters({ onClose }: CollaboratorFiltersProps) {
  const { filters, applyFilters, clearFilters } = useCollaboratorsStore();
  
  const [localFilters, setLocalFilters] = useState({
    type: filters.type || '',
  });

  const [selectedTypeIndex, setSelectedTypeIndex] = useState(
    collaboratorTypes.findIndex(type => type === filters.type)
  );

  const handleApplyFilters = () => {
    const appliedFilters: any = {};
    
    if (localFilters.type) appliedFilters.type = localFilters.type;
    
    applyFilters(appliedFilters);
    onClose();
  };

  const handleClearFilters = () => {
    setLocalFilters({
      type: '',
    });
    setSelectedTypeIndex(-1);
    clearFilters();
    onClose();
  };

  const updateType = (index: number) => {
    setSelectedTypeIndex(index);
    setLocalFilters({
      ...localFilters,
      type: index >= 0 ? collaboratorTypes[index] : '',
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Filter Collaborators</Text>
        <TouchableOpacity onPress={onClose}>
          <Icon name="close" size={24} color="#86939e" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Collaborator Type</Text>
          <ButtonGroup
            onPress={updateType}
            selectedIndex={selectedTypeIndex}
            buttons={['Landlord', 'Developer', 'Agency', 'Other']}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
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
    maxHeight: 300,
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
