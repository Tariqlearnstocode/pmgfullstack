import React, { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { useTenantDetail } from '../hooks/useTenantDetail';
import { TenantNotes } from '../components/TenantNotes';
import {
  User, 
  Mail, 
  Phone, 
  Home, 
  Calendar, 
  DollarSign, 
  FileText, 
  Edit, 
  ArrowLeft,
  ExternalLink,
  Plus
} from 'lucide-react';

const TenantDetail = () => {
  const { id } = useParams();
  const { tenant, transactions, loading, error } = useTenantDetail(id || '');

  // Calculate running balance for each transaction
  const transactionsWithBalance = useMemo(() => {
    let balance = tenant?.starting_balance || 0;
    // Filter out management/lease fees and sort by date (oldest first)
    const filtered = transactions
      .filter(tx => {
        // Only show rent charges/payments, late fees, and other tenant-specific transactions
        const allowedTypes = [
          'Rent Charge',
          'Rent Payment',
          'Late Fee',
          'Security Deposit',
          'Application Fee'
        ];
        return allowedTypes.includes(tx.type_display_name);
      })
      .sort((a, b) => parseISO(a.date).getTime() - parseISO(b.date).getTime());
    
    return filtered.map(tx => {
      balance += tx.amount;
      return {
        ...tx,
        runningBalance: balance
      };
    });
  }, [transactions, tenant?.starting_balance]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="ml-2 text-gray-500">Loading tenant details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        <p>Error loading tenant details. Please try again later.</p>
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="p-8 text-center text-gray-500">
        <p>Tenant not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to="/tenants" className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Tenant Details</h1>
        </div>
        <div className="flex space-x-2">
          <Link 
            to={`/reports/tenant-ledger/${id}`} 
            className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center"
          >
            <ExternalLink className="mr-2" size={18} />
            View Ledger
          </Link>
          <Link 
            to={`/tenants/${id}/edit`} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center"
          >
            <Edit className="mr-2" size={18} />
            Edit Tenant
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Tenant Information */}
        <div className="bg-white rounded-lg shadow lg:col-span-1">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Tenant Information</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-center">
              <div className="h-16 w-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 mr-4">
                <User size={32} />
              </div>
              <div>
                <h3 className="text-xl font-semibold">{tenant.name}</h3>
                <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                  tenant.status === 'Active' ? 'bg-green-100 text-green-800' : 
                  tenant.status === 'Late' ? 'bg-red-100 text-red-800' : 
                  'bg-gray-100 text-gray-800'
                }`}>
                  {tenant.status}
                </span>
              </div>
            </div>
            
            <div className="pt-4 space-y-3">
              <div className="flex items-center">
                <Mail className="text-gray-400 mr-3" size={18} />
                <span>{tenant.email}</span>
              </div>
              <div className="flex items-center">
                <Phone className="text-gray-400 mr-3" size={18} />
                <span>{tenant.phone}</span>
              </div>
              <div className="flex items-center">
                <Home className="text-gray-400 mr-3" size={18} />
                <Link to={`/properties/${tenant.property_id}`} className="text-blue-600 hover:text-blue-800">
                  {tenant.property_address}
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Lease Information */}
        <div className="bg-white rounded-lg shadow lg:col-span-2">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold">Lease Information</h2>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-gray-500">Lease Period</p>
                <div className="flex items-center mt-1">
                  <Calendar className="text-gray-400 mr-2" size={18} />
                  <span>
                    {format(parseISO(tenant.lease_start_date), 'MMM d, yyyy')} - {format(parseISO(tenant.lease_end_date), 'MMM d, yyyy')}
                  </span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Move-in Date</p>
                <div className="flex items-center mt-1">
                  <Calendar className="text-gray-400 mr-2" size={18} />
                  <span>{format(parseISO(tenant.move_in_date), 'MMM d, yyyy')}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Monthly Rent</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">${tenant.monthly_rent.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Security Deposit</p>
                <div className="flex items-center mt-1">
                  <DollarSign className="text-gray-400 mr-2" size={18} />
                  <span className="text-lg font-semibold">${tenant.security_deposit.toLocaleString()}</span>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Current Balance</p>
                <div className="flex items-center mt-1">
                  <Link 
                    to={`/reports/tenant-ledger?tenant=${id}`}
                    className="flex items-center text-lg font-semibold text-blue-600 hover:text-blue-800"
                  >
                    <DollarSign className="text-gray-400 mr-2" size={18} />
                    ${Math.abs(transactionsWithBalance[transactionsWithBalance.length - 1]?.runningBalance || 0).toLocaleString()}
                    {transactionsWithBalance[transactionsWithBalance.length - 1]?.runningBalance > 0 ? ' (due)' : transactionsWithBalance[transactionsWithBalance.length - 1]?.runningBalance < 0 ? ' (credit)' : ''}
                  </Link>
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-500">Last Payment</p>
                <div className="flex items-center mt-1">
                  {(() => {
                    const lastPayment = transactionsWithBalance.filter(tx => tx.amount < 0).pop();
                    return lastPayment ? (
                      <div className="space-y-1">
                        <div className="flex items-center">
                          <Calendar className="text-gray-400 mr-2" size={18} />
                          <span>{format(parseISO(lastPayment.date), 'MMM d, yyyy')}</span>
                        </div>
                        <div className="flex items-center">
                          <DollarSign className="text-gray-400 mr-2" size={18} />
                          <span>${Math.abs(lastPayment.amount).toLocaleString()}</span>
                        </div>
                      </div>
                    ) : (
                      <span>No payments recorded</span>
                    );
                  })()}
                </div>
              </div>
              
              {tenant.lease_document_url && (
                <div>
                  <p className="text-sm text-gray-500">Lease Document</p>
                  <div className="flex items-center mt-1">
                    <FileText className="text-gray-400 mr-2" size={18} />
                    <a href={tenant.lease_document_url} className="text-blue-600 hover:text-blue-800">
                      View Lease Agreement
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="lg:col-span-3">
          <TenantNotes tenantId={id || ''} />
        </div>
      </div>
    </div>
  );
};

export default TenantDetail;