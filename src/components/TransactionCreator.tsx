import React, { useState, useMemo } from 'react';
import { Calendar, DollarSign, Hash, FileText, Plus, Minus } from 'lucide-react';
import Select from 'react-select';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';

interface TransactionCreatorProps {
  initialMode?: 'charge' | 'payment';
  propertyId?: string;
  tenantId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TransactionCreator: React.FC<TransactionCreatorProps> = ({
  initialMode,
  propertyId,
  tenantId,
  onSuccess,
  onCancel
}) => {
  const { state: { properties, tenants, transactionTypes }, createTransaction } = useData();

  const [transactionMode, setTransactionMode] = useState<'charge' | 'payment' | null>(initialMode || null);
  const [formData, setFormData] = useState({
    type_id: '',
    property_id: propertyId || '',
    tenant_id: tenantId || '',
    amount: '',
    date: format(new Date(), 'yyyy-MM-dd'),
    unit_reference: '',
    invoice_number: ''
  });

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const availableTenants = useMemo(() => 
    formData.property_id
      ? tenants.filter(tenant => tenant.property_id === formData.property_id)
      : tenants,
    [formData.property_id, tenants]
  );

  const filteredTransactionTypes = useMemo(() => {
    if (!transactionMode) return [];
    return transactionTypes.filter(type => 
      transactionMode === 'charge' ? type.category === 'Charge' : type.category === 'Payment'
    );
  }, [transactionMode, transactionTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Validate required fields
      if (!formData.type_id) throw new Error('Transaction type is required');
      if (!formData.property_id) throw new Error('Property is required');
      
      // Amount validation
      if (!formData.amount) {
        throw new Error('Amount is required');
      }
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) throw new Error('Please enter a valid number');
      if (amount === 0) throw new Error('Amount cannot be zero');

      // Get the transaction type to determine if amount should be negative
      const transactionType = transactionTypes.find(type => type.id === formData.type_id);
      if (!transactionType) throw new Error('Invalid transaction type');

      // Set amount sign based on transaction mode
      const finalAmount = transactionMode === 'payment' ? -Math.abs(amount) : Math.abs(amount);
      
      if (!formData.date) throw new Error('Date is required');
      
      const result = await createTransaction({
        ...formData,
        amount: finalAmount,
        date: formData.date,
        tenant_id: formData.tenant_id || undefined,
        unit_reference: formData.unit_reference || undefined,
        invoice_number: formData.invoice_number || undefined
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (!transactionMode) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <button
            type="button"
            onClick={() => setTransactionMode('charge')}
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors flex flex-col items-center justify-center space-y-4"
          >
            <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Plus className="text-blue-600" size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">Record a Charge</h3>
              <p className="text-sm text-gray-500 mt-1">Rent, fees, and other charges</p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTransactionMode('payment')}
            className="p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors flex flex-col items-center justify-center space-y-4"
          >
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
              <Minus className="text-green-600" size={24} />
            </div>
            <div className="text-center">
              <h3 className="font-semibold text-gray-900">Record a Payment</h3>
              <p className="text-sm text-gray-500 mt-1">Tenant payments and credits</p>
            </div>
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          {transactionMode === 'charge' ? 'Record a Charge' : 'Record a Payment'}
        </h2>
        <button
          type="button"
          onClick={() => {
            setTransactionMode(null);
            setFormData(prev => ({ ...prev, type_id: '' }));
          }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          Change type
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Transaction Type*
          </label>
          <Select
            value={filteredTransactionTypes.find(type => type.id === formData.type_id)}
            onChange={(selected) => setFormData({ ...formData, type_id: selected?.id || '' })}
            options={filteredTransactionTypes}
            getOptionLabel={(option) => option.display_name}
            getOptionValue={(option) => option.id}
            placeholder="Select type"
            className="react-select"
            classNamePrefix="react-select"
            isClearable
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Property*
          </label>
          <Select
            value={properties.find(property => property.id === formData.property_id)}
            onChange={(selected) => setFormData({ ...formData, property_id: selected?.id || '', tenant_id: '' })}
            options={properties}
            getOptionLabel={(option) => option.address}
            getOptionValue={(option) => option.id}
            placeholder="Select property"
            className="react-select"
            classNamePrefix="react-select"
            isClearable
          />
        </div>

        {formData.property_id && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tenant
            </label>
            <Select
              value={availableTenants.find(tenant => tenant.id === formData.tenant_id)}
              onChange={(selected) => setFormData({ ...formData, tenant_id: selected?.id || '' })}
              options={availableTenants}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              placeholder="Select tenant"
              className="react-select"
              classNamePrefix="react-select"
              isClearable
            />
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Amount*
          </label>
          <div className="relative">
            <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="number"
              step="any"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Date*
          </label>
          <div className="relative">
            <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="date"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Reference
          </label>
          <div className="relative">
            <Hash className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.unit_reference}
              onChange={(e) => setFormData({ ...formData, unit_reference: e.target.value })}
              placeholder="e.g., APR2025"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Invoice Number
          </label>
          <div className="relative">
            <FileText className="absolute left-3 top-2.5 text-gray-400" size={20} />
            <input
              type="text"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={formData.invoice_number}
              onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
              placeholder="e.g., INV-001"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-2 pt-4">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          className={`px-4 py-2 text-white rounded-lg transition-colors disabled:opacity-50 ${
            transactionMode === 'charge' 
              ? 'bg-blue-600 hover:bg-blue-700' 
              : 'bg-green-600 hover:bg-green-700'
          }`}
          disabled={submitting}
        >
          {submitting ? 'Creating...' : `Record ${transactionMode === 'charge' ? 'Charge' : 'Payment'}`}
        </button>
      </div>
    </form>
  );
};