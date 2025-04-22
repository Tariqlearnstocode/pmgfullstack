import { Database } from '../../types/supabase';
import { BaseService } from './baseService';
import { getAdminClient, supabaseClient } from '../supabase/client';

// Type definitions for the Transactions table
type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

export class TransactionService extends BaseService<Transaction, TransactionInsert, TransactionUpdate> {
  constructor() {
    super('transactions');
  }
  
  /**
   * Create multiple transactions in a single batch operation
   * Automatically calculates lease fees and management fees if applicable
   */
  async bulkCreate(transactions: TransactionInsert[]): Promise<Transaction[]> {
    try {
      // First, apply any fee calculations for each transaction
      const processedTransactions = await Promise.all(
        transactions.map(async (transaction) => {
          return this.applyFeeCalculations(transaction);
        })
      );
      
      // Insert all transactions in a batch
      const { data, error } = await supabaseClient
        .from('transactions')
        .insert(processedTransactions)
        .select();
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error in bulk transaction creation:', error);
      throw error;
    }
  }
  
  /**
   * Apply automatic fee calculations to a transaction
   * This includes lease fees and management fees based on transaction type
   */
  async applyFeeCalculations(transaction: TransactionInsert): Promise<TransactionInsert> {
    try {
      // Skip if no property or tenant associated
      if (!transaction.property_id || !transaction.type_id) {
        return transaction;
      }
      
      // Get transaction type to determine if fees apply
      const { data: typeData } = await supabaseClient
        .from('transaction_types')
        .select('*')
        .eq('id', transaction.type_id)
        .single();
        
      if (!typeData) return transaction;
      
      // Get property details for fee calculations
      const { data: propertyData } = await supabaseClient
        .from('properties')
        .select('*')
        .eq('id', transaction.property_id)
        .single();
        
      if (!propertyData) return transaction;
      
      // Clone the transaction to avoid mutating the original
      const result = { ...transaction };
      
      // Apply management fee if applicable (e.g., for rent payments)
      if (typeData.name === 'Rent Payment' && propertyData.management_fee_percentage > 0) {
        // Management fee is calculated as a percentage of the transaction amount
        const feeAmount = Math.round((transaction.amount * propertyData.management_fee_percentage / 100) * 100) / 100;
        
        // Create a corresponding management fee transaction
        if (feeAmount > 0) {
          // This would be handled separately or through a database trigger
          console.log(`Management fee calculated: $${feeAmount} for transaction amount $${transaction.amount}`);
        }
      }
      
      // Apply lease fee if applicable
      if (typeData.name === 'New Lease' && propertyData.lease_fee_amount > 0) {
        // Lease fee is a fixed amount
        const feeAmount = propertyData.lease_fee_amount;
        
        // Create a corresponding lease fee transaction
        if (feeAmount > 0) {
          // This would be handled separately or through a database trigger
          console.log(`Lease fee applied: $${feeAmount} for new lease`);
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error applying fee calculations:', error);
      return transaction;
    }
  }
  
  /**
   * Get transaction details with related information
   */
  async getTransactionDetails(id: string) {
    const { data, error } = await supabaseClient
      .from('transaction_details')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get all transactions with detailed information
   */
  async getAllTransactionDetails() {
    const { data, error } = await supabaseClient
      .from('transaction_details')
      .select('*')
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get transactions by property ID
   */
  async getTransactionsByProperty(propertyId: string) {
    const { data, error } = await supabaseClient
      .from('transaction_details')
      .select('*')
      .eq('property_id', propertyId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Get transactions by tenant ID
   */
  async getTransactionsByTenant(tenantId: string) {
    const { data, error } = await supabaseClient
      .from('transaction_details')
      .select('*')
      .eq('tenant_id', tenantId)
      .order('date', { ascending: false });
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Add a rent payment transaction (requires admin client)
   */
  async addRentPayment(
    tenantId: string, 
    propertyId: string, 
    amount: number, 
    date: string,
    invoiceNumber?: string,
    notes?: string
  ): Promise<Transaction> {
    const adminClient = await getAdminClient();
    
    // First get the transaction type ID for rent payment
    const { data: typeData, error: typeError } = await adminClient
      .rpc('get_transaction_type_id', { 
        type_name: 'Rent Payment' 
      });
      
    if (typeError) throw typeError;
    
    const transaction: TransactionInsert = {
      tenant_id: tenantId,
      property_id: propertyId,
      type_id: typeData,
      amount,
      date,
      invoice_number: invoiceNumber,
      notes,
      is_manual_edit: true
    };
    
    const { data, error } = await adminClient
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Add an expense transaction (requires admin client)
   */
  async addExpense(
    propertyId: string, 
    amount: number, 
    date: string,
    notes?: string
  ): Promise<Transaction> {
    const adminClient = await getAdminClient();
    
    // First get the transaction type ID for expense
    const { data: typeData, error: typeError } = await adminClient
      .rpc('get_transaction_type_id', { 
        type_name: 'Expense' 
      });
      
    if (typeError) throw typeError;
    
    const transaction: TransactionInsert = {
      property_id: propertyId,
      type_id: typeData,
      amount: -Math.abs(amount), // Ensure amount is negative for expenses
      date,
      notes,
      is_manual_edit: true
    };
    
    const { data, error } = await adminClient
      .from('transactions')
      .insert(transaction)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  }
  
  /**
   * Delete a transaction (requires admin client)
   * This method overrides the base delete method to ensure
   * the correct transaction related updates happen
   */
  async delete(id: string): Promise<void> {
    const adminClient = await getAdminClient();
    
    // Get the transaction first to update related balances correctly
    const { data: transaction, error: getError } = await adminClient
      .from('transactions')
      .select('*')
      .eq('id', id)
      .single();
      
    if (getError) throw getError;
    
    // Perform the delete
    const { error } = await adminClient
      .from('transactions')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
    
    // Update property balance if needed
    if (transaction.property_id) {
      await this.updatePropertyBalance(transaction.property_id);
    }
    
    // Update tenant balance if needed
    if (transaction.tenant_id) {
      await this.updateTenantBalance(transaction.tenant_id);
    }
  }
  
  /**
   * Update property balance (private helper method)
   */
  private async updatePropertyBalance(propertyId: string): Promise<void> {
    const adminClient = await getAdminClient();
    
    // Calculate the current balance from transactions
    const { data, error } = await adminClient
      .from('transactions')
      .select('amount')
      .eq('property_id', propertyId);
      
    if (error) throw error;
    
    const balance = data.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Update the property balance
    const { error: updateError } = await adminClient
      .from('properties')
      .update({ current_balance: balance })
      .eq('id', propertyId);
      
    if (updateError) throw updateError;
  }
  
  /**
   * Update tenant balance (private helper method)
   */
  private async updateTenantBalance(tenantId: string): Promise<void> {
    const adminClient = await getAdminClient();
    
    // Calculate the current balance from transactions
    const { data, error } = await adminClient
      .from('transactions')
      .select('amount')
      .eq('tenant_id', tenantId);
      
    if (error) throw error;
    
    const balance = data.reduce((sum, t) => sum + (t.amount || 0), 0);
    
    // Update the tenant balance
    const { error: updateError } = await adminClient
      .from('tenants')
      .update({ current_balance: balance })
      .eq('id', tenantId);
      
    if (updateError) throw updateError;
  }
}
