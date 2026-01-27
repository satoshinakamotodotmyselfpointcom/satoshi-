import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BitcoinHero } from "./components/BitcoinHero";
import { GlobalStats } from "./components/GlobalStats";
import { TopCoins } from "./components/TopCoins";
import { TrendingCoins } from "./components/TrendingCoins";
import { TradeActions } from "./components/TradeActions";
import { AuthModal } from "./components/AuthModal";
import { UserDashboard } from "./components/UserDashboard";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { Activity, Copy, Check, User, LogIn } from "lucide-react";
import { useState } from "react";

const BITCOIN_ADDRESS = "bc1qp6ywmsa9ylwzrw44z2mv5m37gn8s6yy5kaeqkd";

const BitcoinDonation = () => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    navigator.clipboard.writeText(BITCOIN_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div 
      data-testid="bitcoin-donation-card"
      className="glass-card rounded-2xl p-6 col-span-full"
    >
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <span className="text-xl font-bold text-white">₿</span>
          </div>
          <div>
            <h3 className="text-lg font-heading font-bold text-white">Support This Project</h3>
            <p className="text-muted-foreground text-sm">Send Bitcoin to support development</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="flex-1 sm:flex-none px-4 py-3 rounded-xl bg-black/40 border border-white/10 font-mono text-sm text-cyan-400 truncate max-w-xs sm:max-w-md">
            {BITCOIN_ADDRESS}
          </div>
          <button
            data-testid="copy-btc-address-btn"
            onClick={copyAddress}
            className={`p-3 rounded-xl transition-all ${
              copied 
                ? 'bg-green-500/20 border border-green-500/50' 
                : 'bg-white/5 border border-white/10 hover:bg-white/10'
            }`}
            title="Copy address"
          >
            {copied ? (
              <Check className="w-5 h-5 text-green-400" />
            ) : (
              <Copy className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user, loading } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  return (
    <div className="min-h-screen bg-void noise-overlay">
      {/* Background gradient effects */}
      <div className="fixed inset-0 bg-gradient-radial pointer-events-none" />
      
      {/* Header */}
      <header className="relative z-10 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center neon-glow-cyan">
              <Activity className="w-5 h-5 text-black" />
            </div>
            <div>
              <h1 className="text-xl font-heading font-black text-white">CryptoTrack</h1>
              <p className="text-xs text-muted-foreground">Real-time market data</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
              <span className="text-sm text-muted-foreground">Live</span>
            </div>
            
            {/* Auth Buttons */}
            {!loading && (
              user ? (
                <div className="flex items-center gap-2">
                  <div className="hidden sm:flex items-center gap-2 px-4 py-2 rounded-full bg-cyan-500/20 border border-cyan-500/30">
                    <User className="w-4 h-4 text-cyan-400" />
                    <span className="text-sm text-cyan-400">{user.name}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    data-testid="login-btn"
                    onClick={() => openAuth('login')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                  >
                    <LogIn className="w-4 h-4 text-white" />
                    <span className="text-sm text-white">Login</span>
                  </button>
                  <button
                    data-testid="signup-btn"
                    onClick={() => openAuth('register')}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:opacity-90 transition-opacity"
                  >
                    <User className="w-4 h-4 text-white" />
                    <span className="text-sm text-white font-medium">Sign Up</span>
                  </button>
                </div>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* User Dashboard - Show if logged in */}
          {user && <UserDashboard />}
          
          {/* Bitcoin Hero - Spans 2 columns */}
          <BitcoinHero />
          
          {/* Right Column - Global Stats */}
          <GlobalStats />
          
          {/* Trade Action Buttons */}
          <TradeActions />
          
          {/* Top Coins Table - Spans 2 columns */}
          <TopCoins />
          
          {/* Trending Coins */}
          <TrendingCoins />
          
          {/* Bitcoin Donation */}
          <BitcoinDonation />
        </div>

        {/* Footer */}
        <footer className="mt-12 pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-muted-foreground text-sm">
              Data provided by CoinGecko API. Prices update every 60 seconds.
            </p>
            <div className="flex items-center gap-4 text-muted-foreground text-sm">
              <span>Built with React & FastAPI</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

function App() {
  return (
    <div data-testid="crypto-app" className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
