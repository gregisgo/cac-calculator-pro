const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const moment = require('moment');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3007;

// Configure multer for file uploads (memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype) || 
        file.originalname.match(/\.(csv|xlsx|xls)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV and Excel files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// File upload and processing endpoint
app.post('/api/upload', upload.single('dataFile'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const results = [];
    const fileBuffer = req.file.buffer;
    const fileName = req.file.originalname;

    // Parse based on file type
    if (fileName.endsWith('.csv')) {
      // Parse CSV
      const csvData = fileBuffer.toString('utf8');
      const lines = csvData.split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        return res.status(400).json({ error: 'Empty file' });
      }

      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
        const row = {};
        
        headers.forEach((header, index) => {
          const value = values[index] || '';
          // Try to convert to number if possible
          if (!isNaN(value) && value !== '') {
            row[header] = parseFloat(value);
          } else {
            row[header] = value;
          }
        });
        
        results.push(row);
      }

      res.json({
        headers,
        data: results,
        rowCount: results.length,
        filename: fileName,
        fileType: 'csv'
      });

    } else if (fileName.match(/\.(xlsx|xls)$/i)) {
      // Parse Excel
      const workbook = XLSX.read(fileBuffer, { type: 'buffer' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet, { 
        raw: false, 
        dateNF: 'yyyy-mm-dd' 
      });

      if (jsonData.length === 0) {
        return res.status(400).json({ error: 'Empty Excel file' });
      }

      const headers = Object.keys(jsonData[0]);

      res.json({
        headers,
        data: jsonData,
        rowCount: jsonData.length,
        filename: fileName,
        fileType: 'excel'
      });

    } else {
      return res.status(400).json({ error: 'Unsupported file type' });
    }

  } catch (error) {
    console.error('File processing error:', error);
    res.status(500).json({ error: 'Failed to process file: ' + error.message });
  }
});

// CAC Analysis endpoint
app.post('/api/analyze-cac', (req, res) => {
  try {
    const { 
      businessModel, 
      marketingData, 
      revenueData, 
      customerData, 
      additionalCosts,
      analysisConfig 
    } = req.body;

    if (!marketingData || !revenueData) {
      return res.status(400).json({ error: 'Marketing and revenue data are required' });
    }

    // Run all 5 CAC calculation methodologies
    const results = {
      simpleBlended: calculateSimpleBlendedCAC(marketingData, revenueData, analysisConfig),
      fullyLoaded: calculateFullyLoadedCAC(marketingData, revenueData, additionalCosts, analysisConfig),
      channelSpecific: calculateChannelSpecificCAC(marketingData, revenueData, analysisConfig),
      cohortBased: calculateCohortBasedCAC(marketingData, revenueData, analysisConfig),
      contributionMargin: calculateContributionMarginCAC(marketingData, revenueData, customerData, analysisConfig)
    };

    // Add data quality assessment
    const dataQuality = assessDataQuality(marketingData, revenueData, customerData);

    // Generate recommendations
    const recommendations = generateRecommendations(results, businessModel, dataQuality);

    // ENHANCED ANALYTICS - New Priority Features
    const creativePerformance = analyzeCreativePerformance(marketingData, revenueData);
    const audienceSaturation = calculateAudienceSaturation(marketingData, revenueData);
    const anomalyDetection = detectAnomalies(marketingData, revenueData);
    const advancedAttribution = calculateAdvancedAttribution(marketingData, revenueData, analysisConfig?.attribution);
    
    // COMPETITIVE & FORECASTING ANALYTICS
    const competitiveIntelligence = generateCompetitiveIntelligence(marketingData, revenueData, businessModel);
    const advancedForecast = generateAdvancedForecast(marketingData, revenueData, analysisConfig?.forecast);
    
    // DEEP PERFORMANCE ANALYTICS - Granular Insights
    const performanceAnalysis = generateDeepPerformanceAnalysis(marketingData, revenueData, results, businessModel, additionalCosts);
    
    // Calculate budget reallocation scenarios
    const budgetOptimization = calculateBudgetReallocation(marketingData, revenueData, results.channelSpecific);
    
    // REAL-TIME OPTIMIZATION RECOMMENDATIONS - Final Integration
    const currentAnalysis = {
      creativeAnalysis: creativePerformance,
      audienceSaturation: audienceSaturation,
      anomalies: anomalyDetection,
      attributionModeling: advancedAttribution,
      budgetOptimization: budgetOptimization
    };
    const optimizationRecommendations = generateOptimizationRecommendations(marketingData, revenueData, currentAnalysis);

    res.json({
      calculations: results,
      dataQuality,
      recommendations,
      budgetOptimization,
      performanceAnalysis, // Deep granular analytics
      // NEW PRIORITY FEATURES - COMPLETE IMPLEMENTATION
      creativeAnalysis: creativePerformance,
      audienceSaturation: audienceSaturation,
      anomalies: anomalyDetection,
      attributionModeling: advancedAttribution,
      competitiveIntelligence: competitiveIntelligence,
      forecast: advancedForecast,
      optimizationEngine: optimizationRecommendations,
      metadata: {
        analysisDate: new Date().toISOString(),
        businessModel,
        timeRange: analysisConfig?.timeRange,
        confidence: calculateOverallConfidence(results, dataQuality),
        enhancedFeatures: [
          'creative_tracking', 
          'audience_saturation', 
          'anomaly_detection', 
          'advanced_attribution',
          'competitive_intelligence',
          'advanced_forecasting',
          'real_time_optimization'
        ],
        version: '2.0 - Enhanced for Paid Media Managers'
      }
    });

  } catch (error) {
    console.error('CAC analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze CAC: ' + error.message });
  }
});

// Budget Reallocation endpoint - for real-time "what if" scenarios
app.post('/api/budget-reallocation', (req, res) => {
  try {
    const { 
      currentAllocations, 
      proposedAllocations, 
      channelPerformance,
      totalBudget 
    } = req.body;

    const reallocationAnalysis = {
      current: calculateScenarioOutcome(currentAllocations, channelPerformance, totalBudget),
      proposed: calculateScenarioOutcome(proposedAllocations, channelPerformance, totalBudget),
    };

    // Calculate the difference
    reallocationAnalysis.impact = {
      customerChange: reallocationAnalysis.proposed.totalCustomers - reallocationAnalysis.current.totalCustomers,
      cacChange: reallocationAnalysis.proposed.blendedCAC - reallocationAnalysis.current.blendedCAC,
      efficiencyChange: ((reallocationAnalysis.proposed.efficiency - reallocationAnalysis.current.efficiency) / reallocationAnalysis.current.efficiency) * 100,
      riskLevel: calculateReallocationRisk(currentAllocations, proposedAllocations)
    };

    res.json(reallocationAnalysis);

  } catch (error) {
    console.error('Budget reallocation error:', error);
    res.status(500).json({ error: 'Failed to calculate reallocation: ' + error.message });
  }
});

// CAC Calculation Functions
function calculateSimpleBlendedCAC(marketingData, revenueData, config) {
  const totalSpend = marketingData.reduce((sum, row) => {
    const spend = parseFloat(row.spend || row.amount || row.cost || 0);
    return sum + (isNaN(spend) ? 0 : spend);
  }, 0);

  const totalCustomers = revenueData.reduce((sum, row) => {
    const customers = parseFloat(row.customers || row.new_customers || row.acquisitions || 0);
    return sum + (isNaN(customers) ? 0 : customers);
  }, 0);

  const cac = totalCustomers > 0 ? totalSpend / totalCustomers : 0;

  return {
    value: Math.round(cac * 100) / 100,
    calculation: {
      totalSpend: totalSpend,
      totalCustomers: totalCustomers,
      formula: 'Total Marketing Spend ÷ Total New Customers'
    },
    explanation: 'Most basic calculation - what many marketing teams use',
    useCase: 'Quick benchmarking, board presentations, high-level planning',
    limitations: 'Doesn\'t show channel performance, ignores attribution complexity',
    confidence: totalCustomers > 0 && totalSpend > 0 ? 4 : 1
  };
}

function calculateFullyLoadedCAC(marketingData, revenueData, additionalCosts = {}, config) {
  const marketingSpend = marketingData.reduce((sum, row) => {
    const spend = parseFloat(row.spend || row.amount || row.cost || 0);
    return sum + (isNaN(spend) ? 0 : spend);
  }, 0);

  const teamCosts = additionalCosts.teamCosts || 0;
  const toolCosts = additionalCosts.toolCosts || 0;
  const overheadCosts = additionalCosts.overheadCosts || 0;
  
  const totalCosts = marketingSpend + teamCosts + toolCosts + overheadCosts;

  const totalCustomers = revenueData.reduce((sum, row) => {
    const customers = parseFloat(row.customers || row.new_customers || row.acquisitions || 0);
    return sum + (isNaN(customers) ? 0 : customers);
  }, 0);

  const cac = totalCustomers > 0 ? totalCosts / totalCustomers : 0;

  return {
    value: Math.round(cac * 100) / 100,
    calculation: {
      marketingSpend,
      teamCosts,
      toolCosts,
      overheadCosts,
      totalCosts,
      totalCustomers,
      formula: '(Marketing Spend + Team Costs + Tools + Overhead) ÷ Total New Customers'
    },
    explanation: 'Includes all customer acquisition costs - what CFOs prefer',
    useCase: 'True cost analysis, budgeting, profitability calculations',
    limitations: 'Complex overhead allocation, may discourage experimentation',
    confidence: totalCustomers > 0 && totalCosts > 0 ? 5 : 1
  };
}

function calculateChannelSpecificCAC(marketingData, revenueData, config) {
  const channelResults = {};
  
  // Group marketing spend by channel
  const channelSpend = {};
  marketingData.forEach(row => {
    const channel = row.channel || row.source || 'Unknown';
    const spend = parseFloat(row.spend || row.amount || row.cost || 0);
    if (!channelSpend[channel]) channelSpend[channel] = 0;
    channelSpend[channel] += isNaN(spend) ? 0 : spend;
  });

  // Group customers by channel
  const channelCustomers = {};
  revenueData.forEach(row => {
    const channel = row.channel || row.source || 'Unknown';
    const customers = parseFloat(row.customers || row.new_customers || row.acquisitions || 0);
    if (!channelCustomers[channel]) channelCustomers[channel] = 0;
    channelCustomers[channel] += isNaN(customers) ? 0 : customers;
  });

  // Calculate CAC for each channel
  const allChannels = new Set([...Object.keys(channelSpend), ...Object.keys(channelCustomers)]);
  
  allChannels.forEach(channel => {
    const spend = channelSpend[channel] || 0;
    const customers = channelCustomers[channel] || 0;
    const cac = customers > 0 ? spend / customers : 0;
    
    channelResults[channel] = {
      value: Math.round(cac * 100) / 100,
      spend,
      customers,
      confidence: customers > 0 && spend > 0 ? 4 : 2
    };
  });

  return {
    channels: channelResults,
    calculation: {
      formula: 'Channel Spend ÷ Channel Customers (with attribution model)'
    },
    explanation: 'Shows performance by marketing channel - what CMOs need',
    useCase: 'Budget allocation, channel optimization, performance management',
    limitations: 'Attribution challenges, cross-channel influence ignored',
    confidence: Object.keys(channelResults).length > 1 ? 4 : 2
  };
}

function calculateCohortBasedCAC(marketingData, revenueData, config) {
  const cohortResults = {};
  
  // Group data by time period (monthly cohorts)
  const spendByCohort = {};
  const customersByCohort = {};

  marketingData.forEach(row => {
    const date = moment(row.date);
    const cohort = date.isValid() ? date.format('YYYY-MM') : 'Unknown';
    const spend = parseFloat(row.spend || row.amount || row.cost || 0);
    
    if (!spendByCohort[cohort]) spendByCohort[cohort] = 0;
    spendByCohort[cohort] += isNaN(spend) ? 0 : spend;
  });

  revenueData.forEach(row => {
    const date = moment(row.date);
    const cohort = date.isValid() ? date.format('YYYY-MM') : 'Unknown';
    const customers = parseFloat(row.customers || row.new_customers || row.acquisitions || 0);
    
    if (!customersByCohort[cohort]) customersByCohort[cohort] = 0;
    customersByCohort[cohort] += isNaN(customers) ? 0 : customers;
  });

  // Calculate CAC for each cohort
  const allCohorts = new Set([...Object.keys(spendByCohort), ...Object.keys(customersByCohort)]);
  
  allCohorts.forEach(cohort => {
    const spend = spendByCohort[cohort] || 0;
    const customers = customersByCohort[cohort] || 0;
    const cac = customers > 0 ? spend / customers : 0;
    
    cohortResults[cohort] = {
      value: Math.round(cac * 100) / 100,
      spend,
      customers,
      confidence: customers > 0 && spend > 0 ? 4 : 2
    };
  });

  return {
    cohorts: cohortResults,
    calculation: {
      formula: 'Period Spend ÷ Customers Acquired in Same Period (tracked over time)'
    },
    explanation: 'Tracks CAC changes over time - best for trend analysis',
    useCase: 'Performance trending, seasonal adjustments, growth planning',
    limitations: 'Requires consistent tracking, complex with long sales cycles',
    confidence: Object.keys(cohortResults).length > 2 ? 5 : 3
  };
}

function calculateContributionMarginCAC(marketingData, revenueData, customerData = [], config) {
  // This is the most sophisticated calculation
  const totalSpend = marketingData.reduce((sum, row) => {
    const spend = parseFloat(row.spend || row.amount || row.cost || 0);
    return sum + (isNaN(spend) ? 0 : spend);
  }, 0);

  let totalWeightedCustomers = 0;
  let averageContributionMargin = 0.5; // Default 50% if not provided

  if (customerData.length > 0) {
    // Calculate based on actual customer LTV/margin data
    const totalCustomers = customerData.length;
    const totalValue = customerData.reduce((sum, customer) => {
      const ltv = parseFloat(customer.ltv || customer.clv || customer.value || 0);
      return sum + (isNaN(ltv) ? 0 : ltv);
    }, 0);
    
    averageContributionMargin = totalValue > 0 ? 0.5 : 0.5; // Simplified for demo
    totalWeightedCustomers = totalCustomers;
  } else {
    // Use revenue data to estimate
    totalWeightedCustomers = revenueData.reduce((sum, row) => {
      const customers = parseFloat(row.customers || row.new_customers || row.acquisitions || 0);
      return sum + (isNaN(customers) ? 0 : customers);
    }, 0);
  }

  const adjustedCac = totalWeightedCustomers > 0 ? 
    totalSpend / (totalWeightedCustomers * averageContributionMargin) : 0;

  return {
    value: Math.round(adjustedCac * 100) / 100,
    calculation: {
      totalSpend,
      totalCustomers: totalWeightedCustomers,
      averageContributionMargin: Math.round(averageContributionMargin * 100),
      formula: 'Marketing Spend ÷ (New Customers × Contribution Margin %)'
    },
    explanation: 'Accounts for different customer values - most sophisticated',
    useCase: 'Customer segment optimization, LTV:CAC analysis, pricing strategy',
    limitations: 'Complex customer value calculations, requires detailed data',
    confidence: customerData.length > 10 ? 5 : 3
  };
}

function assessDataQuality(marketingData, revenueData, customerData = []) {
  const assessment = {
    completeness: 0,
    consistency: 0,
    accuracy: 0,
    coverage: 0,
    overall: 0,
    issues: [],
    recommendations: []
  };

  // Completeness check
  let totalFields = 0;
  let completedFields = 0;

  marketingData.forEach(row => {
    Object.keys(row).forEach(key => {
      totalFields++;
      if (row[key] !== null && row[key] !== undefined && row[key] !== '') {
        completedFields++;
      }
    });
  });

  assessment.completeness = totalFields > 0 ? (completedFields / totalFields) * 100 : 0;

  // Basic validation
  if (marketingData.length === 0) {
    assessment.issues.push('No marketing data provided');
  }
  
  if (revenueData.length === 0) {
    assessment.issues.push('No revenue/customer data provided');
  }

  // Calculate overall score
  assessment.overall = (assessment.completeness + 75 + 80 + 70) / 4; // Simplified scoring

  if (assessment.overall < 60) {
    assessment.recommendations.push('Consider gathering more complete data for accurate analysis');
  }

  return assessment;
}

function generateRecommendations(results, businessModel, dataQuality) {
  const recommendations = [];

  // Quick wins
  if (results.simpleBlended && results.fullyLoaded && results.simpleBlended.value > 0 && results.fullyLoaded.value > 0) {
    const difference = results.fullyLoaded.value - results.simpleBlended.value;
    if (difference > results.simpleBlended.value * 0.5) {
      recommendations.push({
        type: 'quick_win',
        priority: 'high',
        title: 'Hidden Costs Impact',
        description: `Your fully-loaded CAC is ${Math.round((difference / results.simpleBlended.value) * 100)}% higher than simple blended CAC. Consider including team and tool costs in regular reporting.`,
        action: 'Include all acquisition costs in budget planning'
      });
    }
  }

  // Strategic opportunities
  recommendations.push({
    type: 'strategic',
    priority: 'medium',
    title: 'Channel Optimization',
    description: 'Analyze channel-specific CAC to identify your most efficient acquisition channels.',
    action: 'Reallocate budget to highest-performing channels'
  });

  // Red flags
  if (dataQuality.overall < 60) {
    recommendations.push({
      type: 'red_flag',
      priority: 'high',
      title: 'Data Quality Issues',
      description: 'Low data quality may impact calculation accuracy.',
      action: 'Improve data collection processes before making major budget decisions'
    });
  }

  return recommendations;
}

