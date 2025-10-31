import React from 'react';
import { View, Text, Switch } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { PropertyFormData } from '../../AddPropertyScreen.types';
import { styles } from './styles';

interface FeaturesSectionProps {
  control: Control<PropertyFormData>;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ control }) => {
  const features = [
    { name: 'has_parking' as const, label: 'Parking' },
    { name: 'has_elevator' as const, label: 'Elevator' },
    { name: 'has_terrace' as const, label: 'Terrace' },
    { name: 'has_garden' as const, label: 'Garden' },
  ];

  return (
    <>
      <Text style={styles.sectionTitle}>Features</Text>
      {features.map((feature) => (
        <Controller
          key={feature.name}
          control={control}
          name={feature.name}
          render={({ field: { onChange, value } }) => (
            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>{feature.label}</Text>
              <Switch
                value={value}
                onValueChange={onChange}
                trackColor={{ false: '#767577', true: '#81b0ff' }}
                thumbColor={value ? '#2089dc' : '#f4f3f4'}
              />
            </View>
          )}
        />
      ))}
    </>
  );
};