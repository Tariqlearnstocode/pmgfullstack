import React, { useState, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ArrowLeft, User, Home } from 'lucide-react';
import { useTenants } from '../../hooks/useTenants';
import { useProperties } from '../../hooks/useProperties';

const TenantLedgerSearch = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [searchType, setSearchType] = useState<'tenant' | 'property'>('tenant');
  const { tenants, loading: tenantsLoading } = useTenants();
  const { properties, loading: propertiesLoading } = useProperties();

  const filteredResults = useMemo(() => {
    const term = searchTerm.toLowerCase();
    
    if (searchType === 'tenant') {
      return tenants.filter(tenant => 
        tenant.name.toLowerCase().includes(term) ||
        tenant.email.toLowerCase().includes(term) ||
        tenant.property_address.toLowerCase().includes(term)
      );
    } else {
      return properties.filter(property =>
        property.address.toLowerCase().includes(term) ||
        property.city.toLowerCase().includes(term) ||
        (property.tenant_name && property.tenant_name.toLowerCase().includes(term))
      );
    }
  }, [searchTerm, searchType, tenants, properties]);

  const handleSelect = (id: string) => {
    if (searchType === 'tenant') {
      navigate(`/reports/tenant-ledger/${id}`);
    } else {
      // Find tenant ID for the selected property
      const property = properties.find(p => p.id === id);
      if (property?.tenant_id) {
        navigate(`/reports/tenant-ledger/${property.tenant_id}`);
      }
    }
  };

  const loading = tenantsLoading || propertiesLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/reports" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Tenant Ledger Search</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <input
                  type="text"
                  placeholder={`Search by ${searchType === 'tenant' ? 'tenant name, email, or address' : 'property address or tenant name'}...`}
                  className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              </div>
            </div>
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  searchType === 'tenant' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSearchType('tenant')}
              >
                <User className="inline-block mr-2" size={18} />
                Search Tenants
              </button>
              <button
                className={`px-4 py-2 rounded-lg transition-colors ${
                  searchType === 'property' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                onClick={() => setSearchType('property')}
              >
                <Home className="inline-block mr-2" size={18} />
                Search Properties
              </button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading...</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredResults.length === 0 ? (
              <div className="p-6 text-center text-gray-500">
                No results found. Try adjusting your search terms.
              </div>
            ) : (
              filteredResults.map(result => (
                <div
                  key={result.id}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => handleSelect(result.id)}
                >
                  {searchType === 'tenant' ? (
                    <div className="flex items-start">
                      <div className="rounded-full bg-blue-100 p-2 mr-3">
                        <User className="text-blue-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{(result as any).name}</h3>
                        <p className="text-sm text-gray-500">{(result as any).email}</p>
                        <p className="text-sm text-gray-500">{(result as any).property_address}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start">
                      <div className="rounded-full bg-green-100 p-2 mr-3">
                        <Home className="text-green-600" size={20} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">{(result as any).address}</h3>
                        <p className="text-sm text-gray-500">
                          {(result as any).tenant_name || 'Vacant'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {(result as any).city}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default TenantLedgerSearch;