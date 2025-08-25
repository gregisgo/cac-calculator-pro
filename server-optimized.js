const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');

const app = express();
const PORT = process.env.PORT || 3009;

// Optimized multer configuration
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // Reduced to 10MB
  fileFilter: (req, file, cb) => {
    const isValidFile = file.originalname.match(/\.(csv|xlsx|xls)$/i);
    cb(isValidFile ? null : new Error('Only CSV and Excel files allowed'), isValidFile);
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Reduced limit
// Serve the fixed version as default
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-fixed.html'));
});

app.use(express.static(path.join(__dirname, 'public')));

// Data cache to avoid reprocessing
const dataCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Optimized file upload endpoint
app.post('/api/upload', upload.single('dataFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;
    
    // Check cache first
    const cacheKey = `${fileName}-${fileBuffer.length}`;
    if (dataCache.has(cacheKey)) {
      const cached = dataCache.get(cacheKey);
      if (Date.now() - cached.timestamp < CACHE_TTL) {
        return res.json(cached.data);
      }
    }

    let data = [];
    
    if (fileName.endsWith('.csv')) {
      data = parseCSVOptimized(fileBuffer.toString('utf8'));
    } else if (fileName.match(/\.(xlsx|xls)$/i)) {
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const worksheet = workbook.Sheets[workbook.SheetNames[0]];
      data = XLSX.utils.sheet_to_json(worksheet, { raw: false });
    }

    if (data.length === 0) {
      return res.status(400).json({ error: 'Empty file' });
    }

    const result = {
      data,
      rowCount: data.length,
      filename: fileName,
      headers: Object.keys(data[0] || {}),
      fileType: fileName.endsWith('.csv') ? 'csv' : 'excel'
    };

    // Cache result
    dataCache.set(cacheKey, {
      data: result,
      timestamp: Date.now()
    });

    res.json(result);

  } catch (error) {
    res.status(500).json({ error: 'Failed to process file: ' + error.message });
  }
});

// Optimized CSV parser
function parseCSVOptimized(csvData) {
  const lines = csvData.split('\n').filter(line => line.trim());
  if (lines.length === 0) return [];

  const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
  const data = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
    const row = {};
    
    headers.forEach((header, index) => {
      const value = values[index] || '';
      row[header] = isNaN(value) || value === '' ? value : parseFloat(value);
    });
    
    data.push(row);
  }

  return data;
}

// Streamlined analysis endpoint focused on key metrics
app.post('/api/analyze', (req, res) => {
  try {
    const { marketing = [], revenue = [], businessModel = {}, projectConfig = {} } = req.body;
    
    if (marketing.length === 0) {
      return res.status(400).json({ error: 'Marketing data required' });
    }

    // Core CAC calculations - streamlined
    const results = calculateCoreMetrics(marketing, revenue);
    
    // Channel performance analysis - your priority
    const channelPerformance = analyzeChannelPerformance(marketing, revenue);
    
    // Time-based analysis for trends
    const timeAnalysis = analyzeTimeBasedPerformance(marketing, revenue);
    
    // Simple optimization opportunities
    const opportunities = identifyOptimizationOpportunities(channelPerformance);

    res.json({
      blendedCAC: results.blendedCAC,
      totalSpend: results.totalSpend,
      totalCustomers: results.totalCustomers,
      totalRevenue: results.totalRevenue,
      channelPerformance,
      timeAnalysis,
      opportunities,
      dataQuality: assessBasicDataQuality(marketing, revenue),
      rawData: {
        marketing: marketing, // Include all marketing data for charts
        revenue: revenue
      }
    });

  } catch (error) {
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
});

// Core metrics calculation - simplified
function calculateCoreMetrics(marketing, revenue) {
  const totalSpend = marketing.reduce((sum, row) => sum + (parseFloat(row.spend) || 0), 0);
  const totalCustomers = marketing.reduce((sum, row) => sum + (parseFloat(row.customers) || parseFloat(row.conversions) || 0), 0);
  const totalRevenue = revenue.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0);
  
  return {
    blendedCAC: totalCustomers > 0 ? (totalSpend / totalCustomers).toFixed(2) : '0',
    totalSpend: totalSpend.toFixed(0),
    totalCustomers: totalCustomers.toFixed(0),
    totalRevenue: totalRevenue.toFixed(0)
  };
}