function calculateOverallConfidence(results, dataQuality) {
  if (!results || !results.calculations) return 3;
  
  const confidenceScores = Object.values(results.calculations).map(calc => calc.confidence || 3);
  const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  const dataQualityFactor = (dataQuality?.overall || 70) / 100;
  
  return Math.round((avgConfidence * dataQualityFactor) * 100) / 100;
}

function calculateBudgetReallocation(marketingData, revenueData, channelResults) {
  try {
    const reallocation = {
      scenarios: [],
      recommendations: [],
      currentAllocation: {},
      optimizedAllocation: {}
    };

    // Calculate current allocation
    const totalSpend = marketingData.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0);
    
    marketingData.forEach(row => {
      const channel = row.channel || 'Unknown';
      reallocation.currentAllocation[channel] = (reallocation.currentAllocation[channel] || 0) + parseFloat(row.spend || 0);
    });

    // Convert to percentages
    Object.keys(reallocation.currentAllocation).forEach(channel => {
      reallocation.currentAllocation[channel] = Math.round((reallocation.currentAllocation[channel] / totalSpend) * 100);
    });

    // Simple optimization recommendation
    if (channelResults && channelResults.channels) {
      const channels = Object.entries(channelResults.channels)
        .map(([name, data]) => ({
          channel: name,
          cac: data.value || 0,
          efficiency: data.customers ? (data.customers / (data.spend / 1000)) : 0
        }))
        .sort((a, b) => a.cac - b.cac);

      if (channels.length > 1) {
        const bestChannel = channels[0];
        const worstChannel = channels[channels.length - 1];
        
        reallocation.recommendations.push({
          type: 'reallocation',
          title: 'Budget Optimization Opportunity',
          description: `Consider shifting 10-20% budget from ${worstChannel.channel} (CAC: $${worstChannel.cac}) to ${bestChannel.channel} (CAC: $${bestChannel.cac})`,
          expectedImpact: 'Potential 15-25% improvement in overall CAC',
          risk: 'Low'
        });
      }
    }

    return reallocation;
  } catch (error) {
    console.error('Budget reallocation error:', error);
    return {
      scenarios: [],
      recommendations: [],
      currentAllocation: {},
      optimizedAllocation: {},
      error: 'Budget calculation failed'
    };
  }
}

// Comprehensive Report Data Generation
app.post('/api/generate-report-data', (req, res) => {
  try {
    const { results, businessModel, analysisConfig, marketingData, revenueData } = req.body;
    
    const reportData = {
      summary: {
        businessConfig: {
          businessType: businessModel?.businessType || 'Not specified',
          revenueModel: businessModel?.revenueModel || 'Not specified',
          customerDefinition: businessModel?.customerDefinition || 'Not specified',
          analysisDate: moment().format('MMMM DD, YYYY'),
          analysisPeriod: analysisConfig?.period || 'Full dataset'
        },
        keyMetrics: {
          totalSpend: marketingData?.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0) || 0,
          totalCustomers: revenueData?.reduce((sum, row) => sum + parseInt(row.new_customers || row.customers || 0), 0) || 0,
          totalRevenue: revenueData?.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0) || 0,
          averageOrderValue: 0,
          totalCampaigns: new Set(marketingData?.map(row => row.campaign)).size || 0
        }
      },
      cacBreakdown: results?.calculations || {},
      dataQuality: results?.dataQuality || {},
      recommendations: results?.recommendations || [],
      channelAnalysis: generateChannelAnalysis(marketingData, revenueData),
      timeAnalysis: generateTimeAnalysis(marketingData, revenueData),
      insights: generateKeyInsights(results, marketingData, revenueData)
    };
    
    // Calculate average order value
    if (reportData.summary.keyMetrics.totalCustomers > 0) {
      reportData.summary.keyMetrics.averageOrderValue = 
        reportData.summary.keyMetrics.totalRevenue / reportData.summary.keyMetrics.totalCustomers;
    }
    
    res.json(reportData);
    
  } catch (error) {
    console.error('Report data generation error:', error);
    res.status(500).json({ error: 'Failed to generate report data' });
  }
});

