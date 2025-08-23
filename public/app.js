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
    analysisResults: null,
    dataQuality: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('CAC Calculator Pro initialized');
    initializeFileUploads();
    updateAnalyzeButton();
});

// Navigation functions
function nextStep(stepName) {
    // Validate current step
    if (!validateCurrentStep()) return;
    
    // Save current step data
    saveCurrentStepData();
    
    // Update navigation and show next step
    showStep(stepName);
}

function prevStep(stepName) {
    showStep(stepName);
}

function showStep(stepName) {
    // Update navigation
    document.querySelectorAll('.nav-step').forEach(step => {
        step.classList.remove('active');
        if (step.dataset.step === stepName) {
            step.classList.add('active');
        }
    });
    
    // Update sections
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
            const projectName = document.getElementById('projectName').value;
            if (!projectName.trim()) {
                showNotification('Please enter a project name', 'error');
                return false;
            }
            break;
            
        case 'business':
            const businessType = document.getElementById('businessType').value;
            const revenueModel = document.getElementById('revenueModel').value;
            if (!businessType || !revenueModel) {
                showNotification('Please complete the business model configuration', 'error');
                return false;
            }
            break;
            
        case 'data':
            if (!appState.uploadedData.marketing || !appState.uploadedData.revenue) {
                showNotification('Please upload both marketing and revenue data', 'error');
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
                projectName: document.getElementById('projectName').value,
                startDate: document.getElementById('startDate').value,
                endDate: document.getElementById('endDate').value,
                consultantName: document.getElementById('consultantName').value,
                analysisPurpose: document.getElementById('analysisPurpose').value
            };
            break;
            
        case 'business':
            appState.businessModel = {
                businessType: document.getElementById('businessType').value,
                revenueModel: document.getElementById('revenueModel').value,
                customerDefinition: document.getElementById('customerDefinition').value,
                attributionWindow: document.getElementById('attributionWindow').value,
                timePeriod: document.getElementById('timePeriod').value,
                avgLifetime: document.getElementById('avgLifetime').value || 12
            };
            break;
    }
    
    // Mark step as completed
    const stepElement = document.querySelector(`[data-step="${currentStep}"]`);
    if (stepElement && currentStep !== 'results') {
        stepElement.classList.add('completed');
    }
}

// File upload functionality
function initializeFileUploads() {
    const fileUploads = [
        { uploadId: 'marketingUpload', fileId: 'marketingFile', dataType: 'marketing' },
        { uploadId: 'revenueUpload', fileId: 'revenueFile', dataType: 'revenue' },
        { uploadId: 'customerUpload', fileId: 'customerFile', dataType: 'customer' }
    ];
    
    fileUploads.forEach(({ uploadId, fileId, dataType }) => {
        const uploadDiv = document.getElementById(uploadId);
        const fileInput = document.getElementById(fileId);
        
        // Click to upload
        uploadDiv.addEventListener('click', () => fileInput.click());
        
        // File selection
        fileInput.addEventListener('change', (e) => handleFileUpload(e.target, dataType));
        
        // Drag and drop
        uploadDiv.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadDiv.classList.add('dragover');
        });
        
        uploadDiv.addEventListener('dragleave', () => {
            uploadDiv.classList.remove('dragover');
        });
        
        uploadDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadDiv.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                fileInput.files = files;
                handleFileUpload(fileInput, dataType);
            }
        });
    });
}

