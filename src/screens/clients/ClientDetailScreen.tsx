// src/screens/clients/ClientDetailScreen.tsx

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
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Header, Badge, Button } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { ClientsStackScreenProps } from '../../types/navigation.types';
import { useClientsStore } from '../../store/clientsStore';
import { clientsService } from '../../services/clients.service';
import ClientDocuments from '../../components/clients/ClientDocuments';

export default function ClientDetailScreen({ 
  navigation,
  route 
}: ClientsStackScreenProps<'ClientDetail'>) {
  const { clientId } = route.params;
  const { selectedClient, getClient, isLoading, updateLastContacted } = useClientsStore();
  const [documents, setDocuments] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(true);

  useEffect(() => {
    getClient(clientId);
    loadDocuments();
  }, [clientId]);

  const loadDocuments = async () => {
    try {
      setLoadingDocs(true);
      const docs = await clientsService.getClientDocuments(clientId);
      setDocuments(docs);
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoadingDocs(false);
    }
  };

  const handleCall = () => {
    if (selectedClient?.phone) {
      Linking.openURL(`tel:${selectedClient.phone}`);
      updateLastContacted(clientId);
    }
  };

  const handleEmail = () => {
    if (selectedClient?.email) {
      Linking.openURL(`mailto:${selectedClient.email}`);
      updateLastContacted(clientId);
    }
  };

  const handleWhatsApp = () => {
    if (selectedClient?.phone) {
      const phone = selectedClient.phone.replace(/\D/g, '');
      const url = Platform.OS === 'ios' 
        ? `whatsapp://send?phone=${phone}`
        : `whatsapp://send?phone=${phone}`;
      
      Linking.openURL(url).catch(() => {
        Alert.alert('WhatsApp not installed', 'Please install WhatsApp to use this feature.');
      });
      updateLastContacted(clientId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new':
        return '#52c41a';
      case 'contacted':
        return '#1890ff';
      case 'visited':
        return '#722ed1';
      case 'negotiating':
        return '#faad14';
      case 'closed':
        return '#52c41a';
      case 'lost':
        return '#ff4d4f';
      default:
        return '#86939e';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return '#ff4d4f';
      case 'medium':
        return '#faad14';
      case 'low':
        return '#52c41a';
      default:
        return '#86939e';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading || !selectedClient) {
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
          centerComponent={{ text: 'Client Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
          rightComponent={
            <Icon 
              name="edit" 
              size={24} 
              color="white" 
              onPress={() => navigation.navigate('EditClient', { clientId })} 
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
        centerComponent={{ text: 'Client Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
        rightComponent={
          <Icon 
            name="edit" 
            size={24} 
            color="white" 
            onPress={() => navigation.navigate('EditClient', { clientId })} 
          />
        }
        backgroundColor="#2089dc"
      />
      
      <ScrollView style={styles.content}>
        <View style={styles.headerSection}>
          <Text style={styles.name}>{selectedClient.name}</Text>
          <View style={styles.badges}>
            <Badge
              value={selectedClient.status.replace('_', ' ')}
              badgeStyle={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(selectedClient.status) },
              ]}
              textStyle={styles.badgeText}
            />
            <Badge
              value={selectedClient.priority}
              badgeStyle={[
                styles.priorityBadge,
                { backgroundColor: getPriorityColor(selectedClient.priority) },
              ]}
              textStyle={styles.badgeText}
            />
          </View>
        </View>

        {/* Contact Actions */}
        <View style={styles.contactActions}>
          {selectedClient.phone && (
            <TouchableOpacity style={styles.actionButton} onPress={handleCall}>
              <Icon name="phone" size={24} color="#2089dc" />
              <Text style={styles.actionText}>Call</Text>
            </TouchableOpacity>
          )}
          {selectedClient.email && (
            <TouchableOpacity style={styles.actionButton} onPress={handleEmail}>
              <Icon name="email" size={24} color="#2089dc" />
              <Text style={styles.actionText}>Email</Text>
            </TouchableOpacity>
          )}
          {selectedClient.phone && (
            <TouchableOpacity style={styles.actionButton} onPress={handleWhatsApp}>
              <Icon name="chat" size={24} color="#25D366" />
              <Text style={styles.actionText}>WhatsApp</Text>
            </TouchableOpacity>
          )}
        </View>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Contact Information</Text>
          {selectedClient.email && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{selectedClient.email}</Text>
            </View>
          )}
          {selectedClient.phone && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Phone:</Text>
              <Text style={styles.infoValue}>{selectedClient.phone}</Text>
            </View>
          )}
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Last Contacted:</Text>
            <Text style={styles.infoValue}>{formatDate(selectedClient.last_contacted_at)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Created:</Text>
            <Text style={styles.infoValue}>{formatDate(selectedClient.created_at)}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Property Requirements</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Type:</Text>
            <Text style={styles.infoValue}>
              {selectedClient.property_type 
                ? selectedClient.property_type.charAt(0).toUpperCase() + selectedClient.property_type.slice(1)
                : 'Any'}
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Budget:</Text>
            <Text style={styles.infoValue}>
              {selectedClient.budget_min || selectedClient.budget_max
                ? `€${selectedClient.budget_min?.toLocaleString() || '0'} - €${selectedClient.budget_max?.toLocaleString() || '∞'}`
                : 'Not specified'}
            </Text>
          </View>
          {(selectedClient.bedrooms_min || selectedClient.bedrooms_max) && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bedrooms:</Text>
              <Text style={styles.infoValue}>
                {selectedClient.bedrooms_min || '0'}{selectedClient.bedrooms_max && ` - ${selectedClient.bedrooms_max}`}
              </Text>
            </View>
          )}
          {selectedClient.bathrooms_min && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Bathrooms:</Text>
              <Text style={styles.infoValue}>{selectedClient.bathrooms_min}+</Text>
            </View>
          )}
          {selectedClient.preferred_locations && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Locations:</Text>
              <Text style={styles.infoValue}>{selectedClient.preferred_locations}</Text>
            </View>
          )}
        </View>

        {selectedClient.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes</Text>
            <Text style={styles.notes}>{selectedClient.notes}</Text>
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Source Information</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Source Type:</Text>
            <Text style={styles.infoValue}>
              {selectedClient.source_type 
                ? selectedClient.source_type.charAt(0).toUpperCase() + selectedClient.source_type.slice(1)
                : 'Direct'}
            </Text>
          </View>
          {selectedClient.collaborators && (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Collaborator:</Text>
                <Text style={styles.infoValue}>{selectedClient.collaborators.name}</Text>
              </View>
              {selectedClient.collaborators.company_name && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Company:</Text>
                  <Text style={styles.infoValue}>{selectedClient.collaborators.company_name}</Text>
                </View>
              )}
            </>
          )}
        </View>

        {/* Documents Section */}
        <View style={styles.section}>
          <ClientDocuments
            clientId={clientId}
            documents={documents}
            onDocumentsChange={loadDocuments}
            editable={false}
          />
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <Button
            title="View Property Matches"
            icon={<Icon name="search" size={20} color="white" style={{ marginRight: 5 }} />}
            buttonStyle={[styles.actionBtn, { backgroundColor: '#52c41a' }]}
            onPress={() => {
              // TODO: Add PropertyMatches screen to navigation
              Alert.alert('Coming Soon', 'Property matches feature will be available soon.');
            }}
          />
          <Button
            title="Add to Deal"
            icon={<Icon name="handshake" size={20} color="white" style={{ marginRight: 5 }} />}
            buttonStyle={[styles.actionBtn, { backgroundColor: '#722ed1' }]}
            onPress={() => {
              // TODO: Add CreateDeal screen to navigation
              Alert.alert('Coming Soon', 'Create deal feature will be available soon.');
            }}
          />
        </View>
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
    backgroundColor: 'white',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  badges: {
    flexDirection: 'row',
    gap: 10,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  priorityBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
  },
  badgeText: {
    fontSize: 12,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  contactActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    paddingVertical: 15,
    marginBottom: 10,
  },
  actionButton: {
    alignItems: 'center',
    gap: 5,
  },
  actionText: {
    fontSize: 12,
    color: '#43484d',
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
    flex: 1,
    textAlign: 'right',
  },
  notes: {
    fontSize: 14,
    color: '#43484d',
    lineHeight: 22,
  },
  actionsSection: {
    padding: 20,
    gap: 10,
  },
  actionBtn: {
    borderRadius: 25,
    paddingVertical: 12,
  },
});