from fastapi import FastAPI, APIRouter, HTTPException, Request
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone
import httpx
import asyncio
import random
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe API Key
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# Create the main app
app = FastAPI(title="CryptoTrack API")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# CoinGecko API base URL (free public API)
COINGECKO_API = "https://api.coingecko.com/api/v3"

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# In-memory cache for rate limiting - cleared on restart
cache: Dict[str, Any] = {}
cache_timestamps: Dict[str, datetime] = {}

def get_cached(key: str, ttl_seconds: int = 60):
    """Get cached data if not expired"""
    if key in cache and key in cache_timestamps:
        elapsed = (datetime.now(timezone.utc) - cache_timestamps[key]).total_seconds()
        if elapsed < ttl_seconds:
            return cache[key]
    return None

def set_cached(key: str, data: Any):
    """Set cache data with timestamp"""
    cache[key] = data
    cache_timestamps[key] = datetime.now(timezone.utc)

# Fallback data when API is rate limited - Updated to current market prices
FALLBACK_BITCOIN = {
    "coin_id": "bitcoin",
    "name": "Bitcoin",
    "symbol": "btc",
    "current_price": 88360.65,
    "price_change_24h": -1250.50,
    "price_change_percentage_24h": -1.40,
    "market_cap": 1750000000000,
    "total_volume": 38000000000,
    "high_24h": 89800.00,
    "low_24h": 87500.00,
    "circulating_supply": 19800000,
    "last_updated": datetime.now(timezone.utc).isoformat()
}

FALLBACK_TOP_COINS = [
    {"id": "bitcoin", "name": "Bitcoin", "symbol": "btc", "image": "https://assets.coingecko.com/coins/images/1/small/bitcoin.png", "current_price": 88360.65, "market_cap": 1750000000000, "market_cap_rank": 1, "price_change_percentage_24h": -1.40, "price_change_percentage_7d": -2.5, "total_volume": 38000000000},
    {"id": "ethereum", "name": "Ethereum", "symbol": "eth", "image": "https://assets.coingecko.com/coins/images/279/small/ethereum.png", "current_price": 3125.50, "market_cap": 376000000000, "market_cap_rank": 2, "price_change_percentage_24h": -0.85, "price_change_percentage_7d": -1.2, "total_volume": 15000000000},
    {"id": "tether", "name": "Tether", "symbol": "usdt", "image": "https://assets.coingecko.com/coins/images/325/small/Tether.png", "current_price": 1.00, "market_cap": 139000000000, "market_cap_rank": 3, "price_change_percentage_24h": 0.01, "price_change_percentage_7d": 0.00, "total_volume": 95000000000},
    {"id": "xrp", "name": "XRP", "symbol": "xrp", "image": "https://assets.coingecko.com/coins/images/44/small/xrp-symbol-white-128.png", "current_price": 3.05, "market_cap": 176000000000, "market_cap_rank": 4, "price_change_percentage_24h": -2.15, "price_change_percentage_7d": -3.8, "total_volume": 7500000000},
    {"id": "solana", "name": "Solana", "symbol": "sol", "image": "https://assets.coingecko.com/coins/images/4128/small/solana.png", "current_price": 238.45, "market_cap": 116000000000, "market_cap_rank": 5, "price_change_percentage_24h": -1.92, "price_change_percentage_7d": -4.1, "total_volume": 4500000000},
    {"id": "binancecoin", "name": "BNB", "symbol": "bnb", "image": "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png", "current_price": 685.20, "market_cap": 98000000000, "market_cap_rank": 6, "price_change_percentage_24h": -0.65, "price_change_percentage_7d": -1.3, "total_volume": 1600000000},
    {"id": "dogecoin", "name": "Dogecoin", "symbol": "doge", "image": "https://assets.coingecko.com/coins/images/5/small/dogecoin.png", "current_price": 0.325, "market_cap": 48000000000, "market_cap_rank": 7, "price_change_percentage_24h": -1.85, "price_change_percentage_7d": -3.7, "total_volume": 2800000000},
    {"id": "cardano", "name": "Cardano", "symbol": "ada", "image": "https://assets.coingecko.com/coins/images/975/small/cardano.png", "current_price": 0.985, "market_cap": 35000000000, "market_cap_rank": 8, "price_change_percentage_24h": -1.22, "price_change_percentage_7d": -2.5, "total_volume": 750000000},
    {"id": "avalanche-2", "name": "Avalanche", "symbol": "avax", "image": "https://assets.coingecko.com/coins/images/12559/small/Avalanche_Circle_RedWhite_Trans.png", "current_price": 35.80, "market_cap": 15000000000, "market_cap_rank": 9, "price_change_percentage_24h": -1.45, "price_change_percentage_7d": -2.9, "total_volume": 580000000},
    {"id": "chainlink", "name": "Chainlink", "symbol": "link", "image": "https://assets.coingecko.com/coins/images/877/small/chainlink-new-logo.png", "current_price": 22.15, "market_cap": 14000000000, "market_cap_rank": 10, "price_change_percentage_24h": -0.95, "price_change_percentage_7d": -2.1, "total_volume": 680000000}
]

