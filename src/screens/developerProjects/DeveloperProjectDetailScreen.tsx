// src/screens/developerProjects/DeveloperProjectDetailScreen.tsx

import React, { useEffect, useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Card, Header, Button, Divider } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useDeveloperProjectsStore } from '../../store/developerProjectsStore';
import { usePropertiesStore } from '../../store/propertiesStore';
import { PropertiesStackScreenProps } from '../../types/navigation.types';
import PropertyCard from '../../components/properties/PropertyCard';

export default function DeveloperProjectDetailScreen({ 
  navigation,
  route 
}: PropertiesStackScreenProps<'DeveloperProjectDetail'>) {
  const { projectId } = route.params;
  const {
    selectedProject,
    projectStats,
    isLoading,
    getProject,
    deleteProject,
  } = useDeveloperProjectsStore();
  const { properties } = usePropertiesStore();
  
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getProject(projectId);
  }, [projectId]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await getProject(projectId);
    setRefreshing(false);
  };

  const handleEdit = () => {
    navigation.navigate('EditDeveloperProject', { projectId });
  };

  const handleDelete = () => {
    if (!selectedProject) return;

    Alert.alert(
      'Delete Project',
      `Are you sure you want to delete "${selectedProject.name}"? Properties will be unlinked but not deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteProject(projectId);
              navigation.goBack();
              Alert.alert('Success', 'Project deleted successfully');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete project');
            }
          },
        },
      ]
    );
  };

  const handleAddProperty = () => {
    navigation.navigate('AddProperty', { 
      projectId,
      collaboratorId: selectedProject?.collaborator_id 
    });
  };

  const handlePropertyPress = (propertyId: string) => {
    navigation.navigate('PropertyDetail', { propertyId });
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBD';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading && !selectedProject) {
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
          centerComponent={{ text: 'Loading...', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
          backgroundColor="#2089dc"
        />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2089dc" />
        </View>
      </SafeAreaView>
    );
  }

  const projectProperties = selectedProject?.properties || [];

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
        centerComponent={{ text: selectedProject?.name || 'Project Details', style: { color: '#fff', fontSize: 18, fontWeight: 'bold' } }}
        rightComponent={
          <View style={styles.headerRight}>
            <TouchableOpacity onPress={handleEdit} style={styles.headerButton}>
              <Icon name="edit" size={24} color="white" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} style={styles.headerButton}>
              <Icon name="delete" size={24} color="white" />
            </TouchableOpacity>
          </View>
        }
        backgroundColor="#2089dc"
      />

      <ScrollView
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#2089dc']}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {selectedProject && (
          <>
            {/* Developer Info */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Developer</Text>
              <View style={styles.developerInfo}>
                <Icon name="business" size={20} color="#2089dc" />
                <View style={styles.developerTextContainer}>
                  <Text style={styles.developerName}>
                    {selectedProject.collaborators?.company_name || selectedProject.collaborators?.name}
                  </Text>
                  {selectedProject.collaborators?.contact_person && (
                    <Text style={styles.contactPerson}>
                      Contact: {selectedProject.collaborators.contact_person}
                    </Text>
                  )}
                  {selectedProject.collaborators?.phone && (
                    <Text style={styles.contactInfo}>
                      <Icon name="phone" size={14} color="#86939e" /> {selectedProject.collaborators.phone}
                    </Text>
                  )}
                  {selectedProject.collaborators?.email && (
                    <Text style={styles.contactInfo}>
                      <Icon name="email" size={14} color="#86939e" /> {selectedProject.collaborators.email}
                    </Text>
                  )}
                </View>
              </View>
            </View>

            {/* Project Info */}
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Project Information</Text>
              
              {selectedProject.location && (
                <View style={styles.infoRow}>
                  <Icon name="location-on" size={20} color="#86939e" />
                  <Text style={styles.infoText}>{selectedProject.location}</Text>
                </View>
              )}

              <View style={styles.infoRow}>
                <Icon name="calendar-today" size={20} color="#86939e" />
                <Text style={styles.infoText}>
                  Delivery: {formatDate(selectedProject.delivery_date)}
                </Text>
              </View>

              {selectedProject.description && (
                <View style={styles.descriptionContainer}>
                  <Text style={styles.description}>{selectedProject.description}</Text>
                </View>
              )}
            </View>

            {/* Statistics */}
            {projectStats && (
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Project Statistics</Text>
                <Divider style={styles.divider} />
                <View style={styles.statsGrid}>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{selectedProject.total_units || 0}</Text>
                    <Text style={styles.statLabel}>Total Units</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{projectStats.availableUnits}</Text>
                    <Text style={styles.statLabel}>Available</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{projectStats.soldUnits}</Text>
                    <Text style={styles.statLabel}>Sold</Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={styles.statValue}>{projectStats.rentedUnits}</Text>
                    <Text style={styles.statLabel}>Rented</Text>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.financialStats}>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Total Value:</Text>
                    <Text style={styles.financialValue}>
                      {formatCurrency(projectStats.totalValue)}
                    </Text>
                  </View>
                  <View style={styles.financialRow}>
                    <Text style={styles.financialLabel}>Sold Value:</Text>
                    <Text style={styles.financialValue}>
                      {formatCurrency(projectStats.soldValue)}
                    </Text>
                  </View>
                </View>
              </View>
            )}

            {/* Properties */}
            <View style={styles.card}>
              <View style={styles.propertiesHeader}>
                <Text style={styles.sectionTitle}>Properties ({projectProperties.length})</Text>
                <Button
                  title="Add Property"
                  onPress={handleAddProperty}
                  icon={<Icon name="add" size={16} color="white" style={{ marginRight: 5 }} />}
                  buttonStyle={styles.addButton}
                  titleStyle={styles.addButtonText}
                />
              </View>

              {projectProperties.length > 0 ? (
                <View style={styles.propertiesList}>
                  {projectProperties.map((property) => (
                    <TouchableOpacity
                      key={property.id}
                      onPress={() => handlePropertyPress(property.id)}
                      style={styles.propertyItem}
                    >
                      <View style={styles.propertyInfo}>
                        <Text style={styles.propertyTitle}>{property.title}</Text>
                        <Text style={styles.propertyDetails}>
                          {property.property_type} • {property.bedrooms} bed • {property.bathrooms} bath
                        </Text>
                      </View>
                      <View style={styles.propertyRight}>
                        <Text style={styles.propertyPrice}>
                          {property.price ? formatCurrency(property.price) : 'Price TBD'}
                        </Text>
                        <Text style={[styles.propertyStatus, { color: property.status === 'available' ? '#4caf50' : '#ff9800' }]}>
                          {property.status}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : (
                <View style={styles.emptyProperties}>
                  <Text style={styles.emptyText}>No properties added yet</Text>
                  <Text style={styles.emptySubtext}>Tap "Add Property" to link properties to this project</Text>
                </View>
              )}
            </View>
          </>
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
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    marginLeft: 15,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginHorizontal: 15,
    marginVertical: 8,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#43484d',
    marginBottom: 15,
  },
  developerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  developerTextContainer: {
    flex: 1,
    marginLeft: 10,
  },
  developerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43484d',
    marginBottom: 5,
  },
  contactPerson: {
    fontSize: 14,
    color: '#86939e',
    marginBottom: 3,
  },
  contactInfo: {
    fontSize: 14,
    color: '#86939e',
    marginBottom: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 16,
    color: '#43484d',
    marginLeft: 10,
  },
  descriptionContainer: {
    marginTop: 10,
  },
  description: {
    fontSize: 14,
    color: '#86939e',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#43484d',
  },
  statLabel: {
    fontSize: 12,
    color: '#86939e',
    marginTop: 4,
  },
  divider: {
    marginVertical: 20,
  },
  financialStats: {
    marginTop: 10,
  },
  financialRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  financialLabel: {
    fontSize: 16,
    color: '#86939e',
  },
  financialValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43484d',
  },
  propertiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  addButton: {
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    backgroundColor: '#2089dc',
  },
  addButtonText: {
    fontSize: 14,
  },
  propertiesList: {
    marginTop: 10,
  },
  propertyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ee',
  },
  propertyInfo: {
    flex: 1,
  },
  propertyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43484d',
    marginBottom: 4,
  },
  propertyDetails: {
    fontSize: 14,
    color: '#86939e',
  },
  propertyRight: {
    alignItems: 'flex-end',
  },
  propertyPrice: {
    fontSize: 16,
    fontWeight: '600',
    color: '#43484d',
    marginBottom: 4,
  },
  propertyStatus: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  emptyProperties: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#86939e',
    marginBottom: 5,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#bdc6cf',
  },
});