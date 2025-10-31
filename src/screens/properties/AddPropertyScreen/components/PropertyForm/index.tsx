// src/screens/properties/AddPropertyScreen/components/PropertyForm/index.tsx

import React from 'react';
import { View } from 'react-native';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Control, FieldErrors } from 'react-hook-form';
import { PropertyFormData, Collaborator } from '../../AddPropertyScreen.types';
import { BasicInfoSection } from './BasicInfoSection';
import { PropertySourceSection } from './PropertySourceSection';
import { LocationSection } from './LocationSection';
import { PropertyDetailsSection } from './PropertyDetailsSection';
import { FeaturesSection } from './FeaturesSection';
import { styles } from './styles';

interface PropertyFormProps {
  control: Control<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
  selectedTypeIndex: number;
  setSelectedTypeIndex: (index: number) => void;
  selectedEnergyIndex: number;
  setSelectedEnergyIndex: (index: number) => void;
  selectedConditionIndex: number;
  setSelectedConditionIndex: (index: number) => void;
  filteredCollaborators: Collaborator[];
  sourceType: string | null;
  setValue: (name: keyof PropertyFormData, value: any) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export const PropertyForm: React.FC<PropertyFormProps> = ({
  control,
  errors,
  selectedTypeIndex,
  setSelectedTypeIndex,
  selectedEnergyIndex,
  setSelectedEnergyIndex,
  selectedConditionIndex,
  setSelectedConditionIndex,
  filteredCollaborators,
  sourceType,
  setValue,
  onSubmit,
  isLoading,
}) => {
  return (
    <>
      <BasicInfoSection
        control={control}
        errors={errors}
        selectedTypeIndex={selectedTypeIndex}
        setSelectedTypeIndex={setSelectedTypeIndex}
        setValue={setValue}
      />

      <PropertySourceSection
        control={control}
        sourceType={sourceType}
        filteredCollaborators={filteredCollaborators}
      />

      <LocationSection
        control={control}
        errors={errors}
      />

      <PropertyDetailsSection
        control={control}
        errors={errors}
        selectedConditionIndex={selectedConditionIndex}
        setSelectedConditionIndex={setSelectedConditionIndex}
        selectedEnergyIndex={selectedEnergyIndex}
        setSelectedEnergyIndex={setSelectedEnergyIndex}
      />

      <FeaturesSection
        control={control}
      />

      <Button
        title="Next: Add Images"
        onPress={onSubmit}
        loading={isLoading}
        disabled={isLoading}
        buttonStyle={styles.submitButton}
        titleStyle={styles.submitButtonText}
        icon={
          <Icon 
            name="arrow-forward" 
            size={20} 
            color="white" 
            style={{ marginLeft: 10 }} 
          />
        }
        iconRight
      />
    </>
  );
};

