# Bitcoin Crypto App - PRD

## Original Problem Statement
Build a Bitcoin Crypto APP - Public crypto app with no authentication

## User Personas
- Crypto enthusiasts tracking Bitcoin prices
- Traders monitoring market trends
- Investors following market cap & dominance

## Core Requirements
- Live Bitcoin price display with real-time updates
- Interactive price chart with timeframe selection (1D, 7D, 30D, 90D)
- Top cryptocurrencies table by market cap
- Trending coins section
- Global market overview stats
- Dark neon theme (crypto aesthetic)
- No authentication required

## Architecture
- **Frontend**: React with Tailwind CSS, Recharts for charts
- **Backend**: FastAPI with httpx for API calls
- **Database**: MongoDB (available but not used for this MVP)
- **External API**: CoinGecko (free tier with fallback data)

## What's Been Implemented (Jan 2026)
- [x] Bitcoin Hero card with live price & 24h change
- [x] Interactive price chart with timeframe selector
- [x] Market stats (cap, volume, high/low)
- [x] Top 10 cryptocurrencies table
- [x] Trending coins section
- [x] Global market overview (total cap, BTC/ETH dominance)
- [x] Dark theme with neon cyan/green accents
- [x] Fallback data when CoinGecko rate limited
- [x] Auto-refresh every 60 seconds

## API Endpoints
- GET /api/crypto/price/{coin_id}
- GET /api/crypto/historical/{coin_id}?days=7
- GET /api/crypto/top-coins?limit=10
- GET /api/crypto/trending
- GET /api/crypto/global

## Backlog
### P0 (Critical)
- None - MVP complete

### P1 (High Priority)
- Price alerts/notifications
- Search functionality for coins
- Coin detail pages

### P2 (Nice to Have)
- Portfolio tracker
- Cryptocurrency converter
- News feed integration
- Watchlist feature

## Next Tasks
1. Add coin search functionality
2. Create individual coin detail pages
3. Implement price alerts
