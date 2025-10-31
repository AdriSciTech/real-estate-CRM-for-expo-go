export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      client_documents: {
        Row: {
          id: string
          client_id: string
          file_name: string
          file_url: string
          file_size: number | null
          file_type: string | null
          document_type: 'id' | 'proof_of_income' | 'bank_statement' | 'employment_letter' | 'reference' | 'contract' | 'other' | null
          description: string | null
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          id?: string
          client_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          document_type?: 'id' | 'proof_of_income' | 'bank_statement' | 'employment_letter' | 'reference' | 'contract' | 'other' | null
          description?: string | null
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          id?: string
          client_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          document_type?: 'id' | 'proof_of_income' | 'bank_statement' | 'employment_letter' | 'reference' | 'contract' | 'other' | null
          description?: string | null
          upload_date?: string
          uploaded_by?: string | null
        }
      }
      client_property_interests: {
        Row: {
          id: string
          client_id: string
          property_id: string
          interest_level: 'interested' | 'viewed' | 'rejected' | 'favorite' | null
          viewed_at: string | null
          feedback: string | null
          created_at: string
        }
        Insert: {
          id?: string
          client_id: string
          property_id: string
          interest_level?: 'interested' | 'viewed' | 'rejected' | 'favorite' | null
          viewed_at?: string | null
          feedback?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          client_id?: string
          property_id?: string
          interest_level?: 'interested' | 'viewed' | 'rejected' | 'favorite' | null
          viewed_at?: string | null
          feedback?: string | null
          created_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string | null
          phone: string | null
          notes: string | null
          created_at: string
          updated_at: string
          budget_min: number | null
          budget_max: number | null
          preferred_locations: string | null
          property_type: 'apartment' | 'house' | 'commercial' | 'land' | null
          bedrooms_min: number | null
          bedrooms_max: number | null
          bathrooms_min: number | null
          source_type: 'direct' | 'partner' | 'referral' | 'website' | null
          source_collaborator_id: string | null
          status: 'new' | 'contacted' | 'visited' | 'negotiating' | 'closed' | 'lost'
          priority: 'high' | 'medium' | 'low'
          last_contacted_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          budget_min?: number | null
          budget_max?: number | null
          preferred_locations?: string | null
          property_type?: 'apartment' | 'house' | 'commercial' | 'land' | null
          bedrooms_min?: number | null
          bedrooms_max?: number | null
          bathrooms_min?: number | null
          source_type?: 'direct' | 'partner' | 'referral' | 'website' | null
          source_collaborator_id?: string | null
          status?: 'new' | 'contacted' | 'visited' | 'negotiating' | 'closed' | 'lost'
          priority?: 'high' | 'medium' | 'low'
          last_contacted_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string | null
          phone?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
          budget_min?: number | null
          budget_max?: number | null
          preferred_locations?: string | null
          property_type?: 'apartment' | 'house' | 'commercial' | 'land' | null
          bedrooms_min?: number | null
          bedrooms_max?: number | null
          bathrooms_min?: number | null
          source_type?: 'direct' | 'partner' | 'referral' | 'website' | null
          source_collaborator_id?: string | null
          status?: 'new' | 'contacted' | 'visited' | 'negotiating' | 'closed' | 'lost'
          priority?: 'high' | 'medium' | 'low'
          last_contacted_at?: string | null
        }
      }
      collaborator_documents: {
        Row: {
          id: string
          collaborator_id: string | null
          file_name: string
          file_url: string
          file_size: number | null
          file_type: string | null
          upload_date: string
          uploaded_by: string | null
        }
        Insert: {
          id?: string
          collaborator_id?: string | null
          file_name: string
          file_url: string
          file_size?: number | null
          file_type?: string | null
          upload_date?: string
          uploaded_by?: string | null
        }
        Update: {
          id?: string
          collaborator_id?: string | null
          file_name?: string
          file_url?: string
          file_size?: number | null
          file_type?: string | null
          upload_date?: string
          uploaded_by?: string | null
        }
      }
      collaborators: {
        Row: {
          id: string
          user_id: string
          name: string
          email: string
          role: string
          created_at: string
          updated_at: string
          contact_person: string | null
          phone: string | null
          contract_document: string | null
          notes: string | null
          document_url: string | null
          document_file_name: string | null
          type: 'landlord' | 'developer' | 'agency' | 'other' | null
          company_name: string | null
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          email: string
          role?: string
          created_at?: string
          updated_at?: string
          contact_person?: string | null
          phone?: string | null
          contract_document?: string | null
          notes?: string | null
          document_url?: string | null
          document_file_name?: string | null
          type?: 'landlord' | 'developer' | 'agency' | 'other' | null
          company_name?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          email?: string
          role?: string
          created_at?: string
          updated_at?: string
          contact_person?: string | null
          phone?: string | null
          contract_document?: string | null
          notes?: string | null
          document_url?: string | null
          document_file_name?: string | null
          type?: 'landlord' | 'developer' | 'agency' | 'other' | null
          company_name?: string | null
        }
      }
      contact_history: {
        Row: {
          id: string
          user_id: string
          contact_type: 'call' | 'email' | 'meeting' | 'viewing' | 'whatsapp' | null
          related_to_type: 'client' | 'collaborator' | null
          related_to_id: string | null
          subject: string | null
          notes: string | null
          contacted_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          contact_type?: 'call' | 'email' | 'meeting' | 'viewing' | 'whatsapp' | null
          related_to_type?: 'client' | 'collaborator' | null
          related_to_id?: string | null
          subject?: string | null
          notes?: string | null
          contacted_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          contact_type?: 'call' | 'email' | 'meeting' | 'viewing' | 'whatsapp' | null
          related_to_type?: 'client' | 'collaborator' | null
          related_to_id?: string | null
          subject?: string | null
          notes?: string | null
          contacted_at?: string
          created_at?: string
        }
      }
      deals: {
        Row: {
          id: string
          user_id: string
          property_id: string
          client_id: string
          source_property_collaborator_id: string | null
          source_client_collaborator_id: string | null
          deal_type: 'sale' | 'rent' | null
          status: 'negotiation' | 'reserved' | 'closed' | 'cancelled'
          original_price: number | null
          offer_amount: number | null
          counter_offer_amount: number | null
          final_amount: number | null
          commission_percentage: number | null
          commission_amount: number | null
          commission_split: string | null
          expected_closing_date: string | null
          closed_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          property_id: string
          client_id: string
          source_property_collaborator_id?: string | null
          source_client_collaborator_id?: string | null
          deal_type?: 'sale' | 'rent' | null
          status?: 'negotiation' | 'reserved' | 'closed' | 'cancelled'
          original_price?: number | null
          offer_amount?: number | null
          counter_offer_amount?: number | null
          final_amount?: number | null
          commission_percentage?: number | null
          commission_amount?: number | null
          commission_split?: string | null
          expected_closing_date?: string | null
          closed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          property_id?: string
          client_id?: string
          source_property_collaborator_id?: string | null
          source_client_collaborator_id?: string | null
          deal_type?: 'sale' | 'rent' | null
          status?: 'negotiation' | 'reserved' | 'closed' | 'cancelled'
          original_price?: number | null
          offer_amount?: number | null
          counter_offer_amount?: number | null
          final_amount?: number | null
          commission_percentage?: number | null
          commission_amount?: number | null
          commission_split?: string | null
          expected_closing_date?: string | null
          closed_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      developer_projects: {
        Row: {
          id: string
          user_id: string
          name: string
          collaborator_id: string
          location: string | null
          description: string | null
          delivery_date: string | null
          total_units: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          collaborator_id: string
          location?: string | null
          description?: string | null
          delivery_date?: string | null
          total_units?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          collaborator_id?: string
          location?: string | null
          description?: string | null
          delivery_date?: string | null
          total_units?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      properties: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          price: number | null
          location: string | null
          status: string
          sold_price: number | null
          sold_date: string | null
          created_at: string
          updated_at: string
          project_id: string | null
          source_type: 'landlord' | 'developer' | 'partner' | null
          source_collaborator_id: string | null
          property_type: 'apartment' | 'house' | 'commercial' | 'land' | null
          price_currency: string
          bedrooms: number | null
          bathrooms: number | null
          square_meters: number | null
          floor_number: number | null
          total_floors: number | null
          has_terrace: boolean
          has_garden: boolean
          has_parking: boolean
          has_elevator: boolean
          energy_rating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null
          views: string | null
          condition: 'new' | 'good' | 'needs_renovation' | null
          availability_date: string | null
          address: string | null
          city: string | null
          postal_code: string | null
          country: string
          latitude: number | null
          longitude: number | null
          commission_agreement: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          price?: number | null
          location?: string | null
          status?: string
          sold_price?: number | null
          sold_date?: string | null
          created_at?: string
          updated_at?: string
          project_id?: string | null
          source_type?: 'landlord' | 'developer' | 'partner' | null
          source_collaborator_id?: string | null
          property_type?: 'apartment' | 'house' | 'commercial' | 'land' | null
          price_currency?: string
          bedrooms?: number | null
          bathrooms?: number | null
          square_meters?: number | null
          floor_number?: number | null
          total_floors?: number | null
          has_terrace?: boolean
          has_garden?: boolean
          has_parking?: boolean
          has_elevator?: boolean
          energy_rating?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null
          views?: string | null
          condition?: 'new' | 'good' | 'needs_renovation' | null
          availability_date?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          commission_agreement?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          price?: number | null
          location?: string | null
          status?: string
          sold_price?: number | null
          sold_date?: string | null
          created_at?: string
          updated_at?: string
          project_id?: string | null
          source_type?: 'landlord' | 'developer' | 'partner' | null
          source_collaborator_id?: string | null
          property_type?: 'apartment' | 'house' | 'commercial' | 'land' | null
          price_currency?: string
          bedrooms?: number | null
          bathrooms?: number | null
          square_meters?: number | null
          floor_number?: number | null
          total_floors?: number | null
          has_terrace?: boolean
          has_garden?: boolean
          has_parking?: boolean
          has_elevator?: boolean
          energy_rating?: 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G' | null
          views?: string | null
          condition?: 'new' | 'good' | 'needs_renovation' | null
          availability_date?: string | null
          address?: string | null
          city?: string | null
          postal_code?: string | null
          country?: string
          latitude?: number | null
          longitude?: number | null
          commission_agreement?: string | null
        }
      }
     property_media: {
  Row: {
    id: string
    property_id: string
    file_type: 'image' | 'video' | 'document' | 'floorplan' | null
    file_url: string
    file_name: string | null
    file_size: number | null
    caption: string | null
    display_order: number
    created_at: string
    uploaded_at: string
    uploaded_by: string | null
  }
  Insert: {
    id?: string
    property_id: string
    file_type?: 'image' | 'video' | 'document' | 'floorplan' | null
    file_url: string
    file_name?: string | null
    file_size?: number | null
    caption?: string | null
    display_order?: number
    created_at?: string
    uploaded_at?: string
    uploaded_by?: string | null
  }
  Update: {
    id?: string
    property_id?: string
    file_type?: 'image' | 'video' | 'document' | 'floorplan' | null
    file_url?: string
    file_name?: string | null
    file_size?: number | null
    caption?: string | null
    display_order?: number
    created_at?: string
    uploaded_at?: string
    uploaded_by?: string | null
  }
}
      tasks: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          status: string
          priority: string
          due_date: string | null
          created_at: string
          updated_at: string
          related_to_type: 'client' | 'property' | 'deal' | 'other' | null
          related_to_id: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
          related_to_type?: 'client' | 'property' | 'deal' | 'other' | null
          related_to_id?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          status?: string
          priority?: string
          due_date?: string | null
          created_at?: string
          updated_at?: string
          related_to_type?: 'client' | 'property' | 'deal' | 'other' | null
          related_to_id?: string | null
          notes?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}