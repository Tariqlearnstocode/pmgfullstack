import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

// Types
interface DataState {
  transactionTypes: TransactionType[];
  properties: Property[];
  tenants: Tenant[];
  owners: Owner[];
  loading: boolean;
  error: Error | null;
}

interface Owner {
  id: string;
  name: string;
  email: string;
  phone: string;
}

interface TransactionType {
  id: string;
  name: string;
  category: string;
  display_name: string;
}

interface Property {
  id: string;
  address: string;
  city: string;
  zip: string;
  property_status: string;
  owner_id: string;
  owner_name: string;
}

interface Tenant {
  id: string;
  name: string;
  email: string;
  property_id: string;
  status: string;
}

type DataAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: Error | null }
  | { type: 'SET_TRANSACTION_TYPES'; payload: TransactionType[] }
  | { type: 'SET_PROPERTIES'; payload: Property[] }
  | { type: 'SET_OWNERS'; payload: Owner[] }
  | { type: 'SET_TENANTS'; payload: Tenant[] }
  | { type: 'REFRESH_DATA' };

// Context
const DataContext = createContext<{
  state: DataState;
  transactionTypes: TransactionType[];
  dispatch: React.Dispatch<DataAction>;
  createTransaction: (data: CreateTransactionData) => Promise<{ success: boolean; error?: string }>;
  getPropertyDetails: (id: string) => Promise<PropertyDetail | null>;
  getTransactionDetails: (id: string) => Promise<TransactionDetail | null>;
  getOwnerDetails: (id: string) => Promise<OwnerDetail | null>;
  createOwner: (data: CreateOwnerData) => Promise<{ success: boolean; error?: string; id?: string }>;
  updateOwner: (id: string, data: CreateOwnerData) => Promise<{ success: boolean; error?: string }>;
} | null>(null);

// Initial state
const initialState: DataState = {
  transactionTypes: [],
  properties: [],
  tenants: [],
  owners: [],
  loading: true,
  error: null,
};

// Reducer
function dataReducer(state: DataState, action: DataAction): DataState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'SET_TRANSACTION_TYPES':
      return { ...state, transactionTypes: action.payload };
    case 'SET_PROPERTIES':
      return { ...state, properties: action.payload };
    case 'SET_OWNERS':
      return { ...state, owners: action.payload };
    case 'SET_TENANTS':
      return { ...state, tenants: action.payload };
    case 'REFRESH_DATA':
      return { ...state, loading: true };
    default:
      return state;
  }
}

