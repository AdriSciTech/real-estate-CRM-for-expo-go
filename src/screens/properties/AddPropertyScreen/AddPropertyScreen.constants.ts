// src/screens/properties/AddPropertyScreen/AddPropertyScreen.constants.ts

import * as yup from 'yup';

export const propertyTypes = ['apartment', 'house', 'commercial', 'land'] as const;
export const energyRatings = ['A+', 'A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;
export const conditions = ['new', 'good', 'needs_renovation'] as const;
export const sourceTypes = ['landlord', 'developer', 'partner'] as const;

export const propertyFormSchema = yup.object({
  title: yup.string().required('Title is required'),
  description: yup.string().default(''),
  price: yup.number().positive('Price must be positive').nullable().default(null),
  property_type: yup.string().oneOf(['apartment', 'house', 'commercial', 'land']).default('apartment'),
  address: yup.string().default(''),
  city: yup.string().default(''),
  postal_code: yup.string().default(''),
  bedrooms: yup.number().min(0).nullable().default(null),
  bathrooms: yup.number().min(0).nullable().default(null),
  square_meters: yup.number().positive().nullable().default(null),
  floor_number: yup.number().nullable().default(null),
  total_floors: yup.number().nullable().default(null),
  has_terrace: yup.boolean().default(false),
  has_garden: yup.boolean().default(false),
  has_parking: yup.boolean().default(false),
  has_elevator: yup.boolean().default(false),
  source_type: yup.string().nullable().oneOf(['landlord', 'developer', 'partner', null]).default(null),
  source_collaborator_id: yup.string().nullable().default(null),
}).required();