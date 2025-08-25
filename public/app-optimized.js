// Optimized CAC Calculator - Focused on Performance Insights
const appState = {
  uploadedData: { marketing: null, revenue: null },
  analysisResults: null,
  isAnalyzing: false
};

// Simplified notification system
function showNotification(message, type = 'info') {
  const existing = document.querySelector('.notification');
  if (existing) existing.remove();
  
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    position: fixed; top: 20px; right: 20px; padding: 12px 20px;
    background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
    color: white; border-radius: 6px; z-index: 1000; font-weight: 500;
  `;
  
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 3000);
}

// Optimized file upload handler
function handleFileUpload(input, dataType) {
  const file = input.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('dataFile', file);

  showNotification(`Uploading ${file.name}...`, 'info');

  fetch('/api/upload', { method: 'POST', body: formData })
    .then(response => response.json())
    .then(data => {
      if (data.error) throw new Error(data.error);
      
      appState.uploadedData[dataType] = data;
      showNotification(`${file.name} uploaded successfully`, 'success');
      updateAnalyzeButton();
      updateUploadStatus(dataType, data);
    })
    .catch(error => {
      showNotification(`Upload failed: ${error.message}`, 'error');
    });
}

// Update upload status display
function updateUploadStatus(dataType, data) {
  const statusElement = document.getElementById(`${dataType}-status`);
  if (statusElement) {
    statusElement.innerHTML = `
      <div class="upload-success">
        ✅ ${data.filename} (${data.rowCount} rows)
      </div>
    `;
  }
}

// Update analyze button state
function updateAnalyzeButton() {
  const btn = document.getElementById('analyzeBtn');
  if (!btn) return;
  
  const hasMarketingData = appState.uploadedData.marketing?.data?.length > 0;
  
  if (hasMarketingData) {
    btn.disabled = false;
    btn.textContent = 'Analyze Performance';
    btn.style.opacity = '1';
  } else {
    btn.disabled = true;
    btn.textContent = 'Upload Marketing Data First';
    btn.style.opacity = '0.5';
  }
}

// Run optimized analysis
function runAnalysis() {
  if (!appState.uploadedData.marketing) {
    showNotification('Please upload marketing data first', 'error');
    return;
  }

  appState.isAnalyzing = true;
  document.getElementById('analyzeBtn').textContent = 'Analyzing...';
  showNotification('Running performance analysis...', 'info');

  const analysisData = {
    marketing: appState.uploadedData.marketing.data,
    revenue: appState.uploadedData.revenue?.data || []
  };

  fetch('/api/analyze', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(analysisData)
  })
  .then(response => response.json())
  .then(results => {
    if (results.error) throw new Error(results.error);
    
    appState.analysisResults = results;
    appState.isAnalyzing = false;
    
    showNotification('Analysis completed!', 'success');
    displayResults(results);
    document.getElementById('results').style.display = 'block';
    document.getElementById('results').scrollIntoView({ behavior: 'smooth' });
  })
  .catch(error => {
    appState.isAnalyzing = false;
    document.getElementById('analyzeBtn').textContent = 'Analyze Performance';
    showNotification(`Analysis failed: ${error.message}`, 'error');
  });
}

// Display results focused on key insights
function displayResults(results) {
  const container = document.getElementById('results-content');
  if (!container) return;

  container.innerHTML = generateResultsHTML(results);
}

function generateResultsHTML(results) {
  const channels = Object.entries(results.channelPerformance || {});
  
  return `
    <div class="results-dashboard">
      <!-- Key Metrics Overview -->
      <div class="metrics-overview">
        <h2>🎯 Performance Overview</h2>
        <div class="metrics-grid">
          <div class="metric-card primary">
            <div class="metric-value">$${results.blendedCAC}</div>
            <div class="metric-label">Blended CAC</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${results.totalCustomers}</div>
            <div class="metric-label">Total Customers</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">$${results.totalSpend}</div>
            <div class="metric-label">Total Spend</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">$${results.totalRevenue}</div>
            <div class="metric-label">Total Revenue</div>
          </div>
        </div>
      </div>

      <!-- Channel Performance - Your Priority -->
      <div class="section">
        <h2>📊 Channel Performance Analysis</h2>
        <div class="channel-performance">
          ${channels.map(([channel, data]) => `
            <div class="channel-card">
              <h3>${channel}</h3>
              <div class="channel-metrics">
                <div class="metric">
                  <span class="label">CAC:</span>
                  <span class="value cac-${getCACStatus(data.cac)}">$${data.cac}</span>
                </div>
                <div class="metric">
                  <span class="label">ROAS:</span>
                  <span class="value">${data.roas}x</span>
                </div>
                <div class="metric">
                  <span class="label">CTR:</span>
                  <span class="value">${data.ctr}%</span>
                </div>
                <div class="metric">
                  <span class="label">CVR:</span>
                  <span class="value">${data.cvr}%</span>
                </div>
                <div class="metric">
                  <span class="label">Spend:</span>
                  <span class="value">$${Math.round(data.spend)}</span>
                </div>
                <div class="metric">
                  <span class="label">Customers:</span>
                  <span class="value">${Math.round(data.customers)}</span>
                </div>
              </div>
            </div>
          `).join('')}
        </div>
      </div>

      <!-- Optimization Opportunities -->
      <div class="section">
        <h2>⚡ Growth Strategy Insights</h2>
        <div class="opportunities">
          ${results.opportunities?.length > 0 ? results.opportunities.map(opp => `
            <div class="opportunity-card priority-${opp.priority}">
              <div class="opportunity-header">
                <h4>${opp.issue}</h4>
                <span class="priority-badge ${opp.priority}">${opp.priority}</span>
              </div>
              <p>${opp.recommendation}</p>
              <div class="impact">💡 Expected Impact: ${opp.impact}</div>
            </div>
          `).join('') : '<p>✅ No critical issues detected. Your campaigns are performing well!</p>'}
        </div>
      </div>

      <!-- Historical Cohorted Trend Analysis -->
      ${results.timeAnalysis ? `
        <div class="section">
          <h2>📈 Historical Cohorted Trend Analysis</h2>
          <div class="trend-analysis">
            ${generateCohortedTrendAnalysis(results.timeAnalysis)}
          </div>
        </div>
      ` : ''}

      <!-- Quick Actions -->
      <div class="section">
        <h2>🚀 Quick Actions</h2>
        <div class="action-buttons">
          <button onclick="downloadReport()" class="btn btn-primary">
            📊 Download Report
          </button>
          <button onclick="shareInsights()" class="btn btn-secondary">
            🔗 Share Insights
          </button>
          <button onclick="resetAnalysis()" class="btn btn-outline">
            🔄 New Analysis
          </button>
        </div>
      </div>
    </div>

    <style>
      .results-dashboard {
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }

      .metrics-overview {
        margin-bottom: 30px;
      }

      .metrics-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 20px;
        margin-top: 15px;
      }

      .metric-card {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 20px;
        text-align: center;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .metric-card.primary {
        background: linear-gradient(135deg, #3b82f6, #1d4ed8);
        color: white;
        border: none;
      }

      .metric-value {
        font-size: 2rem;
        font-weight: 700;
        margin-bottom: 5px;
      }

      .metric-label {
        font-size: 0.9rem;
        opacity: 0.8;
      }

      .section {
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 25px;
        margin-bottom: 25px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
      }

      .section h2 {
        margin-top: 0;
        margin-bottom: 20px;
        color: #1f2937;
      }

      .channel-performance {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
        gap: 20px;
      }

      .channel-card {
        background: #f9fafb;
        border: 1px solid #e5e7eb;
        border-radius: 6px;
        padding: 20px;
      }

      .channel-card h3 {
        margin-top: 0;
        margin-bottom: 15px;
        color: #374151;
      }

      .channel-metrics {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
      }

      .metric {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 1px solid #e5e7eb;
      }

      .metric .label {
        font-weight: 500;
        color: #6b7280;
      }

      .metric .value {
        font-weight: 600;
        color: #1f2937;
      }

      .cac-good { color: #10b981; }
      .cac-warning { color: #f59e0b; }
      .cac-danger { color: #ef4444; }

      .opportunities {
        display: flex;
        flex-direction: column;
        gap: 15px;
      }

      .opportunity-card {
        padding: 20px;
        border-radius: 6px;
        border-left: 4px solid;
      }

      .opportunity-card.priority-high {
        background: #fef2f2;
        border-left-color: #ef4444;
      }

      .opportunity-card.priority-medium {
        background: #fefce8;
        border-left-color: #f59e0b;
      }

      .opportunity-card.priority-low {
        background: #f0fdf4;
        border-left-color: #10b981;
      }

      .opportunity-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }

      .priority-badge {
        padding: 4px 12px;
        border-radius: 12px;
        font-size: 0.8rem;
        font-weight: 500;
        text-transform: uppercase;
      }

      .priority-badge.high {
        background: #fee2e2;
        color: #dc2626;
      }

      .priority-badge.medium {
        background: #fef3c7;
        color: #d97706;
      }

      .priority-badge.low {
        background: #dcfce7;
        color: #16a34a;
      }

      .impact {
        margin-top: 12px;
        padding: 8px 12px;
        background: rgba(59, 130, 246, 0.1);
        border-radius: 4px;
        font-size: 0.9rem;
        color: #1e40af;
      }

      .action-buttons {
        display: flex;
        gap: 15px;
        flex-wrap: wrap;
      }

      .btn {
        padding: 10px 20px;
        border-radius: 6px;
        font-weight: 500;
        cursor: pointer;
        border: none;
        text-decoration: none;
        display: inline-block;
        transition: all 0.2s;
      }

      .btn-primary {
        background: #3b82f6;
        color: white;
      }

      .btn-primary:hover {
        background: #2563eb;
      }

      .btn-secondary {
        background: #6b7280;
        color: white;
      }

      .btn-outline {
        background: transparent;
        border: 1px solid #d1d5db;
        color: #374151;
      }

      .btn:hover {
        transform: translateY(-1px);
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      }

      .time-analysis {
        background: #f9fafb;
        padding: 20px;
        border-radius: 6px;
        text-align: center;
        color: #6b7280;
      }
    </style>
  `;
}

function getCACStatus(cac) {
  const cacValue = parseFloat(cac);
  if (cacValue < 50) return 'good';
  if (cacValue < 100) return 'warning';
  return 'danger';
}

function generateCohortedTrendAnalysis(timeAnalysis) {
  const { daily, weekly, monthly, trends } = timeAnalysis;
  
  if (!daily || Object.keys(daily).length === 0) {
    return '<p>📈 Cohorted trend analysis will appear here with historical data</p>';
  }

  const dailyKeys = Object.keys(daily).sort();
  const weeklyKeys = Object.keys(weekly || {}).sort();
  const monthlyKeys = Object.keys(monthly || {}).sort();
  
  // Recent performance (last 7 days)
  const recentDaily = dailyKeys.slice(-7);
  const recentWeekly = weeklyKeys.slice(-4);
  const recentMonthly = monthlyKeys.slice(-3);

  return `
    <div class="cohorted-analysis">
      <!-- Trend Summary -->
      <div class="trend-summary">
        <h3>🎯 Performance Trends</h3>
        <div class="trend-indicators">
          <div class="trend-item">
            <span class="trend-label">CAC Trend:</span>
            <span class="trend-value trend-${trends.cac_trend}">${trends.cac_trend.toUpperCase()}</span>
          </div>
          <div class="trend-item">
            <span class="trend-label">Weekly Performance:</span>
            <span class="trend-value trend-${trends.weekly_performance}">${trends.weekly_performance.toUpperCase()}</span>
          </div>
        </div>
      </div>

      <!-- Time Period Tabs -->
      <div class="period-tabs">
        <button class="period-tab active" onclick="showPeriodView('daily')">📅 Daily (${recentDaily.length} days)</button>
        ${weeklyKeys.length > 0 ? `<button class="period-tab" onclick="showPeriodView('weekly')">📊 Weekly (${recentWeekly.length} weeks)</button>` : ''}
        ${monthlyKeys.length > 0 ? `<button class="period-tab" onclick="showPeriodView('monthly')">📈 Monthly (${recentMonthly.length} months)</button>` : ''}
      </div>

      <!-- Daily View -->
      <div id="daily-view" class="period-view active">
        <h4>📅 Daily Performance Cohort</h4>
        <div class="metrics-timeline">
          ${recentDaily.map(date => {
            const data = daily[date];
            const cac = data.customers > 0 ? (data.spend / data.customers).toFixed(2) : '0';
            const channels = data.channels ? data.channels.join(', ') : 'Unknown';
            return `
              <div class="timeline-item">
                <div class="timeline-date">${date}</div>
                <div class="timeline-metrics">
                  <div class="metric">CAC: $${cac}</div>
                  <div class="metric">Spend: $${Math.round(data.spend)}</div>
                  <div class="metric">Customers: ${Math.round(data.customers)}</div>
                  ${data.revenue > 0 ? `<div class="metric">Revenue: $${Math.round(data.revenue)}</div>` : ''}
                </div>
                <div class="timeline-channels">${channels}</div>
              </div>
            `;
          }).join('')}
        </div>
      </div>

      ${weeklyKeys.length > 0 ? `
        <!-- Weekly View -->
        <div id="weekly-view" class="period-view">
          <h4>📊 Weekly Performance Cohorts</h4>
          <div class="metrics-timeline">
            ${recentWeekly.map(week => {
              const data = weekly[week];
              const cac = data.customers > 0 ? (data.spend / data.customers).toFixed(2) : '0';
              return `
                <div class="timeline-item">
                  <div class="timeline-date">${week}</div>
                  <div class="timeline-metrics">
                    <div class="metric">CAC: $${cac}</div>
                    <div class="metric">Spend: $${Math.round(data.spend)}</div>
                    <div class="metric">Customers: ${Math.round(data.customers)}</div>
                    ${data.revenue > 0 ? `<div class="metric">Revenue: $${Math.round(data.revenue)}</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      ${monthlyKeys.length > 0 ? `
        <!-- Monthly View -->
        <div id="monthly-view" class="period-view">
          <h4>📈 Monthly Performance Cohorts</h4>
          <div class="metrics-timeline">
            ${recentMonthly.map(month => {
              const data = monthly[month];
              const cac = data.customers > 0 ? (data.spend / data.customers).toFixed(2) : '0';
              return `
                <div class="timeline-item">
                  <div class="timeline-date">${month}</div>
                  <div class="timeline-metrics">
                    <div class="metric">CAC: $${cac}</div>
                    <div class="metric">Spend: $${Math.round(data.spend)}</div>
                    <div class="metric">Customers: ${Math.round(data.customers)}</div>
                    ${data.revenue > 0 ? `<div class="metric">Revenue: $${Math.round(data.revenue)}</div>` : ''}
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        </div>
      ` : ''}

      <!-- Cohort Insights -->
      <div class="cohort-insights">
        <h4>🔍 Cohort Insights</h4>
        <div class="insights-grid">
          <div class="insight-card">
            <div class="insight-title">Best Performing Period</div>
            <div class="insight-value">${getBestPerformingPeriod(daily)}</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Average Daily CAC</div>
            <div class="insight-value">$${getAverageCAC(daily)}</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Total Days Analyzed</div>
            <div class="insight-value">${dailyKeys.length} days</div>
          </div>
          <div class="insight-card">
            <div class="insight-title">Performance Trend</div>
            <div class="insight-value trend-${trends.cac_trend}">${trends.cac_trend}</div>
          </div>
        </div>
      </div>
    </div>

    <style>
      .cohorted-analysis {
        background: #f9fafb;
        padding: 20px;
        border-radius: 8px;
      }

      .trend-summary {
        margin-bottom: 25px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .trend-indicators {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }

      .trend-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 15px;
        background: #f8fafc;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }

      .trend-label {
        font-weight: 500;
        color: #64748b;
      }

      .trend-value {
        font-weight: 600;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 0.9rem;
      }

      .trend-stable { background: #dbeafe; color: #1e40af; }
      .trend-improving { background: #dcfce7; color: #16a34a; }
      .trend-decreasing { background: #dcfce7; color: #16a34a; }
      .trend-deteriorating { background: #fee2e2; color: #dc2626; }
      .trend-increasing { background: #fee2e2; color: #dc2626; }

      .period-tabs {
        display: flex;
        gap: 5px;
        margin-bottom: 20px;
        border-bottom: 1px solid #e5e7eb;
      }

      .period-tab {
        background: transparent;
        border: none;
        padding: 12px 20px;
        font-weight: 500;
        color: #6b7280;
        cursor: pointer;
        border-bottom: 3px solid transparent;
        transition: all 0.2s;
      }

      .period-tab:hover {
        color: #3b82f6;
        background: #f3f4f6;
      }

      .period-tab.active {
        color: #3b82f6;
        border-bottom-color: #3b82f6;
        background: #eff6ff;
      }

      .period-view {
        display: none;
      }

      .period-view.active {
        display: block;
      }

      .metrics-timeline {
        display: flex;
        gap: 15px;
        overflow-x: auto;
        padding: 15px 0;
      }

      .timeline-item {
        min-width: 180px;
        background: white;
        border: 1px solid #e5e7eb;
        border-radius: 8px;
        padding: 15px;
        text-align: center;
      }

      .timeline-date {
        font-weight: 600;
        color: #1f2937;
        margin-bottom: 10px;
        font-size: 0.9rem;
      }

      .timeline-metrics {
        margin-bottom: 10px;
      }

      .timeline-metrics .metric {
        font-size: 0.85rem;
        margin: 3px 0;
        color: #374151;
      }

      .timeline-channels {
        font-size: 0.8rem;
        color: #6b7280;
        font-style: italic;
      }

      .cohort-insights {
        margin-top: 25px;
        padding: 20px;
        background: white;
        border-radius: 8px;
        border: 1px solid #e5e7eb;
      }

      .insights-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
        gap: 15px;
        margin-top: 15px;
      }

      .insight-card {
        text-align: center;
        padding: 15px;
        background: #f8fafc;
        border-radius: 6px;
        border: 1px solid #e2e8f0;
      }

      .insight-title {
        font-size: 0.85rem;
        color: #64748b;
        margin-bottom: 5px;
      }

      .insight-value {
        font-size: 1.2rem;
        font-weight: 600;
        color: #1e293b;
      }
    </style>
  `;
}

// Helper functions for cohorted analysis
function showPeriodView(period) {
  document.querySelectorAll('.period-tab').forEach(tab => tab.classList.remove('active'));
  document.querySelectorAll('.period-view').forEach(view => view.classList.remove('active'));
  
  document.querySelector(`[onclick="showPeriodView('${period}')"]`).classList.add('active');
  document.getElementById(`${period}-view`).classList.add('active');
}

function getBestPerformingPeriod(dailyData) {
  let bestDate = '';
  let bestCAC = Infinity;
  
  Object.entries(dailyData).forEach(([date, data]) => {
    if (data.customers > 0) {
      const cac = data.spend / data.customers;
      if (cac < bestCAC) {
        bestCAC = cac;
        bestDate = date;
      }
    }
  });
  
  return bestDate || 'N/A';
}

function getAverageCAC(dailyData) {
  const validDays = Object.values(dailyData).filter(data => data.customers > 0);
  if (validDays.length === 0) return '0';
  
  const totalCAC = validDays.reduce((sum, data) => sum + (data.spend / data.customers), 0);
  return (totalCAC / validDays.length).toFixed(2);
}

// Quick action functions
function downloadReport() {
  if (!appState.analysisResults) return;
  
  const reportData = {
    timestamp: new Date().toISOString(),
    blendedCAC: appState.analysisResults.blendedCAC,
    totalSpend: appState.analysisResults.totalSpend,
    totalCustomers: appState.analysisResults.totalCustomers,
    channelPerformance: appState.analysisResults.channelPerformance,
    opportunities: appState.analysisResults.opportunities
  };
  
  const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `cac-analysis-${new Date().toISOString().split('T')[0]}.json`;
  a.click();
  URL.revokeObjectURL(url);
  
  showNotification('Report downloaded', 'success');
}

function shareInsights() {
  if (!appState.analysisResults) return;
  
  const insights = `CAC Analysis Summary:
• Blended CAC: $${appState.analysisResults.blendedCAC}
• Total Customers: ${appState.analysisResults.totalCustomers}
• Total Spend: $${appState.analysisResults.totalSpend}
• Opportunities Found: ${appState.analysisResults.opportunities?.length || 0}`;
  
  if (navigator.share) {
    navigator.share({ title: 'CAC Analysis Results', text: insights });
  } else {
    navigator.clipboard.writeText(insights).then(() => {
      showNotification('Insights copied to clipboard', 'success');
    });
  }
}

function resetAnalysis() {
  appState.uploadedData = { marketing: null, revenue: null };
  appState.analysisResults = null;
  
  document.getElementById('results').style.display = 'none';
  document.getElementById('marketing-status').innerHTML = '';
  document.getElementById('revenue-status').innerHTML = '';
  
  const fileInputs = document.querySelectorAll('input[type="file"]');
  fileInputs.forEach(input => input.value = '');
  
  updateAnalyzeButton();
  showNotification('Ready for new analysis', 'info');
}

// Load sample data for testing
function loadSampleData() {
  const sampleMarketing = [
    {date: '2024-01-01', channel: 'Google Ads', spend: 1000, customers: 20, clicks: 500, impressions: 10000},
    {date: '2024-01-01', channel: 'Facebook', spend: 800, customers: 15, clicks: 400, impressions: 12000},
    {date: '2024-01-02', channel: 'Google Ads', spend: 1200, customers: 25, clicks: 600, impressions: 11000},
    {date: '2024-01-02', channel: 'Facebook', spend: 900, customers: 18, clicks: 450, impressions: 13000}
  ];
  
  const sampleRevenue = [
    {date: '2024-01-01', channel: 'Google Ads', revenue: 5000},
    {date: '2024-01-01', channel: 'Facebook', revenue: 3750},
    {date: '2024-01-02', channel: 'Google Ads', revenue: 6250},
    {date: '2024-01-02', channel: 'Facebook', revenue: 4500}
  ];
  
  appState.uploadedData.marketing = { data: sampleMarketing, filename: 'sample-marketing.csv' };
  appState.uploadedData.revenue = { data: sampleRevenue, filename: 'sample-revenue.csv' };
  
  updateUploadStatus('marketing', { filename: 'Sample Marketing Data', rowCount: sampleMarketing.length });
  updateUploadStatus('revenue', { filename: 'Sample Revenue Data', rowCount: sampleRevenue.length });
  updateAnalyzeButton();
  
  showNotification('Sample data loaded! Click Analyze to see results.', 'success');
}

// Initialize when DOM loads
document.addEventListener('DOMContentLoaded', function() {
  updateAnalyzeButton();
  
  // Set up file input handlers
  const marketingInput = document.getElementById('marketing-file');
  const revenueInput = document.getElementById('revenue-file');
  
  if (marketingInput) {
    marketingInput.addEventListener('change', () => handleFileUpload(marketingInput, 'marketing'));
  }
  
  if (revenueInput) {
    revenueInput.addEventListener('change', () => handleFileUpload(revenueInput, 'revenue'));
  }
});