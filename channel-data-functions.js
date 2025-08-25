// Enhanced channel data handling functions for comprehensive daily performance exports

function getChannelDisplayName(channelId) {
    const channelNames = {
        'google-ads': 'Google Ads',
        'facebook': 'Facebook/Meta',
        'linkedin': 'LinkedIn',
        'tiktok': 'TikTok',
        'twitter': 'Twitter/X',
        'other': 'Other Channels'
    };
    return channelNames[channelId] || 'Unknown Channel';
}

function previewChannelData(inputId) {
    const input = document.getElementById(inputId);
    const file = input.files[0];
    
    if (!file) {
        showNotification('No file selected for preview', 'warning');
        return;
    }
    
    // For now, show a placeholder preview
    showNotification('Data preview feature coming soon. File structure will be validated during analysis.', 'info');
}

function downloadSampleTemplate(channelId) {
    const channelName = getChannelDisplayName(channelId);
    
    // Create channel-specific sample CSV content
    const sampleHeaders = [
        'date', 'campaign_name', 'ad_set_name', 'ad_name', 
        'spend', 'impressions', 'clicks', 'ctr', 'cpc',
        'conversions', 'conversion_rate', 'cost_per_conversion', 
        'revenue', 'roas', 'reach', 'frequency', 'cpm',
        'engagement_rate', 'quality_score', 'delivery_status'
    ];
    
    // Channel-specific sample data
    const channelSpecificData = {
        'google-ads': [
            '2024-01-01,Search Campaign,Keyword Ad Group,Search Ad 1,500.00,25000,625,2.5,0.8,25,4.0,20.00,1250.00,2.5,15000,1.67,20.00,1.2,8.5,Active',
            '2024-01-02,Display Campaign,Display Ad Group,Display Ad 1,750.00,50000,750,1.5,1.0,30,4.0,25.00,1800.00,2.4,35000,1.43,15.00,0.8,7.2,Active',
            '2024-01-03,Shopping Campaign,Product Group,Shopping Ad 1,600.00,20000,800,4.0,0.75,40,5.0,15.00,2000.00,3.33,12000,1.67,30.00,2.1,9.1,Active'
        ],
        'facebook': [
            '2024-01-01,Brand Awareness,Video Ad Set,Brand Video 1,400.00,45000,450,1.0,0.89,18,4.0,22.22,900.00,2.25,25000,1.8,8.89,3.2,8.0,Active',
            '2024-01-02,Lead Generation,Carousel Ad Set,Carousel Ad 1,550.00,35000,875,2.5,0.63,35,4.0,15.71,1750.00,3.18,20000,1.75,15.71,2.8,8.5,Active',
            '2024-01-03,Conversion Campaign,Single Image Set,Image Ad 1,650.00,30000,900,3.0,0.72,45,5.0,14.44,2250.00,3.46,18000,1.67,21.67,1.9,7.8,Active'
        ],
        'linkedin': [
            '2024-01-01,B2B Lead Gen,Professional Ad Set,Professional Ad 1,800.00,15000,150,1.0,5.33,10,6.67,80.00,1000.00,1.25,8000,1.88,53.33,0.5,7.5,Active',
            '2024-01-02,Thought Leadership,Sponsored Content Set,Content Ad 1,900.00,20000,240,1.2,3.75,12,5.0,75.00,1800.00,2.0,10000,2.0,45.00,0.8,8.2,Active',
            '2024-01-03,Event Promotion,Event Ad Set,Event Ad 1,700.00,12000,180,1.5,3.89,15,8.33,46.67,2250.00,3.21,7500,1.6,58.33,1.2,8.8,Active'
        ],
        'tiktok': [
            '2024-01-01,Viral Campaign,Gen Z Ad Set,Viral Video 1,300.00,80000,1600,2.0,0.19,32,2.0,9.38,800.00,2.67,40000,2.0,3.75,5.2,8.5,Active',
            '2024-01-02,Brand Challenge,Challenge Ad Set,Challenge Ad 1,450.00,100000,2250,2.25,0.2,45,2.0,10.00,1350.00,3.0,50000,2.0,4.50,4.8,9.0,Active',
            '2024-01-03,Product Showcase,Showcase Ad Set,Product Video 1,350.00,60000,1800,3.0,0.19,54,3.0,6.48,1620.00,4.63,35000,1.71,5.83,6.1,8.7,Active'
        ]
    };
    
    const sampleData = channelSpecificData[channelId] || [
        '2024-01-01,Sample Campaign,Sample Ad Set,Sample Ad,100.00,10000,200,2.0,0.5,10,5.0,10.00,500.00,5.0,8000,1.25,10.00,2.0,8.0,Active',
        '2024-01-02,Sample Campaign 2,Sample Ad Set 2,Sample Ad 2,150.00,15000,300,2.0,0.5,15,5.0,10.00,750.00,5.0,12000,1.25,10.00,2.0,8.0,Active'
    ];
    
    const csvContent = [sampleHeaders.join(','), ...sampleData].join('\\n');
    
    // Create and download file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${channelId}-comprehensive-template.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`${channelName} comprehensive template downloaded`, 'success');
}

