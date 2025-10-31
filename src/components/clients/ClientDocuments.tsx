// src/components/clients/ClientDocuments.tsx

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
import { Button, ButtonGroup } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import * as DocumentPicker from 'expo-document-picker';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';
import { supabase } from '../../services/supabase';
import { clientsService } from '../../services/clients.service';

interface Document {
  id: string;
  file_name: string;
  file_url: string;
  file_type: string | null;
  document_type: string | null;
  description: string | null;
  upload_date: string;
}

interface ClientDocumentsProps {
  clientId: string;
  documents?: Document[];
  onDocumentsChange?: () => void;
  editable?: boolean;
}

const documentTypes = [
  { value: 'id', label: 'ID' },
  { value: 'proof_of_income', label: 'Income Proof' },
  { value: 'bank_statement', label: 'Bank Statement' },
  { value: 'employment_letter', label: 'Employment' },
  { value: 'reference', label: 'Reference' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
];

// Maximum file size in bytes (10MB)
const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function ClientDocuments({
  clientId,
  documents = [],
  onDocumentsChange,
  editable = true,
}: ClientDocumentsProps) {
  const [uploading, setUploading] = useState(false);
  const [localDocuments, setLocalDocuments] = useState<Document[]>(documents);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [selectedDocType, setSelectedDocType] = useState(6); // Default to 'other'

  // Update local documents when prop changes
  useEffect(() => {
    setLocalDocuments(documents);
  }, [documents]);

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        
        // Validate file size
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
      // Generate unique filename
      const timestamp = Date.now();
      const fileExt = document.name.split('.').pop()?.toLowerCase() || 'bin';
      const safeFileName = document.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${clientId}/${timestamp}_${safeFileName}`;
      const filePath = `client-documents/${fileName}`;

      // Read the file
      const response = await fetch(document.uri);
      const blob = await response.blob();

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('clients')
        .upload(filePath, blob, {
          contentType: document.mimeType || 'application/octet-stream',
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(error.message);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('clients')
        .getPublicUrl(filePath);

      // Save document info to client_documents table
      const docData = await clientsService.addClientDocument(clientId, {
        file_name: document.name,
        file_url: publicUrl,
        file_type: document.mimeType || undefined,
        document_type: documentTypes[selectedDocType].value as any,
        description: `${documentTypes[selectedDocType].label} document`,
      });

      // Update local state optimistically
      const newDocument: Document = {
        id: timestamp.toString(),
        file_name: document.name,
        file_url: publicUrl,
        file_type: document.mimeType || null,
        document_type: documentTypes[selectedDocType].value,
        description: `${documentTypes[selectedDocType].label} document`,
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
              await clientsService.deleteClientDocument(documentId);
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

  const getSignedUrl = async (filePath: string) => {
    try {
      const url = new URL(filePath);
      const pathname = url.pathname;
      
      let bucket = '';
      let path = '';
      
      if (pathname.includes('/public/')) {
        const publicIndex = pathname.indexOf('/public/');
        const afterPublic = pathname.substring(publicIndex + 8);
        const firstSlash = afterPublic.indexOf('/');
        
        if (firstSlash === -1) {
          throw new Error('Invalid public URL format');
        }
        
        bucket = afterPublic.substring(0, firstSlash);
        path = afterPublic.substring(firstSlash + 1);
      } else {
        bucket = 'clients';
        path = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      }

      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600);

      if (error) {
        if (filePath.includes('/public/')) {
          return filePath;
        }
        throw error;
      }
      
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      return filePath;
    }
  };

  const downloadDocument = async (fileUrl: string, fileName: string, docId: string) => {
    try {
      setDownloadingId(docId);
      
      const downloadUrl = await getSignedUrl(fileUrl);
      const fileUri = FileSystem.documentDirectory + fileName;
      
      const downloadResult = await FileSystem.downloadAsync(downloadUrl, fileUri);
      
      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }
      
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        await Sharing.shareAsync(downloadResult.uri, {
          UTI: getUTIType(fileName),
          mimeType: getMimeType(fileName),
          dialogTitle: `Share ${fileName}`,
        });
      } else {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status === 'granted') {
          const ext = fileName.split('.').pop()?.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            await MediaLibrary.createAlbumAsync('ClientDocuments', asset, false);
            Alert.alert('Download Complete', `${fileName} has been saved to your photos.`);
          } else {
            Alert.alert('Download Complete', `${fileName} has been downloaded.`);
          }
        } else {
          Alert.alert('Permission Required', 'Please grant permission to save files.');
        }
      }
    } catch (error) {
      console.error('Error downloading document:', error);
      Alert.alert('Download Failed', 'Unable to download the document.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getMimeType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
    };
    return mimeTypes[ext || ''] || 'application/octet-stream';
  };

  const getUTIType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const utiTypes: { [key: string]: string } = {
      pdf: 'com.adobe.pdf',
      doc: 'com.microsoft.word.doc',
      docx: 'org.openxmlformats.wordprocessingml.document',
      xls: 'com.microsoft.excel.xls',
      xlsx: 'org.openxmlformats.spreadsheetml.sheet',
      txt: 'public.plain-text',
      jpg: 'public.jpeg',
      jpeg: 'public.jpeg',
      png: 'public.png',
    };
    return utiTypes[ext || ''] || 'public.data';
  };

  const getDocumentIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    const icons: { [key: string]: string } = {
      pdf: 'picture-as-pdf',
      doc: 'description',
      docx: 'description',
      xls: 'table-chart',
      xlsx: 'table-chart',
      txt: 'text-snippet',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
    };
    return icons[ext || ''] || 'insert-drive-file';
  };

  const getDocumentTypeColor = (type: string | null) => {
    const colors: { [key: string]: string } = {
      id: '#722ed1',
      proof_of_income: '#52c41a',
      bank_statement: '#1890ff',
      employment_letter: '#faad14',
      reference: '#13c2c2',
      contract: '#fa541c',
      other: '#86939e',
    };
    return colors[type || 'other'] || '#86939e';
  };

  const renderDocument = ({ item }: { item: Document }) => {
    const isDeleting = deletingId === item.id;
    const isDownloading = downloadingId === item.id;
    
    return (
      <TouchableOpacity
        style={[styles.documentItem, isDeleting && styles.documentItemDeleting]}
        onPress={() => downloadDocument(item.file_url, item.file_name, item.id)}
        disabled={isDeleting || isDownloading}
      >
        <View style={styles.documentLeft}>
          <View style={[styles.documentIcon, { backgroundColor: getDocumentTypeColor(item.document_type) + '20' }]}>
            <Icon 
              name={getDocumentIcon(item.file_name)} 
              size={24} 
              color={getDocumentTypeColor(item.document_type)}
            />
          </View>
          <View style={styles.documentInfo}>
            <Text style={styles.documentName} numberOfLines={1}>
              {item.file_name}
            </Text>
            <Text style={styles.documentType}>
              {documentTypes.find(t => t.value === item.document_type)?.label || 'Other'}
            </Text>
            <Text style={styles.documentDate}>
              {new Date(item.upload_date).toLocaleDateString()}
            </Text>
          </View>
        </View>
        
        <View style={styles.documentActions}>
          {isDownloading ? (
            <ActivityIndicator size="small" color="#2089dc" />
          ) : (
            <Icon name="file-download" size={24} color="#2089dc" />
          )}
          {editable && (
            <TouchableOpacity
              onPress={(e) => {
                e.stopPropagation();
                deleteDocument(item.id, item.file_name);
              }}
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
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Documents</Text>
        {editable && (
          <Text style={styles.documentCount}>
            {localDocuments.length} document{localDocuments.length !== 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {editable && (
        <View style={styles.uploadSection}>
          <Text style={styles.label}>Document Type</Text>
          <ButtonGroup
            onPress={setSelectedDocType}
            selectedIndex={selectedDocType}
            buttons={documentTypes.map(t => t.label)}
            containerStyle={styles.buttonGroup}
            selectedButtonStyle={styles.selectedButton}
            buttonStyle={styles.button}
            textStyle={styles.buttonText}
          />
          
          <Button
            title="Upload Document"
            onPress={pickDocument}
            loading={uploading}
            disabled={uploading}
            icon={<Icon name="upload-file" size={20} color="white" style={{ marginRight: 5 }} />}
            buttonStyle={styles.uploadButton}
            titleStyle={styles.uploadButtonText}
          />
        </View>
      )}

      {localDocuments.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Icon name="folder-open" size={60} color="#ccc" />
          <Text style={styles.emptyText}>No documents uploaded</Text>
          {editable && (
            <Text style={styles.emptySubtext}>
              Select a type and tap "Upload Document"
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43484d',
  },
  documentCount: {
    fontSize: 14,
    color: '#86939e',
  },
  uploadSection: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#86939e',
    marginBottom: 8,
  },
  buttonGroup: {
    borderRadius: 8,
    marginBottom: 15,
    height: 35,
  },
  button: {
    padding: 2,
  },
  buttonText: {
    fontSize: 11,
  },
  selectedButton: {
    backgroundColor: '#2089dc',
  },
  uploadButton: {
    borderRadius: 20,
    paddingVertical: 10,
  },
  uploadButtonText: {
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
    justifyContent: 'space-between',
    padding: 15,
    backgroundColor: 'white',
  },
  documentItemDeleting: {
    opacity: 0.5,
  },
  documentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  documentIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  documentInfo: {
    flex: 1,
  },
  documentName: {
    fontSize: 14,
    color: '#43484d',
    fontWeight: '500',
    marginBottom: 2,
  },
  documentType: {
    fontSize: 12,
    color: '#2089dc',
    marginBottom: 2,
  },
  documentDate: {
    fontSize: 11,
    color: '#86939e',
  },
  documentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
  deleteButton: {
    padding: 5,
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
    textAlign: 'center',
  },
});