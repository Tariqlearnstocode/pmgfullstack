import React from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { TransactionCreator } from '../components/TransactionCreator';

const TransactionForm = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const mode = searchParams.get('mode');
  const propertyId = searchParams.get('property');
  const tenantId = searchParams.get('tenant');

  const handleSuccess = () => {
    navigate('/transactions');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/transactions" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Record Transaction</h1>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <TransactionCreator 
            initialMode={mode as 'charge' | 'payment' | undefined}
            propertyId={propertyId || undefined}
            tenantId={tenantId || undefined}
            onSuccess={handleSuccess}
          />
        </div>
      </div>
    </div>
  );
};

export default TransactionForm;