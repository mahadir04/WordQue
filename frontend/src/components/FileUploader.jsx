import { useState, useCallback } from 'react';
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react';
import { uploadPDFs } from '../services/api';

export default function FileUploader({ onUploadComplete, onUploadStart, sessionId }) {
  const [isDragging, setIsDragging] = useState(false);
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError] = useState(null);

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      (f) => f.type === 'application/pdf'
    );
    setFiles((prev) => [...prev, ...droppedFiles].slice(0, 10));
    setError(null);
  }, []);

  const handleFileSelect = (e) => {
    const selected = Array.from(e.target.files).filter(
      (f) => f.type === 'application/pdf'
    );
    setFiles((prev) => [...prev, ...selected].slice(0, 10));
    setError(null);
  };

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;
    setUploading(true);
    setError(null);
    setUploadResult(null);

    try {
      let uploadSessionId = sessionId;
      if (onUploadStart) {
        uploadSessionId = await onUploadStart();
      }

      const result = await uploadPDFs(files, uploadSessionId);
      setUploadResult(result);
      setFiles([]);
      onUploadComplete?.(result, uploadSessionId);
    } catch (err) {
      setError(err.response?.data?.detail || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => document.getElementById('pdf-input').click()}
        className={`
          relative cursor-pointer rounded-2xl border-2 border-dashed p-8
          transition-all duration-300 text-center
          ${isDragging
            ? 'border-primary-400 bg-primary-50 scale-[1.02]'
            : 'border-surface-300 hover:border-primary-400 hover:bg-surface-100'
          }
        `}
      >
        <input
          id="pdf-input"
          type="file"
          accept=".pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        <div className="flex flex-col items-center gap-3">
          <div className={`
            p-4 rounded-2xl transition-all duration-300
            ${isDragging ? 'bg-primary-100 text-primary-600' : 'bg-surface-200 text-surface-500'}
          `}>
            <Upload className="w-8 h-8" />
          </div>
          <div>
            <p className="text-surface-900 font-bold">
              {isDragging ? 'Drop PDFs here' : 'Drag & drop PDFs or click to browse'}
            </p>
            <p className="text-surface-500 text-sm mt-1">
              Up to 10 files • Max 50MB each
            </p>
          </div>
        </div>
      </div>

      {/* Selected files list */}
      {files.length > 0 && (
        <div className="space-y-2 animate-fade-in-up">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-50 border border-surface-200"
            >
              <FileText className="w-5 h-5 text-primary-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-surface-900 font-medium truncate">{file.name}</p>
                <p className="text-xs text-surface-500">{formatSize(file.size)}</p>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                className="p-1 rounded-lg hover:bg-surface-200 text-surface-400 hover:text-surface-900 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}

          <button
            onClick={handleUpload}
            disabled={uploading}
            className="
              w-full py-3 px-6 rounded-xl font-bold text-sm text-white
              bg-primary-500 hover:bg-primary-600
              disabled:opacity-50 disabled:cursor-not-allowed
              transition-all duration-300 flex items-center justify-center gap-2
              shadow-lg shadow-primary-500/20
            "
          >
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Upload {files.length} PDF{files.length > 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>
      )}

      {/* Success message */}
      {uploadResult && (
        <div className="flex items-center gap-3 p-4 rounded-xl bg-accent-emerald/10 border border-accent-emerald/20 animate-fade-in-up">
          <CheckCircle2 className="w-5 h-5 text-accent-emerald shrink-0" />
          <div>
            <p className="text-sm text-accent-emerald font-medium">
              {uploadResult.documents.length} document{uploadResult.documents.length > 1 ? 's' : ''} indexed
            </p>
            <p className="text-xs text-surface-400 mt-0.5">
              {uploadResult.total_chunks} total chunks in corpus
            </p>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="p-4 rounded-xl bg-accent-rose/10 border border-accent-rose/20 animate-fade-in-up">
          <p className="text-sm text-accent-rose">{error}</p>
        </div>
      )}
    </div>
  );
}
