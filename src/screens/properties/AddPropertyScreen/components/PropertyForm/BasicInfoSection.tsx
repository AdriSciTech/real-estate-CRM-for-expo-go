//src\screens\properties\AddPropertyScreen\components\PropertyForm\BasicInfoSection.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Input, ButtonGroup } from 'react-native-elements';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { PropertyFormData } from '../../AddPropertyScreen.types';
import { propertyTypes } from '../../AddPropertyScreen.constants';
import { styles } from './styles';

interface BasicInfoSectionProps {
  control: Control<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
  selectedTypeIndex: number;
  setSelectedTypeIndex: (index: number) => void;
  setValue: (name: keyof PropertyFormData, value: any) => void;
}

export const BasicInfoSection: React.FC<BasicInfoSectionProps> = ({
  control,
  errors,
  selectedTypeIndex,
  setSelectedTypeIndex,
  setValue,
}) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Basic Information</Text>
      
      <Controller
        control={control}
        name="title"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Title *"
            placeholder="Beautiful apartment in city center"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            errorMessage={errors.title?.message}
          />
        )}
      />

      <Controller
        control={control}
        name="description"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Description"
            placeholder="Property description..."
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        )}
      />

      <Text style={styles.label}>Property Type</Text>
      <ButtonGroup
        onPress={(index) => {
          setSelectedTypeIndex(index);
          setValue('property_type', propertyTypes[index]);
        }}
        selectedIndex={selectedTypeIndex}
        buttons={propertyTypes.map(type => type.charAt(0).toUpperCase() + type.slice(1))}
        containerStyle={styles.buttonGroup}
        selectedButtonStyle={styles.selectedButton}
      />

      <Controller
        control={control}
        name="price"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Price (€)"
            placeholder="250000"
            onBlur={onBlur}
            onChangeText={(text) => onChange(text ? parseFloat(text) : null)}
            value={value?.toString() || ''}
            keyboardType="numeric"
            errorMessage={errors.price?.message}
          />
        )}
      />
    </>
  );
};