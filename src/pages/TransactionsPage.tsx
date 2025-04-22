import { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ChevronDown, ChevronUp, Plus, Minus, Upload, BarChart } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useTransactions } from '../hooks/useTransactions';

const TransactionsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const { transactions, loading, error } = useTransactions();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const filteredTransactions = useMemo(() => transactions.filter(transaction => 
    (transaction.tenant_name && transaction.tenant_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
    transaction.property_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.type_display_name.toLowerCase().includes(searchTerm.toLowerCase())
  ), [transactions, searchTerm]);

  const sortedTransactions = useMemo(() => [...filteredTransactions].sort((a, b) => {
    const fieldA = a[sortField as keyof typeof a];
    const fieldB = b[sortField as keyof typeof b];
    
    if (sortField === 'date') {
      return sortDirection === 'asc' 
        ? parseISO(a.date).getTime() - parseISO(b.date).getTime()
        : parseISO(b.date).getTime() - parseISO(a.date).getTime();
    } else if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB) 
        : fieldB.localeCompare(fieldA);
    } else {
      return sortDirection === 'asc' 
        ? Number(fieldA) - Number(fieldB) 
        : Number(fieldB) - Number(fieldA);
    }
  }), [filteredTransactions, sortField, sortDirection]);

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Transactions</h1>
        <div className="flex space-x-2">
          <Link 
            to="/transactions/import" 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <Upload className="mr-2" size={18} />
            Import Transactions
          </Link>
          <Link 
            to="/reports" 
            className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700 transition-colors flex items-center"
          >
            <BarChart className="mr-2" size={18} />
            Custom Reports
          </Link>
          <Link 
            to="/transactions/new?mode=charge" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="mr-2" size={18} />
            Record Charge
          </Link>
          <Link 
            to="/transactions/new?mode=payment" 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Minus className="mr-2" size={18} />
            Record Payment
          </Link>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading transactions...</p>
          </div>
        )}
        
        {error && (
          <div className="p-8 text-center text-red-600">
            <p>Error loading transactions. Please try again later.</p>
          </div>
        )}
        
        {!loading && !error && (
          <>
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
              <div className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search transactions..."
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
              
              <button className="flex items-center px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50">
                <Filter className="mr-2" size={18} />
                Filter
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('date')}
                    >
                      <div className="flex items-center">
                        Date {getSortIcon('date')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('type_display_name')}
                    >
                      <div className="flex items-center">
                        Transaction {getSortIcon('type_display_name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('tenant_name')}
                    >
                      <div className="flex items-center">
                        Tenant {getSortIcon('tenant_name')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('property_address')}
                    >
                      <div className="flex items-center">
                        Property {getSortIcon('property_address')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('amount')}
                    >
                      <div className="flex items-center">
                        Amount {getSortIcon('amount')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('category')}
                    >
                      <div className="flex items-center">
                        Category {getSortIcon('category')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedTransactions.map((transaction) => (
                    <tr key={transaction.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {format(parseISO(transaction.date), 'MMM d, yyyy')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/transactions/${transaction.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {transaction.type_display_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {transaction.tenant_name ? (
                          <Link to={`/tenants/${transaction.tenant_id}`} className="text-blue-600 hover:text-blue-800">
                            {transaction.tenant_name}
                          </Link>
                        ) : (
                          <span>-</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link to={`/properties/${transaction.property_id}`} className="text-blue-600 hover:text-blue-800">
                          {transaction.property_address}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`text-sm ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                          ${Math.abs(transaction.amount).toLocaleString()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          transaction.category === 'Income' ? 'bg-green-100 text-green-800' : 
                          transaction.category === 'Expense' ? 'bg-red-100 text-red-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {transaction.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Showing {filteredTransactions.length} of {transactions.length} transactions</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default TransactionsPage;