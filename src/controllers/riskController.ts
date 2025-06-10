import { Request, Response } from 'express';
import axios from 'axios';
const MutualFund = require("../models/mutualFundModel");

// ------------------ Types ------------------

interface NewsArticle {
  title: string;
  description: string;
  content: string;
  publishedAt: string;
  source: {
    name: string;
  };
}

interface RiskMetrics {
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  marketSentimentScore: number;
  concentrationRisk: number;
  volatilityRisk: number;
  newsBasedRisk: number;
  recommendations: string[];
  riskFactors: {
    topHolding: { name: string; percentage: number };
    assetClassConcentration: { class: string; percentage: number }[];
    recentVolatility: number;
    marketSentiment: string;
    newsAnalysis: {
      totalArticles: number;
      negativeKeywords: number;
      positiveKeywords: number;
      sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
    };
  };
}

// ------------------ Helper Functions ------------------

const NEGATIVE_KEYWORDS = [
  'crash', 'fall', 'decline', 'drop', 'plunge', 'tumble', 'slump', 'recession',
  'inflation', 'crisis', 'uncertainty', 'volatile', 'risk', 'concern', 'worry',
  'loss', 'bear market', 'sell-off', 'correction', 'downturn', 'instability'
];

const POSITIVE_KEYWORDS = [
  'rise', 'gain', 'growth', 'surge', 'rally', 'bull market', 'optimism',
  'recovery', 'positive', 'strong', 'robust', 'stable', 'profit', 'earnings',
  'expansion', 'upward', 'momentum', 'confidence', 'outperform', 'breakthrough'
];

const analyzeNewsContent = (articles: NewsArticle[]) => {
  let negativeCount = 0;
  let positiveCount = 0;
  let totalRelevantWords = 0;

  articles.forEach(article => {
    const content = `${article.title} ${article.description || ''} ${article.content || ''}`.toLowerCase();
    
    NEGATIVE_KEYWORDS.forEach(keyword => {
      if (content.includes(keyword)) {
        negativeCount++;
        totalRelevantWords++;
      }
    });

    POSITIVE_KEYWORDS.forEach(keyword => {
      if (content.includes(keyword)) {
        positiveCount++;
        totalRelevantWords++;
      }
    });
  });

  let sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL' = 'NEUTRAL';
  if (positiveCount > negativeCount * 1.2) {
    sentiment = 'POSITIVE';
  } else if (negativeCount > positiveCount * 1.2) {
    sentiment = 'NEGATIVE';
  }

  return {
    totalArticles: articles.length,
    negativeKeywords: negativeCount,
    positiveKeywords: positiveCount,
    sentiment,
    sentimentScore: totalRelevantWords > 0 ? (positiveCount - negativeCount) / totalRelevantWords : 0
  };
};

const calculateConcentrationRisk = (funds: any[]) => {
  const totalValue = funds.reduce((sum, fund) => sum + parseFloat(fund.currentAmount || '0'), 0);
  
  if (totalValue === 0) return { score: 0, topHolding: null, assetClassConcentration: [] };

  // Fund concentration
  const fundPercentages = funds.map(fund => ({
    name: fund.fundName,
    percentage: (parseFloat(fund.currentAmount || '0') / totalValue) * 100
  }));
  
  const topHolding = fundPercentages.reduce((max, fund) => 
    fund.percentage > max.percentage ? fund : max
  );

  // Asset class concentration
  const assetClassMap: Record<string, number> = {};
  funds.forEach(fund => {
    const assetClass = fund.assetclass || 'Unknown';
    const amount = parseFloat(fund.currentAmount || '0');
    assetClassMap[assetClass] = (assetClassMap[assetClass] || 0) + amount;
  });

  const assetClassConcentration = Object.entries(assetClassMap).map(([className, amount]) => ({
    class: className,
    percentage: (amount / totalValue) * 100
  })).sort((a, b) => b.percentage - a.percentage);

  // Risk score based on concentration
  let concentrationScore = 0;
  if (topHolding.percentage > 50) concentrationScore += 40;
  else if (topHolding.percentage > 30) concentrationScore += 25;
  else if (topHolding.percentage > 20) concentrationScore += 15;

  // Asset class concentration risk
  const topAssetClass = assetClassConcentration[0];
  if (topAssetClass && topAssetClass.percentage > 70) concentrationScore += 30;
  else if (topAssetClass && topAssetClass.percentage > 50) concentrationScore += 20;
  else if (topAssetClass && topAssetClass.percentage > 40) concentrationScore += 10;

  return {
    score: Math.min(concentrationScore, 100),
    topHolding,
    assetClassConcentration
  };
};

