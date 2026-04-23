import React, { useState } from 'react';
import { 
  Mail, 
  Lock, 
  Github, 
  Twitter, 
  Briefcase, 
  ArrowRight,
  Eye,
  EyeOff
} from 'lucide-react';

import api from '../api';

interface LoginProps {
  onLogin: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);
    
    try {
      if (isRegister) {
        await api.auth.register({ username: email, password });
        setSuccess('Registration successful! You can now sign in.');
        setIsRegister(false);
      } else {
        const data = await api.auth.login({ username: email, password });
        localStorage.setItem('protrack_token', data.token);
        onLogin(data.user);
      }
    } catch (err: any) {
      setError(err.message || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-brand-100 via-slate-50 to-slate-50">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-brand-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-brand-200 mx-auto mb-6">
            <Briefcase size={32} />
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 tracking-tight">
            {isRegister ? 'Create Account' : 'Welcome back'}
          </h1>
          <p className="text-slate-500">
            {isRegister ? 'Join ProTrack to start managing projects.' : 'Sign in to your ProTrack account to continue.'}
          </p>
        </div>

        <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
          {error && (
            <div className="mb-6 p-3 bg-red-50 border border-red-100 text-red-600 text-sm font-medium rounded-xl">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-100 text-emerald-600 text-sm font-medium rounded-xl">
              {success}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-700 ml-1">Email Address</label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                <input 
                  type="text" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com" 
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-bold text-slate-700">Password</label>
                {!isRegister && <button type="button" className="text-xs font-bold text-brand-600 hover:underline">Forgot password?</button>}
              </div>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-500 transition-colors" size={18} />
                <input 
                  type={showPassword ? "text" : "password"} 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••" 
                  className="w-full pl-12 pr-12 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all"
                  required
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-brand-600 text-white py-3.5 rounded-xl font-bold shadow-lg shadow-brand-200 hover:bg-brand-700 hover:shadow-xl transition-all flex items-center justify-center gap-2 group disabled:opacity-50"
            >
              {loading ? (isRegister ? 'Creating Account...' : 'Signing In...') : (isRegister ? 'Register' : 'Sign In')}
              {!loading && <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />}
            </button>
          </form>
          
          {/* Social login and footer... */}
        </div>

        <p className="text-center mt-8 text-slate-500 text-sm">
          {isRegister ? 'Already have an account?' : "Don't have an account?"} 
          <button 
            onClick={() => { setIsRegister(!isRegister); setError(null); setSuccess(null); }}
            className="text-brand-600 font-bold hover:underline ml-1"
          >
            {isRegister ? 'Sign In' : 'Create an account'}
          </button>
        </p>
      </div>
    </div>
  );
};

export default Login;
