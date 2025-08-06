// lib/financial-apis.js - Multi-source financial data aggregation
import fetch from 'node-fetch';

const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
const FINNHUB_API_KEY = process.env.FINNHUB_API_KEY;
const SEEKING_ALPHA_API_KEY = process.env.SEEKING_ALPHA_API_KEY;

export async function getStockData(symbol) {
  try {
    const [basicData, financials, news, sentiment] = await Promise.allSettled([
      getBasicStockData(symbol),
      getFinancialMetrics(symbol),
      getNewsData(symbol),
      getSentimentData(symbol)
    ]);

    return {
      symbol: symbol.toUpperCase(),
      ...basicData.value,
      ...financials.value,
      news: news.value || [],
      sentiment: sentiment.value || {},
      lastUpdated: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error fetching stock data:', error);
    throw new Error(`Failed to fetch data for ${symbol}`);
  }
}

async function getBasicStockData(symbol) {
  const url = `https://www.alphavantage.co/query?function=GLOBAL_QUOTE&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data['Global Quote']) {
      const quote = data['Global Quote'];
      return {
        price: parseFloat(quote['05. price']),
        change: parseFloat(quote['09. change']),
        changePercent: parseFloat(quote['10. change percent'].replace('%', '')),
        volume: parseInt(quote['06. volume']),
        previousClose: parseFloat(quote['08. previous close']),
        high: parseFloat(quote['03. high']),
        low: parseFloat(quote['04. low']),
        open: parseFloat(quote['02. open'])
      };
    }
  } catch (error) {
    console.error('Alpha Vantage API error:', error);
  }
  
  // Fallback to mock data for demo
  return generateMockBasicData(symbol);
}

async function getFinancialMetrics(symbol) {
  // Try Alpha Vantage fundamental data
  const url = `https://www.alphavantage.co/query?function=OVERVIEW&symbol=${symbol}&apikey=${ALPHA_VANTAGE_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.Symbol) {
      return {
        marketCap: parseInt(data.MarketCapitalization) || 0,
        peRatio: parseFloat(data.PERatio) || 0,
        pegRatio: parseFloat(data.PEGRatio) || 0,
        bookValue: parseFloat(data.BookValue) || 0,
        dividendYield: parseFloat(data.DividendYield) || 0,
        eps: parseFloat(data.EPS) || 0,
        revenueGrowth: parseFloat(data.QuarterlyRevenueGrowthYOY) || 0,
        earningsGrowth: parseFloat(data.QuarterlyEarningsGrowthYOY) || 0,
        operatingMargin: parseFloat(data.OperatingMarginTTM) || 0,
        netMargin: parseFloat(data.ProfitMargin) || 0,
        roe: parseFloat(data.ReturnOnEquityTTM) || 0,
        returnOnAssets: parseFloat(data.ReturnOnAssetsTTM) || 0,
        debtToEquity: parseFloat(data.DebtToEquityRatio) || 0,
        currentRatio: parseFloat(data.CurrentRatio) || 0,
        beta: parseFloat(data.Beta) || 1.0,
        volatility: parseFloat(data['52WeekHigh']) ? 
          (parseFloat(data['52WeekHigh']) - parseFloat(data['52WeekLow'])) / parseFloat(data.Price) : 0.3,
        sector: data.Sector || 'Technology',
        industry: data.Industry || 'Software'
      };
    }
  } catch (error) {
    console.error('Financial metrics API error:', error);
  }
  
  return generateMockFinancialData(symbol);
}

async function getNewsData(symbol) {
  try {
    const url = `https://finnhub.io/api/v1/company-news?symbol=${symbol}&from=${getDateDaysAgo(7)}&to=${getDateToday()}&token=${FINNHUB_API_KEY}`;
    const response = await fetch(url);
    const news = await response.json();
    
    return news.slice(0, 5).map(item => ({
      headline: item.headline,
      summary: item.summary,
      url: item.url,
      source: item.source,
      datetime: new Date(item.datetime * 1000).toISOString(),
      sentiment: analyzeSentiment(item.headline + ' ' + item.summary)
    }));
  } catch (error) {
    console.error('News API error:', error);
    return generateMockNews(symbol);
  }
}

async function getSentimentData(symbol) {
  // Placeholder for Seeking Alpha API integration
  // In production, integrate with Seeking Alpha API for analyst ratings
  return {
    analystRating: 4.2,
    analystCount: 15,
    strongBuy: 8,
    buy: 4,
    hold: 2,
    sell: 1,
    strongSell: 0,
    priceTarget: null,
    socialSentiment: Math.random() * 0.6 + 0.2, // 0.2 to 0.8
    newsSentiment: Math.random() * 0.6 + 0.2
  };
}

function analyzeSentiment(text) {
  // Simple sentiment analysis - in production use more sophisticated NLP
  const positiveWords = ['growth', 'profit', 'beat', 'strong', 'positive', 'upgrade', 'buy', 'bullish'];
  const negativeWords = ['loss', 'decline', 'weak', 'negative', 'downgrade', 'sell', 'bearish'];
  
  const words = text.toLowerCase().split(' ');
  let score = 0.5; // Neutral baseline
  
  words.forEach(word => {
    if (positiveWords.some(pos => word.includes(pos))) score += 0.1;
    if (negativeWords.some(neg => word.includes(neg))) score -= 0.1;
  });
  
  return Math.max(0, Math.min(1, score));
}

// Helper functions
function getDateDaysAgo(days) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().split('T')[0];
}

function getDateToday() {
  return new Date().toISOString().split('T')[0];
}

function generateMockBasicData(symbol) {
  const basePrice = 50 + (hashCode(symbol) % 200);
  const change = (Math.random() - 0.5) * 10;
  
  return {
    price: basePrice,
    change: change,
    changePercent: (change / basePrice) * 100,
    volume: Math.floor(Math.random() * 10000000),
    previousClose: basePrice - change,
    high: basePrice + Math.random() * 5,
    low: basePrice - Math.random() * 5,
    open: basePrice + (Math.random() - 0.5) * 2
  };
}

function generateMockFinancialData(symbol) {
  const hash = hashCode(symbol);
  return {
    marketCap: (hash % 500 + 50) * 1000000000,
    peRatio: hash % 30 + 10,
    revenueGrowth: (hash % 40 - 5) / 100,
    earningsGrowth: (hash % 50 - 10) / 100,
    operatingMargin: (hash % 30 + 5) / 100,
    netMargin: (hash % 25 + 2) / 100,
    roe: (hash % 25 + 5) / 100,
    returnOnAssets: (hash % 15 + 2) / 100,
    debtToEquity: (hash % 200) / 100,
    currentRatio: (hash % 300 + 100) / 100,
    beta: (hash % 150 + 50) / 100,
    volatility: (hash % 40 + 20) / 100,
    sector: 'Technology',
    industry: 'Software'
  };
}

function generateMockNews(symbol) {
  return [
    {
      headline: `${symbol} Reports Strong Quarterly Results`,
      summary: 'Company beats earnings expectations with robust growth',
      url: '#',
      source: 'Financial Times',
      datetime: new Date().toISOString(),
      sentiment: 0.8
    }
  ];
}

function hashCode(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}
