//src\screens\properties\AddPropertyScreen\components\ProgressIndicator\index.tsx

import React from 'react';
import { View, Text } from 'react-native';
import { styles } from './styles';

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
  stepText: string;
}

export const ProgressIndicator: React.FC<ProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepText,
}) => {
  const progressPercentage = (currentStep / totalSteps) * 100;

  return (
    <View style={styles.container}>
      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${progressPercentage}%` }]} />
      </View>
      <Text style={styles.progressText}>{stepText}</Text>
    </View>
  );
};