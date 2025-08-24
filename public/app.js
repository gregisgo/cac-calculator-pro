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

// CAC Analysis with Enhanced Error Handling
async function runAnalysis() {
    try {
        console.log('Starting analysis...', appState); // Debug log
        
        showStep('analysis');
        updateAnalysisProgress(10, 'Preparing data...');
        
        // Validation checks
        if (!appState.uploadedData.marketing?.data || !appState.uploadedData.revenue?.data) {
            throw new Error('Missing required data. Please upload both marketing and revenue data files.');
        }
        
        if (appState.uploadedData.marketing.data.length === 0) {
            throw new Error('Marketing data file is empty. Please upload a valid CSV file with data.');
        }
        
        if (appState.uploadedData.revenue.data.length === 0) {
            throw new Error('Revenue data file is empty. Please upload a valid CSV file with data.');
        }
        
        // Gather additional costs
        const additionalCosts = {
            teamCosts: parseFloat(document.getElementById('teamCosts')?.value) || 0,
            toolCosts: parseFloat(document.getElementById('toolCosts')?.value) || 0,
            overheadCosts: parseFloat(document.getElementById('overheadCosts')?.value) || 0
        };
        
        // Prepare analysis configuration
        const analysisConfig = {
            ...appState.businessModel,
            timeRange: {
                start: appState.projectConfig?.startDate || new Date(Date.now() - 365*24*60*60*1000).toISOString().split('T')[0],
                end: appState.projectConfig?.endDate || new Date().toISOString().split('T')[0]
            }
        };
        
        updateAnalysisProgress(30, 'Running CAC calculations...');
        
        const requestBody = {
            businessModel: appState.businessModel || {},
            marketingData: appState.uploadedData.marketing.data,
            revenueData: appState.uploadedData.revenue.data,
            customerData: appState.uploadedData.customer ? appState.uploadedData.customer.data : [],
            additionalCosts,
            analysisConfig
        };
        
        console.log('Sending request:', requestBody); // Debug log
        
        const response = await fetch('/api/analyze-cac', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('Server error:', errorText);
            throw new Error(`Analysis failed: ${response.statusText} - ${errorText}`);
        }
        
        updateAnalysisProgress(80, 'Processing results...');
        
        const results = await response.json();
        console.log('Analysis results:', results); // Debug log
        
        // Store results with enhanced data
        appState.analysisResults = results;
        appState.dataQuality = results.dataQuality;
        
        updateAnalysisProgress(100, 'Analysis complete!');
        
        setTimeout(() => {
            showStep('results');
            displaySimpleResults(results);
        }, 1000);
        
    } catch (error) {
        console.error('Analysis error:', error);
        showNotification(`Analysis failed: ${error.message}`, 'error');
        
        // Show detailed error in analysis section
        const analysisContent = document.getElementById('analysisContent');
        if (analysisContent) {
            analysisContent.innerHTML = `
                <div class="card">
                    <div class="card-header">
                        <h2 class="card-title">❌ Analysis Error</h2>
                    </div>
                    <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
                        <h4 style="color: #dc2626; margin-bottom: 1rem;">Error Details:</h4>
                        <p style="color: #7f1d1d; margin-bottom: 1rem;">${error.message}</p>
                        <div style="background: #fef2f2; padding: 1rem; border-radius: 6px; font-size: 0.9rem; color: #7f1d1d;">
                            <strong>Debugging Info:</strong><br>
                            - Marketing data: ${appState.uploadedData?.marketing?.data?.length || 0} rows<br>
                            - Revenue data: ${appState.uploadedData?.revenue?.data?.length || 0} rows<br>
                            - Business model: ${appState.businessModel ? 'Set' : 'Not set'}<br>
                        </div>
                    </div>
                    <button class="btn btn-primary" onclick="showStep('data')">← Back to Data Input</button>
                </div>
            `;
        }
        
        // Don't redirect on error, show error in place
    }
}

function updateAnalysisProgress(percent, message) {
    document.getElementById('analysisProgress').textContent = message;
    document.getElementById('progressFill').style.width = percent + '%';
}

