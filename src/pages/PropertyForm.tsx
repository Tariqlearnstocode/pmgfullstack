import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, MapPin, DollarSign, User, Percent } from 'lucide-react';
import Select from 'react-select';
import { supabase } from '../lib/supabase';
import { useData } from '../contexts/DataContext';

const PropertyForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const ownerId = searchParams.get('owner');
  const { state: { owners } } = useData();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    address: '',
    city: '',
    zip: '',
    owner_id: ownerId || '',
    has_insurance: false,
    mgmt_fee_percentage: '',
    late_fee_amount: '',
    rent_amount: '',
    lease_fee_percentage: '',
    notes: ''
  });

  useEffect(() => {
    async function loadProperty() {
      if (!id) return;
      
      setLoading(true);
      try {
        const { data: property, error: propertyError } = await supabase
          .from('properties')
          .select('*')
          .eq('id', id)
          .single();

        if (propertyError) throw propertyError;

        if (property) {
          setFormData({
            address: property.address,
            city: property.city,
            zip: property.zip,
            owner_id: property.owner_id,
            has_insurance: property.has_insurance,
            mgmt_fee_percentage: property.mgmt_fee_percentage.toString(),
            late_fee_amount: property.late_fee_amount.toString(),
            rent_amount: property.rent_amount.toString(),
            lease_fee_percentage: property.lease_fee_percentage?.toString() || '',
            notes: property.notes || ''
          });
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load property');
      } finally {
        setLoading(false);
      }
    }

    loadProperty();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      // Basic validation
      if (!formData.address.trim()) throw new Error('Address is required');
      if (!formData.city.trim()) throw new Error('City is required');
      if (!formData.zip.trim()) throw new Error('ZIP code is required');
      if (!formData.owner_id) throw new Error('Owner is required');
      
      // Numeric validations
      const mgmtFee = parseFloat(formData.mgmt_fee_percentage);
      const lateFee = parseFloat(formData.late_fee_amount);
      const rent = parseFloat(formData.rent_amount);
      const leaseFee = parseFloat(formData.lease_fee_percentage);

      if (isNaN(mgmtFee) || mgmtFee < 0 || mgmtFee > 100) {
        throw new Error('Management fee percentage must be between 0 and 100');
      }
      if (isNaN(lateFee) || lateFee < 0) {
        throw new Error('Late fee amount must be a positive number');
      }
      if (isNaN(rent) || rent < 0) {
        throw new Error('Rent amount must be a positive number');
      }
      if (formData.lease_fee_percentage && (isNaN(leaseFee) || leaseFee < 0 || leaseFee > 100)) {
        throw new Error('Lease fee percentage must be between 0 and 100');
      }

      // Create property
      const propertyData = {
          ...formData,
          mgmt_fee_percentage: mgmtFee,
          late_fee_amount: lateFee,
          rent_amount: rent,
          lease_fee_percentage: leaseFee || null,
          notes: formData.notes || null,
          status_id: '00000000-0000-0000-0000-000000000001'
      };

      const { data: property, error: dbError } = id
        ? await supabase
            .from('properties')
            .update(propertyData)
            .eq('id', id)
            .select()
            .single()
        : await supabase
            .from('properties')
            .insert([propertyData])
            .select()
            .single();

      if (dbError) throw dbError;

      // Navigate to the new property's detail page
      navigate(`/properties/${property.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create property');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Link to={id ? `/properties/${id}` : "/properties"} className="mr-4 text-gray-500 hover:text-gray-700">
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">{id ? 'Edit Property' : 'New Property'}</h1>
        </div>
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-6 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-500">Loading property details...</p>
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
                  Street Address*
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    placeholder="123 Main St"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  City*
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="City"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ZIP Code*
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="text"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                    placeholder="12345"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Owner*
                </label>
                <Select
                  value={owners.find(owner => owner.id === formData.owner_id)}
                  onChange={(selected) => setFormData({ ...formData, owner_id: selected?.id || '' })}
                  options={owners}
                  getOptionLabel={(option) => option.name}
                  getOptionValue={(option) => option.id}
                  placeholder="Select owner"
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
                    value={formData.rent_amount}
                    onChange={(e) => setFormData({ ...formData, rent_amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Management Fee %*
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.mgmt_fee_percentage}
                    onChange={(e) => setFormData({ ...formData, mgmt_fee_percentage: e.target.value })}
                    placeholder="10.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Late Fee Amount*
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.late_fee_amount}
                    onChange={(e) => setFormData({ ...formData, late_fee_amount: e.target.value })}
                    placeholder="0.00"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Lease Fee %
                </label>
                <div className="relative">
                  <Percent className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.01"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    value={formData.lease_fee_percentage}
                    onChange={(e) => setFormData({ ...formData, lease_fee_percentage: e.target.value })}
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Insurance
                </label>
                <div className="relative">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      checked={formData.has_insurance}
                      onChange={(e) => setFormData({ ...formData, has_insurance: e.target.checked })}
                    />
                    <span className="ml-2 text-gray-700">Property has insurance</span>
                  </label>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notes
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={4}
                  placeholder="Add any additional notes about this property..."
                />
              </div>
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Link
                to={id ? `/properties/${id}` : "/properties"}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                disabled={submitting}
              >
                {submitting ? (id ? 'Saving...' : 'Creating...') : (id ? 'Save Changes' : 'Create Property')}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default PropertyForm;