//src\screens\properties\PropertyDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Badge } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { PropertiesStackScreenProps } from '../../types/navigation.types';
import { usePropertiesStore } from '../../store/propertiesStore';
import { propertiesService } from '../../services/properties.service';
import { supabase } from '../../services/supabase';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as MediaLibrary from 'expo-media-library';

export default function PropertyDetailScreen({ 
  navigation,
  route 
}: PropertiesStackScreenProps<'PropertyDetail'>) {
  const { propertyId } = route.params;
  const { selectedProperty, getProperty, isLoading } = usePropertiesStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  useEffect(() => {
    getProperty(propertyId);
    loadDocuments();
  }, [propertyId]);

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const media = await propertiesService.getPropertyMedia(propertyId);
      setDocuments(media.filter(item => item.file_type === 'document'));
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const getSignedUrl = async (filePath: string) => {
    try {
      console.log('Processing file URL:', filePath);
      
      // Extract the file path from the URL
      const url = new URL(filePath);
      const pathname = url.pathname;
      
      let bucket = '';
      let path = '';
      
      if (pathname.includes('/public/')) {
        // This is a public URL - extract bucket and path
        const publicIndex = pathname.indexOf('/public/');
        const afterPublic = pathname.substring(publicIndex + 8);
        const firstSlash = afterPublic.indexOf('/');
        
        if (firstSlash === -1) {
          throw new Error('Invalid public URL format');
        }
        
        bucket = afterPublic.substring(0, firstSlash);
        path = afterPublic.substring(firstSlash + 1);
      } else if (pathname.includes('/storage/v1/object/')) {
        // This might be a private URL - extract bucket and path
        const objectIndex = pathname.indexOf('/storage/v1/object/');
        const afterObject = pathname.substring(objectIndex + 19);
        const firstSlash = afterObject.indexOf('/');
        
        if (firstSlash === -1) {
          throw new Error('Invalid URL format');
        }
        
        bucket = afterObject.substring(0, firstSlash);
        path = afterObject.substring(firstSlash + 1);
      } else {
        // If it's just a path, assume it's for the properties bucket
        bucket = 'properties';
        path = filePath.startsWith('/') ? filePath.substring(1) : filePath;
      }
      
      console.log('Extracted bucket:', bucket);
      console.log('Extracted path:', path);

      // Create a signed URL for secure access
      const { data, error } = await supabase.storage
        .from(bucket)
        .createSignedUrl(path, 3600); // 1 hour expiry

      if (error) {
        console.error('Supabase storage error:', error);
        
        // If signed URL fails and it's a public URL, return the original
        if (filePath.includes('/public/')) {
          console.log('Falling back to public URL');
          return filePath;
        }
        
        throw error;
      }
      
      console.log('Signed URL created successfully');
      return data.signedUrl;
    } catch (error) {
      console.error('Error creating signed URL:', error);
      // Return the original URL as fallback
      return filePath;
    }
  };

  const downloadDocument = async (fileUrl: string, fileName: string, docId: string) => {
    try {
      setDownloadingId(docId);
      
      // Get signed URL
      const downloadUrl = await getSignedUrl(fileUrl);
      
      // Create a local file path
      const fileUri = FileSystem.documentDirectory + fileName;
      
      // Download the file
      const downloadResult = await FileSystem.downloadAsync(
        downloadUrl,
        fileUri
      );
      
      if (downloadResult.status !== 200) {
        throw new Error('Download failed');
      }
      
      // Check if sharing is available
      const isAvailable = await Sharing.isAvailableAsync();
      
      if (isAvailable) {
        // Share the file (this will open the share sheet on iOS and Android)
        await Sharing.shareAsync(downloadResult.uri, {
          UTI: getUTIType(fileName), // for iOS
          mimeType: getMimeType(fileName), // for Android
          dialogTitle: `Share ${fileName}`,
        });
      } else {
        // If sharing is not available, try to save to media library
        const { status } = await MediaLibrary.requestPermissionsAsync();
        
        if (status === 'granted') {
          // For images, we can save to media library
          const ext = fileName.split('.').pop()?.toLowerCase();
          if (['jpg', 'jpeg', 'png', 'gif'].includes(ext || '')) {
            const asset = await MediaLibrary.createAssetAsync(downloadResult.uri);
            await MediaLibrary.createAlbumAsync('Properties', asset, false);
            Alert.alert(
              'Download Complete',
              `${fileName} has been saved to your photos.`,
              [{ text: 'OK' }]
            );
          } else {
            // For other files, just notify that download is complete
            Alert.alert(
              'Download Complete',
              `${fileName} has been downloaded. You can find it in your app's documents.`,
              [{ text: 'OK' }]
            );
          }
        } else {
          Alert.alert(
            'Permission Required',
            'Please grant permission to save files to your device.',
            [{ text: 'OK' }]
          );
        }
      }
      
    } catch (error) {
      console.error('Error downloading document:', error);
      Alert.alert('Download Failed', 'Unable to download the document. Please try again.');
    } finally {
      setDownloadingId(null);
    }
  };

  const getMimeType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'application/pdf';
      case 'doc':
        return 'application/msword';
      case 'docx':
        return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls':
        return 'application/vnd.ms-excel';
      case 'xlsx':
        return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      case 'txt':
        return 'text/plain';
      case 'jpg':
      case 'jpeg':
        return 'image/jpeg';
      case 'png':
        return 'image/png';
      default:
        return 'application/octet-stream';
    }
  };

  const getUTIType = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf':
        return 'com.adobe.pdf';
      case 'doc':
        return 'com.microsoft.word.doc';
      case 'docx':
        return 'org.openxmlformats.wordprocessingml.document';
      case 'xls':
        return 'com.microsoft.excel.xls';
      case 'xlsx':
        return 'org.openxmlformats.spreadsheetml.sheet';
      case 'txt':
        return 'public.plain-text';
      case 'jpg':
      case 'jpeg':
        return 'public.jpeg';
      case 'png':
        return 'public.png';
      default:
        return 'public.data';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available':
        return '#52c41a';
      case 'reserved':
        return '#faad14';
      case 'sold':
      case 'rented':
        return '#ff4d4f';
      default:
        return '#86939e';
    }
  };

  if (isLoading || !selectedProperty) {
    return (
      <SafeAreaView style={styles.container}>
        <Header
          leftComponent={
            <Icon 
              name="arrow-back" 
              size={24} 
              color="white" 
              onPress={() => navigation.goBack()} 
            />
          }
          centerComponent={{ text: 'Property Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
          rightComponent={
            <Icon 
              name="edit" 
              size={24} 
              color="white" 
              onPress={() => navigation.navigate('EditProperty', { propertyId })} 
            />
          }
          backgroundColor="#2089dc"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2089dc" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Header
        leftComponent={
          <Icon 
            name="arrow-back" 
            size={24} 
            color="white" 
            onPress={() => navigation.goBack()} 
          />
        }
        centerComponent={{ text: 'Property Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
        rightComponent={
          <Icon 
            name="edit" 
            size={24} 
            color="white" 
            onPress={() => navigation.navigate('EditProperty', { propertyId })} 
          />
        }
        backgroundColor="#2089dc"
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.title}>{selectedProperty.title}</Text>
          <Badge
            value={selectedProperty.status}
            badgeStyle={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(selectedProperty.status) },
            ]}
            textStyle={styles.badgeText}
          />
        </View>
        
        <Text style={styles.price}>€{selectedProperty.price?.toLocaleString() || 'Price on request'}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>{selectedProperty.property_type ? selectedProperty.property_type.charAt(0).toUpperCase() + selectedProperty.property_type.slice(1) : 'Not specified'}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Condition:</Text>
            <Text style={styles.infoValue}>{selectedProperty.condition ? selectedProperty.condition.replace('_', ' ').charAt(0).toUpperCase() + selectedProperty.condition.slice(1).replace('_', ' ') : 'Not specified'}</Text>
          </View>
          {selectedProperty.energy_rating && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Energy Rating:</Text>
              <Text style={styles.infoValue}>{selectedProperty.energy_rating}</Text>
            </View>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Details</Text>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Icon name="bed" size={20} color="#86939e" />
              <Text style={styles.detailText}>{selectedProperty.bedrooms || 0} Bedrooms</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="bathtub" size={20} color="#86939e" />
              <Text style={styles.detailText}>{selectedProperty.bathrooms || 0} Bathrooms</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="square-foot" size={20} color="#86939e" />
              <Text style={styles.detailText}>{selectedProperty.square_meters || 0} m²</Text>
            </View>
            <View style={styles.detailItem}>
              <Icon name="apartment" size={20} color="#86939e" />
              <Text style={styles.detailText}>Floor {selectedProperty.floor_number || '-'}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location</Text>
          <Text style={styles.address}>{selectedProperty.address || 'No address specified'}</Text>
          <Text style={styles.city}>
            {selectedProperty.city && selectedProperty.postal_code 
              ? `${selectedProperty.city}, ${selectedProperty.postal_code}`
              : selectedProperty.city || selectedProperty.postal_code || 'No location specified'
            }
          </Text>
        </View>

        {selectedProperty.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{selectedProperty.description}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Features</Text>
          <View style={styles.featuresGrid}>
            {selectedProperty.has_parking && (
              <View style={styles.featureItem}>
                <Icon name="local-parking" size={20} color="#52c41a" />
                <Text style={styles.featureText}>Parking</Text>
              </View>
            )}
            {selectedProperty.has_elevator && (
              <View style={styles.featureItem}>
                <Icon name="elevator" size={20} color="#52c41a" />
                <Text style={styles.featureText}>Elevator</Text>
              </View>
            )}
            {selectedProperty.has_terrace && (
              <View style={styles.featureItem}>
                <Icon name="deck" size={20} color="#52c41a" />
                <Text style={styles.featureText}>Terrace</Text>
              </View>
            )}
            {selectedProperty.has_garden && (
              <View style={styles.featureItem}>
                <Icon name="park" size={20} color="#52c41a" />
                <Text style={styles.featureText}>Garden</Text>
              </View>
            )}
          </View>
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          {loadingDocs ? (
            <ActivityIndicator size="small" color="#2089dc" style={styles.docsLoader} />
          ) : documents.length === 0 ? (
            <View style={styles.emptyDocs}>
              <Icon name="folder-open" size={40} color="#ccc" />
              <Text style={styles.emptyDocsText}>No documents uploaded</Text>
            </View>
          ) : (
            <View style={styles.documentsList}>
              {documents.map((doc) => (
                <TouchableOpacity
                  key={doc.id}
                  style={styles.documentItem}
                  onPress={() => downloadDocument(doc.file_url, doc.file_name, doc.id)}
                  activeOpacity={0.7}
                  disabled={downloadingId === doc.id}
                >
                  <View style={styles.documentIcon}>
                    <Icon
                      name={getDocumentIcon(doc.file_name)}
                      size={30}
                      color="#2089dc"
                    />
                  </View>
                  <View style={styles.documentInfo}>
                    <Text style={styles.documentName} numberOfLines={1}>
                      {doc.file_name}
                    </Text>
                    <Text style={styles.documentDate}>
                      {new Date(doc.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  {downloadingId === doc.id ? (
                    <ActivityIndicator size="small" color="#2089dc" />
                  ) : (
                    <Icon name="file-download" size={24} color="#2089dc" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {selectedProperty.collaborators && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Source</Text>
            <Text style={styles.collaboratorName}>{selectedProperty.collaborators.name}</Text>
            {selectedProperty.collaborators.company_name && (
              <Text style={styles.collaboratorCompany}>{selectedProperty.collaborators.company_name}</Text>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  headerSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    flex: 1,
    marginRight: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    fontSize: 12,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  price: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2089dc',
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  section: {
    backgroundColor: 'white',
    marginVertical: 10,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#43484d',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  infoLabel: {
    fontSize: 14,
    color: '#86939e',
  },
  infoValue: {
    fontSize: 14,
    color: '#43484d',
    fontWeight: '500',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 15,
  },
  detailText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#86939e',
  },
  address: {
    fontSize: 16,
    color: '#43484d',
    marginBottom: 5,
  },
  city: {
    fontSize: 14,
    color: '#86939e',
  },
  description: {
    fontSize: 14,
    color: '#43484d',
    lineHeight: 22,
  },
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 10,
  },
  featureText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#43484d',
  },
  documentsList: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  documentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f9fa',
    marginBottom: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e1e8ee',
  },
  documentIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e3f2fd',
    borderRadius: 20,
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
  documentDate: {
    fontSize: 12,
    color: '#86939e',
  },
  emptyDocs: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyDocsText: {
    marginTop: 10,
    color: '#86939e',
    fontSize: 14,
  },
  docsLoader: {
    marginVertical: 20,
  },
  collaboratorName: {
    fontSize: 16,
    color: '#43484d',
    fontWeight: '500',
  },
  collaboratorCompany: {
    fontSize: 14,
    color: '#86939e',
    marginTop: 4,
  },
});