from fastapi import FastAPI, APIRouter, HTTPException, Request, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import httpx
import asyncio
import random
import jwt
import bcrypt
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Stripe API Key
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

# JWT Settings
JWT_SECRET = os.environ.get('JWT_SECRET', 'bitcoin-crypto-app-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24 * 7  # 7 days

# Admin credentials (YOU can change this)
ADMIN_EMAIL = "ademcakir271@gmail.com"
ADMIN_PASSWORD = "admin2024!"

# Security
security = HTTPBearer(auto_error=False)

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

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    """Create a JWT token"""
    payload = {
        "user_id": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def decode_token(token: str) -> Optional[Dict]:
    """Decode and verify a JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Optional[Dict]:
    """Get current user from JWT token"""
    if not credentials:
        return None
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        return None
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
    return user

async def require_auth(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Require authentication - raises 401 if not authenticated"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

# ============ AUTH MODELS ============

class UserRegister(BaseModel):
    email: str
    password: str
    name: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str
    created_at: str
    balances: Dict[str, float] = {}

class AdminLogin(BaseModel):
    email: str
    password: str

def generate_wallet_address(prefix: str, user_id: str) -> str:
    """Generate a unique wallet address for a user"""
    import hashlib
    hash_input = f"{prefix}_{user_id}_{uuid.uuid4()}"
    hash_hex = hashlib.sha256(hash_input.encode()).hexdigest()
    
    if prefix == "BTC":
        return f"bc1q{hash_hex[:38]}"
    elif prefix == "ETH":
        return f"0x{hash_hex[:40]}"
    elif prefix == "SOL":
        return f"{hash_hex[:44]}"
    elif prefix == "XRP":
        return f"r{hash_hex[:33]}"
    elif prefix == "USDT":
        return f"0x{hash_hex[:40]}"
    return hash_hex[:42]

async def require_admin(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict:
    """Require admin authentication"""
    if not credentials:
        raise HTTPException(status_code=401, detail="Not authenticated")
    token = credentials.credentials
    payload = decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")
    if not payload.get("is_admin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return payload

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

# ============ AUTH ENDPOINTS ============

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    """Register a new user"""
    # Check if email already exists
    existing = await db.users.find_one({"email": user_data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Validate password
    if len(user_data.password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Create user
    user_id = str(uuid.uuid4())
    
    # Generate unique wallet addresses for each crypto
    wallets = {
        "BTC": generate_wallet_address("BTC", user_id),
        "ETH": generate_wallet_address("ETH", user_id),
        "SOL": generate_wallet_address("SOL", user_id),
        "XRP": generate_wallet_address("XRP", user_id),
        "USDT": generate_wallet_address("USDT", user_id)
    }
    
    user = {
        "id": user_id,
        "email": user_data.email.lower(),
        "password": hash_password(user_data.password),
        "name": user_data.name,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "wallets": wallets,
        "balances": {
            "BTC": 0.0,
            "ETH": 0.0,
            "SOL": 0.0,
            "XRP": 0.0,
            "USDT": 0.0
        },
        "total_deposited": 0.0,
        "total_withdrawn": 0.0
    }
    
    await db.users.insert_one(user)
    
    # Create token
    token = create_token(user_id, user_data.email.lower())
    
    return {
        "token": token,
        "user": {
            "id": user_id,
            "email": user_data.email.lower(),
            "name": user_data.name,
            "balances": user["balances"],
            "wallets": wallets
        }
    }

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    """Login user"""
    user = await db.users.find_one({"email": credentials.email.lower()})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Create token
    token = create_token(user["id"], user["email"])
    
    return {
        "token": token,
        "user": {
            "id": user["id"],
            "email": user["email"],
            "name": user["name"],
            "balances": user.get("balances", {})
        }
    }

@api_router.get("/auth/me")
async def get_me(user: Dict = Depends(require_auth)):
    """Get current user profile"""
    return {
        "id": user["id"],
        "email": user["email"],
        "name": user["name"],
        "balances": user.get("balances", {}),
        "total_deposited": user.get("total_deposited", 0),
        "total_withdrawn": user.get("total_withdrawn", 0),
        "created_at": user.get("created_at")
    }

@api_router.get("/auth/transactions")
async def get_user_transactions(user: Dict = Depends(require_auth)):
    """Get user's transaction history"""
    transactions = await db.payment_transactions.find(
        {"user_id": user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"transactions": transactions}

@api_router.get("/auth/balances")
async def get_user_balances(user: Dict = Depends(require_auth)):
    """Get user's crypto balances"""
    return {
        "balances": user.get("balances", {}),
        "total_deposited": user.get("total_deposited", 0),
        "total_withdrawn": user.get("total_withdrawn", 0)
    }

# ============ ADMIN ENDPOINTS ============

@api_router.post("/admin/login")
async def admin_login(credentials: AdminLogin):
    """Admin login"""
    if credentials.email.lower() != ADMIN_EMAIL.lower():
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    if credentials.password != ADMIN_PASSWORD:
        raise HTTPException(status_code=401, detail="Invalid admin credentials")
    
    # Create admin token
    payload = {
        "user_id": "admin",
        "email": ADMIN_EMAIL,
        "is_admin": True,
        "exp": datetime.now(timezone.utc) + timedelta(hours=24)
    }
    token = jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)
    
    return {
        "token": token,
        "admin": True,
        "email": ADMIN_EMAIL
    }

@api_router.get("/admin/users")
async def get_all_users(admin: Dict = Depends(require_admin)):
    """Get all registered users (Admin only)"""
    users = await db.users.find(
        {},
        {"_id": 0, "password": 0}
    ).sort("created_at", -1).to_list(1000)
    
    return {
        "total_users": len(users),
        "users": users
    }

@api_router.get("/admin/transactions")
async def get_all_transactions(admin: Dict = Depends(require_admin)):
    """Get all transactions (Admin only)"""
    transactions = await db.payment_transactions.find(
        {},
        {"_id": 0}
    ).sort("created_at", -1).limit(100).to_list(100)
    
    return {
        "total_transactions": len(transactions),
        "transactions": transactions
    }

@api_router.get("/admin/stats")
async def get_admin_stats(admin: Dict = Depends(require_admin)):
    """Get platform statistics (Admin only)"""
    total_users = await db.users.count_documents({})
    total_transactions = await db.payment_transactions.count_documents({})
    paid_transactions = await db.payment_transactions.count_documents({"payment_status": "paid"})
    
    # Calculate total revenue
    pipeline = [
        {"$match": {"payment_status": "paid"}},
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}}
    ]
    revenue_result = await db.payment_transactions.aggregate(pipeline).to_list(1)
    total_revenue = revenue_result[0]["total"] if revenue_result else 0
    
    return {
        "total_users": total_users,
        "total_transactions": total_transactions,
        "paid_transactions": paid_transactions,
        "total_revenue": total_revenue,
        "platform_fee_earned": total_revenue * 0.02  # 2% fee
    }

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class AdminChangePasswordRequest(BaseModel):
    new_password: str

