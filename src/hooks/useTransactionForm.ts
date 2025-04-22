import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TransactionType {
  id: string;
  name: string;
  category: string;
  display_name: string;
}

export interface Property {
  id: string;
  address: string;
  city: string;
  zip: string;
}

export interface Tenant {
  id: string;
  name: string;
  email: string;
  property_id: string;
}

export function useTransactionForm(propertyId?: string | null, tenantId?: string | null) {
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchFormData() {
      try {
        // Fetch transaction types
        const { data: typesData, error: typesError } = await supabase
          .from('transaction_types')
          .select(`
            id,
            name,
            category,
            display_name
          `)
          .order('display_name');

        if (typesError) throw typesError;

        // Fetch properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('property_details')
          .select(`
            id,
            address,
            city,
            zip,
            property_status
          `)
          .order('address');

        if (propertiesError) throw propertiesError;

        // Fetch tenants
        const { data: tenantsData, error: tenantsError } = await supabase
          .from('tenant_details')
          .select('id, name, email, property_id')
          .eq('status', 'Active')
          .order('name');

        if (tenantsError) throw tenantsError;

        setTransactionTypes(typesData || []);
        setProperties(propertiesData || []);
        setTenants(tenantsData || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch form data'));
      } finally {
        setLoading(false);
      }
    }

    fetchFormData();
  }, []);

  async function createTransaction(data: {
    type_id: string;
    property_id: string;
    tenant_id?: string;
    amount: number;
    date: string;
    unit_reference?: string;
    invoice_number?: string;
  }) {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([data]);

      if (error) throw error;
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to create transaction' 
      };
    }
  }

  return { 
    transactionTypes, 
    properties, 
    tenants, 
    loading, 
    error,
    createTransaction 
  };
}