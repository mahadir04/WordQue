import { useState } from 'react';
import { Loader2, FileText, Trash2, Database, ShieldAlert } from 'lucide-react';
import { deleteDocument } from '../services/api';

export default function DocumentManager({ documents, onDocumentsChange }) {
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document and all its indexed data? This will also delete the physical PDF from the server.')) return;
    
    setDeleting(docId);
    try {
      await deleteDocument(docId);
      onDocumentsChange?.();
    } catch (err) {
      setError('Failed to delete document. Please try again.');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-sm mb-8 animate-fade-in-up">
      <div className="px-6 py-5 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-violet-100">
            <Database className="w-5 h-5 text-violet-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-surface-900">Manage Knowledge Base</h2>
            <p className="text-xs text-surface-500 font-medium">Permanently remove documents and local PDF files</p>
          </div>
        </div>
        <div className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-wider">
          {documents.length} Files Indexed
        </div>
      </div>

      <div className="p-6">
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20 text-xs text-accent-rose font-medium">
            {error}
          </div>
        )}

        {documents.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc) => (
              <div 
                key={doc.doc_id}
                className="group flex items-center justify-between p-4 rounded-2xl border border-surface-200 hover:border-primary-500/30 hover:bg-surface-50 transition-all duration-200"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="p-2 rounded-xl bg-surface-100 text-surface-400 group-hover:bg-primary-100 group-hover:text-primary-500 transition-colors">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-surface-900 truncate pr-4">{doc.filename}</h4>
                    <p className="text-[10px] text-surface-400 font-black uppercase tracking-widest mt-0.5">
                      {doc.chunk_count} Chunks • {doc.doc_type || 'PDF'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => handleDelete(doc.doc_id)}
                  disabled={deleting === doc.doc_id}
                  title="Delete document permanently"
                  className="p-2.5 rounded-xl text-surface-300 hover:text-accent-rose hover:bg-accent-rose/10 transition-all"
                >
                  {deleting === doc.doc_id ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Trash2 className="w-5 h-5" />
                  )}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-12 text-center border-2 border-dashed border-surface-200 rounded-[2rem]">
            <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-4">
              <Database className="w-6 h-6 text-surface-300" />
            </div>
            <p className="text-sm text-surface-500 font-medium">No documents in knowledge base.</p>
            <p className="text-xs text-surface-400 mt-1">Upload files in the Workspace to populate your corpus.</p>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-accent-rose/5 border-t border-surface-100 flex items-center gap-3">
        <ShieldAlert className="w-4 h-4 text-accent-rose" />
        <p className="text-[10px] text-accent-rose font-bold uppercase tracking-wider">
          Warning: Removal is absolute. It deletes vectors, indexes, and the physical PDF file.
        </p>
      </div>
    </div>
  );
}