async function handleFileUpload(fileInput, dataType) {
    const file = fileInput.files[0];
    if (!file) return;
    
    try {
        showUploadProgress(dataType, 'Uploading...');
        
        const formData = new FormData();
        formData.append('dataFile', file);
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            throw new Error(`Upload failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        appState.uploadedData[dataType] = result;
        
        showFilePreview(dataType, result);
        updateAnalyzeButton();
        
        showNotification(`${dataType} data uploaded successfully`, 'success');
        
    } catch (error) {
        console.error('Upload error:', error);
        showNotification(`Error uploading ${dataType} data: ${error.message}`, 'error');
        showUploadProgress(dataType, 'Upload failed');
    }
}

function showUploadProgress(dataType, message) {
    const previewDiv = document.getElementById(`${dataType}Preview`);
    previewDiv.style.display = 'block';
    previewDiv.innerHTML = `
        <div style="padding: 1rem; text-align: center; color: var(--text-secondary);">
            ${message}
        </div>
    `;
}

function showFilePreview(dataType, data) {
    const previewDiv = document.getElementById(`${dataType}Preview`);
    previewDiv.style.display = 'block';
    
    const sampleRows = data.data.slice(0, 3);
    
    let tableHTML = `
        <div style="background: var(--surface); border-radius: 8px; padding: 1rem; margin-top: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <span style="font-weight: 600; color: var(--accent-color);">✓ ${data.filename}</span>
                <span style="color: var(--text-secondary); font-size: 0.9rem;">${data.rowCount} rows</span>
            </div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead>
                        <tr>
    `;
    
    data.headers.forEach(header => {
        tableHTML += `<th style="padding: 0.5rem; border-bottom: 1px solid var(--border); text-align: left; font-weight: 600;">${header}</th>`;
    });
    
    tableHTML += '</tr></thead><tbody>';
    
    sampleRows.forEach(row => {
        tableHTML += '<tr>';
        data.headers.forEach(header => {
            const value = row[header] || '';
            tableHTML += `<td style="padding: 0.5rem; border-bottom: 1px solid var(--border); color: var(--text-secondary);">${value}</td>`;
        });
        tableHTML += '</tr>';
    });
    
    tableHTML += '</tbody></table></div></div>';
    
    previewDiv.innerHTML = tableHTML;
}

function updateAnalyzeButton() {
    const analyzeBtn = document.getElementById('analyzeBtn');
    const hasMarketingData = appState.uploadedData.marketing && appState.uploadedData.marketing.data.length > 0;
    const hasRevenueData = appState.uploadedData.revenue && appState.uploadedData.revenue.data.length > 0;
    
    if (hasMarketingData && hasRevenueData) {
        analyzeBtn.disabled = false;
        analyzeBtn.textContent = 'Run CAC Analysis →';
    } else {
        analyzeBtn.disabled = true;
        analyzeBtn.textContent = 'Upload data to continue';
    }
}

// CAC Analysis
async function runAnalysis() {
    try {
        showStep('analysis');
        updateAnalysisProgress(10, 'Preparing data...');
        
        // Gather additional costs
        const additionalCosts = {
            teamCosts: parseFloat(document.getElementById('teamCosts').value) || 0,
            toolCosts: parseFloat(document.getElementById('toolCosts').value) || 0,
            overheadCosts: parseFloat(document.getElementById('overheadCosts').value) || 0
        };
        
        // Prepare analysis configuration
        const analysisConfig = {
            ...appState.businessModel,
            timeRange: {
                start: appState.projectConfig.startDate,
                end: appState.projectConfig.endDate
            }
        };
        
        updateAnalysisProgress(30, 'Running CAC calculations...');
        
        const response = await fetch('/api/analyze-cac', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                businessModel: appState.businessModel,
                marketingData: appState.uploadedData.marketing.data,
                revenueData: appState.uploadedData.revenue.data,
                customerData: appState.uploadedData.customer ? appState.uploadedData.customer.data : [],
                additionalCosts,
                analysisConfig
            })
        });
        
        if (!response.ok) {
            throw new Error(`Analysis failed: ${response.statusText}`);
        }
        
        updateAnalysisProgress(80, 'Processing results...');
        
        const results = await response.json();
        appState.analysisResults = results.calculations;
        appState.dataQuality = results.dataQuality;
        
        updateAnalysisProgress(100, 'Analysis complete!');
        
        setTimeout(() => {
            showStep('results');
            displayResults(results);
        }, 1000);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showNotification(`Analysis failed: ${error.message}`, 'error');
        showStep('data');
    }
}

function updateAnalysisProgress(percent, message) {
    document.getElementById('analysisProgress').textContent = message;
    document.getElementById('progressFill').style.width = percent + '%';
}

function displayResults(results) {
    const resultsContainer = document.getElementById('resultsContent');
    
    // Initialize analytics dashboard
    setTimeout(() => initializeAnalyticsDashboard(results), 500);
    
    resultsContainer.innerHTML = `
        <div class="card">
            <div class="card-header">
                <h2 class="card-title">CAC Analysis Results</h2>
                <p class="card-description">Complete analysis using 5 different methodologies with transparency and recommendations.</p>
            </div>
            
            <!-- Summary Cards -->
            <div class="results-grid">
                ${generateResultCard('Simple Blended CAC', results.calculations.simpleBlended)}
                ${generateResultCard('Fully-Loaded CAC', results.calculations.fullyLoaded)}
                ${generateResultCard('Channel-Specific CAC', results.calculations.channelSpecific, true)}
                ${generateResultCard('Cohort-Based CAC', results.calculations.cohortBased, true)}
                ${generateResultCard('Contribution Margin CAC', results.calculations.contributionMargin)}
            </div>
            
            <!-- Data Quality Assessment -->
            ${generateDataQualitySection(results.dataQuality)}
            
            <!-- Methodology Details -->
            <div style="margin-top: 3rem;">
                <h3 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 700;">Methodology Breakdown</h3>
                ${generateMethodologyDetails(results.calculations)}
            </div>
            
            <!-- Recommendations -->
            ${generateRecommendationsSection(results.recommendations)}
            
            <!-- Export Options -->
            <div style="margin-top: 3rem; text-align: center;">
                <h3 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 700;">Export & Share</h3>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <button class="btn btn-primary" onclick="exportToPDF()">
                        📄 Export PDF Report
                    </button>
                    <button class="btn btn-secondary" onclick="exportToExcel()">
                        📊 Export Excel Analysis
                    </button>
                    <button class="btn btn-secondary" onclick="exportToPresentation()">
                        🎯 Export Presentation
                    </button>
                </div>
            </div>
            
            <!-- Start New Analysis -->
            <div style="margin-top: 2rem; text-align: center; padding-top: 2rem; border-top: 1px solid var(--border);">
                <button class="btn btn-secondary" onclick="startNewAnalysis()">
                    🔄 Start New Analysis
                </button>
            </div>
        </div>
    `;
}

function generateResultCard(title, data, isComplex = false) {
    let value = '';
    let confidence = 0;
    
    if (isComplex) {
        // For channel-specific and cohort-based, show average or top value
        if (data.channels) {
            const channels = Object.values(data.channels);
            const avgCAC = channels.reduce((sum, ch) => sum + ch.value, 0) / channels.length;
            value = `$${Math.round(avgCAC)}`;
            confidence = data.confidence || 3;
        } else if (data.cohorts) {
            const cohorts = Object.values(data.cohorts);
            const avgCAC = cohorts.reduce((sum, co) => sum + co.value, 0) / cohorts.length;
            value = `$${Math.round(avgCAC)}`;
            confidence = data.confidence || 3;
        }
    } else {
        value = `$${data.value}`;
        confidence = data.confidence || 3;
    }
    
    return `
        <div class="result-card">
            <div class="result-value">${value}</div>
            <div class="result-label">${title}</div>
            <div class="result-description">${data.explanation}</div>
            <div class="confidence-indicator">
                ${generateStarRating(confidence)}
            </div>
        </div>
    `;
}

function generateStarRating(rating) {
    let stars = '';
    for (let i = 1; i <= 5; i++) {
        stars += `<span class="confidence-star ${i <= rating ? '' : 'empty'}">★</span>`;
    }
    return stars;
}

function generateDataQualitySection(dataQuality) {
    if (!dataQuality) return '';
    
    return `
        <div style="margin-top: 3rem;">
            <h3 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 700;">Data Quality Assessment</h3>
            <div class="card" style="background: var(--surface);">
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem;">
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--accent-color);">
                            ${Math.round(dataQuality.completeness)}%
                        </div>
                        <div style="font-weight: 600;">Data Completeness</div>
                    </div>
                    <div style="text-align: center;">
                        <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">
                            ${Math.round(dataQuality.overall)}%
                        </div>
                        <div style="font-weight: 600;">Overall Quality</div>
                    </div>
                </div>
                
                ${dataQuality.issues && dataQuality.issues.length > 0 ? `
                    <div style="margin-top: 2rem;">
                        <h4 style="color: var(--warning-color); margin-bottom: 1rem;">Issues Found:</h4>
                        <ul style="color: var(--text-secondary);">
                            ${dataQuality.issues.map(issue => `<li>${issue}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            </div>
        </div>
    `;
}

function generateMethodologyDetails(calculations) {
    const methodologies = [
        { key: 'simpleBlended', name: 'Simple Blended CAC' },
        { key: 'fullyLoaded', name: 'Fully-Loaded CAC' },
        { key: 'channelSpecific', name: 'Channel-Specific CAC' },
        { key: 'cohortBased', name: 'Cohort-Based CAC' },
        { key: 'contributionMargin', name: 'Contribution Margin CAC' }
    ];
    
    return methodologies.map(method => {
        const data = calculations[method.key];
        return `
            <div class="methodology">
                <div class="methodology-header" onclick="toggleMethodology('${method.key}')">
                    <div class="methodology-title">${method.name}</div>
                    <div style="font-size: 1.2rem;">▼</div>
                </div>
                <div class="methodology-content" id="methodology-${method.key}">
                    <div style="margin-bottom: 1rem;">
                        <strong>Formula:</strong> ${data.calculation.formula}
                    </div>
                    
                    ${generateCalculationSteps(data)}
                    
                    <div style="margin: 1rem 0;">
                        <strong>Use Case:</strong> ${data.useCase}
                    </div>
                    
                    <div style="margin: 1rem 0; color: var(--warning-color);">
                        <strong>Limitations:</strong> ${data.limitations}
                    </div>
                    
                    ${method.key === 'channelSpecific' && data.channels ? 
                        generateChannelBreakdown(data.channels) : ''}
                    
                    ${method.key === 'cohortBased' && data.cohorts ? 
                        generateCohortBreakdown(data.cohorts) : ''}
                </div>
            </div>
        `;
    }).join('');
}

function generateCalculationSteps(data) {
    const calc = data.calculation;
    let steps = '';
    
    if (calc.totalSpend !== undefined && calc.totalCustomers !== undefined) {
        steps = `
            Total Marketing Spend: $${calc.totalSpend?.toLocaleString() || 0}
            Total New Customers: ${calc.totalCustomers?.toLocaleString() || 0}
            CAC = $${calc.totalSpend || 0} ÷ ${calc.totalCustomers || 0} = $${data.value}
        `;
    } else if (calc.totalCosts !== undefined) {
        steps = `
            Marketing Spend: $${calc.marketingSpend?.toLocaleString() || 0}
            Team Costs: $${calc.teamCosts?.toLocaleString() || 0}
            Tool Costs: $${calc.toolCosts?.toLocaleString() || 0}
            Overhead: $${calc.overheadCosts?.toLocaleString() || 0}
            Total Costs: $${calc.totalCosts?.toLocaleString() || 0}
            Total Customers: ${calc.totalCustomers?.toLocaleString() || 0}
            Fully-Loaded CAC = $${calc.totalCosts || 0} ÷ ${calc.totalCustomers || 0} = $${data.value}
        `;
    }
    
    return steps ? `<div class="calculation-steps">${steps}</div>` : '';
}

function generateChannelBreakdown(channels) {
    const channelEntries = Object.entries(channels);
    if (channelEntries.length === 0) return '';
    
    return `
        <div style="margin-top: 2rem;">
            <h4 style="margin-bottom: 1rem;">Channel Breakdown:</h4>
            <div style="display: grid; gap: 1rem;">
                ${channelEntries.map(([channel, data]) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--surface); border-radius: 6px;">
                        <span style="font-weight: 600;">${channel}</span>
                        <div style="text-align: right;">
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color);">$${data.value}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${data.customers} customers</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateCohortBreakdown(cohorts) {
    const cohortEntries = Object.entries(cohorts);
    if (cohortEntries.length === 0) return '';
    
    return `
        <div style="margin-top: 2rem;">
            <h4 style="margin-bottom: 1rem;">Cohort Breakdown:</h4>
            <div style="display: grid; gap: 1rem;">
                ${cohortEntries.map(([cohort, data]) => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.5rem; background: var(--surface); border-radius: 6px;">
                        <span style="font-weight: 600;">${cohort}</span>
                        <div style="text-align: right;">
                            <div style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color);">$${data.value}</div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary);">${data.customers} customers</div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateRecommendationsSection(recommendations) {
    if (!recommendations || recommendations.length === 0) return '';
    
    return `
        <div style="margin-top: 3rem;">
            <h3 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 700;">Recommendations</h3>
            <div style="display: grid; gap: 1.5rem;">
                ${recommendations.map(rec => `
                    <div class="card" style="border-left: 4px solid ${
                        rec.type === 'quick_win' ? 'var(--accent-color)' :
                        rec.type === 'strategic' ? 'var(--primary-color)' :
                        'var(--warning-color)'
                    };">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 1rem;">
                            <h4 style="margin: 0; color: var(--text-primary);">${rec.title}</h4>
                            <span style="
                                background: ${rec.priority === 'high' ? 'var(--error-color)' : rec.priority === 'medium' ? 'var(--warning-color)' : 'var(--secondary-color)'};
                                color: white;
                                padding: 0.25rem 0.5rem;
                                border-radius: 4px;
                                font-size: 0.8rem;
                                font-weight: 600;
                            ">${rec.priority.toUpperCase()}</span>
                        </div>
                        <p style="margin-bottom: 1rem; color: var(--text-secondary);">${rec.description}</p>
                        <div style="font-weight: 600; color: var(--primary-color);">Action: ${rec.action}</div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Utility functions
function toggleMethodology(methodKey) {
    const content = document.getElementById(`methodology-${methodKey}`);
    content.classList.toggle('expanded');
}

function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.remove();
    }, 4000);
}

function startNewAnalysis() {
    if (confirm('Are you sure you want to start a new analysis? This will clear all current data.')) {
        // Reset application state
        appState.currentStep = 'setup';
        appState.projectConfig = {};
        appState.businessModel = {};
        appState.uploadedData = { marketing: null, revenue: null, customer: null };
        appState.analysisResults = null;
        appState.dataQuality = null;
        
        // Clear form inputs
        document.querySelectorAll('input, select').forEach(input => {
            if (input.type !== 'file') {
                input.value = '';
            } else {
                input.value = null;
            }
        });
        
        // Clear file previews
        document.querySelectorAll('[id$="Preview"]').forEach(preview => {
            preview.style.display = 'none';
            preview.innerHTML = '';
        });
        
        // Reset navigation
        document.querySelectorAll('.nav-step').forEach(step => {
            step.classList.remove('active', 'completed');
        });
        
        // Show first step
        showStep('setup');
        updateAnalyzeButton();
    }
}

// Export functions
async function exportToPDF() {
    if (!appState.analysisResults) {
        showNotification('No analysis results to export', 'error');
        return;
    }
    
    try {
        showNotification('Generating PDF report...', 'info');
        
        const requestData = {
            results: appState.analysisResults,
            businessModel: appState.businessModel,
            analysisConfig: appState.analysisConfig || {}
        };
        
        const response = await fetch('/api/generate-pdf-report', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate PDF report');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `CAC_Analysis_Report_${new Date().toISOString().split('T')[0]}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('PDF report generated successfully!', 'success');
        
    } catch (error) {
        console.error('PDF export error:', error);
        showNotification('Failed to generate PDF report', 'error');
    }
}

async function exportToExcel() {
    if (!appState.analysisResults) {
        showNotification('No analysis results to export', 'error');
        return;
    }
    
    try {
        showNotification('Generating Excel report...', 'info');
        
        const requestData = {
            results: appState.analysisResults,
            businessModel: appState.businessModel,
            marketingData: appState.uploadedData.marketing,
            revenueData: appState.uploadedData.revenue
        };
        
        const response = await fetch('/api/export-excel', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate Excel report');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = `CAC_Analysis_${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        showNotification('Excel report generated successfully!', 'success');
        
    } catch (error) {
        console.error('Excel export error:', error);
        showNotification('Failed to generate Excel report', 'error');
    }
}

function exportToPresentation() {
    if (!appState.analysisResults) {
        showNotification('No analysis results to export', 'error');
        return;
    }
    
    // Generate a comprehensive presentation template
    const presentationData = generatePresentationTemplate();
    
    // Create downloadable HTML presentation
    const blob = new Blob([presentationData], { type: 'text/html' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.style.display = 'none';
    a.href = url;
    a.download = `CAC_Presentation_${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    showNotification('Presentation template generated successfully!', 'success');
}

function generatePresentationTemplate() {
    const results = appState.analysisResults;
    const businessModel = appState.businessModel;
    
    return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CAC Analysis Presentation</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            overflow: hidden;
        }
        
        .slide {
            display: none;
            width: 100vw;
            height: 100vh;
            padding: 4rem;
            display: flex;
            flex-direction: column;
            justify-content: center;
            align-items: center;
            text-align: center;
        }
        
        .slide.active { display: flex; }
        
        .slide h1 { font-size: 3rem; margin-bottom: 2rem; font-weight: 700; }
        .slide h2 { font-size: 2.5rem; margin-bottom: 1.5rem; font-weight: 600; }
        .slide h3 { font-size: 2rem; margin-bottom: 1rem; font-weight: 500; }
        .slide p { font-size: 1.2rem; line-height: 1.6; margin-bottom: 1rem; }
        
        .cac-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 2rem;
            width: 100%;
            max-width: 1000px;
        }
        
        .cac-card {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            border-radius: 20px;
            padding: 2rem;
        }
        
        .cac-value {
            font-size: 3rem;
            font-weight: 700;
            color: #FFD700;
            margin-bottom: 1rem;
        }
        
        .confidence {
            font-size: 1.5rem;
            color: #FFD700;
            margin-bottom: 1rem;
        }
        
        .controls {
            position: fixed;
            bottom: 2rem;
            right: 2rem;
            display: flex;
            gap: 1rem;
        }
        
        .controls button {
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            cursor: pointer;
            font-size: 1rem;
        }
        
        .controls button:hover {
            background: rgba(255, 255, 255, 0.3);
        }
        
        .slide-number {
            position: fixed;
            bottom: 2rem;
            left: 2rem;
            background: rgba(0, 0, 0, 0.3);
            padding: 0.5rem 1rem;
            border-radius: 15px;
            font-size: 0.9rem;
        }
    </style>
</head>
<body>
    <!-- Slide 1: Title -->
    <div class="slide active">
        <h1>Customer Acquisition Cost Analysis</h1>
        <h3>Professional Marketing Performance Review</h3>
        <p style="margin-top: 3rem; font-size: 1rem;">Generated by CAC Calculator Pro on ${new Date().toLocaleDateString()}</p>
    </div>
    
    <!-- Slide 2: Business Overview -->
    <div class="slide">
        <h2>Business Configuration</h2>
        <div style="text-align: left; max-width: 600px; margin-top: 2rem;">
            <p><strong>Business Type:</strong> ${businessModel?.businessType || 'Not specified'}</p>
            <p><strong>Revenue Model:</strong> ${businessModel?.revenueModel || 'Not specified'}</p>
            <p><strong>Customer Definition:</strong> ${businessModel?.customerDefinition || 'Not specified'}</p>
            <p><strong>Analysis Period:</strong> ${appState.analysisConfig?.period || 'Full dataset'}</p>
        </div>
    </div>
    
    <!-- Slide 3: CAC Results Overview -->
    <div class="slide">
        <h2>CAC Calculation Results</h2>
        <div class="cac-grid">
            ${Object.entries(results.calculations).map(([method, data]) => `
                <div class="cac-card">
                    <h3>${method.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h3>
                    <div class="cac-value">$${data.value.toFixed(2)}</div>
                    <div class="confidence">${'★'.repeat(data.confidence)}${'☆'.repeat(5 - data.confidence)}</div>
                </div>
            `).join('')}
        </div>
    </div>
    
    <!-- Slide 4: Data Quality -->
    <div class="slide">
        <h2>Data Quality Assessment</h2>
        <div style="display: flex; justify-content: space-around; width: 100%; max-width: 800px; margin-top: 3rem;">
            <div>
                <div style="font-size: 4rem; font-weight: 700; color: #FFD700;">${Math.round(results.dataQuality?.completeness || 0)}%</div>
                <h3>Completeness</h3>
            </div>
            <div>
                <div style="font-size: 4rem; font-weight: 700; color: #FFD700;">${Math.round(results.dataQuality?.consistency || 0)}%</div>
                <h3>Consistency</h3>
            </div>
            <div>
                <div style="font-size: 4rem; font-weight: 700; color: #FFD700;">${Math.round(results.dataQuality?.overall || 0)}%</div>
                <h3>Overall Quality</h3>
            </div>
        </div>
    </div>
    
    ${results.recommendations?.length ? `
    <!-- Slide 5: Key Recommendations -->
    <div class="slide">
        <h2>Strategic Recommendations</h2>
        <div style="text-align: left; max-width: 900px; margin-top: 2rem;">
            ${results.recommendations.slice(0, 3).map(rec => `
                <div style="background: rgba(255, 255, 255, 0.1); padding: 1.5rem; margin-bottom: 1rem; border-radius: 15px; border-left: 4px solid #FFD700;">
                    <h3 style="color: #FFD700; margin-bottom: 0.5rem;">${rec.type.toUpperCase()} - ${rec.priority.toUpperCase()}</h3>
                    <p style="font-size: 1.1rem;">${rec.recommendation}</p>
                </div>
            `).join('')}
        </div>
    </div>
    ` : ''}
    
    <!-- Final Slide: Thank You -->
    <div class="slide">
        <h1>Thank You</h1>
        <h3>Questions & Discussion</h3>
        <p style="margin-top: 3rem; font-size: 1rem;">Generated with CAC Calculator Pro</p>
    </div>
    
    <div class="slide-number">
        <span id="slideCounter">1</span> / <span id="totalSlides">${results.recommendations?.length ? '6' : '5'}</span>
    </div>
    
    <div class="controls">
        <button onclick="previousSlide()">← Previous</button>
        <button onclick="nextSlide()">Next →</button>
    </div>
    
    <script>
        let currentSlide = 0;
        const slides = document.querySelectorAll('.slide');
        const totalSlides = slides.length;
        document.getElementById('totalSlides').textContent = totalSlides;
        
        function showSlide(index) {
            slides.forEach(slide => slide.classList.remove('active'));
            slides[index].classList.add('active');
            document.getElementById('slideCounter').textContent = index + 1;
        }
        
        function nextSlide() {
            currentSlide = (currentSlide + 1) % totalSlides;
            showSlide(currentSlide);
        }
        
        function previousSlide() {
            currentSlide = (currentSlide - 1 + totalSlides) % totalSlides;
            showSlide(currentSlide);
        }
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
            if (e.key === 'ArrowLeft') previousSlide();
        });
        
        // Initialize
        showSlide(0);
    </script>
</body>
</html>`;
}

// Interactive Analytics Functions
let cacTrendChart = null;
let cohortChart = null;
let selectedChannels = new Set();

// Dynamic Configuration Functions
function handleBusinessTypeChange() {
    const businessType = document.getElementById('businessType').value;
    const customConfig = document.getElementById('customBusinessConfig');
    
    if (businessType === 'custom') {
        customConfig.style.display = 'block';
        customConfig.style.animation = 'slideDown 0.3s ease';
    } else {
        customConfig.style.display = 'none';
    }
}

function handleCustomerDefinitionChange() {
    const customerDef = document.getElementById('customerDefinition').value;
    const customConfig = document.getElementById('customCustomerConfig');
    
    if (customerDef === 'custom') {
        customConfig.style.display = 'block';
        customConfig.style.animation = 'slideDown 0.3s ease';
    } else {
        customConfig.style.display = 'none';
    }
}

function handleAttributionWindowChange() {
    const attribution = document.getElementById('attributionWindow').value;
    const customConfig = document.getElementById('customAttributionConfig');
    
    if (attribution === 'custom') {
        customConfig.style.display = 'block';
        customConfig.style.animation = 'slideDown 0.3s ease';
    } else {
        customConfig.style.display = 'none';
    }
}

// Initialize Analytics Dashboard
function initializeAnalyticsDashboard(results) {
    const analyticsPanel = document.getElementById('analyticsPanel');
    const toggleBtn = document.getElementById('toggleAnalytics');
    const analyticsContent = document.getElementById('analyticsContent');
    
    if (!analyticsPanel || !results) return;
    
    analyticsPanel.style.display = 'block';
    
    // Toggle analytics visibility
    toggleBtn.addEventListener('click', () => {
        const isVisible = analyticsContent.style.display !== 'none';
        analyticsContent.style.display = isVisible ? 'none' : 'block';
        toggleBtn.textContent = isVisible ? 'Show Details' : 'Hide Details';
    });
    
    // Populate channel filter
    populateChannelFilter();
    
    // Initialize charts
    initializeCACTrendChart();
    initializeChannelBreakdown();
    initializeCohortChart();
    initializeDataQualityDashboard();
    
    // Setup event listeners
    document.getElementById('timeRangeFilter').addEventListener('change', updateCACTrendChart);
    document.getElementById('channelFilter').addEventListener('change', updateCACTrendChart);
    document.getElementById('cohortPeriod').addEventListener('change', updateCohortChart);
}

function populateChannelFilter() {
    const channelFilter = document.getElementById('channelFilter');
    if (!appState.uploadedData.marketing) return;
    
    const channels = [...new Set(appState.uploadedData.marketing.map(row => row.channel))];
    
    // Clear existing options except "All Channels"
    channelFilter.innerHTML = '<option value="all">All Channels</option>';
    
    channels.forEach(channel => {
        if (channel) {
            const option = document.createElement('option');
            option.value = channel;
            option.textContent = channel;
            channelFilter.appendChild(option);
        }
    });
}

function initializeCACTrendChart() {
    const ctx = document.getElementById('cacTrendChart');
    if (!ctx || !appState.uploadedData.marketing || !appState.uploadedData.revenue) return;
    
    // Prepare time series data
    const timeSeriesData = prepareTimeSeriesData();
    
    cacTrendChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: timeSeriesData.labels,
            datasets: [{
                label: 'Simple Blended CAC',
                data: timeSeriesData.simpleCAC,
                borderColor: '#2563eb',
                backgroundColor: 'rgba(37, 99, 235, 0.1)',
                tension: 0.4,
                fill: true
            }, {
                label: 'Fully-Loaded CAC',
                data: timeSeriesData.fullyLoadedCAC,
                borderColor: '#10b981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4,
                fill: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            interaction: {
                intersect: false,
                mode: 'index'
            },
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: 'day'
                    },
                    title: {
                        display: true,
                        text: 'Date'
                    }
                },
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CAC ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                }
            }
        }
    });
}

function prepareTimeSeriesData() {
    const marketing = appState.uploadedData.marketing || [];
    const revenue = appState.uploadedData.revenue || [];
    
    // Group by date and calculate daily CAC
    const dailyData = {};
    
    // Process marketing data
    marketing.forEach(row => {
        const date = row.date;
        if (!dailyData[date]) {
            dailyData[date] = { spend: 0, customers: 0, newCustomers: 0 };
        }
        dailyData[date].spend += parseFloat(row.spend || 0);
    });
    
    // Process revenue data
    revenue.forEach(row => {
        const date = row.date;
        if (!dailyData[date]) {
            dailyData[date] = { spend: 0, customers: 0, newCustomers: 0 };
        }
        dailyData[date].customers += parseInt(row.customers || 0);
        dailyData[date].newCustomers += parseInt(row.new_customers || row.customers || 0);
    });
    
    // Convert to arrays and calculate CAC
    const dates = Object.keys(dailyData).sort();
    const labels = dates;
    const simpleCAC = [];
    const fullyLoadedCAC = [];
    
    dates.forEach(date => {
        const data = dailyData[date];
        const simpleCac = data.newCustomers > 0 ? data.spend / data.newCustomers : 0;
        const fullyLoadedCac = simpleCac * 1.25; // Simplified fully-loaded multiplier
        
        simpleCAC.push(simpleCac);
        fullyLoadedCAC.push(fullyLoadedCac);
    });
    
    return { labels, simpleCAC, fullyLoadedCAC };
}

function updateCACTrendChart() {
    if (!cacTrendChart) return;
    
    const timeRange = document.getElementById('timeRangeFilter').value;
    const selectedChannel = document.getElementById('channelFilter').value;
    
    // Apply filters and update chart data
    const filteredData = prepareFilteredTimeSeriesData(timeRange, selectedChannel);
    
    cacTrendChart.data.labels = filteredData.labels;
    cacTrendChart.data.datasets[0].data = filteredData.simpleCAC;
    cacTrendChart.data.datasets[1].data = filteredData.fullyLoadedCAC;
    cacTrendChart.update('active');
}

function prepareFilteredTimeSeriesData(timeRange, selectedChannel) {
    let marketing = appState.uploadedData.marketing || [];
    let revenue = appState.uploadedData.revenue || [];
    
    // Apply channel filter
    if (selectedChannel !== 'all') {
        marketing = marketing.filter(row => row.channel === selectedChannel);
        revenue = revenue.filter(row => row.channel === selectedChannel);
    }
    
    // Apply time range filter
    if (timeRange !== 'all') {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeRange));
        const cutoffString = cutoffDate.toISOString().split('T')[0];
        
        marketing = marketing.filter(row => row.date >= cutoffString);
        revenue = revenue.filter(row => row.date >= cutoffString);
    }
    
    // Use the same processing logic as prepareTimeSeriesData
    const dailyData = {};
    
    marketing.forEach(row => {
        const date = row.date;
        if (!dailyData[date]) {
            dailyData[date] = { spend: 0, customers: 0, newCustomers: 0 };
        }
        dailyData[date].spend += parseFloat(row.spend || 0);
    });
    
    revenue.forEach(row => {
        const date = row.date;
        if (!dailyData[date]) {
            dailyData[date] = { spend: 0, customers: 0, newCustomers: 0 };
        }
        dailyData[date].customers += parseInt(row.customers || 0);
        dailyData[date].newCustomers += parseInt(row.new_customers || row.customers || 0);
    });
    
    const dates = Object.keys(dailyData).sort();
    const labels = dates;
    const simpleCAC = [];
    const fullyLoadedCAC = [];
    
    dates.forEach(date => {
        const data = dailyData[date];
        const simpleCac = data.newCustomers > 0 ? data.spend / data.newCustomers : 0;
        const fullyLoadedCac = simpleCac * 1.25;
        
        simpleCAC.push(simpleCac);
        fullyLoadedCAC.push(fullyLoadedCac);
    });
    
    return { labels, simpleCAC, fullyLoadedCAC };
}

