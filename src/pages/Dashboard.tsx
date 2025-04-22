
import { Link } from 'react-router-dom';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Building2, 
  DollarSign, 
  Calendar, 
  UserPlus,
  Home,
  FileText,
  Plus,
  Minus,
  Sparkles,
  Wrench
} from 'lucide-react';
import AIAssistant from '../components/AIAssistant';
import MCPTester from '../components/MCPTester';
import { useProperties } from '../hooks/useProperties';
import { useTenants } from '../hooks/useTenants';
import { useTransactions } from '../hooks/useTransactions';
import { useMemo } from 'react';

const COLORS = ['#0088FE', '#FF8042'];

const Dashboard = () => {
  const { properties, loading: propertiesLoading } = useProperties();
  const { tenants, loading: tenantsLoading } = useTenants();
  const { transactions, loading: transactionsLoading } = useTransactions();
  
  // Calculate occupancy rate
  const occupancyData = useMemo(() => {
    if (propertiesLoading || properties.length === 0) {
      return [{ name: 'Occupied', value: 0 }, { name: 'Vacant', value: 0 }];
    }
    
    const occupied = properties.filter(p => p.tenant_id !== null).length;
    const occupiedPercentage = Math.round((occupied / properties.length) * 100);
    const vacantPercentage = 100 - occupiedPercentage;
    
    return [
      { name: 'Occupied', value: occupiedPercentage },
      { name: 'Vacant', value: vacantPercentage },
    ];
  }, [properties, propertiesLoading]);
  
  // Calculate monthly revenue
  const revenueData = useMemo(() => {
    if (transactionsLoading || transactions.length === 0) {
      return [];
    }
    
    // Group transactions by month and calculate total revenue (negative amounts are payments)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5); // Include current month
    
    // Define interface for revenue data points
    interface RevenueDataPoint {
      name: string;
      value: number;
      year: number;
    }
    
    // Define interface for monthly revenue object with string keys
    interface MonthlyRevenue {
      [key: string]: RevenueDataPoint;
    }
    
    const monthlyRevenue: MonthlyRevenue = {};
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    // Initialize all months in the last 6 months
    for (let i = 0; i < 6; i++) {
      const monthIndex = (sixMonthsAgo.getMonth() + i) % 12;
      const year = sixMonthsAgo.getFullYear() + Math.floor((sixMonthsAgo.getMonth() + i) / 12);
      const key = `${year}-${monthIndex}`;
      monthlyRevenue[key] = { name: monthNames[monthIndex], value: 0, year };
    }
    
    // Add transactions data
    transactions.forEach(transaction => {
      const date = new Date(transaction.date);
      // Only include transactions from the last 6 months
      if (date >= sixMonthsAgo) {
        const monthIndex = date.getMonth();
        const year = date.getFullYear();
        const key = `${year}-${monthIndex}`;
        
        // Only count payments (negative amounts) as revenue
        if (transaction.amount < 0) {
          if (monthlyRevenue[key]) {
            monthlyRevenue[key].value += Math.abs(transaction.amount);
          }
        }
      }
    });
    
    // Convert to array and sort chronologically
    return Object.values(monthlyRevenue)
      .sort((a: RevenueDataPoint, b: RevenueDataPoint) => {
        if (a.year !== b.year) return a.year - b.year;
        return monthNames.indexOf(a.name) - monthNames.indexOf(b.name);
      });
  }, [transactions, transactionsLoading]);
  
  // Calculate lease expirations
  const upcomingLeaseExpirations = useMemo(() => {
    if (tenantsLoading || tenants.length === 0) {
      return [];
    }
    
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    
    return tenants.filter(tenant => {
      if (!tenant.lease_end_date) return false;
      const leaseEndDate = new Date(tenant.lease_end_date);
      return leaseEndDate >= today && leaseEndDate <= thirtyDaysFromNow;
    });
  }, [tenants, tenantsLoading]);
  
  // Calculate monthly income (total of all rent amounts)
  const monthlyIncome = useMemo(() => {
    if (tenantsLoading || tenants.length === 0) {
      return 0;
    }
    
    return tenants.reduce((total, tenant) => total + (tenant.monthly_rent || 0), 0);
  }, [tenants, tenantsLoading]);
  
  // Get recent transactions for activity feed
  const recentTransactions = useMemo(() => {
    if (transactionsLoading || transactions.length === 0) {
      return [];
    }
    
    return transactions.slice(0, 5);
  }, [transactions, transactionsLoading]);
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex space-x-2">
          <Link 
            to="/tenants/new" 
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center"
          >
            <UserPlus className="mr-2" size={18} />
            Add Tenant
          </Link>
          <Link 
            to="/properties/new" 
            className="bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition-colors flex items-center"
          >
            <Home className="mr-2" size={18} />
            Add Property
          </Link>
          <Link 
            to="/transactions/new" 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="mr-2" size={18} />
            Record Charge
          </Link>
          <Link 
            to="/transactions/new" 
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center"
          >
            <Minus className="mr-2" size={18} />
            Record Payment
          </Link>
          <Link 
            to="/reports" 
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <FileText className="mr-2" size={18} />
            Reports
          </Link>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-blue-100 p-3 mr-4">
            <Building2 className="text-blue-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Occupancy Rate</p>
            <p className="text-2xl font-bold">{propertiesLoading ? '...' : `${occupancyData[0].value}%`}</p>
            <p className="text-xs text-gray-500">{propertiesLoading ? '' : `${properties.filter(p => p.tenant_id !== null).length} of ${properties.length} units`}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-green-100 p-3 mr-4">
            <DollarSign className="text-green-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Monthly Income</p>
            <p className="text-2xl font-bold">{tenantsLoading ? '...' : `$${monthlyIncome.toLocaleString()}`}</p>
            <p className="text-xs text-gray-500">{tenantsLoading ? '' : `From ${tenants.length} active tenants`}</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-yellow-100 p-3 mr-4">
            <Calendar className="text-yellow-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Lease Expirations</p>
            <p className="text-2xl font-bold">{tenantsLoading ? '...' : upcomingLeaseExpirations.length}</p>
            <p className="text-xs text-gray-500">Next 30 days</p>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6 flex items-center">
          <div className="rounded-full bg-red-100 p-3 mr-4">
            <Wrench className="text-red-600" size={24} />
          </div>
          <div>
            <p className="text-sm text-gray-500">Properties</p>
            <p className="text-2xl font-bold">{propertiesLoading ? '...' : properties.length}</p>
            <p className="text-xs text-gray-500">Total managed properties</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Occupancy Status</h2>
          <div className="h-64">
            {propertiesLoading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading data...</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={occupancyData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, value }) => `${name}: ${value}%`}
                  >
                    {occupancyData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Monthly Revenue</h2>
          <div className="h-64">
            {transactionsLoading ? (
              <div className="flex items-center justify-center h-full">
                <p>Loading data...</p>
              </div>
            ) : revenueData.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p>No revenue data available</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="value" fill="#0088FE" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* AI Assistant & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* AI Assistant */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200 flex items-center">
            <Sparkles className="text-purple-500 mr-2" size={20} />
            <h2 className="text-lg font-semibold">AI Property Assistant</h2>
          </div>
          <div className="p-6 space-y-6">
            <MCPTester />
            <div className="mt-6">
              <AIAssistant />
            </div>
          </div>
        </div>
        
        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Recent Activity</h2>
          </div>
        <div className="divide-y divide-gray-200">
          {transactionsLoading ? (
            <div className="p-6 text-center">
              <p>Loading recent activity...</p>
            </div>
          ) : recentTransactions.length === 0 ? (
            <div className="p-6 text-center">
              <p>No recent activity</p>
            </div>
          ) : (
            recentTransactions.map(transaction => {
              // Format the date
              const transactionDate = new Date(transaction.date);
              const now = new Date();
              let dateDisplay = '';
              
              if (transactionDate.toDateString() === now.toDateString()) {
                dateDisplay = 'Today';
              } else if (transactionDate.toDateString() === new Date(now.setDate(now.getDate() - 1)).toDateString()) {
                dateDisplay = 'Yesterday';
              } else {
                dateDisplay = transactionDate.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
              }
              
              // Determine icon based on transaction type
              let Icon = DollarSign;
              let bgColor = 'bg-blue-100';
              let textColor = 'text-blue-600';
              
              if (transaction.category === 'Payment') {
                Icon = Minus;
                bgColor = 'bg-green-100';
                textColor = 'text-green-600';
              } else if (transaction.category === 'Charge') {
                Icon = Plus;
                bgColor = 'bg-red-100';
                textColor = 'text-red-600';
              }
              
              return (
                <div key={transaction.id} className="p-6 flex items-start">
                  <div className={`rounded-full ${bgColor} p-2 mr-4`}>
                    <Icon className={textColor} size={20} />
                  </div>
                  <div>
                    <p className="font-medium">{transaction.type_display_name}</p>
                    <p className="text-sm text-gray-500">
                      {transaction.tenant_name ? `${transaction.tenant_name} - ` : ''}
                      {transaction.property_address} - 
                      ${Math.abs(transaction.amount).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">{dateDisplay}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      </div>
    </div>
  );
};

export default Dashboard;