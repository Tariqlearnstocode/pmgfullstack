import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { Download, Building2, DollarSign, ArrowLeft, Filter, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { exportToExcel } from '../../utils/export';

interface Owner {
  id: string;
  name: string;
  email: string;
}

interface PropertyStatement {
  property_id: string;
  property_address: string;
  rent_amount: number;
  previous_balance: number;
  total_amount_due: number;
  rent_collected: number;
  current_balance: number;
  management_fees: number;
  maintenance_costs: number;
  insurance_costs: number;
  net_owner_amount: number;
  transactions: Array<{
    date: string;
    type: string;
    amount: number;
    category: string;
  }>;
}

export default function OwnerStatement() {
  const [owners, setOwners] = useState<Owner[]>([]);
  const [selectedOwner, setSelectedOwner] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [statements, setStatements] = useState<PropertyStatement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOwners();
  }, []);

  useEffect(() => {
    if (selectedOwner) {
      fetchStatements();
    }
  }, [selectedOwner, dateRange]);

  const fetchOwners = async () => {
    try {
      const { data, error } = await supabase
        .from('owners')
        .select('*')
        .order('name');

      if (error) throw error;
      setOwners(data || []);
    } catch (error: any) {
      console.error('Error fetching owners:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatements = async () => {
    try {
      setLoading(true);
      
      // First get all properties for the owner
      const { data: properties, error: propError } = await supabase
        .from('properties')
        .select(`
          id,
          address,
          rent_amount,
          mgmt_fee_percentage,
          tenants (
            id,
            current_balance
          )
        `)
        .eq('owner_id', selectedOwner);

      if (propError) throw propError;

      // Then get transactions for each property
      const statementsPromises = properties.map(async (property) => {
        const { data: transactions, error: txError } = await supabase
          .from('transactions')
          .select(`
            date,
            amount,
            transaction_types!inner (
              display_name,
              category
            )
          `)
          .eq('property_id', property.id)
          .gte('date', dateRange.start)
          .lte('date', dateRange.end)
          .order('date');

        if (txError) throw txError;

        // Calculate totals
        const rentCollected = transactions
          .filter(tx => (tx.transaction_types as any).display_name === 'Rent Payment')
          .reduce((sum, tx) => sum + tx.amount, 0);

        const managementFees = transactions
          .filter(tx => (tx.transaction_types as any).display_name === 'Management Fee')
          .reduce((sum, tx) => sum + tx.amount, 0);

        const maintenanceCosts = transactions
          .filter(tx => (tx.transaction_types as any).display_name === 'Maintenance')
          .reduce((sum, tx) => sum + tx.amount, 0);

        const insuranceCosts = transactions
          .filter(tx => (tx.transaction_types as any).display_name === 'Insurance')
          .reduce((sum, tx) => sum + tx.amount, 0);

        // Get previous balance from tenants
        const previousBalance = property.tenants?.[0]?.current_balance || 0;
        const totalAmountDue = property.rent_amount + previousBalance;
        const currentBalance = totalAmountDue - rentCollected;

        return {
          property_id: property.id,
          property_address: property.address,
          rent_amount: property.rent_amount,
          previous_balance: previousBalance,
          total_amount_due: totalAmountDue,
          rent_collected: rentCollected,
          current_balance: currentBalance,
          management_fees: managementFees,
          maintenance_costs: maintenanceCosts,
          insurance_costs: insuranceCosts,
          net_owner_amount: rentCollected - managementFees - maintenanceCosts - insuranceCosts,
          transactions: transactions.map(tx => ({
            date: tx.date,
            type: (tx.transaction_types as any).display_name,
            amount: tx.amount,
            category: (tx.transaction_types as any).category
          }))
        };
      });

      const statements = await Promise.all(statementsPromises);
      setStatements(statements);
    } catch (error: any) {
      console.error('Error fetching statements:', error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const owner = owners.find(o => o.id === selectedOwner);
    if (!owner) return;

    const exportData = statements.flatMap(s => [
      {
        'Property': s.property_address,
        'Section': 'Summary',
        'Rent Amount': formatCurrency(s.rent_amount),
        'Previous Balance': formatCurrency(s.previous_balance),
        'Total Amount Due': formatCurrency(s.total_amount_due),
        'Rent Collected': formatCurrency(s.rent_collected),
        'Current Balance': formatCurrency(s.current_balance),
        'Management Fees': formatCurrency(s.management_fees),
        'Maintenance Costs': formatCurrency(s.maintenance_costs),
        'Insurance Costs': formatCurrency(s.insurance_costs),
        'Net Owner Amount': formatCurrency(s.net_owner_amount)
      },
      ...s.transactions.map(tx => ({
        'Property': s.property_address,
        'Section': 'Transactions',
        'Date': format(new Date(tx.date), 'MM/dd/yyyy'),
        'Type': tx.type,
        'Amount': formatCurrency(tx.amount),
        'Category': tx.category
      }))
    ]);

    const filename = `owner-statement-${owner.name.toLowerCase().replace(/\s+/g, '-')}`;
    exportToExcel(exportData, filename);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  };

  const selectedOwnerData = selectedOwner ? owners.find(o => o.id === selectedOwner) : null;

  // Calculate totals across all properties
  const totals = statements.reduce((acc, stmt) => ({
    rent_amount: acc.rent_amount + stmt.rent_amount,
    previous_balance: acc.previous_balance + stmt.previous_balance,
    total_amount_due: acc.total_amount_due + stmt.total_amount_due,
    rent_collected: acc.rent_collected + stmt.rent_collected,
    current_balance: acc.current_balance + stmt.current_balance,
    management_fees: acc.management_fees + stmt.management_fees,
    maintenance_costs: acc.maintenance_costs + stmt.maintenance_costs,
    insurance_costs: acc.insurance_costs + stmt.insurance_costs,
    net_owner_amount: acc.net_owner_amount + stmt.net_owner_amount
  }), {
    rent_amount: 0,
    previous_balance: 0,
    total_amount_due: 0,
    rent_collected: 0,
    current_balance: 0,
    management_fees: 0,
    maintenance_costs: 0,
    insurance_costs: 0,
    net_owner_amount: 0
  });

  if (loading && !selectedOwner) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Link to="/reports" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Owner Statement</h1>
        </div>
        <div className="flex space-x-2">
          <button 
            onClick={handleExport} 
            disabled={statements.length === 0}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            <Download className="mr-2" size={18} />
            Export
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
          <select
            className="flex-1 max-w-lg block rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            value={selectedOwner}
            onChange={(e) => setSelectedOwner(e.target.value)}
          >
            <option value="">Select an owner...</option>
            {owners.map(owner => (
              <option key={owner.id} value={owner.id}>
                {owner.name}
              </option>
            ))}
          </select>

          <div 
            className="flex items-center space-x-2 cursor-pointer text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span className="text-sm font-medium">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 border-b border-gray-200 bg-gray-50">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                onClick={() => setDateRange({
                  start: format(new Date().setMonth(new Date().getMonth() - 1), 'yyyy-MM-dd'),
                  end: format(new Date(), 'yyyy-MM-dd')
                })}
              >
                <XCircle size={16} className="mr-1" />
                Clear Filters
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Owner Details */}
      {selectedOwnerData && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Building2 className="w-5 h-5 text-gray-400" />
              <h3 className="font-medium text-gray-900">Owner Details</h3>
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Name</dt>
                <dd className="text-sm text-gray-900">{selectedOwnerData.name}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Email</dt>
                <dd className="text-sm text-gray-900">{selectedOwnerData.email}</dd>
              </div>
            </dl>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      {statements.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-green-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-green-600" />
              <h3 className="text-sm font-medium text-green-800">Total Rent Collected</h3>
            </div>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(totals.rent_collected)}</p>
            <p className="text-sm text-green-700 mt-2">
              Due: {formatCurrency(totals.total_amount_due)}
            </p>
          </div>

          <div className="bg-blue-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              <h3 className="text-sm font-medium text-blue-800">Total Expenses</h3>
            </div>
            <p className="text-2xl font-bold text-blue-900">
              {formatCurrency(totals.management_fees + totals.maintenance_costs + totals.insurance_costs)}
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2 text-xs text-blue-700">
              <div>Mgmt: {formatCurrency(totals.management_fees)}</div>
              <div>Maint: {formatCurrency(totals.maintenance_costs)}</div>
              <div>Ins: {formatCurrency(totals.insurance_costs)}</div>
            </div>
          </div>

          <div className="bg-purple-50 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              <h3 className="text-sm font-medium text-purple-800">Net Owner Amount</h3>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatCurrency(totals.net_owner_amount)}</p>
            <p className="text-sm text-purple-700 mt-2">
              Balance: {formatCurrency(totals.current_balance)}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
          {error}
        </div>
      )}

      {/* Property Statements */}
      {statements.map((property) => (
        <div key={property.property_id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">{property.property_address}</h3>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Rent Amount</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(property.rent_amount)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Previous Balance</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(property.previous_balance)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Total Amount Due</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(property.total_amount_due)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Rent Collected</dt>
                <dd className="text-sm text-gray-900">{formatCurrency(property.rent_collected)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Current Balance</dt>
                <dd className={`text-sm ${property.current_balance < 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {formatCurrency(property.current_balance)}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Management Fees</dt>
                <dd className="text-sm text-red-600">-{formatCurrency(property.management_fees)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Maintenance</dt>
                <dd className="text-sm text-red-600">-{formatCurrency(property.maintenance_costs)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Insurance</dt>
                <dd className="text-sm text-red-600">-{formatCurrency(property.insurance_costs)}</dd>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-100">
              <dt className="text-sm font-medium text-gray-500">Net Owner Amount</dt>
              <dd className="text-lg font-medium text-gray-900">{formatCurrency(property.net_owner_amount)}</dd>
            </div>
          </div>

          <div className="w-full overflow-auto">
            <table className="w-full text-sm text-left text-gray-500">
              <thead className="text-xs uppercase bg-gray-50">
                <tr>
                  <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 font-medium text-gray-500 uppercase tracking-wider text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
              {property.transactions.map((transaction, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">{format(new Date(transaction.date), 'MMM d, yyyy')}</td>
                  <td className="px-6 py-4 whitespace-nowrap capitalize">
                    {transaction.type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span className={
                      transaction.category === 'Payment' ? 'text-green-600' : 'text-red-600'
                    }>
                      {transaction.category === 'Payment' ? '' : '-'}
                      {formatCurrency(transaction.amount)}
                    </span>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}

      {statements.length === 0 && selectedOwner && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 text-center text-gray-500">
          No transactions found for the selected date range.
        </div>
      )}
    </div>
  );
}