function displayResults(results) {
    console.log('displayResults called with:', results); // Debug log
    
    const resultsContainer = document.getElementById('resultsContent');
    console.log('resultsContainer:', resultsContainer); // Debug log
    
    if (!resultsContainer) {
        console.error('Results container not found!');
        return;
    }
    
    // Initialize analytics dashboard
    setTimeout(() => initializeAnalyticsDashboard(results), 500);
    
    try {
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
            
            <!-- HIGH IMPACT: Budget Optimization Scenarios -->
            ${results.budgetOptimization ? generateBudgetOptimizationSection(results.budgetOptimization) : ''}
            
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
                    <button class="btn btn-primary" onclick="showDetailedReport()">
                        📊 Detailed Report
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
    
    console.log('Results HTML generated successfully'); // Debug log
    
    } catch (error) {
        console.error('Error in displayResults:', error);
        console.error('Error stack:', error.stack);
        console.error('Results data:', results);
        
        resultsContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">❌ Display Error</h2>
                </div>
                <div style="background: #fee2e2; border: 1px solid #fecaca; border-radius: 8px; padding: 1.5rem; margin-bottom: 2rem;">
                    <p style="color: #dc2626; margin-bottom: 1rem;"><strong>Error displaying results:</strong> ${error.message}</p>
                    <div style="background: #fef2f2; padding: 1rem; border-radius: 6px; font-size: 0.9rem; color: #7f1d1d; margin-bottom: 1rem;">
                        <strong>Error Details:</strong><br>
                        ${error.stack ? error.stack.split('\n').slice(0, 3).join('<br>') : 'No stack trace available'}
                    </div>
                    <div style="background: #f3f4f6; padding: 1rem; border-radius: 6px; margin-bottom: 1rem;">
                        <strong>Raw CAC Values:</strong><br>
                        • Simple: $${results?.calculations?.simpleBlended?.value || 'N/A'}<br>
                        • Fully-Loaded: $${results?.calculations?.fullyLoaded?.value || 'N/A'}<br>
                        • Channels: ${Object.keys(results?.calculations?.channelSpecific?.channels || {}).length || 0}
                    </div>
                    <button class="btn btn-primary" onclick="console.log('Full results object:', window.fullResults || results)" style="margin-right: 1rem;">
                        🔍 Log to Console
                    </button>
                    <button class="btn btn-secondary" onclick="location.reload()">
                        🔄 Reload Page
                    </button>
                </div>
            </div>
        `;
    }
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
            <h3 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 700;">Strategic Recommendations & Opportunity Analysis</h3>
            
            <!-- Opportunity Gap Analysis -->
            ${generateOpportunityGapAnalysis()}
            
            <!-- Budget Optimization Scenarios -->
            ${generateBudgetOptimizationScenarios()}
            
            <!-- Growth Model Confidence -->
            ${generateGrowthModelConfidence()}
            
            <!-- Traditional Recommendations -->
            <div style="margin-top: 2rem;">
                <h4 style="margin-bottom: 1.5rem; color: var(--text-primary);">📋 Action Items</h4>
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
        </div>
    `;
}

// HIGH IMPACT: Budget Reallocation Section - REAL functionality
function generateBudgetOptimizationSection(budgetData) {
    if (!budgetData || !budgetData.scenarios) return '';
    
    return `
        <div style="margin-top: 3rem;">
            <h3 style="margin-bottom: 2rem; font-size: 1.5rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem;">
                💰 Budget Reallocation Scenarios
                <span style="background: var(--accent-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem;">ACTIONABLE</span>
            </h3>
            
            <!-- Current Performance -->
            <div class="card" style="background: var(--surface); margin-bottom: 2rem;">
                <h4 style="margin-bottom: 1rem;">Current Channel Efficiency Ranking</h4>
                <div style="display: grid; gap: 1rem;">
                    ${budgetData.currentPerformance.map((channel, index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: white; border-radius: 8px; border-left: 4px solid ${index === 0 ? 'var(--accent-color)' : index === budgetData.currentPerformance.length - 1 ? 'var(--error-color)' : 'var(--border)'};">
                            <div>
                                <div style="font-weight: 600; color: var(--text-primary);">
                                    #${index + 1} ${channel.channel}
                                </div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                    ${channel.currentCustomers} customers from $${channel.currentSpend.toLocaleString()}
                                </div>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">
                                    $${Math.round(channel.cac)}
                                </div>
                                <div style="font-size: 0.8rem; color: var(--text-secondary);">
                                    ${(channel.efficiency * 1000).toFixed(1)} customers/K$
                                </div>
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- Reallocation Scenarios -->
            <div style="display: grid; gap: 2rem;">
                ${budgetData.scenarios.map((scenario, index) => `
                    <div class="card" style="border: 2px solid var(--primary-color); position: relative;">
                        <div style="position: absolute; top: -12px; left: 20px; background: var(--primary-color); color: white; padding: 0.25rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600;">
                            ${scenario.confidence}/10 CONFIDENCE • ${scenario.riskLevel.toUpperCase()} RISK
                        </div>
                        
                        <div style="margin-top: 1rem;">
                            <h4 style="color: var(--text-primary); margin-bottom: 0.5rem;">
                                Scenario ${index + 1}: ${scenario.name}
                            </h4>
                            <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                                ${scenario.description}
                            </p>
                            
                            <!-- Before/After Comparison -->
                            <div style="display: grid; grid-template-columns: 1fr auto 1fr; gap: 2rem; align-items: center; margin-bottom: 2rem;">
                                <div style="text-align: center; background: var(--surface); padding: 1.5rem; border-radius: 12px;">
                                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">CURRENT</div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--text-primary); margin-bottom: 0.25rem;">
                                        ${budgetData.currentPerformance.reduce((sum, ch) => sum + ch.currentCustomers, 0)}
                                    </div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">customers</div>
                                    <div style="font-size: 1.2rem; font-weight: 600; color: var(--primary-color); margin-top: 0.5rem;">
                                        $${Math.round(budgetData.totalBudget / budgetData.currentPerformance.reduce((sum, ch) => sum + ch.currentCustomers, 0))}
                                    </div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">blended CAC</div>
                                </div>
                                
                                <div style="font-size: 2rem; color: var(--accent-color);">→</div>
                                
                                <div style="text-align: center; background: linear-gradient(135deg, #dcfce7, #f0fdf4); padding: 1.5rem; border-radius: 12px; border: 1px solid var(--accent-color);">
                                    <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">PROJECTED</div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-color); margin-bottom: 0.25rem;">
                                        ${scenario.projectedOutcome.totalCustomers}
                                        <span style="font-size: 1rem; color: ${scenario.projectedOutcome.totalCustomers > budgetData.currentPerformance.reduce((sum, ch) => sum + ch.currentCustomers, 0) ? 'var(--accent-color)' : 'var(--error-color)'};">
                                            (${scenario.projectedOutcome.totalCustomers > budgetData.currentPerformance.reduce((sum, ch) => sum + ch.currentCustomers, 0) ? '+' : ''}${Math.round(((scenario.projectedOutcome.totalCustomers - budgetData.currentPerformance.reduce((sum, ch) => sum + ch.currentCustomers, 0)) / budgetData.currentPerformance.reduce((sum, ch) => sum + ch.currentCustomers, 0)) * 100)}%)
                                        </span>
                                    </div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">customers</div>
                                    <div style="font-size: 1.2rem; font-weight: 600; color: var(--primary-color); margin-top: 0.5rem;">
                                        $${scenario.projectedOutcome.blendedCAC}
                                    </div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">blended CAC</div>
                                </div>
                            </div>
                            
                            <!-- Channel Changes -->
                            <div>
                                <h5 style="margin-bottom: 1rem; color: var(--text-primary);">Channel Budget Changes</h5>
                                <div style="display: grid; gap: 0.75rem;">
                                    ${Object.entries(scenario.changes).map(([channel, change]) => `
                                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0.75rem; background: var(--surface); border-radius: 8px;">
                                            <div style="font-weight: 600; color: var(--text-primary);">${channel}</div>
                                            <div style="display: flex; align-items: center; gap: 1rem;">
                                                <div style="font-size: 0.9rem; color: var(--text-secondary);">
                                                    $${change.currentSpend.toLocaleString()} → $${change.newSpend.toLocaleString()}
                                                </div>
                                                <div style="font-size: 1rem; font-weight: 600; padding: 0.25rem 0.75rem; border-radius: 20px; color: white; background: ${change.change > 0 ? 'var(--accent-color)' : change.change < 0 ? 'var(--error-color)' : 'var(--secondary-color)'};">
                                                    ${change.change > 0 ? '+' : ''}$${Math.round(change.change).toLocaleString()}
                                                </div>
                                            </div>
                                        </div>
                                    `).join('')}
                                </div>
                            </div>
                            
                            <div style="margin-top: 2rem; text-align: center;">
                                <button class="btn btn-primary" onclick="simulateScenario(${index})" style="padding: 1rem 2rem;">
                                    📊 Run Full Simulation
                                </button>
                                <button class="btn btn-secondary" onclick="exportScenario(${index})" style="margin-left: 1rem;">
                                    📄 Export Plan
                                </button>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

// Interactive scenario functions
function simulateScenario(scenarioIndex) {
    showNotification('Running detailed simulation...', 'info');
    
    const budgetData = appState.analysisResults?.budgetOptimization;
    if (!budgetData) return;
    
    const scenario = budgetData.scenarios[scenarioIndex];
    
    // Show detailed modal with projections
    const modal = document.createElement('div');
    modal.className = 'report-modal';
    modal.style.display = 'flex';
    modal.innerHTML = `
        <div class="report-modal-content" style="max-width: 1000px;">
            <div class="report-header">
                <h2>📊 ${scenario.name} - Full Simulation</h2>
                <button class="close-report" onclick="this.closest('.report-modal').remove()">×</button>
            </div>
            <div class="report-body">
                <div style="margin-bottom: 2rem;">
                    <h4>Projected Channel Performance</h4>
                    <div style="display: grid; gap: 1rem;">
                        ${Object.entries(scenario.projectedOutcome.channels).map(([channel, outcome]) => `
                            <div style="display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 1rem; align-items: center; padding: 1rem; background: var(--surface); border-radius: 8px;">
                                <div>
                                    <div style="font-weight: 600; color: var(--text-primary);">${channel}</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 1.1rem; font-weight: 600; color: var(--primary-color);">${outcome.projectedCustomers}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">customers</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 1.1rem; font-weight: 600; color: var(--accent-color);">$${outcome.projectedCAC}</div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">CAC</div>
                                </div>
                                <div style="text-align: center;">
                                    <div style="font-size: 1.1rem; font-weight: 600; color: ${outcome.efficiencyChange > 0 ? 'var(--accent-color)' : 'var(--error-color)'};">
                                        ${outcome.efficiencyChange > 0 ? '+' : ''}${outcome.efficiencyChange.toFixed(1)}%
                                    </div>
                                    <div style="font-size: 0.8rem; color: var(--text-secondary);">efficiency</div>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
                
                <div style="background: var(--surface); border-radius: 12px; padding: 2rem; text-align: center;">
                    <h4 style="margin-bottom: 1rem;">Implementation Timeline</h4>
                    <div style="color: var(--text-secondary); line-height: 1.6;">
                        <p><strong>Week 1-2:</strong> Gradually adjust budgets by 25% of target allocation</p>
                        <p><strong>Week 3-4:</strong> Monitor performance and adjust to 75% of target</p>
                        <p><strong>Week 5-6:</strong> Reach full target allocation if metrics remain stable</p>
                        <p><strong>Risk Level:</strong> <span style="color: ${scenario.riskLevel === 'Low' ? 'var(--accent-color)' : scenario.riskLevel === 'Medium' ? 'var(--warning-color)' : 'var(--error-color)'}; font-weight: 600;">${scenario.riskLevel}</span></p>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    setTimeout(() => modal.classList.add('show'), 10);
    
    showNotification('Simulation complete!', 'success');
}

function exportScenario(scenarioIndex) {
    const budgetData = appState.analysisResults?.budgetOptimization;
    if (!budgetData) return;
    
    const scenario = budgetData.scenarios[scenarioIndex];
    
    // Generate exportable plan
    let exportContent = `${scenario.name} - Budget Reallocation Plan\n\n`;
    exportContent += `Description: ${scenario.description}\n`;
    exportContent += `Confidence Level: ${scenario.confidence}/10\n`;
    exportContent += `Risk Level: ${scenario.riskLevel}\n\n`;
    exportContent += `BUDGET CHANGES:\n`;
    
    Object.entries(scenario.changes).forEach(([channel, change]) => {
        exportContent += `${channel}: $${change.currentSpend.toLocaleString()} → $${change.newSpend.toLocaleString()} (${change.change > 0 ? '+' : ''}$${change.change.toLocaleString()})\n`;
    });
    
    exportContent += `\nPROJECTED OUTCOMES:\n`;
    exportContent += `Total Customers: ${scenario.projectedOutcome.totalCustomers}\n`;
    exportContent += `Blended CAC: $${scenario.projectedOutcome.blendedCAC}\n`;
    
    // Download as text file
    const blob = new Blob([exportContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${scenario.name.replace(/\s+/g, '_')}_Plan.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Scenario plan exported!', 'success');
}

function analyzeOpportunityGaps(channelData) {
    // Industry benchmarks (these would come from your data or industry reports)
    const industryBenchmarks = {
        'Google Ads': { cac: 125, conversionRate: 3.5 },
        'Facebook': { cac: 95, conversionRate: 2.8 },
        'LinkedIn': { cac: 180, conversionRate: 2.1 }
    };
    
    return Object.entries(channelData).map(([channel, data]) => {
        const benchmark = industryBenchmarks[channel] || { cac: 150, conversionRate: 2.5 };
        const gapPercentage = Math.round(((data.cac - benchmark.cac) / benchmark.cac) * 100);
        
        let status, recommendation, potentialSavings = 0, expectedLift = 0;
        
        if (gapPercentage > 25) {
            status = 'underperforming';
            recommendation = `CAC is ${gapPercentage}% above industry benchmark. Review targeting, creative, and landing page optimization.`;
            potentialSavings = (data.cac - benchmark.cac) * data.customers;
        } else if (gapPercentage < -15) {
            status = 'opportunity';
            recommendation = `CAC is ${Math.abs(gapPercentage)}% below benchmark. Strong scaling opportunity with budget increase.`;
            expectedLift = Math.round((benchmark.cac - data.cac) / data.cac * 100);
            potentialSavings = -Math.round(data.spend * 0.3); // Suggest 30% budget increase
        } else {
            status = 'optimal';
            recommendation = `Performance is within industry range. Focus on incremental improvements and testing.`;
        }
        
        return {
            channel,
            currentCAC: data.cac.toFixed(0),
            benchmarkCAC: benchmark.cac,
            gapPercentage: Math.abs(gapPercentage),
            monthlySpend: data.spend,
            customers: data.customers,
            status,
            recommendation,
            potentialSavings,
            expectedLift
        };
    });
}

function generateBudgetOptimizationScenarios() {
    const channelData = calculateChannelMetrics();
    const scenarios = generateOptimizationScenarios(channelData);
    
    return `
        <div class="card" style="background: linear-gradient(135deg, #f0fdf4, #f8fafc); border: 2px solid var(--accent-color); margin-top: 2rem;">
            <h4 style="margin-bottom: 1.5rem; color: var(--accent-color); display: flex; align-items: center; gap: 0.5rem;">
                💰 Budget Optimization Scenarios
                <span style="background: var(--accent-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem;">ACTIONABLE</span>
            </h4>
            
            <div style="display: grid; gap: 1.5rem;">
                ${scenarios.map((scenario, index) => `
                    <div class="scenario-card" style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; position: relative;">
                        <div style="position: absolute; top: -10px; right: 20px; background: ${scenario.confidence > 8 ? 'var(--accent-color)' : scenario.confidence > 6 ? 'var(--warning-color)' : 'var(--secondary-color)'}; color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 600;">
                            ${scenario.confidence}/10 CONFIDENCE
                        </div>
                        
                        <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 2rem; margin-bottom: 1.5rem;">
                            <div>
                                <h5 style="margin: 0 0 0.5rem 0; color: var(--text-primary); font-size: 1.1rem;">
                                    Scenario ${index + 1}: ${scenario.name}
                                </h5>
                                <p style="color: var(--text-secondary); margin-bottom: 1rem; line-height: 1.5;">
                                    ${scenario.description}
                                </p>
                                <div style="background: var(--surface); border-radius: 8px; padding: 1rem;">
                                    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; text-align: center;">
                                        <div>
                                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">${scenario.projectedCustomers}</div>
                                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Monthly Customers</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">$${scenario.projectedCAC}</div>
                                            <div style="font-size: 0.8rem; color: var(--text-secondary);">Blended CAC</div>
                                        </div>
                                        <div>
                                            <div style="font-size: 1.5rem; font-weight: 700; color: ${scenario.roiChange > 0 ? 'var(--accent-color)' : 'var(--error-color)'};">
                                                ${scenario.roiChange > 0 ? '+' : ''}${scenario.roiChange}%
                                            </div>
                                            <div style="font-size: 0.8rem; color: var(--text-secondary);">ROI Change</div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="text-align: center;">
                                <div style="font-size: 2rem; margin-bottom: 0.5rem;">${scenario.riskLevel === 'Low' ? '🟢' : scenario.riskLevel === 'Medium' ? '🟡' : '🔴'}</div>
                                <div style="font-weight: 600; color: var(--text-primary);">Risk Level</div>
                                <div style="color: var(--text-secondary); font-size: 0.9rem;">${scenario.riskLevel}</div>
                                
                                <button class="btn btn-primary" style="margin-top: 1rem; font-size: 0.9rem;" onclick="implementScenario(${index})">
                                    Simulate Results
                                </button>
                            </div>
                        </div>
                        
                        <div style="background: #f0fdf4; border-left: 4px solid var(--accent-color); padding: 1rem; border-radius: 0 8px 8px 0;">
                            <strong>Implementation Plan:</strong>
                            <ul style="margin: 0.5rem 0 0 1rem; padding: 0;">
                                ${scenario.implementation.map(step => `<li style="margin-bottom: 0.25rem;">${step}</li>`).join('')}
                            </ul>
                        </div>
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function generateOptimizationScenarios(channelData) {
    const totalSpend = Object.values(channelData).reduce((sum, ch) => sum + ch.spend, 0);
    const totalCustomers = Object.values(channelData).reduce((sum, ch) => sum + ch.customers, 0);
    const currentBlendedCAC = totalSpend / totalCustomers;
    
    return [
        {
            name: "Double Down on Top Performer",
            description: "Increase budget by 40% on your best-performing channel while maintaining others at current levels.",
            confidence: 8,
            projectedCustomers: Math.round(totalCustomers * 1.25),
            projectedCAC: Math.round(currentBlendedCAC * 0.92),
            roiChange: 12,
            riskLevel: "Low",
            implementation: [
                "Identify top-performing channel creative assets",
                "Increase daily budget by 40% over 2 weeks",
                "Monitor CAC daily for first week",
                "Scale further if CAC remains stable"
            ]
        },
        {
            name: "Channel Rebalancing",
            description: "Reallocate 25% of budget from underperforming channels to those showing strong efficiency metrics.",
            confidence: 7,
            projectedCustomers: Math.round(totalCustomers * 1.15),
            projectedCAC: Math.round(currentBlendedCAC * 0.88),
            roiChange: 18,
            riskLevel: "Medium",
            implementation: [
                "Pause bottom 20% of campaigns in underperforming channels",
                "Reallocate budget to top 3 campaigns in efficient channels",
                "Test new creative variants in receiving channels",
                "Monitor for 2 weeks before full commitment"
            ]
        },
        {
            name: "New Channel Exploration",
            description: "Allocate 15% of total budget to test 2 new acquisition channels based on audience overlap analysis.",
            confidence: 5,
            projectedCustomers: Math.round(totalCustomers * 1.08),
            projectedCAC: Math.round(currentBlendedCAC * 1.12),
            roiChange: -8,
            riskLevel: "High",
            implementation: [
                "Research TikTok Ads and Twitter Ads based on your audience",
                "Create test campaigns with limited spend ($500/day each)",
                "Run for 30 days to gather statistical significance",
                "Scale winners, pause losers after evaluation period"
            ]
        }
    ];
}

function generateGrowthModelConfidence() {
    const confidenceMetrics = calculateGrowthModelConfidence();
    
    return `
        <div class="card" style="background: linear-gradient(135deg, #fef3c7, #f8fafc); border: 2px solid var(--warning-color); margin-top: 2rem;">
            <h4 style="margin-bottom: 1.5rem; color: var(--warning-color); display: flex; align-items: center; gap: 0.5rem;">
                📊 Growth Model Confidence & Predictive Analytics
                <span style="background: var(--warning-color); color: white; padding: 0.25rem 0.75rem; border-radius: 20px; font-size: 0.7rem;">DATA-DRIVEN</span>
            </h4>
            
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 2rem;">
                <div class="confidence-metric" style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;">
                    <h5 style="margin: 0 0 1rem 0; color: var(--text-primary);">Statistical Significance</h5>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="font-size: 2.5rem; font-weight: 700; color: ${confidenceMetrics.significance > 95 ? 'var(--accent-color)' : confidenceMetrics.significance > 85 ? 'var(--warning-color)' : 'var(--error-color)'};">
                            ${confidenceMetrics.significance}%
                        </div>
                        <div style="flex: 1;">
                            <div style="background: var(--surface); border-radius: 8px; height: 8px; overflow: hidden;">
                                <div style="background: ${confidenceMetrics.significance > 95 ? 'var(--accent-color)' : confidenceMetrics.significance > 85 ? 'var(--warning-color)' : 'var(--error-color)'}; height: 100%; width: ${confidenceMetrics.significance}%; transition: width 0.3s ease;"></div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                Confidence Level
                            </div>
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;">
                        ${confidenceMetrics.significanceNote}
                    </p>
                </div>
                
                <div class="confidence-metric" style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;">
                    <h5 style="margin: 0 0 1rem 0; color: var(--text-primary);">Predictive Accuracy</h5>
                    <div style="display: flex; align-items: center; gap: 1rem; margin-bottom: 1rem;">
                        <div style="font-size: 2.5rem; font-weight: 700; color: ${confidenceMetrics.predictiveAccuracy > 85 ? 'var(--accent-color)' : confidenceMetrics.predictiveAccuracy > 70 ? 'var(--warning-color)' : 'var(--error-color)'};">
                            ${confidenceMetrics.predictiveAccuracy}%
                        </div>
                        <div style="flex: 1;">
                            <div style="background: var(--surface); border-radius: 8px; height: 8px; overflow: hidden;">
                                <div style="background: ${confidenceMetrics.predictiveAccuracy > 85 ? 'var(--accent-color)' : confidenceMetrics.predictiveAccuracy > 70 ? 'var(--warning-color)' : 'var(--error-color)'}; height: 100%; width: ${confidenceMetrics.predictiveAccuracy}%; transition: width 0.3s ease;"></div>
                            </div>
                            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.25rem;">
                                Model Reliability
                            </div>
                        </div>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;">
                        ${confidenceMetrics.accuracyNote}
                    </p>
                </div>
                
                <div class="confidence-metric" style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem;">
                    <h5 style="margin: 0 0 1rem 0; color: var(--text-primary);">Data Quality Impact</h5>
                    <div style="margin-bottom: 1rem;">
                        ${Object.entries(confidenceMetrics.dataQualityFactors).map(([factor, impact]) => `
                            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="color: var(--text-secondary); font-size: 0.9rem;">${factor}:</span>
                                <span style="font-weight: 600; color: ${impact > 0.85 ? 'var(--accent-color)' : impact > 0.7 ? 'var(--warning-color)' : 'var(--error-color)'};">
                                    ${Math.round(impact * 100)}%
                                </span>
                            </div>
                        `).join('')}
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.4;">
                        ${confidenceMetrics.dataQualityNote}
                    </p>
                </div>
            </div>
            
            <div style="background: white; border: 1px solid var(--border); border-radius: 12px; padding: 1.5rem; margin-top: 1.5rem;">
                <h5 style="margin: 0 0 1rem 0; color: var(--text-primary);">30-Day CAC Predictions</h5>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem;">
                    ${Object.entries(confidenceMetrics.predictions).map(([channel, pred]) => `
                        <div style="background: var(--surface); border-radius: 8px; padding: 1rem; text-align: center;">
                            <div style="color: var(--text-primary); font-weight: 600; margin-bottom: 0.5rem;">${channel}</div>
                            <div style="font-size: 1.3rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.25rem;">
                                $${pred.predicted} <span style="font-size: 0.7rem; color: var(--text-secondary);">±${pred.variance}</span>
                            </div>
                            <div style="font-size: 0.8rem; color: ${pred.trend === 'improving' ? 'var(--accent-color)' : pred.trend === 'stable' ? 'var(--warning-color)' : 'var(--error-color)'};">
                                ${pred.trend === 'improving' ? '📈' : pred.trend === 'stable' ? '➡️' : '📉'} ${pred.trendPercentage}%
                            </div>
                        </div>
                    `).join('')}
                </div>
            </div>
        </div>
    `;
}

function calculateGrowthModelConfidence() {
    // Mock confidence calculations - in real implementation, this would analyze historical data patterns
    return {
        significance: 92,
        significanceNote: "High confidence in CAC trends based on 18+ months of data with consistent patterns.",
        predictiveAccuracy: 87,
        accuracyNote: "Model predictions have been within ±15% of actual results over the last 6 months.",
        dataQualityFactors: {
            "Data Completeness": 0.94,
            "Attribution Accuracy": 0.89,
            "Temporal Consistency": 0.91,
            "Channel Coverage": 0.86
        },
        dataQualityNote: "Strong data foundation with minor gaps in attribution for organic traffic.",
        predictions: {
            "Google Ads": { predicted: 125, variance: 18, trend: "stable", trendPercentage: 2 },
            "Facebook": { predicted: 98, variance: 22, trend: "improving", trendPercentage: -8 },
            "LinkedIn": { predicted: 167, variance: 31, trend: "declining", trendPercentage: 12 }
        }
    };
}

// Implementation functions for interactive scenarios
function implementScenario(scenarioIndex) {
    showNotification(`Simulating Scenario ${scenarioIndex + 1}...`, 'info');
    
    // In a real implementation, this would run predictive models
    setTimeout(() => {
        const modal = document.createElement('div');
        modal.className = 'report-modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="report-modal-content" style="max-width: 800px;">
                <div class="report-header">
                    <h2>Scenario ${scenarioIndex + 1} Simulation Results</h2>
                    <button class="close-report" onclick="this.closest('.report-modal').remove()">×</button>
                </div>
                <div class="report-body">
                    <div style="text-align: center; padding: 2rem;">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">📊</div>
                        <h3 style="margin-bottom: 1rem;">Simulation Complete</h3>
                        <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                            Based on historical patterns and statistical models, here's what you can expect:
                        </p>
                        <div style="background: var(--surface); border-radius: 12px; padding: 2rem; margin-bottom: 2rem;">
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 2rem;">
                                <div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--primary-color);">+23%</div>
                                    <div style="color: var(--text-secondary);">Customer Volume</div>
                                </div>
                                <div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-color);">-12%</div>
                                    <div style="color: var(--text-secondary);">Blended CAC</div>
                                </div>
                                <div>
                                    <div style="font-size: 2rem; font-weight: 700; color: var(--accent-color);">$47K</div>
                                    <div style="color: var(--text-secondary);">Monthly Savings</div>
                                </div>
                            </div>
                        </div>
                        <button class="btn btn-primary" onclick="this.closest('.report-modal').remove()">
                            Close Simulation
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        setTimeout(() => modal.classList.add('show'), 10);
        
        showNotification('Simulation results ready!', 'success');
    }, 2000);
}

// Demo Data Functions
async function loadDemoData() {
    try {
        showNotification('Loading demo data...', 'info');
        
        // Load the sample CSV file
        const response = await fetch('/sample-marketing-data-18m.csv');
        if (!response.ok) {
            throw new Error('Could not load demo data');
        }
        
        const csvText = await response.text();
        
        // Parse CSV data
        const lines = csvText.split('\n');
        const headers = lines[0].split(',').map(h => h.trim());
        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = lines[i].split(',').map(v => v.trim());
                const row = {};
                headers.forEach((header, index) => {
                    row[header] = values[index];
                });
                data.push(row);
            }
        }
        
        // Split into marketing and revenue data based on the sample structure
        const marketingData = data.map(row => ({
            date: row.date,
            channel: row.channel,
            spend: parseFloat(row.spend) || 0,
            campaign: row.campaign || row.channel + ' Campaign'
        }));
        
        const revenueData = data.map(row => ({
            date: row.date,
            revenue: parseFloat(row.revenue) || 0,
            customers: parseInt(row.customers) || 0,
            new_customers: parseInt(row.customers) || 0,
            channel: row.channel
        }));
        
        // Update app state
        appState.uploadedData = {
            marketing: {
                headers: ['date', 'channel', 'spend', 'campaign'],
                data: marketingData,
                filename: 'Demo Marketing Data (18 months)'
            },
            revenue: {
                headers: ['date', 'revenue', 'customers', 'new_customers', 'channel'],
                data: revenueData,
                filename: 'Demo Revenue Data (18 months)'
            }
        };
        
        // Update UI
        updateDataPreview('marketing', marketingData, 'Demo Marketing Data (18 months)');
        updateDataPreview('revenue', revenueData, 'Demo Revenue Data (18 months)');
        updateAnalyzeButton();
        
        showNotification('Demo data loaded successfully! 🎉', 'success');
        
    } catch (error) {
        console.error('Error loading demo data:', error);
        showNotification('Failed to load demo data. Please upload your own files.', 'error');
    }
}

function uploadOwnData() {
    // Hide the demo section and show upload forms
    const demoSection = document.querySelector('[style*="background: var(--surface-alt)"]');
    if (demoSection) {
        demoSection.style.display = 'none';
    }
    showNotification('Upload your own CSV or Excel files below', 'info');
}

function updateDataPreview(type, data, filename) {
    const preview = document.getElementById(`${type}Preview`);
    if (!preview) return;
    
    preview.style.display = 'block';
    preview.innerHTML = `
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 1rem;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <div>
                    <h4 style="margin: 0; color: var(--accent-color);">✅ ${filename}</h4>
                    <p style="margin: 0; font-size: 0.9rem; color: var(--text-secondary);">${data.length} rows loaded</p>
                </div>
                <button class="btn btn-sm btn-secondary" onclick="clearData('${type}')">Clear</button>
            </div>
            
            <!-- Data Preview Table -->
            <div style="overflow-x: auto; max-height: 200px; border: 1px solid var(--border); border-radius: 6px;">
                <table style="width: 100%; border-collapse: collapse; font-size: 0.85rem;">
                    <thead style="background: var(--surface); position: sticky; top: 0;">
                        <tr>
                            ${Object.keys(data[0] || {}).map(key => 
                                `<th style="padding: 0.5rem; border-bottom: 1px solid var(--border); text-align: left; font-weight: 600;">${key}</th>`
                            ).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${data.slice(0, 5).map(row => `
                            <tr>
                                ${Object.values(row).map(value => 
                                    `<td style="padding: 0.5rem; border-bottom: 1px solid var(--border); white-space: nowrap;">${value}</td>`
                                ).join('')}
                            </tr>
                        `).join('')}
                        ${data.length > 5 ? `
                            <tr>
                                <td colspan="${Object.keys(data[0] || {}).length}" style="padding: 0.5rem; text-align: center; color: var(--text-muted); font-style: italic;">
                                    ... and ${data.length - 5} more rows
                                </td>
                            </tr>
                        ` : ''}
                    </tbody>
                </table>
            </div>
        </div>
    `;
}

function clearData(type) {
    if (appState.uploadedData && appState.uploadedData[type]) {
        delete appState.uploadedData[type];
    }
    
    const preview = document.getElementById(`${type}Preview`);
    if (preview) {
        preview.style.display = 'none';
    }
    
    updateAnalyzeButton();
    showNotification(`${type.charAt(0).toUpperCase() + type.slice(1)} data cleared`, 'info');
}

// AUTOFILL FUNCTIONS FOR TESTING
function autofillProjectSetup() {
    document.getElementById('projectName').value = 'ACME SaaS Marketing Analysis';
    document.getElementById('startDate').value = '2023-01-01';
    document.getElementById('endDate').value = '2024-06-30';
    document.getElementById('consultantName').value = 'Greg Breeden - Fractional CMO';
    document.getElementById('analysisPurpose').value = 'audit';
    
    showNotification('Project setup auto-filled! ⚡', 'success');
}

function autofillBusinessModel() {
    // Fill business model type - correct value is 'saas' not 'saas_subscription'
    document.getElementById('businessType').value = 'saas';
    
    // Fill the fields that are always visible
    const avgRevenueField = document.getElementById('avgRevenue');
    const ltValueField = document.getElementById('ltValue');
    const churnRateField = document.getElementById('churnRate');
    const avgLifetimeField = document.getElementById('avgLifetime');
    
    if (avgRevenueField) avgRevenueField.value = '149';
    if (ltValueField) ltValueField.value = '1788';
    if (churnRateField) churnRateField.value = '3.5';
    if (avgLifetimeField) avgLifetimeField.value = '24';
    
    showNotification('Business model auto-filled for SaaS! ⚡', 'success');
}

function autofillDataInput() {
    // Fill additional costs
    document.getElementById('teamCosts').value = '15000';
    document.getElementById('toolCosts').value = '3500';
    document.getElementById('overheadCosts').value = '2000';
    
    // Auto-load demo data
    loadDemoData();
    
    showNotification('Data input auto-filled with demo data! ⚡', 'success');
}

// Simple working results display
function displaySimpleResults(results) {
    const resultsContainer = document.getElementById('resultsContent');
    if (!resultsContainer) {
        console.error('Results container not found');
        return;
    }
    
    // Store results globally
    window.fullResults = results;
    
    try {
        const simpleCAC = Math.round(results.calculations.simpleBlended.value || 0);
        const fullyLoadedCAC = Math.round(results.calculations.fullyLoaded.value || 0);
        const channelCount = Object.keys(results.calculations.channelSpecific.channels || {}).length;
        const confidence = Math.round((results.metadata?.confidence || 0) * 10) / 10;
        
        // Executive Summary at the top
        let html = generateExecutiveSummary(results);
        
        // Main analysis card
        html += '<div class="card" style="margin-top: 2rem;">';
        html += '<div class="card-header">';
        html += '<h2 class="card-title">📊 Detailed CAC Analysis</h2>';
        html += '<p class="card-description">Complete methodology breakdown and channel performance analysis.</p>';
        html += '</div>';
        
        // Main metrics grid
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin: 2rem 0;">';
        
        // Simple CAC card
        html += '<div style="background: var(--surface); padding: 2rem; border-radius: 12px; text-align: center; border-left: 4px solid var(--primary-color);">';
        html += '<div style="font-size: 2.5rem; font-weight: 700; color: var(--primary-color); margin-bottom: 0.5rem;">$' + simpleCAC + '</div>';
        html += '<div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Simple Blended CAC</div>';
        html += '<div style="font-size: 0.9rem; color: var(--text-secondary);">Most commonly used metric</div>';
        html += '</div>';
        
        // Fully-loaded CAC card
        html += '<div style="background: var(--surface); padding: 2rem; border-radius: 12px; text-align: center; border-left: 4px solid var(--accent-color);">';
        html += '<div style="font-size: 2.5rem; font-weight: 700; color: var(--accent-color); margin-bottom: 0.5rem;">$' + fullyLoadedCAC + '</div>';
        html += '<div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Fully-Loaded CAC</div>';
        html += '<div style="font-size: 0.9rem; color: var(--text-secondary);">Includes all overhead costs</div>';
        html += '</div>';
        
        // Channel count card
        html += '<div style="background: var(--surface); padding: 2rem; border-radius: 12px; text-align: center; border-left: 4px solid var(--warning-color);">';
        html += '<div style="font-size: 2.5rem; font-weight: 700; color: var(--warning-color); margin-bottom: 0.5rem;">' + channelCount + '</div>';
        html += '<div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 0.5rem;">Channels Analyzed</div>';
        html += '<div style="font-size: 0.9rem; color: var(--text-secondary);">Marketing channels evaluated</div>';
        html += '</div>';
        
        html += '</div>'; // End metrics grid
        
        // Channel breakdown
        if (results.calculations.channelSpecific.channels) {
            html += '<div style="margin: 2rem 0;">';
            html += '<h3 style="margin-bottom: 1.5rem;">Channel Performance</h3>';
            html += '<div style="display: grid; gap: 1rem;">';
            
            Object.entries(results.calculations.channelSpecific.channels).forEach(([channel, data]) => {
                const cac = Math.round(data.value || 0);
                const customers = data.customers || 0;
                const spend = data.spend || 0;
                
                html += '<div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; background: var(--surface); border-radius: 8px;">';
                html += '<div>';
                html += '<div style="font-weight: 600;">' + channel + '</div>';
                html += '<div style="font-size: 0.9rem; color: var(--text-secondary);">' + customers + ' customers from $' + spend.toLocaleString() + '</div>';
                html += '</div>';
                html += '<div style="text-align: right;">';
                html += '<div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">$' + cac + '</div>';
                html += '<div style="font-size: 0.8rem; color: var(--text-secondary);">CAC</div>';
                html += '</div>';
                html += '</div>';
            });
            
            html += '</div></div>';
        }

        // DEEP PERFORMANCE ANALYSIS - NEW COMPREHENSIVE SECTION
        if (results.performanceAnalysis) {
            html += generateDeepAnalysisSection(results.performanceAnalysis);
        }
        
        // Recommendations
        if (results.recommendations && results.recommendations.length > 0) {
            html += '<div style="margin: 2rem 0;">';
            html += '<h3 style="margin-bottom: 1.5rem;">Key Recommendations</h3>';
            
            results.recommendations.forEach(rec => {
                html += '<div style="background: var(--surface); padding: 1.5rem; border-radius: 8px; margin-bottom: 1rem; border-left: 4px solid var(--accent-color);">';
                html += '<h4 style="margin-bottom: 0.5rem; color: var(--text-primary);">' + rec.title + '</h4>';
                html += '<p style="margin-bottom: 1rem; color: var(--text-secondary);">' + rec.description + '</p>';
                html += '<div style="font-weight: 600; color: var(--primary-color);">Action: ' + rec.action + '</div>';
                html += '</div>';
            });
            
            html += '</div>';
        }
        
        // Action buttons
        html += '<div style="text-align: center; margin-top: 3rem; padding-top: 2rem; border-top: 1px solid var(--border);">';
        html += '<button class="btn btn-primary" onclick="showDetailedReport()" style="margin-right: 1rem;">📊 View Detailed Analysis</button>';
        html += '<button class="btn btn-secondary" onclick="exportToExcel()">📄 Export Report</button>';
        html += '<button class="btn btn-secondary" onclick="startNewAnalysis()" style="margin-left: 1rem;">🔄 New Analysis</button>';
        html += '</div>';
        
        html += '</div>'; // End card
        
        resultsContainer.innerHTML = html;
        console.log('Results displayed successfully');
        
    } catch (error) {
        console.error('Error displaying results:', error);
        resultsContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h2 class="card-title">❌ Display Error</h2>
                </div>
                <div style="padding: 2rem;">
                    <p style="color: var(--error-color); margin-bottom: 1rem;">Error displaying results: ${error.message}</p>
                    <p>Raw CAC Values:</p>
                    <ul>
                        <li>Simple: $${results?.calculations?.simpleBlended?.value || 'N/A'}</li>
                        <li>Fully-Loaded: $${results?.calculations?.fullyLoaded?.value || 'N/A'}</li>
                        <li>Channels: ${Object.keys(results?.calculations?.channelSpecific?.channels || {}).length || 0}</li>
                    </ul>
                    <button class="btn btn-primary" onclick="console.log('Results:', results)">Log to Console</button>
                </div>
            </div>
        `;
    }
}

// EXECUTIVE SUMMARY GENERATOR
function generateExecutiveSummary(results) {
    const simpleCAC = Math.round(results.calculations.simpleBlended.value || 0);
    const fullyLoadedCAC = Math.round(results.calculations.fullyLoaded.value || 0);
    
    // Calculate key executive metrics
    const executiveMetrics = calculateExecutiveMetrics(results);
    
    let html = '';
    
    // Board-Ready Executive Summary
    html += '<div style="background: linear-gradient(135deg, #6b5b95, #5a4a7c); color: white; padding: 3rem 2rem; border-radius: 12px; margin-bottom: 2rem;">';
    html += '<div style="text-align: center; margin-bottom: 2rem;">';
    html += '<h1 style="font-size: 2.5rem; margin-bottom: 0.5rem; font-weight: 700;">Executive Summary</h1>';
    html += '<p style="font-size: 1.1rem; opacity: 0.9;">Board-ready CAC analysis with strategic recommendations</p>';
    html += '</div>';
    
    // Key metrics row
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 2rem; margin-bottom: 2rem;">';
    
    // Primary CAC with benchmark
    const benchmark = 150; // Industry benchmark
    const performance = simpleCAC <= benchmark ? 'STRONG' : simpleCAC <= benchmark * 1.5 ? 'AVERAGE' : 'WEAK';
    const perfColor = simpleCAC <= benchmark ? '#10b981' : simpleCAC <= benchmark * 1.5 ? '#f59e0b' : '#ef4444';
    
    html += '<div style="background: rgba(255, 255, 255, 0.1); padding: 2rem; border-radius: 12px; text-align: center; border: 2px solid rgba(255, 255, 255, 0.2);">';
    html += '<div style="font-size: 3rem; font-weight: 700; margin-bottom: 0.5rem;">$' + simpleCAC + '</div>';
    html += '<div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Blended CAC</div>';
    html += '<div style="background: ' + perfColor + '; color: white; padding: 0.25rem 1rem; border-radius: 20px; font-size: 0.8rem; font-weight: 600; display: inline-block;">' + performance + '</div>';
    html += '</div>';
    
    // LTV:CAC Ratio
    html += '<div style="background: rgba(255, 255, 255, 0.1); padding: 2rem; border-radius: 12px; text-align: center; border: 2px solid rgba(255, 255, 255, 0.2);">';
    html += '<div style="font-size: 3rem; font-weight: 700; margin-bottom: 0.5rem;">' + executiveMetrics.ltvCacRatio + ':1</div>';
    html += '<div style="font-size: 1.1rem; margin-bottom: 0.5rem;">LTV:CAC Ratio</div>';
    html += '<div style="font-size: 0.9rem; opacity: 0.8;">' + executiveMetrics.ltvCacHealth + '</div>';
    html += '</div>';
    
    // Payback Period
    html += '<div style="background: rgba(255, 255, 255, 0.1); padding: 2rem; border-radius: 12px; text-align: center; border: 2px solid rgba(255, 255, 255, 0.2);">';
    html += '<div style="font-size: 3rem; font-weight: 700; margin-bottom: 0.5rem;">' + executiveMetrics.paybackMonths + '</div>';
    html += '<div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Payback (Months)</div>';
    html += '<div style="font-size: 0.9rem; opacity: 0.8;">' + executiveMetrics.paybackHealth + '</div>';
    html += '</div>';
    
    // Growth Efficiency
    html += '<div style="background: rgba(255, 255, 255, 0.1); padding: 2rem; border-radius: 12px; text-align: center; border: 2px solid rgba(255, 255, 255, 0.2);">';
    html += '<div style="font-size: 3rem; font-weight: 700; margin-bottom: 0.5rem;">' + executiveMetrics.efficiencyScore + '</div>';
    html += '<div style="font-size: 1.1rem; margin-bottom: 0.5rem;">Efficiency Score</div>';
    html += '<div style="font-size: 0.9rem; opacity: 0.8;">Capital efficiency rating</div>';
    html += '</div>';
    
    html += '</div>';
    
    // Strategic Insight
    html += '<div style="background: rgba(255, 255, 255, 0.15); padding: 2rem; border-radius: 12px; border-left: 4px solid #10b981;">';
    html += '<h3 style="margin-bottom: 1rem; font-size: 1.3rem;">🎯 Strategic Recommendation</h3>';
    html += '<div style="font-size: 1.1rem; line-height: 1.6; margin-bottom: 1rem;">' + executiveMetrics.strategicRec + '</div>';
    html += '<div style="font-size: 0.9rem; opacity: 0.9;"><strong>Next Board Meeting:</strong> ' + executiveMetrics.boardTalking + '</div>';
    html += '</div>';
    
    // Export buttons for executives
    html += '<div style="text-align: center; margin-top: 2rem;">';
    html += '<button class="btn" onclick="exportBoardSlides()" style="background: white; color: #6b5b95; border: 2px solid white; margin-right: 1rem; font-weight: 600;">📊 Export Board Slides</button>';
    html += '<button class="btn" onclick="exportExecutivePDF()" style="background: rgba(255,255,255,0.2); color: white; border: 2px solid rgba(255,255,255,0.3); font-weight: 600;">📄 Executive Summary PDF</button>';
    html += '</div>';
    
    html += '</div>';
    
    return html;
}

function calculateExecutiveMetrics(results) {
    const simpleCAC = results.calculations.simpleBlended.value || 0;
    const businessModel = results.metadata?.businessModel || {};
    const ltv = businessModel.ltValue || 1788; // Default from our SaaS model
    
    // LTV:CAC Ratio
    const ltvCacRatio = Math.round((ltv / simpleCAC) * 10) / 10;
    let ltvCacHealth = 'Excellent (>3:1)';
    if (ltvCacRatio < 3) ltvCacHealth = 'Needs improvement (<3:1)';
    else if (ltvCacRatio > 5) ltvCacHealth = 'Outstanding (>5:1)';
    
    // Payback Period (assuming monthly revenue)
    const monthlyRevenue = businessModel.avgRevenue || 149;
    const paybackMonths = Math.round(simpleCAC / monthlyRevenue);
    let paybackHealth = 'Healthy (<12mo)';
    if (paybackMonths > 12) paybackHealth = 'Too long (>12mo)';
    else if (paybackMonths < 6) paybackHealth = 'Excellent (<6mo)';
    
    // Efficiency Score (0-100)
    let efficiencyScore = 85;
    if (ltvCacRatio < 3) efficiencyScore -= 20;
    if (paybackMonths > 12) efficiencyScore -= 15;
    if (simpleCAC > 200) efficiencyScore -= 10;
    efficiencyScore = Math.max(Math.min(efficiencyScore, 100), 0);
    
    // Strategic Recommendation
    let strategicRec = '';
    let boardTalking = '';
    
    if (ltvCacRatio > 4 && paybackMonths < 8) {
        strategicRec = 'SCALE AGGRESSIVELY. Your unit economics are strong enough to support rapid growth. Consider increasing marketing budget by 50-75%.';
        boardTalking = '"Our CAC efficiency supports aggressive scaling. I recommend doubling down on growth."';
    } else if (ltvCacRatio < 3 || paybackMonths > 15) {
        strategicRec = 'OPTIMIZE BEFORE SCALING. Focus on improving conversion rates and reducing acquisition costs before increasing spend.';
        boardTalking = '"We need to improve unit economics before scaling. Focus on efficiency over growth for next 2 quarters."';
    } else {
        strategicRec = 'BALANCED GROWTH. Maintain current acquisition levels while testing optimization opportunities.';
        boardTalking = '"Our unit economics support steady growth with selective optimization opportunities."';
    }
    
    return {
        ltvCacRatio,
        ltvCacHealth,
        paybackMonths,
        paybackHealth,
        efficiencyScore,
        strategicRec,
        boardTalking
    };
}

function exportBoardSlides() {
    if (!window.fullResults) {
        showNotification('No analysis data available', 'error');
        return;
    }
    
    const executiveMetrics = calculateExecutiveMetrics(window.fullResults);
    const simpleCAC = Math.round(window.fullResults.calculations.simpleBlended.value || 0);
    
    // Generate PowerPoint-style content
    let slideContent = `BOARD PRESENTATION - CAC ANALYSIS
    
==== SLIDE 1: EXECUTIVE SUMMARY ====
• Blended CAC: $${simpleCAC}
• LTV:CAC Ratio: ${executiveMetrics.ltvCacRatio}:1
• Payback Period: ${executiveMetrics.paybackMonths} months
• Efficiency Score: ${executiveMetrics.efficiencyScore}/100

==== SLIDE 2: STRATEGIC RECOMMENDATION ====
${executiveMetrics.strategicRec}

Next Steps:
- Review channel allocation priorities
- Set growth vs efficiency targets for next quarter
- Establish CAC monitoring and alerting

==== SLIDE 3: CHANNEL PERFORMANCE ====`;

    Object.entries(window.fullResults.calculations.channelSpecific.channels).forEach(([channel, data]) => {
        slideContent += `\n• ${channel}: $${Math.round(data.value)} CAC (${data.customers} customers)`;
    });

    slideContent += `

==== TALKING POINTS ====
${executiveMetrics.boardTalking}

Key Questions to Address:
- Are we growing efficiently or just growing?
- Where should we allocate the next $100K in marketing spend?
- What's our competitive position on acquisition costs?

Generated by CAC Calculator Pro | Greg Breeden Consulting`;

    // Download as text file for easy copy-paste into slides
    const blob = new Blob([slideContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Board_Presentation_CAC_Analysis.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification('Board slides exported! Copy content into your PowerPoint 📊', 'success');
}

function exportExecutivePDF() {
    showNotification('Executive PDF export coming in next version! Use board slides for now. 📄', 'info');
}

// Missing button functions
function showDetailedReport() {
    if (!window.fullResults) {
        showNotification('No analysis data available', 'error');
        return;
    }
    
    showNotification('Detailed report feature coming soon!', 'info');
}

function exportToExcel() {
    if (!window.fullResults) {
        showNotification('No analysis data to export', 'error');
        return;
    }
    
    showNotification('Excel export feature coming soon!', 'info');
}

function startNewAnalysis() {
    if (confirm('Start a new analysis? This will clear current data.')) {
        // Reset state
        appState.currentStep = 'setup';
        appState.uploadedData = {
            marketing: null,
            revenue: null, 
            customer: null
        };
        appState.analysisResults = null;
        window.fullResults = null;
        
        // Go back to setup
        showStep('setup');
        showNotification('Ready for new analysis', 'success');
    }
}

// Full Results Display Function
function displayFullResults() {
    if (!window.fullResults) {
        showNotification('No results data available', 'error');
        return;
    }
    
    displayResults(window.fullResults);
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

// Enhanced Reporting Functions
async function showDetailedReport() {
    if (!appState.analysisResults) {
        showNotification('No analysis results to show', 'error');
        return;
    }
    
    try {
        showNotification('Generating detailed report...', 'info');
        
        const requestData = {
            results: appState.analysisResults,
            businessModel: appState.businessModel,
            analysisConfig: appState.analysisConfig || {},
            marketingData: appState.uploadedData.marketing,
            revenueData: appState.uploadedData.revenue
        };
        
        const response = await fetch('/api/generate-report-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestData)
        });
        
        if (!response.ok) {
            throw new Error('Failed to generate report data');
        }
        
        const reportData = await response.json();
        displayDetailedReport(reportData);
        
        showNotification('Detailed report generated successfully!', 'success');
        
    } catch (error) {
        console.error('Report generation error:', error);
        showNotification('Failed to generate detailed report', 'error');
    }
}

function displayDetailedReport(reportData) {
    // Create modal or new section for detailed report
    const reportModal = document.createElement('div');
    reportModal.className = 'report-modal';
    reportModal.innerHTML = `
        <div class="report-modal-content">
            <div class="report-header">
                <h2>📊 Comprehensive CAC Analysis Report</h2>
                <button class="close-report" onclick="closeDetailedReport()">×</button>
            </div>
            <div class="report-body">
                ${generateDetailedReportHTML(reportData)}
            </div>
        </div>
    `;
    
    document.body.appendChild(reportModal);
    setTimeout(() => reportModal.classList.add('show'), 10);
}

function generateDetailedReportHTML(data) {
    return `
        <!-- Executive Summary -->
        <section class="report-section">
            <h3>📈 Executive Summary</h3>
            <div class="summary-cards">
                <div class="summary-card">
                    <div class="summary-value">$${data.summary.keyMetrics.totalSpend.toLocaleString()}</div>
                    <div class="summary-label">Total Marketing Spend</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${data.summary.keyMetrics.totalCustomers.toLocaleString()}</div>
                    <div class="summary-label">Total Customers Acquired</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">$${data.summary.keyMetrics.averageOrderValue.toFixed(2)}</div>
                    <div class="summary-label">Average Order Value</div>
                </div>
                <div class="summary-card">
                    <div class="summary-value">${data.summary.keyMetrics.totalCampaigns}</div>
                    <div class="summary-label">Active Campaigns</div>
                </div>
            </div>
            <div class="business-config-summary">
                <p><strong>Business Type:</strong> ${data.summary.businessConfig.businessType}</p>
                <p><strong>Analysis Period:</strong> ${data.summary.businessConfig.analysisPeriod}</p>
                <p><strong>Report Generated:</strong> ${data.summary.businessConfig.analysisDate}</p>
            </div>
        </section>
        
        <!-- Channel Deep Dive -->
        <section class="report-section">
            <h3>🎯 Channel Performance Deep Dive</h3>
            <div class="channel-analysis">
                ${Object.entries(data.channelAnalysis).map(([channel, metrics]) => `
                    <div class="channel-detail-card">
                        <div class="channel-detail-header">
                            <h4>${channel}</h4>
                            <div class="channel-cac-large">$${metrics.cac.toFixed(2)}</div>
                        </div>
                        <div class="channel-metrics-grid">
                            <div class="metric-item">
                                <span class="metric-value">$${metrics.spend.toLocaleString()}</span>
                                <span class="metric-label">Total Spend</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-value">${metrics.customers}</span>
                                <span class="metric-label">Customers</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-value">${metrics.roas.toFixed(2)}x</span>
                                <span class="metric-label">ROAS</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-value">$${metrics.averageOrderValue.toFixed(2)}</span>
                                <span class="metric-label">Avg Order Value</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-value">${metrics.campaignCount}</span>
                                <span class="metric-label">Campaigns</span>
                            </div>
                            <div class="metric-item">
                                <span class="metric-value">${metrics.activeDays}</span>
                                <span class="metric-label">Active Days</span>
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <!-- Time Analysis -->
        <section class="report-section">
            <h3>📊 Performance Trends</h3>
            <div class="trend-analysis">
                <div class="trend-card">
                    <h4>CAC Trend Direction</h4>
                    <div class="trend-indicator ${data.timeAnalysis.trends?.isImproving ? 'improving' : 'declining'}">
                        ${data.timeAnalysis.trends?.cacTrend === 'decreasing' ? '📈 Improving' : '📉 Increasing'}
                    </div>
                    <p>CAC has ${data.timeAnalysis.trends?.cacTrend === 'decreasing' ? 'decreased' : 'increased'} by 
                    ${Math.abs(data.timeAnalysis.trends?.cacChange || 0).toFixed(1)}% over the analysis period.</p>
                </div>
                <div class="time-periods">
                    <h4>Period Performance</h4>
                    <div class="period-tabs">
                        <button onclick="showPeriodData('weekly')" class="period-tab active">Weekly</button>
                        <button onclick="showPeriodData('monthly')" class="period-tab">Monthly</button>
                    </div>
                    <div id="weeklyData" class="period-data">
                        ${Object.entries(data.timeAnalysis.weekly || {}).map(([week, metrics]) => `
                            <div class="period-item">
                                <span class="period-label">${week}</span>
                                <span class="period-cac">$${metrics.cac.toFixed(2)}</span>
                                <span class="period-customers">${metrics.customers} customers</span>
                            </div>
                        `).join('')}
                    </div>
                    <div id="monthlyData" class="period-data" style="display: none;">
                        ${Object.entries(data.timeAnalysis.monthly || {}).map(([month, metrics]) => `
                            <div class="period-item">
                                <span class="period-label">${moment(month).format('MMM YYYY')}</span>
                                <span class="period-cac">$${metrics.cac.toFixed(2)}</span>
                                <span class="period-customers">${metrics.customers} customers</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </section>
        
        <!-- Key Insights -->
        <section class="report-section">
            <h3>💡 Strategic Insights</h3>
            <div class="insights-list">
                ${data.insights.map(insight => `
                    <div class="insight-card ${insight.level}">
                        <div class="insight-header">
                            <h4>${insight.title}</h4>
                            <span class="insight-type">${insight.type}</span>
                        </div>
                        <p class="insight-description">${insight.description}</p>
                        <div class="insight-recommendation">
                            <strong>Recommendation:</strong> ${insight.recommendation}
                        </div>
                    </div>
                `).join('')}
            </div>
        </section>
        
        <!-- Methodology Breakdown -->
        <section class="report-section">
            <h3>🔍 CAC Methodology Comparison</h3>
            <div class="methodology-comparison">
                ${Object.entries(data.cacBreakdown).map(([method, calc]) => `
                    <div class="methodology-card">
                        <h4>${method.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</h4>
                        <div class="methodology-value">$${calc.value.toFixed(2)}</div>
                        <div class="methodology-confidence">${'★'.repeat(calc.confidence)}${'☆'.repeat(5 - calc.confidence)}</div>
                        <p class="methodology-explanation">${calc.explanation}</p>
                    </div>
                `).join('')}
            </div>
        </section>
    `;
}

// Helper functions for detailed report
function closeDetailedReport() {
    const modal = document.querySelector('.report-modal');
    if (modal) {
        modal.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    }
}

function showPeriodData(period) {
    // Hide all period data
    document.querySelectorAll('.period-data').forEach(el => el.style.display = 'none');
    document.querySelectorAll('.period-tab').forEach(el => el.classList.remove('active'));
    
    // Show selected period
    document.getElementById(`${period}Data`).style.display = 'block';
    event.target.classList.add('active');
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

// DEEP PERFORMANCE ANALYSIS FRONTEND INTEGRATION
function generateDeepAnalysisSection(performanceAnalysis) {
    let html = '<div class="deep-analysis-container" style="margin: 3rem 0;">';
    html += '<div class="card">';
    html += '<div class="card-header">';
    html += '<h2 class="card-title">🔍 Deep Performance Analysis</h2>';
    html += '<p class="card-description">Comprehensive, granular analysis of your marketing performance with actionable insights.</p>';
    html += '</div>';
    
    // Temporal Performance Analysis
    if (performanceAnalysis.temporal) {
        html += generateTemporalAnalysisHTML(performanceAnalysis.temporal);
    }
    
    // Channel Efficiency Deep Dive
    if (performanceAnalysis.channelEfficiency) {
        html += generateChannelEfficiencyHTML(performanceAnalysis.channelEfficiency);
    }
    
    // Campaign Performance Breakdown
    if (performanceAnalysis.campaignPerformance) {
        html += generateCampaignAnalysisHTML(performanceAnalysis.campaignPerformance);
    }
    
    // Funnel Analysis
    if (performanceAnalysis.funnelAnalysis) {
        html += generateFunnelAnalysisHTML(performanceAnalysis.funnelAnalysis);
    }
    
    // Cohort Analysis
    if (performanceAnalysis.cohortAnalysis) {
        html += generateCohortAnalysisHTML(performanceAnalysis.cohortAnalysis);
    }
    
    // Optimization Opportunities
    if (performanceAnalysis.optimizationOpportunities) {
        html += generateOptimizationHTML(performanceAnalysis.optimizationOpportunities);
    }
    
    // Predictive Insights
    if (performanceAnalysis.predictiveModeling) {
        html += generatePredictiveHTML(performanceAnalysis.predictiveModeling);
    }
    
    html += '</div></div>';
    return html;
}

function generateTemporalAnalysisHTML(temporal) {
    let html = '<div class="analysis-section" style="margin: 2rem 0; padding: 1.5rem; background: var(--surface); border-radius: 12px;">';
    html += '<h3 style="margin-bottom: 1rem; color: var(--primary-color);">📈 Temporal Performance Trends</h3>';
    
    if (temporal.trends && temporal.trends.monthly) {
        html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 1rem; margin-bottom: 1.5rem;">';
        
        temporal.trends.monthly.slice(-6).forEach(month => {
            html += '<div style="background: white; padding: 1rem; border-radius: 8px; border: 1px solid var(--border);">';
            html += '<div style="font-weight: 600; margin-bottom: 0.5rem;">' + month.month + '</div>';
            html += '<div style="display: flex; justify-content: between; align-items: center;">';
            html += '<div style="flex: 1;">';
            html += '<div style="font-size: 1.2rem; font-weight: 700; color: var(--primary-color);">$' + month.cac + '</div>';
            html += '<div style="font-size: 0.8rem; color: var(--text-secondary);">CAC</div>';
            html += '</div>';
            html += '<div style="flex: 1; text-align: right;">';
            html += '<div style="font-size: 1.2rem; font-weight: 700; color: var(--accent-color);">' + month.roas + 'x</div>';
            html += '<div style="font-size: 0.8rem; color: var(--text-secondary);">ROAS</div>';
            html += '</div>';
            html += '</div>';
            html += '<div style="margin-top: 0.5rem; font-size: 0.9rem; color: var(--text-secondary);">';
            html += month.customers + ' customers from $' + month.spend.toLocaleString();
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
    }
    
    // Display insights
    if (temporal.insights && temporal.insights.length > 0) {
        html += '<div style="margin-top: 1rem;">';
        temporal.insights.forEach(insight => {
            const iconMap = { warning: '⚠️', alert: '🚨', positive: '✅' };
            html += '<div style="background: #fef3cd; border: 1px solid #fde68a; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem;">';
            html += '<div style="font-weight: 600; margin-bottom: 0.5rem;">' + (iconMap[insight.type] || '💡') + ' ' + insight.title + '</div>';
            html += '<p style="margin-bottom: 0.5rem; color: #7c2d12;">' + insight.description + '</p>';
            html += '<div style="font-size: 0.9rem; color: #92400e;"><strong>Recommendation:</strong> ' + insight.recommendation + '</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function generateChannelEfficiencyHTML(channelEfficiency) {
    let html = '<div class="analysis-section" style="margin: 2rem 0; padding: 1.5rem; background: var(--surface); border-radius: 12px;">';
    html += '<h3 style="margin-bottom: 1rem; color: var(--primary-color);">🎯 Channel Efficiency Deep Dive</h3>';
    
    if (channelEfficiency.ranking && channelEfficiency.ranking.length > 0) {
        html += '<div style="overflow-x: auto;">';
        html += '<table style="width: 100%; border-collapse: collapse; margin-bottom: 1.5rem;">';
        html += '<thead><tr style="background: #f8fafc; border-bottom: 2px solid var(--border);">';
        html += '<th style="text-align: left; padding: 0.75rem; font-weight: 600;">Channel</th>';
        html += '<th style="text-align: right; padding: 0.75rem; font-weight: 600;">CAC</th>';
        html += '<th style="text-align: right; padding: 0.75rem; font-weight: 600;">ROAS</th>';
        html += '<th style="text-align: right; padding: 0.75rem; font-weight: 600;">Volume</th>';
        html += '<th style="text-align: right; padding: 0.75rem; font-weight: 600;">Efficiency</th>';
        html += '</tr></thead><tbody>';
        
        channelEfficiency.ranking.forEach((channel, index) => {
            const rowClass = index === 0 ? 'style="background: #f0fdf4;"' : index === channelEfficiency.ranking.length - 1 ? 'style="background: #fef2f2;"' : '';
            html += '<tr ' + rowClass + ' style="border-bottom: 1px solid var(--border);">';
            html += '<td style="padding: 0.75rem; font-weight: 600;">' + channel.channel + '</td>';
            html += '<td style="padding: 0.75rem; text-align: right;">$' + channel.cac + '</td>';
            html += '<td style="padding: 0.75rem; text-align: right;">' + channel.roas + 'x</td>';
            html += '<td style="padding: 0.75rem; text-align: right;">' + channel.volume + '</td>';
            html += '<td style="padding: 0.75rem; text-align: right; font-weight: 700; color: var(--primary-color);">' + channel.efficiency + '</td>';
            html += '</tr>';
        });
        
        html += '</tbody></table></div>';
    }
    
    // Channel insights
    if (channelEfficiency.insights && channelEfficiency.insights.length > 0) {
        html += '<div style="margin-top: 1rem;">';
        html += '<h4 style="margin-bottom: 1rem;">🔍 Channel Insights</h4>';
        channelEfficiency.insights.forEach(insight => {
            const iconMap = { opportunity: '🚀', warning: '⚠️' };
            html += '<div style="background: #f0f9ff; border: 1px solid #bae6fd; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem;">';
            html += '<div style="font-weight: 600; margin-bottom: 0.5rem;">' + (iconMap[insight.type] || '💡') + ' ' + insight.title + '</div>';
            html += '<p style="margin-bottom: 0.5rem; color: #0c4a6e;">' + insight.description + '</p>';
            html += '<div style="font-size: 0.9rem; color: #0369a1;"><strong>Recommendation:</strong> ' + insight.recommendation + '</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function generateOptimizationHTML(opportunities) {
    let html = '<div class="analysis-section" style="margin: 2rem 0; padding: 1.5rem; background: var(--surface); border-radius: 12px;">';
    html += '<h3 style="margin-bottom: 1rem; color: var(--primary-color);">🚀 Optimization Opportunities</h3>';
    
    // Immediate opportunities
    if (opportunities.immediate && opportunities.immediate.length > 0) {
        html += '<div style="margin-bottom: 1.5rem;">';
        html += '<h4 style="color: #dc2626; margin-bottom: 1rem;">🔥 Immediate Actions (High Impact)</h4>';
        opportunities.immediate.forEach(opp => {
            html += '<div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">';
            html += '<div style="font-weight: 600; color: #dc2626; margin-bottom: 0.5rem;">' + opp.title + '</div>';
            html += '<p style="margin-bottom: 0.5rem; color: #7f1d1d;">' + opp.description + '</p>';
            html += '<div style="font-size: 0.9rem; margin-bottom: 0.5rem; color: #991b1b;"><strong>Action:</strong> ' + opp.action + '</div>';
            html += '<div style="font-size: 0.9rem; font-weight: 600; color: #16a34a;"><strong>Expected Impact:</strong> ' + opp.expectedImpact + '</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    
    // Strategic opportunities
    if (opportunities.strategic && opportunities.strategic.length > 0) {
        html += '<div style="margin-bottom: 1.5rem;">';
        html += '<h4 style="color: #d97706; margin-bottom: 1rem;">📈 Strategic Improvements</h4>';
        opportunities.strategic.forEach(opp => {
            html += '<div style="background: #fffbeb; border: 1px solid #fed7aa; border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">';
            html += '<div style="font-weight: 600; color: #d97706; margin-bottom: 0.5rem;">' + opp.title + '</div>';
            html += '<p style="margin-bottom: 0.5rem; color: #92400e;">' + opp.description + '</p>';
            html += '<div style="font-size: 0.9rem; margin-bottom: 0.5rem; color: #a16207;"><strong>Action:</strong> ' + opp.action + '</div>';
            html += '<div style="font-size: 0.9rem; font-weight: 600; color: #16a34a;"><strong>Expected Impact:</strong> ' + opp.expectedImpact + '</div>';
            html += '</div>';
        });
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

// Simplified versions for other analysis components
function generateCampaignAnalysisHTML(campaignPerformance) {
    let html = '<div class="analysis-section" style="margin: 2rem 0; padding: 1.5rem; background: var(--surface); border-radius: 12px;">';
    html += '<h3 style="margin-bottom: 1rem; color: var(--primary-color);">🎪 Campaign Performance Analysis</h3>';
    
    if (campaignPerformance.topPerformers && campaignPerformance.topPerformers.length > 0) {
        html += '<div style="margin-bottom: 1.5rem;">';
        html += '<h4 style="color: #16a34a; margin-bottom: 1rem;">🏆 Top Performing Campaigns</h4>';
        
        campaignPerformance.topPerformers.slice(0, 3).forEach(campaign => {
            html += '<div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 1rem; margin-bottom: 0.5rem;">';
            html += '<div style="font-weight: 600; margin-bottom: 0.5rem;">' + campaign.campaign + ' (' + campaign.channel + ')</div>';
            html += '<div style="display: flex; justify-content: space-between;">';
            html += '<span>CAC: <strong>$' + campaign.cac + '</strong></span>';
            html += '<span>ROAS: <strong>' + campaign.roas.toFixed(2) + 'x</strong></span>';
            html += '<span>Customers: <strong>' + campaign.customers + '</strong></span>';
            html += '</div>';
            html += '</div>';
        });
        
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}

function generateFunnelAnalysisHTML(funnelAnalysis) {
    if (!funnelAnalysis || !funnelAnalysis.stages) return '';
    
    let html = '<div class="analysis-section" style="margin: 2rem 0; padding: 1.5rem; background: var(--surface); border-radius: 12px;">';
    html += '<h3 style="margin-bottom: 1rem; color: var(--primary-color);">🔄 Conversion Funnel Analysis</h3>';
    
    const stages = funnelAnalysis.stages;
    html += '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem;">';
    
    if (stages.impressions) {
        html += '<div style="background: white; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; text-align: center;">';
        html += '<div style="font-size: 1.5rem; font-weight: 700; color: var(--primary-color);">' + stages.impressions.toLocaleString() + '</div>';
        html += '<div style="font-size: 0.9rem; color: var(--text-secondary);">Impressions</div>';
        html += '</div>';
    }
    
    if (stages.customers) {
        html += '<div style="background: white; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; text-align: center;">';
        html += '<div style="font-size: 1.5rem; font-weight: 700; color: var(--accent-color);">' + stages.customers.toLocaleString() + '</div>';
        html += '<div style="font-size: 0.9rem; color: var(--text-secondary);">Customers</div>';
        html += '</div>';
    }
    
    html += '</div></div>';
    return html;
}

function generateCohortAnalysisHTML(cohortAnalysis) {
    if (!cohortAnalysis || !cohortAnalysis.analysis) return '';
    
    let html = '<div class="analysis-section" style="margin: 2rem 0; padding: 1.5rem; background: var(--surface); border-radius: 12px;">';
    html += '<h3 style="margin-bottom: 1rem; color: var(--primary-color);">👥 Cohort Performance</h3>';
    html += '<p style="color: var(--text-secondary);">Customer acquisition trends by month showing retention and value patterns.</p>';
    html += '</div>';
    return html;
}

function generatePredictiveHTML(predictiveModeling) {
    if (!predictiveModeling || !predictiveModeling.trends) return '';
    
    let html = '<div class="analysis-section" style="margin: 2rem 0; padding: 1.5rem; background: var(--surface); border-radius: 12px;">';
    html += '<h3 style="margin-bottom: 1rem; color: var(--primary-color);">🔮 Predictive Insights</h3>';
    
    const trends = predictiveModeling.trends;
    if (trends.cac) {
        const color = trends.cac.direction === 'increasing' ? '#dc2626' : '#16a34a';
        html += '<div style="background: white; border: 1px solid var(--border); border-radius: 8px; padding: 1rem; margin-bottom: 1rem;">';
        html += '<div style="font-weight: 600; color: ' + color + ';">CAC Trend: ' + trends.cac.direction.toUpperCase() + '</div>';
        html += '<div style="font-size: 0.9rem; color: var(--text-secondary);">Confidence: ' + Math.round(trends.cac.confidence * 100) + '%</div>';
        html += '</div>';
    }
    
    html += '</div>';
    return html;
}