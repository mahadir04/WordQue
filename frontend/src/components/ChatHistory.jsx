import { useState, useEffect } from 'react';
import {
  MessageSquare, Plus, Trash2, Loader2, Clock, ChevronDown
} from 'lucide-react';
import { getChatSessions, deleteChatSession } from '../services/api';

export default function ChatHistory({ activeSessionId, onSelectSession, onNewChat }) {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  const fetchSessions = async () => {
    try {
      const data = await getChatSessions();
      setSessions(data.sessions || []);
    } catch {
      // User might not be authenticated
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [activeSessionId]);

  const handleDelete = async (e, sessionId) => {
    e.stopPropagation();
    setDeleting(sessionId);
    try {
      await deleteChatSession(sessionId);
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        onNewChat?.();
      }
    } catch {
      // Ignore
    } finally {
      setDeleting(null);
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr + 'Z');
    const now = new Date();
    const diff = now - d;
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-2">
      {/* New Chat button */}
      <button
        onClick={onNewChat}
        className="
          w-full flex items-center gap-2.5 px-4 py-3 rounded-xl
          border border-dashed border-surface-300 bg-surface-50
          text-surface-600 hover:text-surface-900 hover:shadow-sm
          hover:border-primary-400 hover:bg-primary-50
          transition-all duration-200 text-sm font-bold
        "
      >
        <Plus className="w-4 h-4" />
        New Chat
      </button>

      {/* Session list */}
      {loading ? (
        <div className="flex justify-center py-6">
          <Loader2 className="w-5 h-5 text-primary-500 animate-spin" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-6">
          <MessageSquare className="w-8 h-8 text-surface-300 mx-auto mb-2" />
          <p className="text-xs text-surface-500 font-medium">No conversations yet</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
          {sessions.map((session) => (
            <button
              key={session.id}
              onClick={() => onSelectSession?.(session.id)}
              className={`
                w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-left
                transition-all duration-200 text-sm
                ${activeSessionId === session.id
                  ? 'bg-primary-50 border border-primary-200 text-primary-700 font-bold shadow-sm'
                  : 'hover:bg-surface-100 text-surface-700 font-bold border border-transparent bg-surface-50 shadow-sm hover:shadow-md'
                }
              `}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0 text-surface-400" />
              <div className="flex-1 min-w-0">
                <p className="truncate text-[13px] font-bold">{session.title}</p>
                <p className="text-[10px] text-surface-500 font-medium mt-0.5">
                  {formatDate(session.updated_at)} · {session.message_count} msgs
                </p>
              </div>
              <button
                onClick={(e) => handleDelete(e, session.id)}
                className="
                  opacity-0 group-hover:opacity-100 shrink-0
                  p-1 rounded-lg text-surface-400
                  hover:text-accent-rose hover:bg-accent-rose/10
                  transition-all duration-200
                "
              >
                {deleting === session.id ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Trash2 className="w-3.5 h-3.5" />
                )}
              </button>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
