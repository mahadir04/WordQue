import { useState, useEffect, useRef } from 'react';
import { Bell, CheckCircle2, AlertCircle, Info, X, ExternalLink } from 'lucide-react';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState([
    {
      id: 1,
      type: 'success',
      title: 'Document Indexed',
      message: 'test.pdf has been successfully indexed for RAG.',
      time: '2 mins ago',
      read: false
    },
    {
      id: 2,
      type: 'info',
      title: 'Welcome to WordQue',
      message: 'Start by uploading a PDF in the Workspace tab.',
      time: '1 hour ago',
      read: true
    }
  ]);
  
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

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className={`p-2 rounded-xl transition-all duration-200 relative ${isOpen ? 'bg-surface-100 text-primary-500' : 'text-surface-500 hover:bg-surface-100'}`}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-primary-500 rounded-full border-2 border-white animate-pulse" />
        )}
      </button>

      {isOpen && (
        <div className="
          absolute top-full right-0 mt-3 w-80 bg-white rounded-2xl shadow-2xl 
          border border-surface-200 overflow-hidden z-[100] 
          animate-in fade-in slide-in-from-top-2 duration-200
        ">
          <div className="px-5 py-4 border-b border-surface-100 bg-surface-50 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-surface-900">Notifications</h3>
              <p className="text-[10px] text-surface-400 font-bold uppercase tracking-widest">You have {unreadCount} unread alerts</p>
            </div>
            <button 
              onClick={() => setNotifications(prev => prev.map(n => ({...n, read: true})))}
              className="text-[10px] font-black text-primary-500 hover:text-primary-600 uppercase tracking-wider"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div 
                  key={n.id}
                  className={`
                    px-5 py-4 border-b border-surface-50 last:border-0 hover:bg-surface-50 transition-colors cursor-pointer relative
                    ${!n.read ? 'bg-primary-50/30' : ''}
                  `}
                >
                  {!n.read && <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary-500" />}
                  <div className="flex gap-3">
                    <div className={`
                      shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                      ${n.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}
                    `}>
                      {n.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-0.5">
                        <h4 className="text-xs font-bold text-surface-900">{n.title}</h4>
                        <span className="text-[10px] text-surface-400 font-medium">{n.time}</span>
                      </div>
                      <p className="text-xs text-surface-500 leading-relaxed line-clamp-2">{n.message}</p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center">
                <div className="w-12 h-12 rounded-full bg-surface-100 flex items-center justify-center mx-auto mb-3">
                  <Bell className="w-6 h-6 text-surface-300" />
                </div>
                <p className="text-sm text-surface-500 font-medium">All caught up!</p>
                <p className="text-xs text-surface-400 mt-1">No new notifications</p>
              </div>
            )}
          </div>

          <div className="p-3 bg-surface-50 border-t border-surface-100 text-center">
            <button className="text-[10px] font-black text-surface-400 hover:text-surface-600 uppercase tracking-widest flex items-center justify-center gap-1.5 mx-auto">
              View all history <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
