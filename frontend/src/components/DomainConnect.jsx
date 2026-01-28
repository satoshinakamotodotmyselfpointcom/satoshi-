import { useState } from 'react';
import { Globe, ExternalLink, Copy, Check, Cloud, Server, Link2 } from 'lucide-react';

const APP_URL = "https://btc-exchange-7.preview.emergentagent.com";

export const DomainConnect = () => {
  const [copied, setCopied] = useState(false);

  const copyUrl = () => {
    navigator.clipboard.writeText(APP_URL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const domainProviders = [
    {
      name: "Cloudflare",
      logo: "☁️",
      color: "from-orange-500 to-orange-600",
      url: "https://dash.cloudflare.com",
      description: "Free CDN & DNS"
    },
    {
      name: "GoDaddy",
      logo: "🌐",
      color: "from-green-500 to-green-600",
      url: "https://dcc.godaddy.com/manage-dns",
      description: "Domain Management"
    },
    {
      name: "Namecheap",
      logo: "🔷",
      color: "from-blue-500 to-blue-600",
      url: "https://ap.www.namecheap.com",
      description: "Domain Provider"
    },
    {
      name: "Google Domains",
      logo: "🔍",
      color: "from-red-500 to-yellow-500",
      url: "https://domains.google.com",
      description: "Google DNS"
    }
  ];

  return (
    <div className="glass-card rounded-2xl p-6">
      <h3 className="text-xl font-heading font-bold text-white mb-2 flex items-center gap-2">
        <Globe className="w-6 h-6 text-cyan-400" />
        Connect Your Domain
      </h3>
      <p className="text-muted-foreground text-sm mb-6">
        Link your custom domain to BITCOINCRYPTOWALLET
      </p>

      {/* Your App URL */}
      <div className="p-4 rounded-xl bg-black/40 border border-cyan-500/30 mb-6">
        <p className="text-muted-foreground text-xs mb-2">Your App URL (Point your domain here):</p>
        <div className="flex items-center gap-2">
          <code className="flex-1 text-cyan-400 font-mono text-sm break-all">{APP_URL}</code>
          <button
            onClick={copyUrl}
            className={`p-2 rounded-lg transition-colors ${
              copied ? 'bg-green-500/20 text-green-400' : 'bg-white/5 text-white hover:bg-white/10'
            }`}
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* DNS Instructions */}
      <div className="p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/30 mb-6">
        <p className="text-yellow-400 font-bold text-sm mb-2">📋 DNS Setup Instructions:</p>
        <ol className="text-yellow-200 text-sm space-y-1 list-decimal list-inside">
          <li>Go to your domain provider below</li>
          <li>Add a <strong>CNAME record</strong>:</li>
        </ol>
        <div className="mt-2 p-2 rounded bg-black/40 font-mono text-xs">
          <p className="text-white">Type: <span className="text-cyan-400">CNAME</span></p>
          <p className="text-white">Name: <span className="text-cyan-400">@</span> or <span className="text-cyan-400">www</span></p>
          <p className="text-white">Target: <span className="text-cyan-400">btc-exchange-7.preview.emergentagent.com</span></p>
        </div>
      </div>

      {/* Domain Provider Buttons */}
      <p className="text-white font-medium mb-3">🌐 Open Domain Provider:</p>
      <div className="grid grid-cols-2 gap-3">
        {domainProviders.map((provider) => (
          <a
            key={provider.name}
            href={provider.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-3 p-4 rounded-xl bg-gradient-to-r ${provider.color} hover:opacity-90 transition-opacity`}
          >
            <span className="text-2xl">{provider.logo}</span>
            <div className="flex-1">
              <p className="text-white font-bold">{provider.name}</p>
              <p className="text-white/70 text-xs">{provider.description}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-white" />
          </a>
        ))}
      </div>

      {/* Cloudflare Direct Link */}
      <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-orange-500/20 to-orange-600/20 border border-orange-500/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Cloud className="w-8 h-8 text-orange-400" />
            <div>
              <p className="text-white font-bold">Recommended: Cloudflare</p>
              <p className="text-orange-200 text-xs">Free SSL, CDN & DDoS Protection</p>
            </div>
          </div>
          <a
            href="https://dash.cloudflare.com"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-orange-500 text-white font-bold hover:bg-orange-600 transition-colors flex items-center gap-2"
          >
            Open Cloudflare <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    </div>
  );
};

export default DomainConnect;
