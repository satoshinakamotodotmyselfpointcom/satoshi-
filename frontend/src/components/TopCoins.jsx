import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ChevronRight } from 'lucide-react';
import { cryptoApi } from '../services/cryptoApi';
import { ScrollArea } from '../components/ui/scroll-area';

export const TopCoins = () => {
  const [coins, setCoins] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        const response = await cryptoApi.getTopCoins(10);
        setCoins(response.data.coins);
      } catch (error) {
        console.error('Error fetching top coins:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoins();
    const interval = setInterval(fetchCoins, 60000);
    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price) => {
    if (price >= 1000) {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    }
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: price < 1 ? 6 : 2
    }).format(price);
  };

  const formatMarketCap = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(1)}M`;
    return `$${num.toLocaleString()}`;
  };

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-6 col-span-full lg:col-span-2 animate-pulse">
        <div className="h-6 bg-white/10 rounded w-40 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-white/10 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div 
      data-testid="top-coins-card"
      className="glass-card rounded-2xl p-6 col-span-full lg:col-span-2"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-heading font-bold text-white">Top Cryptocurrencies</h3>
        <span className="text-muted-foreground text-sm">By Market Cap</span>
      </div>

      <ScrollArea className="h-[420px]">
        <div className="space-y-2">
          {/* Header Row */}
          <div className="grid grid-cols-12 gap-2 px-4 py-2 text-xs text-muted-foreground uppercase tracking-wider">
            <div className="col-span-1">#</div>
            <div className="col-span-4">Coin</div>
            <div className="col-span-3 text-right">Price</div>
            <div className="col-span-2 text-right">24h</div>
            <div className="col-span-2 text-right hidden sm:block">Market Cap</div>
          </div>

          {/* Coin Rows */}
          {coins.map((coin, index) => {
            const isPositive = coin.price_change_percentage_24h >= 0;
            return (
              <div 
                key={coin.id}
                data-testid={`coin-row-${coin.id}`}
                className="grid grid-cols-12 gap-2 items-center px-4 py-3 rounded-xl crypto-table-row group cursor-pointer"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div className="col-span-1 text-muted-foreground font-mono text-sm">
                  {coin.market_cap_rank}
                </div>
                <div className="col-span-4 flex items-center gap-3">
                  <img 
                    src={coin.image} 
                    alt={coin.name}
                    className="w-8 h-8 rounded-full"
                    onError={(e) => {
                      e.target.src = `https://via.placeholder.com/32/1a1a1a/06B6D4?text=${coin.symbol.charAt(0)}`;
                    }}
                  />
                  <div className="truncate">
                    <p className="text-white font-medium text-sm truncate">{coin.name}</p>
                    <p className="text-muted-foreground text-xs uppercase">{coin.symbol}</p>
                  </div>
                </div>
                <div className="col-span-3 text-right">
                  <p className="text-white font-mono text-sm">{formatPrice(coin.current_price)}</p>
                </div>
                <div className="col-span-2 text-right">
                  <div className={`flex items-center justify-end gap-1 font-mono text-sm ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    <span>{Math.abs(coin.price_change_percentage_24h).toFixed(1)}%</span>
                  </div>
                </div>
                <div className="col-span-2 text-right hidden sm:block">
                  <p className="text-muted-foreground font-mono text-sm">{formatMarketCap(coin.market_cap)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
};

export default TopCoins;
