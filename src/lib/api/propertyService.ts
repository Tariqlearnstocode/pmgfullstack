import { Database } from '../../types/supabase';
import { BaseService } from './baseService';
import { getAdminClient, supabaseClient } from '../supabase/client';

// Type definitions for the Properties table
type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type PropertyUpdate = Database['public']['Tables']['properties']['Update'];

export class PropertyService extends BaseService<Property, PropertyInsert, PropertyUpdate> {
  constructor() {
    super('properties');
  }
  
  /**
   * Get property details with related owner information
   */
  async getPropertyDetails(id: string) {
    const { data, error } = await supabaseClient
      .from('property_details')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get all properties with detailed information
   */
  async getAllPropertyDetails() {
    const { data, error } = await supabaseClient
      .from('property_details')
      .select('*');
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get properties by owner ID
   */
  async getPropertiesByOwner(ownerId: string) {
    const { data, error } = await supabaseClient
      .from('properties')
      .select('*')
      .eq('owner_id', ownerId);
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Update property status (requires admin client)
   */
  async updatePropertyStatus(id: string, statusId: string) {
    const adminClient = await getAdminClient();
    
    const { data, error } = await adminClient
      .from('properties')
      .update({ 
        status_id: statusId,
        status_date: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get property summary (occupancy, revenue, etc.)
   */
  async getPropertySummary() {
    const { data, error } = await supabaseClient
      .from('property_summary_view')
      .select('*');
      
    if (error) throw error;
    return data;
  }
}