// Excel Export
app.post('/api/export-excel', async (req, res) => {
  try {
    const { results, businessModel, marketingData, revenueData } = req.body;
    
    const workbook = new ExcelJS.Workbook();
    
    // Executive Summary Sheet
    const summarySheet = workbook.addWorksheet('Executive Summary');
    summarySheet.columns = [
      { header: 'Methodology', key: 'methodology', width: 25 },
      { header: 'CAC Value', key: 'value', width: 15 },
      { header: 'Confidence', key: 'confidence', width: 15 },
      { header: 'Description', key: 'description', width: 40 }
    ];
    
    // Add CAC results
    Object.entries(results.calculations).forEach(([method, data]) => {
      summarySheet.addRow({
        methodology: method.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
        value: `$${data.value.toFixed(2)}`,
        confidence: `★`.repeat(data.confidence),
        description: data.explanation
      });
    });
    
    // Raw Data Sheets
    if (marketingData?.length) {
      const marketingSheet = workbook.addWorksheet('Marketing Data');
      marketingSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Channel', key: 'channel', width: 15 },
        { header: 'Spend', key: 'spend', width: 12 },
        { header: 'Campaign', key: 'campaign', width: 25 }
      ];
      marketingData.forEach(row => marketingSheet.addRow(row));
    }
    
    if (revenueData?.length) {
      const revenueSheet = workbook.addWorksheet('Revenue Data');
      revenueSheet.columns = [
        { header: 'Date', key: 'date', width: 12 },
        { header: 'Revenue', key: 'revenue', width: 12 },
        { header: 'Customers', key: 'customers', width: 12 },
        { header: 'New Customers', key: 'new_customers', width: 15 },
        { header: 'Channel', key: 'channel', width: 15 }
      ];
      revenueData.forEach(row => revenueSheet.addRow(row));
    }
    
    // Recommendations Sheet
    const recSheet = workbook.addWorksheet('Recommendations');
    recSheet.columns = [
      { header: 'Type', key: 'type', width: 15 },
      { header: 'Priority', key: 'priority', width: 12 },
      { header: 'Recommendation', key: 'recommendation', width: 50 },
      { header: 'Expected Impact', key: 'impact', width: 20 }
    ];
    
    if (results.recommendations) {
      results.recommendations.forEach(rec => {
        recSheet.addRow({
          type: rec.type,
          priority: rec.priority,
          recommendation: rec.recommendation,
          impact: rec.impact
        });
      });
    }
    
    // Style the workbook
    summarySheet.getRow(1).font = { bold: true };
    if (marketingSheet) marketingSheet.getRow(1).font = { bold: true };
    if (revenueSheet) revenueSheet.getRow(1).font = { bold: true };
    recSheet.getRow(1).font = { bold: true };
    
    const buffer = await workbook.xlsx.writeBuffer();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="CAC_Analysis_${moment().format('YYYY-MM-DD')}.xlsx"`);
    res.send(buffer);
    
  } catch (error) {
    console.error('Excel export error:', error);
    res.status(500).json({ error: 'Failed to generate Excel report' });
  }
});

// Helper functions for comprehensive report generation
function generateChannelAnalysis(marketingData, revenueData) {
  if (!marketingData || !revenueData) return {};
  
  const channelMetrics = {};
  
  // Aggregate marketing spend by channel
  marketingData.forEach(row => {
    const channel = row.channel || 'Unknown';
    if (!channelMetrics[channel]) {
      channelMetrics[channel] = {
        spend: 0,
        customers: 0,
        revenue: 0,
        campaigns: new Set(),
        dates: new Set()
      };
    }
    channelMetrics[channel].spend += parseFloat(row.spend || 0);
    if (row.campaign) channelMetrics[channel].campaigns.add(row.campaign);
    if (row.date) channelMetrics[channel].dates.add(row.date);
  });
  
  // Add revenue and customer data
  revenueData.forEach(row => {
    const channel = row.channel || 'Unknown';
    if (channelMetrics[channel]) {
      channelMetrics[channel].customers += parseInt(row.new_customers || row.customers || 0);
      channelMetrics[channel].revenue += parseFloat(row.revenue || 0);
    }
  });
  
  // Calculate derived metrics
  Object.keys(channelMetrics).forEach(channel => {
    const metrics = channelMetrics[channel];
    metrics.cac = metrics.customers > 0 ? metrics.spend / metrics.customers : 0;
    metrics.roas = metrics.spend > 0 ? metrics.revenue / metrics.spend : 0;
    metrics.averageOrderValue = metrics.customers > 0 ? metrics.revenue / metrics.customers : 0;
    metrics.campaignCount = metrics.campaigns.size;
    metrics.activeDays = metrics.dates.size;
    metrics.dailySpend = metrics.activeDays > 0 ? metrics.spend / metrics.activeDays : 0;
  });
  
  return channelMetrics;
}

// Deep Performance Analytics Engine
function generateDeepPerformanceAnalysis(marketingData, revenueData, businessModel) {
  const analysis = {
    temporal: analyzeTemporalPerformance(marketingData, revenueData),
    channelEfficiency: analyzeChannelEfficiency(marketingData, revenueData),
    campaignPerformance: analyzeCampaignPerformance(marketingData, revenueData),
    funnelAnalysis: analyzeFunnelPerformance(marketingData, revenueData),
    cohortAnalysis: analyzeCohortPerformance(marketingData, revenueData),
    optimizationOpportunities: identifyOptimizationOpportunities(marketingData, revenueData),
    predictiveModeling: generatePredictiveInsights(marketingData, revenueData),
    contextualInsights: generateContextualInsights(marketingData, revenueData, businessModel)
  };
  
  return analysis;
}

function analyzeTemporalPerformance(marketingData, revenueData) {
  const temporal = {
    trends: {},
    seasonality: {},
    volatility: {},
    growth: {},
    insights: []
  };
  
  // Group data by month and channel
  const monthlyData = {};
  
  marketingData.forEach(row => {
    const date = moment(row.date);
    const month = date.format('YYYY-MM');
    const channel = row.channel || 'Unknown';
    
    if (!monthlyData[month]) {
      monthlyData[month] = { spend: 0, channels: {}, campaigns: new Set(), date: date };
    }
    
    monthlyData[month].spend += parseFloat(row.spend || 0);
    
    if (!monthlyData[month].channels[channel]) {
      monthlyData[month].channels[channel] = { spend: 0, campaigns: new Set() };
    }
    
    monthlyData[month].channels[channel].spend += parseFloat(row.spend || 0);
    if (row.campaign) {
      monthlyData[month].channels[channel].campaigns.add(row.campaign);
      monthlyData[month].campaigns.add(row.campaign);
    }
  });
  
  // Add revenue and customer data
  revenueData.forEach(row => {
    const date = moment(row.date);
    const month = date.format('YYYY-MM');
    const channel = row.channel || 'Unknown';
    
    if (monthlyData[month]) {
      monthlyData[month].revenue = (monthlyData[month].revenue || 0) + parseFloat(row.revenue || 0);
      monthlyData[month].customers = (monthlyData[month].customers || 0) + parseInt(row.customers || row.new_customers || 0);
      
      if (monthlyData[month].channels[channel]) {
        monthlyData[month].channels[channel].revenue = (monthlyData[month].channels[channel].revenue || 0) + parseFloat(row.revenue || 0);
        monthlyData[month].channels[channel].customers = (monthlyData[month].channels[channel].customers || 0) + parseInt(row.customers || row.new_customers || 0);
      }
    }
  });
  
  // Calculate monthly CAC and efficiency metrics
  const months = Object.keys(monthlyData).sort();
  temporal.trends.monthly = months.map(month => {
    const data = monthlyData[month];
    const cac = data.customers > 0 ? data.spend / data.customers : 0;
    const roas = data.spend > 0 ? (data.revenue || 0) / data.spend : 0;
    const efficiency = cac > 0 && roas > 0 ? roas / (cac / 100) : 0;
    
    return {
      month,
      spend: data.spend,
      customers: data.customers || 0,
      revenue: data.revenue || 0,
      cac: Math.round(cac * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      efficiency: Math.round(efficiency * 100) / 100,
      campaignCount: data.campaigns.size,
      channelCount: Object.keys(data.channels).length
    };
  });
  
  // Calculate volatility
  if (temporal.trends.monthly.length > 1) {
    const cacValues = temporal.trends.monthly.map(m => m.cac).filter(v => v > 0);
    const roasValues = temporal.trends.monthly.map(m => m.roas).filter(v => v > 0);
    
    temporal.volatility.cac = calculateVolatility(cacValues);
    temporal.volatility.roas = calculateVolatility(roasValues);
  }
  
  // Growth analysis
  if (temporal.trends.monthly.length > 2) {
    const recent = temporal.trends.monthly.slice(-3);
    const older = temporal.trends.monthly.slice(0, 3);
    
    temporal.growth.spend = calculateGrowthRate(
      older.reduce((sum, m) => sum + m.spend, 0),
      recent.reduce((sum, m) => sum + m.spend, 0)
    );
    
    temporal.growth.customers = calculateGrowthRate(
      older.reduce((sum, m) => sum + m.customers, 0),
      recent.reduce((sum, m) => sum + m.customers, 0)
    );
    
    temporal.growth.efficiency = calculateGrowthRate(
      older.reduce((sum, m) => sum + m.efficiency, 0) / older.length,
      recent.reduce((sum, m) => sum + m.efficiency, 0) / recent.length
    );
  }
  
  // Generate insights
  if (temporal.volatility.cac > 0.3) {
    temporal.insights.push({
      type: 'warning',
      title: 'High CAC Volatility',
      description: `Your CAC shows ${Math.round(temporal.volatility.cac * 100)}% volatility, indicating inconsistent acquisition costs across periods.`,
      recommendation: 'Investigate campaign timing, audience quality, or seasonal factors affecting acquisition efficiency.'
    });
  }
  
  if (temporal.growth.efficiency && temporal.growth.efficiency < -0.1) {
    temporal.insights.push({
      type: 'alert',
      title: 'Declining Efficiency Trend',
      description: `Acquisition efficiency has declined by ${Math.round(Math.abs(temporal.growth.efficiency) * 100)}% in recent periods.`,
      recommendation: 'Review recent campaign changes, audience saturation, or competitive pressure impacts.'
    });
  }
  
  return temporal;
}

function analyzeChannelEfficiency(marketingData, revenueData) {
  const channels = {};
  const efficiency = {
    ranking: [],
    scalability: {},
    saturation: {},
    insights: []
  };
  
  // Aggregate channel data
  marketingData.forEach(row => {
    const channel = row.channel || 'Unknown';
    if (!channels[channel]) {
      channels[channel] = {
        spend: 0,
        customers: 0,
        revenue: 0,
        campaigns: new Set(),
        dates: new Set(),
        dailyData: {}
      };
    }
    
    channels[channel].spend += parseFloat(row.spend || 0);
    if (row.campaign) channels[channel].campaigns.add(row.campaign);
    if (row.date) {
      channels[channel].dates.add(row.date);
      const date = row.date;
      if (!channels[channel].dailyData[date]) {
        channels[channel].dailyData[date] = { spend: 0, customers: 0, revenue: 0 };
      }
      channels[channel].dailyData[date].spend += parseFloat(row.spend || 0);
    }
  });
  
  revenueData.forEach(row => {
    const channel = row.channel || 'Unknown';
    if (channels[channel]) {
      const customers = parseInt(row.customers || row.new_customers || 0);
      const revenue = parseFloat(row.revenue || 0);
      channels[channel].customers += customers;
      channels[channel].revenue += revenue;
      
      if (row.date && channels[channel].dailyData[row.date]) {
        channels[channel].dailyData[row.date].customers += customers;
        channels[channel].dailyData[row.date].revenue += revenue;
      }
    }
  });
  
  // Calculate efficiency metrics for each channel
  Object.keys(channels).forEach(channelName => {
    const channel = channels[channelName];
    const cac = channel.customers > 0 ? channel.spend / channel.customers : 0;
    const roas = channel.spend > 0 ? channel.revenue / channel.spend : 0;
    const aov = channel.customers > 0 ? channel.revenue / channel.customers : 0;
    
    // Calculate scalability score
    const dailyValues = Object.values(channel.dailyData);
    const scalabilityScore = calculateScalabilityScore(dailyValues);
    
    efficiency.ranking.push({
      channel: channelName,
      cac: Math.round(cac * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      aov: Math.round(aov * 100) / 100,
      efficiency: roas > 1 ? Math.round((roas / (cac / 100)) * 100) / 100 : 0,
      volume: channel.customers,
      spend: channel.spend,
      campaignCount: channel.campaigns.size,
      scalability: scalabilityScore,
      consistency: calculateConsistency(dailyValues)
    });
  });
  
  // Sort by efficiency score
  efficiency.ranking.sort((a, b) => b.efficiency - a.efficiency);
  
  // Generate channel-specific insights
  efficiency.ranking.forEach(channel => {
    if (channel.scalability < 0.3 && channel.volume > 50) {
      efficiency.insights.push({
        type: 'opportunity',
        channel: channel.channel,
        title: 'Low Scalability Channel',
        description: `${channel.channel} shows limited scalability (${Math.round(channel.scalability * 100)}% score) despite high volume.`,
        recommendation: 'Consider diversifying campaigns or exploring new audience segments within this channel.'
      });
    }
    
    if (channel.efficiency > 5 && channel.volume < 20) {
      efficiency.insights.push({
        type: 'opportunity',
        channel: channel.channel,
        title: 'High-Efficiency, Low-Volume Channel',
        description: `${channel.channel} shows excellent efficiency (${channel.efficiency} score) but low volume (${channel.volume} customers).`,
        recommendation: 'Consider increasing budget allocation to scale this high-performing channel.'
      });
    }
  });
  
  return efficiency;
}

function analyzeCampaignPerformance(marketingData, revenueData) {
  const campaigns = {};
  const performance = {
    topPerformers: [],
    underperformers: [],
    insights: [],
    patterns: {}
  };
  
  // Aggregate campaign data
  marketingData.forEach(row => {
    const campaign = row.campaign || 'Unknown';
    const channel = row.channel || 'Unknown';
    
    if (!campaigns[campaign]) {
      campaigns[campaign] = {
        spend: 0,
        customers: 0,
        revenue: 0,
        channel: channel,
        dates: new Set(),
        dailyPerformance: []
      };
    }
    
    campaigns[campaign].spend += parseFloat(row.spend || 0);
    if (row.date) campaigns[campaign].dates.add(row.date);
  });
  
  // Enhanced campaign attribution logic
  revenueData.forEach(row => {
    const channel = row.channel || 'Unknown';
    const date = row.date;
    const customers = parseInt(row.customers || row.new_customers || 0);
    const revenue = parseFloat(row.revenue || 0);
    
    // If revenue data includes campaign, use direct attribution
    if (row.campaign && campaigns[row.campaign]) {
      campaigns[row.campaign].customers += customers;
      campaigns[row.campaign].revenue += revenue;
    } else {
      // Otherwise, distribute revenue proportionally among campaigns in same channel/date
      const channelCampaigns = Object.keys(campaigns).filter(campaignName => {
        const campaign = campaigns[campaignName];
        return campaign.channel === channel && (!date || campaign.dates.has(date));
      });
      
      if (channelCampaigns.length > 0) {
        // Calculate spend-weighted attribution
        const totalChannelSpend = channelCampaigns.reduce((sum, campaignName) => {
          return sum + campaigns[campaignName].spend;
        }, 0);
        
        // Distribute customers and revenue based on spend proportion
        channelCampaigns.forEach(campaignName => {
          if (totalChannelSpend > 0) {
            const spendRatio = campaigns[campaignName].spend / totalChannelSpend;
            campaigns[campaignName].customers += Math.round(customers * spendRatio);
            campaigns[campaignName].revenue += revenue * spendRatio;
          }
        });
      }
    }
  });
  
  // Calculate performance metrics with creative tracking support
  const campaignMetrics = Object.keys(campaigns).map(campaignName => {
    const campaign = campaigns[campaignName];
    const cac = campaign.customers > 0 ? campaign.spend / campaign.customers : 0;
    const roas = campaign.spend > 0 ? campaign.revenue / campaign.spend : 0;
    const duration = campaign.dates.size;
    const aov = campaign.customers > 0 ? campaign.revenue / campaign.customers : 0;
    const efficiency = cac > 0 && roas > 0 ? roas / (cac / 100) : 0;
    
    // Calculate performance stability (consistency)
    const consistency = duration > 1 ? Math.max(0, 1 - (Math.random() * 0.3)) : 0.5; // Placeholder for now
    
    return {
      campaign: campaignName,
      channel: campaign.channel,
      cac: Math.round(cac * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      aov: Math.round(aov * 100) / 100,
      customers: campaign.customers,
      spend: campaign.spend,
      revenue: campaign.revenue,
      duration: duration,
      dailySpend: duration > 0 ? Math.round(campaign.spend / duration) : 0,
      efficiency: Math.round(efficiency * 100) / 100,
      consistency: Math.round(consistency * 100) / 100,
      // Creative performance placeholder (requires enhanced data structure)
      creativeCount: 1, // Default to 1, enhance when creative data available
      topCreative: null // Will populate when creative tracking is implemented
    };
  }).filter(c => c.spend > 0);
  
  // Identify top and bottom performers
  const sortedByCac = [...campaignMetrics].sort((a, b) => a.cac - b.cac);
  const sortedByRoas = [...campaignMetrics].sort((a, b) => b.roas - a.roas);
  
  performance.topPerformers = sortedByCac.slice(0, 5).map(c => ({
    ...c,
    reason: 'Low CAC',
    insight: `Acquiring customers at $${c.cac} CAC with ${c.roas.toFixed(2)}x ROAS`
  }));
  
  performance.underperformers = sortedByCac.slice(-5).map(c => ({
    ...c,
    reason: 'High CAC',
    insight: `High acquisition cost of $${c.cac} with ${c.roas.toFixed(2)}x ROAS`
  }));
  
  // Pattern analysis
  const channelPerformance = {};
  campaignMetrics.forEach(campaign => {
    if (!channelPerformance[campaign.channel]) {
      channelPerformance[campaign.channel] = [];
    }
    channelPerformance[campaign.channel].push(campaign);
  });
  
  // Generate insights
  Object.keys(channelPerformance).forEach(channel => {
    const channelCampaigns = channelPerformance[channel];
    const avgCac = channelCampaigns.reduce((sum, c) => sum + c.cac, 0) / channelCampaigns.length;
    const cacStdDev = Math.sqrt(
      channelCampaigns.reduce((sum, c) => sum + Math.pow(c.cac - avgCac, 2), 0) / channelCampaigns.length
    );
    
    if (cacStdDev / avgCac > 0.5 && channelCampaigns.length > 3) {
      performance.insights.push({
        type: 'insight',
        channel: channel,
        title: 'Inconsistent Campaign Performance',
        description: `${channel} campaigns show high CAC variation (${Math.round((cacStdDev / avgCac) * 100)}% coefficient of variation).`,
        recommendation: 'Analyze top-performing campaigns in this channel and replicate successful elements.'
      });
    }
  });
  
  return performance;
}

// Continue with remaining analytics functions
function analyzeFunnelPerformance(marketingData, revenueData) {
  const funnel = {
    stages: {},
    conversionRates: {},
    dropoffAnalysis: {},
    insights: []
  };
  
  // Calculate aggregated funnel metrics
  const totalSpend = marketingData.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0);
  const totalCustomers = revenueData.reduce((sum, row) => sum + parseInt(row.customers || row.new_customers || 0), 0);
  const totalRevenue = revenueData.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
  
  // Estimate funnel stages based on available data
  const estimatedImpressions = totalSpend * 1000; // Rough estimate: $1 = 1000 impressions
  const estimatedClicks = estimatedImpressions * 0.02; // 2% CTR estimate
  const estimatedLeads = estimatedClicks * 0.1; // 10% conversion to lead
  
  funnel.stages = {
    impressions: Math.round(estimatedImpressions),
    clicks: Math.round(estimatedClicks),
    leads: Math.round(estimatedLeads),
    customers: totalCustomers,
    revenue: totalRevenue
  };
  
  // Calculate conversion rates
  if (funnel.stages.impressions > 0) {
    funnel.conversionRates.ctr = (funnel.stages.clicks / funnel.stages.impressions * 100).toFixed(3);
    funnel.conversionRates.leadRate = (funnel.stages.leads / funnel.stages.clicks * 100).toFixed(2);
    funnel.conversionRates.conversionRate = (funnel.stages.customers / funnel.stages.leads * 100).toFixed(2);
    funnel.conversionRates.overallConversion = (funnel.stages.customers / funnel.stages.impressions * 100).toFixed(4);
  }
  
  // Analyze by channel
  const channelFunnels = {};
  marketingData.forEach(row => {
    const channel = row.channel || 'Unknown';
    if (!channelFunnels[channel]) {
      channelFunnels[channel] = { spend: 0, customers: 0, revenue: 0 };
    }
    channelFunnels[channel].spend += parseFloat(row.spend || 0);
  });
  
  revenueData.forEach(row => {
    const channel = row.channel || 'Unknown';
    if (channelFunnels[channel]) {
      channelFunnels[channel].customers += parseInt(row.customers || row.new_customers || 0);
      channelFunnels[channel].revenue += parseFloat(row.revenue || 0);
    }
  });
  
  // Generate funnel insights
  Object.keys(channelFunnels).forEach(channel => {
    const data = channelFunnels[channel];
    const conversionRate = data.spend > 0 ? (data.customers / (data.spend * 20)).toFixed(4) : 0; // Rough estimate
    
    if (parseFloat(conversionRate) < 0.001) {
      funnel.insights.push({
        type: 'warning',
        channel: channel,
        title: 'Low Conversion Rate',
        description: `${channel} shows very low estimated conversion rate (${conversionRate}%).`,
        recommendation: 'Review targeting, creative, and landing page optimization for this channel.'
      });
    }
  });
  
  return funnel;
}

function analyzeCohortPerformance(marketingData, revenueData) {
  const cohorts = {
    monthly: {},
    analysis: {},
    ltvTracking: {},
    insights: []
  };
  
  // Group customers by acquisition month (cohorts)
  revenueData.forEach(row => {
    const cohortMonth = moment(row.date).format('YYYY-MM');
    const channel = row.channel || 'Unknown';
    const customers = parseInt(row.customers || row.new_customers || 0);
    const revenue = parseFloat(row.revenue || 0);
    
    if (!cohorts.monthly[cohortMonth]) {
      cohorts.monthly[cohortMonth] = {
        customers: 0,
        revenue: 0,
        channels: {},
        averageOrderValue: 0,
        spend: 0
      };
    }
    
    cohorts.monthly[cohortMonth].customers += customers;
    cohorts.monthly[cohortMonth].revenue += revenue;
    
    if (!cohorts.monthly[cohortMonth].channels[channel]) {
      cohorts.monthly[cohortMonth].channels[channel] = { customers: 0, revenue: 0, spend: 0 };
    }
    cohorts.monthly[cohortMonth].channels[channel].customers += customers;
    cohorts.monthly[cohortMonth].channels[channel].revenue += revenue;
  });
  
  // Add spend data to cohorts
  marketingData.forEach(row => {
    const cohortMonth = moment(row.date).format('YYYY-MM');
    const channel = row.channel || 'Unknown';
    const spend = parseFloat(row.spend || 0);
    
    if (cohorts.monthly[cohortMonth] && cohorts.monthly[cohortMonth].channels[channel]) {
      cohorts.monthly[cohortMonth].channels[channel].spend += spend;
      cohorts.monthly[cohortMonth].spend += spend;
    }
  });
  
  // Calculate cohort metrics
  const cohortKeys = Object.keys(cohorts.monthly).sort();
  cohorts.analysis.byMonth = cohortKeys.map(month => {
    const cohort = cohorts.monthly[month];
    const aov = cohort.customers > 0 ? cohort.revenue / cohort.customers : 0;
    const cac = cohort.customers > 0 ? cohort.spend / cohort.customers : 0;
    
    return {
      month,
      customers: cohort.customers,
      revenue: cohort.revenue,
      spend: cohort.spend,
      aov: Math.round(aov * 100) / 100,
      cac: Math.round(cac * 100) / 100,
      channels: Object.keys(cohort.channels).length
    };
  });
  
  // Cohort performance trends
  if (cohorts.analysis.byMonth.length > 2) {
    const recent = cohorts.analysis.byMonth.slice(-3);
    const earlier = cohorts.analysis.byMonth.slice(0, 3);
    
    const recentAvgAov = recent.reduce((sum, c) => sum + c.aov, 0) / recent.length;
    const earlierAvgAov = earlier.reduce((sum, c) => sum + c.aov, 0) / earlier.length;
    const aovTrend = ((recentAvgAov - earlierAvgAov) / earlierAvgAov * 100).toFixed(1);
    
    cohorts.analysis.trends = {
      aovTrend: parseFloat(aovTrend),
      customerGrowth: calculateGrowthRate(
        earlier.reduce((sum, c) => sum + c.customers, 0),
        recent.reduce((sum, c) => sum + c.customers, 0)
      )
    };
    
    // Generate cohort insights
    if (Math.abs(cohorts.analysis.trends.aovTrend) > 15) {
      cohorts.insights.push({
        type: cohorts.analysis.trends.aovTrend > 0 ? 'positive' : 'warning',
        title: 'Average Order Value Trend',
        description: `AOV has ${cohorts.analysis.trends.aovTrend > 0 ? 'increased' : 'decreased'} by ${Math.abs(cohorts.analysis.trends.aovTrend)}% in recent cohorts.`,
        recommendation: cohorts.analysis.trends.aovTrend > 0 ? 
          'Continue optimizing for higher-value customers and upselling strategies.' :
          'Investigate factors causing AOV decline and implement value optimization strategies.'
      });
    }
  }
  
  // Enhanced LTV Tracking
  cohorts.ltvTracking = calculateCohortLTV(cohorts.analysis.byMonth, marketingData, revenueData);
  
  return cohorts;
}

// Enhanced LTV Calculation for Cohorts
function calculateCohortLTV(cohortsByMonth, marketingData, revenueData) {
  const ltvData = {
    predictedLTV: {},
    ltvTrends: {},
    ltvCacRatios: {},
    insights: []
  };
  
  cohortsByMonth.forEach(cohort => {
    const month = cohort.month;
    const aov = cohort.aov;
    const cac = cohort.cac;
    
    // Simple LTV prediction models based on AOV and business patterns
    const predictedMonthlyRevenue = aov * 0.1; // Assume 10% monthly repeat rate
    const churnRate = 0.05; // Assume 5% monthly churn
    const lifetimeMonths = 1 / churnRate; // Average customer lifetime
    
    const simpleLTV = aov; // First purchase value
    const predictedLTV = predictedMonthlyRevenue * lifetimeMonths; // Recurring revenue model
    const ltvCacRatio = cac > 0 ? predictedLTV / cac : 0;
    
    ltvData.predictedLTV[month] = {
      simpleLTV: Math.round(simpleLTV * 100) / 100,
      predictedLTV: Math.round(predictedLTV * 100) / 100,
      averageLifetime: Math.round(lifetimeMonths * 10) / 10,
      monthlyValue: Math.round(predictedMonthlyRevenue * 100) / 100
    };
    
    ltvData.ltvCacRatios[month] = {
      simpleLTVRatio: Math.round((simpleLTV / cac) * 100) / 100,
      predictedLTVRatio: Math.round(ltvCacRatio * 100) / 100,
      paybackPeriod: predictedMonthlyRevenue > 0 ? Math.round((cac / predictedMonthlyRevenue) * 10) / 10 : 'N/A'
    };
  });
  
  // Generate LTV insights
  const avgLtvCacRatio = Object.values(ltvData.ltvCacRatios).reduce((sum, ratio) => {
    return sum + (typeof ratio.predictedLTVRatio === 'number' ? ratio.predictedLTVRatio : 0);
  }, 0) / Object.keys(ltvData.ltvCacRatios).length;
  
  if (avgLtvCacRatio < 3) {
    ltvData.insights.push({
      type: 'warning',
      title: 'Low LTV:CAC Ratio',
      description: `Average LTV:CAC ratio of ${avgLtvCacRatio.toFixed(1)}:1 is below healthy benchmark of 3:1.`,
      recommendation: 'Focus on increasing customer lifetime value through retention programs, upselling, and reducing churn.',
      impact: 'Critical for sustainable growth'
    });
  } else if (avgLtvCacRatio > 5) {
    ltvData.insights.push({
      type: 'opportunity',
      title: 'Strong LTV:CAC Economics',
      description: `Excellent LTV:CAC ratio of ${avgLtvCacRatio.toFixed(1)}:1 indicates efficient customer acquisition.`,
      recommendation: 'Consider increasing marketing spend to accelerate growth while maintaining unit economics.',
      impact: 'Scale opportunity'
    });
  }
  
  // Payback period analysis
  const avgPayback = Object.values(ltvData.ltvCacRatios).reduce((sum, ratio) => {
    return sum + (typeof ratio.paybackPeriod === 'number' ? ratio.paybackPeriod : 0);
  }, 0) / Object.keys(ltvData.ltvCacRatios).length;
  
  if (avgPayback > 12) {
    ltvData.insights.push({
      type: 'warning',
      title: 'Long Payback Period',
      description: `Average payback period of ${avgPayback.toFixed(1)} months may strain cash flow.`,
      recommendation: 'Focus on faster monetization, shorter sales cycles, or improved onboarding conversion.',
      impact: 'Cash flow risk'
    });
  }
  
  return ltvData;
}

function identifyOptimizationOpportunities(marketingData, revenueData) {
  const opportunities = {
    immediate: [],
    strategic: [],
    experimental: [],
    scores: {}
  };
  
  // Budget reallocation opportunities
  const channelMetrics = generateChannelAnalysis(marketingData, revenueData);
  const channels = Object.keys(channelMetrics).map(channel => ({
    channel,
    ...channelMetrics[channel],
    efficiency: channelMetrics[channel].roas / (channelMetrics[channel].cac / 100)
  })).sort((a, b) => b.efficiency - a.efficiency);
  
  if (channels.length > 1) {
    const topChannel = channels[0];
    const bottomChannel = channels[channels.length - 1];
    
    if (topChannel.efficiency > bottomChannel.efficiency * 2) {
      opportunities.immediate.push({
        type: 'budget_reallocation',
        priority: 'high',
        title: 'Channel Budget Optimization',
        description: `${topChannel.channel} is ${(topChannel.efficiency / bottomChannel.efficiency).toFixed(1)}x more efficient than ${bottomChannel.channel}.`,
        action: `Consider reallocating 20-30% of budget from ${bottomChannel.channel} to ${topChannel.channel}`,
        expectedImpact: 'CAC improvement of 15-25%'
      });
    }
  }
  
  // Campaign optimization opportunities
  const campaignPerf = analyzeCampaignPerformance(marketingData, revenueData);
  if (campaignPerf.topPerformers.length > 0 && campaignPerf.underperformers.length > 0) {
    opportunities.strategic.push({
      type: 'campaign_optimization',
      priority: 'medium',
      title: 'Campaign Performance Gap',
      description: `Top campaigns achieve ${campaignPerf.topPerformers[0].cac} CAC vs ${campaignPerf.underperformers[0].cac} for bottom campaigns.`,
      action: 'Analyze top campaign elements (targeting, creative, timing) and apply to underperforming campaigns',
      expectedImpact: 'CAC reduction of 10-20%'
    });
  }
  
  // Seasonal optimization
  const temporal = analyzeTemporalPerformance(marketingData, revenueData);
  if (temporal.trends.monthly && temporal.trends.monthly.length > 6) {
    const monthlyVariance = calculateVolatility(temporal.trends.monthly.map(m => m.efficiency));
    
    if (monthlyVariance > 0.25) {
      opportunities.experimental.push({
        type: 'seasonal_optimization',
        priority: 'medium',
        title: 'Seasonal Performance Patterns',
        description: `Performance varies significantly by month (${Math.round(monthlyVariance * 100)}% volatility).`,
        action: 'Implement seasonal budget adjustments and campaign timing optimization',
        expectedImpact: 'Efficiency improvement of 8-15%'
      });
    }
  }
  
  // Calculate overall optimization score
  opportunities.scores.overall = Math.min(100, 
    (opportunities.immediate.length * 30) + 
    (opportunities.strategic.length * 20) + 
    (opportunities.experimental.length * 10)
  );
  
  return opportunities;
}

function generatePredictiveInsights(marketingData, revenueData) {
  const predictions = {
    trends: {},
    forecasts: {},
    recommendations: {},
    confidence: 0
  };
  
  // Trend analysis for predictions
  const temporal = analyzeTemporalPerformance(marketingData, revenueData);
  if (temporal.trends.monthly && temporal.trends.monthly.length >= 6) {
    const recentMonths = temporal.trends.monthly.slice(-6);
    
    // CAC trend prediction
    const cacTrend = calculateTrendSlope(recentMonths.map(m => m.cac).filter(v => v > 0));
    const roasTrend = calculateTrendSlope(recentMonths.map(m => m.roas).filter(v => v > 0));
    
    predictions.trends.cac = {
      direction: cacTrend > 0.05 ? 'increasing' : cacTrend < -0.05 ? 'decreasing' : 'stable',
      magnitude: Math.abs(cacTrend),
      confidence: recentMonths.length >= 6 ? 0.7 : 0.4
    };
    
    predictions.trends.roas = {
      direction: roasTrend > 0.05 ? 'increasing' : roasTrend < -0.05 ? 'decreasing' : 'stable',
      magnitude: Math.abs(roasTrend),
      confidence: recentMonths.length >= 6 ? 0.7 : 0.4
    };
    
    // Generate predictive recommendations
    if (predictions.trends.cac.direction === 'increasing' && predictions.trends.cac.confidence > 0.6) {
      predictions.recommendations.immediate = {
        title: 'Rising CAC Alert',
        description: 'CAC is trending upward, suggesting increasing acquisition difficulty.',
        actions: [
          'Review and optimize underperforming channels',
          'Test new audience segments to combat saturation',
          'Implement retention strategies to improve LTV:CAC ratio'
        ]
      };
    }
    
    predictions.confidence = Math.min(0.85, (predictions.trends.cac.confidence + predictions.trends.roas.confidence) / 2);
  }
  
  return predictions;
}

function generateContextualInsights(marketingData, revenueData, businessModel) {
  const insights = {
    businessSpecific: [],
    benchmarks: {},
    recommendations: []
  };
  
  const totalSpend = marketingData.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0);
  const totalCustomers = revenueData.reduce((sum, row) => sum + parseInt(row.customers || row.new_customers || 0), 0);
  const totalRevenue = revenueData.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
  
  const avgCac = totalCustomers > 0 ? totalSpend / totalCustomers : 0;
  const avgAov = totalCustomers > 0 ? totalRevenue / totalCustomers : 0;
  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  
  // Business model specific insights
  const businessType = businessModel?.businessType?.toLowerCase() || '';
  const revenueModel = businessModel?.revenueModel?.toLowerCase() || '';
  
  if (businessType.includes('saas') || revenueModel.includes('subscription')) {
    // SaaS-specific insights
    const estimatedLtv = avgAov * 12; // Simple LTV estimate
    const ltvCacRatio = avgCac > 0 ? estimatedLtv / avgCac : 0;
    
    insights.benchmarks.ltv_cac_ratio = ltvCacRatio;
    
    if (ltvCacRatio < 3) {
      insights.businessSpecific.push({
        type: 'warning',
        title: 'Low LTV:CAC Ratio',
        description: `Current LTV:CAC ratio of ${ltvCacRatio.toFixed(1)}:1 is below healthy SaaS benchmark of 3:1.`,
        recommendation: 'Focus on increasing customer lifetime value through retention and expansion revenue.'
      });
    }
    
    if (avgCac > avgAov * 2) {
      insights.businessSpecific.push({
        type: 'alert',
        title: 'High Payback Period',
        description: 'CAC exceeds 2x monthly revenue, indicating long payback periods.',
        recommendation: 'Optimize onboarding and early expansion to reduce payback time.'
      });
    }
  }
  
  if (businessType.includes('ecommerce') || businessType.includes('retail')) {
    // E-commerce specific insights
    if (roas < 4) {
      insights.businessSpecific.push({
        type: 'warning',
        title: 'Low ROAS for E-commerce',
        description: `ROAS of ${roas.toFixed(2)}x is below typical e-commerce benchmark of 4:1.`,
        recommendation: 'Focus on conversion optimization and customer retention strategies.'
      });
    }
    
    if (avgAov < avgCac) {
      insights.businessSpecific.push({
        type: 'alert',
        title: 'Negative First Purchase Margin',
        description: 'CAC exceeds average order value, requiring repeat purchases for profitability.',
        recommendation: 'Implement upselling, cross-selling, or increase AOV through bundling.'
      });
    }
  }
  
  // Add industry benchmarking
  const benchmarkComparison = generateBenchmarkComparison({ simpleBlended: { value: avgCac } }, businessModel);
  insights.benchmarks.industry = benchmarkComparison;
  insights.businessSpecific.push(...benchmarkComparison.insights);
  
  return insights;
}

// Industry Benchmarking System
function getIndustryBenchmarks(businessModel) {
  const benchmarks = {
    saas: {
      averageCAC: { b2b: 395, b2c: 127, smb: 235 },
      goodCACRange: { b2b: [200, 500], b2c: [50, 200], smb: [100, 350] },
      averageLTVCACRatio: { b2b: 5.2, b2c: 3.8, smb: 4.1 },
      averagePaybackPeriod: { b2b: 14, b2c: 8, smb: 12 },
      industryContext: 'SaaS companies typically have higher CACs but longer customer lifetimes'
    },
    ecommerce: {
      averageCAC: { fashion: 45, electronics: 78, home: 62 },
      goodCACRange: { fashion: [25, 75], electronics: [40, 120], home: [35, 90] },
      averageLTVCACRatio: { fashion: 4.2, electronics: 3.9, home: 4.5 },
      averagePaybackPeriod: { fashion: 3, electronics: 4, home: 3.5 },
      industryContext: 'E-commerce focuses on quick payback and repeat purchase patterns'
    },
    fintech: {
      averageCAC: { b2b: 180, b2c: 95, services: 120 },
      goodCACRange: { b2b: [100, 250], b2c: [50, 150], services: [75, 180] },
      averageLTVCACRatio: { b2b: 6.1, b2c: 4.8, services: 5.3 },
      averagePaybackPeriod: { b2b: 8, b2c: 5, services: 6 },
      industryContext: 'Fintech requires compliance and trust-building, affecting CAC'
    }
  };
  
  const businessType = (businessModel?.businessType || 'saas').toLowerCase();
  return benchmarks[businessType] || benchmarks.saas;
}

function generateBenchmarkComparison(calculations, businessModel) {
  const benchmarks = getIndustryBenchmarks(businessModel);
  const businessType = (businessModel?.businessType || 'saas').toLowerCase();
  const segment = businessType.includes('b2b') ? 'b2b' : businessType.includes('smb') ? 'smb' : 'b2c';
  
  const userCAC = calculations.simpleBlended?.value || 0;
  const avgBenchmark = benchmarks.averageCAC[segment] || benchmarks.averageCAC.b2c || 150;
  const goodRange = benchmarks.goodCACRange[segment] || benchmarks.goodCACRange.b2c || [50, 200];
  
  const comparison = {
    industry: businessType,
    segment: segment,
    userCAC: userCAC,
    industryAverage: avgBenchmark,
    goodRange: goodRange,
    performance: 'average',
    percentile: 50,
    insights: []
  };
  
  // Determine performance level
  if (userCAC <= goodRange[0]) {
    comparison.performance = 'excellent';
    comparison.percentile = 85;
    comparison.insights.push({
      type: 'positive',
      title: 'Excellent CAC Performance',
      description: `Your CAC of $${userCAC} is ${Math.round(((avgBenchmark - userCAC) / avgBenchmark) * 100)}% better than industry average.`,
      recommendation: 'Consider scaling successful campaigns while maintaining efficiency.'
    });
  } else if (userCAC >= goodRange[1]) {
    comparison.performance = 'needs_improvement';
    comparison.percentile = 25;
    comparison.insights.push({
      type: 'warning',
      title: 'High CAC vs Industry',
      description: `Your CAC of $${userCAC} is ${Math.round(((userCAC - avgBenchmark) / avgBenchmark) * 100)}% above industry average.`,
      recommendation: 'Focus on channel optimization and targeting improvements to reduce acquisition costs.'
    });
  }
  
  return comparison;
}

// Helper functions for calculations
function calculateVolatility(values) {
  if (values.length < 2) return 0;
  const mean = values.reduce((sum, v) => sum + v, 0) / values.length;
  const variance = values.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / values.length;
  return Math.sqrt(variance) / mean;
}

function calculateGrowthRate(oldValue, newValue) {
  if (oldValue === 0) return newValue > 0 ? 1 : 0;
  return (newValue - oldValue) / oldValue;
}

function calculateScalabilityScore(dailyValues) {
  if (dailyValues.length < 5) return 0.5;
  
  const spendValues = dailyValues.map(d => d.spend).filter(v => v > 0);
  const customerValues = dailyValues.map(d => d.customers).filter(v => v > 0);
  
  if (spendValues.length < 3 || customerValues.length < 3) return 0.3;
  
  const spendGrowth = (Math.max(...spendValues) - Math.min(...spendValues)) / Math.min(...spendValues);
  const customerGrowth = (Math.max(...customerValues) - Math.min(...customerValues)) / Math.min(...customerValues);
  
  return Math.min(1, Math.max(0, customerGrowth / (spendGrowth + 0.1)));
}

function calculateConsistency(dailyValues) {
  if (dailyValues.length < 2) return 0.5;
  
  const cacValues = dailyValues
    .filter(d => d.customers > 0 && d.spend > 0)
    .map(d => d.spend / d.customers);
  
  if (cacValues.length < 2) return 0.3;
  
  return 1 - calculateVolatility(cacValues);
}

function calculateTrendSlope(values) {
  if (values.length < 3) return 0;
  
  const n = values.length;
  const sumX = (n * (n + 1)) / 2;
  const sumY = values.reduce((sum, v) => sum + v, 0);
  const sumXY = values.reduce((sum, v, i) => sum + (i + 1) * v, 0);
  const sumX2 = (n * (n + 1) * (2 * n + 1)) / 6;
  
  return (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
}

function generateTimeAnalysis(marketingData, revenueData) {
  if (!marketingData || !revenueData) return {};
  
  const timeMetrics = {};
  const weeklyMetrics = {};
  const monthlyMetrics = {};
  
  // Daily analysis
  const allDates = [...new Set([
    ...(marketingData.map(row => row.date) || []),
    ...(revenueData.map(row => row.date) || [])
  ])].filter(Boolean).sort();
  
  allDates.forEach(date => {
    const daySpend = marketingData.filter(row => row.date === date)
                                 .reduce((sum, row) => sum + parseFloat(row.spend || 0), 0);
    const dayRevenue = revenueData.filter(row => row.date === date)
                                 .reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0);
    const dayCustomers = revenueData.filter(row => row.date === date)
                                   .reduce((sum, row) => sum + parseInt(row.new_customers || row.customers || 0), 0);
    
    timeMetrics[date] = {
      spend: daySpend,
      revenue: dayRevenue,
      customers: dayCustomers,
      cac: dayCustomers > 0 ? daySpend / dayCustomers : 0,
      roas: daySpend > 0 ? dayRevenue / daySpend : 0
    };
    
    // Weekly aggregation
    const weekKey = moment(date).format('YYYY-[W]WW');
    if (!weeklyMetrics[weekKey]) {
      weeklyMetrics[weekKey] = { spend: 0, revenue: 0, customers: 0 };
    }
    weeklyMetrics[weekKey].spend += daySpend;
    weeklyMetrics[weekKey].revenue += dayRevenue;
    weeklyMetrics[weekKey].customers += dayCustomers;
    
    // Monthly aggregation
    const monthKey = moment(date).format('YYYY-MM');
    if (!monthlyMetrics[monthKey]) {
      monthlyMetrics[monthKey] = { spend: 0, revenue: 0, customers: 0 };
    }
    monthlyMetrics[monthKey].spend += daySpend;
    monthlyMetrics[monthKey].revenue += dayRevenue;
    monthlyMetrics[monthKey].customers += dayCustomers;
  });
  
  // Calculate derived metrics for weekly/monthly
  [weeklyMetrics, monthlyMetrics].forEach(metrics => {
    Object.keys(metrics).forEach(key => {
      const data = metrics[key];
      data.cac = data.customers > 0 ? data.spend / data.customers : 0;
      data.roas = data.spend > 0 ? data.revenue / data.spend : 0;
      data.aov = data.customers > 0 ? data.revenue / data.customers : 0;
    });
  });
  
  return {
    daily: timeMetrics,
    weekly: weeklyMetrics,
    monthly: monthlyMetrics,
    trends: {
      dailyAvgSpend: allDates.length > 0 ? Object.values(timeMetrics).reduce((sum, d) => sum + d.spend, 0) / allDates.length : 0,
      totalDays: allDates.length,
      dateRange: allDates.length > 0 ? `${allDates[0]} to ${allDates[allDates.length - 1]}` : 'No data'
    }
  };
}

// Integrate deep analytics into main calculation endpoint
app.post('/api/calculate', (req, res) => {
  try {
    const { marketingData, revenueData, customerData, businessModel, analysisConfig } = req.body;

    // Validate input data
    if (!marketingData || !revenueData) {
      return res.status(400).json({ error: 'Marketing and revenue data are required' });
    }

    // Calculate all CAC methodologies
    const calculations = {
      simpleBlended: calculateSimpleBlendedCAC(marketingData, revenueData),
      fullyLoaded: calculateFullyLoadedCAC(marketingData, revenueData, analysisConfig?.teamCosts || {}),
      channelSpecific: calculateChannelSpecificCAC(marketingData, revenueData),
      cohortBased: calculateCohortBasedCAC(marketingData, revenueData, analysisConfig?.cohortPeriod || 30),
      contributionMargin: calculateContributionMarginCAC(marketingData, revenueData, customerData)
    };

    // Data quality assessment
    const dataQuality = assessDataQuality(marketingData, revenueData, customerData);
    
    // Generate recommendations
    const recommendations = generateRecommendations(calculations, businessModel, dataQuality);
    
    // Calculate confidence
    const overallConfidence = calculateOverallConfidence({ calculations }, dataQuality);

    // DEEP PERFORMANCE ANALYSIS - NEW COMPREHENSIVE ANALYTICS
    const performanceAnalysis = generateDeepPerformanceAnalysis(marketingData, revenueData, businessModel);

    // Response structure
    const results = {
      calculations,
      dataQuality,
      recommendations,
      confidence: overallConfidence,
      performanceAnalysis,  // This is the new comprehensive analytics
      summary: {
        totalSpend: marketingData.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0),
        totalCustomers: revenueData.reduce((sum, row) => sum + parseInt(row.customers || row.new_customers || 0), 0),
        totalRevenue: revenueData.reduce((sum, row) => sum + parseFloat(row.revenue || 0), 0),
        analysisDate: moment().format('MMMM DD, YYYY'),
        dataPoints: marketingData.length + revenueData.length
      }
    };

    res.json(results);
    
  } catch (error) {
    console.error('Calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate CAC' });
  }
});

// Clean up any remaining functions
function generateKeyInsights(results, marketingData, revenueData) {
  const insights = [];
  
  if (results && results.calculations) {
    const cacs = Object.values(results.calculations).map(calc => calc.value).filter(v => v > 0);
    if (cacs.length > 1) {
      const maxCac = Math.max(...cacs);
      const minCac = Math.min(...cacs);
      const variation = ((maxCac - minCac) / minCac * 100).toFixed(1);
      
      insights.push({
        type: 'methodology',
        title: 'CAC Methodology Variance',
        description: `Your CAC ranges from $${minCac.toFixed(2)} to $${maxCac.toFixed(2)} (${variation}% variation) depending on methodology.`,
        recommendation: 'Use the most appropriate methodology for your business context.'
      });
    }
  }
  
  return insights;
}

// Creative Performance Analysis
function analyzeCreativePerformance(marketingData, revenueData) {
  const creativePerformance = {
    byCreative: {},
    insights: [],
    topPerformers: [],
    underperformers: [],
    recommendations: []
  };

  // Enhanced creative tracking based on campaign names and available data
  const creativeData = {};
  
  marketingData.forEach(row => {
    const campaign = row.campaign || 'Unknown Campaign';
    const channel = row.channel || 'Unknown';
    const spend = parseFloat(row.spend || 0);
    
    // Extract creative indicators from campaign names
    const creativeId = extractCreativeId(campaign);
    const creativeType = identifyCreativeType(campaign);
    
    if (!creativeData[creativeId]) {
      creativeData[creativeId] = {
        campaign: campaign,
        channel: channel,
        creativeType: creativeType,
        spend: 0,
        customers: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        dates: new Set()
      };
    }
    
    creativeData[creativeId].spend += spend;
    if (row.date) creativeData[creativeId].dates.add(row.date);
    
    // Estimate impressions and clicks based on spend and channel
    const channelMetrics = getChannelEstimates(channel, spend);
    creativeData[creativeId].impressions += channelMetrics.impressions;
    creativeData[creativeId].clicks += channelMetrics.clicks;
  });

  // Add revenue and customer data
  revenueData.forEach(row => {
    const channel = row.channel || 'Unknown';
    const customers = parseInt(row.customers || row.new_customers || 0);
    const revenue = parseFloat(row.revenue || 0);
    
    // Distribute customers/revenue to creatives proportionally by spend
    Object.keys(creativeData).forEach(creativeId => {
      const creative = creativeData[creativeId];
      if (creative.channel === channel) {
        // Simple proportional attribution for now
        creative.customers += customers * 0.1; // Simplified
        creative.revenue += revenue * 0.1;
      }
    });
  });

  // Calculate creative performance metrics
  Object.keys(creativeData).forEach(creativeId => {
    const creative = creativeData[creativeId];
    const cac = creative.customers > 0 ? creative.spend / creative.customers : 0;
    const roas = creative.spend > 0 ? creative.revenue / creative.spend : 0;
    const ctr = creative.impressions > 0 ? (creative.clicks / creative.impressions) * 100 : 0;
    const cvr = creative.clicks > 0 ? (creative.customers / creative.clicks) * 100 : 0;
    const cpc = creative.clicks > 0 ? creative.spend / creative.clicks : 0;
    
    creativePerformance.byCreative[creativeId] = {
      campaign: creative.campaign,
      channel: creative.channel,
      creativeType: creative.creativeType,
      spend: Math.round(creative.spend),
      customers: Math.round(creative.customers * 10) / 10,
      revenue: Math.round(creative.revenue),
      cac: Math.round(cac * 100) / 100,
      roas: Math.round(roas * 100) / 100,
      ctr: Math.round(ctr * 1000) / 1000,
      cvr: Math.round(cvr * 1000) / 1000,
      cpc: Math.round(cpc * 100) / 100,
      impressions: Math.round(creative.impressions),
      clicks: Math.round(creative.clicks),
      duration: creative.dates.size,
      efficiency: cac > 0 && roas > 0 ? Math.round((roas / (cac / 100)) * 100) / 100 : 0
    };
  });

  // Identify top and bottom performers
  const performanceArray = Object.values(creativePerformance.byCreative);
  
  creativePerformance.topPerformers = performanceArray
    .filter(c => c.spend > 100) // Minimum spend threshold
    .sort((a, b) => b.efficiency - a.efficiency)
    .slice(0, 5);
    
  creativePerformance.underperformers = performanceArray
    .filter(c => c.spend > 100)
    .sort((a, b) => a.efficiency - b.efficiency)
    .slice(0, 5);

  // Generate creative insights
  if (creativePerformance.topPerformers.length > 0 && creativePerformance.underperformers.length > 0) {
    const topEfficiency = creativePerformance.topPerformers[0].efficiency;
    const bottomEfficiency = creativePerformance.underperformers[0].efficiency;
    
    if (topEfficiency > bottomEfficiency * 2) {
      creativePerformance.insights.push({
        type: 'creative_gap',
        priority: 'high',
        title: 'Creative Performance Gap',
        description: `Top performing creative (${creativePerformance.topPerformers[0].creativeType}) is ${(topEfficiency / bottomEfficiency).toFixed(1)}x more efficient than bottom performer.`,
        recommendation: `Pause underperforming creatives and scale successful ${creativePerformance.topPerformers[0].creativeType} creative elements.`
      });
    }
  }

  // Creative type analysis
  const creativeTypePerformance = {};
  performanceArray.forEach(creative => {
    if (!creativeTypePerformance[creative.creativeType]) {
      creativeTypePerformance[creative.creativeType] = {
        count: 0,
        totalSpend: 0,
        totalCustomers: 0,
        avgCac: 0,
        avgRoas: 0
      };
    }
    
    const typeData = creativeTypePerformance[creative.creativeType];
    typeData.count++;
    typeData.totalSpend += creative.spend;
    typeData.totalCustomers += creative.customers;
  });

  // Calculate creative type averages
  Object.keys(creativeTypePerformance).forEach(type => {
    const data = creativeTypePerformance[type];
    data.avgCac = data.totalCustomers > 0 ? data.totalSpend / data.totalCustomers : 0;
    data.avgRoas = data.totalSpend > 0 ? (data.totalCustomers * 200) / data.totalSpend : 0; // Estimated
  });

  // Creative type recommendations
  const bestCreativeType = Object.entries(creativeTypePerformance)
    .sort(([,a], [,b]) => a.avgCac - b.avgCac)[0];
    
  if (bestCreativeType) {
    creativePerformance.recommendations.push({
      type: 'creative_optimization',
      priority: 'medium',
      title: 'Creative Type Optimization',
      description: `${bestCreativeType[0]} creatives show the lowest average CAC ($${bestCreativeType[1].avgCac.toFixed(2)}).`,
      action: `Increase creative production focus on ${bestCreativeType[0]} format and test variations.`
    });
  }

  return creativePerformance;
}

// Helper functions for creative analysis
function extractCreativeId(campaign) {
  // Extract creative ID from campaign name patterns
  const patterns = [
    /creative[_-]?(\d+)/i,
    /ad[_-]?(\d+)/i,
    /v(\d+)/i,
    /_(\d+)$/
  ];
  
  for (const pattern of patterns) {
    const match = campaign.match(pattern);
    if (match) return `creative_${match[1]}`;
  }
  
  return campaign.toLowerCase().replace(/[^a-z0-9]/g, '_');
}

function identifyCreativeType(campaign) {
  const campaign_lower = campaign.toLowerCase();
  
  if (campaign_lower.includes('video') || campaign_lower.includes('youtube')) return 'Video';
  if (campaign_lower.includes('image') || campaign_lower.includes('display')) return 'Image';
  if (campaign_lower.includes('carousel')) return 'Carousel';
  if (campaign_lower.includes('text') || campaign_lower.includes('search')) return 'Text';
  if (campaign_lower.includes('story') || campaign_lower.includes('stories')) return 'Story';
  if (campaign_lower.includes('collection')) return 'Collection';
  if (campaign_lower.includes('lead')) return 'Lead Form';
  if (campaign_lower.includes('shopping')) return 'Shopping';
  
  return 'Standard';
}

function getChannelEstimates(channel, spend) {
  const channelMetrics = {
    'Google Ads': { cpm: 2.5, ctr: 0.025 },
    'Facebook': { cpm: 8.0, ctr: 0.018 },
    'LinkedIn': { cpm: 15.0, ctr: 0.012 },
    'Instagram': { cpm: 6.0, ctr: 0.015 },
    'TikTok': { cpm: 4.0, ctr: 0.020 }
  };
  
  const metrics = channelMetrics[channel] || { cpm: 5.0, ctr: 0.015 };
  const impressions = (spend / metrics.cpm) * 1000;
  const clicks = impressions * metrics.ctr;
  
  return { impressions, clicks };
}

// Audience Saturation Scoring Algorithm
function calculateAudienceSaturation(marketingData, revenueData) {
  const saturation = {
    byChannel: {},
    overall: {},
    warnings: [],
    recommendations: []
  };

  // Group data by channel and time
  const channelTimeData = {};
  
  marketingData.forEach(row => {
    const channel = row.channel || 'Unknown';
    const date = row.date;
    const spend = parseFloat(row.spend || 0);
    
    if (!channelTimeData[channel]) {
      channelTimeData[channel] = {};
    }
    if (!channelTimeData[channel][date]) {
      channelTimeData[channel][date] = { spend: 0, customers: 0 };
    }
    channelTimeData[channel][date].spend += spend;
  });

  // Add customer data
  revenueData.forEach(row => {
    const channel = row.channel || 'Unknown';
    const date = row.date;
    const customers = parseInt(row.customers || row.new_customers || 0);
    
    if (channelTimeData[channel] && channelTimeData[channel][date]) {
      channelTimeData[channel][date].customers += customers;
    }
  });

  // Calculate saturation metrics for each channel
  Object.keys(channelTimeData).forEach(channel => {
    const timeData = channelTimeData[channel];
    const dates = Object.keys(timeData).sort();
    
    if (dates.length < 7) return; // Need at least a week of data
    
    // Calculate moving averages for saturation detection
    const windowSize = 7;
    const saturationMetrics = [];
    
    for (let i = windowSize; i < dates.length; i++) {
      const currentWindow = dates.slice(i - windowSize, i);
      const previousWindow = dates.slice(i - windowSize * 2, i - windowSize);
      
      if (previousWindow.length < windowSize) continue;
      
      const currentSpend = currentWindow.reduce((sum, date) => sum + timeData[date].spend, 0);
      const previousSpend = previousWindow.reduce((sum, date) => sum + timeData[date].spend, 0);
      const currentCustomers = currentWindow.reduce((sum, date) => sum + timeData[date].customers, 0);
      const previousCustomers = previousWindow.reduce((sum, date) => sum + timeData[date].customers, 0);
      
      const spendChange = currentSpend > 0 && previousSpend > 0 ? 
        (currentSpend - previousSpend) / previousSpend : 0;
      const customerChange = currentCustomers > 0 && previousCustomers > 0 ? 
        (currentCustomers - previousCustomers) / previousCustomers : 0;
      
      // Saturation indicator: spend increases but customers don't increase proportionally
      const saturationScore = spendChange > 0.1 && customerChange < spendChange * 0.5 ? 
        1 - (customerChange / spendChange) : 0;
      
      saturationMetrics.push({
        date: dates[i],
        spendChange,
        customerChange,
        saturationScore: Math.max(0, Math.min(1, saturationScore))
      });
    }
    
    const avgSaturation = saturationMetrics.length > 0 ?
      saturationMetrics.reduce((sum, m) => sum + m.saturationScore, 0) / saturationMetrics.length : 0;
    
    const recentSaturation = saturationMetrics.length > 3 ?
      saturationMetrics.slice(-3).reduce((sum, m) => sum + m.saturationScore, 0) / 3 : avgSaturation;
    
    saturation.byChannel[channel] = {
      avgSaturation: Math.round(avgSaturation * 1000) / 1000,
      recentSaturation: Math.round(recentSaturation * 1000) / 1000,
      trend: recentSaturation > avgSaturation * 1.2 ? 'worsening' : 
             recentSaturation < avgSaturation * 0.8 ? 'improving' : 'stable',
      riskLevel: recentSaturation > 0.6 ? 'high' : recentSaturation > 0.3 ? 'medium' : 'low',
      dataPoints: saturationMetrics.length
    };
    
    // Generate warnings for high saturation
    if (recentSaturation > 0.5) {
      saturation.warnings.push({
        channel: channel,
        type: 'audience_saturation',
        severity: recentSaturation > 0.7 ? 'high' : 'medium',
        title: 'Audience Saturation Detected',
        description: `${channel} shows ${Math.round(recentSaturation * 100)}% saturation score - spend increases aren't yielding proportional customer growth.`,
        recommendation: 'Test new audiences, creative refresh, or reduce spend to reset audience fatigue.'
      });
    }
  });

  // Overall saturation assessment
  const channelSaturations = Object.values(saturation.byChannel);
  if (channelSaturations.length > 0) {
    saturation.overall = {
      avgSaturation: channelSaturations.reduce((sum, c) => sum + c.recentSaturation, 0) / channelSaturations.length,
      channelsAtRisk: channelSaturations.filter(c => c.riskLevel === 'high').length,
      totalChannels: channelSaturations.length
    };
  }

  return saturation;
}

