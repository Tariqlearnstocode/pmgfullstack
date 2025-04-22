import React, { useState } from 'react';
import { 
  FileText, 
  Users,
  Building2,
  DollarSign,
  Search,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';

interface ReportCardProps {
  title: string;
  description: string;
  icon: React.ReactNode;
  to: string;
}

const ReportCard: React.FC<ReportCardProps> = ({ title, description, icon, to }) => (
  <Link 
    to={to}
    className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
  >
    <div className="flex items-start">
      <div className="rounded-full bg-blue-100 p-3 mr-4">
        {icon}
      </div>
      <div className="flex-1">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 text-sm mb-4">{description}</p>
        <div className="flex items-center text-blue-600 text-sm font-medium">
          Generate Report
          <ArrowRight size={16} className="ml-1" />
        </div>
      </div>
    </div>
  </Link>
);

const ReportsPage = () => {
  const [searchTerm, setSearchTerm] = useState('');

  // Note: This function is preserved for future use with dynamic report types
  // But is currently not being used in the component

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <div className="flex space-x-2">
          <div className="relative">
            <input
              type="text"
              placeholder="Search reports..."
              className="w-64 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          <Link to="/reports/custom" className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center">
            <FileText className="mr-2" size={18} />
            Custom Report
          </Link>
        </div>
      </div>

      {/* Main Reports Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ReportCard
          title="Tenant Ledger"
          description="View detailed transaction history and running balances for tenants, including rent payments, charges, and fees."
          icon={<Users className="text-blue-600" size={24} />}
          to="/reports/tenant-ledger/"
        />
        
        <ReportCard
          title="Owner Statement"
          description="Generate comprehensive financial statements for property owners, including income, expenses, and distributions."
          icon={<FileText className="text-green-600" size={24} />}
          to="/reports/owner-statement-summary"
        />
        
        <ReportCard
          title="Owner Statement Detail"
          description="View detailed transaction history and running balances for owners, including all income and expenses."
          icon={<DollarSign className="text-green-600" size={24} />}
          to="/reports/owner-statement"
        />
        
        <ReportCard
          title="Vacancy Report"
          description="Track vacant units, upcoming vacancies, and occupancy rates across your property portfolio."
          icon={<Building2 className="text-orange-600" size={24} />}
          to="/reports/vacancy"
        />
        
        <ReportCard
          title="Property Directory"
          description="Access a complete listing of all properties with key details, tenant information, and financial metrics."
          icon={<FileText className="text-purple-600" size={24} />}
          to="/reports/property-directory"
        />
      </div>
    </div>
  );
};


export default ReportsPage