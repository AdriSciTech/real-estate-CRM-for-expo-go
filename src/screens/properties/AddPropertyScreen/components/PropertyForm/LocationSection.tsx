// src/screens/properties/AddPropertyScreen/components/PropertyForm/LocationSection.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { Input } from 'react-native-elements';
import { Controller, Control, FieldErrors } from 'react-hook-form';
import { PropertyFormData } from '../../AddPropertyScreen.types';
import { styles } from './styles';

interface LocationSectionProps {
  control: Control<PropertyFormData>;
  errors: FieldErrors<PropertyFormData>;
}

export const LocationSection: React.FC<LocationSectionProps> = ({
  control,
  errors,
}) => {
  return (
    <>
      <Text style={styles.sectionTitle}>Location</Text>

      <Controller
        control={control}
        name="address"
        render={({ field: { onChange, onBlur, value } }) => (
          <Input
            label="Address"
            placeholder="123 Main Street"
            onBlur={onBlur}
            onChangeText={onChange}
            value={value}
          />
        )}
      />

      <View style={styles.row}>
        <Controller
          control={control}
          name="city"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="City"
              placeholder="Madrid"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              containerStyle={styles.halfInput}
            />
          )}
        />

        <Controller
          control={control}
          name="postal_code"
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Postal Code"
              placeholder="28001"
              onBlur={onBlur}
              onChangeText={onChange}
              value={value}
              containerStyle={styles.halfInput}
            />
          )}
        />
      </View>
    </>
  );
};