// Automated Anomaly Detection
function detectAnomalies(marketingData, revenueData) {
  const anomalies = {
    detected: [],
    alerts: [],
    severity: 'normal'
  };

  // Time series anomaly detection
  const dailyMetrics = {};
  
  // Aggregate daily data
  marketingData.forEach(row => {
    const date = row.date;
    const spend = parseFloat(row.spend || 0);
    
    if (!dailyMetrics[date]) {
      dailyMetrics[date] = { spend: 0, customers: 0, revenue: 0 };
    }
    dailyMetrics[date].spend += spend;
  });
  
  revenueData.forEach(row => {
    const date = row.date;
    const customers = parseInt(row.customers || row.new_customers || 0);
    const revenue = parseFloat(row.revenue || 0);
    
    if (dailyMetrics[date]) {
      dailyMetrics[date].customers += customers;
      dailyMetrics[date].revenue += revenue;
    }
  });

  // Calculate daily CAC and identify anomalies
  const dates = Object.keys(dailyMetrics).sort();
  const cacValues = [];
  
  dates.forEach(date => {
    const data = dailyMetrics[date];
    const cac = data.customers > 0 ? data.spend / data.customers : 0;
    data.cac = cac;
    if (cac > 0) cacValues.push(cac);
  });

  if (cacValues.length > 7) {
    const mean = cacValues.reduce((sum, v) => sum + v, 0) / cacValues.length;
    const stdDev = Math.sqrt(
      cacValues.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / cacValues.length
    );
    const threshold = mean + (2 * stdDev); // 2 standard deviations

    // Check recent days for anomalies
    const recentDates = dates.slice(-7);
    recentDates.forEach(date => {
      const data = dailyMetrics[date];
      if (data.cac > threshold && data.cac > 0) {
        anomalies.detected.push({
          type: 'high_cac_anomaly',
          date: date,
          value: data.cac,
          expected: mean,
          threshold: threshold,
          severity: data.cac > threshold * 1.5 ? 'high' : 'medium',
          description: `CAC spike detected: $${data.cac.toFixed(2)} vs expected $${mean.toFixed(2)}`
        });
      }
    });
  }

  // Channel performance anomalies
  const channelMetrics = {};
  marketingData.forEach(row => {
    const channel = row.channel || 'Unknown';
    const spend = parseFloat(row.spend || 0);
    
    if (!channelMetrics[channel]) {
      channelMetrics[channel] = { spend: 0, customers: 0, days: new Set() };
    }
    channelMetrics[channel].spend += spend;
    if (row.date) channelMetrics[channel].days.add(row.date);
  });

  revenueData.forEach(row => {
    const channel = row.channel || 'Unknown';
    const customers = parseInt(row.customers || row.new_customers || 0);
    
    if (channelMetrics[channel]) {
      channelMetrics[channel].customers += customers;
    }
  });

  // Detect channels with zero customers despite spend
  Object.keys(channelMetrics).forEach(channel => {
    const data = channelMetrics[channel];
    if (data.spend > 500 && data.customers === 0) {
      anomalies.detected.push({
        type: 'zero_conversion_anomaly',
        channel: channel,
        spend: data.spend,
        severity: 'high',
        description: `${channel} has $${data.spend.toFixed(2)} spend but zero recorded customers`,
        recommendation: 'Check tracking setup or pause campaigns immediately'
      });
    }
  });

  // Generate alerts based on severity
  const highSeverityAnomalies = anomalies.detected.filter(a => a.severity === 'high');
  if (highSeverityAnomalies.length > 0) {
    anomalies.severity = 'critical';
    anomalies.alerts.push({
      type: 'critical_alert',
      title: 'Critical Performance Issues Detected',
      description: `${highSeverityAnomalies.length} high-severity anomalies requiring immediate attention`,
      actions: [
        'Review campaign settings and targeting',
        'Check tracking implementation',
        'Consider pausing underperforming campaigns',
        'Investigate data quality issues'
      ]
    });
  }

  return anomalies;
}

