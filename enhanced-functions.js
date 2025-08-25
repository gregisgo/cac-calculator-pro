// Enhanced visualization and date filtering functions for CAC Calculator Pro

// Enhanced visualization functions
function generateTrendIndicator(changeValue) {
    if (!changeValue || changeValue === '0.0') {
        return '<div class="trend-indicator trend-stable">📊 0.0%</div>';
    }
    
    const value = parseFloat(changeValue);
    if (value > 0) {
        return `<div class="trend-indicator trend-up">📈 +${changeValue}%</div>`;
    } else {
        return `<div class="trend-indicator trend-down">📉 ${changeValue}%</div>`;
    }
}

function generateTimeAnalysisPanel(results) {
    const timeAnalysis = results.timeAnalysis;
    if (!timeAnalysis || !timeAnalysis.daily) {
        return '<div class="panel-content"><p>No time-based data available</p></div>';
    }
    
    return `
        <div class="panel-content">
            <div class="panel-header">
                <h2>📈 Performance Over Time</h2>
                <p>Comprehensive time-based performance analysis with volatility scoring</p>
            </div>
            
            ${generatePerformanceChart(timeAnalysis)}
            
            <div class="time-comparison">
                <div class="comparison-card">
                    <div class="comparison-title">Best Day</div>
                    <div class="comparison-value">${timeAnalysis.bestDay || 'N/A'}</div>
                    <div class="comparison-change">Lowest CAC Performance</div>
                </div>
                <div class="comparison-card">
                    <div class="comparison-title">Worst Day</div>
                    <div class="comparison-value">${timeAnalysis.worstDay || 'N/A'}</div>
                    <div class="comparison-change">Highest CAC Performance</div>
                </div>
                <div class="comparison-card">
                    <div class="comparison-title">Volatility Score</div>
                    <div class="comparison-value">${timeAnalysis.volatilityScore || '0'}%</div>
                    <div class="comparison-change">${getVolatilityDescription(timeAnalysis.volatilityScore)}</div>
                </div>
            </div>
            
            <div class="section-header">
                <h3>Performance Data Table</h3>
                <div class="view-controls">
                    <button class="period-btn active" onclick="switchTimeView('daily')">Daily</button>
                    <button class="period-btn" onclick="switchTimeView('weekly')">Weekly</button>
                    <button class="period-btn" onclick="switchTimeView('monthly')">Monthly</button>
                </div>
            </div>
            
            <div class="scrollable-table">
                <div class="data-table-container">
                    <table class="data-table" id="time-performance-table">
                        <thead>
                            <tr>
                                <th>Period</th>
                                <th>Spend</th>
                                <th>Customers</th>
                                <th>Revenue</th>
                                <th>CAC</th>
                                <th>Impressions</th>
                                <th>Clicks</th>
                                <th>CTR</th>
                                <th>CVR</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${generateTimePerformanceRows(timeAnalysis.daily, 'daily')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="trend-analysis">
                <h3>Trend Analysis</h3>
                <div class="trend-grid">
                    <div class="trend-item">
                        <span class="trend-label">CAC Trend:</span>
                        <span class="trend-indicator ${getTrendClass(timeAnalysis.trends?.cac_trend)}">
                            ${getTrendIcon(timeAnalysis.trends?.cac_trend)} ${timeAnalysis.trends?.cac_trend || 'N/A'}
                        </span>
                    </div>
                    <div class="trend-item">
                        <span class="trend-label">Spend Trend:</span>
                        <span class="trend-indicator ${getTrendClass(timeAnalysis.trends?.spend_trend)}">
                            ${getTrendIcon(timeAnalysis.trends?.spend_trend)} ${timeAnalysis.trends?.spend_trend || 'N/A'}
                        </span>
                    </div>
                    <div class="trend-item">
                        <span class="trend-label">Volume Trend:</span>
                        <span class="trend-indicator ${getTrendClass(timeAnalysis.trends?.volume_trend)}">
                            ${getTrendIcon(timeAnalysis.trends?.volume_trend)} ${timeAnalysis.trends?.volume_trend || 'N/A'}
                        </span>
                    </div>
                    <div class="trend-item">
                        <span class="trend-label">Revenue Trend:</span>
                        <span class="trend-indicator ${getTrendClass(timeAnalysis.trends?.revenue_trend)}">
                            ${getTrendIcon(timeAnalysis.trends?.revenue_trend)} ${timeAnalysis.trends?.revenue_trend || 'N/A'}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    `;
}