const calculateVolatilityRisk = (funds: any[]) => {
  let totalVolatilityScore = 0;
  let fundCount = 0;

  funds.forEach(fund => {
    const transactions = fund.transactions || [];
    if (transactions.length < 2) return;

    // Calculate price volatility based on NAV changes
    const navValues = transactions.map((t: any) => t.nav).filter((nav: number) => nav > 0);
    if (navValues.length < 2) return;

    // Simple volatility calculation
    const returns = [];
    for (let i = 1; i < navValues.length; i++) {
      const returnPct = (navValues[i] - navValues[i-1]) / navValues[i-1];
      returns.push(returnPct);
    }

    if (returns.length > 0) {
      const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * 100;
      
      totalVolatilityScore += Math.min(volatility * 10, 100); // Scale volatility
      fundCount++;
    }
  });

  return fundCount > 0 ? totalVolatilityScore / fundCount : 0;
};

const generateRecommendations = (riskMetrics: any) => {
  const recommendations: string[] = [];

  if (riskMetrics.concentrationRisk > 50) {
    recommendations.push("Consider diversifying your portfolio to reduce concentration risk");
  }

  if (riskMetrics.volatilityRisk > 60) {
    recommendations.push("High volatility detected. Consider adding stable, low-risk funds");
  }

  if (riskMetrics.newsBasedRisk > 70) {
    recommendations.push("Current market sentiment is negative. Consider defensive positioning");
  }

  if (riskMetrics.marketSentimentScore < -0.3) {
    recommendations.push("Market sentiment is bearish. Monitor your positions closely");
  }

  if (recommendations.length === 0) {
    recommendations.push("Portfolio risk levels are within acceptable ranges");
  }

  return recommendations;
};

const calculateOverallRiskScore = (
  concentrationRisk: number,
  volatilityRisk: number,
  newsRisk: number,
  sentimentScore: number
) => {
  const weights = {
    concentration: 0.3,
    volatility: 0.3,
    news: 0.25,
    sentiment: 0.15
  };

  const sentimentRisk = Math.abs(sentimentScore) * 100;
  
  const overallScore = 
    (concentrationRisk * weights.concentration) +
    (volatilityRisk * weights.volatility) +
    (newsRisk * weights.news) +
    (sentimentRisk * weights.sentiment);

  return Math.min(Math.max(overallScore, 0), 100);
};

const getRiskLevel = (score: number): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
  if (score <= 25) return 'LOW';
  if (score <= 50) return 'MEDIUM';
  if (score <= 75) return 'HIGH';
  return 'CRITICAL';
};

// ------------------ Main Controller ------------------

