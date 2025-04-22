import { getAdminClient, supabaseClient } from '../supabase/client';

/**
 * Base service class with common CRUD operations
 */
export abstract class BaseService<T, InsertT, UpdateT> {
  protected tableName: string;
  
  constructor(tableName: string) {
    this.tableName = tableName;
  }
  
  /**
   * Get all records from the table
   */
  async getAll(): Promise<T[]> {
    const { data, error } = await supabaseClient
      .from(this.tableName)
      .select('*');
      
    if (error) throw error;
    return data as T[];
  }
  
  /**
   * Get a record by ID
   */
  async getById(id: string): Promise<T | null> {
    const { data, error } = await supabaseClient
      .from(this.tableName)
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data as T;
  }
  
  /**
   * Create a new record (requires admin client with write access)
   */
  async create(record: InsertT): Promise<T> {
    const adminClient = await getAdminClient();
    
    const { data, error } = await adminClient
      .from(this.tableName)
      .insert(record)
      .select()
      .single();
      
    if (error) throw error;
    return data as T;
  }
  
  /**
   * Update a record (requires admin client with write access)
   */
  async update(id: string, record: UpdateT): Promise<T> {
    const adminClient = await getAdminClient();
    
    const { data, error } = await adminClient
      .from(this.tableName)
      .update(record)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data as T;
  }
  
  /**
   * Delete a record (requires admin client with write access)
   */
  async delete(id: string): Promise<void> {
    const adminClient = await getAdminClient();
    
    const { error } = await adminClient
      .from(this.tableName)
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  }
}