function generatePerformanceChart(timeAnalysis) {
    return `
        <div class="performance-chart">
            <h4>Performance Chart</h4>
            <div class="chart-container">
                <div class="chart-placeholder">
                    📊 Interactive chart will be rendered here<br>
                    <small>Showing CAC, Spend, and Customer trends over time</small>
                </div>
            </div>
        </div>
    `;
}

function getVolatilityDescription(score) {
    const volatility = parseFloat(score) || 0;
    if (volatility < 10) return 'Very Stable';
    if (volatility < 20) return 'Stable';
    if (volatility < 35) return 'Moderate';
    if (volatility < 50) return 'High';
    return 'Very High';
}

function generateTimePerformanceRows(dailyData, viewType) {
    const sortedData = Object.entries(dailyData).sort((a, b) => b[0].localeCompare(a[0]));
    
    return sortedData.map(([date, data]) => {
        const cac = data.customers > 0 ? (data.spend / data.customers) : 0;
        const ctr = data.impressions > 0 ? ((data.clicks / data.impressions) * 100) : 0;
        const cvr = data.clicks > 0 ? ((data.customers / data.clicks) * 100) : 0;
        
        return `
            <tr>
                <td><strong>${date}</strong></td>
                <td class="currency">$${data.spend?.toFixed(0) || '0'}</td>
                <td>${data.customers || '0'}</td>
                <td class="currency">$${data.revenue?.toFixed(0) || '0'}</td>
                <td class="currency">$${cac.toFixed(2)}</td>
                <td>${data.impressions?.toLocaleString() || '0'}</td>
                <td>${data.clicks?.toLocaleString() || '0'}</td>
                <td>${ctr.toFixed(2)}%</td>
                <td>${cvr.toFixed(2)}%</td>
            </tr>
        `;
    }).join('');
}

function getTrendClass(trend) {
    switch(trend) {
        case 'increasing': return 'trend-up';
        case 'decreasing': return 'trend-down';
        default: return 'trend-stable';
    }
}

function getTrendIcon(trend) {
    switch(trend) {
        case 'increasing': return '📈';
        case 'decreasing': return '📉';
        default: return '📊';
    }
}

// Date filtering functions
let originalResults = null;

function filterByPeriod(period) {
    console.log('Filtering by period:', period);
    // Implementation would re-analyze data with date filters
}

function applyCustomDateRange() {
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    console.log('Applying custom date range:', startDate, 'to', endDate);
    // Implementation would re-analyze data with custom date range
}

function switchTimeView(viewType) {
    const table = document.getElementById('time-performance-table');
    if (!table || !originalResults) return;
    
    // Update active button
    event.target.parentNode.querySelectorAll('.period-btn').forEach(btn => btn.classList.remove('active'));
    event.target.classList.add('active');
    
    const timeAnalysis = originalResults.timeAnalysis;
    let dataToShow;
    
    switch(viewType) {
        case 'weekly':
            dataToShow = timeAnalysis.weekly || {};
            break;
        case 'monthly':
            dataToShow = timeAnalysis.monthly || {};
            break;
        default:
            dataToShow = timeAnalysis.daily || {};
    }
    
    const tbody = table.querySelector('tbody');
    tbody.innerHTML = generateTimePerformanceRows(dataToShow, viewType);
}