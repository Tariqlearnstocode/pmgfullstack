import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

export interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
  created_at: string;
  total_properties: number;
  total_rent: number;
  total_tenants: number;
  vacant_properties: number;
}

export function useOwners() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    async function fetchOwners() {
      try {
        const { data, error } = await supabase
          .from('owner_details')
          .select('*');

        if (error) throw error;
        setOwners(data || []);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Failed to fetch owners'));
      } finally {
        setLoading(false);
      }
    }

    fetchOwners();
  }, []);

  return { owners, loading, error };
}