// Enhanced channel performance analysis with benchmarks and efficiency scoring
function analyzeChannelPerformance(marketing, revenue) {
  const channelStats = {};
  
  // Industry benchmarks for different channels
  const benchmarks = {
    'Google Ads': { ctr: 2.0, cvr: 3.75, cpc: 2.69, avgCAC: 85 },
    'Facebook': { ctr: 0.9, cvr: 2.5, cpc: 1.72, avgCAC: 90 },
    'LinkedIn': { ctr: 0.6, cvr: 4.2, cpc: 5.26, avgCAC: 125 },
    'TikTok': { ctr: 1.5, cvr: 1.8, cpc: 1.0, avgCAC: 75 },
    'default': { ctr: 1.2, cvr: 2.8, cpc: 2.5, avgCAC: 95 }
  };
  
  marketing.forEach(row => {
    const channel = row.channel || row.source || 'Unknown';
    if (!channelStats[channel]) {
      channelStats[channel] = {
        spend: 0,
        customers: 0,
        clicks: 0,
        impressions: 0,
        revenue: 0,
        days: new Set(),
        campaigns: new Set()
      };
    }
    
    channelStats[channel].spend += parseFloat(row.spend) || 0;
    channelStats[channel].customers += parseFloat(row.customers) || parseFloat(row.conversions) || 0;
    channelStats[channel].clicks += parseFloat(row.clicks) || 0;
    channelStats[channel].impressions += parseFloat(row.impressions) || 0;
    
    // Track unique days and campaigns for more insights
    if (row.date) channelStats[channel].days.add(row.date);
    if (row.campaign_name || row.campaign) channelStats[channel].campaigns.add(row.campaign_name || row.campaign);
  });

  // Add revenue data
  revenue.forEach(row => {
    const channel = row.channel || row.source || 'Unknown';
    if (channelStats[channel]) {
      channelStats[channel].revenue += parseFloat(row.revenue) || 0;
    }
  });

  // Calculate enhanced metrics with benchmarks and efficiency scoring
  Object.keys(channelStats).forEach(channel => {
    const stats = channelStats[channel];
    
    // Basic metrics
    stats.cac = stats.customers > 0 ? (stats.spend / stats.customers) : 0;
    stats.ctr = stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100) : 0;
    stats.cvr = stats.clicks > 0 ? ((stats.customers / stats.clicks) * 100) : 0;
    stats.cpc = stats.clicks > 0 ? (stats.spend / stats.clicks) : 0;
    stats.roas = stats.spend > 0 ? (stats.revenue / stats.spend) : 0;
    
    // Additional performance metrics
    stats.days = stats.days.size;
    stats.campaigns = stats.campaigns.size;
    stats.avgDailySpend = stats.days > 0 ? stats.spend / stats.days : 0;
    stats.costPerImpression = stats.impressions > 0 ? (stats.spend / stats.impressions * 1000) : 0; // CPM
    
    // Benchmark comparisons
    const benchmark = benchmarks[channel] || benchmarks['default'];
    stats.benchmark = {
      ctr: {
        actual: stats.ctr,
        benchmark: benchmark.ctr,
        performance: stats.ctr > benchmark.ctr ? 'above' : stats.ctr < benchmark.ctr * 0.8 ? 'below' : 'average',
        percentDiff: benchmark.ctr > 0 ? ((stats.ctr - benchmark.ctr) / benchmark.ctr * 100) : 0
      },
      cvr: {
        actual: stats.cvr,
        benchmark: benchmark.cvr,
        performance: stats.cvr > benchmark.cvr ? 'above' : stats.cvr < benchmark.cvr * 0.8 ? 'below' : 'average',
        percentDiff: benchmark.cvr > 0 ? ((stats.cvr - benchmark.cvr) / benchmark.cvr * 100) : 0
      },
      cac: {
        actual: stats.cac,
        benchmark: benchmark.avgCAC,
        performance: stats.cac < benchmark.avgCAC ? 'above' : stats.cac > benchmark.avgCAC * 1.2 ? 'below' : 'average',
        percentDiff: benchmark.avgCAC > 0 ? ((benchmark.avgCAC - stats.cac) / benchmark.avgCAC * 100) : 0
      }
    };
    
    // Calculate efficiency score (0-100)
    let efficiencyScore = 50; // Base score
    
    // Calculate efficiency score components
    
    // CAC efficiency (30% of score)
    if (stats.cac > 0 && benchmark.avgCAC > 0) {
      const cacRatio = benchmark.avgCAC / stats.cac;
      efficiencyScore += Math.min(30, cacRatio * 15 - 15);
    }
    
    // CTR efficiency (25% of score)
    if (stats.ctr > 0 && benchmark.ctr > 0) {
      const ctrRatio = stats.ctr / benchmark.ctr;
      efficiencyScore += Math.min(25, ctrRatio * 12.5 - 12.5);
    }
    
    // CVR efficiency (25% of score)
    if (stats.cvr > 0 && benchmark.cvr > 0) {
      const cvrRatio = stats.cvr / benchmark.cvr;
      efficiencyScore += Math.min(25, cvrRatio * 12.5 - 12.5);
    }
    
    // ROAS bonus (20% of score)
    if (stats.roas > 2) {
      efficiencyScore += Math.min(20, (stats.roas - 2) * 10);
    } else if (stats.roas < 1) {
      efficiencyScore -= 15;
    }
    
    stats.efficiencyScore = Math.max(0, Math.min(100, Math.round(efficiencyScore)));
    
    // Performance grade
    if (stats.efficiencyScore >= 85) stats.grade = 'A';
    else if (stats.efficiencyScore >= 75) stats.grade = 'B';
    else if (stats.efficiencyScore >= 65) stats.grade = 'C';
    else if (stats.efficiencyScore >= 50) stats.grade = 'D';
    else stats.grade = 'F';
    
    // Customer quality metrics
    stats.avgRevenuePerCustomer = stats.customers > 0 ? stats.revenue / stats.customers : 0;
    stats.ltv = stats.avgRevenuePerCustomer; // Simplified LTV
    stats.ltvCacRatio = stats.cac > 0 ? stats.ltv / stats.cac : 0;
    
    // Format numbers for display
    stats.cacFormatted = stats.cac.toFixed(2);
    stats.ctrFormatted = stats.ctr.toFixed(2);
    stats.cvrFormatted = stats.cvr.toFixed(2);
    stats.cpcFormatted = stats.cpc.toFixed(2);
    stats.roasFormatted = stats.roas.toFixed(2);
  });

  return channelStats;
}

