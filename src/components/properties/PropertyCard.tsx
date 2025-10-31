import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
  Platform,
} from 'react-native';
import { Badge } from 'react-native-elements';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { Database } from '../../types/database.types';

type Property = Database['public']['Tables']['properties']['Row'] & {
  property_media?: Database['public']['Tables']['property_media']['Row'][];
};

interface PropertyCardProps {
  property: Property;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

const { width } = Dimensions.get('window');

export default function PropertyCard({
  property,
  onPress,
  onEdit,
  onDelete,
}: PropertyCardProps) {
  const formatPrice = (price: number | null) => {
    if (!price || price <= 0) return 'Price on request';
    return `€${price.toLocaleString()}`;
  };

  const statusMeta = (status?: string) => {
    switch ((status || '').toLowerCase()) {
      case 'available':
        return { label: 'FOR SALE', fg: '#065f46', bg: '#dcfce7' };
      case 'reserved':
        return { label: 'RESERVED', fg: '#78350f', bg: '#fef3c7' };
      case 'sold':
        return { label: 'SOLD', fg: '#7f1d1d', bg: '#fee2e2' };
      case 'rented':
        return { label: 'RENTED', fg: '#1e3a8a', bg: '#dbeafe' };
      default:
        return { label: (status || 'UNKNOWN').toUpperCase(), fg: '#334155', bg: '#e2e8f0' };
    }
  };

  const getPropertyImage = () => {
    // Default placeholder image
    const placeholder = 'https://via.placeholder.com/640x420/ebf0f5/94a3b8?text=No+Image';
    
    try {
      const items = property.property_media || [];
      const images = items.filter((m) => m.file_type === 'image');
      
      if (images.length === 0) {
        return placeholder;
      }
      
      // Sort by display_order to get the first image
      const sorted = [...images].sort(
        (a, b) => (a.display_order || 0) - (b.display_order || 0)
      );
      
      const firstImage = sorted[0];
      
      // Simply use the file_url - don't try to use caption for thumbnails
      // The file_url should be the main image URL
      if (firstImage.file_url && firstImage.file_url.startsWith('http')) {
        return firstImage.file_url;
      }
      
      return placeholder;
    } catch (error) {
      console.error('Error getting property image:', error);
      return placeholder;
    }
  };

  const img = getPropertyImage();
  const sMeta = statusMeta(property.status);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      style={styles.cardWrap}
    >
      {/* Image Block */}
      <View style={styles.imageWrap}>
        <Image
          source={{ uri: img }}
          style={styles.image}
          resizeMode="cover"
          onError={(e) => {
            console.error('Image load error for property:', property.title);
          }}
          defaultSource={{ uri: 'https://via.placeholder.com/640x420/ebf0f5/94a3b8?text=Loading' }}
        />
        {/* Status pill */}
        <View style={[styles.statusPill, { backgroundColor: sMeta.bg }]}>
          <Text style={[styles.statusPillText, { color: sMeta.fg }]}>
            {sMeta.label}
          </Text>
        </View>

        {/* Property type (if present) */}
        {property.property_type ? (
          <View style={styles.typeTag}>
            <Icon name="home-work" size={14} color="#0f172a" />
            <Text style={styles.typeTagText} numberOfLines={1}>
              {property.property_type}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Content Block */}
      <View style={styles.content}>
        {/* Title + Price */}
        <View style={styles.headerRow}>
          <Text style={styles.title} numberOfLines={2}>
            {property.title || 'Untitled property'}
          </Text>
          <Text style={styles.price} numberOfLines={1}>
            {formatPrice(property.price ?? null)}
          </Text>
        </View>

        {/* Location */}
        <View style={styles.locationRow}>
          <Icon name="location-on" size={16} color="#64748b" />
          <Text style={styles.location} numberOfLines={1}>
            {property.city || property.location || 'No location'}
          </Text>
        </View>

        {/* Specs */}
        <View style={styles.specRow}>
          {property.bedrooms != null && (
            <>
              <View style={styles.specItem}>
                <Icon name="bed" size={15} color="#475569" />
                <Text style={styles.specText}>{property.bedrooms}</Text>
              </View>
              <View style={styles.dot} />
            </>
          )}

          {property.bathrooms != null && (
            <>
              <View style={styles.specItem}>
                <Icon name="bathtub" size={15} color="#475569" />
                <Text style={styles.specText}>{property.bathrooms}</Text>
              </View>
              <View style={styles.dot} />
            </>
          )}

          {property.square_meters != null && (
            <View style={styles.specItem}>
              <Icon name="square-foot" size={15} color="#475569" />
              <Text style={styles.specText}>{property.square_meters} m²</Text>
            </View>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryOutline]}
            onPress={(e) => {
              e.stopPropagation();
              // Handle phone action
            }}
            activeOpacity={0.9}
          >
            <Icon name="phone" size={16} color="#ff6b35" />
            <Text style={[styles.actionText, { color: '#ff6b35' }]}>Phone</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionBtn, styles.primaryOutline]}
            onPress={(e) => {
              e.stopPropagation();
              // Handle message action
            }}
            activeOpacity={0.9}
          >
            <Icon name="message" size={16} color="#ff6b35" />
            <Text style={[styles.actionText, { color: '#ff6b35' }]}>Message</Text>
          </TouchableOpacity>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {onEdit && (
            <TouchableOpacity
              style={[styles.iconBtn]}
              onPress={(e) => {
                e.stopPropagation();
                onEdit();
              }}
              activeOpacity={0.8}
            >
              <Icon name="edit" size={18} color="#475569" />
            </TouchableOpacity>
          )}

          {onDelete && (
            <TouchableOpacity
              style={[styles.iconBtn]}
              onPress={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              activeOpacity={0.8}
            >
              <Icon name="delete" size={18} color="#475569" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}

const CARD_H = 112;
const IMG_W = 140;

const styles = StyleSheet.create({
  cardWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    overflow: 'hidden',
    // Soft shadow
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: Platform.OS === 'ios' ? 0.08 : 0.12,
    shadowRadius: 10,
    elevation: 3,
    flexDirection: 'row',
  },
  imageWrap: {
    width: IMG_W,
    height: CARD_H,
    position: 'relative',
    backgroundColor: '#f1f5f9',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  statusPill: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  typeTag: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  typeTagText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0f172a',
    marginLeft: 4,
    maxWidth: IMG_W - 40,
  },

  content: {
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    minHeight: CARD_H,
  },

  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginRight: 8,
  },
  price: {
    color: '#ff6b35',
    fontWeight: '800',
    fontSize: 16,
  },

  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 6,
  },
  location: {
    fontSize: 13,
    color: '#64748b',
    flexShrink: 1,
  },

  specRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specText: {
    fontSize: 12,
    color: '#475569',
    fontWeight: '600',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#cbd5e1',
    marginHorizontal: 8,
  },

  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    marginRight: 8,
  },
  primaryOutline: {
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#ffedd5',
  },
  actionText: {
    marginLeft: 6,
    fontSize: 12,
    fontWeight: '700',
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },
});