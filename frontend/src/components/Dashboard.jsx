import { useState, useEffect } from 'react';
import {
  Users, Files, Target, Clock, ArrowUpRight,
  MoreHorizontal, FileText, ChevronRight, Activity,
  Download, Sparkles
} from 'lucide-react';
import { getAnalytics } from '../services/api';

const STATS_CONFIG = [
  { id: 'processed', label: 'Total Documents', icon: Files, color: 'text-primary-500', path: ['corpus', 'total_documents'] },
  { id: 'pages', label: 'Pages Indexed', icon: FileText, color: 'text-blue-500', path: ['corpus', 'total_pages'] },
  { id: 'chats', label: 'Total Sessions', icon: Users, color: 'text-emerald-500', path: ['chat', 'total_sessions'] },
  { id: 'messages', label: 'AI Interactions', icon: Activity, color: 'text-amber-500', path: ['chat', 'total_messages'] },
];

export default function Dashboard({ documents, setActiveTab }) {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnalytics().then(data => {
      setAnalytics(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const formatSize = (bytes) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6 sm:space-y-8 animate-fade-in-up">
      {/* ── Greeting ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-surface-900 tracking-tight">Good Morning!</h2>
          <p className="text-surface-500 font-medium mt-1">Your intelligence workspace is ready.</p>
        </div>
        <button className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-primary-900 text-white font-bold text-sm shadow-lg shadow-primary-900/20 hover:opacity-90 transition-opacity w-full sm:w-auto">
          <Download className="w-4 h-4" />
          Export Reports
        </button>
      </div>

      {/* ── Stats Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {STATS_CONFIG.map((config) => {
          const value = analytics ? (config.path.reduce((obj, key) => obj?.[key], analytics) || 0) : '...';
          return (
            <div key={config.id} className="stat-card flex flex-col justify-between min-h-[160px]">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="text-xs sm:text-sm font-bold text-surface-500 mb-1">{config.label}</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-2xl sm:text-3xl font-black text-surface-900">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </h3>
                  </div>
                </div>
                <div className="p-2 rounded-lg bg-surface-50 shrink-0">
                  <config.icon className={`w-4 h-4 sm:w-5 sm:h-5 ${config.color}`} />
                </div>
              </div>
              
              <div className="mt-4">
                <div className="h-8 flex items-end">
                  <div className="w-full h-1 bg-surface-100 rounded-full overflow-hidden">
                    <div className="h-full bg-primary-500 w-2/3 rounded-full" />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── Main Grid ──────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Document Overview */}
        <div className="lg:col-span-2 bento-card">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-surface-900">Document Overview</h3>
            <button className="p-2 rounded-lg hover:bg-surface-50 text-surface-400">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-surface-100 text-[10px] uppercase tracking-widest font-black text-surface-400">
                  <th className="pb-4 font-black">Recent name</th>
                  <th className="pb-4 font-black">Status</th>
                  <th className="pb-4 font-black">Type</th>
                  <th className="pb-4 font-black text-right pr-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-surface-50">
                {documents.slice(0, 5).map((doc) => (
                  <tr key={doc.doc_id} className="group hover:bg-surface-50 transition-colors">
                    <td className="py-4 pr-4 min-w-[200px]">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-xl bg-primary-50 text-primary-500 shrink-0">
                          <FileText className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-bold text-surface-900 group-hover:text-primary-600 transition-colors truncate">{doc.filename}</p>
                          <p className="text-[11px] text-surface-400 font-medium">Auto-indexed</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[120px]">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="text-xs font-bold text-surface-600">Indexed</span>
                      </div>
                    </td>
                    <td className="py-4 px-4 min-w-[100px]">
                      <span className="text-xs font-bold text-surface-500 uppercase">{doc.doc_type}</span>
                    </td>
                    <td className="py-4 pl-4 text-right">
                      <button onClick={() => setActiveTab('chat')} className="p-2 rounded-lg hover:bg-white border border-transparent hover:border-surface-200 transition-all text-surface-400 hover:text-primary-500">
                         <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {documents.length === 0 && (
                   <tr>
                     <td colSpan="4" className="py-12 text-center">
                        <p className="text-sm text-surface-400 font-medium">No documents yet. <button onClick={() => setActiveTab('chat')} className="text-primary-500 font-bold hover:underline">Upload some PDFs</button></p>
                     </td>
                   </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Insights / Quick Stats */}
          <div className="bento-card bg-[#fcfcfc] overflow-hidden">
            <div className="flex items-center gap-2 mb-6">
              <Sparkles className="w-5 h-5 text-primary-500" />
              <h3 className="text-lg font-bold text-surface-900">Corpus Summary</h3>
            </div>
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white border border-surface-200">
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Storage used</p>
                <p className="text-xl font-black text-surface-900">{formatSize(analytics?.corpus?.total_size_bytes || 0)}</p>
              </div>
              <div className="p-4 rounded-2xl bg-white border border-surface-200">
                <p className="text-[10px] font-black text-surface-400 uppercase tracking-widest mb-1">Knowledge chunks</p>
                <p className="text-xl font-black text-surface-900">{(analytics?.corpus?.total_chunks || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Recent Messages Feed */}
          <div className="bento-card bg-[#0b1612] text-white overflow-hidden relative group">
             <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                <Activity className="w-32 h-32 text-primary-500 rotate-12" />
             </div>
             <div className="flex items-center gap-2 mb-6 relative z-10">
               <Activity className="w-5 h-5 text-primary-500" />
               <h3 className="text-lg font-bold">Recent Activity</h3>
             </div>
             <div className="space-y-4 relative z-10">
                {(analytics?.chat?.recent_messages || []).map((msg, i) => (
                  <div key={i} className="p-4 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm hover:border-primary-500/20 transition-colors">
                    <p className="text-xs font-bold text-primary-400 mb-1">{msg.session_title} · {msg.role}</p>
                    <p className="text-sm font-medium text-white/80 leading-snug truncate">
                      {msg.content}
                    </p>
                  </div>
                ))}
                {(!analytics?.chat?.recent_messages || analytics.chat.recent_messages.length === 0) && !loading && (
                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5">
                    <p className="text-sm font-medium text-white/40 text-center">No recent activity found.</p>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
