import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2, Sparkles, MessageCircle, BookOpen, Upload, Paperclip, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import CitationChip from './CitationChip';
import FileUploader from './FileUploader';
import { sendChatMessage, getChatMessages, createChatSession } from '../services/api';

const DOC_TYPE_META = {
  code:     { emoji: '💻', label: 'Code',     color: 'text-cyan-400' },
  math:     { emoji: '🔢', label: 'Math',     color: 'text-violet-400' },
  business: { emoji: '💼', label: 'Business', color: 'text-amber-400' },
  story:    { emoji: '📖', label: 'Story',    color: 'text-rose-400' },
  research: { emoji: '🔬', label: 'Research', color: 'text-blue-400' },
  legal:    { emoji: '⚖️', label: 'Legal',    color: 'text-stone-500' },
  tutor:    { emoji: '🎓', label: 'Tutor',    color: 'text-indigo-400' },
  textbook: { emoji: '📚', label: 'Textbook', color: 'text-emerald-400' },
};

function TemplateTag({ docType }) {
  if (!docType) return null;
  const meta = DOC_TYPE_META[docType] || DOC_TYPE_META.textbook;
  return (
    <span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${meta.color} opacity-70`}>
      {meta.emoji} {meta.label}
    </span>
  );
}

export default function ChatWindow({ sessionId, onSessionChange, onDocumentsChange }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [currentSessionId, setCurrentSessionId] = useState(sessionId);
  const [selectedCitation, setSelectedCitation] = useState(null);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  const fetchMessages = useCallback(async (sid) => {
    if (!sid) return;
    try {
      const data = await getChatMessages(sid);
      setMessages(
        data.messages.map((m) => ({
          role: m.role,
          content: m.content,
          citations: m.citations || [],
          docType: m.doc_type,
        }))
      );
    } catch {
      setMessages([]);
    }
  }, []);

  // Load session messages when sessionId changes
  useEffect(() => {
    setCurrentSessionId(sessionId);
    fetchMessages(sessionId);
  }, [sessionId, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const query = input.trim();
    setInput('');

    setMessages((prev) => [...prev, { role: 'user', content: query }]);
    setLoading(true);

    try {
      const result = await sendChatMessage(query, 5, currentSessionId);

      // If a new session was created, update the parent
      if (result.session_id && result.session_id !== currentSessionId) {
        setCurrentSessionId(result.session_id);
        onSessionChange?.(result.session_id);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: result.answer,
          citations: result.citations,
          docType: result.doc_type,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Something went wrong. Make sure the backend is running and documents are uploaded.',
          error: true,
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const suggestions = [
    'Summarize the key findings',
    'Explain the main concepts',
    'What methodology was used?',
    'Compare the approaches',
  ];

  return (
    <div className="flex h-full w-full overflow-hidden bg-white relative">
      {/* ── Main Chat Area ── */}
      <div className={`flex flex-col h-full transition-all duration-300 ${selectedCitation ? 'w-2/3 border-r border-surface-200' : 'w-full'}`}>
      {/* Chat Header */}
      <div className="h-16 shrink-0 flex items-center justify-between px-6 bg-white border-b border-surface-200">
        <div className="flex items-center gap-3">
           <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
              <MessageCircle className="w-4 h-4 text-primary-600" />
           </div>
           <div>
              <h3 className="text-sm font-bold text-surface-900">Current Session</h3>
              <p className="text-[10px] text-surface-400 font-bold uppercase tracking-wider">
                {currentSessionId ? `ID: ${currentSessionId.slice(0,8)}...` : 'New Workspace'}
              </p>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <button className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors">
              <BookOpen className="w-4 h-4" />
           </button>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-8 space-y-6">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center animate-fade-in-up w-full max-w-2xl mx-auto">
            <div className="relative mb-8">
              <div className="p-6 rounded-[2rem] bg-primary-50">
                <div className="p-4 rounded-2xl bg-primary-500 shadow-lg shadow-primary-500/20">
                  <Sparkles className="w-10 h-10 text-white" />
                </div>
              </div>
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-emerald rounded-full border-4 border-surface-50 animate-pulse-soft" />
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-surface-900 mb-4 tracking-tight">
              Ask your documents anything
            </h2>
            <p className="text-surface-500 max-w-2xl leading-relaxed text-base sm:text-lg font-medium mb-10">
              Upload PDFs and ask questions. WordQue detects document type and adapts
              its response style — code, math, business, story, or textbook.
            </p>

            <div className="w-full max-w-xl text-left bg-white p-8 rounded-[2rem] border border-surface-200 shadow-xl shadow-surface-200/50 mb-10">
              <div className="flex items-center gap-3 mb-6">
                 <div className="w-12 h-12 rounded-2xl bg-primary-900 flex items-center justify-center shadow-inner">
                    <Upload className="w-6 h-6 text-white" />
                 </div>
                 <h3 className="text-xl font-bold text-surface-900">Upload to Session</h3>
              </div>
              <FileUploader 
                sessionId={currentSessionId} 
                onUploadStart={async () => {
                  if (!currentSessionId) {
                    const session = await createChatSession('New Workspace');
                    return session.id;
                  }
                  return currentSessionId;
                }}
                onUploadComplete={async (result, newSessionId) => {
                  // Trigger global document list refresh
                  onDocumentsChange?.();
                  
                  if (!currentSessionId && newSessionId) {
                    setCurrentSessionId(newSessionId);
                    onSessionChange?.(newSessionId);
                  } else if (currentSessionId) {
                    // Refresh if we were already in a session to show the "Document Indexed" message
                    fetchMessages(currentSessionId);
                  }
                }} 
              />
            </div>

            {/* Template pills */}
            <div className="flex flex-wrap justify-center gap-3">
              {Object.entries(DOC_TYPE_META).map(([type, meta]) => (
                <span
                  key={type}
                  className={`px-4 py-2 rounded-full text-sm font-bold bg-surface-100 ${meta.color} shadow-sm`}
                >
                  {meta.emoji} {meta.label}
                </span>
              ))}
            </div>

            {/* Suggestion chips */}
            <div className="flex gap-3 mt-8 flex-wrap justify-center">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="
                    px-5 py-3 rounded-xl text-sm font-bold
                    bg-surface-50 text-surface-600 hover:text-surface-900 hover:bg-surface-100
                    border border-surface-200 transition-all duration-200 shadow-sm
                    hover:shadow-md hover:-translate-y-0.5
                  "
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex gap-3 animate-fade-in-up ${
              msg.role === 'user' ? 'justify-end' : 'justify-start'
            }`}
          >
            {msg.role === 'assistant' && (
              <div className="shrink-0 mt-1">
                <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
            )}

            <div
              className={`max-w-[78%] ${
                msg.role === 'user'
                  ? 'bg-surface-100 text-surface-900 rounded-3xl rounded-br-md px-6 py-4'
                  : msg.error
                    ? 'bg-accent-rose/10 border border-accent-rose/20 rounded-3xl rounded-bl-md px-6 py-4'
                    : 'bg-white border border-surface-200 rounded-3xl rounded-bl-md px-6 py-5 shadow-sm'
              }`}
            >
              {/* Template tag */}
              {msg.role === 'assistant' && !msg.error && msg.docType && (
                <div className="mb-2">
                  <TemplateTag docType={msg.docType} />
                </div>
              )}

              {msg.role === 'user' ? (
                <p className="text-surface-900 leading-relaxed font-medium">{msg.content}</p>
              ) : (
                <div className="message-content text-surface-700 leading-relaxed text-[0.935rem]">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              )}

              {/* Citations */}
              {msg.citations?.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-surface-100">
                  {msg.citations.map((citation, j) => (
                    <CitationChip key={j} citation={citation} index={j} onClick={setSelectedCitation} />
                  ))}
                </div>
              )}
            </div>

            {msg.role === 'user' && (
              <div className="shrink-0 mt-1">
                <div className="w-8 h-8 rounded-xl bg-surface-300 flex items-center justify-center">
                  <MessageCircle className="w-4 h-4 text-surface-700" />
                </div>
              </div>
            )}
          </div>
        ))}

        {/* Loading indicator */}
        {loading && (
          <div className="flex gap-3 animate-fade-in-up">
            <div className="shrink-0 mt-1">
              <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles className="w-4 h-4 text-white animate-pulse-soft" />
              </div>
            </div>
            <div className="bg-surface-50 border border-surface-200 rounded-2xl rounded-bl-md px-5 py-4 shadow-sm">
              <div className="flex items-center gap-2 text-surface-500">
                <Loader2 className="w-4 h-4 animate-spin text-primary-500" />
                <span className="text-sm font-medium">Searching corpus & generating answer...</span>
              </div>
              <div className="mt-3 h-2 w-48 rounded-full shimmer" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 sm:px-8 pb-8 pt-4 bg-white">
        <form onSubmit={handleSubmit} className="relative max-w-4xl mx-auto flex items-center">
          <button
            type="button"
            className="absolute left-3 p-2.5 rounded-full text-surface-400 hover:bg-surface-100 hover:text-surface-600 transition-colors z-10"
          >
            <Paperclip className="w-5 h-5" />
          </button>
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question about your documents..."
            className="
              w-full pl-14 pr-16 py-4 rounded-full
              bg-surface-50 border border-surface-200 shadow-sm
              text-surface-900 placeholder:text-surface-400 font-medium
              focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10
              transition-all duration-200 text-base
            "
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="
              absolute right-2 top-1/2 -translate-y-1/2
              p-2.5 rounded-full
              bg-primary-500
              hover:bg-primary-600
              disabled:opacity-30 disabled:cursor-not-allowed
              transition-all duration-200
              shadow-md shadow-primary-500/20
            "
          >
            <Send className="w-5 h-5 text-white" />
          </button>
        </form>
      </div>
    </div>

    {/* ── Slide-out PDF Drawer ── */}
    {selectedCitation && (
      <div className="w-1/3 h-full bg-surface-50 flex flex-col shrink-0 border-l border-surface-200 animate-fade-in-up">
        <div className="h-16 flex items-center justify-between px-6 border-b border-surface-200 bg-white shrink-0">
          <div>
             <h3 className="font-bold text-sm text-surface-900 truncate max-w-[200px]">{selectedCitation.filename}</h3>
             <p className="text-xs font-medium text-surface-500">Page {selectedCitation.page}</p>
          </div>
          <button 
            onClick={() => setSelectedCitation(null)} 
            className="p-2 rounded-full hover:bg-surface-100 text-surface-400 hover:text-surface-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="flex-1 p-4 bg-surface-100 overflow-hidden">
           <iframe 
             src={`http://localhost:8000/pdfs/${selectedCitation.doc_id}.pdf#page=${selectedCitation.page}`} 
             className="w-full h-full rounded-2xl border border-surface-200 shadow-sm bg-white"
             title="PDF Preview"
           />
        </div>
      </div>
    )}
  </div>
  );
}
