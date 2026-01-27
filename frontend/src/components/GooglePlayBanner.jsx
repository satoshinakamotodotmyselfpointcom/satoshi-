import { useState } from 'react';
import { Smartphone, Star, Download, ExternalLink, X } from 'lucide-react';

export const GooglePlayBanner = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div 
      data-testid="google-play-banner"
      className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-green-600 via-green-500 to-emerald-500 p-6 col-span-full"
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-40 h-40 bg-white rounded-full -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-60 h-60 bg-white rounded-full translate-x-1/3 translate-y-1/3"></div>
      </div>

      <button
        onClick={() => setDismissed(true)}
        className="absolute top-4 right-4 p-1 rounded-full hover:bg-white/20 transition-colors"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      <div className="relative flex flex-col md:flex-row items-center gap-6">
        {/* App Icon */}
        <div className="flex-shrink-0">
          <div className="w-20 h-20 rounded-2xl bg-white shadow-xl flex items-center justify-center">
            <span className="text-3xl font-black text-green-600">₿</span>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wide">
              Coming Soon
            </span>
          </div>
          <h3 className="text-2xl font-heading font-black text-white mb-1">
            BITCOINCRYPTOWALLET
          </h3>
          <p className="text-green-100 text-sm mb-3">
            Real blockchain wallets • Buy & sell crypto worldwide • 98% withdrawal
          </p>
          
          {/* Rating */}
          <div className="flex items-center justify-center md:justify-start gap-1 mb-4">
            {[1,2,3,4,5].map((star) => (
              <Star key={star} className="w-4 h-4 text-yellow-300 fill-yellow-300" />
            ))}
            <span className="text-white text-sm ml-2">4.9 • Finance App</span>
          </div>
        </div>

        {/* CTA Button */}
        <div className="flex-shrink-0">
          <a
            href="https://play.google.com/store/apps/details?id=com.aczinvestments.bitcoincryptoapp"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 px-6 py-4 bg-black rounded-xl hover:bg-gray-900 transition-colors group"
          >
            <div className="flex flex-col items-start">
              <span className="text-gray-400 text-xs">GET IT ON</span>
              <span className="text-white font-bold text-lg">Google Play</span>
            </div>
            <Download className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
          </a>
        </div>
      </div>

      {/* Features */}
      <div className="relative mt-6 pt-6 border-t border-white/20 grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
        <div>
          <p className="text-white font-bold text-lg">Real</p>
          <p className="text-green-100 text-xs">Blockchain Wallets</p>
        </div>
        <div>
          <p className="text-white font-bold text-lg">Instant</p>
          <p className="text-green-100 text-xs">Buy & Sell</p>
        </div>
        <div>
          <p className="text-white font-bold text-lg">98%</p>
          <p className="text-green-100 text-xs">Withdrawal Payout</p>
        </div>
        <div>
          <p className="text-white font-bold text-lg">Worldwide</p>
          <p className="text-green-100 text-xs">Available Globally</p>
        </div>
      </div>
    </div>
  );
};

export default GooglePlayBanner;
