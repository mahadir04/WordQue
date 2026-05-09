import { FileText, Trash2, BookOpen, Loader2 } from 'lucide-react';

const TYPE_CONFIG = {
  code:     { emoji: '💻', label: 'Code',     color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20' },
  math:     { emoji: '🔢', label: 'Math',     color: 'text-violet-400 bg-violet-400/10 border-violet-400/20' },
  business: { emoji: '💼', label: 'Business', color: 'text-amber-400 bg-amber-400/10 border-amber-400/20' },
  story:    { emoji: '📖', label: 'Story',    color: 'text-rose-400 bg-rose-400/10 border-rose-400/20' },
  textbook: { emoji: '📚', label: 'Textbook', color: 'text-emerald-400 bg-emerald-400/10 border-emerald-400/20' },
};

function DocTypeBadge({ docType = 'textbook' }) {
  const cfg = TYPE_CONFIG[docType] || TYPE_CONFIG.textbook;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${cfg.color}`}>
      {cfg.emoji} {cfg.label}
    </span>
  );
}

export default function CorpusManager({ documents, totalChunks, onDelete, deleting }) {
  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (documents.length === 0) {
    return (
      <div className="text-center py-8">
        <BookOpen className="w-10 h-10 text-surface-400 mx-auto mb-3" />
        <p className="text-surface-900 font-medium text-sm">No documents yet</p>
        <p className="text-surface-500 text-xs mt-1">Upload PDFs to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between px-1 mb-3">
        <span className="text-xs text-surface-500 uppercase tracking-wider font-bold">
          Corpus
        </span>
        <span className="text-xs text-primary-600 font-bold">
          {totalChunks} chunks
        </span>
      </div>

      {documents.map((doc) => (
        <div
          key={doc.doc_id}
          className="
            group flex items-start gap-3 p-3 rounded-xl
            bg-surface-50 border border-surface-200 hover:border-primary-300 hover:shadow-sm transition-all duration-200
          "
        >
          <div className="p-2 rounded-lg bg-primary-50 mt-0.5 shrink-0">
            <FileText className="w-4 h-4 text-primary-500" />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm text-surface-900 font-bold truncate" title={doc.filename}>
              {doc.filename}
            </p>
            <div className="flex flex-wrap items-center gap-2 mt-1.5">
              {/* Document type badge */}
              <DocTypeBadge docType={doc.doc_type} />
              <span className="text-xs text-surface-500">{doc.page_count}p</span>
              <span className="text-xs text-surface-300">·</span>
              <span className="text-xs text-surface-500">{doc.chunk_count} chunks</span>
              <span className="text-xs text-surface-300">·</span>
              <span className="text-xs text-surface-500">{formatSize(doc.size_bytes)}</span>
              {doc.session_id && (
                <span className="text-[10px] font-bold text-surface-400 bg-surface-100 px-1.5 py-0.5 rounded border border-surface-200">
                  In Chat
                </span>
              )}
            </div>
          </div>

          <button
            onClick={() => onDelete(doc.doc_id)}
            disabled={deleting === doc.doc_id}
            className="
              opacity-0 group-hover:opacity-100 shrink-0
              p-1.5 rounded-lg text-surface-500
              hover:text-accent-rose hover:bg-accent-rose/10
              transition-all duration-200
              disabled:opacity-50
            "
            title="Remove document"
          >
            {deleting === doc.doc_id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Trash2 className="w-4 h-4" />
            )}
          </button>
        </div>
      ))}
    </div>
  );
}