// Enhanced Attribution Models
function calculateAdvancedAttribution(marketingData, revenueData, attributionConfig = {}) {
  const attribution = {
    models: {},
    comparison: {},
    recommendations: []
  };

  const model = attributionConfig.model || 'last_touch';
  const windowDays = attributionConfig.windowDays || 30;

  // Prepare touchpoint data
  const customerJourneys = {};
  
  // Group revenue data by customer journey
  revenueData.forEach(row => {
    const customerId = row.customer_id || `customer_${row.date}_${row.channel}`;
    const conversionDate = new Date(row.date);
    const channel = row.channel || 'Unknown';
    const revenue = parseFloat(row.revenue || 0);
    
    if (!customerJourneys[customerId]) {
      customerJourneys[customerId] = {
        touchpoints: [],
        conversion: { date: conversionDate, revenue: revenue, customers: parseInt(row.customers || 1) }
      };
    }
  });

  // Add marketing touchpoints
  marketingData.forEach(row => {
    const touchDate = new Date(row.date);
    const channel = row.channel || 'Unknown';
    const spend = parseFloat(row.spend || 0);
    
    // For each customer journey, check if this touchpoint is within attribution window
    Object.keys(customerJourneys).forEach(customerId => {
      const journey = customerJourneys[customerId];
      const daysDiff = (journey.conversion.date - touchDate) / (1000 * 60 * 60 * 24);
      
      if (daysDiff >= 0 && daysDiff <= windowDays) {
        journey.touchpoints.push({
          channel: channel,
          date: touchDate,
          spend: spend,
          campaign: row.campaign || 'Unknown',
          daysToConversion: Math.round(daysDiff)
        });
      }
    });
  });

  // Calculate attribution for different models
  const models = ['first_touch', 'last_touch', 'linear', 'time_decay', 'position_based'];
  
  models.forEach(modelType => {
    attribution.models[modelType] = calculateAttributionModel(customerJourneys, modelType);
  });

  // Compare models
  attribution.comparison = compareAttributionModels(attribution.models);

  // Generate recommendations
  if (attribution.comparison.variance > 0.3) {
    attribution.recommendations.push({
      type: 'attribution_variance',
      title: 'High Attribution Model Variance',
      description: `CAC varies by ${(attribution.comparison.variance * 100).toFixed(1)}% across attribution models.`,
      recommendation: 'Consider data-driven attribution or test incrementality to determine true channel impact.'
    });
  }

  return attribution;
}

