import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { ArrowLeft, Download, Building2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import Select from 'react-select';

interface PropertySummary {
  address: string;
  status: string;
  rent_amount: number;
  previous_balance: number;
  amount_due: number;
  total_received: number;
  balance_remaining: number;
  insurance_costs: number;
  mgmt_fee: number;
  net_to_owner: number;
}

export default function OwnerStatementSummary() {
  const [owners, setOwners] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOwner, setSelectedOwner] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [summaries, setSummaries] = useState<PropertySummary[]>([]);

  useEffect(() => {
    // Initialize with current month
    setDateRange({
      start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
      end: format(endOfMonth(new Date()), 'yyyy-MM-dd')
    });
    fetchOwners();
  }, []);

  useEffect(() => {
    if (selectedOwner && dateRange.start && dateRange.end) {
      fetchSummaries();
    }
  }, [selectedOwner, dateRange]);

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('owners')
        .select('id, name')
        .order('name');

      if (error) throw error;
      setOwners(data || []);
    } catch (err) {
      console.error('Error fetching owners:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch owners');
    }
  };

  const fetchSummaries = async () => {
    setLoading(true);
    setError(null);

    if (!dateRange.start || !dateRange.end) {
      setError('Please select a valid date range');
      setLoading(false);
      return;
    }

    try {
      // Get all properties for the owner
      const { data: properties, error: propError } = await supabase
        .from('property_summary_view')
        .select(`
          id,
          address,
          status_name,
          rent_amount,
          lease_fee_percentage,
          mgmt_fee_percentage,
          tenants (
            id,
            current_balance
          )
        `)
        .eq('owner_id', selectedOwner);

      if (propError) throw propError;

      // Process each property
      const summariesPromises = properties?.map(async (property) => {
        // Get previous balance by calculating all transactions up to start date
        const { data: previousTransactions, error: prevTxError } = await supabase
          .from('transaction_details')
          .select('amount')
          .eq('property_id', property.id)
          .lt('date', dateRange.start)
          .order('date', { ascending: true });

        if (prevTxError) throw prevTxError;

        // Calculate previous balance from all transactions before start date
        const previousBalance = previousTransactions?.reduce((sum, tx) => sum + tx.amount, 0) || 0;

        // Get transactions for the selected period
        const { data: transactions, error: txError } = await supabase
          .from('transaction_details')
          .select('*')
          .eq('property_id', property.id)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end);

        if (txError) throw txError;

        // Calculate totals
        const totalReceived = transactions
          ?.filter(tx => tx.category === 'Payment')
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

        const insuranceCosts = transactions
          ?.filter(tx => tx.type_display_name === 'Insurance')
          .reduce((sum, tx) => sum + Math.abs(tx.amount), 0) || 0;

        // Calculate combined management and lease fees
        const mgmtFee = (totalReceived * (property.mgmt_fee_percentage / 100)) +
                       (totalReceived * ((property.lease_fee_percentage || 0) / 100));

        return {
          address: property.address,
          status: property.status_name,
          rent_amount: property.rent_amount,
          previous_balance: previousBalance,
          amount_due: property.rent_amount + (property.tenants?.[0]?.current_balance || 0),
          total_received: totalReceived,
          balance_remaining: (property.rent_amount + (property.tenants?.[0]?.current_balance || 0)) - totalReceived,
          insurance_costs: insuranceCosts,
          mgmt_fee: mgmtFee,
          net_to_owner: totalReceived - insuranceCosts - mgmtFee
        };
      }) || [];

      const summaries = await Promise.all(summariesPromises);
      setSummaries(summaries);
    } catch (err) {
      console.error('Error fetching summaries:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch summaries');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  // Calculate totals
  const totals = summaries.reduce((acc, curr) => ({
    rent_amount: acc.rent_amount + curr.rent_amount,
    previous_balance: acc.previous_balance + curr.previous_balance,
    amount_due: acc.amount_due + curr.amount_due,
    total_received: acc.total_received + curr.total_received,
    balance_remaining: acc.balance_remaining + curr.balance_remaining,
    insurance_costs: acc.insurance_costs + curr.insurance_costs,
    mgmt_fee: acc.mgmt_fee + curr.mgmt_fee,
    net_to_owner: acc.net_to_owner + curr.net_to_owner
  }), {
    rent_amount: 0,
    previous_balance: 0,
    amount_due: 0,
    total_received: 0,
    balance_remaining: 0,
    insurance_costs: 0,
    mgmt_fee: 0,
    net_to_owner: 0
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/reports" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Monthly Account Summary</h1>
        </div>
        <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
          <Download className="mr-2" size={18} />
          Export
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Owner
            </label>
            <Select
              value={owners.find(owner => owner.id === selectedOwner)}
              onChange={(selected) => setSelectedOwner(selected?.id || null)}
              options={owners}
              getOptionLabel={(option) => option.name}
              getOptionValue={(option) => option.id}
              placeholder="Select owner"
              className="react-select"
              classNamePrefix="react-select"
              isClearable
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Start Date
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              End Date
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
          <div className="md:col-span-3">
            <p className="text-sm text-gray-500">Select a date range to view the owner statement summary.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading summary...</p>
        </div>
      ) : error ? (
        <div className="bg-white rounded-lg shadow p-6 text-red-600">
          {error}
        </div>
      ) : summaries.length > 0 ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3">Property</th>
                  <th className="px-6 py-3">Status</th>
                  <th className="px-6 py-3 text-right">Rent Amount</th>
                  <th className="px-6 py-3 text-right">Previous Balance</th>
                  <th className="px-6 py-3 text-right">Amount Due</th>
                  <th className="px-6 py-3 text-right">Total Received</th>
                  <th className="px-6 py-3 text-right">Balance</th>
                  <th className="px-6 py-3 text-right">Insurance</th>
                  <th className="px-6 py-3 text-right">Mgmt Fee</th>
                  <th className="px-6 py-3 text-right">Net to Owner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {summaries.map((summary, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-6 py-4">{summary.address}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                        summary.status === 'Vacant' 
                          ? 'bg-red-100 text-red-800'
                          : summary.status === 'Active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {summary.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">{formatCurrency(summary.rent_amount)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(summary.previous_balance)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(summary.amount_due)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(summary.total_received)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(summary.balance_remaining)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(summary.insurance_costs)}</td>
                    <td className="px-6 py-4 text-right">{formatCurrency(summary.mgmt_fee)}</td>
                    <td className="px-6 py-4 text-right font-medium">{formatCurrency(summary.net_to_owner)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50 font-medium">
                <tr>
                  <td className="px-6 py-4" colSpan={2}>Totals</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totals.rent_amount)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totals.previous_balance)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totals.amount_due)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totals.total_received)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totals.balance_remaining)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totals.insurance_costs)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totals.mgmt_fee)}</td>
                  <td className="px-6 py-4 text-right">{formatCurrency(totals.net_to_owner)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      ) : selectedOwner ? (
        <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
          No properties found for the selected owner and month.
        </div>
      ) : null}
    </div>
  );
}