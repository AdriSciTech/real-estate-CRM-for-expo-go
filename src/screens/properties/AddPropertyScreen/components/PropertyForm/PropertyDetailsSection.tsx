// src/screens/properties/AddPropertyScreen/components/PropertyForm/PropertyDetailsSection.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Input, ButtonGroup } from 'react-native-elements';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { PropertyFormData } from '../../AddPropertyScreen.types';
import { energyRatings } from '../../AddPropertyScreen.constants';
import { styles } from './styles';

interface PropertyDetailsSectionProps {
  control: Control<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
  selectedConditionIndex: number;
  setSelectedConditionIndex: (index: number) => void;
  selectedEnergyIndex: number;
  setSelectedEnergyIndex: (index: number) => void;
}

export const PropertyDetailsSection: React.FC<PropertyDetailsSectionProps> = ({
  control,
  errors,
  selectedConditionIndex,
  setSelectedConditionIndex,
  selectedEnergyIndex,
  setSelectedEnergyIndex,
}) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Property Details</Text>

      <View style={styles.row}>
        <Controller
          control={control}
          name="bedrooms"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Bedrooms"
              placeholder="3"
              onBlur={onBlur}
              onChangeText={(text) => onChange(text ? parseInt(text) : null)}
              value={value?.toString() || ''}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
            />
          )}
        />

        <Controller
          control={control}
          name="bathrooms"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Bathrooms"
              placeholder="2"
              onBlur={onBlur}
              onChangeText={(text) => onChange(text ? parseInt(text) : null)}
              value={value?.toString() || ''}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
            />
          )}
        />
      </View>

      <Controller
        control={control}
        name="square_meters"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Square Meters"
            placeholder="120"
            onBlur={onBlur}
            onChangeText={(text) => onChange(text ? parseInt(text) : null)}
            value={value?.toString() || ''}
            keyboardType="numeric"
          />
        )}
      />

      <View style={styles.row}>
        <Controller
          control={control}
          name="floor_number"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Floor Number"
              placeholder="3"
              onBlur={onBlur}
              onChangeText={(text) => onChange(text ? parseInt(text) : null)}
              value={value?.toString() || ''}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
            />
          )}
        />

        <Controller
          control={control}
          name="total_floors"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Total Floors"
              placeholder="5"
              onBlur={onBlur}
              onChangeText={(text) => onChange(text ? parseInt(text) : null)}
              value={value?.toString() || ''}
              keyboardType="numeric"
              containerStyle={styles.halfInput}
            />
          )}
        />
      </View>

      <Text style={styles.label}>Condition</Text>
      <ButtonGroup
        onPress={setSelectedConditionIndex}
        selectedIndex={selectedConditionIndex}
        buttons={['New', 'Good', 'Needs Renovation']}
        containerStyle={styles.buttonGroup}
        selectedButtonStyle={styles.selectedButton}
      />

      <Text style={styles.label}>Energy Rating</Text>
      <ButtonGroup
        onPress={setSelectedEnergyIndex}
        selectedIndex={selectedEnergyIndex}
        buttons={[...energyRatings]}
        containerStyle={styles.buttonGroup}
        selectedButtonStyle={styles.selectedButton}
      />
    </>
  );
};