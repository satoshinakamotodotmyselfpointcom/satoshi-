#!/usr/bin/env python3
"""
Backend API Testing for Bitcoin Crypto App
Tests all crypto API endpoints and authentication system
"""

import requests
import sys
import json
from datetime import datetime
import uuid

class CryptoAPITester:
    def __init__(self, base_url="https://btc-exchange-7.preview.emergentagent.com"):
        self.base_url = base_url
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        self.auth_token = None
        self.test_user_id = None
        self.test_email = None
        self.test_password = None

    def run_test(self, name, method, endpoint, expected_status, params=None, auth_required=False):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        headers = {'Content-Type': 'application/json'}
        
        # Add auth header if required and token available
        if auth_required and self.auth_token:
            headers['Authorization'] = f'Bearer {self.auth_token}'

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params, timeout=15)
            elif method == 'POST':
                response = requests.post(url, json=params, headers=headers, timeout=15)

            success = response.status_code == expected_status
            
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                
                # Parse and validate response data
                try:
                    data = response.json()
                    print(f"   Response keys: {list(data.keys()) if isinstance(data, dict) else 'Array/Other'}")
                    
                    # Store successful result
                    self.test_results.append({
                        "test": name,
                        "status": "PASS",
                        "response_keys": list(data.keys()) if isinstance(data, dict) else str(type(data)),
                        "has_fallback": data.get('is_fallback', False) if isinstance(data, dict) else False
                    })
                    
                    return True, data
                except json.JSONDecodeError:
                    print(f"   Warning: Non-JSON response")
                    return True, response.text
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"   Response: {response.text[:200]}...")
                
                self.test_results.append({
                    "test": name,
                    "status": "FAIL",
                    "expected_status": expected_status,
                    "actual_status": response.status_code,
                    "error": response.text[:200]
                })
                
                return False, {}

        except requests.exceptions.Timeout:
            print(f"❌ Failed - Request timeout (15s)")
            self.test_results.append({
                "test": name,
                "status": "FAIL",
                "error": "Request timeout"
            })
            return False, {}
        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            self.test_results.append({
                "test": name,
                "status": "FAIL",
                "error": str(e)
            })
            return False, {}

    def test_root_endpoint(self):
        """Test API root endpoint"""
        success, response = self.run_test(
            "API Root",
            "GET",
            "",
            200
        )
        return success

    def test_bitcoin_price(self):
        """Test Bitcoin price endpoint"""
        success, response = self.run_test(
            "Bitcoin Price",
            "GET",
            "crypto/price/bitcoin",
            200
        )
        
        if success and isinstance(response, dict):
            required_fields = ['coin_id', 'name', 'symbol', 'current_price', 'last_updated']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   Warning: Missing fields: {missing_fields}")
            else:
                print(f"   Bitcoin price: ${response.get('current_price', 0):,.2f}")
                print(f"   24h change: {response.get('price_change_percentage_24h', 0):.2f}%")
        
        return success

    def test_bitcoin_historical(self):
        """Test Bitcoin historical data for different timeframes"""
        timeframes = [1, 7, 30, 90]
        all_success = True
        
        for days in timeframes:
            success, response = self.run_test(
                f"Bitcoin Historical ({days}D)",
                "GET",
                f"crypto/historical/bitcoin?days={days}",
                200
            )
            
            if success and isinstance(response, dict):
                prices = response.get('prices', [])
                print(f"   Data points: {len(prices)}")
                if prices:
                    print(f"   Price range: ${min(p[1] for p in prices):,.0f} - ${max(p[1] for p in prices):,.0f}")
            
            all_success = all_success and success
        
        return all_success

    def test_top_coins(self):
        """Test top coins endpoint"""
        success, response = self.run_test(
            "Top Coins",
            "GET",
            "crypto/top-coins?limit=10",
            200
        )
        
        if success and isinstance(response, dict):
            coins = response.get('coins', [])
            print(f"   Coins returned: {len(coins)}")
            if coins:
                print(f"   Top coin: {coins[0].get('name')} (${coins[0].get('current_price', 0):,.2f})")
                
                # Validate coin structure
                required_coin_fields = ['id', 'name', 'symbol', 'current_price', 'market_cap_rank']
                for i, coin in enumerate(coins[:3]):  # Check first 3 coins
                    missing = [field for field in required_coin_fields if field not in coin]
                    if missing:
                        print(f"   Warning: Coin {i+1} missing fields: {missing}")
        
        return success

    def test_trending_coins(self):
        """Test trending coins endpoint"""
        success, response = self.run_test(
            "Trending Coins",
            "GET",
            "crypto/trending",
            200
        )
        
        if success and isinstance(response, dict):
            trending = response.get('trending_coins', [])
            print(f"   Trending coins: {len(trending)}")
            if trending:
                print(f"   Top trending: {trending[0].get('name')} ({trending[0].get('symbol')})")
        
        return success

    def test_global_stats(self):
        """Test global market stats endpoint"""
        success, response = self.run_test(
            "Global Market Stats",
            "GET",
            "crypto/global",
            200
        )
        
        if success and isinstance(response, dict):
            market_cap = response.get('total_market_cap', 0)
            volume = response.get('total_volume', 0)
            btc_dom = response.get('btc_dominance', 0)
            eth_dom = response.get('eth_dominance', 0)
            
            print(f"   Market Cap: ${market_cap/1e12:.2f}T")
            print(f"   24h Volume: ${volume/1e9:.1f}B")
            print(f"   BTC Dominance: {btc_dom:.1f}%")
            print(f"   ETH Dominance: {eth_dom:.1f}%")
        
        return success
    # ============ AUTHENTICATION TESTS ============
    
    def test_user_registration(self):
        """Test user registration endpoint"""
        # Generate unique test user
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        test_name = f"Test User {timestamp}"
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            {
                "email": test_email,
                "password": test_password,
                "name": test_name
            }
        )
        
        if success and isinstance(response, dict):
            # Check response structure
            required_fields = ['token', 'user']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   Warning: Missing fields: {missing_fields}")
                return False
            
            # Store auth token for subsequent tests
            self.auth_token = response.get('token')
            user_data = response.get('user', {})
            self.test_user_id = user_data.get('id')
            
            print(f"   User created: {user_data.get('name')} ({user_data.get('email')})")
            print(f"   User ID: {self.test_user_id}")
            print(f"   Token received: {len(self.auth_token) if self.auth_token else 0} chars")
            
            # Check user balances
            balances = user_data.get('balances', {})
            print(f"   Initial balances: {balances}")
            
            # Validate balances structure
            expected_cryptos = ['BTC', 'ETH', 'SOL', 'XRP', 'USDT']
            for crypto in expected_cryptos:
                if crypto not in balances:
                    print(f"   Warning: Missing {crypto} balance")
                elif balances[crypto] != 0.0:
                    print(f"   Warning: {crypto} balance not zero: {balances[crypto]}")
        
        return success

    def test_user_login(self):
        """Test user login endpoint"""
        if not self.test_user_id:
            print("   Skipping login test - no registered user")
            return False
            
        # Use the same credentials from registration
        timestamp = datetime.now().strftime("%H%M%S")
        test_email = f"test_user_{timestamp}@example.com"
        test_password = "TestPass123!"
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            {
                "email": test_email,
                "password": test_password
            }
        )
        
        if success and isinstance(response, dict):
            # Check response structure
            required_fields = ['token', 'user']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   Warning: Missing fields: {missing_fields}")
                return False
            
            # Update auth token
            self.auth_token = response.get('token')
            user_data = response.get('user', {})
            
            print(f"   Login successful: {user_data.get('name')}")
            print(f"   Token updated: {len(self.auth_token) if self.auth_token else 0} chars")
        
        return success

    def test_get_user_profile(self):
        """Test get current user profile endpoint"""
        if not self.auth_token:
            print("   Skipping profile test - no auth token")
            return False
            
        success, response = self.run_test(
            "Get User Profile",
            "GET",
            "auth/me",
            200,
            auth_required=True
        )
        
        if success and isinstance(response, dict):
            # Check response structure
            required_fields = ['id', 'email', 'name', 'balances']
            missing_fields = [field for field in required_fields if field not in response]
            if missing_fields:
                print(f"   Warning: Missing fields: {missing_fields}")
            
            print(f"   Profile: {response.get('name')} ({response.get('email')})")
            print(f"   Created: {response.get('created_at', 'N/A')}")
            print(f"   Balances: {response.get('balances', {})}")
            print(f"   Total deposited: ${response.get('total_deposited', 0)}")
            print(f"   Total withdrawn: ${response.get('total_withdrawn', 0)}")
        
        return success

    def test_get_user_transactions(self):
        """Test get user transactions endpoint"""
        if not self.auth_token:
            print("   Skipping transactions test - no auth token")
            return False
            
        success, response = self.run_test(
            "Get User Transactions",
            "GET",
            "auth/transactions",
            200,
            auth_required=True
        )
        
        if success and isinstance(response, dict):
            transactions = response.get('transactions', [])
            print(f"   Transactions found: {len(transactions)}")
            
            if transactions:
                # Show first transaction details
                tx = transactions[0]
                print(f"   Latest: {tx.get('crypto_type')} - ${tx.get('amount')} - {tx.get('payment_status')}")
            else:
                print("   No transactions (expected for new user)")
        
        return success

    def test_get_user_balances(self):
        """Test get user balances endpoint"""
        if not self.auth_token:
            print("   Skipping balances test - no auth token")
            return False
            
        success, response = self.run_test(
            "Get User Balances",
            "GET",
            "auth/balances",
            200,
            auth_required=True
        )
        
        if success and isinstance(response, dict):
            balances = response.get('balances', {})
            print(f"   Balances: {balances}")
            print(f"   Total deposited: ${response.get('total_deposited', 0)}")
            print(f"   Total withdrawn: ${response.get('total_withdrawn', 0)}")
            
            # Validate balance structure
            expected_cryptos = ['BTC', 'ETH', 'SOL', 'XRP', 'USDT']
            for crypto in expected_cryptos:
                if crypto not in balances:
                    print(f"   Warning: Missing {crypto} balance")
        
        return success

    def test_invalid_login(self):
        """Test login with invalid credentials"""
        success, response = self.run_test(
            "Invalid Login",
            "POST",
            "auth/login",
            401,  # Expect 401 Unauthorized
            {
                "email": "nonexistent@example.com",
                "password": "wrongpassword"
            }
        )
        
        if success:
            print("   Correctly rejected invalid credentials")
        
        return success

    def test_unauthorized_access(self):
        """Test accessing protected endpoint without token"""
        # Temporarily clear token
        original_token = self.auth_token
        self.auth_token = None
        
        success, response = self.run_test(
            "Unauthorized Access",
            "GET",
            "auth/me",
            401,  # Expect 401 Unauthorized
            auth_required=False  # Don't add auth header
        )
        
        # Restore token
        self.auth_token = original_token
        
        if success:
            print("   Correctly rejected unauthorized access")
        
        return success

    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Bitcoin Crypto App Backend API Tests")
        print("=" * 60)
        
        # Test all endpoints
        tests = [
            self.test_root_endpoint,
            self.test_bitcoin_price,
            self.test_bitcoin_historical,
            self.test_top_coins,
            self.test_trending_coins,
            self.test_global_stats,
            # Authentication tests
            self.test_user_registration,
            self.test_user_login,
            self.test_get_user_profile,
            self.test_get_user_transactions,
            self.test_get_user_balances,
            self.test_invalid_login,
            self.test_unauthorized_access
        ]
        
        for test in tests:
            try:
                test()
            except Exception as e:
                print(f"❌ Test failed with exception: {e}")
                self.test_results.append({
                    "test": test.__name__,
                    "status": "ERROR",
                    "error": str(e)
                })
        
        # Print summary
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        # Check for fallback usage
        fallback_tests = [r for r in self.test_results if r.get('has_fallback')]
        if fallback_tests:
            print(f"⚠️  {len(fallback_tests)} tests using fallback data (API rate limited)")
        
        success_rate = (self.tests_passed / self.tests_run * 100) if self.tests_run > 0 else 0
        print(f"✅ Success Rate: {success_rate:.1f}%")
        
        return self.tests_passed == self.tests_run

def main():
    tester = CryptoAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/test_reports/backend_api_results.json', 'w') as f:
        json.dump({
            'timestamp': datetime.now().isoformat(),
            'total_tests': tester.tests_run,
            'passed_tests': tester.tests_passed,
            'success_rate': (tester.tests_passed / tester.tests_run * 100) if tester.tests_run > 0 else 0,
            'test_details': tester.test_results
        }, f, indent=2)
    
    return 0 if success else 1

if __name__ == "__main__":
    sys.exit(main())