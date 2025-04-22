import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, Download, Filter, Calendar, XCircle } from 'lucide-react';
import { useApi } from '../../hooks/useApi';
import { Database } from '../../types/supabase';

type Property = Database['public']['Tables']['properties']['Row'];
type Tenant = Database['public']['Tables']['tenants']['Row'];
type Owner = Database['public']['Tables']['owners']['Row'];

// Define interface for filterBy to allow undefined values
interface FilterOptions {
  property_id?: string;
  tenant_id?: string;
  type_id?: string;
}

const CustomReportPage: React.FC = () => {
  const [reportType, setReportType] = useState<string>('transactions');
  const [dateRange, setDateRange] = useState<{ from: string; to: string }>({
    from: new Date(new Date().setMonth(new Date().getMonth() - 1)).toISOString().split('T')[0],
    to: new Date().toISOString().split('T')[0]
  });
  const [groupBy, setGroupBy] = useState<string>('none');
  const [filterBy, setFilterBy] = useState<FilterOptions>({});
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [reportGenerated, setReportGenerated] = useState<boolean>(false);
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  const { transactionService, propertyService, tenantService, ownerService } = useApi();

  // Load filter options
  const [properties, setProperties] = useState<Property[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  // Owner data available for future enhancements
  const [, setOwners] = useState<Owner[]>([]);

  useEffect(() => {
    const loadFilterData = async () => {
      const propertiesData = await propertyService.getAll();
      const tenantsData = await tenantService.getAll();
      const ownersData = await ownerService.getAll();
      
      setProperties(propertiesData || []);
      setTenants(tenantsData || []);
      setOwners(ownersData || []);
    };
    
    loadFilterData();
  }, [propertyService, tenantService, ownerService]);

  const generateReport = async () => {
    setLoading(true);
    
    try {
      let data: any[] = [];
      
      if (reportType === 'transactions') {
        // Get all transactions with detailed information instead of basic data
        const transactions = await transactionService.getAllTransactionDetails();
        
        if (transactions) {
          // Filter by date range
          data = transactions.filter((t: any) => {
            const transactionDate = new Date(t.date);
            const fromDate = new Date(dateRange.from);
            const toDate = new Date(dateRange.to);
            
            return transactionDate >= fromDate && transactionDate <= toDate;
          });
          
          // Apply additional filters
          if (filterBy.property_id) {
            data = data.filter(t => t.property_id === filterBy.property_id);
          }
          
          if (filterBy.tenant_id) {
            data = data.filter(t => t.tenant_id === filterBy.tenant_id);
          }
          
          if (filterBy.type_id) {
            data = data.filter(t => t.type_id === filterBy.type_id);
          }
          
          // Group data if needed
          if (groupBy === 'property') {
            const grouped: Record<string, any> = {};
            
            data.forEach(transaction => {
              const propertyId = transaction.property_id || 'unknown';
              if (!grouped[propertyId]) {
                grouped[propertyId] = {
                  property_id: propertyId,
                  property_address: transaction.property?.address || 'Unknown Property',
                  total: 0,
                  transactions: []
                };
              }
              
              grouped[propertyId].total += transaction.amount || 0;
              grouped[propertyId].transactions.push(transaction);
            });
            
            data = Object.values(grouped);
          } else if (groupBy === 'tenant') {
            const grouped: Record<string, any> = {};
            
            data.forEach(transaction => {
              const tenantId = transaction.tenant_id || 'unknown';
              if (!grouped[tenantId]) {
                grouped[tenantId] = {
                  tenant_id: tenantId,
                  tenant_name: transaction.tenant?.name || 'Unknown Tenant',
                  total: 0,
                  transactions: []
                };
              }
              
              grouped[tenantId].total += transaction.amount || 0;
              grouped[tenantId].transactions.push(transaction);
            });
            
            data = Object.values(grouped);
          } else if (groupBy === 'type') {
            const grouped: Record<string, any> = {};
            
            data.forEach(transaction => {
              const typeId = transaction.type_id || 'unknown';
              if (!grouped[typeId]) {
                grouped[typeId] = {
                  type_id: typeId,
                  type_name: transaction.transaction_type?.display_name || 'Unknown Type',
                  total: 0,
                  transactions: []
                };
              }
              
              grouped[typeId].total += transaction.amount || 0;
              grouped[typeId].transactions.push(transaction);
            });
            
            data = Object.values(grouped);
          } else if (groupBy === 'month') {
            const grouped: Record<string, any> = {};
            
            data.forEach(transaction => {
              const date = new Date(transaction.date);
              const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
              
              if (!grouped[monthYear]) {
                grouped[monthYear] = {
                  month_year: monthYear,
                  display_name: new Date(date.getFullYear(), date.getMonth(), 1)
                    .toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
                  total: 0,
                  transactions: []
                };
              }
              
              grouped[monthYear].total += transaction.amount || 0;
              grouped[monthYear].transactions.push(transaction);
            });
            
            data = Object.values(grouped).sort((a, b) => a.month_year.localeCompare(b.month_year));
          }
        }
      }
      
      setReportData(data);
      setReportGenerated(true);
    } catch (error) {
      console.error("Error generating report:", error);
    } finally {
      setLoading(false);
    }
  };

  const downloadCsv = () => {
    if (!reportData.length) return;
    
    let csvContent = "";
    
    // Generate headers based on report type and grouping
    if (reportType === 'transactions') {
      if (groupBy === 'none') {
        csvContent = "Date,Property,Tenant,Type,Amount,Notes\n";
        
        reportData.forEach(transaction => {
          const row = [
            transaction.date,
            transaction.property?.address || '',
            transaction.tenant?.name || '',
            transaction.transaction_type?.display_name || '',
            transaction.amount || 0,
            transaction.notes || ''
          ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
          
          csvContent += row + "\n";
        });
      } else {
        // Grouped report headers
        if (groupBy === 'property') {
          csvContent = "Property,Total Amount,Transaction Count\n";
          
          reportData.forEach(group => {
            const row = [
              group.property_address || 'Unknown',
              group.total || 0,
              group.transactions.length
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
            
            csvContent += row + "\n";
          });
        } else if (groupBy === 'tenant') {
          csvContent = "Tenant,Total Amount,Transaction Count\n";
          
          reportData.forEach(group => {
            const row = [
              group.tenant_name || 'Unknown',
              group.total || 0,
              group.transactions.length
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
            
            csvContent += row + "\n";
          });
        } else if (groupBy === 'type') {
          csvContent = "Transaction Type,Total Amount,Transaction Count\n";
          
          reportData.forEach(group => {
            const row = [
              group.type_name || 'Unknown',
              group.total || 0,
              group.transactions.length
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
            
            csvContent += row + "\n";
          });
        } else if (groupBy === 'month') {
          csvContent = "Month,Total Amount,Transaction Count\n";
          
          reportData.forEach(group => {
            const row = [
              group.display_name || 'Unknown',
              group.total || 0,
              group.transactions.length
            ].map(field => `"${String(field).replace(/"/g, '""')}"`).join(',');
            
            csvContent += row + "\n";
          });
        }
      }
    }
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.setAttribute('href', url);
    link.setAttribute('download', `custom-report-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link 
            to="/reports" 
            className="rounded-full p-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={20} className="text-gray-600" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Custom Report</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-5">Report Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Report Type</label>
            <select 
              className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
            >
              <option value="transactions">Transactions</option>
              <option value="tenants" disabled>Tenants</option>
              <option value="properties" disabled>Properties</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Group By</label>
            <select 
              className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value)}
            >
              <option value="none">None (List All)</option>
              <option value="property">Property</option>
              <option value="tenant">Tenant</option>
              <option value="type">Transaction Type</option>
              <option value="month">Month</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
            <div className="flex space-x-2">
              <input 
                type="date"
                className="flex-1 border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateRange.from}
                onChange={(e) => setDateRange({...dateRange, from: e.target.value})}
              />
              <span className="flex items-center text-gray-500">to</span>
              <input 
                type="date"
                className="flex-1 border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                value={dateRange.to}
                onChange={(e) => setDateRange({...dateRange, to: e.target.value})}
              />
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <div 
            className="flex items-center space-x-2 cursor-pointer mb-3 text-blue-600 hover:text-blue-800 transition-colors"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={18} />
            <span className="text-sm font-medium">{showFilters ? 'Hide Filters' : 'Show Filters'}</span>
          </div>
          
          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="col-span-1 md:col-span-2 flex justify-end mb-2">
                <button 
                  onClick={() => setFilterBy({})}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                >
                  <XCircle size={16} className="mr-1" />
                  Clear Filters
                </button>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Property</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterBy.property_id || ''}
                  onChange={(e) => setFilterBy({...filterBy, property_id: e.target.value ? e.target.value : undefined})}
                >
                  <option value="">All Properties</option>
                  {properties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.address}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tenant</label>
                <select 
                  className="w-full border border-gray-300 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={filterBy.tenant_id || ''}
                  onChange={(e) => setFilterBy({...filterBy, tenant_id: e.target.value ? e.target.value : undefined})}
                >
                  <option value="">All Tenants</option>
                  {tenants.map((tenant) => (
                    <option key={tenant.id} value={tenant.id}>
                      {tenant.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
        
        <div className="flex justify-end mt-6">
          <button
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center shadow-sm"
            onClick={generateReport}
            disabled={loading}
          >
            {loading ? (
              <>
                <div className="mr-2 animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                Generating...
              </>
            ) : (
              <>
                <Calendar className="mr-2" size={18} />
                Generate Report
              </>
            )}
          </button>
        </div>
      </div>

      {reportGenerated && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="p-6 border-b border-gray-200 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-800">Report Results</h2>
            <button
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center shadow-sm"
              onClick={downloadCsv}
              disabled={!reportData.length}
            >
              <Download className="mr-2" size={18} />
              Download CSV
            </button>
          </div>
          
          <div className="overflow-x-auto">
            {reportData.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No data found for the selected criteria.
              </div>
            ) : (
              <>
                {reportType === 'transactions' && (
                  <>
                    {groupBy === 'none' && (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Date
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Property
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tenant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Amount
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.map((transaction) => (
                            <tr key={transaction.id} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(transaction.date).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {transaction.property?.address || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {transaction.tenant?.name || '-'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {transaction.transaction_type?.display_name || 'Unknown'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm ${transaction.amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ${Math.abs(transaction.amount || 0).toLocaleString()}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    
                    {groupBy === 'property' && (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Property
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.map((group, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {group.property_address || 'Unknown Property'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${group.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ${Math.abs(group.total || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {group.transactions.length}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    
                    {groupBy === 'tenant' && (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Tenant
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.map((group, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {group.tenant_name || 'Unknown Tenant'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${group.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ${Math.abs(group.total || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {group.transactions.length}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    
                    {groupBy === 'type' && (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction Type
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.map((group, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {group.type_name || 'Unknown Type'}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${group.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ${Math.abs(group.total || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {group.transactions.length}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                    
                    {groupBy === 'month' && (
                      <table className="w-full">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Month
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Total Amount
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Transaction Count
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {reportData.map((group, index) => (
                            <tr key={index} className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                {group.display_name}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className={`text-sm font-medium ${group.total < 0 ? 'text-red-600' : 'text-green-600'}`}>
                                  ${Math.abs(group.total || 0).toLocaleString()}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {group.transactions.length}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomReportPage;
