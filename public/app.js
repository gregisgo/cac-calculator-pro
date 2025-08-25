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
    document.querySelectorAll('.channel-tab').forEach(tab => {
        tab.classList.remove('active');
        tab.style.background = 'var(--surface)';
        tab.style.color = 'var(--text-primary)';
    });
    
    const selectedTab = document.getElementById('tab-' + channel);
    if (selectedTab) {
        selectedTab.classList.add('active');
        selectedTab.style.background = 'var(--primary-color)';
        selectedTab.style.color = 'white';
    }
    
    document.querySelectorAll('.channel-upload-form').forEach(form => {
        form.style.display = 'none';
    });
    
    const selectedForm = document.getElementById('form-' + channel);
    if (selectedForm) {
        selectedForm.style.display = 'block';
    }
    
    showNotification('Switched to ' + channel.replace('-', ' ').toUpperCase() + ' upload', 'info');
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
        <div class="analysis-dashboard">
            <div class="dashboard-header">
                <h2>CAC Analysis Results</h2>
                <div class="analysis-summary" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin: 1rem 0;">
                    <div class="metric-card" style="background: var(--surface); padding: 1.5rem; border-radius: 8px; text-align: center;">
                        <div class="metric-value" style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">$${results.blendedCAC || 'N/A'}</div>
                        <div class="metric-label" style="color: var(--text-secondary);">Blended CAC</div>
                    </div>
                    <div class="metric-card" style="background: var(--surface); padding: 1.5rem; border-radius: 8px; text-align: center;">
                        <div class="metric-value" style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">${results.totalCustomers || 'N/A'}</div>
                        <div class="metric-label" style="color: var(--text-secondary);">Total Customers</div>
                    </div>
                    <div class="metric-card" style="background: var(--surface); padding: 1.5rem; border-radius: 8px; text-align: center;">
                        <div class="metric-value" style="font-size: 2rem; font-weight: bold; color: var(--primary-color);">$${results.totalSpend || 'N/A'}</div>
                        <div class="metric-label" style="color: var(--text-secondary);">Total Spend</div>
                    </div>
                </div>
            </div>
            
            <div class="channel-breakdown" style="margin-top: 2rem;">
                <h3>Channel Performance</h3>
                <div class="channels-grid" style="display: grid; gap: 1rem; margin-top: 1rem;">
                    ${Object.entries(results.channelPerformance || {}).map(([channel, data]) => `
                        <div class="channel-result" style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--surface); border-radius: 8px;">
                            <div>
                                <div class="channel-name" style="font-weight: 600;">${channel}</div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">${data.customers} customers from $${data.spend.toFixed(2)}</div>
                            </div>
                            <div class="channel-cac" style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">$${data.cac}</div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <div class="recommendations" style="margin-top: 2rem;">
                <h3>Recommendations</h3>
                ${(results.recommendations || []).map(rec => `
                    <div class="recommendation" style="background: var(--surface); padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid var(--accent-color);">
                        <div style="font-weight: 600;">${rec.title}</div>
                        <div style="color: var(--text-secondary); margin-top: 0.5rem;">${rec.description}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Initialize functions
function initializeChannelTabs() {
    console.log('Channel tabs initialized');
}

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('CAC Calculator Pro initialized');
    initializeFileUploads();
    updateAnalyzeButton();
    
    if (document.getElementById('channel-upload-content')) {
        initializeChannelTabs();
    }
});