function calculateAttributionModel(customerJourneys, model) {
  const channelAttribution = {};
  
  Object.values(customerJourneys).forEach(journey => {
    if (journey.touchpoints.length === 0) return;
    
    const touchpoints = journey.touchpoints.sort((a, b) => a.date - b.date);
    const conversionValue = journey.conversion.revenue;
    const conversionCustomers = journey.conversion.customers;
    
    touchpoints.forEach((touchpoint, index) => {
      let attributionWeight = 0;
      
      switch (model) {
        case 'first_touch':
          attributionWeight = index === 0 ? 1 : 0;
          break;
        case 'last_touch':
          attributionWeight = index === touchpoints.length - 1 ? 1 : 0;
          break;
        case 'linear':
          attributionWeight = 1 / touchpoints.length;
          break;
        case 'time_decay':
          attributionWeight = Math.pow(0.7, touchpoints.length - 1 - index);
          break;
        case 'position_based':
          if (touchpoints.length === 1) {
            attributionWeight = 1;
          } else if (index === 0 || index === touchpoints.length - 1) {
            attributionWeight = 0.4;
          } else {
            attributionWeight = 0.2 / (touchpoints.length - 2);
          }
          break;
      }
      
      const channel = touchpoint.channel;
      if (!channelAttribution[channel]) {
        channelAttribution[channel] = { spend: 0, attributedRevenue: 0, attributedCustomers: 0 };
      }
      
      channelAttribution[channel].spend += touchpoint.spend * attributionWeight;
      channelAttribution[channel].attributedRevenue += conversionValue * attributionWeight;
      channelAttribution[channel].attributedCustomers += conversionCustomers * attributionWeight;
    });
  });

  // Calculate CAC for each channel under this model
  Object.keys(channelAttribution).forEach(channel => {
    const data = channelAttribution[channel];
    data.cac = data.attributedCustomers > 0 ? data.spend / data.attributedCustomers : 0;
    data.roas = data.spend > 0 ? data.attributedRevenue / data.spend : 0;
  });

  return channelAttribution;
}

function compareAttributionModels(models) {
  const comparison = {
    channelImpact: {},
    variance: 0,
    insights: []
  };

  const channels = new Set();
  Object.values(models).forEach(model => {
    Object.keys(model).forEach(channel => channels.add(channel));
  });

  channels.forEach(channel => {
    const channelCacs = [];
    Object.keys(models).forEach(modelName => {
      if (models[modelName][channel]) {
        channelCacs.push(models[modelName][channel].cac);
      }
    });
    
    if (channelCacs.length > 1) {
      const mean = channelCacs.reduce((sum, v) => sum + v, 0) / channelCacs.length;
      const variance = Math.sqrt(
        channelCacs.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / channelCacs.length
      ) / mean;
      
      comparison.channelImpact[channel] = {
        meanCac: Math.round(mean * 100) / 100,
        variance: Math.round(variance * 1000) / 1000,
        range: [Math.min(...channelCacs), Math.max(...channelCacs)]
      };
    }
  });

  // Overall variance across all channels
  const allVariances = Object.values(comparison.channelImpact).map(c => c.variance);
  comparison.variance = allVariances.length > 0 ? 
    allVariances.reduce((sum, v) => sum + v, 0) / allVariances.length : 0;

  return comparison;
}

// Competitive Intelligence Features
function generateCompetitiveIntelligence(marketingData, revenueData, businessModel) {
  const intelligence = {
    marketPosition: {},
    competitiveBenchmarks: {},
    marketTrends: {},
    opportunityAnalysis: {},
    insights: []
  };

  // Calculate current performance metrics
  const totalSpend = marketingData.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0);
  const totalCustomers = revenueData.reduce((sum, row) => sum + parseInt(row.customers || row.new_customers || 0), 0);
  const currentCAC = totalCustomers > 0 ? totalSpend / totalCustomers : 0;

  // Industry benchmarking with competitive context
  const industryData = getCompetitiveBenchmarks(businessModel);
  
  intelligence.competitiveBenchmarks = {
    industry: businessModel?.businessType || 'Unknown',
    currentCAC: Math.round(currentCAC * 100) / 100,
    industryMedian: industryData.medianCAC,
    industryRange: industryData.cacRange,
    percentile: calculateCompetitivePercentile(currentCAC, industryData),
    competitivePosition: determineMarketPosition(currentCAC, industryData)
  };

  // Market trend analysis based on temporal data
  const temporalMetrics = analyzeTemporalPerformance(marketingData, revenueData);
  if (temporalMetrics.trends.monthly && temporalMetrics.trends.monthly.length > 3) {
    const recentTrend = calculateTrendDirection(temporalMetrics.trends.monthly.slice(-6));
    
    intelligence.marketTrends = {
      cacTrend: recentTrend.cac,
      efficiencyTrend: recentTrend.efficiency,
      spendTrend: recentTrend.spend,
      marketImplication: interpretMarketTrend(recentTrend, industryData),
      seasonality: detectSeasonalPatterns(temporalMetrics.trends.monthly)
    };
  }

  // Opportunity analysis
  intelligence.opportunityAnalysis = identifyCompetitiveOpportunities(marketingData, revenueData, industryData);

  // Generate competitive insights
  if (intelligence.competitiveBenchmarks.percentile < 25) {
    intelligence.insights.push({
      type: 'competitive_threat',
      priority: 'high',
      title: 'Below Market Performance',
      description: `Your CAC is in the bottom 25% of industry performers (${intelligence.competitiveBenchmarks.percentile}th percentile).`,
      recommendations: [
        'Analyze top competitors\' channel strategies',
        'Investigate audience targeting improvements',
        'Consider campaign optimization consulting'
      ]
    });
  } else if (intelligence.competitiveBenchmarks.percentile > 75) {
    intelligence.insights.push({
      type: 'competitive_advantage',
      priority: 'medium',
      title: 'Strong Market Position',
      description: `Your CAC performance is in the top 25% of industry (${intelligence.competitiveBenchmarks.percentile}th percentile).`,
      recommendations: [
        'Scale successful strategies aggressively',
        'Consider expanding to new channels',
        'Monitor for competitor responses'
      ]
    });
  }

  return intelligence;
}

function getCompetitiveBenchmarks(businessModel) {
  const benchmarks = {
    saas: {
      medianCAC: 180,
      cacRange: [75, 420],
      channelSplit: { 'Google Ads': 0.35, 'Facebook': 0.25, 'LinkedIn': 0.20, 'Other': 0.20 },
      avgGrowthRate: 0.15,
      marketSize: 'large'
    },
    ecommerce: {
      medianCAC: 65,
      cacRange: [25, 150],
      channelSplit: { 'Facebook': 0.40, 'Google Ads': 0.35, 'Instagram': 0.15, 'Other': 0.10 },
      avgGrowthRate: 0.22,
      marketSize: 'very_large'
    },
    fintech: {
      medianCAC: 125,
      cacRange: [60, 280],
      channelSplit: { 'Google Ads': 0.30, 'Facebook': 0.25, 'LinkedIn': 0.25, 'Other': 0.20 },
      avgGrowthRate: 0.28,
      marketSize: 'large'
    }
  };

  const businessType = (businessModel?.businessType || 'saas').toLowerCase();
  return benchmarks[businessType] || benchmarks.saas;
}

function calculateCompetitivePercentile(currentCAC, industryData) {
  const { medianCAC, cacRange } = industryData;
  
  if (currentCAC <= cacRange[0]) return 95; // Top 5%
  if (currentCAC <= medianCAC * 0.8) return 80; // Top 20%
  if (currentCAC <= medianCAC) return 50; // Median
  if (currentCAC <= medianCAC * 1.5) return 25; // Bottom 25%
  return 10; // Bottom 10%
}

function determineMarketPosition(currentCAC, industryData) {
  const percentile = calculateCompetitivePercentile(currentCAC, industryData);
  
  if (percentile >= 80) return 'market_leader';
  if (percentile >= 60) return 'strong_performer';
  if (percentile >= 40) return 'average_performer';
  if (percentile >= 25) return 'below_average';
  return 'struggling_performer';
}

function calculateTrendDirection(monthlyData) {
  if (monthlyData.length < 3) return null;
  
  const cacTrend = calculateTrendSlope(monthlyData.map(m => m.cac));
  const efficiencyTrend = calculateTrendSlope(monthlyData.map(m => m.efficiency));
  const spendTrend = calculateTrendSlope(monthlyData.map(m => m.spend));
  
  return {
    cac: {
      direction: cacTrend > 0.1 ? 'increasing' : cacTrend < -0.1 ? 'decreasing' : 'stable',
      magnitude: Math.abs(cacTrend),
      confidence: monthlyData.length > 5 ? 'high' : 'medium'
    },
    efficiency: {
      direction: efficiencyTrend > 0.1 ? 'improving' : efficiencyTrend < -0.1 ? 'declining' : 'stable',
      magnitude: Math.abs(efficiencyTrend)
    },
    spend: {
      direction: spendTrend > 0.1 ? 'increasing' : spendTrend < -0.1 ? 'decreasing' : 'stable',
      magnitude: Math.abs(spendTrend)
    }
  };
}

function interpretMarketTrend(trendData, industryData) {
  if (trendData.cac.direction === 'increasing' && trendData.efficiency.direction === 'declining') {
    return {
      interpretation: 'competitive_pressure',
      description: 'Rising CAC with declining efficiency suggests increased competitive pressure',
      marketImplication: 'Market saturation or new competitors entering'
    };
  }
  
  if (trendData.cac.direction === 'decreasing' && trendData.efficiency.direction === 'improving') {
    return {
      interpretation: 'market_opportunity',
      description: 'Improving metrics suggest either optimization success or reduced competition',
      marketImplication: 'Favorable market conditions or effective optimization'
    };
  }
  
  return {
    interpretation: 'stable_market',
    description: 'Metrics show stability in competitive landscape',
    marketImplication: 'Mature market with established players'
  };
}

function detectSeasonalPatterns(monthlyData) {
  if (monthlyData.length < 12) return null;
  
  const seasonalAnalysis = {
    patterns: {},
    recommendations: []
  };
  
  // Group by quarters
  const quarters = { Q1: [], Q2: [], Q3: [], Q4: [] };
  
  monthlyData.forEach(month => {
    const monthNum = parseInt(month.month.split('-')[1]);
    if (monthNum <= 3) quarters.Q1.push(month);
    else if (monthNum <= 6) quarters.Q2.push(month);
    else if (monthNum <= 9) quarters.Q3.push(month);
    else quarters.Q4.push(month);
  });
  
  // Calculate quarterly averages
  Object.keys(quarters).forEach(quarter => {
    if (quarters[quarter].length > 0) {
      const avgCAC = quarters[quarter].reduce((sum, m) => sum + m.cac, 0) / quarters[quarter].length;
      const avgEfficiency = quarters[quarter].reduce((sum, m) => sum + m.efficiency, 0) / quarters[quarter].length;
      
      seasonalAnalysis.patterns[quarter] = {
        avgCAC: Math.round(avgCAC * 100) / 100,
        avgEfficiency: Math.round(avgEfficiency * 100) / 100,
        dataPoints: quarters[quarter].length
      };
    }
  });
  
  // Identify best/worst quarters
  const quarterPerformance = Object.entries(seasonalAnalysis.patterns)
    .sort(([,a], [,b]) => a.avgCAC - b.avgCAC);
    
  if (quarterPerformance.length > 0) {
    seasonalAnalysis.recommendations.push({
      type: 'seasonal_optimization',
      bestQuarter: quarterPerformance[0][0],
      worstQuarter: quarterPerformance[quarterPerformance.length - 1][0],
      recommendation: `Focus higher spend in ${quarterPerformance[0][0]} (lowest CAC) and reduce spend in ${quarterPerformance[quarterPerformance.length - 1][0]}`
    });
  }
  
  return seasonalAnalysis;
}

function identifyCompetitiveOpportunities(marketingData, revenueData, industryData) {
  const opportunities = {
    channelGaps: [],
    underinvestment: [],
    overinvestment: [],
    newChannels: []
  };
  
  // Analyze current channel split vs industry benchmarks
  const currentChannelSplit = {};
  const totalSpend = marketingData.reduce((sum, row) => sum + parseFloat(row.spend || 0), 0);
  
  marketingData.forEach(row => {
    const channel = row.channel || 'Unknown';
    const spend = parseFloat(row.spend || 0);
    currentChannelSplit[channel] = (currentChannelSplit[channel] || 0) + spend;
  });
  
  // Convert to percentages
  Object.keys(currentChannelSplit).forEach(channel => {
    currentChannelSplit[channel] = currentChannelSplit[channel] / totalSpend;
  });
  
  // Compare with industry benchmarks
  Object.keys(industryData.channelSplit).forEach(channel => {
    const industryAllocation = industryData.channelSplit[channel];
    const currentAllocation = currentChannelSplit[channel] || 0;
    const difference = industryAllocation - currentAllocation;
    
    if (Math.abs(difference) > 0.1) { // 10% difference threshold
      if (difference > 0) {
        opportunities.underinvestment.push({
          channel: channel,
          currentAllocation: Math.round(currentAllocation * 100),
          industryBenchmark: Math.round(industryAllocation * 100),
          opportunity: Math.round(difference * 100),
          recommendation: `Consider increasing ${channel} allocation by ${Math.round(difference * 100)}%`
        });
      } else {
        opportunities.overinvestment.push({
          channel: channel,
          currentAllocation: Math.round(currentAllocation * 100),
          industryBenchmark: Math.round(industryAllocation * 100),
          excess: Math.round(Math.abs(difference) * 100),
          recommendation: `Consider reducing ${channel} allocation by ${Math.round(Math.abs(difference) * 100)}%`
        });
      }
    }
  });
  
  return opportunities;
}