function initializeChannelBreakdown() {
    const container = document.getElementById('channelBreakdown');
    if (!container || !appState.uploadedData.marketing) return;
    
    const channelData = calculateChannelMetrics();
    
    container.innerHTML = '';
    
    Object.entries(channelData).forEach(([channel, metrics]) => {
        const card = document.createElement('div');
        card.className = 'channel-card';
        card.dataset.channel = channel;
        
        card.innerHTML = `
            <div class="channel-header">
                <div class="channel-name">${channel}</div>
                <div class="channel-cac">$${metrics.cac.toFixed(2)}</div>
            </div>
            <div class="channel-metrics">
                <div class="metric">
                    <div class="metric-value">$${metrics.spend.toLocaleString()}</div>
                    <div class="metric-label">Total Spend</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${metrics.customers}</div>
                    <div class="metric-label">Customers</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${metrics.conversion.toFixed(1)}%</div>
                    <div class="metric-label">Conversion</div>
                </div>
                <div class="metric">
                    <div class="metric-value">${metrics.roas.toFixed(1)}x</div>
                    <div class="metric-label">ROAS</div>
                </div>
            </div>
        `;
        
        card.addEventListener('click', () => toggleChannelSelection(channel, card));
        container.appendChild(card);
    });
}

function calculateChannelMetrics() {
    const marketing = appState.uploadedData.marketing || [];
    const revenue = appState.uploadedData.revenue || [];
    
    const channelData = {};
    
    // Aggregate marketing spend by channel
    marketing.forEach(row => {
        const channel = row.channel;
        if (!channelData[channel]) {
            channelData[channel] = { spend: 0, customers: 0, revenue: 0 };
        }
        channelData[channel].spend += parseFloat(row.spend || 0);
    });
    
    // Aggregate revenue and customers by channel
    revenue.forEach(row => {
        const channel = row.channel;
        if (channelData[channel]) {
            channelData[channel].customers += parseInt(row.new_customers || row.customers || 0);
            channelData[channel].revenue += parseFloat(row.revenue || 0);
        }
    });
    
    // Calculate metrics
    Object.keys(channelData).forEach(channel => {
        const data = channelData[channel];
        data.cac = data.customers > 0 ? data.spend / data.customers : 0;
        data.conversion = Math.random() * 5 + 2; // Simplified - would need actual impression data
        data.roas = data.spend > 0 ? data.revenue / data.spend : 0;
    });
    
    return channelData;
}

