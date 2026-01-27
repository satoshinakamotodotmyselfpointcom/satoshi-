import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Wallet, ArrowUpRight, ArrowDownLeft, History, TrendingUp, TrendingDown, RefreshCw, LogOut } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL;

// Current prices
const PRICES = {
  BTC: 88360.65,
  ETH: 3125.50,
  SOL: 238.45,
  XRP: 3.05,
  USDT: 1.00
};

export const UserDashboard = ({ onClose }) => {
  const { user, token, logout, refreshUser } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/transactions`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refreshUser(), fetchTransactions()]);
    setRefreshing(false);
  };

  const calculateTotalBalance = () => {
    if (!user?.balances) return 0;
    let total = 0;
    Object.entries(user.balances).forEach(([coin, amount]) => {
      const price = PRICES[coin] || 0;
      total += amount * price;
    });
    return total;
  };

  const formatCrypto = (amount, symbol) => {
    if (amount === 0) return '0.00';
    if (amount < 0.0001) return amount.toFixed(8);
    if (amount < 1) return amount.toFixed(6);
    return amount.toFixed(4);
  };

  const formatUSD = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div 
      data-testid="user-dashboard"
      className="glass-card rounded-2xl p-6 col-span-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
            <Wallet className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-heading font-bold text-white">{user?.name}</h2>
            <p className="text-muted-foreground text-sm">{user?.email}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            data-testid="refresh-dashboard-btn"
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            data-testid="logout-btn"
            onClick={logout}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 mb-6">
        <p className="text-muted-foreground text-sm mb-1">Total Portfolio Value</p>
        <p data-testid="total-balance" className="text-4xl font-heading font-black text-white neon-text-cyan">
          {formatUSD(calculateTotalBalance())}
        </p>
        <div className="flex gap-4 mt-4 text-sm">
          <div>
            <span className="text-muted-foreground">Deposited: </span>
            <span className="text-green-400">{formatUSD(user?.total_deposited || 0)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Withdrawn: </span>
            <span className="text-red-400">{formatUSD(user?.total_withdrawn || 0)}</span>
          </div>
        </div>
      </div>

      {/* Balances Grid */}
      <div className="mb-6">
        <h3 className="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
          <Wallet className="w-5 h-5 text-cyan-400" />
          Your Balances
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Object.entries(user?.balances || {}).map(([coin, amount]) => (
            <div
              key={coin}
              data-testid={`balance-${coin.toLowerCase()}`}
              className="p-4 rounded-xl bg-white/5 border border-white/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center">
                  <span className="text-xs font-bold text-orange-400">{coin}</span>
                </div>
                <span className="text-white font-medium">{coin}</span>
              </div>
              <p className="text-white font-mono text-lg">{formatCrypto(amount, coin)}</p>
              <p className="text-muted-foreground text-sm">{formatUSD(amount * (PRICES[coin] || 0))}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Transaction History */}
      <div>
        <h3 className="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
          <History className="w-5 h-5 text-cyan-400" />
          Transaction History
        </h3>
        
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin mx-auto" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No transactions yet</p>
            <p className="text-sm">Your purchase history will appear here</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {transactions.map((tx, index) => (
              <div
                key={tx.id || index}
                data-testid={`transaction-${index}`}
                className="flex items-center justify-between p-4 rounded-xl bg-white/5 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    tx.payment_status === 'paid' 
                      ? 'bg-green-500/20' 
                      : tx.payment_status === 'pending'
                      ? 'bg-yellow-500/20'
                      : 'bg-red-500/20'
                  }`}>
                    {tx.payment_status === 'paid' ? (
                      <ArrowDownLeft className="w-5 h-5 text-green-400" />
                    ) : (
                      <ArrowUpRight className="w-5 h-5 text-yellow-400" />
                    )}
                  </div>
                  <div>
                    <p className="text-white font-medium">
                      Buy {tx.crypto_type}
                    </p>
                    <p className="text-muted-foreground text-sm">{formatDate(tx.created_at)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-mono">{formatUSD(tx.amount)}</p>
                  <p className={`text-sm ${
                    tx.payment_status === 'paid' 
                      ? 'text-green-400' 
                      : tx.payment_status === 'pending'
                      ? 'text-yellow-400'
                      : 'text-red-400'
                  }`}>
                    {tx.payment_status === 'paid' ? 'Completed' : tx.payment_status === 'pending' ? 'Pending' : 'Failed'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UserDashboard;