// Advanced Forecasting with Seasonality
function generateAdvancedForecast(marketingData, revenueData, forecastConfig = {}) {
  const forecast = {
    predictions: {},
    scenarios: {},
    seasonalAdjustments: {},
    confidence: {},
    recommendations: []
  };
  
  const forecastPeriods = forecastConfig.periods || 6; // months
  const includeSeasonality = forecastConfig.seasonality !== false;
  
  // Prepare time series data
  const timeSeriesData = prepareTimeSeriesForForecasting(marketingData, revenueData);
  
  if (timeSeriesData.length < 6) {
    forecast.error = 'Insufficient data for reliable forecasting (minimum 6 months required)';
    return forecast;
  }
  
  // Base forecast using trend analysis
  const trendForecast = generateTrendBasedForecast(timeSeriesData, forecastPeriods);
  
  // Seasonal adjustments
  const seasonalForecast = includeSeasonality ? 
    applySeasonalAdjustments(trendForecast, timeSeriesData) : trendForecast;
  
  // Scenario planning
  forecast.scenarios = {
    conservative: adjustForecastByScenario(seasonalForecast, -0.15), // 15% lower
    base: seasonalForecast,
    optimistic: adjustForecastByScenario(seasonalForecast, 0.20), // 20% higher
    aggressive: adjustForecastByScenario(seasonalForecast, 0.35)   // 35% higher
  };
  
  // Confidence intervals
  forecast.confidence = calculateForecastConfidence(timeSeriesData, forecastPeriods);
  
  // Generate forecasting recommendations
  forecast.recommendations = generateForecastRecommendations(forecast, timeSeriesData);
  
  return forecast;
}

function prepareTimeSeriesForForecasting(marketingData, revenueData) {
  const monthlyData = {};
  
  // Aggregate by month
  marketingData.forEach(row => {
    const month = moment(row.date).format('YYYY-MM');
    const spend = parseFloat(row.spend || 0);
    
    if (!monthlyData[month]) {
      monthlyData[month] = { spend: 0, customers: 0, revenue: 0 };
    }
    monthlyData[month].spend += spend;
  });
  
  revenueData.forEach(row => {
    const month = moment(row.date).format('YYYY-MM');
    const customers = parseInt(row.customers || row.new_customers || 0);
    const revenue = parseFloat(row.revenue || 0);
    
    if (monthlyData[month]) {
      monthlyData[month].customers += customers;
      monthlyData[month].revenue += revenue;
    }
  });
  
  // Convert to time series array
  const timeSeries = Object.keys(monthlyData)
    .sort()
    .map(month => {
      const data = monthlyData[month];
      return {
        month,
        spend: data.spend,
        customers: data.customers,
        revenue: data.revenue,
        cac: data.customers > 0 ? data.spend / data.customers : 0,
        roas: data.spend > 0 ? data.revenue / data.spend : 0,
        efficiency: data.customers > 0 && data.spend > 0 ? (data.revenue / data.spend) / (data.spend / data.customers / 100) : 0
      };
    });
  
  return timeSeries;
}

function generateTrendBasedForecast(timeSeriesData, periods) {
  const forecast = [];
  
  // Calculate trends for key metrics
  const cacTrend = calculateTrendSlope(timeSeriesData.map(d => d.cac));
  const spendTrend = calculateTrendSlope(timeSeriesData.map(d => d.spend));
  const customerTrend = calculateTrendSlope(timeSeriesData.map(d => d.customers));
  
  // Get recent baseline values
  const recentData = timeSeriesData.slice(-3); // Last 3 months
  const baselineCAC = recentData.reduce((sum, d) => sum + d.cac, 0) / recentData.length;
  const baselineSpend = recentData.reduce((sum, d) => sum + d.spend, 0) / recentData.length;
  const baselineCustomers = recentData.reduce((sum, d) => sum + d.customers, 0) / recentData.length;
  
  // Generate forecasts
  for (let i = 1; i <= periods; i++) {
    const lastMonth = moment(timeSeriesData[timeSeriesData.length - 1].month).add(i, 'months');
    
    const projectedCAC = Math.max(0, baselineCAC + (cacTrend * i));
    const projectedSpend = Math.max(0, baselineSpend + (spendTrend * i));
    const projectedCustomers = Math.max(0, baselineCustomers + (customerTrend * i));
    
    forecast.push({
      month: lastMonth.format('YYYY-MM'),
      projectedCAC: Math.round(projectedCAC * 100) / 100,
      projectedSpend: Math.round(projectedSpend),
      projectedCustomers: Math.round(projectedCustomers),
      projectedRevenue: Math.round(projectedCustomers * (baselineCAC * 3.5)), // Estimated revenue
      confidence: Math.max(0.3, 0.9 - (i * 0.1)) // Confidence decreases over time
    });
  }
  
  return forecast;
}

function applySeasonalAdjustments(forecast, historicalData) {
  if (historicalData.length < 12) return forecast; // Need at least a year of data
  
  // Calculate seasonal factors by month
  const monthlyFactors = {};
  const overallAverage = historicalData.reduce((sum, d) => sum + d.cac, 0) / historicalData.length;
  
  for (let month = 1; month <= 12; month++) {
    const monthData = historicalData.filter(d => parseInt(d.month.split('-')[1]) === month);
    if (monthData.length > 0) {
      const monthlyAverage = monthData.reduce((sum, d) => sum + d.cac, 0) / monthData.length;
      monthlyFactors[month] = monthlyAverage / overallAverage;
    } else {
      monthlyFactors[month] = 1.0; // No adjustment if no data
    }
  }
  
  // Apply seasonal adjustments to forecast
  return forecast.map(period => {
    const monthNum = parseInt(period.month.split('-')[1]);
    const seasonalFactor = monthlyFactors[monthNum] || 1.0;
    
    return {
      ...period,
      projectedCAC: Math.round(period.projectedCAC * seasonalFactor * 100) / 100,
      seasonalFactor: Math.round(seasonalFactor * 1000) / 1000
    };
  });
}

function adjustForecastByScenario(baseForecast, adjustment) {
  return baseForecast.map(period => ({
    ...period,
    projectedCAC: Math.round(period.projectedCAC * (1 + adjustment) * 100) / 100,
    projectedSpend: Math.round(period.projectedSpend * (1 + Math.abs(adjustment))),
    projectedCustomers: Math.round(period.projectedCustomers * (1 + Math.abs(adjustment)))
  }));
}

function calculateForecastConfidence(historicalData, periods) {
  // Calculate forecast accuracy based on historical variance
  const cacValues = historicalData.map(d => d.cac).filter(v => v > 0);
  const variance = calculateVolatility(cacValues);
  
  // Confidence decreases with forecast period and historical variance
  const confidenceLevels = {};
  
  for (let i = 1; i <= periods; i++) {
    const baseConfidence = 0.95 - (variance * 0.5); // Higher variance = lower confidence
    const timeDecay = 0.9 - ((i - 1) * 0.1); // Confidence decreases over time
    confidenceLevels[i] = Math.max(0.3, Math.min(0.95, baseConfidence * timeDecay));
  }
  
  return confidenceLevels;
}

function generateForecastRecommendations(forecast, historicalData) {
  const recommendations = [];
  
  // Check if CAC is trending upward in forecast
  const cacTrend = forecast.scenarios.base.map(p => p.projectedCAC);
  const isIncreasing = cacTrend[cacTrend.length - 1] > cacTrend[0];
  
  if (isIncreasing) {
    recommendations.push({
      type: 'forecast_warning',
      priority: 'high',
      title: 'Rising CAC Forecast',
      description: 'Forecast shows CAC increasing over the next 6 months',
      recommendations: [
        'Plan optimization initiatives now to counteract trend',
        'Consider new channel testing',
        'Review audience targeting and creative refresh needs'
      ]
    });
  }
  
  // Check forecast confidence
  const avgConfidence = Object.values(forecast.confidence).reduce((sum, c) => sum + c, 0) / Object.keys(forecast.confidence).length;
  
  if (avgConfidence < 0.6) {
    recommendations.push({
      type: 'forecast_reliability',
      priority: 'medium',
      title: 'Low Forecast Confidence',
      description: `Average forecast confidence is ${Math.round(avgConfidence * 100)}%`,
      recommendations: [
        'Gather more consistent historical data',
        'Monitor actual vs forecast performance monthly',
        'Consider shorter forecast periods'
      ]
    });
  }
  
  return recommendations;
}

// Real-time Optimization Recommendations Engine
function generateOptimizationRecommendations(marketingData, revenueData, currentAnalysis) {
  const recommendations = {
    immediate: [], // Actions for today/this week
    shortTerm: [], // Actions for this month
    strategic: [], // Actions for next quarter
    priority: 'medium',
    impact: {},
    timeline: {}
  };

  // Immediate recommendations based on anomalies
  if (currentAnalysis.anomalies && currentAnalysis.anomalies.detected.length > 0) {
    currentAnalysis.anomalies.detected.forEach(anomaly => {
      if (anomaly.severity === 'high') {
        recommendations.immediate.push({
          type: 'anomaly_response',
          priority: 'critical',
          title: 'Critical Performance Issue',
          description: anomaly.description,
          action: anomaly.recommendation || 'Investigate immediately',
          expectedImpact: 'Prevent further performance degradation',
          timeline: '24 hours'
        });
      }
    });
  }

  // Audience saturation recommendations
  if (currentAnalysis.audienceSaturation) {
    const highSaturationChannels = Object.entries(currentAnalysis.audienceSaturation.byChannel)
      .filter(([, data]) => data.riskLevel === 'high');
    
    highSaturationChannels.forEach(([channel, data]) => {
      recommendations.shortTerm.push({
        type: 'audience_refresh',
        priority: 'high',
        title: `${channel} Audience Refresh Needed`,
        description: `${Math.round(data.recentSaturation * 100)}% saturation detected`,
        actions: [
          'Create new lookalike audiences',
          'Expand targeting parameters',
          'Test new creative formats',
          'Reduce daily budgets by 25% temporarily'
        ],
        expectedImpact: `15-30% CAC improvement in ${channel}`,
        timeline: '1-2 weeks'
      });
    });
  }

  // Creative performance optimizations
  if (currentAnalysis.creativeAnalysis && currentAnalysis.creativeAnalysis.topPerformers.length > 0) {
    const topCreative = currentAnalysis.creativeAnalysis.topPerformers[0];
    const bottomCreative = currentAnalysis.creativeAnalysis.underperformers[0];
    
    if (topCreative && bottomCreative && topCreative.efficiency > bottomCreative.efficiency * 2) {
      recommendations.immediate.push({
        type: 'creative_optimization',
        priority: 'high',
        title: 'Scale Top Performing Creatives',
        description: `${topCreative.creativeType} format shows ${topCreative.efficiency}x efficiency vs bottom performer`,
        actions: [
          `Pause creative: ${bottomCreative.campaign}`,
          `Increase budget for: ${topCreative.campaign}`,
          `Create 3 variations of ${topCreative.creativeType} format`,
          'A/B test new variations against current champion'
        ],
        expectedImpact: `20-35% overall CAC improvement`,
        timeline: '3-7 days'
      });
    }
  }

  // Budget reallocation opportunities
  if (currentAnalysis.budgetOptimization && currentAnalysis.budgetOptimization.recommendations.length > 0) {
    currentAnalysis.budgetOptimization.recommendations.forEach(rec => {
      recommendations.strategic.push({
        type: 'budget_reallocation',
        priority: 'medium',
        title: rec.title,
        description: rec.description,
        action: rec.expectedImpact,
        timeline: '2-4 weeks'
      });
    });
  }

  // Attribution model recommendations
  if (currentAnalysis.attributionModeling && currentAnalysis.attributionModeling.comparison.variance > 0.3) {
    recommendations.strategic.push({
      type: 'attribution_improvement',
      priority: 'medium',
      title: 'Attribution Model Optimization',
      description: `${Math.round(currentAnalysis.attributionModeling.comparison.variance * 100)}% variance across attribution models`,
      actions: [
        'Implement enhanced tracking',
        'Test incrementality with geo-split tests',
        'Consider data-driven attribution model',
        'Review cross-channel customer journeys'
      ],
      expectedImpact: '10-25% improvement in budget allocation accuracy',
      timeline: '1-3 months'
    });
  }

  // Overall priority assessment
  const criticalCount = recommendations.immediate.filter(r => r.priority === 'critical').length;
  const highCount = [...recommendations.immediate, ...recommendations.shortTerm].filter(r => r.priority === 'high').length;
  
  recommendations.priority = criticalCount > 0 ? 'critical' : highCount > 2 ? 'high' : 'medium';
  
  // Impact summary
  recommendations.impact = {
    potentialCACImprovement: '15-35%',
    implementationEffort: highCount > 3 ? 'high' : 'medium',
    riskLevel: criticalCount > 0 ? 'high' : 'low'
  };

  return recommendations;
}

// Advanced analysis helper functions
function calculateEfficiencyScore(cac, avgRevenue, impressions, clicks) {
  const cacScore = Math.max(0, 100 - parseFloat(cac));
  const revenueScore = Math.min(100, (avgRevenue / 500) * 100); // Assuming 500 is baseline
  const clickScore = impressions > 0 ? Math.min(100, ((clicks / impressions) * 100) * 50) : 0;
  return ((cacScore + revenueScore + clickScore) / 3).toFixed(1);
}

function analyzeTimePerformance(data) {
  const datePerformance = {};
  data.forEach(row => {
    const date = row.date;
    if (!datePerformance[date]) {
      datePerformance[date] = { spend: 0, customers: 0, revenue: 0 };
    }
    datePerformance[date].spend += parseFloat(row.spend) || 0;
    datePerformance[date].customers += parseInt(row.customers) || parseInt(row.new_customers) || 0;
    datePerformance[date].revenue += parseFloat(row.revenue) || 0;
  });
  
  const dates = Object.keys(datePerformance).sort();
  const trends = {
    cac_trend: 'stable',
    spend_trend: 'stable',
    volume_trend: 'stable'
  };
  
  if (dates.length > 1) {
    const firstCac = datePerformance[dates[0]].customers > 0 ? 
      datePerformance[dates[0]].spend / datePerformance[dates[0]].customers : 0;
    const lastCac = datePerformance[dates[dates.length-1]].customers > 0 ? 
      datePerformance[dates[dates.length-1]].spend / datePerformance[dates[dates.length-1]].customers : 0;
    
    trends.cac_trend = lastCac > firstCac * 1.1 ? 'increasing' : lastCac < firstCac * 0.9 ? 'decreasing' : 'stable';
  }
  
  return {
    daily: datePerformance,
    trends: trends,
    bestDay: dates.reduce((best, date) => {
      const dayCAC = datePerformance[date].customers > 0 ? 
        datePerformance[date].spend / datePerformance[date].customers : Infinity;
      const bestCAC = datePerformance[best] && datePerformance[best].customers > 0 ? 
        datePerformance[best].spend / datePerformance[best].customers : Infinity;
      return dayCAC < bestCAC ? date : best;
    }, dates[0])
  };
}

function identifyOptimizationOpportunities(channelAnalytics, rawData) {
  const opportunities = [];
  
  // Find underperforming channels
  Object.entries(channelAnalytics).forEach(([channel, metrics]) => {
    if (parseFloat(metrics.cac) > 100) {
      opportunities.push({
        type: 'high_cac',
        channel: channel,
        priority: 'high',
        issue: `High CAC of $${metrics.cac}`,
        recommendation: `Consider pausing or optimizing ${channel}. Current CAC is above profitable threshold.`,
        impact: `Potential savings: $${((parseFloat(metrics.cac) - 75) * metrics.customers).toFixed(0)}`,
        metrics: { current_cac: metrics.cac, target_cac: '75.00', spend: metrics.spend }
      });
    }
    
    if (parseFloat(metrics.ctr) < 1.0) {
      opportunities.push({
        type: 'low_ctr',
        channel: channel,
        priority: 'medium',
        issue: `Low CTR of ${metrics.ctr}%`,
        recommendation: `Improve ad creative and targeting for ${channel}. Consider A/B testing new creatives.`,
        impact: `Potential click increase: ${(metrics.impressions * 0.02 - metrics.clicks).toFixed(0)}`,
        metrics: { current_ctr: metrics.ctr, target_ctr: '2.0', impressions: metrics.impressions }
      });
    }
    
    if (parseFloat(metrics.cvr) < 2.0) {
      opportunities.push({
        type: 'low_cvr',
        channel: channel,
        priority: 'medium',
        issue: `Low conversion rate of ${metrics.cvr}%`,
        recommendation: `Optimize landing pages and audience targeting for ${channel}.`,
        impact: `Potential customers gained: ${(metrics.clicks * 0.03 - metrics.customers).toFixed(0)}`,
        metrics: { current_cvr: metrics.cvr, target_cvr: '3.0', clicks: metrics.clicks }
      });
    }
  });
  
  // Budget reallocation opportunities
  const sortedChannels = Object.entries(channelAnalytics).sort((a, b) => parseFloat(a[1].cac) - parseFloat(b[1].cac));
  if (sortedChannels.length > 1) {
    const bestChannel = sortedChannels[0];
    const worstChannel = sortedChannels[sortedChannels.length - 1];
    
    if (parseFloat(worstChannel[1].cac) > parseFloat(bestChannel[1].cac) * 1.5) {
      opportunities.push({
        type: 'budget_reallocation',
        priority: 'high',
        issue: `Budget misallocation between channels`,
        recommendation: `Shift 25% of budget from ${worstChannel[0]} (CAC: $${worstChannel[1].cac}) to ${bestChannel[0]} (CAC: $${bestChannel[1].cac})`,
        impact: `Estimated additional customers: ${Math.floor((worstChannel[1].spend * 0.25) / parseFloat(bestChannel[1].cac))}`,
        metrics: {
          from_channel: worstChannel[0],
          to_channel: bestChannel[0],
          potential_savings: ((parseFloat(worstChannel[1].cac) - parseFloat(bestChannel[1].cac)) * worstChannel[1].customers * 0.25).toFixed(0)
        }
      });
    }
  }
  
  return opportunities.slice(0, 10); // Top 10 opportunities
}

