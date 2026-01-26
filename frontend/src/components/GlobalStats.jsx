import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Activity, Coins, BarChart3 } from 'lucide-react';
import { cryptoApi } from '../services/cryptoApi';

export const GlobalStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await cryptoApi.getGlobalStats();
        setStats(response.data);
      } catch (error) {
        console.error('Error fetching global stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
    const interval = setInterval(fetchStats, 120000);
    return () => clearInterval(interval);
  }, []);

  const formatLargeNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    return `$${num.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-40 mb-4"></div>
        <div className="space-y-3">
          <div className="h-16 bg-white/10 rounded"></div>
          <div className="h-16 bg-white/10 rounded"></div>
        </div>
      </div>
    );
  }

  const isPositive = stats?.market_cap_change_24h >= 0;

  return (
    <div 
      data-testid="global-stats-card"
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
        <Activity className="w-5 h-5 text-cyan-400" />
        Market Overview
      </h3>
      
      <div className="space-y-4">
        {/* Total Market Cap */}
        <div className="p-4 rounded-xl bg-white/5">
          <div className="flex items-center justify-between mb-1">
            <span className="text-muted-foreground text-sm">Total Market Cap</span>
            <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span>{isPositive ? '+' : ''}{stats?.market_cap_change_24h?.toFixed(2)}%</span>
            </div>
          </div>
          <p data-testid="total-market-cap" className="font-mono text-xl text-white font-bold">
            {formatLargeNumber(stats?.total_market_cap || 0)}
          </p>
        </div>

        {/* 24h Volume */}
        <div className="p-4 rounded-xl bg-white/5">
          <span className="text-muted-foreground text-sm block mb-1">24h Trading Volume</span>
          <p data-testid="total-volume" className="font-mono text-xl text-white font-bold">
            {formatLargeNumber(stats?.total_volume || 0)}
          </p>
        </div>

        {/* Dominance */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-gradient-to-br from-orange-500/20 to-transparent border border-orange-500/20">
            <span className="text-muted-foreground text-xs block mb-1">BTC Dominance</span>
            <p data-testid="btc-dominance" className="font-mono text-lg text-orange-400 font-bold">
              {stats?.btc_dominance?.toFixed(1)}%
            </p>
          </div>
          <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500/20 to-transparent border border-purple-500/20">
            <span className="text-muted-foreground text-xs block mb-1">ETH Dominance</span>
            <p data-testid="eth-dominance" className="font-mono text-lg text-purple-400 font-bold">
              {stats?.eth_dominance?.toFixed(1)}%
            </p>
          </div>
        </div>

        {/* Active Cryptos & Markets */}
        <div className="flex items-center justify-between pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-cyan-400" />
            <span className="text-muted-foreground text-sm">{stats?.active_cryptocurrencies?.toLocaleString()} Coins</span>
          </div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-green-400" />
            <span className="text-muted-foreground text-sm">{stats?.markets?.toLocaleString()} Markets</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GlobalStats;