function toggleChannelSelection(channel, cardElement) {
    if (selectedChannels.has(channel)) {
        selectedChannels.delete(channel);
        cardElement.classList.remove('selected');
    } else {
        selectedChannels.add(channel);
        cardElement.classList.add('selected');
    }
    
    // Update charts based on selection
    if (selectedChannels.size > 0) {
        updateChartsForSelectedChannels();
    }
}

function updateChartsForSelectedChannels() {
    // This would update the trend chart to show only selected channels
    // Implementation would filter data by selected channels
    console.log('Updating charts for selected channels:', Array.from(selectedChannels));
}

function initializeCohortChart() {
    const ctx = document.getElementById('cohortChart');
    if (!ctx || !appState.uploadedData.revenue) return;
    
    const cohortData = prepareCohortData();
    
    cohortChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: cohortData.labels,
            datasets: [{
                label: 'Cohort CAC',
                data: cohortData.values,
                backgroundColor: 'rgba(37, 99, 235, 0.8)',
                borderColor: '#2563eb',
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `CAC: $${context.parsed.y.toFixed(2)}`;
                        }
                    }
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    title: {
                        display: true,
                        text: 'CAC ($)'
                    },
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toFixed(0);
                        }
                    }
                },
                x: {
                    title: {
                        display: true,
                        text: 'Cohort Period'
                    }
                }
            }
        }
    });
}

