import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Transaction {
  id: string;
  tenant_id: string | null;
  property_id: string;
  type_id: string;
  amount: number;
  date: string;
  unit_reference: string | null;
  invoice_number: string | null;
  is_manual_edit: boolean;
  created_at: string;
  type_name: string;
  category: string;
  type_display_name: string;
  tenant_name: string | null;
  tenant_email: string | null;
  property_address: string;
  property_city: string;
  property_zip: string;
  owner_name: string;
  owner_email: string;
}

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const { data, error } = await supabase
          .from('transaction_details')
          .select('*')
          .order('date', { ascending: false });

        if (error) throw error;
        setTransactions(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch transactions'));
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  return { transactions, loading, error };
}