import { useState } from 'react';
import { Globe, CreditCard, Smartphone, Shield, Zap, Users, TrendingUp, Check } from 'lucide-react';

export const WorldwideAds = () => {
  return (
    <div 
      data-testid="worldwide-ads"
      className="col-span-full space-y-6"
    >
      {/* Main Hero Ad */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-8">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-32 h-32 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-48 h-48 bg-yellow-300 rounded-full blur-3xl"></div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-6 h-6 text-white" />
            <span className="text-white/80 text-sm font-medium">Available Worldwide</span>
          </div>
          
          <h2 className="text-3xl md:text-4xl font-heading font-black text-white mb-4">
            Buy Bitcoin & Crypto<br />
            <span className="text-yellow-300">Anywhere in the World</span>
          </h2>
          
          <p className="text-white/80 text-lg mb-6 max-w-xl">
            Join millions of users trading crypto securely. Real blockchain wallets, instant transactions, competitive rates.
          </p>

          <div className="flex flex-wrap gap-4 mb-8">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <CreditCard className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Credit Card</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <Shield className="w-4 h-4 text-white" />
              <span className="text-white text-sm">Bank Transfer</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full">
              <Zap className="w-4 h-4 text-white" />
              <span className="text-white text-sm">iDEAL</span>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6">
            <div>
              <p className="text-3xl font-black text-white">50M+</p>
              <p className="text-white/60 text-sm">Users Worldwide</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">190+</p>
              <p className="text-white/60 text-sm">Countries</p>
            </div>
            <div>
              <p className="text-3xl font-black text-white">$10B+</p>
              <p className="text-white/60 text-sm">Trading Volume</p>
            </div>
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-xl p-6 hover:bg-white/10 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6 text-cyan-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Secure & Trusted</h3>
          <p className="text-muted-foreground text-sm">
            Real blockchain wallets with enterprise-grade security. Your keys, your crypto.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 hover:bg-white/10 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-green-500/20 flex items-center justify-center mb-4">
            <Zap className="w-6 h-6 text-green-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Instant Transactions</h3>
          <p className="text-muted-foreground text-sm">
            Buy, sell, and swap crypto in seconds. Real-time blockchain verification.
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 hover:bg-white/10 transition-colors">
          <div className="w-12 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center mb-4">
            <TrendingUp className="w-6 h-6 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Best Rates</h3>
          <p className="text-muted-foreground text-sm">
            Competitive exchange rates. Only 2% fee on withdrawals - you keep 98%.
          </p>
        </div>
      </div>

      {/* Trust Badges */}
      <div className="glass-card rounded-xl p-6">
        <p className="text-center text-muted-foreground text-sm mb-4">Trusted Payment Partners</p>
        <div className="flex flex-wrap items-center justify-center gap-8 opacity-60">
          <span className="text-white font-bold">VISA</span>
          <span className="text-white font-bold">Mastercard</span>
          <span className="text-white font-bold">iDEAL</span>
          <span className="text-white font-bold">Stripe</span>
          <span className="text-white font-bold">blockchain.info</span>
        </div>
      </div>
    </div>
  );
};

export default WorldwideAds;
