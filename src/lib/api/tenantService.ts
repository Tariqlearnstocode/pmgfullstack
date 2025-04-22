import { Database } from '../../types/supabase';
import { BaseService } from './baseService';
import { getAdminClient, supabaseClient } from '../supabase/client';

// Type definitions for the Tenants table
type Tenant = Database['public']['Tables']['tenants']['Row'];
type TenantInsert = Database['public']['Tables']['tenants']['Insert'];
type TenantUpdate = Database['public']['Tables']['tenants']['Update'];

// Type definitions for the Tenant Notes table
type TenantNote = Database['public']['Tables']['tenant_notes']['Row'];
type TenantNoteInsert = Database['public']['Tables']['tenant_notes']['Insert'];

export class TenantService extends BaseService<Tenant, TenantInsert, TenantUpdate> {
  constructor() {
    super('tenants');
  }
  
  /**
   * Get tenant details including property information
   */
  async getTenantDetails(id: string) {
    const { data, error } = await supabaseClient
      .from('tenant_details')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get all tenants with detailed information
   */
  async getAllTenantDetails() {
    const { data, error } = await supabaseClient
      .from('tenant_details')
      .select('*');
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get tenants by property ID
   */
  async getTenantsByProperty(propertyId: string) {
    const { data, error } = await supabaseClient
      .from('tenants')
      .select('*')
      .eq('property_id', propertyId);
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get tenant notes
   */
  async getTenantNotes(tenantId: string) {
    const { data, error } = await supabaseClient
      .from('tenant_note_details')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Add a note to a tenant (requires admin client)
   */
  async addTenantNote(note: TenantNoteInsert): Promise<TenantNote> {
    const adminClient = await getAdminClient();
    
    const { data, error } = await adminClient
      .from('tenant_notes')
      .insert(note)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Update tenant status (requires admin client)
   */
  async updateTenantStatus(id: string, statusId: string) {
    const adminClient = await getAdminClient();
    
    const { data, error } = await adminClient
      .from('tenants')
      .update({ status_id: statusId })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
}