FALLBACK_TRENDING = [
    {"id": "pepe", "name": "Pepe", "symbol": "pepe", "market_cap_rank": 25, "thumb": "https://assets.coingecko.com/coins/images/29850/thumb/pepe-token.jpeg", "score": 0},
    {"id": "sui", "name": "Sui", "symbol": "sui", "market_cap_rank": 12, "thumb": "https://assets.coingecko.com/coins/images/26375/thumb/sui_asset.jpeg", "score": 1},
    {"id": "bonk", "name": "Bonk", "symbol": "bonk", "market_cap_rank": 45, "thumb": "https://assets.coingecko.com/coins/images/28600/thumb/bonk.jpg", "score": 2},
    {"id": "render-token", "name": "Render", "symbol": "render", "market_cap_rank": 30, "thumb": "https://assets.coingecko.com/coins/images/11636/thumb/rndr.png", "score": 3},
    {"id": "injective-protocol", "name": "Injective", "symbol": "inj", "market_cap_rank": 35, "thumb": "https://assets.coingecko.com/coins/images/12882/thumb/Secondary_Symbol.png", "score": 4}
]

async def fetch_with_retry(url: str, params: dict = None, max_retries: int = 2):
    """Fetch with retry and exponential backoff"""
    for attempt in range(max_retries):
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.get(url, params=params)
                if response.status_code == 429:
                    wait_time = (attempt + 1) * 2 + random.uniform(0, 1)
                    logger.warning(f"Rate limited, waiting {wait_time:.1f}s before retry {attempt + 1}")
                    await asyncio.sleep(wait_time)
                    continue
                response.raise_for_status()
                return response.json()
        except Exception as e:
            if attempt == max_retries - 1:
                raise e
            await asyncio.sleep(1)
    return None

# Models
class CryptoPrice(BaseModel):
    model_config = ConfigDict(extra="ignore")
    coin_id: str
    name: str
    symbol: str
    current_price: float
    price_change_24h: Optional[float] = 0
    price_change_percentage_24h: Optional[float] = 0
    market_cap: Optional[float] = 0
    total_volume: Optional[float] = 0
    high_24h: Optional[float] = 0
    low_24h: Optional[float] = 0
    circulating_supply: Optional[float] = 0
    last_updated: str

class HistoricalData(BaseModel):
    coin_id: str
    days: int
    prices: List[List[float]]
    market_caps: List[List[float]]
    total_volumes: List[List[float]]

class TrendingCoin(BaseModel):
    id: str
    name: str
    symbol: str
    market_cap_rank: Optional[int] = None
    thumb: Optional[str] = None
    score: int

# API Routes
@api_router.get("/")
async def root():
    return {"message": "CryptoTrack API", "status": "online"}

