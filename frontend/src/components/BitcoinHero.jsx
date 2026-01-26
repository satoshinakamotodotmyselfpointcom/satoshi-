import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import { cryptoApi } from '../services/cryptoApi';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

export const BitcoinHero = () => {
  const [bitcoinData, setBitcoinData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState(7);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [priceRes, historicalRes] = await Promise.all([
        cryptoApi.getPrice('bitcoin'),
        cryptoApi.getHistoricalData('bitcoin', timeframe)
      ]);
      
      setBitcoinData(priceRes.data);
      
      // Format chart data
      const formattedChart = historicalRes.data.prices.map(([timestamp, price]) => ({
        date: new Date(timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        price: price,
        timestamp
      }));
      setChartData(formattedChart);
    } catch (error) {
      console.error('Error fetching Bitcoin data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [timeframe]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  };

  const formatLargeNumber = (num) => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    return `$${num.toLocaleString()}`;
  };

  const isPositive = bitcoinData?.price_change_percentage_24h >= 0;

  if (loading) {
    return (
      <div className="glass-card rounded-2xl p-8 col-span-full lg:col-span-2 animate-pulse">
        <div className="h-8 bg-white/10 rounded w-48 mb-4"></div>
        <div className="h-16 bg-white/10 rounded w-64 mb-8"></div>
        <div className="h-64 bg-white/10 rounded"></div>
      </div>
    );
  }

  return (
    <div 
      data-testid="bitcoin-hero-card"
      className="glass-card rounded-2xl p-6 lg:p-8 col-span-full lg:col-span-2 neon-glow-cyan relative overflow-hidden"
    >
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">₿</span>
            </div>
            <div>
              <h2 className="text-2xl font-heading font-bold text-white">Bitcoin</h2>
              <span className="text-muted-foreground font-mono text-sm">BTC</span>
            </div>
          </div>
          
          <button 
            data-testid="refresh-bitcoin-btn"
            onClick={handleRefresh}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            disabled={refreshing}
          >
            <RefreshCw className={`w-5 h-5 text-muted-foreground ${refreshing ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Price Display */}
        <div className="mb-6">
          <div className="flex items-end gap-4 flex-wrap">
            <span 
              data-testid="bitcoin-price"
              className="text-4xl lg:text-5xl font-heading font-black text-white neon-text-cyan"
            >
              {formatPrice(bitcoinData?.current_price || 0)}
            </span>
            <div 
              data-testid="bitcoin-change"
              className={`flex items-center gap-1 text-lg font-mono ${isPositive ? 'text-neon-green' : 'text-neon-red'}`}
            >
              {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
              <span>{isPositive ? '+' : ''}{bitcoinData?.price_change_percentage_24h?.toFixed(2)}%</span>
            </div>
          </div>
          <p className="text-muted-foreground text-sm mt-2">24h Change</p>
        </div>

        {/* Timeframe Selector */}
        <div className="flex gap-2 mb-4">
          {[1, 7, 30, 90].map((days) => (
            <button
              key={days}
              data-testid={`timeframe-${days}d-btn`}
              onClick={() => setTimeframe(days)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                timeframe === days 
                  ? 'bg-cyan-500 text-black' 
                  : 'bg-white/5 text-white hover:bg-white/10'
              }`}
            >
              {days}D
            </button>
          ))}
        </div>

        {/* Chart */}
        <div data-testid="bitcoin-chart" className="h-64 mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#06B6D4" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
              />
              <YAxis 
                domain={['dataMin', 'dataMax']}
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#888', fontSize: 12 }}
                tickFormatter={(value) => `$${(value / 1000).toFixed(0)}k`}
                width={60}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#0A0A0A', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value) => [formatPrice(value), 'Price']}
              />
              <Area 
                type="monotone" 
                dataKey="price" 
                stroke="#06B6D4" 
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10">
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Market Cap</p>
            <p className="font-mono text-white">{formatLargeNumber(bitcoinData?.market_cap || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">24h Volume</p>
            <p className="font-mono text-white">{formatLargeNumber(bitcoinData?.total_volume || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">24h High</p>
            <p className="font-mono text-neon-green">{formatPrice(bitcoinData?.high_24h || 0)}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">24h Low</p>
            <p className="font-mono text-neon-red">{formatPrice(bitcoinData?.low_24h || 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BitcoinHero;
