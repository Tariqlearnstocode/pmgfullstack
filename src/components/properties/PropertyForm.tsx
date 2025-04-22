import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../../hooks/useApi';
import { Database } from '../../types/supabase';
import { supabaseClient } from '../../lib/supabase/client';

type Property = Database['public']['Tables']['properties']['Row'];
type PropertyInsert = Database['public']['Tables']['properties']['Insert'];
type Owner = Database['public']['Tables']['owners']['Row'];
type PropertyStatus = Database['public']['Tables']['property_statuses']['Row'];

interface PropertyFormProps {
  propertyId?: string;
  onSuccess?: (property: Property) => void;
}

export default function PropertyForm({ propertyId, onSuccess }: PropertyFormProps) {
  const navigate = useNavigate();
  const { execute, propertyService, ownerService } = useApi<Property>();
  const [owners, setOwners] = useState<Owner[]>([]);
  const [statuses, setStatuses] = useState<PropertyStatus[]>([]);
  const [formData, setFormData] = useState<PropertyInsert>({
    address: '',
    city: '',
    zip: '',
    rent_amount: 0,
    late_fee_amount: 0,
    mgmt_fee_percentage: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch owners for the dropdown
  useEffect(() => {
    const fetchOwners = async () => {
      try {
        const ownersData = await ownerService.getAll();
        setOwners(ownersData);
      } catch (err) {
        console.error('Error fetching owners:', err);
        setError('Failed to load owners');
      }
    };
    
    fetchOwners();
  }, [ownerService]);

  // Fetch property statuses for the dropdown
  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const { data: statusesData } = await supabaseClient
          .from('property_statuses')
          .select('*');
        if (statusesData) {
          setStatuses(statusesData);
        }
      } catch (err) {
        console.error('Error fetching statuses:', err);
        setError('Failed to load property statuses');
      }
    };
    
    fetchStatuses();
  }, []);

  // If editing, load the property data
  useEffect(() => {
    if (propertyId) {
      const fetchProperty = async () => {
        setIsLoading(true);
        try {
          const property = await propertyService.getById(propertyId);
          if (property) {
            setFormData({
              address: property.address,
              city: property.city,
              zip: property.zip,
              rent_amount: property.rent_amount,
              late_fee_amount: property.late_fee_amount,
              mgmt_fee_percentage: property.mgmt_fee_percentage,
              owner_id: property.owner_id,
              status_id: property.status_id,
              notes: property.notes
            });
          }
        } catch (err) {
          console.error('Error fetching property:', err);
          setError('Failed to load property details');
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchProperty();
    }
  }, [propertyId, propertyService]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Convert number inputs to numbers
    if (type === 'number') {
      setFormData({ ...formData, [name]: parseFloat(value) || 0 });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    
    try {
      let property;
      
      if (propertyId) {
        // Update existing property
        property = await execute(() => 
          propertyService.update(propertyId, formData)
        );
      } else {
        // Create new property
        property = await execute(() => 
          propertyService.create(formData)
        );
      }
      
      if (property) {
        if (onSuccess) {
          onSuccess(property);
        } else {
          navigate('/properties');
        }
      }
    } catch (err) {
      console.error('Error saving property:', err);
      setError('Failed to save property');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && propertyId) {
    return <div className="flex justify-center p-8">Loading property data...</div>;
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow">
      <h2 className="text-xl font-semibold mb-6">
        {propertyId ? 'Edit Property' : 'Add New Property'}
      </h2>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Street Address
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                id="city"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="zip" className="block text-sm font-medium text-gray-700">
                ZIP Code
              </label>
              <input
                type="text"
                id="zip"
                name="zip"
                value={formData.zip}
                onChange={handleChange}
                required
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="owner_id" className="block text-sm font-medium text-gray-700">
                Owner
              </label>
              <select
                id="owner_id"
                name="owner_id"
                value={formData.owner_id || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select an owner</option>
                {owners.map(owner => (
                  <option key={owner.id} value={owner.id}>{owner.name}</option>
                ))}
              </select>
            </div>
            
            <div>
              <label htmlFor="status_id" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status_id"
                name="status_id"
                value={formData.status_id || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              >
                <option value="">Select a status</option>
                {statuses.map(status => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="rent_amount" className="block text-sm font-medium text-gray-700">
                Rent Amount ($)
              </label>
              <input
                type="number"
                id="rent_amount"
                name="rent_amount"
                value={formData.rent_amount || 0}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="late_fee_amount" className="block text-sm font-medium text-gray-700">
                Late Fee Amount ($)
              </label>
              <input
                type="number"
                id="late_fee_amount"
                name="late_fee_amount"
                value={formData.late_fee_amount || 0}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div>
              <label htmlFor="mgmt_fee_percentage" className="block text-sm font-medium text-gray-700">
                Management Fee (%)
              </label>
              <input
                type="number"
                id="mgmt_fee_percentage"
                name="mgmt_fee_percentage"
                value={formData.mgmt_fee_percentage || 0}
                onChange={handleChange}
                required
                min="0"
                max="100"
                step="0.1"
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2">
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
                Notes
              </label>
              <textarea
                id="notes"
                name="notes"
                rows={4}
                value={formData.notes || ''}
                onChange={handleChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            
            <div className="col-span-2 flex justify-between items-center pt-4">
              <button
                type="button"
                onClick={() => navigate(-1)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : propertyId ? 'Update Property' : 'Create Property'}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
