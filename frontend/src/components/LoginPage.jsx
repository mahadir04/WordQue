import { useState } from 'react';
import { Sparkles, Mail, Lock, User, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleLogin } from '@react-oauth/google';

export default function LoginPage() {
  const { login, register, loginWithGoogle } = useAuth();
  const [isRegister, setIsRegister] = useState(false);
  const [form, setForm] = useState({ email: '', password: '', name: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isRegister) {
        await register(form.email, form.password, form.name);
      } else {
        await login(form.email, form.password);
      }
    } catch (err) {
      const msg = err.response?.data?.detail || 'Something went wrong. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    setLoading(true);
    setError(null);
    try {
      await loginWithGoogle(credentialResponse.credential);
    } catch (err) {
      const msg = err.response?.data?.detail || 'Google sign-in failed. Please try again.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div className="min-h-screen flex w-full bg-white font-sans">
      
      {/* ── Left Side: Brand & Illustration (Hidden on Mobile) ── */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0b1612] relative overflow-hidden p-16">
        {/* Background Orbs */}
        <div className="absolute -top-[20%] -left-[10%] w-[70%] h-[70%] bg-primary-500/20 blur-[120px] rounded-full pointer-events-none" />
        <div className="absolute top-[40%] -right-[20%] w-[60%] h-[60%] bg-primary-900/40 blur-[100px] rounded-full pointer-events-none" />
        
        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary-500 flex items-center justify-center shadow-lg shadow-primary-500/20">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-2xl font-black text-white tracking-tighter">
            WordQue<span className="text-primary-500">AI</span>
          </h1>
        </div>

        {/* Abstract 3D Glassmorphism Illustration (CSS representation) */}
        <div className="relative z-10 flex-1 flex flex-col justify-center items-center my-12">
           <div className="relative w-full max-w-sm aspect-square">
             {/* Center Node */}
             <div className="absolute inset-0 m-auto w-32 h-32 bg-primary-500 rounded-full blur-[40px] opacity-60 animate-pulse" />
             
             {/* Floating Documents */}
             <div className="absolute top-[20%] left-[10%] w-32 h-40 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl -rotate-12 animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                <div className="w-12 h-2 bg-white/20 rounded-full m-4" />
                <div className="w-20 h-2 bg-white/10 rounded-full mx-4 mb-2" />
                <div className="w-16 h-2 bg-white/10 rounded-full mx-4 mb-2" />
             </div>
             
             <div className="absolute bottom-[20%] right-[10%] w-40 h-48 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl rotate-6 animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                <div className="w-8 h-8 rounded-lg bg-primary-500/30 m-5 flex items-center justify-center">
                   <Sparkles className="w-4 h-4 text-primary-400" />
                </div>
                <div className="w-24 h-2 bg-white/30 rounded-full mx-5 mb-3" />
                <div className="w-16 h-2 bg-white/20 rounded-full mx-5" />
             </div>

             {/* Connection Lines & Nodes */}
             <div className="absolute top-[40%] left-[45%] w-3 h-3 bg-primary-400 rounded-full shadow-[0_0_15px_#34d399]" />
             <div className="absolute bottom-[35%] right-[40%] w-2 h-2 bg-white rounded-full shadow-[0_0_10px_#ffffff]" />
             <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20" stroke="white" strokeWidth="1" fill="none">
               <path d="M 120 150 Q 200 100 250 220" />
             </svg>
           </div>
        </div>

        {/* Headline */}
        <div className="relative z-10">
          <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-4 animate-fade-in-up">
            Chat with <br/><span className="text-primary-400">your PDFs.</span>
          </h2>
          <p className="text-surface-400 text-lg font-medium max-w-sm animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
            The minimalist, premium AI research assistant that turns your documents into actionable insights.
          </p>
        </div>
      </div>

      {/* ── Right Side: Login Form ── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-16 relative">
        <div className="w-full max-w-md animate-fade-in-up">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2 mb-12">
            <div className="w-8 h-8 rounded-xl bg-primary-500 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-black text-surface-900 tracking-tighter">
              WordQue<span className="text-primary-500">AI</span>
            </h1>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="text-3xl sm:text-4xl font-black text-surface-900 mb-2 tracking-tight">Welcome back</h2>
            <p className="text-surface-500 font-medium">Please enter your details to sign in.</p>
          </div>

          {/* Toggle */}
          <div className="flex rounded-2xl bg-surface-50 p-1 mb-8">
            <button
              onClick={() => { setIsRegister(false); setError(null); }}
              className={`flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all duration-300 ${!isRegister
                  ? 'bg-white text-surface-900 shadow-sm border border-surface-200'
                  : 'text-surface-400 hover:text-surface-600'
                }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setIsRegister(true); setError(null); }}
              className={`flex-1 flex items-center justify-center py-3 rounded-xl text-sm font-bold transition-all duration-300 ${isRegister
                  ? 'bg-white text-surface-900 shadow-sm border border-surface-200'
                  : 'text-surface-400 hover:text-surface-600'
                }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name (register only) */}
            {isRegister && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400" />
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={set('name')}
                  className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-surface-300 shadow-sm text-surface-900 placeholder:text-surface-400 font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 text-sm"
                />
              </div>
            )}

            {/* Email */}
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="email"
                placeholder="Email address"
                value={form.email}
                onChange={set('email')}
                required
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-surface-300 shadow-sm text-surface-900 placeholder:text-surface-400 font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 text-sm"
              />
            </div>

            {/* Password */}
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-surface-400 group-focus-within:text-primary-500 transition-colors" />
              <input
                type="password"
                placeholder={isRegister ? 'Create password (6+ chars)' : 'Password'}
                value={form.password}
                onChange={set('password')}
                required
                minLength={isRegister ? 6 : 1}
                className="w-full pl-12 pr-4 py-4 rounded-xl bg-white border border-surface-300 shadow-sm text-surface-900 placeholder:text-surface-400 font-medium focus:outline-none focus:border-primary-500 focus:ring-4 focus:ring-primary-500/10 transition-all duration-200 text-sm"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-accent-rose/10 border border-accent-rose/20">
                <AlertCircle className="w-4 h-4 text-accent-rose shrink-0" />
                <p className="text-sm text-accent-rose font-bold">{error}</p>
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="
                w-full py-4 rounded-xl font-bold text-sm text-white
                bg-[#0b1612] hover:bg-[#1a2b23]
                disabled:opacity-50 disabled:cursor-not-allowed
                transition-all duration-300
                shadow-lg shadow-surface-900/10
                flex items-center justify-center gap-2 mt-2
              "
            >
              {loading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {isRegister ? 'Create Account' : 'Sign In'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-8">
            <div className="flex-1 h-px bg-surface-200"></div>
            <span className="text-xs font-black text-surface-400 uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-surface-200"></div>
          </div>

          {/* Google OAuth */}
          <div className="flex justify-center w-full">
            <GoogleLogin
              onSuccess={handleGoogleSuccess}
              onError={() => setError('Google sign-in failed. Please try again.')}
              theme="outline"
              shape="pill"
              size="large"
              text={isRegister ? "signup_with" : "signin_with"}
              width="100%"
            />
          </div>
          
          {/* Footer */}
          <p className="text-center text-surface-400 font-medium text-xs mt-12">
            By continuing, you agree to WordQue's Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
