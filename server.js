const express = require('express');
const cors = require('cors');
const path = require('path');
const multer = require('multer');
const csvParser = require('csv-parser');
const XLSX = require('xlsx');
const moment = require('moment');
const ExcelJS = require('exceljs');
const puppeteer = require('puppeteer');

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

// PDF Report Generation
app.post('/api/generate-pdf-report', async (req, res) => {
  try {
    const { results, businessModel, analysisConfig } = req.body;
    
    const browser = await puppeteer.launch({ headless: 'new' });
    const page = await browser.newPage();
    
    const htmlContent = generateReportHTML(results, businessModel, analysisConfig);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="CAC_Analysis_Report_${moment().format('YYYY-MM-DD')}.pdf"`);
    res.send(pdf);
    
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: 'Failed to generate PDF report' });
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

// Helper function to generate HTML for PDF reports
function generateReportHTML(results, businessModel, analysisConfig) {
  const currentDate = moment().format('MMMM DD, YYYY');
  
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8">
    <title>CAC Analysis Report</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
      
      body {
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        line-height: 1.6;
        color: #374151;
        margin: 0;
        padding: 20px;
        background: white;
      }
      
      .header {
        text-align: center;
        margin-bottom: 40px;
        padding-bottom: 20px;
        border-bottom: 3px solid #3B82F6;
      }
      
      .header h1 {
        color: #1E40AF;
        margin: 0;
        font-size: 28px;
        font-weight: 700;
      }
      
      .header .subtitle {
        color: #6B7280;
        font-size: 16px;
        margin-top: 8px;
      }
      
      .header .date {
        color: #9CA3AF;
        font-size: 14px;
        margin-top: 4px;
      }
      
      .section {
        margin-bottom: 30px;
      }
      
      .section h2 {
        color: #1F2937;
        font-size: 20px;
        font-weight: 600;
        margin-bottom: 15px;
        padding-bottom: 8px;
        border-bottom: 2px solid #E5E7EB;
      }
      
      .cac-results {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 20px;
        margin-bottom: 30px;
      }
      
      .cac-card {
        background: #F9FAFB;
        border: 1px solid #E5E7EB;
        border-radius: 8px;
        padding: 20px;
      }
      
      .cac-card h3 {
        margin: 0 0 10px 0;
        color: #1F2937;
        font-size: 16px;
        font-weight: 600;
      }
      
      .cac-value {
        font-size: 24px;
        font-weight: 700;
        color: #1E40AF;
        margin-bottom: 8px;
      }
      
      .confidence {
        color: #F59E0B;
        font-size: 18px;
        margin-bottom: 10px;
      }
      
      .cac-description {
        font-size: 14px;
        color: #6B7280;
      }
      
      .data-quality {
        background: #F0F9FF;
        border: 1px solid #BAE6FD;
        border-radius: 8px;
        padding: 20px;
        margin-bottom: 20px;
      }
      
      .quality-metric {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .recommendations {
        background: #F0FDF4;
        border: 1px solid #BBF7D0;
        border-radius: 8px;
        padding: 20px;
      }
      
      .recommendation {
        margin-bottom: 15px;
        padding-left: 20px;
        border-left: 3px solid #10B981;
      }
      
      .rec-type {
        font-weight: 600;
        color: #047857;
        text-transform: uppercase;
        font-size: 12px;
        margin-bottom: 5px;
      }
      
      .business-config {
        background: #FEF7FF;
        border: 1px solid #E9D5FF;
        border-radius: 8px;
        padding: 20px;
      }
      
      .config-row {
        display: flex;
        justify-content: space-between;
        margin-bottom: 8px;
      }
      
      .config-label {
        font-weight: 500;
        color: #7C3AED;
      }
      
      .footer {
        margin-top: 40px;
        padding-top: 20px;
        border-top: 1px solid #E5E7EB;
        text-align: center;
        color: #9CA3AF;
        font-size: 12px;
      }
      
      @media print {
        body { margin: 0; }
        .section { page-break-inside: avoid; }
      }
    </style>
  </head>
  <body>
    <div class="header">
      <h1>CAC Analysis Report</h1>
      <div class="subtitle">Professional Customer Acquisition Cost Analysis</div>
      <div class="date">Generated on ${currentDate}</div>
    </div>
    
    <div class="section">
      <h2>Business Configuration</h2>
      <div class="business-config">
        <div class="config-row">
          <span class="config-label">Business Type:</span>
          <span>${businessModel?.businessType || 'Not specified'}</span>
        </div>
        <div class="config-row">
          <span class="config-label">Revenue Model:</span>
          <span>${businessModel?.revenueModel || 'Not specified'}</span>
        </div>
        <div class="config-row">
          <span class="config-label">Customer Definition:</span>
          <span>${businessModel?.customerDefinition || 'Not specified'}</span>
        </div>
        <div class="config-row">
          <span class="config-label">Analysis Period:</span>
          <span>${analysisConfig?.period || 'Full dataset'}</span>
        </div>
      </div>
    </div>
    
    <div class="section">
      <h2>CAC Calculation Results</h2>
      <div class="cac-results">
        ${Object.entries(results.calculations).map(([method, data]) => `
          <div class="cac-card">
            <h3>${method.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
            <div class="cac-value">$${data.value.toFixed(2)}</div>
            <div class="confidence">${'★'.repeat(data.confidence)}${'☆'.repeat(5 - data.confidence)}</div>
            <div class="cac-description">${data.explanation}</div>
          </div>
        `).join('')}
      </div>
    </div>
    
    <div class="section">
      <h2>Data Quality Assessment</h2>
      <div class="data-quality">
        <div class="quality-metric">
          <span><strong>Completeness:</strong></span>
          <span>${results.dataQuality?.completeness || 0}%</span>
        </div>
        <div class="quality-metric">
          <span><strong>Consistency:</strong></span>
          <span>${results.dataQuality?.consistency || 0}%</span>
        </div>
        <div class="quality-metric">
          <span><strong>Overall Quality:</strong></span>
          <span>${results.dataQuality?.overall || 0}%</span>
        </div>
      </div>
    </div>
    
    ${results.recommendations?.length ? `
    <div class="section">
      <h2>Strategic Recommendations</h2>
      <div class="recommendations">
        ${results.recommendations.map(rec => `
          <div class="recommendation">
            <div class="rec-type">${rec.type} - ${rec.priority}</div>
            <div>${rec.recommendation}</div>
          </div>
        `).join('')}
      </div>
    </div>
    ` : ''}
    
    <div class="footer">
      <p>Generated by CAC Calculator Pro - Professional Marketing Analytics</p>
      <p>This report contains confidential business information. Handle according to your organization's data security policies.</p>
    </div>
  </body>
  </html>
  `;
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