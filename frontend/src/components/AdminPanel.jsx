import { useState, useEffect } from 'react';
import { Shield, Users, CreditCard, TrendingUp, LogOut, RefreshCw, Mail, Calendar, Wallet, DollarSign, Key, Eye, EyeOff, Check, X, Copy } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const AdminPanel = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState(localStorage.getItem('adminToken'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('users');
  const [refreshing, setRefreshing] = useState(false);
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [passwordResets, setPasswordResets] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    if (token) {
      setIsLoggedIn(true);
      fetchData();
    }
  }, [token]);

  const fetchData = async () => {
    setRefreshing(true);
    try {
      const headers = { 'Authorization': `Bearer ${token}` };
      
      const [usersRes, transactionsRes, statsRes, resetsRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/users`, { headers }),
        fetch(`${API_URL}/api/admin/transactions`, { headers }),
        fetch(`${API_URL}/api/admin/stats`, { headers }),
        fetch(`${API_URL}/api/admin/password-resets`, { headers })
      ]);

      if (usersRes.ok) {
        const data = await usersRes.json();
        setUsers(data.users || []);
      }
      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }
      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }
      if (resetsRes.ok) {
        const data = await resetsRes.json();
        setPasswordResets(data.resets || []);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ new_password: newPassword })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Failed to change password');
      }

      setPasswordSuccess('Password changed successfully!');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        setShowChangePassword(false);
        setPasswordSuccess('');
      }, 2000);
    } catch (err) {
      setPasswordError(err.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/admin/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || 'Login failed');
      }

      localStorage.setItem('adminToken', data.token);
      setToken(data.token);
      setIsLoggedIn(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    setToken(null);
    setIsLoggedIn(false);
    setUsers([]);
    setTransactions([]);
    setStats(null);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount || 0);
  };

  // Login Screen
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-void flex items-center justify-center p-4">
        <div className="glass-card rounded-2xl p-8 w-full max-w-md">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center mx-auto mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-heading font-bold text-white">Admin Panel</h1>
            <p className="text-muted-foreground text-sm mt-1">Bitcoin Crypto App</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Admin Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-sm text-muted-foreground mb-2 block">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-red-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-600 text-white font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </form>

          <p className="text-center text-muted-foreground text-xs mt-6">
            <a href="/" className="text-cyan-400 hover:underline">← Back to App</a>
          </p>
        </div>
      </div>
    );
  }

  // Admin Dashboard
  return (
    <div className="min-h-screen bg-void">
      {/* Header */}
      <header className="border-b border-white/10 bg-black/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-bold text-white">Admin Panel</h1>
              <p className="text-xs text-muted-foreground">Bitcoin Crypto App</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowChangePassword(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <Key className="w-4 h-4" />
              <span className="hidden sm:inline">Change Password</span>
            </button>
            <button
              onClick={fetchData}
              disabled={refreshing}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <Users className="w-5 h-5 text-cyan-400" />
                <span className="text-muted-foreground text-sm">Total Users</span>
              </div>
              <p className="text-3xl font-heading font-bold text-white">{stats.total_users}</p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-green-400" />
                <span className="text-muted-foreground text-sm">Transactions</span>
              </div>
              <p className="text-3xl font-heading font-bold text-white">{stats.total_transactions}</p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="w-5 h-5 text-yellow-400" />
                <span className="text-muted-foreground text-sm">Total Revenue</span>
              </div>
              <p className="text-3xl font-heading font-bold text-white">{formatUSD(stats.total_revenue)}</p>
            </div>
            <div className="glass-card rounded-xl p-6">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-orange-400" />
                <span className="text-muted-foreground text-sm">Your Earnings (2%)</span>
              </div>
              <p className="text-3xl font-heading font-bold text-orange-400">{formatUSD(stats.platform_fee_earned)}</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('users')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'users'
                ? 'bg-cyan-500 text-black'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            <Users className="w-4 h-4 inline mr-2" />
            Users ({users.length})
          </button>
          <button
            onClick={() => setActiveTab('transactions')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'transactions'
                ? 'bg-cyan-500 text-black'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            <CreditCard className="w-4 h-4 inline mr-2" />
            Transactions ({transactions.length})
          </button>
          <button
            onClick={() => setActiveTab('resets')}
            className={`px-6 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'resets'
                ? 'bg-cyan-500 text-black'
                : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            <Key className="w-4 h-4 inline mr-2" />
            Password Resets ({passwordResets.length})
          </button>
        </div>

        {/* Users Table */}
        {activeTab === 'users' && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">User</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Email</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">BTC Wallet</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Joined</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Deposited</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">BTC Balance</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-12 text-muted-foreground">
                        No users registered yet
                      </td>
                    </tr>
                  ) : (
                    users.map((user, idx) => (
                      <tr key={user.id || idx} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                              <span className="text-white font-bold">{user.name?.charAt(0) || '?'}</span>
                            </div>
                            <span className="text-white font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground">{user.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-cyan-400 text-xs bg-black/40 px-2 py-1 rounded break-all">
                            {user.wallets?.BTC ? `${user.wallets.BTC.slice(0, 20)}...` : 'N/A'}
                          </code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground text-sm">{formatDate(user.created_at)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-green-400 font-mono">{formatUSD(user.total_deposited)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-orange-400 font-mono">{user.balances?.BTC?.toFixed(6) || '0.000000'} BTC</span>
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedUser(user)}
                            className="px-3 py-1 rounded-lg bg-cyan-500/20 text-cyan-400 text-sm hover:bg-cyan-500/30 transition-colors"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Transactions Table */}
        {activeTab === 'transactions' && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Date</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">User</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Amount</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Crypto</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Method</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.length === 0 ? (
                    <tr>
                      <td colSpan="6" className="text-center py-12 text-muted-foreground">
                        No transactions yet
                      </td>
                    </tr>
                  ) : (
                    transactions.map((tx, idx) => (
                      <tr key={tx.id || idx} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground text-sm">{formatDate(tx.created_at)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white">{tx.user_email || 'Guest'}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-white font-mono">{formatUSD(tx.amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-orange-400 font-mono">{tx.crypto_type}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground capitalize">{tx.payment_method}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            tx.payment_status === 'paid'
                              ? 'bg-green-500/20 text-green-400'
                              : tx.payment_status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-red-500/20 text-red-400'
                          }`}>
                            {tx.payment_status || 'unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Password Resets Table */}
        {activeTab === 'resets' && (
          <div className="glass-card rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-white/5">
                  <tr>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Email</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Reset Token</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Requested</th>
                    <th className="text-left px-6 py-4 text-muted-foreground text-sm font-medium">Expires</th>
                  </tr>
                </thead>
                <tbody>
                  {passwordResets.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center py-12 text-muted-foreground">
                        No pending password reset requests
                      </td>
                    </tr>
                  ) : (
                    passwordResets.map((reset, idx) => (
                      <tr key={idx} className="border-t border-white/5 hover:bg-white/5">
                        <td className="px-6 py-4">
                          <span className="text-white">{reset.email}</span>
                        </td>
                        <td className="px-6 py-4">
                          <code className="text-cyan-400 text-sm bg-black/40 px-2 py-1 rounded">{reset.token}</code>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground text-sm">{formatDate(reset.created_at)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-muted-foreground text-sm">{formatDate(reset.expires_at)}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Change Password Modal */}
      {showChangePassword && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-md">
            <h2 className="text-xl font-heading font-bold text-white mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-cyan-400" />
              Change Admin Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground mb-2 block">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-4 py-3 pr-12 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-white"
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="text-sm text-muted-foreground mb-2 block">Confirm New Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              {passwordError && (
                <div className="p-3 rounded-lg bg-red-500/20 border border-red-500/50">
                  <p className="text-red-400 text-sm">{passwordError}</p>
                </div>
              )}

              {passwordSuccess && (
                <div className="p-3 rounded-lg bg-green-500/20 border border-green-500/50 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <p className="text-green-400 text-sm">{passwordSuccess}</p>
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowChangePassword(false);
                    setNewPassword('');
                    setConfirmPassword('');
                    setPasswordError('');
                  }}
                  className="flex-1 py-3 rounded-xl bg-white/5 text-white font-medium hover:bg-white/10 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:opacity-90 transition-opacity"
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
