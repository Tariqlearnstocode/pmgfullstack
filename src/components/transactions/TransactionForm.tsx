import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { Database } from '../../types/supabase';
import { supabaseClient } from '../../lib/supabase/client';

type Transaction = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionType = Database['public']['Tables']['transaction_types']['Row'];
type Property = Database['public']['Tables']['properties']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];

interface TransactionFormProps {
  transactionId?: string;
  propertyId?: string;
  tenantId?: string;
  onSuccess?: (transaction: Transaction) => void;
}

export default function TransactionForm({ 
  transactionId, 
  propertyId: initialPropertyId, 
  tenantId: initialTenantId,
  onSuccess 
}: TransactionFormProps) {
  const navigate = useNavigate();
  const { execute, transactionService } = useApi<Transaction>();
  
  const [transactionTypes, setTransactionTypes] = useState<TransactionType[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [filteredTenants, setFilteredTenants] = useState<Tenant[]>([]);
  
  const [formData, setFormData] = useState<Partial<TransactionInsert>>({
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    property_id: initialPropertyId,
    tenant_id: initialTenantId,
    is_manual_edit: true
  });
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch transaction types, properties, and tenants for dropdowns
  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        // Fetch transaction types
        const { data: typesData } = await supabaseClient
          .from('transaction_types')
          .select('*');
        
        if (typesData) {
          setTransactionTypes(typesData);
          // Default to Rent Payment if present
          const rentPayment = typesData.find(t => t.name === 'Rent Payment');
          if (rentPayment && !formData.type_id) {
            setFormData((prev: Partial<TransactionInsert>) => ({ ...prev, type_id: rentPayment.id }));
          }
        }
        
        // Fetch properties
        const { data: propsData } = await supabaseClient
          .from('properties')
          .select('*');
          
        if (propsData) {
          setProperties(propsData);
        }
        
        // Fetch tenants
        const { data: tenantsData } = await supabaseClient
          .from('tenants')
          .select('*');
          
        if (tenantsData) {
          setTenants(tenantsData);
          setFilteredTenants(tenantsData);
        }
      } catch (err) {
        console.error('Error fetching reference data:', err);
        setError('Failed to load required data');
      }
    };
    
    fetchReferenceData();
  }, [formData.type_id]);

  // If editing, load the transaction data
  useEffect(() => {
    if (transactionId) {
      const fetchTransaction = async () => {
        setIsLoading(true);
        try {
          const transaction = await transactionService.getById(transactionId);
          if (transaction) {
            setFormData({
              ...transaction,
              date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : ''
            });
          }
        } catch (err) {
          console.error('Error fetching transaction:', err);
          setError('Failed to load transaction details');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchTransaction();
    }
  }, [transactionId, transactionService]);

  // Filter tenants when property changes
  useEffect(() => {
    if (formData.property_id) {
      const filtered = tenants.filter(tenant => 
        tenant.property_id === formData.property_id
      );
      setFilteredTenants(filtered);
      
      // If current tenant is not associated with this property, clear it
      if (formData.tenant_id && !filtered.some(t => t.id === formData.tenant_id)) {
        setFormData((prev: Partial<TransactionInsert>) => ({ ...prev, tenant_id: undefined }));
      }
    } else {
      setFilteredTenants(tenants);
    }
  }, [formData.property_id, tenants]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === 'amount') {
      let amount = parseFloat(value) || 0;
      
      // Get the transaction type
      const transType = transactionTypes.find(t => t.id === formData.type_id);
      
      // If this is an expense type, ensure amount is negative
      if (transType && ['Expense', 'Maintenance', 'Repair'].includes(transType.name)) {
        amount = -Math.abs(amount);
      } else {
        amount = Math.abs(amount);
      }
      
      setFormData({ ...formData, [name]: amount });
    } else if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const typeId = e.target.value;
    const transType = transactionTypes.find(t => t.id === typeId);
    
    // Update the type
    setFormData((prev: Partial<TransactionInsert>) => {
      const updated = { 
        ...prev, 
        type_id: typeId 
      };
      
      // Adjust amount sign based on transaction type
      if (prev.amount) {
        if (transType && ['Expense', 'Maintenance', 'Repair'].includes(transType.name)) {
          updated.amount = -Math.abs(prev.amount);
        } else {
          updated.amount = Math.abs(prev.amount);
        }
      }
      
      return updated;
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      let transaction;
      
      if (transactionId) {
        // Update existing transaction
        transaction = await execute(() => 
          transactionService.update(transactionId, formData as TransactionInsert)
        );
      } else {
        // Create new transaction
        transaction = await execute(() => 
          transactionService.create(formData as TransactionInsert)
        );
      }
      
      if (transaction) {
        if (onSuccess) {
          onSuccess(transaction);
        } else {
          navigate('/transactions');
        }
      }
    } catch (err) {
      console.error('Error saving transaction:', err);
      setError('Failed to save transaction');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && transactionId) {
    return <div className="flex justify-center p-8">Loading transaction data...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">
        {transactionId ? 'Edit Transaction' : 'Add New Transaction'}
      </h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="type_id" className="block text-sm font-medium text-gray-700">
              Transaction Type
            </label>
            <select
              id="type_id"
              name="type_id"
              value={formData.type_id || ''}
              onChange={handleTypeChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select transaction type</option>
              {transactionTypes.map(type => (
                <option key={type.id} value={type.id}>{type.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">
              Amount ($)
            </label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={Math.abs(formData.amount || 0)}
              onChange={handleChange}
              required
              step="0.01"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700">
              Date
            </label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div>
            <label htmlFor="property_id" className="block text-sm font-medium text-gray-700">
              Property
            </label>
            <select
              id="property_id"
              name="property_id"
              value={formData.property_id || ''}
              onChange={handleChange}
              required
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select property</option>
              {properties.map(property => (
                <option key={property.id} value={property.id}>{property.address}, {property.city}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="tenant_id" className="block text-sm font-medium text-gray-700">
              Tenant
            </label>
            <select
              id="tenant_id"
              name="tenant_id"
              value={formData.tenant_id || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            >
              <option value="">Select tenant (optional)</option>
              {filteredTenants.map(tenant => (
                <option key={tenant.id} value={tenant.id}>{tenant.name}</option>
              ))}
            </select>
          </div>
          
          <div>
            <label htmlFor="invoice_number" className="block text-sm font-medium text-gray-700">
              Invoice Number
            </label>
            <input
              type="text"
              id="invoice_number"
              name="invoice_number"
              value={formData.invoice_number || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
              Notes
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          
          <div className="md:col-span-2 flex justify-between items-center pt-4">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : transactionId ? 'Update Transaction' : 'Create Transaction'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
