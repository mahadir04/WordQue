import { X, MessageSquare, History, Bookmark, Sparkles, Send } from 'lucide-react';

export default function RightSidebar({ isOpen, onClose }) {
  return (
    <aside className={`
      fixed top-0 right-0 h-full w-80 bg-white border-l border-surface-200 z-[60] shadow-2xl transition-transform duration-300 ease-in-out
      ${isOpen ? 'translate-x-0' : 'translate-x-full'}
    `}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-surface-100">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center text-primary-500">
              <MessageSquare className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-bold text-surface-900 tracking-tight">Quick Help & Feedback</h2>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Quick Stats/Status */}
          <div className="p-5 rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/20 relative overflow-hidden">
            <Sparkles className="absolute -right-2 -top-2 w-16 h-16 text-white/10 rotate-12" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">AI Status</p>
            <h3 className="text-lg font-bold mb-3">System Optimized</h3>
            <div className="flex gap-4">
              <div>
                <p className="text-xl font-bold">14ms</p>
                <p className="text-[10px] font-medium text-white/70">Latency</p>
              </div>
              <div>
                <p className="text-xl font-bold">Local</p>
                <p className="text-[10px] font-medium text-white/70">Embeddings</p>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <section>
            <h4 className="text-[10px] font-black uppercase tracking-widest text-surface-400 mb-4">Quick Links</h4>
            <div className="space-y-2">
              {[
                { icon: History, label: 'Activity Logs', color: 'text-violet-500' },
                { icon: Bookmark, label: 'Saved Snippets', color: 'text-amber-500' },
                { icon: Sparkles, label: 'Pro Tips', color: 'text-primary-500' },
              ].map((item, i) => (
                <button 
                  key={i}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-surface-50 transition-colors text-left group"
                >
                  <item.icon className={`w-4 h-4 ${item.color}`} />
                  <span className="text-xs font-bold text-surface-600 group-hover:text-surface-900 transition-colors">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          {/* Contact Support */}
          <section className="p-5 rounded-2xl border border-surface-200 bg-surface-50">
            <h4 className="text-xs font-bold text-surface-900 mb-2">Need Help?</h4>
            <p className="text-xs text-surface-500 mb-4 leading-relaxed">Contact our support team if you encounter any indexing issues.</p>
            <div className="relative">
              <input 
                type="text" 
                placeholder="Message support..."
                className="w-full pl-4 pr-10 py-2 rounded-lg bg-white border border-surface-300 text-xs focus:outline-none focus:border-primary-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-primary-500">
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </section> section
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-surface-100 bg-surface-50">
          <div className="flex items-center justify-between mb-4">
             <div className="flex -space-x-2">
               {[1,2,3].map(i => (
                 <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-surface-200 overflow-hidden">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${i + 10}`} alt="avatar" />
                 </div>
               ))}
             </div>
             <p className="text-[10px] font-bold text-surface-400 tracking-wide">3 Agents Online</p>
          </div>
          <p className="text-[10px] text-center text-surface-400 font-medium">WordQue AI v1.0.4 — © 2026</p>
        </div>
      </div>
    </aside>
  );
}
