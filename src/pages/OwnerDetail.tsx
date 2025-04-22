import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { useOwnerDetail } from '../hooks/useOwnerDetail';
import { 
  User, 
  Mail, 
  Phone, 
  Building2, 
  DollarSign, 
  Edit, 
  ArrowLeft,
  Calendar
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

const OwnerDetail = () => {
  const { id } = useParams();
  const { owner, properties, transactions, loading, error } = useOwnerDetail(id || '');
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-500">Loading owner details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading owner details. Please try again later.</p>
      </div>
    );
  }

  if (!owner) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Owner not found.</p>
      </div>
    );
  }

  const monthlyGrossIncome = owner.total_rent;
  const managementFeePercentage = 10; // This should come from settings
  const monthlyNetIncome = monthlyGrossIncome * (1 - managementFeePercentage / 100);
  const annualGrossIncome = monthlyGrossIncome * 12;
  const annualNetIncome = monthlyNetIncome * 12;
  const managementFee = monthlyGrossIncome * (managementFeePercentage / 100);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/owners" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Owner Details</h1>
        </div>
        <Link to={`/owners/${id}/edit`} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Edit className="mr-2" size={18} />
          Edit Owner
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Owner Information */}
        <div className="bg-white rounded-lg shadow lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Owner Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{owner.name}</h3>
                <p className="text-sm text-gray-500">
                  Joined {format(parseISO(owner.created_at), 'MMM d, yyyy')}
                </p>
              </div>
            </div>
            
            <div className="pt-4 space-y-3">
              <div className="flex items-center">
                <Mail className="text-gray-400 mr-3" size={18} />
                <span>{owner.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="text-gray-400 mr-3" size={18} />
                <span>{owner.phone}</span>
              </div>
              <div className="flex items-center">
                <Building2 className="text-gray-400 mr-3" size={18} />
                <span>{owner.total_properties} Properties</span>
              </div>
            </div>
          </div>
        </div>

        {/* Financial Information */}
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Financial Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Total Monthly Rent</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">${monthlyGrossIncome.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Management Fee</p>
                <div className="flex items-center mt-1">
                  <span className="text-lg font-semibold">{managementFeePercentage}%</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Payout Schedule</p>
                <div className="flex items-center mt-1">
                  <Calendar className="text-gray-400 mr-2" size={18} />
                  <span>Monthly</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Next Payout Date</p>
                <div className="flex items-center mt-1">
                  <Calendar className="text-gray-400 mr-2" size={18} />
                  <span>{format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1), 'MMM d, yyyy')}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Next Payout Amount</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">${monthlyNetIncome.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Properties */}
        <div className="bg-white rounded-lg shadow lg:col-span-3">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold">Properties</h2>
            <Link to={`/properties/new?owner=${owner.id}`} className="text-blue-600 hover:text-blue-800 text-sm">
              Add Property
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Monthly Rent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tenant Balance
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {properties.map((property) => (
                  <tr key={property.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link to={`/properties/${property.id}`} className="text-blue-600 hover:text-blue-800">
                        {property.address}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        property.property_status === 'Occupied' ? 'bg-green-100 text-green-800' : 
                        property.property_status === 'Vacant' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {property.property_status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ${property.rent_amount.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {property.tenant_id ? (
                        <span className={property.current_balance > 0 ? 'text-red-600' : property.current_balance < 0 ? 'text-green-600' : 'text-gray-500'}>
                          ${Math.abs(property.current_balance).toLocaleString()}
                          {property.current_balance > 0 ? ' (due)' : property.current_balance < 0 ? ' (credit)' : ''}
                        </span>
                      ) : (
                        <span className="text-gray-400">N/A</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Transaction History */}
        <div className="bg-white rounded-lg shadow lg:col-span-3">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-semibold">Owner Payout History</h2>
              <div className="text-sm text-gray-500">
                Showing owner-related payouts and distributions
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payout Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Properties
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {transactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                      No payout transactions found
                    </td>
                  </tr>
                )}
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
                      <Link to={`/properties/${transaction.property_id}`} className="text-blue-600 hover:text-blue-800">
                        {transaction.property_address}
                      </Link>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className={transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}>
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

export default OwnerDetail;