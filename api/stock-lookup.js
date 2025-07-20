// api/stock-lookup.js - Real-time stock analysis endpoint
import { kv } from '@vercel/kv';
import { getStockData } from '../lib/financial-apis.js';
import { calculateVectorScore } from '../lib/vector-calculator.js';

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbol } = req.query;

  if (!symbol || typeof symbol !== 'string') {
    return res.status(400).json({ error: 'Stock symbol is required' });
  }

  const upperSymbol = symbol.toUpperCase();

  try {
    // Check cache first (data valid for 1 hour during trading, 24h after market close)
    const cacheKey = `stock:${upperSymbol}`;
    const cached = await kv.get(cacheKey);
    
    const now = new Date();
    const marketHours = isMarketOpen(now);
    const cacheValidHours = marketHours ? 1 : 24;

    if (cached && cached.timestamp) {
      const cacheAge = (now.getTime() - new Date(cached.timestamp).getTime()) / (1000 * 60 * 60);
      if (cacheAge < cacheValidHours) {
        return res.status(200).json(cached);
      }
    }

    // Fetch fresh data
    console.log(`Fetching fresh data for ${upperSymbol}`);
    const stockData = await getStockData(upperSymbol);
    
    if (!stockData) {
      return res.status(404).json({ error: 'Stock not found' });
    }

    // Calculate vector intelligence score
    const vectorAnalysis = await calculateVectorScore(stockData);
    
    // Generate trading signals
    const signals = generateTradingSignals(stockData, vectorAnalysis);
    
    const result = {
      symbol: upperSymbol,
      timestamp: now.toISOString(),
      price: stockData.price,
      change: stockData.change,
      changePercent: stockData.changePercent,
      volume: stockData.volume,
      marketCap: stockData.marketCap,
      vectorScore: vectorAnalysis.totalScore,
      classification: getClassification(vectorAnalysis.totalScore),
      components: vectorAnalysis.components,
      signals: signals,
      riskLevel: determineRiskLevel(vectorAnalysis, stockData),
      sector: stockData.sector || 'Unknown'
    };

    // Cache the result
    await kv.set(cacheKey, result, { ex: cacheValidHours * 3600 });

    return res.status(200).json(result);

  } catch (error) {
    console.error('Stock lookup error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: process.env.NODE_ENV === 'development' ? error.message : 'Failed to analyze stock'
    });
  }
}

function isMarketOpen(date = new Date()) {
  const et = new Date(date.toLocaleString("en-US", {timeZone: "America/New_York"}));
  const day = et.getDay();
  const hour = et.getHours();
  const minute = et.getMinutes();
  
  // Market closed on weekends
  if (day === 0 || day === 6) return false;
  
  // Market hours: 9:30 AM - 4:00 PM ET
  if (hour < 9 || hour > 16) return false;
  if (hour === 9 && minute < 30) return false;
  
  return true;
}

function getClassification(score) {
  if (score >= 85) return 'UNICORN PICK';
  if (score >= 75) return 'STRONG MOMENTUM';
  if (score >= 60) return 'MOMENTUM PLAY';
  return 'WATCH LIST';
}

function generateTradingSignals(stockData, vectorAnalysis) {
  const price = stockData.price;
  const volatility = stockData.volatility || 0.25;
  
  // Calculate support and resistance levels
  const support = price * (1 - volatility * 0.3);
  const resistance = price * (1 + volatility * 0.4);
  
  // Risk-reward ratio of 2:1
  const stopDistance = price - support;
  const targetDistance = stopDistance * 2;
  
  return {
    signal: vectorAnalysis.totalScore >= 75 ? 'BUY' : vectorAnalysis.totalScore <= 40 ? 'SELL' : 'HOLD',
    entry: price,
    stopLoss: Math.max(support, price * 0.92), // Max 8% stop loss
    target: Math.min(resistance, price + targetDistance),
    riskReward: '2:1',
    positionSize: Math.max(1, Math.min(5, Math.floor((100 - vectorAnalysis.totalScore) / 10))),
    confidence: vectorAnalysis.totalScore >= 80 ? 'High' : vectorAnalysis.totalScore >= 60 ? 'Medium' : 'Low'
  };
}

function determineRiskLevel(vectorAnalysis, stockData) {
  const volatility = stockData.volatility || 0.25;
  const score = vectorAnalysis.totalScore;
  
  if (volatility > 0.4 || score < 50) return 'High';
  if (volatility > 0.25 || score < 70) return 'Medium';
  return 'Low';
}
