const fs = require('fs');
const FormData = require('form-data');
const { default: fetch } = require('node-fetch');

async function testAnalytics() {
    try {
        const form = new FormData();
        
        // Read the sample files
        const marketingData = fs.readFileSync('sample-marketing-data-18m-enhanced.csv');
        const revenueData = fs.readFileSync('sample-revenue-comprehensive.csv');
        
        form.append('marketingFile', marketingData, 'marketing.csv');
        form.append('revenueFile', revenueData, 'revenue.csv');
        
        console.log('Uploading files for analysis...');
        
        const response = await fetch('http://localhost:3007/api/upload-and-analyze', {
            method: 'POST',
            body: form
        });
        
        const result = await response.json();
        
        console.log('Analysis Results:');
        console.log('Blended CAC:', result.blendedCAC);
        console.log('Total Spend:', result.totalSpend);
        console.log('Total Customers:', result.totalCustomers);
        console.log('Channel Performance:', Object.keys(result.channelPerformance || {}));
        console.log('Opportunities Found:', (result.opportunities || []).length);
        console.log('Campaign Analysis:', Object.keys(result.campaignAnalysis || {}));
        console.log('Data Quality:', result.dataQuality?.completeness);
        
        if (result.opportunities && result.opportunities.length > 0) {
            console.log('\nSample Optimization Opportunities:');
            result.opportunities.slice(0, 3).forEach((opp, i) => {
                console.log(`${i+1}. ${opp.type}: ${opp.recommendation}`);
            });
        }
        
        console.log('\nTest completed successfully!');
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testAnalytics();