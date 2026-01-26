import { useState, useEffect } from 'react';
import { Flame, TrendingUp } from 'lucide-react';
import { cryptoApi } from '../services/cryptoApi';

export const TrendingCoins = () => {
  const [trending, setTrending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const response = await cryptoApi.getTrendingCoins();
        setTrending(response.data.trending_coins);
      } catch (error) {
        console.error('Error fetching trending coins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTrending();
    const interval = setInterval(fetchTrending, 300000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-32 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-12 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      data-testid="trending-coins-card"
      className="glass-card rounded-2xl p-6"
    >
      <h3 className="text-lg font-heading font-bold text-white mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-400" />
        Trending Now
      </h3>
      
      <div className="space-y-3">
        {trending.map((coin, index) => (
          <div 
            key={coin.id}
            data-testid={`trending-coin-${coin.id}`}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center overflow-hidden">
              {coin.thumb ? (
                <img 
                  src={coin.thumb} 
                  alt={coin.name}
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.parentElement.innerHTML = `<span class="text-cyan-400 font-bold">${coin.symbol.charAt(0)}</span>`;
                  }}
                />
              ) : (
                <span className="text-cyan-400 font-bold">{coin.symbol.charAt(0)}</span>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{coin.name}</p>
              <p className="text-muted-foreground text-xs uppercase">{coin.symbol}</p>
            </div>
            <div className="flex items-center gap-2">
              {coin.market_cap_rank && (
                <span className="text-xs text-muted-foreground">#{coin.market_cap_rank}</span>
              )}
              <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center group-hover:bg-green-500/30 transition-colors">
                <TrendingUp className="w-3 h-3 text-green-400" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrendingCoins;
