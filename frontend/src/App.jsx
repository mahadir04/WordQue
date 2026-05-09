import { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FolderKanban, Files, BarChart3, Database,
  Settings, HelpCircle, Search, Bell, MessageSquare,
  Sparkles, PanelLeftClose, PanelLeftOpen, ChevronDown,
  BookOpen, GraduationCap, Upload as UploadIcon
} from 'lucide-react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import LoginPage from './components/LoginPage';
import ProfileMenu from './components/ProfileMenu';
import ChatWindow from './components/ChatWindow';
import SummaryPanel from './components/SummaryPanel';
import TutorMode from './components/TutorMode';
import Dashboard from './components/Dashboard';
import Analytics from './components/Analytics';
import GlobalSearch from './components/GlobalSearch';
import NotificationCenter from './components/NotificationCenter';
import RightSidebar from './components/RightSidebar';
import DocumentManager from './components/DocumentManager';
import { getCorpus, healthCheck } from './services/api';

const NAV_LINKS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'chat', label: 'Workspace', icon: FolderKanban, badge: 'AI' },
  { id: 'corpus', label: 'Knowledge Base', icon: Database },
  { id: 'tutor', label: 'Tutor Mode', icon: GraduationCap },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

const SECONDARY_NAV = [
  { id: 'settings', label: 'Settings', icon: Settings },
  { id: 'support', label: 'Support', icon: HelpCircle },
];

function AppContent() {
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [documents, setDocuments] = useState([]);
  const [totalChunks, setTotalChunks] = useState(0);
  const [backendOnline, setBackendOnline] = useState(null);
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const refreshCorpus = useCallback(async () => {
    try {
      const data = await getCorpus();
      setDocuments(data.documents);
      setTotalChunks(data.total_chunks);
    } catch {
      // Backend might not be ready
    }
  }, []);

  useEffect(() => {
    healthCheck()
      .then(() => { setBackendOnline(true); refreshCorpus(); })
      .catch(() => setBackendOnline(false));
  }, [refreshCorpus]);

  const handleSessionChange = (newSessionId) => {
    setActiveSessionId(newSessionId);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-docu-bg">
        <div className="text-center animate-fade-in-up">
          <div className="p-4 rounded-3xl bg-primary-100 inline-flex mb-4">
            <Sparkles className="w-8 h-8 text-primary-500 animate-pulse" />
          </div>
          <p className="text-surface-500 text-sm font-semibold tracking-tight">Initializing WordQue...</p>
        </div>
      </div>
    );
  }

  if (!user) return <LoginPage />;

  return (
    <div className="flex h-screen overflow-hidden bg-docu-bg text-surface-900 font-sans">
      {/* ── Mobile Sidebar Overlay ─────────────────────── */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden transition-opacity duration-300"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* ── Sidebar ────────────────────────────────────── */}
      <aside
        className={`
          fixed lg:relative z-50 lg:z-auto
          shrink-0 flex flex-col h-full
          bg-docu-sidebar border-r border-white/5
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? 'w-64 translate-x-0' : 'w-0 -translate-x-full lg:w-64 lg:translate-x-0'}
        `}
      >
        <div className="flex flex-col h-full overflow-hidden transition-opacity duration-300">
          {/* Brand */}
          <div className="p-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-white tracking-tighter flex items-center gap-1">
                  WordQue<span className="text-primary-400">AI</span>
                </h1>
                <p className="text-[10px] text-surface-500 uppercase font-bold tracking-widest leading-none">Intelligence Dashboard</p>
              </div>
            </div>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-4 py-4 space-y-1">
            {NAV_LINKS.map((link) => {
              const Icon = link.icon;
              const isActive = activeTab === link.id;
              return (
                <button
                  key={link.id}
                  onClick={() => setActiveTab(link.id)}
                  className={`
                    w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200
                    ${isActive 
                      ? 'bg-white/5 text-white' 
                      : 'text-surface-500 hover:text-surface-200 hover:bg-white/5'}
                  `}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isActive ? 'text-primary-400' : 'text-inherit'}`} />
                    <span className="text-sm font-semibold">{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="px-1.5 py-0.5 rounded-md bg-primary-500/20 text-[10px] font-black text-primary-400 border border-primary-500/20">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Secondary Nav */}
          <div className="px-4 py-6 space-y-1 border-t border-white/5">
            {SECONDARY_NAV.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-surface-500 hover:text-surface-200 hover:bg-white/5 transition-all duration-200"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm font-semibold">{link.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* ── Main Area ──────────────────────────────────── */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="h-20 shrink-0 flex items-center justify-between px-4 sm:px-8 bg-white border-b border-surface-200">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl text-surface-400 hover:bg-surface-100 transition-colors"
            >
              {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            {/* Search */}
            <GlobalSearch />
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex items-center gap-1 sm:gap-2 pr-2 sm:pr-4 border-r border-surface-200">
              <NotificationCenter />
              <button 
                onClick={() => setRightSidebarOpen(true)}
                className="p-2 rounded-xl text-surface-500 hover:bg-surface-100 transition-colors hidden sm:block"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-center gap-3 pl-2">
              <ProfileMenu />
            </div>
          </div>
        </header>

        {/* Right Sidebar Overlay */}
        {rightSidebarOpen && (
          <div 
            className="fixed inset-0 bg-black/10 backdrop-blur-[1px] z-[55] transition-opacity duration-300"
            onClick={() => setRightSidebarOpen(false)}
          />
        )}
        <RightSidebar isOpen={rightSidebarOpen} onClose={() => setRightSidebarOpen(false)} />

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto bg-docu-bg px-4 sm:px-8 py-6 sm:py-8">
          <div className="max-w-[1440px] mx-auto h-full">
            {activeTab === 'dashboard' && <Dashboard documents={documents} setActiveTab={setActiveTab} />}
            
            {activeTab === 'chat' && (
              <div className="h-full bg-white rounded-[2.5rem] border border-surface-200 shadow-sm overflow-hidden flex flex-col">
                 <ChatWindow
                  sessionId={activeSessionId}
                  onSessionChange={handleSessionChange}
                  onDocumentsChange={refreshCorpus}
                />
              </div>
            )}

            {activeTab === 'corpus' && (
              <div className="h-full bento-card flex flex-col">
                 <div className="mb-6 flex items-center justify-between">
                    <h3 className="text-2xl font-bold text-surface-900">Knowledge Base Management</h3>
                    <div className="px-3 py-1 rounded-full bg-primary-100 text-primary-600 text-xs font-black">
                       {documents.length} Files Protected
                    </div>
                 </div>
                 <div className="flex-1 overflow-y-auto pr-2">
                    <DocumentManager documents={documents} onDocumentsChange={refreshCorpus} />
                    <SummaryPanel documents={documents} />
                 </div>
              </div>
            )}

            {activeTab === 'analytics' && (
              <div className="h-full">
                <Analytics />
              </div>
            )}

            {activeTab === 'tutor' && (
              <div className="h-full flex flex-col">
                <TutorMode documents={documents} />
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
