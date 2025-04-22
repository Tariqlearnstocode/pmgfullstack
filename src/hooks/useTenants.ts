import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Tenant {
  id: string;
  name: string;
  email: string;
  monthly_rent: number;
  security_deposit: number;
  current_balance: number;
  status_id: string;
  property_id: string;
  lease_start_date: string;
  lease_end_date: string;
  move_in_date: string;
  move_out_date: string | null;
  lease_document_url: string | null;
  created_at: string;
  property_address: string;
  rent_amount: number;
  property_status: string;
  status: string;
}

export function useTenants() {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTenants() {
      try {
        const { data, error } = await supabase
          .from('tenant_details')
          .select('*');

        if (error) throw error;
        setTenants(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tenants'));
      } finally {
        setLoading(false);
      }
    }

    fetchTenants();
  }, []);

  return { tenants, loading, error };
}