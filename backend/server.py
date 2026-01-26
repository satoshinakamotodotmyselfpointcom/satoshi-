from fastapi import FastAPI, APIRouter, HTTPException
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

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

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

# In-memory cache for rate limiting
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
    cached = get_cached(cache_key, 30)
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
                f"{COINGECKO_API}/coins/markets",
                params={
                    "vs_currency": "usd",
                    "ids": coin_id,
                    "order": "market_cap_desc",
                    "sparkline": "false",
                    "price_change_percentage": "24h"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            if not data:
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
            
    except httpx.HTTPStatusError as e:
        logger.error(f"CoinGecko API error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch price data")
    except Exception as e:
        logger.error(f"Error fetching price: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/crypto/historical/{coin_id}")
async def get_historical_data(coin_id: str, days: int = 7):
    """Get historical price data for charts"""
    cache_key = f"historical:{coin_id}:{days}"
    cached = get_cached(cache_key, 300)
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.get(
                f"{COINGECKO_API}/coins/{coin_id}/market_chart",
                params={
                    "vs_currency": "usd",
                    "days": days,
                    "interval": "daily" if days > 1 else "hourly"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            result = {
                "coin_id": coin_id,
                "days": days,
                "prices": data.get("prices", []),
                "market_caps": data.get("market_caps", []),
                "total_volumes": data.get("total_volumes", [])
            }
            set_cached(cache_key, result)
            return result
            
    except httpx.HTTPStatusError as e:
        logger.error(f"CoinGecko API error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch historical data")
    except Exception as e:
        logger.error(f"Error fetching historical data: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/crypto/top-coins")
async def get_top_coins(limit: int = 10):
    """Get top cryptocurrencies by market cap"""
    cache_key = f"top_coins:{limit}"
    cached = get_cached(cache_key, 60)
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(
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
            response.raise_for_status()
            data = response.json()
            
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
            
    except httpx.HTTPStatusError as e:
        logger.error(f"CoinGecko API error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch top coins")
    except Exception as e:
        logger.error(f"Error fetching top coins: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/crypto/trending")
async def get_trending_coins():
    """Get trending cryptocurrencies"""
    cache_key = "trending"
    cached = get_cached(cache_key, 300)
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{COINGECKO_API}/search/trending")
            response.raise_for_status()
            data = response.json()
            
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
            
    except httpx.HTTPStatusError as e:
        logger.error(f"CoinGecko API error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch trending coins")
    except Exception as e:
        logger.error(f"Error fetching trending coins: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@api_router.get("/crypto/global")
async def get_global_stats():
    """Get global cryptocurrency market data"""
    cache_key = "global"
    cached = get_cached(cache_key, 120)
    if cached:
        return cached
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(f"{COINGECKO_API}/global")
            response.raise_for_status()
            data = response.json()["data"]
            
            result = {
                "total_market_cap": data.get("total_market_cap", {}).get("usd", 0),
                "total_volume": data.get("total_volume", {}).get("usd", 0),
                "market_cap_change_24h": data.get("market_cap_change_percentage_24h_usd", 0),
                "active_cryptocurrencies": data.get("active_cryptocurrencies", 0),
                "markets": data.get("markets", 0),
                "btc_dominance": data.get("market_cap_percentage", {}).get("btc", 0),
                "eth_dominance": data.get("market_cap_percentage", {}).get("eth", 0),
                "last_updated": datetime.now(timezone.utc).isoformat()
            }
            set_cached(cache_key, result)
            return result
            
    except httpx.HTTPStatusError as e:
        logger.error(f"CoinGecko API error: {e}")
        raise HTTPException(status_code=e.response.status_code, detail="Failed to fetch global stats")
    except Exception as e:
        logger.error(f"Error fetching global stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

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
