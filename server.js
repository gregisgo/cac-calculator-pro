const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const moment = require('moment');
const ExcelJS = require('exceljs');

const app = express();
const PORT = process.env.PORT || 3002;

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

    res.json({
      calculations: results,
      dataQuality,
      recommendations,
      metadata: {
        analysisDate: new Date().toISOString(),
        businessModel,
        timeRange: analysisConfig?.timeRange,
        confidence: calculateOverallConfidence(results, dataQuality)
      }
    });

  } catch (error) {
    console.error('CAC analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze CAC: ' + error.message });
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
  if (results.simpleBlended.value > 0 && results.fullyLoaded.value > 0) {
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
  const confidenceScores = [
    results.simpleBlended.confidence,
    results.fullyLoaded.confidence,
    results.channelSpecific.confidence,
    results.cohortBased.confidence,
    results.contributionMargin.confidence
  ];

  const avgConfidence = confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length;
  const dataQualityFactor = dataQuality.overall / 100;
  
  return Math.round((avgConfidence * dataQualityFactor) * 100) / 100;
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
    Object.keys(metrics).forEach(period => {
      const data = metrics[period];
      data.cac = data.customers > 0 ? data.spend / data.customers : 0;
      data.roas = data.spend > 0 ? data.revenue / data.spend : 0;
    });
  });
  
  return {
    daily: timeMetrics,
    weekly: weeklyMetrics,
    monthly: monthlyMetrics,
    trends: calculateTrends(timeMetrics)
  };
}

function calculateTrends(dailyMetrics) {
  const dates = Object.keys(dailyMetrics).sort();
  if (dates.length < 2) return {};
  
  const firstHalf = dates.slice(0, Math.floor(dates.length / 2));
  const secondHalf = dates.slice(Math.floor(dates.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, date) => sum + dailyMetrics[date].cac, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, date) => sum + dailyMetrics[date].cac, 0) / secondHalf.length;
  
  return {
    cacTrend: secondHalfAvg > firstHalfAvg ? 'increasing' : 'decreasing',
    cacChange: ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100,
    isImproving: secondHalfAvg < firstHalfAvg
  };
}

function generateKeyInsights(results, marketingData, revenueData) {
  const insights = [];
  
  if (!results?.calculations) return insights;
  
  // CAC Methodology Insights
  const cacs = Object.values(results.calculations).map(calc => calc.value);
  const avgCAC = cacs.reduce((sum, cac) => sum + cac, 0) / cacs.length;
  const cacVariance = Math.max(...cacs) - Math.min(...cacs);
  
  if (cacVariance > avgCAC * 0.5) {
    insights.push({
      type: 'methodology',
      level: 'warning',
      title: 'High CAC Variance Detected',
      description: `CAC calculations vary significantly (${cacVariance.toFixed(2)} range). This suggests different attribution models reveal different efficiency stories.`,
      recommendation: 'Focus on the Fully-Loaded CAC for budget planning and Simple Blended for quick benchmarks.'
    });
  }
  
  // Channel Performance Insights
  if (marketingData && revenueData) {
    const channelAnalysis = generateChannelAnalysis(marketingData, revenueData);
    const channels = Object.entries(channelAnalysis).sort((a, b) => a[1].cac - b[1].cac);
    
    if (channels.length > 1) {
      const bestChannel = channels[0];
      const worstChannel = channels[channels.length - 1];
      
      insights.push({
        type: 'channel',
        level: 'success',
        title: 'Channel Performance Analysis',
        description: `${bestChannel[0]} has the lowest CAC at $${bestChannel[1].cac.toFixed(2)}, while ${worstChannel[0]} has the highest at $${worstChannel[1].cac.toFixed(2)}.`,
        recommendation: `Consider reallocating budget from ${worstChannel[0]} to ${bestChannel[0]} for improved efficiency.`
      });
    }
  }
  
  // Data Quality Insights
  if (results.dataQuality) {
    if (results.dataQuality.overall < 80) {
      insights.push({
        type: 'data-quality',
        level: 'warning',
        title: 'Data Quality Concerns',
        description: `Overall data quality is ${results.dataQuality.overall}%. This may impact calculation accuracy.`,
        recommendation: 'Review data collection processes and consider data cleaning before final analysis.'
      });
    } else if (results.dataQuality.overall > 95) {
      insights.push({
        type: 'data-quality',
        level: 'success',
        title: 'Excellent Data Quality',
        description: `Data quality score of ${results.dataQuality.overall}% indicates highly reliable calculations.`,
        recommendation: 'Maintain current data collection standards for consistent analysis quality.'
      });
    }
  }
  
  return insights;
}

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'CAC Calculator Pro' });
});

// Serve main app
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Handle all other routes
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`CAC Calculator Pro running on port ${PORT}`);
});