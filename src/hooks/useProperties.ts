import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Property {
  id: string;
  address: string;
  city: string;
  zip: string;
  owner_id: string;
  status_id: string;
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
  property_status: string;
}

export function useProperties() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchProperties() {
      try {
        const { data, error } = await supabase
          .from('property_details')
          .select('*');

        if (error) throw error;
        setProperties(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch properties'));
      } finally {
        setLoading(false);
      }
    }

    fetchProperties();
  }, []);

  return { properties, loading, error };
}