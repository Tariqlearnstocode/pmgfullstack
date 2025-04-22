import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Plus, X } from 'lucide-react';
import { useTenantNotes } from '../hooks/useTenantNotes';

interface TenantNotesProps {
  tenantId: string;
}

interface TenantNotesProps {
  tenantId: string;
}

export function TenantNotes({ tenantId }: TenantNotesProps) {
  const { notes, loading, addNote, updateNote, deleteNote } = useTenantNotes(tenantId);
  const [showAddNote, setShowAddNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [noteContent, setNoteContent] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleEdit = (note: any) => {
    setEditingNoteId(note.id);
    setNoteContent(note.content);
    setShowAddNote(true);
    setError(null);
  };

  const handleDelete = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) {
      return;
    }
    const result = await deleteNote(noteId);
    if (!result.success) {
      setError(result.error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!noteContent.trim()) {
      setError('Note content is required');
      return;
    }
    
    setSubmitting(true);

    try {
      let result;
      if (editingNoteId) {
        result = await updateNote(editingNoteId, noteContent);
      } else {
        result = await addNote(noteContent);
      }

      if (!result.success) {
        setError(result.error || 'Failed to save note');
        return;
      }

      setNoteContent('');
      setShowAddNote(false);
      setEditingNoteId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save note');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading notes...</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-6 border-b border-gray-200 flex justify-between items-center">
        <h2 className="text-lg font-semibold">Notes</h2>
        {!showAddNote && (
          <button 
            onClick={() => {
              setShowAddNote(true);
              setError(null);
            }}
            className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
          >
            <Plus className="mr-1" size={16} />
            Add Note
          </button>
        )}
      </div>

      {showAddNote && (
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600">
                {error}
              </div>
            )}
            <div className="mb-4">
              <textarea
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={4}
                value={noteContent}
                onChange={(e) => setNoteContent(e.target.value)}
                placeholder="Enter your note here..."
              />
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => {
                  setShowAddNote(false);
                  setEditingNoteId(null);
                  setNoteContent('');
                  setError(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {submitting ? 'Saving...' : editingNoteId ? 'Update Note' : 'Add Note'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="divide-y divide-gray-200">
        {notes.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            No notes have been added yet.
          </div>
        ) : (
          notes.map(note => (
            <div key={note.id} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center">
                  <span className="text-sm font-medium">
                    Posted by {note.user_metadata?.name || note.user_email}
                  </span>
                  <span className="mx-2 text-gray-500">•</span>
                  <span className="text-sm text-gray-500">
                    {format(parseISO(note.created_at), 'MMM d, yyyy \'at\' h:mm a')}
                  </span>
                  {note.updated_at !== note.created_at && (
                    <>
                      <span className="mx-2 text-gray-500">•</span>
                      <span className="text-sm text-gray-500">
                        Edited {format(parseISO(note.updated_at), 'MMM d, yyyy \'at\' h:mm a')}
                      </span>
                    </>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(note)}
                    className="text-blue-600 hover:text-blue-800 text-sm"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(note.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Delete
                  </button>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{note.content}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}