import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface PropertyDetail {
  id: string;
  address: string;
  city: string;
  zip: string;
  owner_id: string;
  property_status: string;
  has_insurance: boolean;
  mgmt_fee_percentage: number;
  late_fee_amount: number;
  rent_amount: number;
  lease_fee_percentage: number;
  current_balance: number;
  notes: string;
  status_date: string;
  created_at: string;
  tenant_id: string | null;
  tenant_name: string | null;
  tenant_email: string | null;
  tenant_balance: number | null;
  tenant_status: string | null;
  owners: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
}

export interface PropertyTransaction {
  id: string;
  date: string;
  type_display_name: string;
  amount: number;
  tenant_name: string | null;
  tenant_id: string | null;
}

export function usePropertyDetail(id: string) {
  const [property, setProperty] = useState<PropertyDetail | null>(null);
  const [transactions, setTransactions] = useState<PropertyTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchPropertyDetail() {
      try {
        // Fetch property details
        const { data: propertyData, error: propertyError } = await supabase
          .from('property_details')
          .select(`
            id,
            address,
            city,
            zip,
            owner_id,
            property_status,
            has_insurance,
            mgmt_fee_percentage,
            late_fee_amount,
            rent_amount,
            lease_fee_percentage,
            current_balance,
            notes,
            status_date,
            created_at,
            tenant_id,
            tenant_name,
            tenant_email,
            tenant_balance,
            tenant_status,
            owners (
              id,
              name,
              email,
              phone
            )
          `)
          .eq('id', id)
          .single();

        if (propertyError) throw propertyError;

        // Fetch property transactions
        const { data: transactionData, error: transactionError } = await supabase
          .from('transaction_details')
          .select(`
            id,
            date,
            type_display_name,
            amount,
            tenant_name,
            tenant_id
          `)
          .eq('property_id', id)
          .order('date', { ascending: false });

        if (transactionError) throw transactionError;

        setProperty(propertyData);
        setTransactions(transactionData || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch property details'));
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchPropertyDetail();
    }
  }, [id]);

  return { property, transactions, loading, error };
}