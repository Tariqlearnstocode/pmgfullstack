import React, { useState } from 'react';
import { useApi } from '../../hooks/useApi';
import { Database } from '../../types/supabase';
import { useAuth } from '../../contexts/AuthContext';

type TenantNote = Database['public']['Tables']['tenant_notes']['Row'];

interface AddTenantNoteProps {
  tenantId: string;
  onSuccess?: (note: TenantNote) => void;
}

export default function AddTenantNote({ tenantId, onSuccess }: AddTenantNoteProps) {
  const { user } = useAuth();
  const { execute, tenantService } = useApi<TenantNote>();
  const [content, setContent] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!content.trim()) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const note = await execute(() => 
        tenantService.addTenantNote({
          tenant_id: tenantId,
          content,
          created_at: new Date().toISOString(),
          is_deleted: false,
          created_by: user?.id || ''
        })
      );
      
      if (note) {
        setContent('');
        if (onSuccess) {
          onSuccess(note);
        }
      }
    } catch (err) {
      console.error('Error adding note:', err);
      setError('Failed to add note');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3 className="text-lg font-medium mb-3">Add Note</h3>
      
      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded mb-3">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-3">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Enter note content..."
            required
            rows={3}
            className="w-full border border-gray-300 rounded p-2 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isLoading || !content.trim()}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
          >
            {isLoading ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>
    </div>
  );
}
