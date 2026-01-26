import { useState } from 'react';
import { ArrowDownUp, ArrowUpRight, ArrowDownLeft, Wallet, X, Copy, Check, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';

const BITCOIN_ADDRESS = "bc1qp6ywmsa9ylwzrw44z2mv5m37gn8s6yy5kaeqkd";

export const TradeActions = () => {
  const [activeModal, setActiveModal] = useState(null);
  const [copied, setCopied] = useState(false);
  const [amount, setAmount] = useState('');
  const [fromCoin, setFromCoin] = useState('BTC');
  const [toCoin, setToCoin] = useState('ETH');

  const copyAddress = () => {
    navigator.clipboard.writeText(BITCOIN_ADDRESS);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const closeModal = () => {
    setActiveModal(null);
    setAmount('');
  };

  const formatUSD = (btcAmount) => {
    const btcPrice = 104500;
    return (parseFloat(btcAmount || 0) * btcPrice).toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD'
    });
  };

  const actions = [
    { id: 'buy', label: 'Buy', icon: ArrowDownLeft, color: 'from-green-500 to-emerald-600', shadow: 'shadow-green-500/30' },
    { id: 'sell', label: 'Sell', icon: ArrowUpRight, color: 'from-red-500 to-rose-600', shadow: 'shadow-red-500/30' },
    { id: 'swap', label: 'Swap', icon: ArrowDownUp, color: 'from-purple-500 to-violet-600', shadow: 'shadow-purple-500/30' },
    { id: 'receive', label: 'Receive', icon: Wallet, color: 'from-cyan-500 to-blue-600', shadow: 'shadow-cyan-500/30' },
  ];

  return (
    <>
      {/* Action Buttons */}
      <div 
        data-testid="trade-actions-card"
        className="glass-card rounded-2xl p-6 col-span-full"
      >
        <h3 className="text-lg font-heading font-bold text-white mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {actions.map((action) => (
            <button
              key={action.id}
              data-testid={`${action.id}-btn`}
              onClick={() => setActiveModal(action.id)}
              className={`flex flex-col items-center gap-3 p-6 rounded-2xl bg-gradient-to-br ${action.color} ${action.shadow} shadow-lg hover:scale-105 transition-transform duration-200`}
            >
              <action.icon className="w-8 h-8 text-white" />
              <span className="text-white font-bold text-lg">{action.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Modal Overlay */}
      {activeModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div 
            data-testid={`${activeModal}-modal`}
            className="glass-card rounded-2xl p-6 w-full max-w-md relative animate-fade-in"
          >
            <button
              data-testid="close-modal-btn"
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>

            {/* Buy Modal */}
            {activeModal === 'buy' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center">
                    <ArrowDownLeft className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-white">Buy Bitcoin</h2>
                    <p className="text-muted-foreground text-sm">Purchase BTC instantly</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Amount (BTC)</label>
                    <input
                      data-testid="buy-amount-input"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xl focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-muted-foreground text-sm mt-2">≈ {formatUSD(amount)}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                    <p className="text-green-400 text-sm">Current Price: $104,500.00 per BTC</p>
                  </div>

                  <a
                    data-testid="buy-coinbase-link"
                    href="https://www.coinbase.com/price/bitcoin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-bold text-lg hover:opacity-90 transition-opacity"
                  >
                    Buy on Coinbase <ExternalLink className="w-5 h-5" />
                  </a>
                  
                  <a
                    data-testid="buy-binance-link"
                    href="https://www.binance.com/en/trade/BTC_USDT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
                  >
                    Buy on Binance <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            )}

            {/* Sell Modal */}
            {activeModal === 'sell' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center">
                    <ArrowUpRight className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-white">Sell Bitcoin</h2>
                    <p className="text-muted-foreground text-sm">Convert BTC to USD</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Amount (BTC)</label>
                    <input
                      data-testid="sell-amount-input"
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xl focus:outline-none focus:border-cyan-500"
                    />
                    <p className="text-muted-foreground text-sm mt-2">You'll receive ≈ {formatUSD(amount)}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20">
                    <p className="text-red-400 text-sm">Current Price: $104,500.00 per BTC</p>
                  </div>

                  <a
                    data-testid="sell-coinbase-link"
                    href="https://www.coinbase.com/price/bitcoin"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-600 text-white font-bold text-lg hover:opacity-90 transition-opacity"
                  >
                    Sell on Coinbase <ExternalLink className="w-5 h-5" />
                  </a>
                  
                  <a
                    data-testid="sell-binance-link"
                    href="https://www.binance.com/en/trade/BTC_USDT"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
                  >
                    Sell on Binance <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            )}

            {/* Swap Modal */}
            {activeModal === 'swap' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-violet-600 flex items-center justify-center">
                    <ArrowDownUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-white">Swap Crypto</h2>
                    <p className="text-muted-foreground text-sm">Exchange between cryptocurrencies</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">From</label>
                    <div className="flex gap-2">
                      <select
                        data-testid="swap-from-select"
                        value={fromCoin}
                        onChange={(e) => setFromCoin(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="BTC">BTC</option>
                        <option value="ETH">ETH</option>
                        <option value="SOL">SOL</option>
                        <option value="USDT">USDT</option>
                      </select>
                      <input
                        data-testid="swap-amount-input"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white font-mono text-xl focus:outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-center">
                    <button 
                      onClick={() => {
                        const temp = fromCoin;
                        setFromCoin(toCoin);
                        setToCoin(temp);
                      }}
                      className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                    >
                      <ArrowDownUp className="w-5 h-5 text-purple-400" />
                    </button>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">To</label>
                    <div className="flex gap-2">
                      <select
                        data-testid="swap-to-select"
                        value={toCoin}
                        onChange={(e) => setToCoin(e.target.value)}
                        className="px-4 py-3 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-cyan-500"
                      >
                        <option value="ETH">ETH</option>
                        <option value="BTC">BTC</option>
                        <option value="SOL">SOL</option>
                        <option value="USDT">USDT</option>
                      </select>
                      <input
                        type="text"
                        readOnly
                        value={amount ? (parseFloat(amount) * 31.19).toFixed(4) : '0.00'}
                        className="flex-1 px-4 py-3 rounded-xl bg-black/60 border border-white/10 text-muted-foreground font-mono text-xl"
                      />
                    </div>
                  </div>

                  <a
                    data-testid="swap-uniswap-link"
                    href="https://app.uniswap.org/swap"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-gradient-to-r from-purple-500 to-violet-600 text-white font-bold text-lg hover:opacity-90 transition-opacity"
                  >
                    Swap on Uniswap <ExternalLink className="w-5 h-5" />
                  </a>
                  
                  <a
                    data-testid="swap-changelly-link"
                    href="https://changelly.com/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full py-4 rounded-xl bg-white/5 border border-white/10 text-white font-bold hover:bg-white/10 transition-colors"
                  >
                    Swap on Changelly <ExternalLink className="w-5 h-5" />
                  </a>
                </div>
              </div>
            )}

            {/* Receive Modal */}
            {activeModal === 'receive' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-heading font-bold text-white">Receive Bitcoin</h2>
                    <p className="text-muted-foreground text-sm">Your BTC wallet address</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* QR Code placeholder */}
                  <div className="flex justify-center p-6 bg-white rounded-2xl">
                    <div className="w-48 h-48 bg-black p-2 rounded-lg">
                      <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${BITCOIN_ADDRESS}`}
                        alt="Bitcoin QR Code"
                        className="w-full h-full"
                        data-testid="receive-qr-code"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Bitcoin Address</label>
                    <div className="flex gap-2">
                      <div className="flex-1 px-4 py-3 rounded-xl bg-black/40 border border-white/10 font-mono text-sm text-cyan-400 truncate">
                        {BITCOIN_ADDRESS}
                      </div>
                      <button
                        data-testid="copy-receive-address-btn"
                        onClick={copyAddress}
                        className={`px-4 py-3 rounded-xl transition-all ${
                          copied 
                            ? 'bg-green-500/20 border border-green-500/50' 
                            : 'bg-white/5 border border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-400" />
                        ) : (
                          <Copy className="w-5 h-5 text-white" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
                    <p className="text-cyan-400 text-sm">Only send Bitcoin (BTC) to this address. Sending other cryptocurrencies may result in permanent loss.</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default TradeActions;
