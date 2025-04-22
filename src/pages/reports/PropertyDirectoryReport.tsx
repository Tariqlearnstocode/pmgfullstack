import { useState, useMemo } from 'react';
import Select from 'react-select';
import { Link } from 'react-router-dom';
import { 
  ArrowLeft, 
  Filter, 
  Download, 
  Printer,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { useProperties } from '../../hooks/useProperties';

const PropertyDirectoryReport = () => {
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    hasInsurance: null as boolean | null,
    hasVacancy: null as boolean | null,
    ownerId: '' as string,
    minRent: '',
    maxRent: ''
  });
  const { properties, loading, error } = useProperties();

  const filteredProperties = useMemo(() => {
    return properties.filter(property => {
      // Insurance filter
      const insuranceMatch = filters.hasInsurance === null || 
        property.has_insurance === filters.hasInsurance;

      // Vacancy filter
      const vacancyMatch = filters.hasVacancy === null ||
        (filters.hasVacancy ? !property.tenant_id : property.tenant_id);
        
      // Owner filter
      const ownerMatch = !filters.ownerId || property.owner_id === filters.ownerId;

      // Rent range filter
      const rentMatch = (!filters.minRent || property.rent_amount >= parseFloat(filters.minRent)) &&
        (!filters.maxRent || property.rent_amount <= parseFloat(filters.maxRent));

      return insuranceMatch && vacancyMatch && ownerMatch && rentMatch;
    });
  }, [properties, filters]);

  // Get unique owners for the filter dropdown
  const owners = useMemo(() => {
    const uniqueOwners = new Map();
    properties.forEach(property => {
      // Use type assertion to access the owners property
      const propertyWithOwners = property as any;
      if (property.owner_id && propertyWithOwners.owners?.name) {
        uniqueOwners.set(property.owner_id, propertyWithOwners.owners);
      }
    });
    return Array.from(uniqueOwners.values()).map(owner => ({
      value: owner.id,
      label: owner.name
    }));
  }, [properties]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-500">Loading property directory...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading property directory. Please try again later.</p>
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
          <h1 className="text-2xl font-bold text-gray-800">Property Directory</h1>
        </div>
        <div className="flex space-x-2">
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center shadow-sm">
            <Printer className="mr-2" size={18} />
            Print
          </button>
          <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm">
            <Download className="mr-2" size={18} />
            Download
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
          <Select
            className="flex-1 max-w-lg"
            placeholder="Search by owner..."
            isClearable
            options={owners}
            value={owners.find(owner => owner.value === filters.ownerId) || null}
            onChange={(selected) => setFilters(prev => ({
              ...prev,
              ownerId: selected?.value || ''
            }))}
          />

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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.hasInsurance === null ? '' : filters.hasInsurance.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    hasInsurance: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                >
                  <option value="">All</option>
                  <option value="true">Has Insurance</option>
                  <option value="false">No Insurance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Occupancy Status
                </label>
                <select
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.hasVacancy === null ? '' : filters.hasVacancy.toString()}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    hasVacancy: e.target.value === '' ? null : e.target.value === 'true'
                  }))}
                >
                  <option value="">All</option>
                  <option value="true">Vacant</option>
                  <option value="false">Occupied</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Rent
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.minRent}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    minRent: e.target.value
                  }))}
                  placeholder="Min rent amount"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Rent
                </label>
                <input
                  type="number"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filters.maxRent}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    maxRent: e.target.value
                  }))}
                  placeholder="Max rent amount"
                />
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                onClick={() => setFilters({
                  hasInsurance: null,
                  hasVacancy: null,
                  ownerId: '',
                  minRent: '',
                  maxRent: ''
                })}
              >
                <XCircle size={16} className="mr-1" />
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Property
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Zip
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Owner
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Owner Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Tenant
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Insurance
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Mgmt Fee %
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Rent
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider whitespace-nowrap">
                  Balance
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredProperties.map((property) => (
                <tr key={property.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <Link to={`/properties/${property.id}`} className="text-blue-600 hover:text-blue-800">
                      {property.address}
                    </Link>
                    <div className="text-sm text-gray-500">{property.city}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {property.zip}
                  </td>
                  <td className="px-6 py-4">
                    <Link to={`/owners/${property.owner_id}`} className="text-blue-600 hover:text-blue-800">
                      {(property as any).owners?.name}
                    </Link>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {(property as any).owners?.email}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      (property as any).property_status === 'Occupied' ? 'bg-green-100 text-green-800' : 
                      (property as any).property_status === 'Vacant' ? 'bg-yellow-100 text-yellow-800' : 
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {(property as any).property_status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {property.tenant_name ? (
                      <Link to={`/tenants/${property.tenant_id}`} className="text-blue-600 hover:text-blue-800">
                        {property.tenant_name}
                      </Link>
                    ) : (
                      <span className="text-gray-500">Vacant</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {property.has_insurance ? (
                      <span className="text-green-600">
                        <CheckCircle size={18} className="inline" />
                      </span>
                    ) : (
                      <span className="text-red-600">
                        <XCircle size={18} className="inline" />
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right whitespace-nowrap">
                    {property.mgmt_fee_percentage}%
                  </td>
                  <td className="px-6 py-4 text-right">
                    ${property.rent_amount.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={(property as any).current_balance > 0 ? 'text-red-600' : (property as any).current_balance < 0 ? 'text-green-600' : ''}>
                      ${Math.abs((property as any).current_balance || 0).toLocaleString()}
                      {(property as any).current_balance > 0 ? ' (due)' : (property as any).current_balance < 0 ? ' (credit)' : ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={10} className="px-6 py-4 text-sm text-gray-500">
                  Showing {filteredProperties.length} of {properties.length} properties
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PropertyDirectoryReport;