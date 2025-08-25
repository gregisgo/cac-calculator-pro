// Generate comprehensive 18-month sample data for CAC Calculator Pro
const fs = require('fs');
const path = require('path');

function generateSampleData() {
    console.log('Generating comprehensive 18-month sample data...');
    
    // Date range: 18 months back from today
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 18);
    
    const marketingData = [];
    const revenueData = [];
    const customerData = [];
    
    // Channel configurations with realistic performance patterns
    const channels = {
        'Google Ads': {
            baseDailySpend: 1200,
            baseCTR: 2.2,
            baseCVR: 3.8,
            baseCPC: 2.15,
            seasonalVariation: 0.25, // How much seasonal impact
            trendDirection: 0.15, // Positive trend over time
            efficiency: 0.85 // Base efficiency multiplier
        },
        'Facebook': {
            baseDailySpend: 900,
            baseCTR: 1.1,
            baseCVR: 2.3,
            baseCPC: 1.85,
            seasonalVariation: 0.35,
            trendDirection: -0.05, // Slight decline (iOS updates effect)
            efficiency: 0.75
        },
        'LinkedIn': {
            baseDailySpend: 650,
            baseCTR: 0.8,
            baseCVR: 4.5,
            baseCPC: 6.20,
            seasonalVariation: 0.15,
            trendDirection: 0.25, // Strong positive trend
            efficiency: 0.90
        },
        'TikTok': {
            baseDailySpend: 450,
            baseCTR: 2.8,
            baseCVR: 1.9,
            baseCPC: 0.95,
            seasonalVariation: 0.45,
            trendDirection: 0.35, // Very strong growth
            efficiency: 0.65
        },
        'Pinterest': {
            baseDailySpend: 350,
            baseCTR: 1.4,
            baseCVR: 2.1,
            baseCPC: 1.25,
            seasonalVariation: 0.55, // Very seasonal (holidays)
            trendDirection: 0.10,
            efficiency: 0.70
        }
    };
    
    // Campaign types for each channel
    const campaignTypes = {
        'Google Ads': ['Search - Brand', 'Search - Generic', 'Display - Remarketing', 'Shopping', 'Video - YouTube'],
        'Facebook': ['Traffic', 'Conversions', 'Video Views', 'Lead Generation', 'Remarketing'],
        'LinkedIn': ['Sponsored Content', 'Message Ads', 'Text Ads', 'Dynamic Ads', 'Event Ads'],
        'TikTok': ['Reach', 'Traffic', 'App Install', 'Conversions', 'Video Views'],
        'Pinterest': ['Traffic', 'Conversions', 'Brand Awareness', 'Video Views', 'App Install']
    };
    
    // Creative types
    const creativeTypes = ['Image', 'Video', 'Carousel', 'Collection', 'Text'];
    
    // Generate data for each day
    for (let date = new Date(startDate); date <= endDate; date.setDate(date.getDate() + 1)) {
        const dateStr = date.toISOString().split('T')[0];
        const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
        const dayOfWeek = date.getDay();
        const monthOfYear = date.getMonth();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        const isHoliday = isHolidayPeriod(date);
        
        // Seasonal multipliers
        const seasonalMultiplier = 1 + 0.3 * Math.sin((dayOfYear / 365) * 2 * Math.PI + Math.PI/4); // Peak in Q4
        const weekdayMultiplier = isWeekend ? 0.7 : 1.1;
        const holidayMultiplier = isHoliday ? 1.4 : 1.0;
        
        Object.entries(channels).forEach(([channel, config]) => {
            const campaigns = campaignTypes[channel];
            
            // Generate data for 2-4 campaigns per channel per day
            const numCampaigns = Math.floor(Math.random() * 3) + 2;
            
            for (let i = 0; i < numCampaigns; i++) {
                const campaign = campaigns[Math.floor(Math.random() * campaigns.length)];
                const creativeType = creativeTypes[Math.floor(Math.random() * creativeTypes.length)];
                const creativeId = `${channel.toLowerCase().replace(/\s+/g, '')}_${campaign.toLowerCase().replace(/\s+/g, '_')}_${creativeType.toLowerCase()}_${Math.floor(Math.random() * 100)}`;
                
                // Calculate time-based trend
                const monthsSinceStart = (date.getFullYear() - startDate.getFullYear()) * 12 + date.getMonth() - startDate.getMonth();
                const trendMultiplier = 1 + (config.trendDirection * monthsSinceStart / 18);
                
                // Random daily variation
                const randomVariation = 0.7 + Math.random() * 0.6;
                
                // Final multipliers
                const totalMultiplier = seasonalMultiplier * 
                                     weekdayMultiplier * 
                                     holidayMultiplier * 
                                     trendMultiplier * 
                                     randomVariation * 
                                     config.efficiency *
                                     (1 + config.seasonalVariation * (Math.random() - 0.5));
                
                // Calculate metrics
                const dailySpend = Math.round(config.baseDailySpend * totalMultiplier / numCampaigns);
                const cpc = config.baseCPC * (0.8 + Math.random() * 0.4) * (2 - totalMultiplier * 0.5);
                const clicks = Math.round(dailySpend / cpc);
                const impressions = Math.round(clicks / (config.baseCTR / 100) * (0.8 + Math.random() * 0.4));
                const ctr = clicks > 0 ? (clicks / impressions * 100) : 0;
                const customers = Math.round(clicks * (config.baseCVR / 100) * (0.7 + Math.random() * 0.6));
                const cvr = clicks > 0 ? (customers / clicks * 100) : 0;
                
                // Revenue calculations
                const avgOrderValue = 120 + Math.random() * 200; // $120-$320 AOV
                const revenue = customers * avgOrderValue * (0.8 + Math.random() * 0.4);
                const roas = dailySpend > 0 ? revenue / dailySpend : 0;
                
                // Add some data quality variations (missing fields occasionally)
                const hasImpressions = Math.random() > 0.1; // 90% have impressions
                const hasRevenue = Math.random() > 0.05; // 95% have revenue
                const hasCreativeData = Math.random() > 0.2; // 80% have creative data
                
                // Marketing data row
                const marketingRow = {
                    date: dateStr,
                    channel: channel,
                    campaign_name: campaign,
                    spend: dailySpend,
                    clicks: clicks,
                    customers: customers,
                    conversions: customers, // Alternative naming
                    ctr: parseFloat(ctr.toFixed(2)),
                    cvr: parseFloat(cvr.toFixed(2)),
                    cpc: parseFloat(cpc.toFixed(2)),
                    ...(hasImpressions && { impressions: impressions }),
                    ...(hasCreativeData && { 
                        creative_id: creativeId,
                        creative_type: creativeType,
                        ad_name: `${campaign} - ${creativeType} ${i + 1}`
                    })
                };
                
                marketingData.push(marketingRow);
                
                // Revenue data row
                if (hasRevenue && customers > 0) {
                    const revenueRow = {
                        date: dateStr,
                        channel: channel,
                        campaign_name: campaign,
                        customers: customers,
                        new_customers: customers,
                        revenue: Math.round(revenue),
                        roas: parseFloat(roas.toFixed(2)),
                        avg_order_value: parseFloat(avgOrderValue.toFixed(2)),
                        ltv: parseFloat((avgOrderValue * 2.5).toFixed(2)) // Simple LTV calculation
                    };
                    
                    revenueData.push(revenueRow);
                }
                
                // Customer data (cohort information)
                if (customers > 0) {
                    for (let c = 0; c < customers; c++) {
                        const customerRow = {
                            customer_id: `cust_${date.getTime()}_${channel.replace(/\s+/g, '').toLowerCase()}_${c}`,
                            acquisition_date: dateStr,
                            acquisition_channel: channel,
                            acquisition_campaign: campaign,
                            first_purchase_value: parseFloat((avgOrderValue * (0.7 + Math.random() * 0.6)).toFixed(2)),
                            customer_segment: getCustomerSegment(),
                            acquisition_cac: parseFloat((dailySpend / customers).toFixed(2)),
                            predicted_ltv: parseFloat((avgOrderValue * (1.5 + Math.random() * 2)).toFixed(2))
                        };
                        
                        customerData.push(customerRow);
                    }
                }
            }
        });
    }
    
    // Sort by date
    marketingData.sort((a, b) => new Date(a.date) - new Date(b.date));
    revenueData.sort((a, b) => new Date(a.date) - new Date(b.date));
    customerData.sort((a, b) => new Date(a.acquisition_date) - new Date(b.acquisition_date));
    
    console.log(`Generated ${marketingData.length} marketing rows`);
    console.log(`Generated ${revenueData.length} revenue rows`);
    console.log(`Generated ${customerData.length} customer rows`);
    
    return { marketingData, revenueData, customerData };
}

