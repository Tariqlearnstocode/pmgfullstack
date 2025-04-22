import { Database } from '../../types/supabase';
import { BaseService } from './baseService';
import { getAdminClient, supabaseClient } from '../supabase/client';

// Type definitions for the Owners table
type Owner = Database['public']['Tables']['owners']['Row'];
type OwnerInsert = Database['public']['Tables']['owners']['Insert'];
type OwnerUpdate = Database['public']['Tables']['owners']['Update'];

export class OwnerService extends BaseService<Owner, OwnerInsert, OwnerUpdate> {
  constructor() {
    super('owners');
  }
  
  /**
   * Get owner details including properties
   */
  async getOwnerDetails(id: string) {
    const { data, error } = await supabaseClient
      .from('owner_details')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get all owners with detailed information
   */
  async getAllOwnerDetails() {
    const { data, error } = await supabaseClient
      .from('owner_details')
      .select('*');
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Generate owner statement (financial report)
   */
  async getOwnerStatement(ownerId: string, startDate: string, endDate: string) {
    const { data, error } = await supabaseClient
      .from('owner_statement_details')
      .select('*')
      .eq('owner_id', ownerId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Update owner contact information (requires admin client)
   */
  async updateOwnerContact(id: string, email: string, phone: string) {
    const adminClient = await getAdminClient();
    
    const { data, error } = await adminClient
      .from('owners')
      .update({ email, phone })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}
