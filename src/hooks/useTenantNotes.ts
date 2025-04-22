import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface TenantNote {
  id: string;
  tenant_id: string;
  content: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_deleted: boolean;
  user_email: string;
  user_metadata: {
    name: string;
  };
}

export function useTenantNotes(tenantId: string) {
  const [notes, setNotes] = useState<TenantNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    fetchNotes();
  }, [tenantId]);

  const fetchNotes = async () => {
    try {
      const { data: notes, error: notesError } = await supabase
        .from('tenant_note_details')
        .select('*')
        .eq('tenant_id', tenantId)
        .eq('is_deleted', false)
        .order('created_at', { ascending: false });

      if (notesError) throw notesError;
      setNotes(notes || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch notes'));
    } finally {
      setLoading(false);
    }
  };

  const addNote = async (content: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user?.id) throw new Error('User not authenticated');

      const { data: note, error: noteError } = await supabase
        .from('tenant_notes')
        .insert([{
          tenant_id: tenantId,
          content,
          created_by: user.id,
          is_deleted: false
        }])
        .select()
        .single();

      if (noteError) throw noteError;
      if (!note) throw new Error('Failed to create note');
      
      // Fetch the complete note with user info
      const { data: noteDetails, error: viewError } = await supabase
        .from('tenant_note_details')
        .select('*')
        .eq('id', note.id)
        .single();

      if (viewError) throw viewError;
      if (!noteDetails) throw new Error('Failed to fetch note details');
      
      // Add the new note to the state
      setNotes(prev => [noteDetails, ...prev]);
      
      return { success: true };
    } catch (err) {
      return { 
        success: false, 
        error: err instanceof Error ? err.message : 'Failed to add note'
      };
    }
  };

  const updateNote = async (noteId: string, content: string) => {
    try {
      const { data: note, error: noteError } = await supabase
        .from('tenant_notes') 
        .update({ 
          content,
          updated_at: new Date().toISOString(),
          is_deleted: false
        })
        .eq('id', noteId) 
        .select()
        .single();

      if (noteError) throw noteError;
      if (!note) throw new Error('Failed to update note');
      
      // Fetch the updated note with user info
      const { data: noteWithUser, error: viewError } = await supabase
        .from('tenant_note_details')
        .select('*')
        .eq('id', note.id)
        .single();

      if (viewError) throw viewError;
      if (!noteWithUser) throw new Error('Failed to fetch updated note details');
      
      setNotes(prev => prev.map(n => n.id === noteId ? noteWithUser : n));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to update note'
      };
    }
  };

  const deleteNote = async (noteId: string) => {
    try {
      const { error: noteError } = await supabase
        .from('tenant_notes')
        .update({ is_deleted: true })
        .eq('id', noteId);

      if (noteError) throw noteError;
      setNotes(prev => prev.filter(n => n.id !== noteId));
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err instanceof Error ? err.message : 'Failed to delete note'
      };
    }
  };

  return { notes, loading, error, addNote, updateNote, deleteNote };
}