function isHolidayPeriod(date) {
    const month = date.getMonth();
    const day = date.getDate();
    
    // Black Friday/Cyber Monday period
    if (month === 10 && day >= 20) return true;
    
    // December holiday period
    if (month === 11) return true;
    
    // Back to school (August-September)
    if (month === 7 || (month === 8 && day <= 15)) return true;
    
    // Valentine's Day period
    if (month === 1 && day >= 10 && day <= 16) return true;
    
    return false;
}

function getCustomerSegment() {
    const segments = ['High Value', 'Medium Value', 'Low Value', 'Enterprise', 'SMB'];
    const weights = [0.15, 0.35, 0.30, 0.10, 0.10]; // Distribution weights
    
    const random = Math.random();
    let cumulative = 0;
    
    for (let i = 0; i < segments.length; i++) {
        cumulative += weights[i];
        if (random <= cumulative) {
            return segments[i];
        }
    }
    
    return segments[0];
}

function saveToCSV(data, filename) {
    if (data.length === 0) return;
    
    const headers = Object.keys(data[0]);
    const csvContent = [
        headers.join(','),
        ...data.map(row => 
            headers.map(header => {
                const value = row[header];
                // Escape commas and quotes in text fields
                if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                    return `"${value.replace(/"/g, '""')}"`;
                }
                return value;
            }).join(',')
        )
    ].join('\n');
    
    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`Saved ${data.length} rows to ${filename}`);
}