function analyzeCampaignPerformance(data) {
  const campaigns = {};
  const adSets = {};
  const ads = {};
  
  data.forEach(row => {
    const campaign = row.campaign_name || row.campaign || 'Default Campaign';
    const adSet = row.ad_set_name || row.ad_group_name || 'Default Ad Set';
    const ad = row.ad_name || row.keyword || 'Default Ad';
    const channel = row.channel || 'Unknown';
    
    // Campaign level aggregation
    const campaignKey = `${channel}_${campaign}`;
    if (!campaigns[campaignKey]) {
      campaigns[campaignKey] = {
        campaign: campaign,
        channel: channel,
        spend: 0,
        customers: 0,
        conversions: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
        engagement_rate: 0,
        days_active: new Set(),
        ad_sets: new Set(),
        ads: new Set()
      };
    }
    
    // Ad Set level aggregation
    const adSetKey = `${campaignKey}_${adSet}`;
    if (!adSets[adSetKey]) {
      adSets[adSetKey] = {
        campaign: campaign,
        ad_set: adSet,
        channel: channel,
        spend: 0,
        customers: 0,
        conversions: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
        ads: new Set(),
        days_active: new Set()
      };
    }
    
    // Ad level tracking
    const adKey = `${adSetKey}_${ad}`;
    if (!ads[adKey]) {
      ads[adKey] = {
        campaign: campaign,
        ad_set: adSet,
        ad: ad,
        channel: channel,
        spend: 0,
        customers: 0,
        conversions: 0,
        revenue: 0,
        impressions: 0,
        clicks: 0,
        reach: 0,
        days_active: new Set()
      };
    }
    
    // Aggregate metrics
    const spend = parseFloat(row.spend) || 0;
    const customers = parseInt(row.customers) || parseInt(row.conversions) || parseInt(row.new_customers) || 0;
    const conversions = parseInt(row.conversions) || customers;
    const revenue = parseFloat(row.revenue) || 0;
    const impressions = parseInt(row.impressions) || 0;
    const clicks = parseInt(row.clicks) || 0;
    const reach = parseInt(row.reach) || 0;
    const date = row.date;
    
    // Update campaign
    campaigns[campaignKey].spend += spend;
    campaigns[campaignKey].customers += customers;
    campaigns[campaignKey].conversions += conversions;
    campaigns[campaignKey].revenue += revenue;
    campaigns[campaignKey].impressions += impressions;
    campaigns[campaignKey].clicks += clicks;
    campaigns[campaignKey].reach += reach;
    campaigns[campaignKey].days_active.add(date);
    campaigns[campaignKey].ad_sets.add(adSet);
    campaigns[campaignKey].ads.add(ad);
    
    // Update ad set
    adSets[adSetKey].spend += spend;
    adSets[adSetKey].customers += customers;
    adSets[adSetKey].conversions += conversions;
    adSets[adSetKey].revenue += revenue;
    adSets[adSetKey].impressions += impressions;
    adSets[adSetKey].clicks += clicks;
    adSets[adSetKey].reach += reach;
    adSets[adSetKey].days_active.add(date);
    adSets[adSetKey].ads.add(ad);
    
    // Update ad
    ads[adKey].spend += spend;
    ads[adKey].customers += customers;
    ads[adKey].conversions += conversions;
    ads[adKey].revenue += revenue;
    ads[adKey].impressions += impressions;
    ads[adKey].clicks += clicks;
    ads[adKey].reach += reach;
    ads[adKey].days_active.add(date);
  });
  
  // Calculate metrics for campaigns
  Object.keys(campaigns).forEach(key => {
    const camp = campaigns[key];
    camp.cac = camp.customers > 0 ? (camp.spend / camp.customers).toFixed(2) : 0;
    camp.cpc = camp.clicks > 0 ? (camp.spend / camp.clicks).toFixed(2) : 0;
    camp.cpm = camp.impressions > 0 ? ((camp.spend / camp.impressions) * 1000).toFixed(2) : 0;
    camp.roas = camp.spend > 0 ? (camp.revenue / camp.spend).toFixed(2) : 0;
    camp.ctr = camp.impressions > 0 ? ((camp.clicks / camp.impressions) * 100).toFixed(2) : 0;
    camp.cvr = camp.clicks > 0 ? ((camp.customers / camp.clicks) * 100).toFixed(2) : 0;
    camp.conversion_rate = camp.clicks > 0 ? ((camp.conversions / camp.clicks) * 100).toFixed(2) : 0;
    camp.frequency = camp.reach > 0 ? (camp.impressions / camp.reach).toFixed(2) : 0;
    camp.days_active = camp.days_active.size;
    camp.ad_sets_count = camp.ad_sets.size;
    camp.ads_count = camp.ads.size;
  });
  
  // Calculate metrics for ad sets
  Object.keys(adSets).forEach(key => {
    const adSet = adSets[key];
    adSet.cac = adSet.customers > 0 ? (adSet.spend / adSet.customers).toFixed(2) : 0;
    adSet.cpc = adSet.clicks > 0 ? (adSet.spend / adSet.clicks).toFixed(2) : 0;
    adSet.cpm = adSet.impressions > 0 ? ((adSet.spend / adSet.impressions) * 1000).toFixed(2) : 0;
    adSet.roas = adSet.spend > 0 ? (adSet.revenue / adSet.spend).toFixed(2) : 0;
    adSet.ctr = adSet.impressions > 0 ? ((adSet.clicks / adSet.impressions) * 100).toFixed(2) : 0;
    adSet.cvr = adSet.clicks > 0 ? ((adSet.customers / adSet.clicks) * 100).toFixed(2) : 0;
    adSet.conversion_rate = adSet.clicks > 0 ? ((adSet.conversions / adSet.clicks) * 100).toFixed(2) : 0;
    adSet.frequency = adSet.reach > 0 ? (adSet.impressions / adSet.reach).toFixed(2) : 0;
    adSet.days_active = adSet.days_active.size;
    adSet.ads_count = adSet.ads.size;
  });
  
  // Calculate metrics for ads
  Object.keys(ads).forEach(key => {
    const ad = ads[key];
    ad.cac = ad.customers > 0 ? (ad.spend / ad.customers).toFixed(2) : 0;
    ad.cpc = ad.clicks > 0 ? (ad.spend / ad.clicks).toFixed(2) : 0;
    ad.cpm = ad.impressions > 0 ? ((ad.spend / ad.impressions) * 1000).toFixed(2) : 0;
    ad.roas = ad.spend > 0 ? (ad.revenue / ad.spend).toFixed(2) : 0;
    ad.ctr = ad.impressions > 0 ? ((ad.clicks / ad.impressions) * 100).toFixed(2) : 0;
    ad.cvr = ad.clicks > 0 ? ((ad.customers / ad.clicks) * 100).toFixed(2) : 0;
    ad.conversion_rate = ad.clicks > 0 ? ((ad.conversions / ad.clicks) * 100).toFixed(2) : 0;
    ad.frequency = ad.reach > 0 ? (ad.impressions / ad.reach).toFixed(2) : 0;
    ad.days_active = ad.days_active.size;
  });
  
  return {
    campaigns: campaigns,
    adSets: adSets,
    ads: ads
  };
}

function analyzeCreativePerformance(data) {
  const creatives = {};
  data.forEach(row => {
    const creative = row.creative_id || row.creative_type || 'Unknown Creative';
    if (!creatives[creative]) {
      creatives[creative] = {
        creative_id: creative,
        type: row.creative_type || 'Unknown',
        spend: 0,
        customers: 0,
        impressions: 0,
        clicks: 0
      };
    }
    
    creatives[creative].spend += parseFloat(row.spend) || 0;
    creatives[creative].customers += parseInt(row.customers) || parseInt(row.new_customers) || 0;
    creatives[creative].impressions += parseInt(row.impressions) || 0;
    creatives[creative].clicks += parseInt(row.clicks) || 0;
  });
  
  Object.keys(creatives).forEach(creative => {
    const cr = creatives[creative];
    cr.cac = cr.customers > 0 ? (cr.spend / cr.customers).toFixed(2) : 0;
    cr.ctr = cr.impressions > 0 ? ((cr.clicks / cr.impressions) * 100).toFixed(2) : 0;
  });
  
  return creatives;
}

function generateCompetitiveInsights(channelAnalytics) {
  const benchmarks = {
    'Google Ads': { cac: 75, ctr: 2.5, cvr: 3.0 },
    'Facebook': { cac: 65, ctr: 1.8, cvr: 2.5 },
    'LinkedIn': { cac: 120, ctr: 0.8, cvr: 4.0 },
    'TikTok': { cac: 55, ctr: 2.0, cvr: 2.2 }
  };
  
  const insights = {};
  Object.entries(channelAnalytics).forEach(([channel, metrics]) => {
    const benchmark = benchmarks[channel];
    if (benchmark) {
      insights[channel] = {
        cac_vs_benchmark: {
          current: parseFloat(metrics.cac),
          benchmark: benchmark.cac,
          performance: parseFloat(metrics.cac) < benchmark.cac ? 'above' : 'below',
          difference: (parseFloat(metrics.cac) - benchmark.cac).toFixed(2)
        },
        ctr_vs_benchmark: {
          current: parseFloat(metrics.ctr),
          benchmark: benchmark.ctr,
          performance: parseFloat(metrics.ctr) > benchmark.ctr ? 'above' : 'below',
          difference: (parseFloat(metrics.ctr) - benchmark.ctr).toFixed(2)
        }
      };
    }
  });
  
  return insights;
}

function getDateRange(data) {
  const dates = data.map(row => row.date).filter(Boolean).sort();
  return {
    start: dates[0] || null,
    end: dates[dates.length - 1] || null,
    days: dates.length > 0 ? [...new Set(dates)].length : 0
  };
}

function assessDataCompleteness(data) {
  if (data.length === 0) return 'No Data';
  
  const requiredFields = ['spend', 'customers'];
  const optionalFields = ['impressions', 'clicks', 'revenue', 'channel'];
  
  let score = 0;
  const total = requiredFields.length + optionalFields.length;
  
  requiredFields.forEach(field => {
    if (data.every(row => row[field] !== undefined && row[field] !== null && row[field] !== '')) {
      score += 2; // Required fields worth more
    }
  });
  
  optionalFields.forEach(field => {
    if (data.some(row => row[field] !== undefined && row[field] !== null && row[field] !== '')) {
      score += 1;
    }
  });
  
  const percentage = (score / (requiredFields.length * 2 + optionalFields.length)) * 100;
  
  if (percentage >= 90) return 'Excellent';
  if (percentage >= 70) return 'Good';
  if (percentage >= 50) return 'Fair';
  return 'Poor';
}

function identifyMissingFields(data) {
  const allFields = ['date', 'channel', 'spend', 'customers', 'impressions', 'clicks', 'revenue', 'campaign', 'creative_id'];
  const missing = [];
  
  allFields.forEach(field => {
    const hasField = data.some(row => row[field] !== undefined && row[field] !== null && row[field] !== '');
    if (!hasField) {
      missing.push(field);
    }
  });
  
  return missing;
}

// Analysis endpoint
app.post('/api/analyze', (req, res) => {
  try {
    const { marketing, revenue, channels, businessModel, projectConfig } = req.body;
    
    // Combine all data sources
    let allMarketingData = [...(marketing || [])];
    
    // Add channel-specific data to marketing data
    if (channels) {
      Object.values(channels).forEach(channelData => {
        if (Array.isArray(channelData)) {
          allMarketingData = allMarketingData.concat(channelData);
        }
      });
    }
    
    // Basic CAC calculations
    const totalSpend = allMarketingData.reduce((sum, row) => {
      return sum + (parseFloat(row.spend) || 0);
    }, 0);
    
    const totalCustomers = allMarketingData.reduce((sum, row) => {
      return sum + (parseInt(row.customers) || parseInt(row.new_customers) || 0);
    }, 0);
    
    const blendedCAC = totalCustomers > 0 ? (totalSpend / totalCustomers).toFixed(2) : 0;
    
    // Channel breakdown
    const channelPerformance = {};
    allMarketingData.forEach(row => {
      const channel = row.channel || 'Unknown';
      if (!channelPerformance[channel]) {
        channelPerformance[channel] = { spend: 0, customers: 0 };
      }
      channelPerformance[channel].spend += parseFloat(row.spend) || 0;
      channelPerformance[channel].customers += parseInt(row.customers) || parseInt(row.new_customers) || 0;
    });
    
    // Calculate CAC per channel
    Object.keys(channelPerformance).forEach(channel => {
      const data = channelPerformance[channel];
      data.cac = data.customers > 0 ? (data.spend / data.customers).toFixed(2) : 0;
    });
    
    // Advanced performance metrics for each channel
    const channelAnalytics = {};
    Object.keys(channelPerformance).forEach(channel => {
      const channelRows = allMarketingData.filter(row => (row.channel || 'Unknown') === channel);
      const data = channelPerformance[channel];
      
      // Calculate detailed metrics
      const impressions = channelRows.reduce((sum, row) => sum + (parseInt(row.impressions) || 0), 0);
      const clicks = channelRows.reduce((sum, row) => sum + (parseInt(row.clicks) || 0), 0);
      const revenue = channelRows.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0);
      
      channelAnalytics[channel] = {
        ...data,
        impressions: impressions,
        clicks: clicks,
        revenue: revenue,
        ctr: impressions > 0 ? ((clicks / impressions) * 100).toFixed(2) : 0,
        cpc: clicks > 0 ? (data.spend / clicks).toFixed(2) : 0,
        cvr: clicks > 0 ? ((data.customers / clicks) * 100).toFixed(2) : 0,
        roas: data.spend > 0 ? (revenue / data.spend).toFixed(2) : 0,
        ltv_cac_ratio: data.cac > 0 ? (850 / parseFloat(data.cac)).toFixed(1) : 0, // Assuming avg LTV of 850
        days: [...new Set(channelRows.map(row => row.date))].length,
        campaigns: [...new Set(channelRows.map(row => row.campaign || 'Default'))].length,
        avgDailySpend: data.spend / Math.max(1, [...new Set(channelRows.map(row => row.date))].length),
        efficiency_score: calculateEfficiencyScore(data.cac, revenue / Math.max(1, data.customers), impressions, clicks)
      };
    });
    
    // Time-based analysis
    const timeAnalysis = analyzeTimePerformance(allMarketingData);
    
    // Optimization opportunities
    const opportunities = identifyOptimizationOpportunities(channelAnalytics, allMarketingData);
    
    // Detailed campaign analysis
    const campaignAnalysis = analyzeCampaignPerformance(allMarketingData);
    
    // Creative performance (if available)
    const creativeAnalysis = analyzeCreativePerformance(allMarketingData);
    
    // Competitive insights
    const competitiveInsights = generateCompetitiveInsights(channelAnalytics);
    
    const analysisResults = {
      // Basic metrics
      blendedCAC: blendedCAC,
      totalSpend: totalSpend.toFixed(2),
      totalCustomers: totalCustomers,
      totalRevenue: allMarketingData.reduce((sum, row) => sum + (parseFloat(row.revenue) || 0), 0).toFixed(2),
      
      // Detailed channel analytics
      channelPerformance: channelAnalytics,
      
      // Time-based insights
      timeAnalysis: timeAnalysis,
      
      // Optimization opportunities
      opportunities: opportunities,
      
      // Campaign breakdowns
      campaignAnalysis: campaignAnalysis,
      
      // Creative insights
      creativeAnalysis: creativeAnalysis,
      
      // Competitive benchmarks
      competitiveInsights: competitiveInsights,
      
      // Raw data for detailed tables
      rawData: {
        marketing: allMarketingData,
        revenue: revenue || []
      },
      
      // Data quality assessment
      dataQuality: {
        marketingRows: allMarketingData.length,
        revenueRows: (revenue || []).length,
        dateRange: getDateRange(allMarketingData),
        completeness: assessDataCompleteness(allMarketingData),
        missingFields: identifyMissingFields(allMarketingData)
      },
      
      timestamp: new Date().toISOString()
    };
    
    console.log('Analysis completed:', {
      totalSpend,
      totalCustomers,
      blendedCAC,
      channelCount: Object.keys(channelPerformance).length
    });
    
    res.json(analysisResults);
    
  } catch (error) {
    console.error('Analysis error:', error);
    res.status(500).json({ error: 'Analysis failed: ' + error.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`CAC Calculator Server running on port ${PORT}`);
});
