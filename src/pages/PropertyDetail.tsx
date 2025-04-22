import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { usePropertyDetail } from '../hooks/usePropertyDetail';
import { 
  Building2, 
  User, 
  Users, 
  Calendar, 
  DollarSign, 
  FileText, 
  Edit, 
  ArrowLeft,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const PropertyDetail = () => {
  const { id } = useParams();
  const { property, transactions, loading, error } = usePropertyDetail(id || '');
  
  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-500">Loading property details...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading property details. Please try again later.</p>
      </div>
    );
  }

  // Not found state
  if (!property) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Property not found.</p>
      </div>
    );
  }

  // Only calculate financial metrics if we have a property
  // Calculate financial metrics
  const monthlyNetIncome = property.rent_amount * (1 - property.mgmt_fee_percentage / 100);
  const annualGrossIncome = property.rent_amount * 12;
  const annualNetIncome = monthlyNetIncome * 12;
  const managementFee = property.rent_amount * (property.mgmt_fee_percentage / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/properties" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Property Details</h1>
        </div>
        <Link to={`/properties/${property.id}/edit`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Edit className="mr-2" size={18} />
          Edit Property
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Property Information */}
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Property Information</h2>
          </div>
          <div className="p-6">
            <div className="flex items-center mb-6">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                <Building2 size={32} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{property.address}</h3>
                <p className="text-sm text-gray-500">{property.city} {property.zip}</p>
                <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  property.property_status === 'Occupied' ? 'bg-green-100 text-green-800' : 
                  property.property_status === 'Vacant' ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {property.property_status}
                </span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Owner</p>
                <div className="flex items-center mt-1">
                  <User className="text-gray-400 mr-2" size={18} />
                  <Link to={`/owners/${property.owner_id}`} className="text-blue-600 hover:text-blue-800">
                    {property.owners?.name || 'Unknown Owner'}
                  </Link>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Tenant</p>
                <div className="flex items-center mt-1">
                  <Users className="text-gray-400 mr-2" size={18} />
                  {property.tenant_id ? (
                    <Link to={`/tenants/${property.tenant_id}`} className="text-blue-600 hover:text-blue-800">
                      {property.tenant_name}
                    </Link>
                  ) : (
                    <span className="text-yellow-600">Vacant</span>
                  )}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">${property.rent_amount.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Late Fee</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span>${property.late_fee_amount.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Management Fee</p>
                <div className="flex items-center mt-1">
                  <span>{property.mgmt_fee_percentage}%</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Insurance</p>
                <div className="flex items-center mt-1">
                  {property.has_insurance ? (
                    <CheckCircle className="text-green-500 mr-2" size={18} />
                  ) : (
                    <XCircle className="text-red-500 mr-2" size={18} />
                  )}
                  <span>{property.has_insurance ? 'Yes' : 'No'}</span>
                </div>
              </div>
            </div>
            
            <div className="mt-6">
              <p className="text-sm text-gray-500 mb-2">Notes</p>
              <div className="p-3 bg-gray-50 rounded-lg">
                <p>{property.notes}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="bg-white rounded-lg shadow lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Financial Summary</h2>
          </div>
          <div className="p-6 space-y-6">
            <div>
              <p className="text-sm text-gray-500">Monthly Gross Income</p>
              <div className="flex items-center mt-1">
                <DollarSign className="text-gray-400 mr-2" size={18} />
                <span className="text-lg font-semibold">${property.rent_amount.toLocaleString()}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Monthly Management Fee</p>
              <div className="flex items-center mt-1">
                <DollarSign className="text-gray-400 mr-2" size={18} />
                <span className="text-lg font-semibold">${managementFee.toLocaleString()}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Monthly Net Income (Owner)</p>
              <div className="flex items-center mt-1">
                <DollarSign className="text-gray-400 mr-2" size={18} />
                <span className="text-lg font-semibold">${monthlyNetIncome.toLocaleString()}</span>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Annual Gross Income</p>
              <div className="flex items-center mt-1">
                <DollarSign className="text-gray-400 mr-2" size={18} />
                <span className="text-lg font-semibold">${annualGrossIncome.toLocaleString()}</span>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Annual Net Income (Owner)</p>
              <div className="flex items-center mt-1">
                <DollarSign className="text-gray-400 mr-2" size={18} />
                <span className="text-lg font-semibold">${annualNetIncome.toLocaleString()}</span>
              </div>
            </div>
            
            {property.tenant_id && (
              <div className="pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500">Current Tenant Balance</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className={`text-lg font-semibold ${property.tenant_balance && property.tenant_balance > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                    ${Math.abs(property.tenant_balance || 0).toLocaleString()}
                    {property.tenant_balance && property.tenant_balance > 0 ? ' (due)' : property.tenant_balance && property.tenant_balance < 0 ? ' (credit)' : ''}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow lg:col-span-3">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Transaction History</h2>
            <Link to={`/transactions/new?property=${property.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
              Record New Transaction
            </Link>
          </div>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.map((transaction) => (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(parseISO(transaction.date), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/transactions/${transaction.id}`} className="text-blue-600 hover:text-blue-800">
                        {transaction.type_display_name}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {transaction.tenant_name ? (
                        <Link to={`/tenants/${transaction.tenant_id}`} className="text-blue-600 hover:text-blue-800">
                          {transaction.tenant_name}
                        </Link>
                      ) : (
                        '-'
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`text-sm ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        ${Math.abs(transaction.amount).toLocaleString()}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;