const getPortfolioRiskAssessment = async (_req: Request, res: Response) => {
  try {
    // Fetch portfolio data
    const funds = await MutualFund.find();
    
    if (funds.length === 0) {
      return res.status(200).json({
        status: "ok",
        data: {
          overallRiskScore: 0,
          riskLevel: 'LOW',
          message: "No funds in portfolio to assess risk"
        }
      });
    }

    // Fetch news data
    const apiKey = process.env.NEWSAPI_KEY; // Make sure to set this in your environment variables
    let newsAnalysis: {
      totalArticles: number;
      negativeKeywords: number;
      positiveKeywords: number;
      sentiment: 'POSITIVE' | 'NEGATIVE' | 'NEUTRAL';
      sentimentScore: number;
    } = {
      totalArticles: 0,
      negativeKeywords: 0,
      positiveKeywords: 0,
      sentiment: 'NEUTRAL',
      sentimentScore: 0
    };

    try {
      if (apiKey) {
        const newsResponse = await axios.get(
          `https://newsapi.org/v2/top-headlines?category=business&language=en&apiKey=${apiKey}`
        );
        
        if (newsResponse.data && newsResponse.data.articles) {
          newsAnalysis = analyzeNewsContent(newsResponse.data.articles);
        }
      }
    } catch (newsError) {
      console.warn('⚠️ News API error:', newsError);
      // Continue without news analysis
    }

    // Calculate risk metrics
    const concentrationAnalysis = calculateConcentrationRisk(funds);
    const volatilityRisk = calculateVolatilityRisk(funds);
    const newsRisk = newsAnalysis.sentiment === 'NEGATIVE' ? 70 : 
                     newsAnalysis.sentiment === 'POSITIVE' ? 20 : 40;

    const overallRiskScore = calculateOverallRiskScore(
      concentrationAnalysis.score,
      volatilityRisk,
      newsRisk,
      newsAnalysis.sentimentScore
    );

    const riskLevel = getRiskLevel(overallRiskScore);

    const riskMetrics: RiskMetrics = {
      overallRiskScore: Math.round(overallRiskScore),
      riskLevel,
      marketSentimentScore: newsAnalysis.sentimentScore,
      concentrationRisk: Math.round(concentrationAnalysis.score),
      volatilityRisk: Math.round(volatilityRisk),
      newsBasedRisk: newsRisk,
      recommendations: generateRecommendations({
        concentrationRisk: concentrationAnalysis.score,
        volatilityRisk,
        newsBasedRisk: newsRisk,
        marketSentimentScore: newsAnalysis.sentimentScore
      }),
      riskFactors: {
        topHolding: concentrationAnalysis.topHolding || { name: 'N/A', percentage: 0 },
        assetClassConcentration: concentrationAnalysis.assetClassConcentration,
        recentVolatility: Math.round(volatilityRisk),
        marketSentiment: newsAnalysis.sentiment,
        newsAnalysis
      }
    };

    return res.status(200).json({
      status: "ok",
      data: riskMetrics,
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Risk Assessment Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to calculate portfolio risk",
      error: error.message
    });
  }
};

// Additional endpoint for just market sentiment based on news
const getMarketSentiment = async (_req: Request, res: Response) => {
  try {
    const apiKey = process.env.NEWSAPI_KEY;
    
    if (!apiKey) {
      return res.status(400).json({
        status: "error",
        message: "News API key not configured"
      });
    }

    const response = await axios.get(
      `https://newsapi.org/v2/top-headlines?category=business&language=en&apiKey=${apiKey}`
    );

    const newsAnalysis = analyzeNewsContent(response.data.articles);

    return res.status(200).json({
      status: "ok",
      data: {
        sentiment: newsAnalysis.sentiment,
        sentimentScore: newsAnalysis.sentimentScore,
        articlesAnalyzed: newsAnalysis.totalArticles,
        positiveSignals: newsAnalysis.positiveKeywords,
        negativeSignals: newsAnalysis.negativeKeywords,
        recommendation: newsAnalysis.sentiment === 'NEGATIVE' ? 
          'Consider defensive positioning due to negative market sentiment' :
          newsAnalysis.sentiment === 'POSITIVE' ? 
          'Market sentiment is positive, good time for investments' :
          'Market sentiment is neutral, maintain current strategy'
      },
      timestamp: new Date().toISOString()
    });

  } catch (error: any) {
    console.error("❌ Market Sentiment Error:", error);
    return res.status(500).json({
      status: "error",
      message: "Failed to analyze market sentiment",
      error: error.message
    });
  }
};

// ------------------ Export ------------------

export {
  getPortfolioRiskAssessment,
  getMarketSentiment
};