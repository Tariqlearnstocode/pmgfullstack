import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, User, Mail, Phone, Home, Calendar, DollarSign, FileText } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../lib/supabase';
import { useData } from '../contexts/DataContext';
import { format } from 'date-fns';

const TenantForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('property');
  const { state: { properties } } = useData();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    property_id: propertyId || '',
    monthly_rent: '',
    security_deposit: '',
    lease_start_date: '',
    lease_end_date: '',
    move_in_date: '',
    move_out_date: '',
    lease_document_url: '',
    starting_balance: '0'
  });

  useEffect(() => {
    async function loadTenant() {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data: tenant, error: tenantError } = await supabase
          .from('tenants')
          .select('*')
          .eq('id', id)
          .single();

        if (tenantError) throw tenantError;

        if (tenant) {
          setFormData({
            name: tenant.name,
            email: tenant.email,
            phone: tenant.phone || '',
            property_id: tenant.property_id || '',
            monthly_rent: tenant.monthly_rent.toString(),
            security_deposit: tenant.security_deposit?.toString() || '',
            lease_start_date: tenant.lease_start_date || '',
            lease_end_date: tenant.lease_end_date || '',
            move_in_date: tenant.move_in_date || '',
            move_out_date: tenant.move_out_date || '',
            lease_document_url: tenant.lease_document_url || '',
            starting_balance: tenant.starting_balance?.toString() || '0'
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tenant');
      } finally {
        setLoading(false);
      }
    }

    loadTenant();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Basic validation
      if (!formData.name.trim()) throw new Error('Name is required');
      if (!formData.email.trim()) throw new Error('Email is required');
      if (!formData.property_id) throw new Error('Property is required');
      if (!formData.monthly_rent) throw new Error('Monthly rent is required');
      if (!formData.lease_start_date) throw new Error('Lease start date is required');
      if (!formData.lease_end_date) throw new Error('Lease end date is required');
      if (!formData.move_in_date) throw new Error('Move-in date is required');
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Phone validation (if provided)
      if (formData.phone) {
        const phoneRegex = /^\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}$/;
        if (!phoneRegex.test(formData.phone.replace(/\s/g, ''))) {
          throw new Error('Please enter a valid phone number (e.g., (555) 123-4567)');
        }
      }

      // Numeric validations
      const monthlyRent = parseFloat(formData.monthly_rent);
      const securityDeposit = formData.security_deposit ? parseFloat(formData.security_deposit) : null;
      const startingBalance = parseFloat(formData.starting_balance);

      if (isNaN(monthlyRent) || monthlyRent <= 0) {
        throw new Error('Monthly rent must be a positive number');
      }
      if (securityDeposit !== null && (isNaN(securityDeposit) || securityDeposit < 0)) {
        throw new Error('Security deposit must be a non-negative number');
      }
      if (isNaN(startingBalance)) {
        throw new Error('Starting balance must be a valid number');
      }

      // Date validations
      const leaseStart = new Date(formData.lease_start_date);
      const leaseEnd = new Date(formData.lease_end_date);
      const moveIn = new Date(formData.move_in_date);
      const moveOut = formData.move_out_date ? new Date(formData.move_out_date) : null;

      if (leaseEnd <= leaseStart) {
        throw new Error('Lease end date must be after lease start date');
      }
      if (moveIn < leaseStart) {
        throw new Error('Move-in date cannot be before lease start date');
      }
      if (moveOut && moveOut <= moveIn) {
        throw new Error('Move-out date must be after move-in date');
      }

      // Prepare tenant data
      const tenantData = {
        ...formData,
        monthly_rent: monthlyRent,
        security_deposit: securityDeposit,
        starting_balance: startingBalance,
        phone: formData.phone || null,
        move_out_date: formData.move_out_date || null,
        lease_document_url: formData.lease_document_url || null,
        status_id: '00000000-0000-0000-0000-000000000001' // Default to "Active"
      };

      const { data: tenant, error: dbError } = id
        ? await supabase
            .from('tenants')
            .update(tenantData)
            .eq('id', id)
            .select()
            .single()
        : await supabase
            .from('tenants')
            .insert([tenantData])
            .select()
            .single();

      if (dbError) throw dbError;

      // Navigate to the tenant's detail page
      navigate(`/tenants/${tenant.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save tenant');
    } finally {
      setSubmitting(false);
    }
  };

  const availableProperties = properties.filter(property => 
    !property.tenant_id || (id && property.tenant_id === id)
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to={id ? `/tenants/${id}` : "/tenants"} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{id ? 'Edit Tenant' : 'New Tenant'}</h1>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading tenant details...</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow">
          <form onSubmit={handleSubmit} className="p-6 space-y-6">
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name*
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="John Smith"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address*
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="email"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="john.smith@example.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="tel"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="(555) 123-4567"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Property*
                </label>
                <Select
                  value={availableProperties.find(property => property.id === formData.property_id)}
                  onChange={(selected) => setFormData({ ...formData, property_id: selected?.id || '' })}
                  options={availableProperties}
                  getOptionLabel={(option) => option.address}
                  getOptionValue={(option) => option.id}
                  placeholder="Select property"
                  className="react-select"
                  classNamePrefix="react-select"
                  isClearable
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Monthly Rent*
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.monthly_rent}
                    onChange={(e) => setFormData({ ...formData, monthly_rent: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Security Deposit
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.security_deposit}
                    onChange={(e) => setFormData({ ...formData, security_deposit: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Starting Balance
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.starting_balance}
                    onChange={(e) => setFormData({ ...formData, starting_balance: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lease Start Date*
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.lease_start_date}
                    onChange={(e) => setFormData({ ...formData, lease_start_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lease End Date*
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.lease_end_date}
                    onChange={(e) => setFormData({ ...formData, lease_end_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move-in Date*
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.move_in_date}
                    onChange={(e) => setFormData({ ...formData, move_in_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Move-out Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="date"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.move_out_date}
                    onChange={(e) => setFormData({ ...formData, move_out_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lease Document URL
                </label>
                <div className="relative">
                  <FileText className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="url"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.lease_document_url}
                    onChange={(e) => setFormData({ ...formData, lease_document_url: e.target.value })}
                    placeholder="https://example.com/lease.pdf"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Link
                to={id ? `/tenants/${id}` : "/tenants"}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (id ? 'Saving...' : 'Creating...') : (id ? 'Save Changes' : 'Create Tenant')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default TenantForm;