import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export function useOwnerDetail(id: string) {
  const [owner, setOwner] = useState<OwnerDetail | null>(null);
  const [properties, setProperties] = useState<OwnerProperty[]>([]);
  const [transactions, setTransactions] = useState<OwnerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOwnerDetail() {
      try {
        // Fetch owner details
        const { data: ownerData, error: ownerError } = await supabase
          .from('owner_details')
          .select(`
            id,
            name,
            email,
            phone,
            total_properties,
            total_rent,
            total_tenants,
            vacant_properties,
            created_at
          `)
          .eq('id', id)
          .single();

        if (ownerError) throw ownerError;

        // Fetch owner properties
        const { data: propertyData, error: propertyError } = await supabase
          .from('property_details')
          .select(`
            id,
            address,
            city,
            zip,
            property_status,
            rent_amount,
            tenant_name,
            tenant_id,
            current_balance,
            has_insurance
          `)
          .eq('owner_id', id);

        if (propertyError) throw propertyError;

        // Fetch owner transactions
        const { data: transactionData, error: transactionError } = await supabase
          .from('transactions')
          .select(`
            id,
            date,
            amount,
            property_id,
            type_id,
            properties!inner (
              address,
              owner_id
            ),
            transaction_types!inner (
              display_name,
              category
            )
          `)
          .eq('properties.owner_id', id) 
          .or('category.eq.Owner,category.eq.Payout', { foreignTable: 'transaction_types' })
          .order('date', { ascending: false });

        if (transactionError) throw transactionError;

        // Transform transaction data to match expected format
        const formattedTransactions = transactionData?.map(t => ({
          id: t.id,
          date: t.date,
          type_display_name: t.transaction_types.display_name,
          amount: t.amount,
          property_address: t.properties.address,
          property_id: t.property_id
        })) || [];

        setOwner(ownerData);
        setProperties(propertyData || []);
        setTransactions(formattedTransactions);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch owner details'));
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchOwnerDetail();
    }
  }, [id]);

  return { owner, properties, transactions, loading, error };
}

export interface OwnerDetail {
  id: string;
  name: string;
  email: string;
  phone: string;
  total_properties: number;
  total_rent: number;
  total_tenants: number;
  vacant_properties: number;
  created_at: string;
}

export interface OwnerProperty {
  id: string;
  address: string;
  city: string;
  zip: string;
  property_status: string;
  rent_amount: number;
  tenant_name: string | null;
  tenant_id: string | null;
  current_balance: number;
  has_insurance: boolean;
}

export interface OwnerTransaction {
  id: string;
  date: string;
  type_display_name: string;
  amount: number;
  property_address: string;
  property_id: string;
}