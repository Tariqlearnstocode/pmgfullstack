import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface TenantDetail {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  monthly_rent: number;
  security_deposit: number;
  current_balance: number;
  status: string;
  property_id: string;
  property_address: string;
  lease_start_date: string;
  lease_end_date: string;
  move_in_date: string;
  move_out_date: string | null;
  lease_document_url: string | null;
}

export interface TenantTransaction {
  id: string;
  date: string;
  type_display_name: string;
  amount: number;
  running_balance: number;
}

export function useTenantDetail(id: string) {
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [transactions, setTransactions] = useState<TenantTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTenantDetail() {
      try {
        // Fetch tenant details
        const { data: tenantData, error: tenantError } = await supabase
          .from('tenant_details')
          .select('*')
          .eq('id', id)
          .single();

        if (tenantError) throw tenantError;

        // Fetch tenant transactions
        const { data: transactionData, error: transactionError } = await supabase
          .from('transaction_details')
          .select('*')
          .eq('tenant_id', id)
          .order('date', { ascending: false });

        if (transactionError) throw transactionError;

        setTenant(tenantData);
        setTransactions(transactionData || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch tenant details'));
      } finally {
        setLoading(false);
      }
    }

    if (id) {
      fetchTenantDetail();
    }
  }, [id]);

  return { tenant, transactions, loading, error };
}