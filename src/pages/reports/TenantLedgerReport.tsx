import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { useTenantDetail } from '../../hooks/useTenantDetail';
import { useTenants } from '../../hooks/useTenants';
import { useParams, useSearchParams } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Home, 
  Calendar, 
  DollarSign, 
  ArrowLeft,
  Search,
  Printer,
  Download,
  Filter,
  XCircle
} from 'lucide-react';

// Define the Transaction type as it comes from the API
interface Transaction {
  id: string;
  date: string;
  amount: number;
  type_id?: string;
  type_display_name: string;
  property_id?: string;
  tenant_id?: string;
  notes?: string;
  running_balance?: number;
}

// Extended type with calculated running balance
interface TransactionWithBalance extends Transaction {
  runningBalance: number;
}

const TenantLedgerReport = () => {
  // const navigate = useNavigate(); // Uncomment if navigation needed
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const tenantIdFromQuery = searchParams.get('tenant');
  const [searchTerm, setSearchTerm] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(id || tenantIdFromQuery);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [showFilters, setShowFilters] = useState(false);
  // Keeping these commented out for future use
  // const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const { tenants, loading: tenantsLoading } = useTenants();
  const { tenant, transactions, loading: tenantLoading, error } = useTenantDetail(selectedTenantId || '');

  const filteredResults = useMemo(() => {
    const term = searchTerm.toLowerCase();
    return tenants.filter(tenant => 
      tenant.name.toLowerCase().includes(term) ||
      tenant.email.toLowerCase().includes(term) ||
      tenant.property_address.toLowerCase().includes(term)
    );
  }, [searchTerm, tenants]);
  
  // Get unique transaction types (commented out for now as it's not used)
  // const transactionTypes = [...new Set(transactions.map(t => t.type_display_name))];

  // Filter and calculate running balances for transactions
  const filteredTransactions = useMemo(() => {
      // Use type assertion to handle property that might not be in the type definition
    let balance = (tenant as any)?.starting_balance || 0;
    // Filter out management/lease fees and sort by date (oldest first)
    const filtered = transactions
      .filter(tx => {
        // Only show rent charges/payments, late fees, and other tenant-specific transactions
        const allowedTypes = [
          'Rent Charge',
          'Rent Payment',
          'Late Fee',
          'Security Deposit',
          'Application Fee'
        ];
        return allowedTypes.includes(tx.type_display_name);
      })
      .filter(transaction => {
        // Apply date range filter if set
        if (!dateRange.start || !dateRange.end) return true;
        
      const transactionDate = parseISO(transaction.date);
      return isWithinInterval(transactionDate, {
        start: startOfDay(parseISO(dateRange.start)),
        end: endOfDay(parseISO(dateRange.end))
      });
    });

    // Sort by date (oldest first)
    filtered.sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    // Calculate running balances
    return filtered.map(tx => {
      balance += tx.amount;
      return {
        ...tx,
        runningBalance: balance
      } as TransactionWithBalance;
    });
  }, [transactions, dateRange, tenant]);

  const handleTenantSelect = (id: string) => {
    setSelectedTenantId(id);
    setShowResults(false);
    setSearchTerm('');
  };

  const loading = tenantsLoading || (selectedTenantId && tenantLoading);

  if (loading && selectedTenantId) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-500">Loading tenant ledger...</p>
      </div>
    );
  }

  if (error && selectedTenantId) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading tenant ledger. Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6 mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex items-center">
          <Link to="/reports" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Tenant Ledger</h1>
        </div>
        <div className="flex space-x-2">
          {tenant && (
            <>
              <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center shadow-sm">
                <Printer className="mr-2" size={18} />
                Print
              </button>
              <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm">
                <Download className="mr-2" size={18} />
                Download
              </button>
            </>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="relative">
          <input
            type="text"
            placeholder="Search tenants by name, email, or property address..."
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setShowResults(true);
            }}
            onFocus={() => setShowResults(true)}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
        </div>

        {/* Search Results */}
        {showResults && searchTerm && (
          <div className="absolute z-10 mt-2 w-full bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto">
            {filteredResults.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No tenants found
              </div>
            ) : (
              filteredResults.map(tenant => (
                <div
                  key={tenant.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer border-b border-gray-200 last:border-b-0"
                  onClick={() => handleTenantSelect(tenant.id)}
                >
                  <div className="flex items-start">
                    <div className="rounded-full bg-blue-100 p-2 mr-3">
                      <User className="text-blue-600" size={20} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{tenant.name}</h3>
                      <p className="text-sm text-gray-500">{tenant.email}</p>
                      <p className="text-sm text-gray-500">{tenant.property_address}</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {tenant && (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Tenant Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{tenant.name}</h3>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  tenant.status === 'Active' ? 'bg-green-100 text-green-800' : 
                  tenant.status === 'Late' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tenant.status}
                </span>
              </div>
            </div>
            
            <div className="pt-4 space-y-3">
              <div className="flex items-center">
                <Mail className="text-gray-400 mr-3" size={18} />
                <span>{tenant.email}</span>
              </div>
              <div className="flex items-center">
                <Home className="text-gray-400 mr-3" size={18} />
                <Link to={`/properties/${tenant.property_id}`} className="text-blue-600 hover:text-blue-800">
                  {tenant.property_address}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Lease Information */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Lease Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Lease Period</p>
                <div className="flex items-center mt-1">
                  <Calendar className="text-gray-400 mr-2" size={18} />
                  <span>
                    {format(parseISO(tenant.lease_start_date), 'MMM d, yyyy')} - {format(parseISO(tenant.lease_end_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Move-in Date</p>
                <div className="flex items-center mt-1">
                  <Calendar className="text-gray-400 mr-2" size={18} />
                  <span>{format(parseISO(tenant.move_in_date), 'MMM d, yyyy')}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">${tenant.monthly_rent.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Security Deposit</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">${tenant.security_deposit.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">
                    ${Math.abs(filteredTransactions[filteredTransactions.length - 1]?.runningBalance || 0).toLocaleString()}
                    {filteredTransactions[filteredTransactions.length - 1]?.runningBalance > 0 ? ' (due)' : filteredTransactions[filteredTransactions.length - 1]?.runningBalance < 0 ? ' (credit)' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 lg:col-span-3">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Transaction History</h2>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="col-span-1 md:col-span-2 flex justify-end mb-2">
                  <button 
                    onClick={() => setDateRange({ start: '', end: '' })}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                  >
                    <XCircle size={16} className="mr-1" />
                    Clear Filters
                  </button>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To Date
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Charges
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payments
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredTransactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/transactions/${transaction.id}`} className="text-gray-900 hover:text-blue-600">
                        {transaction.type_display_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {transaction.amount > 0 && (
                        <span className="text-sm text-gray-900">
                          ${transaction.amount.toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      {transaction.amount < 0 && (
                        <span className="text-sm text-gray-900">
                          ${Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`text-sm ${
                        transaction.runningBalance > 0 ? 'text-red-600' : 
                        transaction.runningBalance < 0 ? 'text-green-600' : 
                        'text-gray-900'}`}>
                        ${Math.abs(transaction.runningBalance).toLocaleString()}
                        {transaction.runningBalance > 0 ? ' (due)' : transaction.runningBalance < 0 ? ' (credit)' : ''}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-gray-50">
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-sm text-gray-500">
                    Showing {filteredTransactions.length} of {transactions.length} transactions
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};

export default TenantLedgerReport;