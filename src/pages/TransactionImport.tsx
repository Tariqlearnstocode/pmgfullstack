import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Download } from 'lucide-react';
import TransactionImporter from '../components/transactions/TransactionImporter';

const TransactionImport: React.FC = () => {
  const navigate = useNavigate();

  // Handler for when import is complete
  const handleImportComplete = () => {
    navigate('/transactions');
  };

  // Function to generate and download a CSV template
  const downloadTemplate = (mode: 'tenant' | 'owner') => {
    // Create sample data based on mode
    let csvContent = '';
    
    if (mode === 'tenant') {
      csvContent = 'date,tenant,property,amount,type,notes\n' +
        '2025-01-15,John Smith,123 Main St,1200.00,Rent Payment,January rent\n' +
        '2025-01-20,Jane Doe,456 Oak Ave,-50.00,Late Fee,Late payment fee\n' +
        '2025-01-22,Michael Johnson,789 Pine Blvd,850.00,Rent Payment,"Partial payment, remaining balance due"\n' +
        '2025-01-25,Sarah Williams,101 Elm St,1500.00,Security Deposit,Initial security deposit';
    } else {
      csvContent = 'date,property,amount,type,notes\n' +
        '2025-01-15,123 Main St,800.00,Management Fee,Monthly management fee\n' +
        '2025-01-15,456 Oak Ave,250.00,Maintenance,Plumbing repair\n' +
        '2025-01-20,789 Pine Blvd,150.00,Landscaping,"Monthly service, includes fertilization"\n' +
        '2025-01-25,101 Elm St,1200.00,Owner Draw,Monthly profit distribution';
    }
    
    // Create a blob and download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${mode}-transactions-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Import Transactions</h1>
          <p className="mt-1 text-sm text-gray-600">Import tenant transactions or owner charges from CSV files</p>
        </div>
        <div className="flex space-x-2">
          <Link to="/transactions" className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors">
            Back to Transactions
          </Link>
        </div>
      </div>
      
      <div className="mb-6 bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h2 className="text-lg font-medium text-blue-800 mb-2">CSV Templates</h2>
        <p className="text-sm text-blue-700 mb-3">Download example CSV templates to see the expected format:</p>
        
        <div className="flex space-x-4">
          <button
            onClick={() => downloadTemplate('tenant')}
            className="flex items-center text-sm px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Tenant Transactions Template
          </button>
          
          <button
            onClick={() => downloadTemplate('owner')}
            className="flex items-center text-sm px-3 py-2 bg-white border border-blue-300 text-blue-700 rounded hover:bg-blue-50 transition-colors"
          >
            <Download size={16} className="mr-2" />
            Owner Charges Template
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6">
        <TransactionImporter onImportComplete={handleImportComplete} />
      </div>
    </div>
  );
};

export default TransactionImport;
