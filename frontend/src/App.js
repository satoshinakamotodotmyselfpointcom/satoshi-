import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { BitcoinHero } from "./components/BitcoinHero";
import { GlobalStats } from "./components/GlobalStats";
import { TopCoins } from "./components/TopCoins";
import { TrendingCoins } from "./components/TrendingCoins";
import { Activity, Github } from "lucide-react";

const Dashboard = () => {
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
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-6 py-8">
        {/* Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bitcoin Hero - Spans 2 columns */}
          <BitcoinHero />
          
          {/* Right Column - Global Stats */}
          <GlobalStats />
          
          {/* Top Coins Table - Spans 2 columns */}
          <TopCoins />
          
          {/* Trending Coins */}
          <TrendingCoins />
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
