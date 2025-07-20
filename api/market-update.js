// api/market-update.js - Daily market close batch update (CRON job)
import { kv } from '@vercel/kv';
import { getStockData, getMarketOverview } from '../lib/financial-apis.js';
import { calculateVectorScore } from '../lib/vector-calculator.js';

// Watchlist of stocks to update daily
const WATCHLIST = [
  // Technology
  'AAPL', 'GOOGL', 'MSFT', 'NVDA', 'TSLA', 'META', 'AMZN',
  // Finance
  'JPM', 'BAC', 'WFC', 'GS', 'MS',
  // Healthcare
  'JNJ', 'PFE', 'UNH', 'ABBV',
  // Consumer
  'KO', 'PG', 'WMT', 'HD', 'MCD',
  // Energy
  'XOM', 'CVX', 'COP',
  // Crypto/Blockchain
  'COIN', 'MSTR', 'GBTC', 'RIOT', 'MARA',
  // Quantum Computing
  'QUBT', 'RGTI', 'IONQ', 'IBM',
  // AI/Robotics
  'CRWV', 'PLTR', 'NET', 'SNOW'
];

export default async function handler(req, res) {
  // Verify this is a CRON job request
  const authHeader = req.headers.authorization;
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const startTime = Date.now();
  const results = {
    success: 0,
    errors: 0,
    updated: [],
    failed: [],
    timestamp: new Date().toISOString()
  };

  console.log(`Starting market update for ${WATCHLIST.length} stocks`);

  try {
    // Process stocks in batches to respect API limits
    const batchSize = 5;
    for (let i = 0; i < WATCHLIST.length; i += batchSize) {
      const batch = WATCHLIST.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (symbol) => {
        try {
          // Fetch fresh stock data
          const stockData = await getStockData(symbol);
          if (!stockData) {
            throw new Error(`No data returned for ${symbol}`);
          }

          // Calculate vector analysis
          const vectorAnalysis = await calculateVectorScore(stockData);
          
          // Generate trading signals
          const signals = generateTradingSignals(stockData, vectorAnalysis);
          
          // Prepare cache entry
          const cacheEntry = {
            symbol: symbol,
            timestamp: new Date().toISOString(),
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
            sector: stockData.sector || 'Unknown',
            lastUpdated: new Date().toISOString()
          };

          // Cache for 24 hours (until next market close)
          await kv.set(`stock:${symbol}`, cacheEntry, { ex: 86400 });
          
          results.success++;
          results.updated.push(symbol);
          
          console.log(`✓ Updated ${symbol}: $${stockData.price} (${vectorAnalysis.totalScore})`);
          
          return { symbol, success: true };
          
        } catch (error) {
          console.error(`✗ Failed to update ${symbol}:`, error.message);
          results.errors++;
          results.failed.push({ symbol, error: error.message });
          return { symbol, success: false, error: error.message };
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);
      
      // Rate limiting: wait 1 second between batches
      if (i + batchSize < WATCHLIST.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    const duration = Date.now() - startTime;
    console.log(`Market update completed in ${duration}ms. Success: ${results.success}, Errors: ${results.errors}`);

    return res.status(200).json({
      ...results,
      duration: `${duration}ms`,
      message: `Updated ${results.success} stocks successfully`
    });

  } catch (error) {
    console.error('Market update failed:', error);
    return res.status(500).json({
      error: 'Market update failed',
      message: error.message,
      results
    });
  }
}

// Helper functions (same as in stock-lookup.js)
function getClassification(score) {
  if (score >= 85) return 'UNICORN PICK';
  if (score >= 75) return 'STRONG MOMENTUM';
  if (score >= 60) return 'MOMENTUM PLAY';
  return 'WATCH LIST';
}

function generateTradingSignals(stockData, vectorAnalysis) {
  const price = stockData.price;
  const volatility = stockData.volatility || 0.25;
  
  const support = price * (1 - volatility * 0.3);
  const resistance = price * (1 + volatility * 0.4);
  
  const stopDistance = price - support;
  const targetDistance = stopDistance * 2;
  
  return {
    signal: vectorAnalysis.totalScore >= 75 ? 'BUY' : vectorAnalysis.totalScore <= 40 ? 'SELL' : 'HOLD',
    entry: price,
    stopLoss: Math.max(support, price * 0.92),
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