class ResetPasswordRequest(BaseModel):
    email: str

class ResetPasswordConfirm(BaseModel):
    token: str
    new_password: str

@api_router.post("/admin/change-password")
async def admin_change_password(req: AdminChangePasswordRequest, admin: Dict = Depends(require_admin)):
    """Admin changes their own password"""
    global ADMIN_PASSWORD
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update admin password in memory (for this session)
    ADMIN_PASSWORD = req.new_password
    
    # Store in database for persistence
    await db.admin_settings.update_one(
        {"key": "admin_password"},
        {"$set": {"value": req.new_password, "updated_at": datetime.now(timezone.utc).isoformat()}},
        upsert=True
    )
    
    return {"message": "Admin password changed successfully"}

@api_router.post("/auth/change-password")
async def user_change_password(req: ChangePasswordRequest, user: Dict = Depends(require_auth)):
    """User changes their own password"""
    # Get full user with password
    full_user = await db.users.find_one({"id": user["id"]})
    
    if not verify_password(req.current_password, full_user["password"]):
        raise HTTPException(status_code=400, detail="Current password is incorrect")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update password
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"password": hash_password(req.new_password), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Password changed successfully"}

@api_router.post("/auth/forgot-password")
async def forgot_password(req: ResetPasswordRequest):
    """Request password reset - generates reset token"""
    user = await db.users.find_one({"email": req.email.lower()})
    
    # Always return success to prevent email enumeration
    if not user:
        return {"message": "If this email exists, a reset link has been sent"}
    
    # Generate reset token
    reset_token = str(uuid.uuid4())
    expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
    
    # Store reset token
    await db.password_resets.update_one(
        {"email": req.email.lower()},
        {"$set": {
            "token": reset_token,
            "email": req.email.lower(),
            "expires_at": expires_at.isoformat(),
            "used": False,
            "created_at": datetime.now(timezone.utc).isoformat()
        }},
        upsert=True
    )
    
    # In production, send email here. For now, return token (for testing)
    # TODO: Integrate email service
    return {
        "message": "If this email exists, a reset link has been sent",
        "reset_token": reset_token,  # Remove in production, use email instead
        "reset_url": f"/reset-password?token={reset_token}"
    }

