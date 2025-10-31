//src\screens\properties\AddPropertyScreen\components\MediaUploadStep\index.tsx

import React from 'react';
import { View, Text, Alert } from 'react-native';
import { Card, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import PropertyImages from '../../../../../components/properties/PropertyImages';
import PropertyDocuments from '../../../../../components/properties/PropertyDocuments';
import { PropertyMedia } from '../../AddPropertyScreen.types';
import { styles } from './styles';

interface MediaUploadStepProps {
  propertyId: string;
  propertyImages: PropertyMedia[];
  propertyDocuments: PropertyMedia[];
  onImagesChange: () => Promise<void>;
  onDocumentsChange: () => Promise<void>;
  onSkip: () => void;
  onFinish: () => void;
}

export const MediaUploadStep: React.FC<MediaUploadStepProps> = ({
  propertyId,
  propertyImages,
  propertyDocuments,
  onImagesChange,
  onDocumentsChange,
  onSkip,
  onFinish,
}) => {
  return (
    <>
      <Card containerStyle={styles.successCard}>
        <Card.Title>Property Created!</Card.Title>
        <Card.Divider />
        <View style={styles.successContent}>
          <Icon name="check-circle" size={48} color="#4CAF50" />
          <Text style={styles.successSubtitle}>
            Now add images to make your listing stand out
          </Text>
        </View>
      </Card>

      <Text style={styles.sectionTitle}>Property Images</Text>
      <Text style={styles.sectionSubtitle}>
        Properties with high-quality images get 3x more views
      </Text>
      
      <PropertyImages
        propertyId={propertyId}
        images={propertyImages}
        onImagesChange={onImagesChange}
        editable={true}
        maxImages={20}
      />

      <Text style={[styles.sectionTitle, { marginTop: 30 }]}>
        Property Documents
      </Text>
      <Text style={styles.sectionSubtitle}>
        Upload floor plans, energy certificates, or other relevant documents
      </Text>
      
      <PropertyDocuments
        propertyId={propertyId}
        documents={propertyDocuments}
        onDocumentsChange={onDocumentsChange}
        editable={true}
      />

      <View style={styles.buttonContainer}>
        <Button
          title="Skip"
          type="outline"
          onPress={onSkip}
          buttonStyle={styles.secondaryButton}
          titleStyle={styles.secondaryButtonText}
        />
        <Button
          title="Finish"
          onPress={onFinish}
          buttonStyle={styles.submitButton}
          titleStyle={styles.submitButtonText}
        />
      </View>
    </>
  );
};