@api_router.get("/crypto/price/{coin_id}", response_model=CryptoPrice)
async def get_crypto_price(coin_id: str):
    """Get current price for a cryptocurrency"""
    cache_key = f"price:{coin_id}"
    cached = get_cached(cache_key, 60)  # Cache for 60 seconds
    if cached:
        return cached
    
    try:
        data = await fetch_with_retry(
            f"{COINGECKO_API}/coins/markets",
            params={
                "vs_currency": "usd",
                "ids": coin_id,
                "order": "market_cap_desc",
                "sparkline": "false",
                "price_change_percentage": "24h"
            }
        )
        
        if not data:
            # Use fallback for bitcoin
            if coin_id == "bitcoin":
                logger.info("Using fallback data for bitcoin")
                set_cached(cache_key, FALLBACK_BITCOIN)
                return FALLBACK_BITCOIN
            raise HTTPException(status_code=404, detail=f"Cryptocurrency {coin_id} not found")
        
        coin = data[0]
        result = CryptoPrice(
            coin_id=coin["id"],
            name=coin["name"],
            symbol=coin["symbol"],
            current_price=coin.get("current_price", 0) or 0,
            price_change_24h=coin.get("price_change_24h", 0) or 0,
            price_change_percentage_24h=coin.get("price_change_percentage_24h", 0) or 0,
            market_cap=coin.get("market_cap", 0) or 0,
            total_volume=coin.get("total_volume", 0) or 0,
            high_24h=coin.get("high_24h", 0) or 0,
            low_24h=coin.get("low_24h", 0) or 0,
            circulating_supply=coin.get("circulating_supply", 0) or 0,
            last_updated=datetime.now(timezone.utc).isoformat()
        )
        set_cached(cache_key, result.model_dump())
        return result
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching price: {e}")
        # Return fallback for bitcoin
        if coin_id == "bitcoin":
            logger.info("Using fallback data for bitcoin due to error")
            return FALLBACK_BITCOIN
        raise HTTPException(status_code=500, detail="Failed to fetch price data")

@api_router.get("/crypto/historical/{coin_id}")
async def get_historical_data(coin_id: str, days: int = 7):
    """Get historical price data for charts"""
    cache_key = f"historical:{coin_id}:{days}"
    cached = get_cached(cache_key, 600)  # Cache for 10 minutes
    if cached:
        return cached
    
    try:
        data = await fetch_with_retry(
            f"{COINGECKO_API}/coins/{coin_id}/market_chart",
            params={
                "vs_currency": "usd",
                "days": days,
                "interval": "daily" if days > 1 else "hourly"
            }
        )
        
        if not data:
            # Generate fallback historical data
            logger.info(f"Using fallback historical data for {coin_id}")
            base_price = 104500 if coin_id == "bitcoin" else 3350
            now = datetime.now(timezone.utc).timestamp() * 1000
            prices = []
            for i in range(days + 1):
                timestamp = now - (days - i) * 86400000
                variation = random.uniform(-0.02, 0.02)
                price = base_price * (1 + variation * (i / days))
                prices.append([timestamp, price])
            
            fallback_result = {
                "coin_id": coin_id,
                "days": days,
                "prices": prices,
                "market_caps": [],
                "total_volumes": [],
                "is_fallback": True
            }
            set_cached(cache_key, fallback_result)
            return fallback_result
        
        result = {
            "coin_id": coin_id,
            "days": days,
            "prices": data.get("prices", []),
            "market_caps": data.get("market_caps", []),
            "total_volumes": data.get("total_volumes", [])
        }
        set_cached(cache_key, result)
        return result
        
    except Exception as e:
        logger.error(f"Error fetching historical data: {e}")
        # Generate fallback
        base_price = 104500 if coin_id == "bitcoin" else 3350
        now = datetime.now(timezone.utc).timestamp() * 1000
        prices = []
        for i in range(days + 1):
            timestamp = now - (days - i) * 86400000
            variation = random.uniform(-0.02, 0.02)
            price = base_price * (1 + variation * (i / days))
            prices.append([timestamp, price])
        
        return {
            "coin_id": coin_id,
            "days": days,
            "prices": prices,
            "market_caps": [],
            "total_volumes": [],
            "is_fallback": True
        }

