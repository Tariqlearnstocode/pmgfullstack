import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useTransactionDetail } from '../hooks/useTransactionDetail';
import { supabase } from '../lib/supabase';
import { format } from 'date-fns';

const TransactionEdit = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { transaction, loading, error } = useTransactionDetail(id || '');
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    date: '',
    unit_reference: '',
    invoice_number: '',
    notes: ''
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        amount: Math.abs(transaction.amount).toString(),
        date: format(new Date(transaction.date), 'yyyy-MM-dd'),
        unit_reference: transaction.unit_reference || '',
        invoice_number: transaction.invoice_number || '',
        notes: transaction.notes || ''
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    try {
      // Validate amount
      const amount = parseFloat(formData.amount);
      if (isNaN(amount)) throw new Error('Please enter a valid amount');
      if (amount === 0) throw new Error('Amount cannot be zero');

      // Determine if amount should be negative based on original transaction
      const finalAmount = transaction?.amount && transaction.amount < 0 
        ? -Math.abs(amount) 
        : Math.abs(amount);

      const { error: updateError } = await supabase
        .from('transactions')
        .update({
          amount: finalAmount,
          date: formData.date,
          unit_reference: formData.unit_reference || null,
          invoice_number: formData.invoice_number || null,
          notes: formData.notes || null,
          is_manual_edit: true
        })
        .eq('id', id);

      if (updateError) throw updateError;

      navigate(`/transactions/${id}`);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Failed to update transaction');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-500">Loading transaction...</p>
      </div>
    );
  }

  if (error || !transaction) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading transaction. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to={`/transactions/${id}`} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Edit Transaction</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {formError && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount*
              </label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date*
              </label>
              <div className="relative">
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.invoice_number}
                  onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                  placeholder="e.g., INV-001"
                />
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Notes
              </label>
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={4}
                placeholder="Add any additional notes about this transaction..."
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Link
              to={`/transactions/${id}`}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              disabled={submitting}
            >
              {submitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionEdit;