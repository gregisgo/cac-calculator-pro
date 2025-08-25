// Enhanced app.js functions for improved visualization and time analysis

function generateTimeAnalysisContent(timeAnalysis) {
    if (!timeAnalysis || !timeAnalysis.daily) {
        return '<div class="panel-content"><p>No time-based data available</p></div>';
    }
    
    const dailyData = Object.entries(timeAnalysis.daily).sort((a, b) => b[0].localeCompare(a[0])); // Show all data, sorted by date desc
    
    return `
        <div class="panel-content">
            <div class="panel-header">
                <h2>📈 Performance Over Time</h2>
                <p>Comprehensive time-based performance analysis with volatility scoring</p>
            </div>
            
            <div class="performance-chart">
                <h4>Performance Trends</h4>
                <div class="chart-container">
                    <div class="chart-placeholder">
                        📊 Interactive chart will be rendered here<br>
                        <small>Showing CAC, Spend, and Customer trends over ${dailyData.length} days</small>
                    </div>
                </div>
            </div>
            
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
                    <div class="comparison-change">${getVolatilityLevel(timeAnalysis.volatilityScore)}</div>
                </div>
                <div class="comparison-card">
                    <div class="comparison-title">Total Days</div>
                    <div class="comparison-value">${dailyData.length}</div>
                    <div class="comparison-change">Active Campaign Days</div>
                </div>
            </div>
            
            <div class="section-header">
                <h3>Daily Performance Breakdown (All ${dailyData.length} Days)</h3>
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
                                <th>Date</th>
                                <th>Total Spend</th>
                                <th>New Customers</th>
                                <th>Total Revenue</th>
                                <th>Daily CAC</th>
                                <th>Total Impressions</th>
                                <th>Total Clicks</th>
                                <th>Daily CTR</th>
                                <th>Daily CVR</th>
                                <th>ROAS</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${dailyData.map(([date, data]) => {
                                const cac = data.customers > 0 ? (data.spend / data.customers) : 0;
                                const ctr = data.impressions > 0 ? ((data.clicks / data.impressions) * 100) : 0;
                                const cvr = data.clicks > 0 ? ((data.customers / data.clicks) * 100) : 0;
                                const roas = data.spend > 0 ? (data.revenue / data.spend) : 0;
                                
                                return `
                                    <tr>
                                        <td><strong>${date}</strong></td>
                                        <td class="currency">$${data.spend?.toFixed(0) || '0'}</td>
                                        <td>${data.customers || '0'}</td>
                                        <td class="currency">$${data.revenue?.toFixed(0) || '0'}</td>
                                        <td class="currency ${cac > 100 ? 'warning' : ''}">$${cac.toFixed(2)}</td>
                                        <td>${data.impressions?.toLocaleString() || '0'}</td>
                                        <td>${data.clicks?.toLocaleString() || '0'}</td>
                                        <td>${ctr.toFixed(2)}%</td>
                                        <td>${cvr.toFixed(2)}%</td>
                                        <td>${roas.toFixed(2)}x</td>
                                    </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
            
            <div class="trend-analysis">
                <h3>Performance Trend Analysis</h3>
                <div class="trend-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 1rem;">
                    <div class="trend-item" style="padding: 1rem; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                        <span class="trend-label" style="font-size: 0.9rem; color: var(--text-muted);">CAC Trend:</span><br>
                        <span class="trend-indicator ${getTrendClass(timeAnalysis.trends?.cac_trend)}" style="font-size: 1.1rem; font-weight: 600;">
                            ${getTrendIcon(timeAnalysis.trends?.cac_trend)} ${timeAnalysis.trends?.cac_trend || 'N/A'}
                        </span>
                        ${timeAnalysis.performanceChanges?.cac_change ? `<br><small>${timeAnalysis.performanceChanges.cac_change}% vs previous period</small>` : ''}
                    </div>
                    <div class="trend-item" style="padding: 1rem; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                        <span class="trend-label" style="font-size: 0.9rem; color: var(--text-muted);">Spend Trend:</span><br>
                        <span class="trend-indicator ${getTrendClass(timeAnalysis.trends?.spend_trend)}" style="font-size: 1.1rem; font-weight: 600;">
                            ${getTrendIcon(timeAnalysis.trends?.spend_trend)} ${timeAnalysis.trends?.spend_trend || 'N/A'}
                        </span>
                        ${timeAnalysis.performanceChanges?.spend_change ? `<br><small>${timeAnalysis.performanceChanges.spend_change}% vs previous period</small>` : ''}
                    </div>
                    <div class="trend-item" style="padding: 1rem; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                        <span class="trend-label" style="font-size: 0.9rem; color: var(--text-muted);">Volume Trend:</span><br>
                        <span class="trend-indicator ${getTrendClass(timeAnalysis.trends?.volume_trend)}" style="font-size: 1.1rem; font-weight: 600;">
                            ${getTrendIcon(timeAnalysis.trends?.volume_trend)} ${timeAnalysis.trends?.volume_trend || 'N/A'}
                        </span>
                        ${timeAnalysis.performanceChanges?.customers_change ? `<br><small>${timeAnalysis.performanceChanges.customers_change}% vs previous period</small>` : ''}
                    </div>
                    <div class="trend-item" style="padding: 1rem; background: var(--surface); border-radius: 8px; border: 1px solid var(--border);">
                        <span class="trend-label" style="font-size: 0.9rem; color: var(--text-muted);">Revenue Trend:</span><br>
                        <span class="trend-indicator ${getTrendClass(timeAnalysis.trends?.revenue_trend)}" style="font-size: 1.1rem; font-weight: 600;">
                            ${getTrendIcon(timeAnalysis.trends?.revenue_trend)} ${timeAnalysis.trends?.revenue_trend || 'N/A'}
                        </span>
                        ${timeAnalysis.performanceChanges?.revenue_change ? `<br><small>${timeAnalysis.performanceChanges.revenue_change}% vs previous period</small>` : ''}
                    </div>
                </div>
            </div>
        </div>
    `;
}

function getVolatilityLevel(score) {
    const volatility = parseFloat(score) || 0;
    if (volatility < 10) return 'Very Stable';
    if (volatility < 20) return 'Stable';
    if (volatility < 35) return 'Moderate';
    if (volatility < 50) return 'High';
    return 'Very High';
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

function switchTimeView(viewType) {
    console.log('Switching to view:', viewType);
    // Implementation for switching between daily/weekly/monthly views
}

function filterByPeriod(period) {
    console.log('Filtering by period:', period);
    // Implementation for date filtering
}

function applyCustomDateRange() {
    const startDate = document.getElementById('start-date')?.value;
    const endDate = document.getElementById('end-date')?.value;
    console.log('Applying custom date range:', startDate, 'to', endDate);
    // Implementation for custom date range filtering
}

// Enhanced channel deep dive with no table cropping
function generateEnhancedChannelDeepDive(results) {
    return `
        <div class="panel-content">
            <div class="panel-header">
                <h2>🎯 Channel Deep-Dive Analysis</h2>
                <p>Comprehensive breakdown of performance across all marketing channels</p>
            </div>
            
            <div class="scrollable-table">
                <div class="data-table-container">
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Channel</th>
                                <th>Total Spend</th>
                                <th>Total Customers</th>
                                <th>Avg Daily Spend</th>
                                <th>CAC</th>
                                <th>CTR</th>
                                <th>CPC</th>
                                <th>CVR</th>
                                <th>ROAS</th>
                                <th>LTV:CAC Ratio</th>
                                <th>Efficiency Score</th>
                                <th>Days Active</th>
                                <th>Campaigns</th>
                                <th>Total Revenue</th>
                                <th>Impressions</th>
                                <th>Clicks</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${Object.entries(results.channelPerformance || {}).map(([channel, data]) => `
                                <tr>
                                    <td><strong>${channel}</strong></td>
                                    <td class="currency">$${data.spend?.toFixed(0) || '0'}</td>
                                    <td>${data.customers || '0'}</td>
                                    <td class="currency">$${data.avgDailySpend?.toFixed(0) || '0'}</td>
                                    <td class="currency ${parseFloat(data.cac) > 100 ? 'warning' : ''}">
                                        $${data.cac || '0'}
                                    </td>
                                    <td>${data.ctr || '0'}%</td>
                                    <td class="currency">$${data.cpc || '0'}</td>
                                    <td>${data.cvr || '0'}%</td>
                                    <td>${data.roas || '0'}x</td>
                                    <td>${data.ltv_cac_ratio || '0'}:1</td>
                                    <td>
                                        <div class="efficiency-score">
                                            <div class="score-bar">
                                                <div class="score-fill" style="width: ${data.efficiency_score || 0}%"></div>
                                            </div>
                                            <span>${data.efficiency_score || '0'}/100</span>
                                        </div>
                                    </td>
                                    <td>${data.days || '0'}</td>
                                    <td>${data.campaigns || '0'}</td>
                                    <td class="currency">$${data.revenue?.toFixed(0) || '0'}</td>
                                    <td>${data.impressions?.toLocaleString() || '0'}</td>
                                    <td>${data.clicks?.toLocaleString() || '0'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    `;
}

// Include CSS for additional styling enhancements
const additionalCSS = `
    .trend-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
        gap: 1rem;
        margin-top: 1rem;
    }

    .comparison-card {
        padding: 1rem;
        background: var(--surface);
        border-radius: 8px;
        border: 1px solid var(--border);
    }

    .comparison-title {
        font-size: 0.9rem;
        color: var(--text-muted);
        margin-bottom: 0.5rem;
    }

    .comparison-value {
        font-size: 1.5rem;
        font-weight: 700;
        margin-bottom: 0.25rem;
    }

    .comparison-change {
        font-size: 0.8rem;
    }

    .metric-change {
        font-size: 0.75rem;
        margin-top: 0.25rem;
        opacity: 0.8;
    }
`;