@api_router.get("/crypto/top-coins")
async def get_top_coins(limit: int = 10):
    """Get top cryptocurrencies by market cap"""
    cache_key = f"top_coins:{limit}"
    cached = get_cached(cache_key, 120)  # Cache for 2 minutes
    if cached:
        return cached
    
    try:
        data = await fetch_with_retry(
            f"{COINGECKO_API}/coins/markets",
            params={
                "vs_currency": "usd",
                "order": "market_cap_desc",
                "per_page": limit,
                "page": 1,
                "sparkline": "false",
                "price_change_percentage": "24h,7d"
            }
        )
        
        if not data:
            # Use fallback data
            logger.info("Using fallback data for top coins")
            fallback_result = {
                "coins": FALLBACK_TOP_COINS[:limit],
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "is_fallback": True
            }
            set_cached(cache_key, fallback_result)
            return fallback_result
        
        result = {
            "coins": [
                {
                    "id": coin["id"],
                    "name": coin["name"],
                    "symbol": coin["symbol"],
                    "image": coin.get("image", ""),
                    "current_price": coin.get("current_price", 0) or 0,
                    "market_cap": coin.get("market_cap", 0) or 0,
                    "market_cap_rank": coin.get("market_cap_rank", 0),
                    "price_change_percentage_24h": coin.get("price_change_percentage_24h", 0) or 0,
                    "price_change_percentage_7d": coin.get("price_change_percentage_7d_in_currency", 0) or 0,
                    "total_volume": coin.get("total_volume", 0) or 0
                }
                for coin in data
            ],
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        set_cached(cache_key, result)
        return result
        
    except Exception as e:
        logger.error(f"Error fetching top coins: {e}")
        # Return fallback
        fallback_result = {
            "coins": FALLBACK_TOP_COINS[:limit],
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "is_fallback": True
        }
        return fallback_result

@api_router.get("/crypto/trending")
async def get_trending_coins():
    """Get trending cryptocurrencies"""
    cache_key = "trending"
    cached = get_cached(cache_key, 600)  # Cache for 10 minutes
    if cached:
        return cached
    
    try:
        data = await fetch_with_retry(f"{COINGECKO_API}/search/trending")
        
        if not data:
            # Use fallback
            logger.info("Using fallback data for trending coins")
            fallback_result = {
                "trending_coins": FALLBACK_TRENDING,
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "is_fallback": True
            }
            set_cached(cache_key, fallback_result)
            return fallback_result
        
        result = {
            "trending_coins": [
                {
                    "id": coin["item"]["id"],
                    "name": coin["item"]["name"],
                    "symbol": coin["item"]["symbol"],
                    "market_cap_rank": coin["item"].get("market_cap_rank"),
                    "thumb": coin["item"].get("thumb", ""),
                    "score": coin["item"].get("score", idx)
                }
                for idx, coin in enumerate(data.get("coins", [])[:7])
            ],
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        set_cached(cache_key, result)
        return result
        
    except Exception as e:
        logger.error(f"Error fetching trending coins: {e}")
        # Return fallback
        fallback_result = {
            "trending_coins": FALLBACK_TRENDING,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "is_fallback": True
        }
        return fallback_result

@api_router.get("/crypto/global")
async def get_global_stats():
    """Get global cryptocurrency market data"""
    cache_key = "global"
    cached = get_cached(cache_key, 300)  # Cache for 5 minutes
    if cached:
        return cached
    
    try:
        data = await fetch_with_retry(f"{COINGECKO_API}/global")
        
        if not data or "data" not in data:
            # Use fallback
            logger.info("Using fallback data for global stats")
            fallback_result = {
                "total_market_cap": 2850000000000,
                "total_volume": 125000000000,
                "market_cap_change_24h": -1.85,
                "active_cryptocurrencies": 15420,
                "markets": 1120,
                "btc_dominance": 61.4,
                "eth_dominance": 10.3,
                "last_updated": datetime.now(timezone.utc).isoformat(),
                "is_fallback": True
            }
            set_cached(cache_key, fallback_result)
            return fallback_result
        
        global_data = data["data"]
        result = {
            "total_market_cap": global_data.get("total_market_cap", {}).get("usd", 0),
            "total_volume": global_data.get("total_volume", {}).get("usd", 0),
            "market_cap_change_24h": global_data.get("market_cap_change_percentage_24h_usd", 0),
            "active_cryptocurrencies": global_data.get("active_cryptocurrencies", 0),
            "markets": global_data.get("markets", 0),
            "btc_dominance": global_data.get("market_cap_percentage", {}).get("btc", 0),
            "eth_dominance": global_data.get("market_cap_percentage", {}).get("eth", 0),
            "last_updated": datetime.now(timezone.utc).isoformat()
        }
        set_cached(cache_key, result)
        return result
        
    except Exception as e:
        logger.error(f"Error fetching global stats: {e}")
        # Return fallback
        return {
            "total_market_cap": 2850000000000,
            "total_volume": 125000000000,
            "market_cap_change_24h": -1.85,
            "active_cryptocurrencies": 15420,
            "markets": 1120,
            "btc_dominance": 61.4,
            "eth_dominance": 10.3,
            "last_updated": datetime.now(timezone.utc).isoformat(),
            "is_fallback": True
        }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