// Enhanced file upload handling for comprehensive performance data
function enhancedHandleChannelFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const previewId = input.id.replace('-file', '-preview');
    const preview = document.getElementById(previewId);
    const zone = document.getElementById(input.id.replace('-file', '-upload'));
    
    if (preview && zone) {
        // Extract channel info
        const channelId = input.id.split('-')[0];
        const channelName = getChannelDisplayName(channelId);
        
        // Update zone to show file selected
        const uploadText = zone.querySelector('.upload-text');
        const uploadSubtext = zone.querySelector('.upload-subtext');
        
        if (uploadText && uploadSubtext) {
            uploadText.textContent = file.name;
            uploadSubtext.textContent = `${channelName} performance data loaded (${(file.size / 1024).toFixed(1)} KB)`;
            zone.style.borderColor = 'var(--accent-color)';
            zone.style.backgroundColor = 'rgba(34, 197, 94, 0.05)';
        }
        
        // Show enhanced preview with data structure validation
        preview.style.display = 'block';
        preview.innerHTML = `
            <div style="padding: 1.5rem; background: var(--surface-alt); border-radius: 8px; border: 1px solid var(--border); margin-top: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                    <span style="font-size: 1.5rem;">📊</span>
                    <div>
                        <strong>${file.name}</strong>
                        <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.25rem;">
                            ${channelName} Comprehensive Performance Export | ${(file.size / 1024).toFixed(1)} KB | ${file.type || 'CSV/Excel'}
                        </div>
                    </div>
                </div>
                
                <div style="background: rgba(59, 130, 246, 0.1); padding: 0.75rem; border-radius: 6px; margin-bottom: 1rem;">
                    <div style="font-size: 0.9rem; color: var(--primary-color); margin-bottom: 0.5rem;">
                        🔍 <strong>Expected Data Structure</strong>
                    </div>
                    <div style="font-size: 0.8rem; color: var(--text-secondary);">
                        Daily performance with campaign hierarchy (Campaign → Ad Set → Ad)<br>
                        Complete metrics: Engagement, Conversion, Delivery & Reach data<br>
                        Auto-validation will verify structure during analysis
                    </div>
                </div>
                
                <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                    <button class="btn btn-small" onclick="removeChannelFile('${input.id}')">Remove File</button>
                    <button class="btn btn-small" onclick="previewChannelData('${input.id}')">🔍 Preview Data</button>
                    <button class="btn btn-small" onclick="validateChannelStructure('${input.id}')">✓ Validate Structure</button>
                </div>
            </div>
        `;
        
        // Update analyze button
        updateAnalyzeButton();
        
        showNotification(`${channelName} comprehensive performance data uploaded successfully`, 'success');
    }
}

function validateChannelStructure(inputId) {
    const input = document.getElementById(inputId);
    const file = input.files[0];
    
    if (!file) {
        showNotification('No file selected for validation', 'warning');
        return;
    }
    
    const channelId = input.id.split('-')[0];
    const channelName = getChannelDisplayName(channelId);
    
    // Show validation in progress
    showNotification(`Validating ${channelName} data structure...`, 'info', 2000);
    
    // Simulate validation process
    setTimeout(() => {
        showNotification(`${channelName} data structure validation will be performed during analysis. Upload more files or click Analyze to proceed.`, 'success');
    }, 2000);
}

// Make functions globally available
window.getChannelDisplayName = getChannelDisplayName;
window.previewChannelData = previewChannelData;
window.downloadSampleTemplate = downloadSampleTemplate;
window.enhancedHandleChannelFileUpload = enhancedHandleChannelFileUpload;
window.validateChannelStructure = validateChannelStructure;