import { useState } from 'react';
import { Loader2, BookOpen, Download, FileText, Trash2, Database, ShieldAlert } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CitationChip from './CitationChip';
import { summarizeDocument, deleteDocument } from '../services/api';

export default function SummaryPanel({ documents, onDocumentsChange }) {
  const [selectedDoc, setSelectedDoc] = useState('all');
  const [summary, setSummary] = useState(null);
  const [citations, setCitations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [error, setError] = useState(null);

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setSummary(null);

    try {
      const docId = selectedDoc === 'all' ? null : selectedDoc;
      const result = await summarizeDocument(docId);
      setSummary(result.summary);
      setCitations(result.citations || []);
    } catch (err) {
      setError(err.response?.data?.detail || 'Summarization failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (docId) => {
    if (!window.confirm('Are you sure you want to remove this document and all its indexed data? This cannot be undone.')) return;
    
    setDeleting(docId);
    try {
      await deleteDocument(docId);
      onDocumentsChange?.();
      if (selectedDoc === docId) setSelectedDoc('all');
    } catch (err) {
      setError('Failed to delete document.');
    } finally {
      setDeleting(null);
    }
  };

  const handleDownload = () => {
    if (!summary) return;
    const blob = new Blob([summary], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'summary.md';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col h-full space-y-8">
      {/* 1. Document Management Section — NOW AT THE TOP */}
      <div className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-sm">
        <div className="px-6 py-5 border-b border-surface-200 bg-surface-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-violet-100">
              <Database className="w-5 h-5 text-violet-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">Manage Knowledge Base</h2>
              <p className="text-xs text-surface-500 font-medium">View and remove documents from your corpus</p>
            </div>
          </div>
          <div className="px-3 py-1 rounded-full bg-violet-50 text-violet-600 text-[10px] font-black uppercase tracking-wider">
            {documents.length} Files Indexed
          </div>
        </div>

        <div className="p-6">
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
                    title="Delete document"
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
              <p className="text-sm text-surface-500 font-medium">Your knowledge base is empty.</p>
              <p className="text-xs text-surface-400 mt-1">Upload a PDF in the Workspace to get started.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 bg-accent-rose/5 border-t border-surface-100 flex items-center gap-3">
          <ShieldAlert className="w-4 h-4 text-accent-rose" />
          <p className="text-[10px] text-accent-rose font-bold uppercase tracking-wider">
            Warning: Deleting a document removes its vectors and source files permanently.
          </p>
        </div>
      </div>

      {/* 2. Summarizer Section — NOW AT THE BOTTOM */}
      <div className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-sm flex flex-col min-h-[400px]">
        {/* Controls */}
        <div className="px-6 py-5 border-b border-surface-200 bg-surface-50">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-xl bg-primary-100">
              <BookOpen className="w-5 h-5 text-primary-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-surface-900">Summarizer</h2>
              <p className="text-xs text-surface-500 font-medium">Map-reduce summarization with citations</p>
            </div>
          </div>

          <div className="flex gap-3">
            <select
              value={selectedDoc}
              onChange={(e) => setSelectedDoc(e.target.value)}
              className="
                flex-1 px-4 py-2.5 rounded-xl text-sm font-medium
                bg-surface-50 border border-surface-300 shadow-sm
                text-surface-900 focus:outline-none focus:border-primary-500 focus:ring-2 focus:ring-primary-500/20
                transition-colors
              "
            >
              <option value="all">📚 Entire Corpus</option>
              {documents.map((doc) => (
                <option key={doc.doc_id} value={doc.doc_id}>
                  📄 {doc.filename}
                </option>
              ))}
            </select>

            <button
              onClick={handleSummarize}
              disabled={loading || documents.length === 0}
              className="
                px-6 py-2.5 rounded-xl font-bold text-sm text-white
                bg-primary-500 hover:bg-primary-600
                disabled:opacity-40
                transition-all duration-200
                shadow-lg shadow-primary-500/20
                flex items-center gap-2
              "
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Summarizing...
                </>
              ) : (
                'Summarize'
              )}
            </button>
          </div>
        </div>

        {/* Summary output */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          {!summary && !loading && !error && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="p-5 rounded-3xl bg-primary-50 mb-6">
                <BookOpen className="w-10 h-10 text-primary-300" />
              </div>
              <p className="text-surface-500 font-medium max-w-sm">
                Select a document or the entire corpus and click Summarize
                to generate a bullet-point summary with citations.
              </p>
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center h-full text-center py-12 animate-fade-in-up">
              <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-4" />
              <p className="text-surface-500 font-medium">Analyzing documents and generating summary...</p>
              <div className="mt-4 h-2 w-64 rounded-full shimmer" />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 animate-fade-in-up">
              <p className="text-sm text-accent-rose">{error}</p>
            </div>
          )}

          {summary && (
            <div className="space-y-4 animate-fade-in-up">
              <div className="flex items-center justify-between">
                <span className="text-xs text-surface-500 uppercase tracking-wider font-bold">Summary</span>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs text-surface-500 font-medium hover:text-surface-900 hover:bg-surface-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </button>
              </div>

              <div className="bg-surface-50 border border-surface-200 shadow-sm rounded-2xl p-6 message-content text-surface-700 leading-relaxed">
                <ReactMarkdown>{summary}</ReactMarkdown>
              </div>

              {citations.length > 0 && (
                <div>
                  <p className="text-xs text-surface-500 uppercase tracking-wider font-semibold mb-2">Sources</p>
                  <div className="flex flex-wrap gap-2">
                    {citations.map((c, i) => (
                      <CitationChip key={i} citation={c} index={i} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