// Time-based performance for cohorted trend analysis
function analyzeTimeBasedPerformance(marketing, revenue) {
  const dailyStats = {};
  const weeklyStats = {};
  const monthlyStats = {};
  
  marketing.forEach(row => {
    const date = row.date;
    if (!date) return;
    
    const dateObj = new Date(date);
    const weekKey = getWeekKey(dateObj);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    // Daily stats
    if (!dailyStats[date]) {
      dailyStats[date] = { spend: 0, customers: 0, revenue: 0, channels: new Set() };
    }
    dailyStats[date].spend += parseFloat(row.spend) || 0;
    dailyStats[date].customers += parseFloat(row.customers) || parseFloat(row.conversions) || 0;
    dailyStats[date].channels.add(row.channel || 'Unknown');
    
    // Weekly stats
    if (!weeklyStats[weekKey]) {
      weeklyStats[weekKey] = { spend: 0, customers: 0, revenue: 0 };
    }
    weeklyStats[weekKey].spend += parseFloat(row.spend) || 0;
    weeklyStats[weekKey].customers += parseFloat(row.customers) || parseFloat(row.conversions) || 0;
    
    // Monthly stats
    if (!monthlyStats[monthKey]) {
      monthlyStats[monthKey] = { spend: 0, customers: 0, revenue: 0 };
    }
    monthlyStats[monthKey].spend += parseFloat(row.spend) || 0;
    monthlyStats[monthKey].customers += parseFloat(row.customers) || parseFloat(row.conversions) || 0;
  });

  revenue.forEach(row => {
    const date = row.date;
    if (!date) return;
    
    const dateObj = new Date(date);
    const weekKey = getWeekKey(dateObj);
    const monthKey = `${dateObj.getFullYear()}-${String(dateObj.getMonth() + 1).padStart(2, '0')}`;
    
    if (dailyStats[date]) {
      dailyStats[date].revenue += parseFloat(row.revenue) || 0;
    }
    if (weeklyStats[weekKey]) {
      weeklyStats[weekKey].revenue += parseFloat(row.revenue) || 0;
    }
    if (monthlyStats[monthKey]) {
      monthlyStats[monthKey].revenue += parseFloat(row.revenue) || 0;
    }
  });

  // Calculate trends
  const trends = calculateTrends(dailyStats, weeklyStats, monthlyStats);
  
  // Convert channels Set to array for JSON serialization
  Object.keys(dailyStats).forEach(date => {
    dailyStats[date].channels = Array.from(dailyStats[date].channels);
  });

  return { 
    daily: dailyStats,
    weekly: weeklyStats,
    monthly: monthlyStats,
    trends
  };
}

function getWeekKey(date) {
  const year = date.getFullYear();
  const weekOfYear = Math.ceil((((date - new Date(year, 0, 1)) / 86400000) + 1) / 7);
  return `${year}-W${String(weekOfYear).padStart(2, '0')}`;
}

function calculateTrends(daily, weekly, monthly) {
  const dailyKeys = Object.keys(daily).sort();
  const weeklyKeys = Object.keys(weekly).sort();
  const monthlyKeys = Object.keys(monthly).sort();
  
  const trends = {
    cac_trend: 'stable',
    spend_trend: 'stable',
    customer_trend: 'stable',
    weekly_performance: 'stable',
    monthly_performance: 'stable'
  };
  
  // Analyze daily CAC trend (last 7 days vs previous 7 days)
  if (dailyKeys.length >= 14) {
    const recentWeek = dailyKeys.slice(-7);
    const previousWeek = dailyKeys.slice(-14, -7);
    
    const recentCAC = calculatePeriodCAC(recentWeek, daily);
    const previousCAC = calculatePeriodCAC(previousWeek, daily);
    
    if (recentCAC && previousCAC) {
      const change = ((recentCAC - previousCAC) / previousCAC) * 100;
      if (change > 10) trends.cac_trend = 'increasing';
      else if (change < -10) trends.cac_trend = 'decreasing';
    }
  }
  
  // Analyze weekly trend
  if (weeklyKeys.length >= 4) {
    const recentWeeks = weeklyKeys.slice(-2);
    const olderWeeks = weeklyKeys.slice(-4, -2);
    
    const recentWeekCAC = calculatePeriodCAC(recentWeeks, weekly);
    const olderWeekCAC = calculatePeriodCAC(olderWeeks, weekly);
    
    if (recentWeekCAC && olderWeekCAC) {
      const change = ((recentWeekCAC - olderWeekCAC) / olderWeekCAC) * 100;
      if (change > 15) trends.weekly_performance = 'deteriorating';
      else if (change < -15) trends.weekly_performance = 'improving';
    }
  }
  
  return trends;
}

function calculatePeriodCAC(periods, statsObj) {
  let totalSpend = 0;
  let totalCustomers = 0;
  
  periods.forEach(period => {
    if (statsObj[period]) {
      totalSpend += statsObj[period].spend;
      totalCustomers += statsObj[period].customers;
    }
  });
  
  return totalCustomers > 0 ? totalSpend / totalCustomers : null;
}

