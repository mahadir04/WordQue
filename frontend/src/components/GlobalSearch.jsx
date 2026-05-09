import { useState, useEffect, useRef } from 'react';
import { Search, Loader2, FileText, ChevronRight, X } from 'lucide-react';
import { searchCorpus } from '../services/api';

export default function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (query.trim().length > 2) {
        setLoading(true);
        setIsOpen(true);
        try {
          const data = await searchCorpus(query);
          setResults(data.results);
        } catch (err) {
          console.error('Search failed', err);
        } finally {
          setLoading(false);
        }
      } else {
        setResults([]);
        setIsOpen(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [query]);

  return (
    <div className="relative w-48 sm:w-96 group hidden md:block" ref={dropdownRef}>
      <div className="relative">
        <Search className={`
          absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors
          ${loading ? 'text-primary-500' : 'text-surface-400 group-focus-within:text-primary-500'}
        `} />
        
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length > 2 && setIsOpen(true)}
          placeholder="Search documents, insights..."
          className="
            w-full pl-11 pr-10 py-2.5 rounded-xl bg-surface-100 border border-transparent 
            focus:bg-white focus:border-primary-500/30 focus:outline-none transition-all 
            text-sm font-medium
          "
        />

        {query && (
          <button 
            onClick={() => { setQuery(''); setResults([]); }}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-surface-200 text-surface-400"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="
          absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl 
          border border-surface-200 overflow-hidden z-[100] animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <div className="p-2 border-b border-surface-100 bg-surface-50">
            <p className="text-[10px] uppercase tracking-widest font-black text-surface-400 px-3 py-1">
              {loading ? 'Searching Knowledge Base...' : results.length > 0 ? `Found ${results.length} relevant results` : 'No results found'}
            </p>
          </div>

          <div className="max-h-[400px] overflow-y-auto p-2 space-y-1">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-primary-500 animate-spin mb-2" />
                <p className="text-xs text-surface-400 font-medium">Scanning vectors...</p>
              </div>
            ) : results.length > 0 ? (
              results.map((res, i) => (
                <div 
                  key={i}
                  className="p-3 rounded-xl hover:bg-surface-50 cursor-pointer transition-colors group border border-transparent hover:border-surface-200"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-primary-100/50 text-primary-600 group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="text-sm font-bold text-surface-900 truncate pr-2">{res.filename}</h4>
                        <span className="shrink-0 text-[10px] font-black px-1.5 py-0.5 rounded bg-surface-200 text-surface-500 uppercase">Page {res.page + 1}</span>
                      </div>
                      <p className="text-xs text-surface-500 line-clamp-2 leading-relaxed italic">
                        "...{res.content.substring(0, 150)}..."
                      </p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-surface-300 self-center" />
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <p className="text-sm text-surface-500 font-medium">No direct matches for "{query}"</p>
                <p className="text-xs text-surface-400 mt-1">Try different keywords or check your corpus.</p>
              </div>
            )}
          </div>

          {results.length > 0 && (
            <div className="p-3 bg-surface-50 border-t border-surface-100 text-center">
              <p className="text-[10px] text-surface-400 font-bold">Use the Workspace tab for full conversational RAG</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