@api_router.post("/auth/reset-password")
async def reset_password(req: ResetPasswordConfirm):
    """Reset password using token"""
    # Find valid reset token
    reset_record = await db.password_resets.find_one({
        "token": req.token,
        "used": False
    })
    
    if not reset_record:
        raise HTTPException(status_code=400, detail="Invalid or expired reset token")
    
    # Check expiration
    expires_at = datetime.fromisoformat(reset_record["expires_at"].replace('Z', '+00:00'))
    if datetime.now(timezone.utc) > expires_at:
        raise HTTPException(status_code=400, detail="Reset token has expired")
    
    if len(req.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    
    # Update user password
    await db.users.update_one(
        {"email": reset_record["email"]},
        {"$set": {"password": hash_password(req.new_password), "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    # Mark token as used
    await db.password_resets.update_one(
        {"token": req.token},
        {"$set": {"used": True}}
    )
    
    return {"message": "Password has been reset successfully"}

@api_router.get("/admin/password-resets")
async def get_password_resets(admin: Dict = Depends(require_admin)):
    """Admin can see pending password reset requests"""
    resets = await db.password_resets.find(
        {"used": False},
        {"_id": 0}
    ).sort("created_at", -1).limit(50).to_list(50)
    
    return {"resets": resets}

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

# ============ PAYMENT ENDPOINTS ============

# Crypto purchase packages (amounts in USD)
CRYPTO_PACKAGES = {
    "btc_50": {"amount": 50.0, "crypto": "BTC", "name": "Buy $50 Bitcoin"},
    "btc_100": {"amount": 100.0, "crypto": "BTC", "name": "Buy $100 Bitcoin"},
    "btc_250": {"amount": 250.0, "crypto": "BTC", "name": "Buy $250 Bitcoin"},
    "btc_500": {"amount": 500.0, "crypto": "BTC", "name": "Buy $500 Bitcoin"},
    "btc_1000": {"amount": 1000.0, "crypto": "BTC", "name": "Buy $1000 Bitcoin"},
    "eth_50": {"amount": 50.0, "crypto": "ETH", "name": "Buy $50 Ethereum"},
    "eth_100": {"amount": 100.0, "crypto": "ETH", "name": "Buy $100 Ethereum"},
    "eth_250": {"amount": 250.0, "crypto": "ETH", "name": "Buy $250 Ethereum"},
    "custom": {"amount": 0.0, "crypto": "BTC", "name": "Custom Amount"}
}

class PaymentRequest(BaseModel):
    package_id: str
    origin_url: str
    payment_method: str = "card"  # card, ideal
    custom_amount: Optional[float] = None
    crypto_type: Optional[str] = "BTC"
    user_id: Optional[str] = None

class PaymentStatusRequest(BaseModel):
    session_id: str

@api_router.post("/payments/create-checkout")
async def create_checkout_session(request: Request, payment_req: PaymentRequest, user: Optional[Dict] = Depends(get_current_user)):
    """Create a Stripe checkout session for buying crypto"""
    try:
        # Validate package
        if payment_req.package_id not in CRYPTO_PACKAGES:
            raise HTTPException(status_code=400, detail="Invalid package")
        
        package = CRYPTO_PACKAGES[payment_req.package_id]
        
        # Handle custom amount
        if payment_req.package_id == "custom":
            if not payment_req.custom_amount or payment_req.custom_amount < 10:
                raise HTTPException(status_code=400, detail="Minimum purchase is $10")
            if payment_req.custom_amount > 10000:
                raise HTTPException(status_code=400, detail="Maximum purchase is $10,000")
            amount = float(payment_req.custom_amount)
            crypto_type = payment_req.crypto_type or "BTC"
        else:
            amount = package["amount"]
            crypto_type = package["crypto"]
        
        # Build URLs
        origin_url = payment_req.origin_url.rstrip('/')
        success_url = f"{origin_url}?payment=success&session_id={{CHECKOUT_SESSION_ID}}"
        cancel_url = f"{origin_url}?payment=cancelled"
        
        # Initialize Stripe
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Set payment methods based on request
        payment_methods = ["card"]
        if payment_req.payment_method == "ideal":
            payment_methods = ["ideal"]
        elif payment_req.payment_method == "card":
            payment_methods = ["card"]
        
        # Create checkout session
        checkout_request = CheckoutSessionRequest(
            amount=amount,
            currency="usd" if payment_req.payment_method == "card" else "eur",
            success_url=success_url,
            cancel_url=cancel_url,
            payment_methods=payment_methods,
            metadata={
                "crypto_type": crypto_type,
                "amount_usd": str(amount),
                "package_id": payment_req.package_id,
                "source": "bitcoin_crypto_app"
            }
        )
        
        session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_request)
        
        # Store transaction in database
        transaction = {
            "id": str(uuid.uuid4()),
            "session_id": session.session_id,
            "user_id": user["id"] if user else None,
            "user_email": user["email"] if user else None,
            "amount": amount,
            "currency": "usd",
            "crypto_type": crypto_type,
            "crypto_amount": amount / FALLBACK_TOP_COINS[0]["current_price"] if crypto_type == "BTC" else amount / 3125.50,
            "payment_method": payment_req.payment_method,
            "payment_status": "pending",
            "status": "initiated",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        await db.payment_transactions.insert_one(transaction)
        
        return {
            "checkout_url": session.url,
            "session_id": session.session_id,
            "amount": amount,
            "crypto_type": crypto_type
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=f"Payment initialization failed: {str(e)}")

@api_router.get("/payments/status/{session_id}")
async def get_payment_status(session_id: str, request: Request):
    """Get payment status for a checkout session"""
    try:
        # Initialize Stripe
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        # Get status from Stripe
        status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
        
        # Update database
        update_data = {
            "payment_status": status.payment_status,
            "status": status.status,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {"$set": update_data}
        )
        
        return {
            "session_id": session_id,
            "status": status.status,
            "payment_status": status.payment_status,
            "amount": status.amount_total / 100,  # Convert from cents
            "currency": status.currency
        }
        
    except Exception as e:
        logger.error(f"Error getting payment status: {e}")
        raise HTTPException(status_code=500, detail="Failed to get payment status")

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """Handle Stripe webhook events"""
    try:
        body = await request.body()
        signature = request.headers.get("Stripe-Signature")
        
        host_url = str(request.base_url).rstrip('/')
        webhook_url = f"{host_url}/api/webhook/stripe"
        stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
        
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update transaction in database
        if webhook_response.session_id:
            # Get transaction details
            transaction = await db.payment_transactions.find_one({"session_id": webhook_response.session_id})
            
            await db.payment_transactions.update_one(
                {"session_id": webhook_response.session_id},
                {"$set": {
                    "payment_status": webhook_response.payment_status,
                    "event_type": webhook_response.event_type,
                    "updated_at": datetime.now(timezone.utc).isoformat()
                }}
            )
            
            # If payment succeeded, credit user balance
            if webhook_response.payment_status == "paid" and transaction and transaction.get("user_id"):
                user_id = transaction["user_id"]
                crypto_type = transaction.get("crypto_type", "BTC")
                crypto_amount = transaction.get("crypto_amount", 0)
                amount_usd = transaction.get("amount", 0)
                
                # Update user balance
                await db.users.update_one(
                    {"id": user_id},
                    {
                        "$inc": {
                            f"balances.{crypto_type}": crypto_amount,
                            "total_deposited": amount_usd
                        }
                    }
                )
                logger.info(f"Credited {crypto_amount} {crypto_type} to user {user_id}")
        
        return {"status": "received"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error"}

@api_router.get("/payments/packages")
async def get_payment_packages():
    """Get available crypto purchase packages"""
    return {
        "packages": [
            {"id": k, **v} for k, v in CRYPTO_PACKAGES.items()
        ],
        "payment_methods": [
            {"id": "card", "name": "Credit/Debit Card", "icon": "credit-card"},
            {"id": "ideal", "name": "iDEAL", "icon": "bank", "region": "Netherlands"}
        ]
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