// Provider
export function DataProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(dataReducer, initialState);

  useEffect(() => {
    async function fetchData() {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session) {
          throw new Error('No active session');
        }

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

        console.log('Transaction types response:', { data: typesData, error: typesError });

        if (typesError) throw typesError;

        // Fetch owners
        const { data: ownersData, error: ownersError } = await supabase
          .from('owner_details')
          .select('id, name, email, phone')
          .order('name');

        if (ownersError) throw ownersError;

        // Fetch properties
        const { data: propertiesData, error: propertiesError } = await supabase
          .from('property_details')
          .select('*')
          .order('address');

        if (propertiesError) throw propertiesError;

        // Fetch tenants
        const { data: tenantsData, error: tenantsError } = await supabase
          .from('tenant_details')
          .select('*')
          .order('name');

        if (tenantsError) throw tenantsError;

        dispatch({ type: 'SET_TRANSACTION_TYPES', payload: typesData || [] });
        dispatch({ type: 'SET_OWNERS', payload: ownersData || [] });
        dispatch({ type: 'SET_PROPERTIES', payload: propertiesData || [] });
        dispatch({ type: 'SET_TENANTS', payload: tenantsData || [] });
        dispatch({ type: 'SET_ERROR', payload: null });
      } catch (err) {
        // Don't set error for no session
        if (err.message !== 'No active session') {
          dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err : new Error('Failed to fetch data') });
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }

    if (state.loading) {
      fetchData();
    }
  }, [state.loading]);

  async function createTransaction(data: CreateTransactionData) {
    try {
      // Detailed logging of the transaction data
      console.log('Transaction Data:', {
        ...data,
        amount: {
          value: data.amount,
          type: typeof data.amount,
          isNaN: isNaN(data.amount)
        }
      });

      // Ensure amount is a valid number
      if (typeof data.amount !== 'number' || isNaN(data.amount)) {
        throw new Error('Invalid amount value');
      }

      // Log the selected transaction type
      const selectedType = state.transactionTypes.find(t => t.id === data.type_id);
      console.log('Selected Transaction Type:', selectedType);

      // Send the transaction to Supabase
      const { error } = await supabase
        .from('transactions')
        .insert([data]);

      if (error) {
        console.error('Supabase Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        // Extract the specific error message
        let errorMessage = 'Failed to create transaction';
        if (error.message.includes('violates not-null constraint')) {
          const field = error.message.match(/column "([^"]+)"/)?.[1];
          errorMessage = `The ${field || 'unknown'} field is required`;
        } else if (error.message.includes('violates foreign key constraint')) {
          errorMessage = 'Invalid reference to property, tenant, or transaction type';
        } else {
          errorMessage = error.message;
        }
        throw new Error(errorMessage);
      }

      // Refresh data after successful creation
      dispatch({ type: 'REFRESH_DATA' });
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  }

  async function getPropertyDetails(id: string) {
    try {
      const { data, error } = await supabase
        .from('property_details')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to fetch property details:', err);
      return null;
    }
  }

  async function getTransactionDetails(id: string) {
    try {
      const { data, error } = await supabase
        .from('transaction_details')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to fetch transaction details:', err);
      return null;
    }
  }

  async function getOwnerDetails(id: string) {
    try {
      const { data, error } = await supabase
        .from('owner_details')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Failed to fetch owner details:', err);
      return null;
    }
  }

  async function createOwner(data: CreateOwnerData) {
    try {
      const { data: ownerData, error } = await supabase
        .from('owners')
        .insert([data])
        .select()
        .single();

      if (error) {
        console.error('Supabase Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        let errorMessage = 'Failed to create owner';
        if (error.message.includes('violates not-null constraint')) {
          const field = error.message.match(/column "([^"]+)"/)?.[1];
          errorMessage = `The ${field || 'unknown'} field is required`;
        } else if (error.message.includes('unique constraint')) {
          errorMessage = 'An owner with this email already exists';
        }
        throw new Error(errorMessage);
      }

      dispatch({ type: 'REFRESH_DATA' });
      return { success: true, id: ownerData.id };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  }

  async function updateOwner(id: string, data: CreateOwnerData) {
    try {
      const { error } = await supabase
        .from('owners')
        .update(data)
        .eq('id', id);

      if (error) {
        console.error('Supabase Error:', {
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code
        });

        let errorMessage = 'Failed to update owner';
        if (error.message.includes('violates not-null constraint')) {
          const field = error.message.match(/column "([^"]+)"/)?.[1];
          errorMessage = `The ${field || 'unknown'} field is required`;
        } else if (error.message.includes('unique constraint')) {
          errorMessage = 'An owner with this email already exists';
        }
        throw new Error(errorMessage);
      }

      dispatch({ type: 'REFRESH_DATA' });
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'An unexpected error occurred'
      };
    }
  }

  return (
    <DataContext.Provider value={{ 
      state, 
      transactionTypes: state.transactionTypes,
      dispatch, 
      createTransaction,
      getPropertyDetails,
      getTransactionDetails,
      getOwnerDetails,
      createOwner,
      updateOwner
    }}>
      {children}
    </DataContext.Provider>
  );
}

// Hook
export function useData() {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

// Types for external use
export interface CreateTransactionData {
  type_id: string;
  property_id: string;
  tenant_id?: string;
  amount: number;
  date: string;
  unit_reference?: string;
  invoice_number?: string;
}

export interface CreateOwnerData {
  name: string;
  email: string;
  phone: string;
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

export interface TransactionDetail {
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