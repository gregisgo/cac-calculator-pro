// Upload improvements and better user feedback

function updateDataLoadedUI() {
    console.log('Updating data loaded UI...');
    
    // Update upload areas to show loaded data
    const marketingUpload = document.getElementById('marketingUpload');
    const revenueUpload = document.getElementById('revenueUpload');
    const revenueUploadUnified = document.getElementById('revenueUploadUnified');
    
    if (marketingUpload && appState.uploadedData.marketing) {
        marketingUpload.innerHTML = `
            <div class="upload-success">
                <div class="upload-icon">✅</div>
                <div class="upload-text">${appState.uploadedData.marketing.filename}</div>
                <div class="upload-subtext">${appState.uploadedData.marketing.rows} rows, ${appState.uploadedData.marketing.channels} channels</div>
                <div class="upload-subtext">${appState.uploadedData.marketing.dateRange}</div>
            </div>
        `;
        marketingUpload.style.background = 'rgba(34, 197, 94, 0.1)';
        marketingUpload.style.borderColor = 'var(--accent-color)';
    }
    
    if (revenueUpload && appState.uploadedData.revenue) {
        revenueUpload.innerHTML = `
            <div class="upload-success">
                <div class="upload-icon">✅</div>
                <div class="upload-text">${appState.uploadedData.revenue.filename}</div>
                <div class="upload-subtext">${appState.uploadedData.revenue.rows} revenue records</div>
            </div>
        `;
        revenueUpload.style.background = 'rgba(34, 197, 94, 0.1)';
        revenueUpload.style.borderColor = 'var(--accent-color)';
    }
    
    if (revenueUploadUnified && appState.uploadedData.revenue) {
        revenueUploadUnified.innerHTML = `
            <div class="upload-success">
                <div class="upload-icon">✅</div>
                <div class="upload-text">${appState.uploadedData.revenue.filename}</div>
                <div class="upload-subtext">${appState.uploadedData.revenue.rows} revenue records</div>
            </div>
        `;
        revenueUploadUnified.style.background = 'rgba(34, 197, 94, 0.1)';
        revenueUploadUnified.style.borderColor = 'var(--accent-color)';
    }
    
    // Update analyze button
    updateAnalyzeButton();
}

// Enhanced file upload handling with better feedback
function enhancedHandleFileUpload(file, channel, inputElement) {
    if (!file) return;
    
    console.log('Processing file upload:', file.name, 'for channel:', channel);
    
    showNotification(`Processing ${file.name}... Reading file data.`, 'info');
    
    // Show immediate feedback
    const uploadArea = inputElement.closest('.file-upload');
    if (uploadArea) {
        uploadArea.style.borderColor = 'var(--primary-color)';
        uploadArea.style.backgroundColor = 'rgba(59, 130, 246, 0.05)';
        
        const uploadText = uploadArea.querySelector('.file-upload-text');
        const uploadHint = uploadArea.querySelector('.file-upload-hint');
        
        if (uploadText) uploadText.textContent = `Processing ${file.name}...`;
        if (uploadHint) uploadHint.textContent = 'Reading and validating data structure...';
    }
    
    // Process file locally first for immediate feedback
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            let data = [];
            const text = e.target.result;
            
            if (file.name.endsWith('.csv')) {
                // Simple CSV parsing
                const lines = text.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    throw new Error('File appears to be empty or invalid');
                }
                
                const headers = lines[0].split(',').map(h => h.trim());
                console.log('CSV headers detected:', headers);
                
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(',');
                    if (values.length === headers.length) {
                        const row = {};
                        headers.forEach((header, index) => {
                            row[header] = values[index].trim();
                        });
                        data.push(row);
                    }
                }
            }
            
            // Provide immediate feedback about data structure
            const rowCount = data.length;
            const channels = [...new Set(data.map(row => row.channel || row.Channel).filter(Boolean))];
            const dateRange = data.length > 0 ? {
                start: Math.min(...data.map(row => new Date(row.date || row.Date).getTime())),
                end: Math.max(...data.map(row => new Date(row.date || row.Date).getTime()))
            } : null;
            
            console.log('File analysis:', { rowCount, channels, dateRange });
            
            // Update UI with immediate feedback
            if (uploadArea) {
                uploadArea.style.borderColor = 'var(--accent-color)';
                uploadArea.style.backgroundColor = 'rgba(34, 197, 94, 0.1)';
                
                const uploadText = uploadArea.querySelector('.file-upload-text');
                const uploadHint = uploadArea.querySelector('.file-upload-hint');
                
                if (uploadText) uploadText.textContent = file.name;
                if (uploadHint) {
                    let hintText = `${rowCount} rows detected`;
                    if (channels.length > 0) hintText += `, ${channels.length} channels: ${channels.join(', ')}`;
                    if (dateRange) {
                        const startDate = new Date(dateRange.start).toISOString().split('T')[0];
                        const endDate = new Date(dateRange.end).toISOString().split('T')[0];
                        hintText += ` (${startDate} to ${endDate})`;
                    }
                    uploadHint.textContent = hintText;
                }
            }
            
            // Store in appState for immediate use
            if (channel === 'marketing' || channel === 'unified') {
                appState.uploadedData.marketing = {
                    data: data,
                    filename: file.name,
                    rows: rowCount,
                    channels: channels.length,
                    dateRange: dateRange ? `${new Date(dateRange.start).toISOString().split('T')[0]} to ${new Date(dateRange.end).toISOString().split('T')[0]}` : 'Unknown'
                };
            } else if (channel === 'revenue') {
                appState.uploadedData.revenue = {
                    data: data,
                    filename: file.name,
                    rows: rowCount
                };
            }
            
            updateAnalyzeButton();
            
            showNotification(`File processed successfully! ${rowCount} rows, ${channels.length} channels detected.`, 'success');
            
        } catch (error) {
            console.error('Error processing file:', error);
            
            if (uploadArea) {
                uploadArea.style.borderColor = 'var(--error-color)';
                uploadArea.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                
                const uploadText = uploadArea.querySelector('.file-upload-text');
                const uploadHint = uploadArea.querySelector('.file-upload-hint');
                
                if (uploadText) uploadText.textContent = 'Error processing file';
                if (uploadHint) uploadHint.textContent = error.message;
            }
            
            showNotification(`Error processing ${file.name}: ${error.message}`, 'error');
        }
    };
    
    reader.onerror = function() {
        showNotification(`Error reading file: ${file.name}`, 'error');
    };
    
    reader.readAsText(file);
}

// Improve the uploadOwnData function
function improvedUploadOwnData() {
    // Switch to unified upload method
    selectUploadMethod('unified');
    
    // Scroll to upload section
    const uploadSection = document.getElementById('unified-upload');
    if (uploadSection) {
        uploadSection.scrollIntoView({ behavior: 'smooth' });
    }
    
    showNotification('Ready to upload your data! Use the unified upload method below.', 'info');
}

// Global registration
window.updateDataLoadedUI = updateDataLoadedUI;
window.enhancedHandleFileUpload = enhancedHandleFileUpload;
window.improvedUploadOwnData = improvedUploadOwnData;