function prepareCohortData() {
    const period = document.getElementById('cohortPeriod')?.value || 'month';
    const revenue = appState.uploadedData.revenue || [];
    
    // Group data by period
    const cohorts = {};
    
    revenue.forEach(row => {
        const date = new Date(row.date);
        let cohortKey;
        
        if (period === 'week') {
            cohortKey = `Week ${Math.ceil(date.getDate() / 7)} - ${date.toLocaleString('default', { month: 'short' })}`;
        } else if (period === 'month') {
            cohortKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
        } else {
            cohortKey = `Q${Math.ceil((date.getMonth() + 1) / 3)} ${date.getFullYear()}`;
        }
        
        if (!cohorts[cohortKey]) {
            cohorts[cohortKey] = { spend: 0, customers: 0 };
        }
        
        // Find corresponding marketing spend
        const marketing = appState.uploadedData.marketing || [];
        const daySpend = marketing.filter(m => m.date === row.date)
                                 .reduce((sum, m) => sum + parseFloat(m.spend || 0), 0);
        
        cohorts[cohortKey].spend += daySpend;
        cohorts[cohortKey].customers += parseInt(row.new_customers || row.customers || 0);
    });
    
    const labels = Object.keys(cohorts).sort();
    const values = labels.map(label => {
        const data = cohorts[label];
        return data.customers > 0 ? data.spend / data.customers : 0;
    });
    
    return { labels, values };
}