// Enhanced optimization opportunities with specific budget moves and actionable tasks
function identifyOptimizationOpportunities(channelPerformance) {
  const opportunities = [];
  const channels = Object.entries(channelPerformance);
  
  if (channels.length === 0) return opportunities;
  
  // Sort channels by efficiency score
  const sortedChannels = channels.sort((a, b) => (b[1].efficiencyScore || 0) - (a[1].efficiencyScore || 0));
  const bestChannel = sortedChannels[0];
  const worstChannel = sortedChannels[sortedChannels.length - 1];
  
  // Calculate total spend for budget reallocation
  const totalSpend = channels.reduce((sum, [_, stats]) => sum + stats.spend, 0);
  
  channels.forEach(([channel, stats]) => {
    const cac = stats.cac || 0;
    const roas = stats.roas || 0;
    const ctr = stats.ctr || 0;
    const cvr = stats.cvr || 0;
    const efficiencyScore = stats.efficiencyScore || 0;
    const benchmark = stats.benchmark || {};
    
    // High-priority opportunities based on efficiency score and benchmarks
    if (efficiencyScore < 50) {
      const dailySpendReduction = Math.round(stats.avgDailySpend * 0.3);
      opportunities.push({
        type: 'budget_reallocation',
        channel: channel,
        issue: `Low efficiency in ${channel} (Score: ${efficiencyScore}/100)`,
        recommendation: `Reduce daily budget by $${dailySpendReduction} and reallocate to ${bestChannel[0]}`,
        specificActions: [
          `Pause underperforming campaigns in ${channel}`,
          `Increase budget for ${bestChannel[0]} by $${dailySpendReduction}/day`,
          `Review targeting and creative in ${channel}`,
          `Set up A/B tests for new messaging`
        ],
        impact: `Expected 25-40% improvement in overall CAC`,
        timeline: '1-2 weeks',
        priority: 'high',
        budgetMove: {
          from: channel,
          to: bestChannel[0],
          amount: dailySpendReduction,
          frequency: 'daily'
        },
        metrics: {
          currentCAC: cac.toFixed(2),
          targetCAC: (cac * 0.7).toFixed(2),
          expectedROI: `$${Math.round(dailySpendReduction * 30 * 0.4)}/month`
        }
      });
    }
    
    // Benchmark-based opportunities
    if (benchmark.ctr && benchmark.ctr.performance === 'below') {
      opportunities.push({
        type: 'creative_optimization',
        channel: channel,
        issue: `${channel} CTR ${benchmark.ctr.percentDiff.toFixed(1)}% below industry benchmark`,
        recommendation: `Refresh ad creative to improve CTR from ${ctr.toFixed(2)}% to ${benchmark.ctr.benchmark}%`,
        specificActions: [
          `Test 3-5 new ad creatives this week`,
          `Focus on emotional triggers and clear CTAs`,
          `A/B test video vs. static creative`,
          `Analyze top-performing competitor ads`,
          `Update ad copy with current offers/features`
        ],
        impact: `${Math.round(Math.abs(benchmark.ctr.percentDiff))}% improvement in click volume`,
        timeline: '2-3 weeks',
        priority: Math.abs(benchmark.ctr.percentDiff) > 30 ? 'high' : 'medium',
        expectedResults: {
          currentClicks: Math.round(stats.clicks),
          projectedClicks: Math.round(stats.clicks * (1 + Math.abs(benchmark.ctr.percentDiff) / 100)),
          additionalCustomers: Math.round(stats.clicks * (Math.abs(benchmark.ctr.percentDiff) / 100) * (cvr / 100))
        }
      });
    }
    
    if (benchmark.cvr && benchmark.cvr.performance === 'below') {
      opportunities.push({
        type: 'funnel_optimization',
        channel: channel,
        issue: `${channel} conversion rate ${Math.abs(benchmark.cvr.percentDiff).toFixed(1)}% below benchmark`,
        recommendation: `Optimize landing pages and conversion flow to improve CVR from ${cvr.toFixed(2)}% to ${benchmark.cvr.benchmark}%`,
        specificActions: [
          `Audit landing page experience for ${channel} traffic`,
          `A/B test simplified conversion forms`,
          `Add trust signals and social proof`,
          `Optimize page load speed (<2 seconds)`,
          `Test mobile-first design improvements`,
          `Implement retargeting for bounced visitors`
        ],
        impact: `${Math.round(Math.abs(benchmark.cvr.percentDiff))}% more customers from same traffic`,
        timeline: '3-4 weeks',
        priority: Math.abs(benchmark.cvr.percentDiff) > 25 ? 'high' : 'medium',
        expectedResults: {
          currentConversions: Math.round(stats.customers),
          projectedConversions: Math.round(stats.customers * (1 + Math.abs(benchmark.cvr.percentDiff) / 100)),
          cacImprovement: (cac * (1 - Math.abs(benchmark.cvr.percentDiff) / 200)).toFixed(2)
        }
      });
    }
    
    // ROAS-based opportunities
    if (roas < 2 && roas > 0) {
      opportunities.push({
        type: 'profitability_optimization',
        channel: channel,
        issue: `${channel} ROAS of ${roas.toFixed(2)}x below profitable threshold`,
        recommendation: `Focus on higher-value customer segments and optimize pricing`,
        specificActions: [
          `Analyze customer segments by LTV in ${channel}`,
          `Exclude low-value lookalike audiences`,
          `Test premium product positioning`,
          `Implement dynamic pricing strategies`,
          `Focus spend on highest-converting demographics`
        ],
        impact: `Potential to reach 3-4x ROAS target`,
        timeline: '4-6 weeks',
        priority: 'medium',
        currentMetrics: {
          roas: roas.toFixed(2),
          avgCustomerValue: stats.avgRevenuePerCustomer.toFixed(2),
          ltvCacRatio: stats.ltvCacRatio.toFixed(2)
        }
      });
    }
  });
  
  // Add top-level budget reallocation recommendation
  if (sortedChannels.length >= 2) {
    const bestChannelStats = bestChannel[1];
    const worstChannelStats = worstChannel[1];
    const efficiencyGap = bestChannelStats.efficiencyScore - worstChannelStats.efficiencyScore;
    
    if (efficiencyGap > 30) {
      const reallocationAmount = Math.round(worstChannelStats.avgDailySpend * 0.25);
      opportunities.unshift({
        type: 'strategic_reallocation',
        issue: `${efficiencyGap} point efficiency gap between best and worst channels`,
        recommendation: `Reallocate $${reallocationAmount}/day from ${worstChannel[0]} to ${bestChannel[0]}`,
        specificActions: [
          `Immediately reduce ${worstChannel[0]} daily budget by $${reallocationAmount}`,
          `Increase ${bestChannel[0]} daily budget by $${reallocationAmount}`,
          `Monitor performance for 2 weeks`,
          `Scale winning channel further if results hold`,
          `Document learnings for future budget decisions`
        ],
        impact: `Projected ${Math.round(efficiencyGap * 0.5)}% improvement in overall campaign efficiency`,
        timeline: 'Immediate (2 weeks to measure)',
        priority: 'high',
        budgetImpact: {
          monthlyReallocation: reallocationAmount * 30,
          projectedSavings: Math.round(reallocationAmount * 30 * 0.3),
          riskLevel: 'low'
        }
      });
    }
  }
  
  // Sort opportunities by priority and impact
  return opportunities.sort((a, b) => {
    const priorityOrder = { high: 3, medium: 2, low: 1 };
    return priorityOrder[b.priority] - priorityOrder[a.priority];
  });
}

// Basic data quality assessment
function assessBasicDataQuality(marketing, revenue) {
  const marketingFields = ['date', 'channel', 'spend'];
  const revenueFields = ['date', 'revenue'];
  
  const marketingCompleteness = marketingFields.reduce((acc, field) => {
    const hasField = marketing.some(row => row[field] !== undefined && row[field] !== '');
    return acc + (hasField ? 1 : 0);
  }, 0) / marketingFields.length;

  const revenueCompleteness = revenue.length > 0 ? revenueFields.reduce((acc, field) => {
    const hasField = revenue.some(row => row[field] !== undefined && row[field] !== '');
    return acc + (hasField ? 1 : 0);
  }, 0) / revenueFields.length : 0;

  return {
    completeness: ((marketingCompleteness + revenueCompleteness) / 2 * 100).toFixed(0) + '%',
    marketingRows: marketing.length,
    revenueRows: revenue.length
  };
}

// Clean up cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of dataCache.entries()) {
    if (now - value.timestamp > CACHE_TTL) {
      dataCache.delete(key);
    }
  }
}, CACHE_TTL);

app.listen(PORT, () => {
  console.log(`Optimized CAC Calculator running on port ${PORT}`);
});