// lib/vector-calculator.js - 6-Component Vector Intelligence Methodology
export async function calculateVectorScore(stockData) {
  const components = {
    technologyInnovation: await calculateTechnologyInnovation(stockData),
    growthAcceleration: await calculateGrowthAcceleration(stockData),
    strategicDirection: await calculateStrategicDirection(stockData),
    operationalExcellence: await calculateOperationalExcellence(stockData),
    financialOptimization: await calculateFinancialOptimization(stockData),
    riskManagement: await calculateRiskManagement(stockData)
  };

  // Component weightings (total 100%)
  const weights = {
    technologyInnovation: 0.30,    // 30%
    growthAcceleration: 0.25,      // 25%
    strategicDirection: 0.20,      // 20%
    operationalExcellence: 0.10,   // 10%
    financialOptimization: 0.10,   // 10%
    riskManagement: 0.05           // 5%
  };

  // Calculate weighted total score
  const totalScore = Object.keys(components).reduce((total, key) => {
    return total + (components[key] * weights[key]);
  }, 0);

  return {
    totalScore: Math.round(totalScore * 10) / 10,
    components: {
      technologyInnovation: Math.round(components.technologyInnovation * 10) / 10,
      growthAcceleration: Math.round(components.growthAcceleration * 10) / 10,
      strategicDirection: Math.round(components.strategicDirection * 10) / 10,
      operationalExcellence: Math.round(components.operationalExcellence * 10) / 10,
      financialOptimization: Math.round(components.financialOptimization * 10) / 10,
      riskManagement: Math.round(components.riskManagement * 10) / 10
    },
    weights,
    analysis: generateAnalysisInsights(components, totalScore)
  };
}