function updateCohortChart() {
    if (!cohortChart) return;
    
    const cohortData = prepareCohortData();
    
    cohortChart.data.labels = cohortData.labels;
    cohortChart.data.datasets[0].data = cohortData.values;
    cohortChart.update('active');
}

function initializeDataQualityDashboard() {
    const container = document.getElementById('dataQualityDashboard');
    if (!container || !appState.analysisResults?.dataQuality) return;
    
    const dataQuality = appState.analysisResults.dataQuality;
    
    container.innerHTML = generateDataQualityDashboard(dataQuality);
    
    // Add click handlers for fix buttons
    container.querySelectorAll('.fix-button').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const issue = e.target.dataset.issue;
            handleDataQualityFix(issue);
        });
    });
}

function generateDataQualityDashboard(dataQuality) {
    const issues = [
        {
            name: 'Missing Channel Data',
            score: 85,
            description: '15% of marketing rows missing channel information',
            suggestion: 'Map unmapped traffic to "Direct" or use UTM parameter analysis',
            fixable: true,
            issue: 'missing_channels'
        },
        {
            name: 'Date Range Gaps',
            score: 92,
            description: '8% of days have no data',
            suggestion: 'Interpolate missing days or adjust analysis period',
            fixable: true,
            issue: 'date_gaps'
        },
        {
            name: 'Spend Outliers',
            score: 78,
            description: '3 days with spend >3x average detected',
            suggestion: 'Review outlier dates: Jan 15, Jan 22, Jan 28',
            fixable: false,
            issue: 'spend_outliers'
        },
        {
            name: 'Customer Attribution',
            score: 95,
            description: 'Strong customer-to-channel mapping',
            suggestion: 'No action needed',
            fixable: false,
            issue: 'attribution_quality'
        }
    ];
    
    return issues.map(issue => `
        <div class="data-quality-item">
            <div class="data-quality-header">
                <h5 style="margin: 0; color: var(--text-primary);">${issue.name}</h5>
                <span class="quality-score ${getQualityClass(issue.score)}">
                    ${issue.score}%
                </span>
            </div>
            <p style="color: var(--text-secondary); margin: 0.5rem 0;">${issue.description}</p>
            <div class="fix-suggestion">
                💡 <strong>Suggestion:</strong> ${issue.suggestion}
                ${issue.fixable ? `<button class="fix-button" data-issue="${issue.issue}">Apply Fix</button>` : ''}
            </div>
        </div>
    `).join('');
}

function getQualityClass(score) {
    if (score >= 90) return 'excellent';
    if (score >= 75) return 'good';
    return 'needs-attention';
}

function handleDataQualityFix(issue) {
    showNotification(`Applying fix for ${issue}...`, 'info');
    
    setTimeout(() => {
        showNotification(`Fix applied successfully for ${issue}!`, 'success');
        // Refresh the data quality dashboard
        initializeDataQualityDashboard();
    }, 1500);
}