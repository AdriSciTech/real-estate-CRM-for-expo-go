// src/components/clients/ClientCard.tsx

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Badge } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Database } from '../../types/database.types';

type Client = Database['public']['Tables']['clients']['Row'] & {
  client_documents?: Database['public']['Tables']['client_documents']['Row'][];
  collaborators?: Database['public']['Tables']['collaborators']['Row'];
};

interface ClientCardProps {
  client: Client;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const { width } = Dimensions.get('window');

export default function ClientCard({
  client,
  onPress,
  onEdit,
  onDelete,
}: ClientCardProps) {
  const formatBudget = (min: number | null, max: number | null) => {
    if (!min && !max) return 'Budget not specified';
    if (min && max) return `€${min.toLocaleString()} - €${max.toLocaleString()}`;
    if (min) return `From €${min.toLocaleString()}`;
    if (max) return `Up to €${max.toLocaleString()}`;
    return '';
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

  const getPropertyTypeIcon = (type: string | null) => {
    switch (type) {
      case 'apartment':
        return 'apartment';
      case 'house':
        return 'home';
      case 'commercial':
        return 'business';
      case 'land':
        return 'terrain';
      default:
        return 'help-outline';
    }
  };

  const getTimeSinceContact = (lastContactedAt: string | null) => {
    if (!lastContactedAt) return 'Never contacted';
    
    const lastContact = new Date(lastContactedAt);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - lastContact.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    return `${Math.floor(diffInDays / 30)} months ago`;
  };

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.mainContent}>
        {/* Left side - Priority indicator */}
        <View 
          style={[
            styles.priorityIndicator, 
            { backgroundColor: getPriorityColor(client.priority) }
          ]} 
        />

        {/* Center - Client details */}
        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {client.name}
            </Text>
            <Badge
              value={client.status.replace('_', ' ')}
              badgeStyle={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(client.status) },
              ]}
              textStyle={styles.badgeText}
            />
          </View>

          <View style={styles.contactRow}>
            {client.email && (
              <View style={styles.contactItem}>
                <Icon name="email" size={14} color="#86939e" />
                <Text style={styles.contactText} numberOfLines={1}>
                  {client.email}
                </Text>
              </View>
            )}
            {client.phone && (
              <View style={styles.contactItem}>
                <Icon name="phone" size={14} color="#86939e" />
                <Text style={styles.contactText} numberOfLines={1}>
                  {client.phone}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.infoRow}>
            <View style={styles.propertyTypeContainer}>
              <Icon 
                name={getPropertyTypeIcon(client.property_type)} 
                size={16} 
                color="#2089dc" 
              />
              <Text style={styles.propertyType}>
                {client.property_type ? client.property_type.charAt(0).toUpperCase() + client.property_type.slice(1) : 'Any'}
              </Text>
            </View>
            <Text style={styles.budget}>{formatBudget(client.budget_min, client.budget_max)}</Text>
          </View>

          <View style={styles.requirementsRow}>
            {(client.bedrooms_min || client.bedrooms_max) && (
              <View style={styles.requirementItem}>
                <Icon name="bed" size={12} color="#86939e" />
                <Text style={styles.requirementText}>
                  {client.bedrooms_min}{client.bedrooms_max && `-${client.bedrooms_max}`}
                </Text>
              </View>
            )}
            {client.bathrooms_min && (
              <View style={styles.requirementItem}>
                <Icon name="bathtub" size={12} color="#86939e" />
                <Text style={styles.requirementText}>{client.bathrooms_min}+</Text>
              </View>
            )}
            {client.preferred_locations && (
              <View style={styles.requirementItem}>
                <Icon name="location-on" size={12} color="#86939e" />
                <Text style={styles.requirementText} numberOfLines={1}>
                  {client.preferred_locations}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.footerRow}>
            <Text style={styles.lastContact}>
              <Icon name="access-time" size={12} color="#86939e" /> {getTimeSinceContact(client.last_contacted_at)}
            </Text>
            {client.source_type && (
              <Text style={styles.source}>
                Source: {client.source_type.charAt(0).toUpperCase() + client.source_type.slice(1)}
              </Text>
            )}
          </View>
        </View>

        {/* Right side - Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onEdit();
            }}
          >
            <Icon name="edit" size={20} color="#2089dc" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={(e) => {
              e.stopPropagation();
              onDelete();
            }}
          >
            <Icon name="delete" size={20} color="#ff4d4f" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 8,
    marginHorizontal: 10,
    marginVertical: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  mainContent: {
    flexDirection: 'row',
    padding: 12,
  },
  priorityIndicator: {
    width: 4,
    borderRadius: 2,
    marginRight: 12,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: 'space-between',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    textTransform: 'capitalize',
    fontWeight: '600',
  },
  contactRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 8,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactText: {
    fontSize: 12,
    color: '#86939e',
    marginLeft: 4,
    flex: 1,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  propertyTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  propertyType: {
    fontSize: 14,
    color: '#43484d',
  },
  budget: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2089dc',
  },
  requirementsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 6,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  requirementText: {
    fontSize: 12,
    color: '#86939e',
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastContact: {
    fontSize: 11,
    color: '#86939e',
    fontStyle: 'italic',
  },
  source: {
    fontSize: 11,
    color: '#86939e',
  },
  actionsContainer: {
    justifyContent: 'center',
    gap: 8,
    marginLeft: 10,
  },
  actionButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
  },
});