// src/components/collaborators/CollaboratorDocuments.tsx
// ===========================

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import { supabase } from '../../services/supabase';
import { collaboratorsService } from '../../services/collaborators.service';

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type?: string;
  file_size?: number;
  upload_date: string;
}

interface CollaboratorDocumentsProps {
  collaboratorId: string;
  documents?: Document[];
  onDocumentsChange?: () => void;
  editable?: boolean;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export default function CollaboratorDocuments({
  collaboratorId,
  documents = [],
  onDocumentsChange,
  editable = true,
}: CollaboratorDocumentsProps) {
  const [uploading, setUploading] = useState(false);
  const [localDocuments, setLocalDocuments] = useState<Document[]>(documents);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          'application/pdf',
          'application/msword',
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'application/vnd.ms-excel',
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'text/plain',
          'image/jpeg',
          'image/png',
        ],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        if (asset.size && asset.size > MAX_FILE_SIZE) {
          Alert.alert('File Too Large', 'Please select a file smaller than 10MB');
          return;
        }

        await uploadDocument(asset);
      }
    } catch (error) {
      console.error('Error picking document:', error);
      Alert.alert('Error', 'Failed to pick document');
    }
  };

  const uploadDocument = async (document: DocumentPicker.DocumentPickerAsset) => {
    setUploading(true);
    try {
      const timestamp = Date.now();
      const fileExt = document.name.split('.').pop()?.toLowerCase() || 'bin';
      const safeFileName = document.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${collaboratorId}/${timestamp}_${safeFileName}`;
      const filePath = `collaborator-documents/${fileName}`;

      const response = await fetch(document.uri);
      const blob = await response.blob();

      const { data, error } = await supabase.storage
        .from('collaborators')
        .upload(filePath, blob, {
          contentType: document.mimeType || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      const { data: { publicUrl } } = supabase.storage
        .from('collaborators')
        .getPublicUrl(filePath);

      await collaboratorsService.addCollaboratorDocument(collaboratorId, {
        file_name: document.name,
        file_url: publicUrl,
        file_type: document.mimeType || undefined,
        file_size: document.size || undefined,
      });

      const newDocument: Document = {
        id: timestamp.toString(),
        file_name: document.name,
        file_url: publicUrl,
        file_type: document.mimeType,
        file_size: document.size,
        upload_date: new Date().toISOString(),
      };

      setLocalDocuments(prev => [...prev, newDocument]);
      onDocumentsChange?.();
      
      Alert.alert('Success', 'Document uploaded successfully');
    } catch (error) {
      console.error('Upload error:', error);
      Alert.alert(
        'Upload Failed', 
        error instanceof Error ? error.message : 'Failed to upload document. Please try again.'
      );
    } finally {
      setUploading(false);
    }
  };

  const deleteDocument = async (documentId: string, fileName: string) => {
    Alert.alert(
      'Delete Document',
      `Are you sure you want to delete ${fileName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setDeletingId(documentId);
            try {
              await collaboratorsService.deleteCollaboratorDocument(documentId);
              setLocalDocuments(prev => prev.filter(doc => doc.id !== documentId));
              onDocumentsChange?.();
              Alert.alert('Success', 'Document deleted successfully');
            } catch (error) {
              console.error('Delete error:', error);
              Alert.alert('Error', 'Failed to delete document');
            } finally {
              setDeletingId(null);
            }
          },
        },
      ]
    );
  };

  const openDocument = async (fileUrl: string, fileName: string) => {
    try {
      const supported = await Linking.canOpenURL(fileUrl);
      if (supported) {
        await Linking.openURL(fileUrl);
      } else {
        Alert.alert('Cannot Open', `Unable to open ${fileName}. The file URL may be invalid.`);
      }
    } catch (error) {
      console.error('Error opening document:', error);
      Alert.alert('Error', `Failed to open ${fileName}`);
    }
  };

  const getDocumentIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'picture-as-pdf';
      case 'doc':
      case 'docx':
        return 'description';
      case 'xls':
      case 'xlsx':
        return 'table-chart';
      case 'txt':
        return 'text-snippet';
      case 'jpg':
      case 'jpeg':
      case 'png':
        return 'image';
      default:
        return 'insert-drive-file';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const renderDocument = ({ item }: { item: Document }) => {
    const isDeleting = deletingId === item.id;
    
    return (
      <View style={[styles.documentItem, isDeleting && styles.documentItemDeleting]}>
        <Icon 
          name={getDocumentIcon(item.file_name)} 
          size={40} 
          color="#2089dc" 
        />
        <View style={styles.documentInfo}>
          <Text style={styles.documentName} numberOfLines={1}>
            {item.file_name}
          </Text>
          <Text style={styles.documentDate}>
            {formatDate(item.upload_date)}
          </Text>
          <TouchableOpacity
            onPress={() => openDocument(item.file_url, item.file_name)}
            disabled={isDeleting}
          >
            <Text style={styles.viewButton}>View Document</Text>
          </TouchableOpacity>
        </View>
        {editable && (
          <TouchableOpacity
            onPress={() => deleteDocument(item.id, item.file_name)}
            style={styles.deleteButton}
            disabled={isDeleting || uploading}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ff4d4f" />
            ) : (
              <Icon name="delete" size={24} color="#ff4d4f" />
            )}
          </TouchableOpacity>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {editable && (
        <Button
          title="Add Document"
          onPress={pickDocument}
          loading={uploading}
          disabled={uploading}
          icon={<Icon name="add" size={20} color="white" style={{ marginRight: 5 }} />}
          buttonStyle={styles.addButton}
          titleStyle={styles.addButtonText}
        />
      )}

      {localDocuments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-open" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No documents uploaded</Text>
          {editable && (
            <Text style={styles.emptySubtext}>
              Tap "Add Document" to upload files
            </Text>
          )}
        </View>
      ) : (
        <FlatList
          data={localDocuments}
          keyExtractor={(item) => item.id}
          renderItem={renderDocument}
          style={styles.documentsList}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}

      {uploading && (
        <View style={styles.uploadingOverlay}>
          <ActivityIndicator size="large" color="#2089dc" />
          <Text style={styles.uploadingText}>Uploading document...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  addButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    marginBottom: 15,
  },
  addButtonText: {
    fontSize: 14,
  },
  documentsList: {
    backgroundColor: 'white',
    borderRadius: 10,
    overflow: 'hidden',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
  },
  documentItemDeleting: {
    opacity: 0.5,
  },
  documentInfo: {
    flex: 1,
    marginLeft: 15,
  },
  documentName: {
    fontSize: 16,
    color: '#43484d',
    marginBottom: 2,
    fontWeight: '500',
  },
  documentDate: {
    fontSize: 12,
    color: '#86939e',
    marginBottom: 5,
  },
  viewButton: {
    color: '#2089dc',
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    padding: 5,
    marginLeft: 10,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#e1e8ee',
    marginHorizontal: 15,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    backgroundColor: 'white',
    borderRadius: 10,
  },
  emptyText: {
    marginTop: 10,
    color: '#86939e',
    fontSize: 16,
  },
  emptySubtext: {
    marginTop: 5,
    color: '#bdc6cf',
    fontSize: 14,
  },
  uploadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 10,
  },
  uploadingText: {
    marginTop: 10,
    color: '#2089dc',
    fontSize: 16,
  },
});