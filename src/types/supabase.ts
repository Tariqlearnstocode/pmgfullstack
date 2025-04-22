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
      owners: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          created_at?: string
          updated_at?: string | null
        }
      }
      properties: {
        Row: {
          id: string
          address: string
          city: string
          zip: string
          owner_id?: string
          status_id?: string
          status_date?: string
          rent_amount: number
          late_fee_amount: number
          mgmt_fee_percentage: number
          current_balance?: number
          created_at: string
          updated_at: string | null
          notes?: string
        }
        Insert: {
          id?: string
          address: string
          city: string
          zip: string
          owner_id?: string
          status_id?: string
          status_date?: string
          rent_amount: number
          late_fee_amount: number
          mgmt_fee_percentage: number
          current_balance?: number
          created_at?: string
          updated_at?: string | null
          notes?: string
        }
        Update: {
          id?: string
          address?: string
          city?: string
          zip?: string
          owner_id?: string
          status_id?: string
          status_date?: string
          rent_amount?: number
          late_fee_amount?: number
          mgmt_fee_percentage?: number
          current_balance?: number
          created_at?: string
          updated_at?: string | null
          notes?: string
        }
      }
      property_statuses: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      tenants: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          property_id: string
          status_id?: string
          lease_start?: string
          lease_end?: string
          current_balance?: number
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          name: string
          email: string
          phone: string
          property_id: string
          status_id?: string
          lease_start?: string
          lease_end?: string
          current_balance?: number
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          email?: string
          phone?: string
          property_id?: string
          status_id?: string
          lease_start?: string
          lease_end?: string
          current_balance?: number
          created_at?: string
          updated_at?: string | null
        }
      }
      tenant_notes: {
        Row: {
          id: string
          tenant_id: string
          content: string
          created_at: string
          created_by: string
          is_deleted: boolean
        }
        Insert: {
          id?: string
          tenant_id: string
          content: string
          created_at?: string
          created_by: string
          is_deleted?: boolean
        }
        Update: {
          id?: string
          tenant_id?: string
          content?: string
          created_at?: string
          created_by?: string
          is_deleted?: boolean
        }
      }
      tenant_statuses: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
      transactions: {
        Row: {
          id: string
          property_id?: string
          tenant_id?: string
          type_id: string
          amount: number
          date: string
          invoice_number?: string
          notes?: string
          is_manual_edit: boolean
          created_at: string
          updated_at: string | null
        }
        Insert: {
          id?: string
          property_id?: string
          tenant_id?: string
          type_id: string
          amount: number
          date: string
          invoice_number?: string
          notes?: string
          is_manual_edit?: boolean
          created_at?: string
          updated_at?: string | null
        }
        Update: {
          id?: string
          property_id?: string
          tenant_id?: string
          type_id?: string
          amount?: number
          date?: string
          invoice_number?: string
          notes?: string
          is_manual_edit?: boolean
          created_at?: string
          updated_at?: string | null
        }
      }
      transaction_types: {
        Row: {
          id: string
          name: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
        }
      }
    }
    Views: {
      owner_details: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          property_count: number
          total_current_balance: number
        }
      }
      property_details: {
        Row: {
          id: string
          address: string
          city: string
          zip: string
          owner_id: string
          owner_name: string
          status_id: string
          status_name: string
          status_date: string
          rent_amount: number
          late_fee_amount: number
          mgmt_fee_percentage: number
          current_balance: number
          tenant_count: number
          notes: string | null
        }
      }
      property_summary_view: {
        Row: {
          total_properties: number
          occupied_properties: number
          vacant_properties: number
          total_monthly_rent: number
          total_monthly_management_fees: number
        }
      }
      tenant_details: {
        Row: {
          id: string
          name: string
          email: string
          phone: string
          property_id: string
          property_address: string
          property_city: string
          status_id: string
          status_name: string
          lease_start: string
          lease_end: string
          current_balance: number
          rent_amount: number
        }
      }
      tenant_note_details: {
        Row: {
          id: string
          tenant_id: string
          tenant_name: string
          content: string
          created_at: string
          created_by: string
          created_by_name: string
          is_deleted: boolean
        }
      }
      transaction_details: {
        Row: {
          id: string
          property_id: string | null
          property_address: string | null
          tenant_id: string | null
          tenant_name: string | null
          type_id: string
          type_name: string
          amount: number
          date: string
          invoice_number: string | null
          notes: string | null
          is_manual_edit: boolean
        }
      }
      owner_statement_details: {
        Row: {
          owner_id: string
          owner_name: string
          property_id: string
          property_address: string
          date: string
          amount: number
          description: string
          type: string
        }
      }
    }
    Functions: {
      get_transaction_type_id: {
        Args: {
          type_name: string
        }
        Returns: string
      }
      [key: string]: {
        Args: Record<string, unknown>
        Returns: unknown
      }
    }
  }
}
