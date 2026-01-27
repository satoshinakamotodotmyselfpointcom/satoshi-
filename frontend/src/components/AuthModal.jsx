import { useState } from 'react';
import { X, Mail, Lock, User, Loader2, Eye, EyeOff, ArrowLeft, Check } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // login, register, forgot, reset
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  
  const { login, register } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
        onClose();
      } else if (mode === 'register') {
        await register(email, password, name);
        onClose();
      } else if (mode === 'forgot') {
        // Request password reset
        const response = await fetch(`${API_URL}/api/auth/forgot-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await response.json();
        if (data.reset_token) {
          setResetToken(data.reset_token);
          setSuccessMessage('Reset link sent! Check your email or use the token below.');
        } else {
          setSuccessMessage('If this email exists, a reset link has been sent.');
        }
      } else if (mode === 'reset') {
        // Reset password with token
        const response = await fetch(`${API_URL}/api/auth/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: resetToken, new_password: newPassword })
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Reset failed');
        }
        setSuccessMessage('Password reset successful! You can now login.');
        setTimeout(() => {
          setMode('login');
          setResetToken('');
          setNewPassword('');
          setSuccessMessage('');
        }, 2000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div 
        data-testid="auth-modal"
        className="glass-card rounded-2xl p-6 w-full max-w-md relative animate-fade-in"
      >
        <button
          data-testid="close-auth-modal-btn"
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        <div className="text-center mb-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-white">
            {mode === 'login' ? 'Welcome Back' : 'Create Account'}
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            {mode === 'login' ? 'Sign in to your account' : 'Start trading crypto today'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  data-testid="auth-name-input"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                data-testid="auth-email-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-2 block">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                data-testid="auth-password-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="w-full pl-10 pr-12 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <button
            data-testid="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                {mode === 'login' ? 'Signing In...' : 'Creating Account...'}
              </>
            ) : (
              mode === 'login' ? 'Sign In' : 'Create Account'
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-muted-foreground text-sm">
            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
            <button
              data-testid="auth-toggle-mode-btn"
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
              }}
              className="text-cyan-400 hover:text-cyan-300 ml-1 font-medium"
            >
              {mode === 'login' ? 'Sign Up' : 'Sign In'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthModal;
