import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  timeout: 15000,
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      console.warn('Rate limit exceeded, data may be cached');
    }
    return Promise.reject(error);
  }
);

export const cryptoApi = {
  // Get single coin price
  getPrice: (coinId) => api.get(`/crypto/price/${coinId}`),
  
  // Get historical data for charts
  getHistoricalData: (coinId, days = 7) => 
    api.get(`/crypto/historical/${coinId}?days=${days}`),
  
  // Get top coins by market cap
  getTopCoins: (limit = 10) => 
    api.get(`/crypto/top-coins?limit=${limit}`),
  
  // Get trending coins
  getTrendingCoins: () => api.get('/crypto/trending'),
  
  // Get global market stats
  getGlobalStats: () => api.get('/crypto/global'),
};

export default cryptoApi;
