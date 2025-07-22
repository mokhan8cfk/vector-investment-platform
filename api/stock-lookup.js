// stock-lookup.js - Real-time stock analysis endpoint
import { Redis } from '@upstash/redis';
import { kv } from '@vercel/kv';
import { getStockData } from '../lib/financial-apis.js';
import { calculateVectorScore } from '../lib/vector-calculator.js';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

export default async function handler(req, res) {
  // Input validation
  const { symbol } = req.query;
  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Invalid symbol' });
  }

  const cacheKey = `stock:${symbol.toUpperCase()}`;

  try {
    // Check cache first
    const cachedData = await redis.get(cacheKey);
    if (cachedData) {
      console.log('Cache hit for', symbol);
      return res.status(200).json(cachedData);
    }

    // Fetch fresh data if no cache
    const stockData = await getStockData(symbol);
    const vectorAnalysis = await calculateVectorScore(stockData);

    // Cache for 5 minutes (300 seconds)
    await redis.setex(cacheKey, 300, JSON.stringify({
      ...stockData,
      vectorAnalysis
    }));

    res.status(200).json({
      ...stockData,
      vectorAnalysis
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
