import React from 'react';
import { View, Text, Platform } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { Picker } from '@react-native-picker/picker';
import { PropertyFormData, Collaborator } from '../../AddPropertyScreen.types';
import { styles } from './styles';

interface PropertySourceSectionProps {
  control: Control<PropertyFormData>;
  sourceType: string | null;
  filteredCollaborators: Collaborator[];
}

export const PropertySourceSection: React.FC<PropertySourceSectionProps> = ({
  control,
  sourceType,
  filteredCollaborators,
}) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Property Source</Text>

      <Controller
        control={control}
        name="source_type"
        render={({ field: { onChange, value } }) => (
          <View style={styles.pickerContainer}>
            <Text style={styles.pickerLabel}>Source Type</Text>
            <View style={styles.picker}>
              <Picker
                selectedValue={value}
                onValueChange={onChange}
                style={Platform.OS === 'ios' ? { height: 180 } : {}}
              >
                <Picker.Item label="Select Source Type" value={null} />
                <Picker.Item label="Landlord" value="landlord" />
                <Picker.Item label="Developer" value="developer" />
                <Picker.Item label="Partner/Agency" value="partner" />
              </Picker>
            </View>
          </View>
        )}
      />

      {sourceType && (
        <Controller
          control={control}
          name="source_collaborator_id"
          render={({ field: { onChange, value } }) => (
            <View style={styles.pickerContainer}>
              <Text style={styles.pickerLabel}>
                {sourceType === 'landlord' ? 'Landlord' : 
                 sourceType === 'developer' ? 'Developer' : 
                 'Partner/Agency'}
              </Text>
              <View style={styles.picker}>
                <Picker
                  selectedValue={value}
                  onValueChange={onChange}
                  style={Platform.OS === 'ios' ? { height: 180 } : {}}
                >
                  <Picker.Item 
                    label={`Select ${sourceType === 'partner' ? 'Partner/Agency' : sourceType}`} 
                    value={null} 
                  />
                  {filteredCollaborators.map((collaborator) => (
                    <Picker.Item
                      key={collaborator.id}
                      label={collaborator.company_name || collaborator.name}
                      value={collaborator.id}
                    />
                  ))}
                </Picker>
              </View>
              {filteredCollaborators.length === 0 && (
                <Text style={styles.helperText}>
                  No {sourceType === 'partner' ? 'partners/agencies' : sourceType + 's'} found. 
                  Please add one in the Collaborators section.
                </Text>
              )}
            </View>
          )}
        />
      )}
    </>
  );
};