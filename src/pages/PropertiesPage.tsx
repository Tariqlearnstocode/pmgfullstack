import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Home, ChevronDown, ChevronUp } from 'lucide-react';
import { useProperties } from '../hooks/useProperties';

const PropertiesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('address');
  const [sortDirection, setSortDirection] = useState('asc');
  const { properties, loading, error } = useProperties();

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const filteredProperties = useMemo(() => properties.filter(property => 
    property.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (property.tenant_name && property.tenant_name.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [properties, searchTerm]);

  const sortedProperties = useMemo(() => [...filteredProperties].sort((a, b) => {
    const fieldA = a[sortField as keyof typeof a];
    const fieldB = b[sortField as keyof typeof b];
    
    if (typeof fieldA === 'string' && typeof fieldB === 'string') {
      return sortDirection === 'asc' 
        ? fieldA.localeCompare(fieldB) 
        : fieldB.localeCompare(fieldA);
    } else if (fieldA === null || fieldB === null) {
      return fieldA === null ? 1 : -1;
    } else {
      return sortDirection === 'asc' 
        ? Number(fieldA) - Number(fieldB) 
        : Number(fieldB) - Number(fieldA);
    }
  }), [filteredProperties, sortField, sortDirection]);

  const getSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Properties</h1>
        <Link to="/properties/new" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
          <Home className="mr-2" size={18} />
          Add Property
        </Link>
      </div>

      <div className="bg-white rounded-lg shadow">
        {loading && (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading properties...</p>
          </div>
        )}
        
        {error && (
          <div className="p-8 text-center text-red-600">
            <p>Error loading properties. Please try again later.</p>
          </div>
        )}
        
        {!loading && !error && (
          <>
            <div className="p-6 border-b border-gray-200 flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0">
              <div className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search properties..."
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
                      onClick={() => handleSort('address')}
                    >
                      <div className="flex items-center">
                        Address {getSortIcon('address')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('owner_name')}
                    >
                      <div className="flex items-center">
                        Owner {getSortIcon('owner_name')}
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
                      onClick={() => handleSort('property_status')}
                    >
                      <div className="flex items-center">
                        Status {getSortIcon('property_status')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('rent_amount')}
                    >
                      <div className="flex items-center">
                        Rent {getSortIcon('rent_amount')}
                      </div>
                    </th>
                    <th 
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort('has_insurance')}
                    >
                      <div className="flex items-center">
                        Insurance {getSortIcon('has_insurance')}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {sortedProperties.map((property) => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Link to={`/properties/${property.id}`} className="text-blue-600 hover:text-blue-800 font-medium">
                          {property.address}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <Link to={`/owners/${property.owner_id}`} className="text-blue-600 hover:text-blue-800">
                          {property.owner_name}
                        </Link>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {property.tenant_name ? (
                          <Link to={`/tenants/${property.tenant_id}`} className="text-blue-600 hover:text-blue-800">
                            {property.tenant_name}
                          </Link>
                        ) : (
                          <span className="text-yellow-600">Vacant</span>
                        )}
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
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className={property.has_insurance ? 'text-green-600' : 'text-red-600'}>
                          {property.has_insurance ? 'Yes' : 'No'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200">
              <p className="text-sm text-gray-500">Showing {filteredProperties.length} of {properties.length} properties</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;