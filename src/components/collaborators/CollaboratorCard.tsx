// src/components/collaborators/CollaboratorCard.tsx
// ===========================

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

type Collaborator = Database['public']['Tables']['collaborators']['Row'] & {
  properties?: Database['public']['Tables']['properties']['Row'][];
  clients?: Database['public']['Tables']['clients']['Row'][];
};

interface CollaboratorCardProps {
  collaborator: Collaborator;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

const { width } = Dimensions.get('window');

export default function CollaboratorCard({
  collaborator,
  onPress,
  onEdit,
  onDelete,
}: CollaboratorCardProps) {
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

  const propertyCount = collaborator.properties?.length || 0;
  const clientCount = collaborator.clients?.length || 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.mainContent}>
        {/* Left side - Type icon */}
        <View style={[styles.iconContainer, { backgroundColor: getTypeColor(collaborator.type || 'other') }]}>
          <Icon
            name={getTypeIcon(collaborator.type || 'other')}
            size={30}
            color="white"
          />
        </View>

        {/* Center - Collaborator details */}
        <View style={styles.detailsContainer}>
          <View style={styles.headerRow}>
            <Text style={styles.name} numberOfLines={1}>
              {collaborator.name}
            </Text>
            <Badge
              value={collaborator.type || 'other'}
              badgeStyle={[
                styles.typeBadge,
                { backgroundColor: getTypeColor(collaborator.type || 'other') },
              ]}
              textStyle={styles.badgeText}
            />
          </View>

          {collaborator.company_name && (
            <Text style={styles.company} numberOfLines={1}>
              {collaborator.company_name}
            </Text>
          )}

          <View style={styles.contactRow}>
            <Icon name="email" size={14} color="#86939e" />
            <Text style={styles.email} numberOfLines={1}>
              {collaborator.email}
            </Text>
          </View>

          {collaborator.phone && (
            <View style={styles.contactRow}>
              <Icon name="phone" size={14} color="#86939e" />
              <Text style={styles.phone}>{collaborator.phone}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Icon name="home" size={14} color="#2089dc" />
              <Text style={styles.statText}>{propertyCount} properties</Text>
            </View>
            <View style={styles.statItem}>
              <Icon name="people" size={14} color="#2089dc" />
              <Text style={styles.statText}>{clientCount} clients</Text>
            </View>
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
  iconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
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
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    flex: 1,
    marginRight: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    height: 20,
    borderRadius: 10,
  },
  badgeText: {
    fontSize: 11,
    textTransform: 'capitalize',
  },
  company: {
    fontSize: 14,
    color: '#86939e',
    marginBottom: 4,
  },
  contactRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  email: {
    fontSize: 13,
    color: '#86939e',
    marginLeft: 4,
    flex: 1,
  },
  phone: {
    fontSize: 13,
    color: '#86939e',
    marginLeft: 4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 15,
    marginTop: 4,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#2089dc',
    marginLeft: 4,
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
