import React, { useEffect, useState } from 'react';
import { 
  BarChart3, Database, Files, MessageSquare, 
  Sparkles, Clock, PieChart, Activity, HardDrive, BrainCircuit
} from 'lucide-react';
import { getAnalytics } from '../services/api';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const result = await getAnalytics();
        setData(result);
      } catch (err) {
        setError('Failed to load analytics data.');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full animate-fade-in-up">
        <div className="w-12 h-12 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin mb-4"></div>
        <p className="text-surface-500 font-medium">Crunching the numbers...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-accent-rose animate-fade-in-up">
        <Activity className="w-12 h-12 mb-4 opacity-50" />
        <p className="font-bold">{error}</p>
      </div>
    );
  }

  const { corpus, chat } = data;
  
  // Format storage size
  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const colors = ['bg-primary-500', 'bg-accent-emerald', 'bg-accent-amber', 'bg-surface-800', 'bg-accent-rose'];

  return (
    <div className="h-full flex flex-col animate-fade-in-up">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-3xl font-black text-surface-900 tracking-tight flex items-center gap-3">
          <BarChart3 className="w-8 h-8 text-primary-500" />
          Intelligence Analytics
        </h2>
        <p className="text-surface-500 font-medium mt-1">
          Monitor your corpus size, document distribution, and AI interaction metrics.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Metric 1 */}
        <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Files className="w-24 h-24 text-primary-500" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center mb-4">
            <Files className="w-6 h-6 text-primary-500" />
          </div>
          <p className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-1">Indexed Docs</p>
          <p className="text-4xl font-black text-surface-900">{corpus.total_documents}</p>
        </div>

        {/* Metric 2 */}
        <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <Database className="w-24 h-24 text-accent-emerald" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-accent-emerald/10 flex items-center justify-center mb-4">
            <Database className="w-6 h-6 text-accent-emerald" />
          </div>
          <p className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-1">Total Chunks</p>
          <p className="text-4xl font-black text-surface-900">{corpus.total_chunks}</p>
        </div>

        {/* Metric 3 */}
        <div className="bg-white p-6 rounded-3xl border border-surface-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <BrainCircuit className="w-24 h-24 text-surface-800" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-surface-100 flex items-center justify-center mb-4">
            <BrainCircuit className="w-6 h-6 text-surface-800" />
          </div>
          <p className="text-sm font-bold text-surface-500 uppercase tracking-wider mb-1">AI Interactions</p>
          <p className="text-4xl font-black text-surface-900">{chat.total_messages}</p>
        </div>

        {/* Metric 4 */}
        <div className="bg-[#0b1612] p-6 rounded-3xl border border-[#1a2b23] shadow-md relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform duration-500">
            <HardDrive className="w-24 h-24 text-white" />
          </div>
          <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
            <HardDrive className="w-6 h-6 text-primary-400" />
          </div>
          <p className="text-sm font-bold text-surface-400 uppercase tracking-wider mb-1">Storage Used</p>
          <p className="text-4xl font-black text-white">{formatBytes(corpus.total_size_bytes)}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0 pb-6">
        {/* Document Composition */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-surface-200 shadow-sm lg:col-span-2 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <PieChart className="w-6 h-6 text-surface-400" />
            <h3 className="text-xl font-bold text-surface-900">Corpus Composition</h3>
          </div>
          
          <div className="flex-1 flex flex-col justify-center">
            {Object.keys(corpus.doc_types).length === 0 ? (
              <p className="text-center text-surface-400 font-medium">No documents indexed yet.</p>
            ) : (
              <div>
                <div className="h-6 w-full rounded-full flex overflow-hidden mb-8 bg-surface-100 shadow-inner">
                  {Object.entries(corpus.doc_types).map(([type, count], i) => {
                    const width = `${(count / corpus.total_documents) * 100}%`;
                    return (
                      <div 
                        key={type} 
                        className={`h-full ${colors[i % colors.length]} transition-all duration-1000`} 
                        style={{ width }}
                        title={`${type}: ${count}`}
                      />
                    );
                  })}
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {Object.entries(corpus.doc_types).map(([type, count], i) => (
                    <div key={type} className="flex items-center gap-3 p-3 rounded-2xl bg-surface-50 border border-surface-100">
                      <div className={`w-4 h-4 rounded-full ${colors[i % colors.length]}`} />
                      <div>
                        <p className="text-xs font-bold text-surface-500 uppercase">{type}</p>
                        <p className="text-lg font-black text-surface-900">{count}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white p-6 sm:p-8 rounded-[2.5rem] border border-surface-200 shadow-sm flex flex-col overflow-hidden">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-6 h-6 text-surface-400" />
            <h3 className="text-xl font-bold text-surface-900">Recent Activity</h3>
          </div>

          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {chat.recent_messages?.length === 0 ? (
              <p className="text-center text-surface-400 font-medium mt-10">No recent activity.</p>
            ) : (
              chat.recent_messages?.map((msg, idx) => (
                <div key={idx} className="p-4 rounded-2xl bg-surface-50 border border-surface-100">
                  <div className="flex items-center gap-2 mb-2">
                    {msg.role === 'user' ? (
                      <span className="px-2 py-1 bg-surface-200 text-surface-700 text-[10px] font-black uppercase rounded-md">You</span>
                    ) : (
                      <span className="px-2 py-1 bg-primary-100 text-primary-700 text-[10px] font-black uppercase rounded-md flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> WordQue
                      </span>
                    )}
                    <span className="text-xs font-medium text-surface-400 truncate">{msg.session_title}</span>
                  </div>
                  <p className="text-sm font-medium text-surface-900 line-clamp-3 leading-relaxed">
                    {msg.content}
                  </p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