async function calculateTechnologyInnovation(stockData) {
  let score = 50; // Base score
  
  // R&D spending as % of revenue
  if (stockData.rdSpending && stockData.revenue) {
    const rdRatio = stockData.rdSpending / stockData.revenue;
    if (rdRatio > 0.15) score += 25; // Excellent R&D investment
    else if (rdRatio > 0.10) score += 15;
    else if (rdRatio > 0.05) score += 10;
  }
  
  // Patent portfolio and IP strength
  if (stockData.patentCount) {
    if (stockData.patentCount > 1000) score += 20;
    else if (stockData.patentCount > 100) score += 15;
    else if (stockData.patentCount > 10) score += 10;
  }
  
  // Technology sector bonus
  if (isTechSector(stockData.sector)) {
    score += 10;
  }
  
  // Innovation metrics (AI, quantum, blockchain exposure)
  if (isInnovationStock(stockData.symbol)) {
    score += 15;
  }
  
  // Product launch frequency and market impact
  if (stockData.productLaunches && stockData.productLaunches > 3) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

async function calculateGrowthAcceleration(stockData) {
  let score = 50; // Base score
  
  // Revenue growth rate
  if (stockData.revenueGrowth) {
    if (stockData.revenueGrowth > 0.30) score += 25; // 30%+ growth
    else if (stockData.revenueGrowth > 0.20) score += 20;
    else if (stockData.revenueGrowth > 0.15) score += 15;
    else if (stockData.revenueGrowth > 0.10) score += 10;
    else if (stockData.revenueGrowth < 0) score -= 15; // Negative growth
  }
  
  // Earnings growth consistency
  if (stockData.earningsGrowth) {
    if (stockData.earningsGrowth > 0.25) score += 20;
    else if (stockData.earningsGrowth > 0.15) score += 15;
    else if (stockData.earningsGrowth > 0.05) score += 10;
    else if (stockData.earningsGrowth < 0) score -= 10;
  }
  
  // Market share expansion
  if (stockData.marketShareGrowth && stockData.marketShareGrowth > 0.02) {
    score += 15;
  }
  
  // User/customer growth metrics
  if (stockData.userGrowth && stockData.userGrowth > 0.20) {
    score += 10;
  }
  
  // Geographic expansion
  if (stockData.internationalRevenue && stockData.internationalRevenue > 0.30) {
    score += 10;
  }
  
  return Math.min(100, Math.max(0, score));
}

async function calculateStrategicDirection(stockData) {
  let score = 50; // Base score
  
  // Market positioning and competitive moat
  if (stockData.marketCap) {
    const marketCap = stockData.marketCap / 1e9; // Convert to billions
    if (marketCap > 100) score += 20; // Large cap stability
    else if (marketCap > 50) score += 15;
    else if (marketCap > 10) score += 10;
    else if (marketCap < 1) score -= 10; // Micro cap risk
  }
  
  // Leadership and management quality
  if (stockData.managementRating && stockData.managementRating > 4.0) {
    score += 15;
  }
  
  // Strategic partnerships and alliances
  if (stockData.partnerships && stockData.partnerships > 5) {
    score += 10;
  }
  
  // ESG (Environmental, Social, Governance) score
  if (stockData.esgScore) {
    if (stockData.esgScore > 80) score += 15;
    else if (stockData.esgScore > 60) score += 10;
    else if (stockData.esgScore < 30) score -= 10;
  }
  
  // Future market opportunity
  if (isGrowthSector(stockData.sector)) {
    score += 15;
  }
  
  return Math.min(100, Math.max(0, score));
}

async function calculateOperationalExcellence(stockData) {
  let score = 50; // Base score
  
  // Operating margin efficiency
  if (stockData.operatingMargin) {
    if (stockData.operatingMargin > 0.25) score += 25;
    else if (stockData.operatingMargin > 0.15) score += 20;
    else if (stockData.operatingMargin > 0.10) score += 15;
    else if (stockData.operatingMargin > 0.05) score += 10;
    else if (stockData.operatingMargin < 0) score -= 15;
  }
  
  // Asset utilization
  if (stockData.returnOnAssets) {
    if (stockData.returnOnAssets > 0.15) score += 20;
    else if (stockData.returnOnAssets > 0.10) score += 15;
    else if (stockData.returnOnAssets > 0.05) score += 10;
  }
  
  // Inventory management
  if (stockData.inventoryTurnover && stockData.inventoryTurnover > 8) {
    score += 10;
  }
  
  // Quality metrics (defect rates, customer satisfaction)
  if (stockData.qualityRating && stockData.qualityRating > 4.5) {
    score += 15;
  }
  
  return Math.min(100, Math.max(0, score));
}

async function calculateFinancialOptimization(stockData) {
  let score = 50; // Base score
  
  // Profitability metrics
  if (stockData.netMargin) {
    if (stockData.netMargin > 0.20) score += 25;
    else if (stockData.netMargin > 0.15) score += 20;
    else if (stockData.netMargin > 0.10) score += 15;
    else if (stockData.netMargin > 0.05) score += 10;
    else if (stockData.netMargin < 0) score -= 20;
  }
  
  // Return on equity
  if (stockData.roe) {
    if (stockData.roe > 0.20) score += 20;
    else if (stockData.roe > 0.15) score += 15;
    else if (stockData.roe > 0.10) score += 10;
  }
  
  // Cash flow generation
  if (stockData.freeCashFlow && stockData.revenue) {
    const fcfMargin = stockData.freeCashFlow / stockData.revenue;
    if (fcfMargin > 0.15) score += 15;
    else if (fcfMargin > 0.10) score += 10;
    else if (fcfMargin > 0.05) score += 5;
  }
  
  // Balance sheet strength
  if (stockData.debtToEquity) {
    if (stockData.debtToEquity < 0.3) score += 10;
    else if (stockData.debtToEquity > 2.0) score -= 15;
  }
  
  return Math.min(100, Math.max(0, score));
}

async function calculateRiskManagement(stockData) {
  let score = 50; // Base score
  
  // Volatility assessment
  if (stockData.volatility) {
    if (stockData.volatility < 0.20) score += 25; // Low volatility
    else if (stockData.volatility < 0.30) score += 15;
    else if (stockData.volatility < 0.40) score += 5;
    else if (stockData.volatility > 0.60) score -= 20; // High volatility
  }
  
  // Beta relative to market
  if (stockData.beta) {
    if (stockData.beta < 1.0) score += 15; // Less risky than market
    else if (stockData.beta > 1.5) score -= 10; // More risky than market
  }
  
  // Diversification of revenue streams
  if (stockData.businessSegments && stockData.businessSegments > 3) {
    score += 10;
  }
  
  // Regulatory compliance
  if (stockData.complianceScore && stockData.complianceScore > 85) {
    score += 15;
  }
  
  // Liquidity metrics
  if (stockData.currentRatio) {
    if (stockData.currentRatio > 2.0) score += 10;
    else if (stockData.currentRatio < 1.0) score -= 15;
  }
  
  return Math.min(100, Math.max(0, score));
}

// Helper functions
function isTechSector(sector) {
  const techSectors = ['Technology', 'Software', 'Semiconductors', 'Internet', 'AI', 'Cloud Computing'];
  return techSectors.some(tech => sector && sector.includes(tech));
}

function isInnovationStock(symbol) {
  const innovationStocks = ['NVDA', 'TSLA', 'GOOGL', 'MSFT', 'AMZN', 'META', 'QUBT', 'IONQ', 'RGTI', 'CRWV'];
  return innovationStocks.includes(symbol);
}

function isGrowthSector(sector) {
  const growthSectors = ['Technology', 'Healthcare', 'Renewable Energy', 'E-commerce', 'Cloud', 'AI'];
  return growthSectors.some(growth => sector && sector.includes(growth));
}

function generateAnalysisInsights(components, totalScore) {
  const insights = [];
  
  if (components.technologyInnovation > 80) {
    insights.push("Strong technology innovation and R&D investment");
  }
  
  if (components.growthAcceleration > 75) {
    insights.push("Excellent growth trajectory with strong fundamentals");
  }
  
  if (components.riskManagement < 40) {
    insights.push("Higher risk profile requires careful position sizing");
  }
  
  if (totalScore > 85) {
    insights.push("UNICORN PICK - Exceptional investment opportunity");
  } else if (totalScore > 75) {
    insights.push("STRONG MOMENTUM - Solid investment with good upside potential");
  }
  
  return insights;
}
