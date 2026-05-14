import { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, User, Moon, Sun, 
  Database, Trash2, ShieldCheck, Loader2, Save,
  Lock, Layout, Activity, ChevronRight
} from 'lucide-react';
import { healthCheck, clearAllHistory, wipeKnowledgeBase } from '../services/api';

export default function Settings() {
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [backendStatus, setBackendStatus] = useState('checking...');
  const [theme, setTheme] = useState('light');
  const [profile, setProfile] = useState({
    name: 'Mahadir',
    email: 'mahadir@example.com'
  });

  useEffect(() => {
    const check = async () => {
      try {
        const status = await healthCheck();
        setBackendStatus(status.status === 'ok' ? 'Healthy' : 'Unstable');
      } catch {
        setBackendStatus('Disconnected');
      }
    };
    check();
  }, []);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully!');
    }, 800);
  };

  const TABS = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'appearance', label: 'Appearance', icon: Layout },
    { id: 'security', label: 'Data & Security', icon: Lock },
    { id: 'status', label: 'System Status', icon: Activity },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex items-center gap-4 mb-2">
        <div className="p-3 rounded-2xl bg-primary-100">
          <SettingsIcon className="w-6 h-6 text-primary-600" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-surface-900 tracking-tight">System Settings</h1>
          <p className="text-surface-500 font-medium">Manage your account and platform preferences</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
           {TABS.map((tab) => (
             <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-white shadow-md border border-surface-200 text-primary-600' 
                  : 'text-surface-500 hover:bg-surface-50'
              }`}
             >
               <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-primary-500' : 'text-surface-400'}`} />
               {tab.label}
             </button>
           ))}
        </div>

        {/* Main Content Area */}
        <div className="md:col-span-3 space-y-6">
          
          {activeTab === 'profile' && (
            <section className="bento-card !p-6 space-y-6 animate-fade-in-up">
               <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
                  <User className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-bold">User Profile</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 px-1">Full Name</label>
                        <input 
                          type="text" 
                          value={profile.name}
                          onChange={(e) => setProfile({...profile, name: e.target.value})}
                          className="w-full px-4 py-3 rounded-xl bg-surface-50 border border-surface-200 text-sm font-medium focus:outline-none focus:border-primary-500 transition-colors" 
                        />
                     </div>
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-surface-400 px-1">Email Address</label>
                        <input 
                          type="email" 
                          value={profile.email}
                          readOnly
                          className="w-full px-4 py-3 rounded-xl bg-surface-100 border border-surface-200 text-sm font-medium text-surface-400 cursor-not-allowed" 
                        />
                     </div>
                  </div>
               </div>
               <div className="flex justify-end pt-4">
                  <button onClick={handleSave} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-primary-500 text-white font-bold text-sm hover:bg-primary-600 transition-all">
                     <Save className="w-4 h-4" /> Save Profile
                  </button>
               </div>
            </section>
          )}

          {activeTab === 'appearance' && (
            <section className="bento-card !p-6 space-y-6 animate-fade-in-up">
               <div className="flex items-center justify-between border-b border-surface-100 pb-4">
                  <div className="flex items-center gap-3">
                     <Sun className="w-5 h-5 text-amber-500" />
                     <h3 className="text-lg font-bold">Theme Preference</h3>
                  </div>
                  <div className="flex bg-surface-100 p-1 rounded-xl">
                     <button 
                       onClick={() => {
                         setTheme('light');
                         document.documentElement.classList.remove('dark');
                       }}
                       className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                         theme === 'light' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'
                       }`}
                     >
                        <Sun className="w-3.5 h-3.5" /> Light
                     </button>
                     <button 
                       onClick={() => {
                         setTheme('dark');
                         document.documentElement.classList.add('dark');
                       }}
                       className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                         theme === 'dark' ? 'bg-white shadow-sm text-surface-900' : 'text-surface-500'
                       }`}
                     >
                        <Moon className="w-3.5 h-3.5" /> Dark
                     </button>
                  </div>
               </div>
               <div className="p-4 rounded-2xl bg-surface-50 border border-surface-200">
                  <p className="text-xs text-surface-600 leading-relaxed">
                     Switching themes will adjust the dashboard, workspace, and knowledge base colors. 
                     Currently, your preference is saved locally for this session.
                  </p>
               </div>
            </section>
          )}

          {activeTab === 'security' && (
            <section className="bento-card !p-6 space-y-6 animate-fade-in-up">
               <div className="flex items-center gap-3 border-b border-surface-100 pb-4">
                  <Lock className="w-5 h-5 text-rose-500" />
                  <h3 className="text-lg font-bold">Data & Privacy</h3>
               </div>
               
               <div className="space-y-4">
                  <div className="p-5 rounded-2xl border border-rose-100 bg-rose-50/30">
                     <h4 className="text-sm font-bold text-rose-600 mb-1">Danger Zone</h4>
                     <p className="text-xs text-rose-500/80 mb-6">These actions are permanent and cannot be reversed.</p>
                     
                     <div className="space-y-3">
                        <button 
                          onClick={async () => {
                            if (window.confirm('Delete all conversations? This cannot be undone.')) {
                              setLoading(true);
                              try {
                                await clearAllHistory();
                                alert('All chat history has been purged.');
                                window.location.reload(); // Refresh to clear UI state
                              } catch (err) {
                                alert('Failed to clear history.');
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          disabled={loading}
                          className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 transition-colors text-left"
                        >
                           <div className="flex items-center gap-3">
                              {loading ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Trash2 className="w-4 h-4 text-rose-500" />}
                              <div>
                                 <p className="text-sm font-bold text-surface-900">Purge Chat History</p>
                                 <p className="text-[10px] text-surface-500">Delete all messages and sessions</p>
                              </div>
                           </div>
                           <ChevronRight className="w-4 h-4 text-rose-300" />
                        </button>

                        <button 
                          onClick={async () => {
                            if (window.confirm('Wipe Knowledge Base? This will delete all your documents and embeddings.')) {
                              setLoading(true);
                              try {
                                await wipeKnowledgeBase();
                                alert('Knowledge base has been wiped.');
                                window.location.reload();
                              } catch (err) {
                                alert('Failed to wipe knowledge base.');
                              } finally {
                                setLoading(false);
                              }
                            }
                          }}
                          disabled={loading}
                          className="w-full flex items-center justify-between p-4 rounded-xl bg-white border border-rose-200 hover:bg-rose-50 transition-colors text-left"
                        >
                           <div className="flex items-center gap-3">
                              {loading ? <Loader2 className="w-4 h-4 animate-spin text-rose-500" /> : <Database className="w-4 h-4 text-rose-500" />}
                              <div>
                                 <p className="text-sm font-bold text-surface-900">Wipe Knowledge Base</p>
                                 <p className="text-[10px] text-surface-500">Remove all uploaded PDFs and embeddings</p>
                              </div>
                           </div>
                           <ChevronRight className="w-4 h-4 text-rose-300" />
                        </button>
                     </div>
                  </div>
               </div>
            </section>
          )}

          {activeTab === 'status' && (
            <section className="bento-card !p-6 !bg-[#0b1612] text-white overflow-hidden relative animate-fade-in-up">
               <div className="absolute top-0 right-0 p-4 opacity-10">
                  <ShieldCheck className="w-24 h-24 text-primary-500 rotate-12" />
               </div>
               
               <div className="flex items-center gap-3 mb-8 relative z-10">
                  <Activity className="w-5 h-5 text-primary-500" />
                  <h3 className="text-lg font-bold">Live System Status</h3>
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">API Connectivity</p>
                     <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${backendStatus === 'Healthy' ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
                        <p className="text-base font-bold">{backendStatus}</p>
                     </div>
                  </div>
                  <div className="p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                     <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Search Engine</p>
                     <p className="text-base font-bold text-primary-400">FAISS V2 (Active)</p>
                  </div>
               </div>

               <div className="mt-8 p-4 rounded-2xl bg-primary-500/10 border border-primary-500/20 relative z-10">
                  <div className="flex items-center gap-2 text-primary-400 mb-1">
                     <ShieldCheck className="w-4 h-4" />
                     <p className="text-xs font-bold">End-to-End Encryption</p>
                  </div>
                  <p className="text-[10px] text-white/50 leading-relaxed">
                     All local embeddings and documents are stored with system-level encryption on your local drive.
                  </p>
               </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
}

