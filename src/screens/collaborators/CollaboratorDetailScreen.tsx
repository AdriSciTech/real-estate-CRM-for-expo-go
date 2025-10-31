// src/screens/collaborators/CollaboratorDetailScreen.tsx
// ===========================

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Badge } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { CollaboratorsStackScreenProps } from '../../types/navigation.types';
import { useCollaboratorsStore } from '../../store/collaboratorsStore';
import { collaboratorsService } from '../../services/collaborators.service';
import CollaboratorDocuments from '../../components/collaborators/CollaboratorDocuments';

export default function CollaboratorDetailScreen({ 
  navigation,
  route 
}: CollaboratorsStackScreenProps<'CollaboratorDetail'>) {
  const { collaboratorId } = route.params;
  const { selectedCollaborator, getCollaborator, isLoading } = useCollaboratorsStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    getCollaborator(collaboratorId);
    loadDocuments();
  }, [collaboratorId]);

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const docs = await collaboratorsService.getCollaboratorDocuments(collaboratorId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const handleEmail = (email: string) => {
    Linking.openURL(`mailto:${email}`);
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'landlord':
        return '#52c41a';
      case 'developer':
        return '#1890ff';
      case 'agency':
        return '#fa8c16';
      default:
        return '#86939e';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'landlord':
        return 'home';
      case 'developer':
        return 'domain';
      case 'agency':
        return 'business';
      default:
        return 'person';
    }
  };

  if (isLoading || !selectedCollaborator) {
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
          centerComponent={{ text: 'Collaborator Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
          rightComponent={
            <Icon 
              name="edit" 
              size={24} 
              color="white" 
              onPress={() => navigation.navigate('EditCollaborator', { collaboratorId })} 
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

  const propertyCount = selectedCollaborator.properties?.length || 0;
  const clientCount = selectedCollaborator.clients?.length || 0;

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
        centerComponent={{ text: 'Collaborator Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
        rightComponent={
          <Icon 
            name="edit" 
            size={24} 
            color="white" 
            onPress={() => navigation.navigate('EditCollaborator', { collaboratorId })} 
          />
        }
        backgroundColor="#2089dc"
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.headerSection}>
          <View style={[styles.iconWrapper, { backgroundColor: getTypeColor(selectedCollaborator.type || 'other') }]}>
            <Icon
              name={getTypeIcon(selectedCollaborator.type || 'other')}
              size={40}
              color="white"
            />
          </View>
          <Text style={styles.name}>{selectedCollaborator.name}</Text>
          {selectedCollaborator.company_name && (
            <Text style={styles.company}>{selectedCollaborator.company_name}</Text>
          )}
          <Badge
            value={selectedCollaborator.type || 'other'}
            badgeStyle={[
              styles.typeBadge,
              { backgroundColor: getTypeColor(selectedCollaborator.type || 'other') },
            ]}
            textStyle={styles.badgeText}
          />
        </View>

        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{propertyCount}</Text>
            <Text style={styles.statLabel}>Properties</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statNumber}>{clientCount}</Text>
            <Text style={styles.statLabel}>Clients</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          
          <TouchableOpacity 
            style={styles.contactRow}
            onPress={() => handleEmail(selectedCollaborator.email)}
          >
            <Icon name="email" size={20} color="#2089dc" />
            <Text style={styles.contactText}>{selectedCollaborator.email}</Text>
            <Icon name="chevron-right" size={20} color="#86939e" />
          </TouchableOpacity>

          {selectedCollaborator.phone && (
            <TouchableOpacity 
              style={styles.contactRow}
              onPress={() => handleCall(selectedCollaborator.phone!)}
            >
              <Icon name="phone" size={20} color="#2089dc" />
              <Text style={styles.contactText}>{selectedCollaborator.phone}</Text>
              <Icon name="chevron-right" size={20} color="#86939e" />
            </TouchableOpacity>
          )}

          {selectedCollaborator.contact_person && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Contact Person:</Text>
              <Text style={styles.infoValue}>{selectedCollaborator.contact_person}</Text>
            </View>
          )}
        </View>

        {selectedCollaborator.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{selectedCollaborator.notes}</Text>
          </View>
        )}

        {/* Documents Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Documents</Text>
          {loadingDocs ? (
            <ActivityIndicator size="small" color="#2089dc" style={styles.docsLoader} />
          ) : (
            <CollaboratorDocuments
              collaboratorId={collaboratorId}
              documents={documents}
              onDocumentsChange={loadDocuments}
              editable={false}
            />
          )}
        </View>

        {/* Related Properties */}
        {selectedCollaborator.properties && selectedCollaborator.properties.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Properties</Text>
            {selectedCollaborator.properties.map((property) => (
              <TouchableOpacity
                key={property.id}
                style={styles.relatedItem}
                onPress={() => navigation.navigate('PropertyDetail' as any, { propertyId: property.id })}
              >
                <View style={styles.relatedInfo}>
                  <Text style={styles.relatedTitle}>{property.title}</Text>
                  <Badge
                    value={property.status}
                    badgeStyle={styles.relatedBadge}
                    textStyle={styles.relatedBadgeText}
                  />
                </View>
                <Icon name="chevron-right" size={20} color="#86939e" />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Related Clients */}
        {selectedCollaborator.clients && selectedCollaborator.clients.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Related Clients</Text>
            {selectedCollaborator.clients.map((client) => (
              <TouchableOpacity
                key={client.id}
                style={styles.relatedItem}
                onPress={() => navigation.navigate('ClientDetail' as any, { clientId: client.id })}
              >
                <View style={styles.relatedInfo}>
                  <Text style={styles.relatedTitle}>{client.name}</Text>
                  <Badge
                    value={client.status}
                    badgeStyle={styles.relatedBadge}
                    textStyle={styles.relatedBadgeText}
                  />
                </View>
                <Icon name="chevron-right" size={20} color="#86939e" />
              </TouchableOpacity>
            ))}
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
    alignItems: 'center',
    paddingVertical: 30,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 5,
  },
  company: {
    fontSize: 16,
    color: '#86939e',
    marginBottom: 10,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    fontSize: 12,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  statsRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingVertical: 20,
    marginBottom: 10,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#2089dc',
  },
  statLabel: {
    fontSize: 14,
    color: '#86939e',
    marginTop: 5,
  },
  statDivider: {
    width: 1,
    backgroundColor: '#e1e8ee',
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
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  contactText: {
    flex: 1,
    marginLeft: 15,
    fontSize: 16,
    color: '#43484d',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
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
  notes: {
    fontSize: 14,
    color: '#43484d',
    lineHeight: 22,
  },
  docsLoader: {
    marginVertical: 20,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  relatedInfo: {
    flex: 1,
  },
  relatedTitle: {
    fontSize: 16,
    color: '#43484d',
    marginBottom: 5,
  },
  relatedBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  relatedBadgeText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
});
