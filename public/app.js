// Global application state
const appState = {
    currentStep: 'setup',
    projectConfig: {},
    businessModel: {},
    uploadedData: {
        marketing: null,
        revenue: null,
        customer: null
    },
    channelData: {
        googleAds: null,
        facebook: null,
        linkedin: null,
        tiktok: null,
        other: null
    },
    uploadMethod: 'channel-by-channel',
    analysisResults: null,
    dataQuality: null
};

// Notification system
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = 'notification notification-' + type;
    notification.textContent = message;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 1rem 1.5rem;
        border-radius: 8px;
        color: white;
        font-weight: 500;
        z-index: 10000;
        max-width: 400px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
        animation: slideInRight 0.3s ease-out;
        background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#6366f1'};
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add notification animations
if (typeof document !== 'undefined') {
    const addNotificationStyles = () => {
        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                @keyframes slideOutRight {
                    from { transform: translateX(0); opacity: 1; }
                    to { transform: translateX(100%); opacity: 0; }
                }
            `;
            document.head.appendChild(style);
        }
    };
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', addNotificationStyles);
    } else {
        addNotificationStyles();
    }
}

// Navigation functions
function nextStep(stepName) {
    if (!validateCurrentStep()) return;
    saveCurrentStepData();
    showStep(stepName);
}

function prevStep(stepName) {
    showStep(stepName);
}

function showStep(stepName) {
    document.querySelectorAll('.nav-step').forEach(step => {
        step.classList.remove('active');
        if (step.dataset.step === stepName) {
            step.classList.add('active');
        }
    });
    
    document.querySelectorAll('.section').forEach(section => {
        section.classList.remove('active');
        if (section.dataset.section === stepName) {
            section.classList.add('active');
        }
    });
    
    appState.currentStep = stepName;
}

function validateCurrentStep() {
    const currentStep = appState.currentStep;
    
    switch (currentStep) {
        case 'setup':
            const projectName = document.getElementById('projectName');
            if (!projectName || !projectName.value.trim()) {
                showNotification('Please enter a project name', 'error');
                return false;
            }
            break;
            
        case 'business':
            const businessType = document.getElementById('businessType');
            const revenueModel = document.getElementById('revenueModel');
            if (!businessType?.value || !revenueModel?.value) {
                showNotification('Please complete the business model configuration', 'error');
                return false;
            }
            break;
            
        case 'data':
            const hasMarketingData = appState.uploadedData.marketing?.data?.length > 0;
            const hasChannelData = Object.values(appState.channelData || {}).some(channel => channel && channel.data?.length > 0);
            const hasRevenueData = appState.uploadedData.revenue?.data?.length > 0;
            
            if (!hasMarketingData && !hasChannelData) {
                showNotification('Please upload marketing data (either unified or channel-specific)', 'error');
                return false;
            }
            break;
    }
    
    return true;
}

function saveCurrentStepData() {
    const currentStep = appState.currentStep;
    
    switch (currentStep) {
        case 'setup':
            appState.projectConfig = {
                projectName: document.getElementById('projectName')?.value || '',
                startDate: document.getElementById('startDate')?.value || '',
                endDate: document.getElementById('endDate')?.value || '',
                consultantName: document.getElementById('consultantName')?.value || '',
                analysisPurpose: document.getElementById('analysisPurpose')?.value || ''
            };
            break;
            
        case 'business':
            appState.businessModel = {
                businessType: document.getElementById('businessType')?.value || '',
                revenueModel: document.getElementById('revenueModel')?.value || '',
                avgOrderValue: document.getElementById('avgOrderValue')?.value || '',
                customerLifetime: document.getElementById('customerLifetime')?.value || ''
            };
            break;
    }
}

// Autofill functions
function autofillProjectSetup() {
    const projectName = document.getElementById('projectName');
    const startDate = document.getElementById('startDate');
    const endDate = document.getElementById('endDate');
    const consultantName = document.getElementById('consultantName');
    const analysisPurpose = document.getElementById('analysisPurpose');
    
    if (projectName) projectName.value = 'ACME SaaS Marketing Analysis';
    if (startDate) startDate.value = '2023-01-01';
    if (endDate) endDate.value = '2024-06-30';
    if (consultantName) consultantName.value = 'Greg Breeden - Fractional CMO';
    if (analysisPurpose) analysisPurpose.value = 'audit';
    
    showNotification('Project setup auto-filled! ⚡', 'success');
}

function autofillBusinessModel() {
    const businessType = document.getElementById('businessType');
    const revenueModel = document.getElementById('revenueModel');
    const avgOrderValue = document.getElementById('avgOrderValue');
    const customerLifetime = document.getElementById('customerLifetime');
    
    if (businessType) businessType.value = 'saas';
    if (revenueModel) revenueModel.value = 'subscription';
    if (avgOrderValue) avgOrderValue.value = '99';
    if (customerLifetime) customerLifetime.value = '24';
    
    showNotification('Business model auto-filled! ⚡', 'success');
}

// Demo data functions
function loadDemoData() {
    autofillProjectSetup();
    autofillBusinessModel();
    loadSampleData();
    showNotification('Demo data loaded successfully! Navigate to Analysis to see results.', 'success');
}

function loadSampleData() {
    appState.uploadedData.marketing = {
        data: [
            {date: '2024-01-01', channel: 'Google Ads', spend: 2500, impressions: 125000, clicks: 3125, customers: 32, revenue: 15000},
            {date: '2024-01-01', channel: 'Facebook', spend: 1800, impressions: 90000, clicks: 1620, customers: 28, revenue: 12000},
            {date: '2024-01-01', channel: 'LinkedIn', spend: 1200, impressions: 24000, clicks: 288, customers: 18, revenue: 8500},
            {date: '2024-01-02', channel: 'Google Ads', spend: 2300, impressions: 115000, clicks: 2875, customers: 30, revenue: 14500},
            {date: '2024-01-02', channel: 'Facebook', spend: 1900, impressions: 95000, clicks: 1710, customers: 29, revenue: 13200}
        ],
        filename: 'sample-marketing-data.csv'
    };
    
    appState.uploadedData.revenue = {
        data: [
            {date: '2024-01-01', revenue: 15000, customers: 45, new_customers: 32, ltv: 850},
            {date: '2024-01-01', revenue: 12000, customers: 38, new_customers: 28, ltv: 650},
            {date: '2024-01-02', revenue: 14500, customers: 42, new_customers: 30, ltv: 820},
            {date: '2024-01-02', revenue: 13200, customers: 40, new_customers: 29, ltv: 680}
        ],
        filename: 'sample-revenue-data.csv'
    };
    
    updateAnalyzeButton();
}

// Upload functions
function uploadOwnData() {
    const uploadSection = document.getElementById('channel-by-channel-upload') || document.getElementById('unified-upload');
    if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
        showNotification('Ready to upload your data files', 'info');
    }
}

function selectUploadMethod(method) {
    appState.uploadMethod = method;
    
    document.querySelectorAll('.method-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    const channelSection = document.getElementById('channel-by-channel-upload');
    const unifiedSection = document.getElementById('unified-upload');
    
    if (method === 'channel-by-channel') {
        if (channelSection) channelSection.style.display = 'block';
        if (unifiedSection) unifiedSection.style.display = 'none';
    } else {
        if (channelSection) channelSection.style.display = 'none';
        if (unifiedSection) unifiedSection.style.display = 'block';
    }
    
    showNotification('Upload method selected: ' + method, 'info');
}

function showChannelTab(channel) {
    console.log('Switching to channel tab:', channel);
    
    // Update tab appearance
    document.querySelectorAll('.channel-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'var(--surface)';
        tab.style.color = 'var(--text-primary)';
        tab.style.borderColor = 'var(--border)';
    });
    
    const selectedTab = document.getElementById('tab-' + channel);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.background = 'var(--primary-color)';
        selectedTab.style.color = 'white';
        selectedTab.style.borderColor = 'var(--primary-color)';
    }
    
    // Hide all channel forms
    document.querySelectorAll('.channel-upload-form').forEach(form => {
        form.style.display = 'none';
    });
    
    // Show selected channel form
    const selectedForm = document.getElementById('form-' + channel);
    if (selectedForm) {
        selectedForm.style.display = 'block';
    } else {
        console.warn('Channel form not found:', 'form-' + channel);
    }
    
    // Update notification
    const channelName = channel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase());
    showNotification(`Switched to ${channelName} upload`, 'info');
}

// File upload system
function initializeFileUploads() {
    const fileInputs = document.querySelectorAll('input[type="file"]');
    
    fileInputs.forEach(input => {
        if (input.dataset.initialized) return;
        input.dataset.initialized = 'true';
        
        input.addEventListener('change', function(event) {
            const file = event.target.files[0];
            if (!file) return;
            
            const channel = input.dataset.channel || 'unified';
            handleFileUpload(file, channel, input);
        });
    });
}

function handleFileUpload(file, channel, inputElement) {
    if (!file) return;
    
    showNotification('Processing file: ' + file.name, 'info');
    
    const formData = new FormData();
    formData.append('dataFile', file);
    formData.append('channel', channel);
    
    fetch('/api/upload', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (data.error) {
            showNotification('Upload failed: ' + data.error, 'error');
            return;
        }
        
        if (channel === 'unified') {
            if (file.name.toLowerCase().includes('marketing') || file.name.toLowerCase().includes('spend')) {
                appState.uploadedData.marketing = {
                    data: data.data,
                    filename: file.name
                };
            } else if (file.name.toLowerCase().includes('revenue') || file.name.toLowerCase().includes('customer')) {
                appState.uploadedData.revenue = {
                    data: data.data,
                    filename: file.name
                };
            } else {
                appState.uploadedData.marketing = {
                    data: data.data,
                    filename: file.name
                };
            }
        } else {
            appState.channelData[channel] = {
                data: data.data,
                filename: file.name
            };
        }
        
        updateAnalyzeButton();
        showNotification('Successfully uploaded: ' + file.name, 'success');
    })
    .catch(error => {
        console.error('Upload error:', error);
        showNotification('Upload failed. Please try again.', 'error');
    });
}

function updateAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (!analyzeBtn) return;
    
    const hasData = (appState.uploadedData.marketing && appState.uploadedData.marketing.data && appState.uploadedData.marketing.data.length > 0) ||
                    (appState.uploadedData.revenue && appState.uploadedData.revenue.data && appState.uploadedData.revenue.data.length > 0) ||
                    Object.values(appState.channelData).some(channel => channel && channel.data && channel.data.length > 0);
    
    if (hasData) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Run CAC Analysis';
        analyzeBtn.style.opacity = '1';
    } else {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Upload Data First';
        analyzeBtn.style.opacity = '0.5';
    }
}

// Analysis functions
function runAnalysis() {
    showNotification('Starting CAC analysis...', 'info');
    
    const analysisData = {
        marketing: appState.uploadedData.marketing?.data || [],
        revenue: appState.uploadedData.revenue?.data || [],
        channels: {},
        businessModel: appState.businessModel,
        projectConfig: appState.projectConfig
    };
    
    Object.keys(appState.channelData).forEach(channel => {
        if (appState.channelData[channel] && appState.channelData[channel].data) {
            analysisData.channels[channel] = appState.channelData[channel].data;
        }
    });
    
    const hasData = analysisData.marketing.length > 0 || 
                    analysisData.revenue.length > 0 || 
                    Object.keys(analysisData.channels).length > 0;
    
    if (!hasData) {
        showNotification('Please upload data before running analysis', 'error');
        return;
    }
    
    fetch('/api/analyze', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(analysisData)
    })
    .then(response => response.json())
    .then(results => {
        if (results.error) {
            showNotification('Analysis failed: ' + results.error, 'error');
            return;
        }
        
        appState.analysisResults = results;
        showNotification('Analysis completed successfully!', 'success');
        
        showStep('results');
        displayAnalysisResults(results);
    })
    .catch(error => {
        console.error('Analysis error:', error);
        showNotification('Analysis failed. Please try again.', 'error');
    });
}

function displayAnalysisResults(results) {
    const resultsContainer = document.getElementById('resultsContent');
    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }
    
    resultsContainer.innerHTML = generateDetailedAnalysisHTML(results);
}

function generateDetailedAnalysisHTML(results) {
    return `
        <div class="comprehensive-analytics-platform">
            <!-- Platform Header with Key Metrics -->
            <div class="platform-header">
                <div class="header-content">
                    <h1>Performance Analytics Dashboard</h1>
                    <div class="data-period">
                        ${results.dataQuality?.dateRange ? 
                            `${results.dataQuality.dateRange.start} → ${results.dataQuality.dateRange.end} (${results.dataQuality.dateRange.days} days)` : 
                            'Date range not available'
                        }
                    </div>
                </div>
                
                <div class="executive-metrics">
                    <div class="metric-card primary">
                        <div class="metric-value">$${results.blendedCAC || '0'}</div>
                        <div class="metric-label">Blended CAC</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">${results.totalCustomers || '0'}</div>
                        <div class="metric-label">Total Customers</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$${results.totalSpend || '0'}</div>
                        <div class="metric-label">Total Spend</div>
                    </div>
                    <div class="metric-card">
                        <div class="metric-value">$${results.totalRevenue || '0'}</div>
                        <div class="metric-label">Total Revenue</div>
                    </div>
                </div>
            </div>

            <!-- Navigation Tabs -->
            <div class="analytics-navigation">
                <button class="nav-tab active" onclick="showAnalyticsTab('overview')">📊 Overview</button>
                <button class="nav-tab" onclick="showAnalyticsTab('channels')">🎯 Channel Deep-Dive</button>
                <button class="nav-tab" onclick="showAnalyticsTab('campaigns')">🚀 Campaign Analysis</button>
                <button class="nav-tab" onclick="showAnalyticsTab('optimization')">⚡ Optimization Ops</button>
                <button class="nav-tab" onclick="showAnalyticsTab('creative')">🎨 Creative Performance</button>
                <button class="nav-tab" onclick="showAnalyticsTab('competitive')">📈 Competitive Intel</button>
                <button class="nav-tab" onclick="showAnalyticsTab('data')">🔍 Raw Data Explorer</button>
            </div>

            <!-- Analytics Content Panels -->
            <div id="analytics-content" class="analytics-content">
                <div id="overview-panel" class="analytics-panel active">
                    ${generateOverviewPanel(results)}
                </div>
                
                <div id="channels-panel" class="analytics-panel">
                    ${generateChannelDeepDivePanel(results)}
                </div>
                
                <div id="campaigns-panel" class="analytics-panel">
                    ${generateCampaignAnalysisPanel(results)}
                </div>
                
                <div id="optimization-panel" class="analytics-panel">
                    ${generateOptimizationPanel(results)}
                </div>
                
                <div id="creative-panel" class="analytics-panel">
                    ${generateCreativePanel(results)}
                </div>
                
                <div id="competitive-panel" class="analytics-panel">
                    ${generateCompetitivePanel(results)}
                </div>
                
                <div id="data-panel" class="analytics-panel">
                    ${generateDataExplorerPanel(results)}
                </div>
            </div>
        </div>

        <style>
            .comprehensive-analytics-platform {
                background: var(--background);
                min-height: 100vh;
                padding: 0;
            }
            
            .platform-header {
                background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
                color: white;
                padding: 2rem 0;
                margin-bottom: 2rem;
            }
            
            .header-content {
                text-align: center;
                margin-bottom: 2rem;
            }
            
            .header-content h1 {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }
            
            .data-period {
                font-size: 1.1rem;
                opacity: 0.9;
            }
            
            .executive-metrics {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
                max-width: 1200px;
                margin: 0 auto;
                padding: 0 2rem;
            }
            
            .metric-card {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(10px);
                padding: 1.5rem;
                border-radius: 12px;
                text-align: center;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            
            .metric-card.primary {
                background: rgba(255, 255, 255, 0.2);
                border: 2px solid rgba(255, 255, 255, 0.3);
            }
            
            .metric-value {
                font-size: 2.5rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }
            
            .metric-label {
                font-size: 1rem;
                opacity: 0.9;
            }
            
            .analytics-navigation {
                display: flex;
                justify-content: center;
                margin-bottom: 2rem;
                border-bottom: 1px solid var(--border);
                padding: 0 2rem;
                overflow-x: auto;
            }
            
            .nav-tab {
                background: none;
                border: none;
                padding: 1rem 1.5rem;
                font-size: 1rem;
                font-weight: 500;
                color: var(--text-secondary);
                cursor: pointer;
                border-bottom: 3px solid transparent;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            
            .nav-tab:hover {
                color: var(--primary-color);
                background: var(--surface);
            }
            
            .nav-tab.active {
                color: var(--primary-color);
                border-bottom-color: var(--primary-color);
                background: var(--surface);
            }
            
            .analytics-content {
                max-width: 1400px;
                margin: 0 auto;
                padding: 0 2rem 4rem;
            }
            
            .analytics-panel {
                display: none;
            }
            
            .analytics-panel.active {
                display: block;
            }
            
            .panel-section {
                background: var(--background);
                border: 1px solid var(--border);
                border-radius: 12px;
                margin-bottom: 2rem;
                padding: 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }
            
            .section-header {
                background: var(--surface);
                padding: 1.5rem;
                border-bottom: 1px solid var(--border);
                border-radius: 12px 12px 0 0;
            }
            
            .section-title {
                font-size: 1.5rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
            }
            
            .section-subtitle {
                color: var(--text-secondary);
                font-size: 1rem;
            }
            
            .section-content {
                padding: 1.5rem;
            }
            
            .data-table {
                width: 100%;
                border-collapse: collapse;
                background: var(--background);
                border-radius: 8px;
                overflow: hidden;
                box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
            }
            
            .data-table th {
                background: var(--surface-alt);
                padding: 1rem;
                text-align: left;
                font-weight: 600;
                border-bottom: 1px solid var(--border);
                font-size: 0.9rem;
                text-transform: uppercase;
                letter-spacing: 0.05em;
            }
            
            .data-table td {
                padding: 1rem;
                border-bottom: 1px solid var(--border);
                vertical-align: middle;
            }
            
            .data-table tbody tr:hover {
                background: var(--surface);
            }
            
            .performance-indicator {
                display: inline-flex;
                align-items: center;
                gap: 0.5rem;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.85rem;
                font-weight: 500;
            }
            
            .performance-indicator.excellent {
                background: rgba(16, 185, 129, 0.1);
                color: #10b981;
            }
            
            .performance-indicator.good {
                background: rgba(245, 158, 11, 0.1);
                color: #f59e0b;
            }
            
            .performance-indicator.poor {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
            }
            
            .opportunity-card {
                background: var(--surface);
                border: 1px solid var(--border);
                border-radius: 8px;
                padding: 1.5rem;
                margin-bottom: 1rem;
                position: relative;
                overflow: hidden;
            }
            
            .opportunity-card.high {
                border-left: 4px solid #ef4444;
            }
            
            .opportunity-card.medium {
                border-left: 4px solid #f59e0b;
            }
            
            .opportunity-card.low {
                border-left: 4px solid #10b981;
            }
            
            .opportunity-header {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 1rem;
            }
            
            .opportunity-title {
                font-weight: 600;
                font-size: 1.1rem;
            }
            
            .priority-badge {
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.8rem;
                font-weight: 500;
                text-transform: uppercase;
            }
            
            .priority-badge.high {
                background: rgba(239, 68, 68, 0.1);
                color: #ef4444;
            }
            
            .priority-badge.medium {
                background: rgba(245, 158, 11, 0.1);
                color: #f59e0b;
            }
            
            .filter-controls {
                display: flex;
                gap: 1rem;
                align-items: center;
                margin-bottom: 1rem;
                flex-wrap: wrap;
            }
            
            .filter-input {
                padding: 0.75rem;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 1rem;
                background: var(--background);
            }
            
            .filter-select {
                padding: 0.75rem;
                border: 1px solid var(--border);
                border-radius: 6px;
                font-size: 1rem;
                background: var(--background);
                cursor: pointer;
            }
        </style>
    `;
}

// Analytics Tab Navigation
function showAnalyticsTab(tabName) {
    // Update tab states
    document.querySelectorAll('.nav-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`[onclick="showAnalyticsTab('${tabName}')"]`)?.classList.add('active');
    
    // Update panel states
    document.querySelectorAll('.analytics-panel').forEach(panel => {
        panel.classList.remove('active');
    });
    document.getElementById(`${tabName}-panel`)?.classList.add('active');
}

// Panel Generation Functions
function generateOverviewPanel(results) {
    const channels = Object.entries(results.channelPerformance || {});
    return `
        <div class="panel-section">
            <div class="section-header">
                <div class="section-title">Channel Performance Overview</div>
                <div class="section-subtitle">Quick insights across all marketing channels</div>
            </div>
            <div class="section-content">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>Channel</th>
                            <th>CAC</th>
                            <th>Spend</th>
                            <th>Customers</th>
                            <th>CTR</th>
                            <th>CVR</th>
                            <th>ROAS</th>
                            <th>Performance</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${channels.map(([channel, data]) => {
                            const performance = parseFloat(data.cac) < 75 ? 'excellent' : 
                                              parseFloat(data.cac) < 100 ? 'good' : 'poor';
                            return `
                                <tr>
                                    <td><strong>${channel}</strong></td>
                                    <td>$${data.cac}</td>
                                    <td>$${data.spend?.toFixed(0) || '0'}</td>
                                    <td>${data.customers || '0'}</td>
                                    <td>${data.ctr || '0'}%</td>
                                    <td>${data.cvr || '0'}%</td>
                                    <td>${data.roas || '0'}x</td>
                                    <td><span class="performance-indicator ${performance}">${performance.toUpperCase()}</span></td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
        </div>
        
        <div class="panel-section">
            <div class="section-header">
                <div class="section-title">Time-Based Performance</div>
                <div class="section-subtitle">Daily performance trends</div>
            </div>
            <div class="section-content">
                ${generateTimeAnalysisContent(results.timeAnalysis)}
            </div>
        </div>
    `;
}

function generateChannelDeepDivePanel(results) {
    return `
        <div class="panel-section">
            <div class="section-header">
                <div class="section-title">Channel Deep-Dive Analysis</div>
                <div class="section-subtitle">Comprehensive performance metrics by channel</div>
            </div>
            <div class="section-content">
                ${Object.entries(results.channelPerformance || {}).map(([channel, data]) => `
                    <div class="channel-deep-dive" style="background: var(--surface); padding: 2rem; margin-bottom: 2rem; border-radius: 12px; border: 1px solid var(--border);">
                        <h3 style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                            ${channel}
                            <span class="performance-indicator ${parseFloat(data.cac) < 75 ? 'excellent' : parseFloat(data.cac) < 100 ? 'good' : 'poor'}">
                                CAC: $${data.cac}
                            </span>
                        </h3>
                        
                        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">
                            <div class="metric-tile">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${data.customers || 0}</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">Customers</div>
                            </div>
                            <div class="metric-tile">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">$${data.spend?.toFixed(0) || '0'}</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">Total Spend</div>
                            </div>
                            <div class="metric-tile">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${data.impressions?.toLocaleString() || '0'}</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">Impressions</div>
                            </div>
                            <div class="metric-tile">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${data.clicks?.toLocaleString() || '0'}</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">Clicks</div>
                            </div>
                            <div class="metric-tile">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${data.ctr || '0'}%</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">CTR</div>
                            </div>
                            <div class="metric-tile">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${data.cvr || '0'}%</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">CVR</div>
                            </div>
                            <div class="metric-tile">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">$${data.cpc || '0'}</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">CPC</div>
                            </div>
                            <div class="metric-tile">
                                <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${data.roas || '0'}x</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">ROAS</div>
                            </div>
                        </div>
                        
                        <div style="background: var(--background); padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">
                            <strong>Channel Insights:</strong>
                            <ul style="margin-top: 0.5rem; padding-left: 1.5rem; color: var(--text-secondary);">
                                <li>Efficiency Score: ${data.efficiency_score || 'N/A'}/100</li>
                                <li>LTV:CAC Ratio: ${data.ltv_cac_ratio || 'N/A'}:1</li>
                                <li>Average Daily Spend: $${data.avgDailySpend?.toFixed(0) || '0'}</li>
                                <li>Active Days: ${data.days || 0}</li>
                                <li>Campaigns: ${data.campaigns || 0}</li>
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateOptimizationPanel(results) {
    const opportunities = results.opportunities || [];
    return `
        <div class="panel-section">
            <div class="section-header">
                <div class="section-title">Optimization Opportunities</div>
                <div class="section-subtitle">${opportunities.length} actionable opportunities identified</div>
            </div>
            <div class="section-content">
                ${opportunities.length > 0 ? opportunities.map(opp => `
                    <div class="opportunity-card ${opp.priority}">
                        <div class="opportunity-header">
                            <div class="opportunity-title">${opp.issue}</div>
                            <div class="priority-badge ${opp.priority}">${opp.priority} priority</div>
                        </div>
                        <div style="color: var(--text-secondary); margin-bottom: 1rem;">
                            ${opp.recommendation}
                        </div>
                        <div style="background: var(--background); padding: 1rem; border-radius: 6px; border: 1px solid var(--border);">
                            <strong style="color: var(--accent-color);">Expected Impact:</strong> ${opp.impact}
                        </div>
                        ${opp.metrics ? `
                            <div style="margin-top: 1rem; font-size: 0.9rem; color: var(--text-secondary);">
                                <strong>Metrics:</strong> ${JSON.stringify(opp.metrics, null, 2).replace(/[{}",]/g, ' ').replace(/:/g, ': ')}
                            </div>
                        ` : ''}
                    </div>
                `).join('') : `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🎯</div>
                        <h3>No Critical Issues Detected</h3>
                        <p>Your campaigns are performing well! Continue monitoring for new optimization opportunities.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function generateCampaignAnalysisPanel(results) {
    const campaigns = Object.entries(results.campaignAnalysis || {});
    return `
        <div class="panel-section">
            <div class="section-header">
                <div class="section-title">Campaign Performance Analysis</div>
                <div class="section-subtitle">Detailed breakdown by campaign</div>
            </div>
            <div class="section-content">
                <div class="filter-controls">
                    <input type="text" class="filter-input" placeholder="Search campaigns..." onkeyup="filterCampaigns(this.value)">
                    <select class="filter-select" onchange="filterCampaignsByChannel(this.value)">
                        <option value="">All Channels</option>
                        ${[...new Set(campaigns.map(([key, camp]) => camp.channel))].map(channel => 
                            `<option value="${channel}">${channel}</option>`
                        ).join('')}
                    </select>
                </div>
                
                <table class="data-table" id="campaigns-table">
                    <thead>
                        <tr>
                            <th>Campaign</th>
                            <th>Channel</th>
                            <th>CAC</th>
                            <th>Spend</th>
                            <th>Customers</th>
                            <th>ROAS</th>
                            <th>CTR</th>
                            <th>CVR</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${campaigns.map(([key, campaign]) => `
                            <tr class="campaign-row" data-channel="${campaign.channel}">
                                <td><strong>${campaign.campaign}</strong></td>
                                <td>${campaign.channel}</td>
                                <td>$${campaign.cac}</td>
                                <td>$${campaign.spend?.toFixed(0) || '0'}</td>
                                <td>${campaign.customers || '0'}</td>
                                <td>${campaign.roas || '0'}x</td>
                                <td>${campaign.ctr || '0'}%</td>
                                <td>${campaign.cvr || '0'}%</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function generateCreativePanel(results) {
    const creatives = Object.entries(results.creativeAnalysis || {});
    return `
        <div class="panel-section">
            <div class="section-header">
                <div class="section-title">Creative Performance Analysis</div>
                <div class="section-subtitle">Performance breakdown by creative assets</div>
            </div>
            <div class="section-content">
                ${creatives.length > 0 ? `
                    <table class="data-table">
                        <thead>
                            <tr>
                                <th>Creative ID</th>
                                <th>Type</th>
                                <th>CAC</th>
                                <th>Spend</th>
                                <th>Customers</th>
                                <th>CTR</th>
                                <th>Impressions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${creatives.map(([id, creative]) => `
                                <tr>
                                    <td><strong>${creative.creative_id}</strong></td>
                                    <td>${creative.type}</td>
                                    <td>$${creative.cac}</td>
                                    <td>$${creative.spend?.toFixed(0) || '0'}</td>
                                    <td>${creative.customers || '0'}</td>
                                    <td>${creative.ctr || '0'}%</td>
                                    <td>${creative.impressions?.toLocaleString() || '0'}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                ` : `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🎨</div>
                        <h3>No Creative Data Available</h3>
                        <p>Upload data with creative_id and creative_type fields to see creative performance analysis.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function generateCompetitivePanel(results) {
    const insights = Object.entries(results.competitiveInsights || {});
    return `
        <div class="panel-section">
            <div class="section-header">
                <div class="section-title">Competitive Intelligence</div>
                <div class="section-subtitle">Performance vs industry benchmarks</div>
            </div>
            <div class="section-content">
                ${insights.length > 0 ? insights.map(([channel, data]) => `
                    <div style="background: var(--surface); padding: 2rem; margin-bottom: 1.5rem; border-radius: 8px; border: 1px solid var(--border);">
                        <h3 style="margin-bottom: 1rem;">${channel}</h3>
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem;">
                            <div>
                                <h4>CAC Performance</h4>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                                    <span>Your CAC:</span>
                                    <strong>$${data.cac_vs_benchmark?.current || 'N/A'}</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                                    <span>Industry Benchmark:</span>
                                    <span>$${data.cac_vs_benchmark?.benchmark || 'N/A'}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                                    <span>Performance:</span>
                                    <span class="performance-indicator ${data.cac_vs_benchmark?.performance === 'above' ? 'excellent' : 'poor'}">
                                        ${data.cac_vs_benchmark?.performance || 'N/A'} average
                                    </span>
                                </div>
                            </div>
                            <div>
                                <h4>CTR Performance</h4>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                                    <span>Your CTR:</span>
                                    <strong>${data.ctr_vs_benchmark?.current || 'N/A'}%</strong>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                                    <span>Industry Benchmark:</span>
                                    <span>${data.ctr_vs_benchmark?.benchmark || 'N/A'}%</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; align-items: center; margin: 0.5rem 0;">
                                    <span>Performance:</span>
                                    <span class="performance-indicator ${data.ctr_vs_benchmark?.performance === 'above' ? 'excellent' : 'poor'}">
                                        ${data.ctr_vs_benchmark?.performance || 'N/A'} average
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('') : `
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                        <h3>No Benchmark Data Available</h3>
                        <p>Competitive insights will appear here when channel data matches our benchmark database.</p>
                    </div>
                `}
            </div>
        </div>
    `;
}

function generateDataExplorerPanel(results) {
    const marketingData = results.rawData?.marketing || [];
    const revenueData = results.rawData?.revenue || [];
    return `
        <div class="panel-section">
            <div class="section-header">
                <div class="section-title">Raw Data Explorer</div>
                <div class="section-subtitle">Detailed view of all imported data</div>
            </div>
            <div class="section-content">
                <div class="filter-controls">
                    <select class="filter-select" onchange="switchDataView(this.value)">
                        <option value="marketing">Marketing Data (${marketingData.length} rows)</option>
                        ${revenueData.length > 0 ? `<option value="revenue">Revenue Data (${revenueData.length} rows)</option>` : ''}
                    </select>
                    <input type="text" class="filter-input" placeholder="Search data..." onkeyup="filterRawData(this.value)">
                </div>
                
                <div id="marketing-data-view">
                    ${generateRawDataTable(marketingData, 'Marketing Data')}
                </div>
                
                ${revenueData.length > 0 ? `
                    <div id="revenue-data-view" style="display: none;">
                        ${generateRawDataTable(revenueData, 'Revenue Data')}
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function generateRawDataTable(data, title) {
    if (!data || data.length === 0) {
        return `<p style="text-align: center; padding: 2rem; color: var(--text-secondary);">No ${title.toLowerCase()} available</p>`;
    }
    
    const headers = Object.keys(data[0] || {});
    const displayData = data.slice(0, 100); // Limit to first 100 rows for performance
    
    return `
        <div style="overflow-x: auto;">
            <table class="data-table" id="raw-data-table">
                <thead>
                    <tr>
                        ${headers.map(header => `<th>${header}</th>`).join('')}
                    </tr>
                </thead>
                <tbody>
                    ${displayData.map(row => `
                        <tr class="raw-data-row">
                            ${headers.map(header => `<td>${row[header] || ''}</td>`).join('')}
                        </tr>
                    `).join('')}
                </tbody>
            </table>
            ${data.length > 100 ? `<p style="text-align: center; padding: 1rem; color: var(--text-secondary);">Showing first 100 of ${data.length} rows</p>` : ''}
        </div>
    `;
}

function generateTimeAnalysisContent(timeAnalysis) {
    if (!timeAnalysis || !timeAnalysis.daily) {
        return '<p>No time-based data available</p>';
    }
    
    const dailyData = Object.entries(timeAnalysis.daily).slice(0, 10); // Show recent 10 days
    return `
        <table class="data-table">
            <thead>
                <tr>
                    <th>Date</th>
                    <th>Spend</th>
                    <th>Customers</th>
                    <th>Revenue</th>
                    <th>CAC</th>
                </tr>
            </thead>
            <tbody>
                ${dailyData.map(([date, data]) => `
                    <tr>
                        <td><strong>${date}</strong></td>
                        <td>$${data.spend?.toFixed(0) || '0'}</td>
                        <td>${data.customers || '0'}</td>
                        <td>$${data.revenue?.toFixed(0) || '0'}</td>
                        <td>$${data.customers > 0 ? (data.spend / data.customers).toFixed(2) : '0'}</td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
        
        <div style="margin-top: 1rem; padding: 1rem; background: var(--surface); border-radius: 8px;">
            <strong>Trend Analysis:</strong>
            <ul style="margin-top: 0.5rem; padding-left: 1.5rem;">
                <li>CAC Trend: ${timeAnalysis.trends?.cac_trend || 'N/A'}</li>
                <li>Best Performing Day: ${timeAnalysis.bestDay || 'N/A'}</li>
            </ul>
        </div>
    `;
}

// Interactive Functions
function filterCampaigns(searchTerm) {
    const rows = document.querySelectorAll('#campaigns-table .campaign-row');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

function filterCampaignsByChannel(channel) {
    const rows = document.querySelectorAll('#campaigns-table .campaign-row');
    rows.forEach(row => {
        row.style.display = (!channel || row.dataset.channel === channel) ? '' : 'none';
    });
}

function switchDataView(viewType) {
    document.getElementById('marketing-data-view').style.display = viewType === 'marketing' ? 'block' : 'none';
    const revenueView = document.getElementById('revenue-data-view');
    if (revenueView) {
        revenueView.style.display = viewType === 'revenue' ? 'block' : 'none';
    }
}

function filterRawData(searchTerm) {
    const rows = document.querySelectorAll('.raw-data-row');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(searchTerm.toLowerCase()) ? '' : 'none';
    });
}

// Initialize functions
function initializeChannelTabs() {
    console.log('Initializing channel tabs...');
    
    // Generate content for channel upload forms
    const channelUploadContent = document.getElementById('channel-upload-content');
    if (channelUploadContent) {
        channelUploadContent.innerHTML = generateChannelUploadForms();
        
        // Initialize file upload zones after content is created
        setTimeout(() => {
            initializeChannelFileUploads();
        }, 100);
        
        // Show the first channel tab by default
        showChannelTab('google-ads');
    }
}

function generateChannelUploadForms() {
    const channels = [
        { id: 'google-ads', name: 'Google Ads', icon: '🔍', color: '#4285f4' },
        { id: 'facebook', name: 'Facebook/Meta', icon: '📘', color: '#1877f2' },
        { id: 'linkedin', name: 'LinkedIn', icon: '💼', color: '#0a66c2' },
        { id: 'tiktok', name: 'TikTok', icon: '🎵', color: '#000000' },
        { id: 'twitter', name: 'Twitter/X', icon: '🐦', color: '#1da1f2' },
        { id: 'other', name: 'Other Channels', icon: '📊', color: '#6b7280' }
    ];
    
    return channels.map(channel => `
        <div id="form-${channel.id}" class="channel-upload-form" style="display: none;">
            <div class="channel-upload-section">
                <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1.5rem;">
                    <div style="font-size: 2rem;">${channel.icon}</div>
                    <div>
                        <h3 style="margin: 0; color: ${channel.color};">${channel.name}</h3>
                        <p style="margin: 0.25rem 0 0 0; color: var(--text-secondary); font-size: 0.9rem;">Upload your ${channel.name.toLowerCase()} advertising data</p>
                    </div>
                </div>
                
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                    <div class="upload-area">
                        <h4>${channel.icon} Campaign Performance</h4>
                        <div class="file-upload-zone" id="${channel.id}-campaign-upload">
                            <div class="upload-icon">📁</div>
                            <div class="upload-text">Upload campaign data</div>
                            <div class="upload-subtext">Campaigns, ad sets, spend, impressions, clicks</div>
                        </div>
                        <input type="file" id="${channel.id}-campaign-file" accept=".csv,.xlsx,.xls" style="display: none;">
                        <div id="${channel.id}-campaign-preview" class="file-preview" style="display: none;"></div>
                    </div>
                    
                    <div class="upload-area">
                        <h4>🎨 Creative Performance</h4>
                        <div class="file-upload-zone" id="${channel.id}-creative-upload">
                            <div class="upload-icon">🖼️</div>
                            <div class="upload-text">Upload creative data</div>
                            <div class="upload-subtext">Ad creatives, performance by asset</div>
                        </div>
                        <input type="file" id="${channel.id}-creative-file" accept=".csv,.xlsx,.xls" style="display: none;">
                        <div id="${channel.id}-creative-preview" class="file-preview" style="display: none;"></div>
                    </div>
                </div>
                
                <div style="margin-top: 1.5rem; padding: 1rem; background: var(--surface-alt); border-radius: 8px; border: 1px solid var(--border);">
                    <h5 style="margin: 0 0 0.5rem 0; color: var(--text-primary);">📋 Required Fields</h5>
                    <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">Your ${channel.name} data should include: <strong>date, campaign_name, spend, impressions, clicks, conversions</strong></p>
                </div>
            </div>
        </div>
    `).join('');
}

function initializeChannelFileUploads() {
    console.log('Initializing channel file uploads...');
    
    // Get all file upload zones
    const uploadZones = document.querySelectorAll('.file-upload-zone');
    
    uploadZones.forEach(zone => {
        const zoneId = zone.id;
        const inputId = zoneId.replace('-upload', '-file');
        const input = document.getElementById(inputId);
        
        if (input) {
            // Click to upload
            zone.addEventListener('click', () => {
                input.click();
            });
            
            // Drag and drop
            zone.addEventListener('dragover', (e) => {
                e.preventDefault();
                zone.classList.add('dragover');
                zone.style.borderColor = 'var(--primary-color)';
                zone.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
            });
            
            zone.addEventListener('dragleave', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
                zone.style.borderColor = 'var(--border)';
                zone.style.backgroundColor = 'var(--surface)';
            });
            
            zone.addEventListener('drop', (e) => {
                e.preventDefault();
                zone.classList.remove('dragover');
                zone.style.borderColor = 'var(--border)';
                zone.style.backgroundColor = 'var(--surface)';
                
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    input.files = files;
                    handleChannelFileUpload(input);
                }
            });
            
            // File input change
            input.addEventListener('change', () => {
                handleChannelFileUpload(input);
            });
        }
    });
}

function handleChannelFileUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const previewId = input.id.replace('-file', '-preview');
    const preview = document.getElementById(previewId);
    const zone = document.getElementById(input.id.replace('-file', '-upload'));
    
    if (preview && zone) {
        // Update zone to show file selected
        const uploadText = zone.querySelector('.upload-text');
        const uploadSubtext = zone.querySelector('.upload-subtext');
        
        if (uploadText && uploadSubtext) {
            uploadText.textContent = file.name;
            uploadSubtext.textContent = `File selected: ${file.size} bytes`;
            zone.style.borderColor = 'var(--accent-color)';
            zone.style.backgroundColor = 'rgba(34, 197, 94, 0.05)';
        }
        
        // Show preview
        preview.style.display = 'block';
        preview.innerHTML = `
            <div style="padding: 1rem; background: var(--surface-alt); border-radius: 6px; border: 1px solid var(--border); margin-top: 1rem;">
                <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <span style="font-size: 1.2rem;">📄</span>
                    <strong>${file.name}</strong>
                </div>
                <div style="font-size: 0.9rem; color: var(--text-secondary);">
                    Size: ${(file.size / 1024).toFixed(1)} KB | Type: ${file.type || 'Unknown'}
                </div>
                <button class="btn btn-small" onclick="removeChannelFile('${input.id}')" style="margin-top: 0.5rem;">Remove File</button>
            </div>
        `;
        
        // Update analyze button
        updateAnalyzeButton();
        
        showNotification(`File '${file.name}' uploaded successfully`, 'success');
    }
}

function removeChannelFile(inputId) {
    const input = document.getElementById(inputId);
    const previewId = inputId.replace('-file', '-preview');
    const preview = document.getElementById(previewId);
    const zone = document.getElementById(inputId.replace('-file', '-upload'));
    
    if (input) {
        input.value = '';
        
        if (preview) {
            preview.style.display = 'none';
            preview.innerHTML = '';
        }
        
        if (zone) {
            const uploadText = zone.querySelector('.upload-text');
            const uploadSubtext = zone.querySelector('.upload-subtext');
            
            if (uploadText && uploadSubtext) {
                // Reset based on channel type
                if (inputId.includes('campaign')) {
                    uploadText.textContent = 'Upload campaign data';
                    uploadSubtext.textContent = 'Campaigns, ad sets, spend, impressions, clicks';
                } else if (inputId.includes('creative')) {
                    uploadText.textContent = 'Upload creative data';
                    uploadSubtext.textContent = 'Ad creatives, performance by asset';
                }
                
                zone.style.borderColor = 'var(--border)';
                zone.style.backgroundColor = 'var(--surface)';
            }
        }
        
        updateAnalyzeButton();
        showNotification('File removed', 'info');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('CAC Calculator Pro initialized');
    
    try {
        initializeFileUploads();
        updateAnalyzeButton();
        
        if (document.getElementById('channel-upload-content')) {
            console.log('Channel upload content found, initializing tabs...');
            initializeChannelTabs();
        } else {
            console.log('Channel upload content not found');
        }
        
        // Test button functionality
        testButtonFunctionality();
        
    } catch (error) {
        console.error('Error during initialization:', error);
    }
});

// Test function to ensure buttons are working
function testButtonFunctionality() {
    console.log('Testing button functionality...');
    
    // Test channel tabs
    const channelTabs = document.querySelectorAll('.channel-tab');
    console.log('Found', channelTabs.length, 'channel tabs');
    
    channelTabs.forEach((tab, index) => {
        if (tab.onclick) {
            console.log(`Channel tab ${index} has onclick handler`);
        } else {
            console.warn(`Channel tab ${index} missing onclick handler`);
        }
    });
    
    // Test other buttons
    const allButtons = document.querySelectorAll('button[onclick]');
    console.log('Found', allButtons.length, 'buttons with onclick handlers');
}

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('JavaScript Error:', { message, source, lineno, colno, error });
    showNotification('JavaScript error occurred. Check console for details.', 'error');
    return false;
};

// Enhanced notification function with better error handling
function showNotification(message, type = 'info', duration = 3000) {
    console.log('Notification:', type, message);
    
    try {
        // Remove existing notifications
        const existing = document.querySelectorAll('.notification');
        existing.forEach(n => n.remove());
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
            max-width: 400px;
            word-wrap: break-word;
        `;
        
        // Set background color based on type
        switch(type) {
            case 'success': notification.style.background = '#10b981'; break;
            case 'error': notification.style.background = '#ef4444'; break;
            case 'warning': notification.style.background = '#f59e0b'; break;
            default: notification.style.background = '#3b82f6';
        }
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
        
    } catch (error) {
        console.error('Error showing notification:', error);
        // Fallback to alert if notification fails
        alert(`${type.toUpperCase()}: ${message}`);
    }
}