// Generate and save data
const { marketingData, revenueData, customerData } = generateSampleData();

// Save to CSV files
saveToCSV(marketingData, path.join(__dirname, 'public', 'sample-marketing-18m-enhanced.csv'));
saveToCSV(revenueData, path.join(__dirname, 'public', 'sample-revenue-18m-enhanced.csv'));
saveToCSV(customerData, path.join(__dirname, 'public', 'sample-customers-18m-enhanced.csv'));

// Create a smaller 3-month recent sample for quick testing
const recentMarketingData = marketingData.filter(row => {
    const rowDate = new Date(row.date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return rowDate >= threeMonthsAgo;
});

const recentRevenueData = revenueData.filter(row => {
    const rowDate = new Date(row.date);
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    return rowDate >= threeMonthsAgo;
});

saveToCSV(recentMarketingData, path.join(__dirname, 'public', 'sample-marketing-3m-recent.csv'));
saveToCSV(recentRevenueData, path.join(__dirname, 'public', 'sample-revenue-3m-recent.csv'));

console.log('\n✅ Sample data generation complete!');
console.log(`📊 18-month datasets: ${marketingData.length} marketing rows, ${revenueData.length} revenue rows, ${customerData.length} customer rows`);
console.log(`📊 3-month recent datasets: ${recentMarketingData.length} marketing rows, ${recentRevenueData.length} revenue rows`);
console.log('\nFiles created:');
console.log('- sample-marketing-18m-enhanced.csv (full 18 months)');
console.log('- sample-revenue-18m-enhanced.csv (full 18 months)'); 
console.log('- sample-customers-18m-enhanced.csv (customer cohort data)');
console.log('- sample-marketing-3m-recent.csv (recent 3 months for quick testing)');
console.log('- sample-revenue-3m-recent.csv (recent 3 months for quick testing)');