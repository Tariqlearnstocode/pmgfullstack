import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTransactionDetail } from '../hooks/useTransactionDetail';
import { 
  DollarSign, 
  Calendar, 
  Home, 
  User, 
  FileText, 
  Edit, 
  ArrowLeft,
  Printer,
  Download,
  Clock,
  Hash,
  Tag,
  CheckCircle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const TransactionDetail = () => {
  const { id } = useParams();
  const { transaction, loading, error } = useTransactionDetail(id || '');
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-500">Loading transaction details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading transaction details. Please try again later.</p>
      </div>
    );
  }

  // Not found state
  if (!transaction) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Transaction not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/transactions" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Transaction Details</h1>
        </div>
        <div className="flex space-x-2">
          <Link to={`/transactions/${transaction.id}/edit`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <Edit className="mr-2" size={18} />
            Edit
          </Link>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
            <Printer className="mr-2" size={18} />
            Print
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center">
            <Download className="mr-2" size={18} />
            Download
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Transaction Information */}
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Transaction Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Transaction Type</p>
                <div className="flex items-center mt-1">
                  <Tag className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">{transaction.type_display_name}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <div className="flex items-center mt-1">
                  <Calendar className="text-gray-400 mr-2" size={18} />
                  <span>{format(new Date(`${transaction.date}T00:00:00`), 'MMMM d, yyyy')}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Amount</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className={`text-lg font-semibold ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                    ${Math.abs(transaction.amount).toLocaleString()}
                  </span>
                  {transaction.tenant_id && (
                    <div className="mt-1 text-sm text-gray-500">
                      Balance after transaction: ${transaction.running_balance.toLocaleString()}
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Category</p>
                <div className="flex items-center mt-1">
                  <span className={`px-2 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${
                    transaction.category === 'Income' ? 'bg-green-100 text-green-800' : 
                    transaction.category === 'Expense' ? 'bg-red-100 text-red-800' : 
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {transaction.category}
                  </span>
                </div>
              </div>
              
              {transaction.unit_reference && (
                <div>
                  <p className="text-sm text-gray-500">Reference</p>
                  <div className="flex items-center mt-1">
                    <Hash className="text-gray-400 mr-2" size={18} />
                    <span>{transaction.unit_reference}</span>
                  </div>
                </div>
              )}
              
              {transaction.invoice_number && (
                <div>
                  <p className="text-sm text-gray-500">Invoice Number</p>
                  <div className="flex items-center mt-1">
                    <FileText className="text-gray-400 mr-2" size={18} />
                    <span>{transaction.invoice_number}</span>
                  </div>
                </div>
              )}
              
              <div>
                <p className="text-sm text-gray-500">Created</p>
                <div className="flex items-center mt-1">
                  <Clock className="text-gray-400 mr-2" size={18} />
                  <span>{format(parseISO(transaction.created_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Manual Edit</p>
                <div className="flex items-center mt-1">
                  {transaction.is_manual_edit ? (
                    <CheckCircle className="text-green-500 mr-2" size={18} />
                  ) : (
                    <CheckCircle className="text-gray-400 mr-2" size={18} />
                  )}
                  <span>{transaction.is_manual_edit ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Related Information */}
        <div className="bg-white rounded-lg shadow lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Related Information</h2>
          </div>
          <div className="p-6 space-y-6">
            {transaction.tenant_id && (
              <div>
                <p className="text-sm text-gray-500 mb-2">Tenant</p>
                <div className="flex items-start">
                  <div className="rounded-full bg-blue-100 p-2 mr-3">
                    <User className="text-blue-600" size={20} />
                  </div>
                  <div>
                    <Link to={`/tenants/${transaction.tenant_id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                      {transaction.tenant_name}
                    </Link>
                    <p className="text-sm text-gray-500">{transaction.tenant_email}</p>
                    <p className="text-sm mt-1">
                      <span className={transaction.running_balance > 0 ? 'text-red-600' : transaction.running_balance < 0 ? 'text-green-600' : 'text-gray-500'}>
                        Current Balance: ${transaction.running_balance.toLocaleString()}
                        {transaction.running_balance > 0 ? ' (due)' : transaction.running_balance < 0 ? ' (credit)' : ''}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Property</p>
              <div className="flex items-start">
                <div className="rounded-full bg-green-100 p-2 mr-3">
                  <Home className="text-green-600" size={20} />
                </div>
                <div>
                  <Link to={`/properties/${transaction.property_id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                    {transaction.property_address}
                  </Link>
                  <p className="text-sm text-gray-500">{transaction.property_city}, {transaction.property_zip}</p>
                </div>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500 mb-2">Owner</p>
              <div className="flex items-start">
                <div className="rounded-full bg-purple-100 p-2 mr-3">
                  <User className="text-purple-600" size={20} />
                </div>
                <div>
                  <span className="font-medium">{transaction.owner_name}</span>
                  <p className="text-sm text-gray-500">{transaction.owner_email}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionDetail;