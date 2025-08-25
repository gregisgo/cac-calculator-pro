// Global function registration to ensure all onclick handlers work
// This ensures that functions called from HTML onclick attributes are accessible

// Ensure critical functions are globally accessible
window.showChannelTab = showChannelTab;
window.selectUploadMethod = selectUploadMethod; 
window.loadDemoData = loadDemoData;
window.uploadOwnData = uploadOwnData;
window.analyzeData = analyzeData;
window.showAnalyticsTab = showAnalyticsTab;
window.filterByPeriod = filterByPeriod;
window.applyCustomDateRange = applyCustomDateRange;
window.switchTimeView = switchTimeView;
window.removeChannelFile = removeChannelFile;
window.filterCampaigns = filterCampaigns;
window.filterCampaignsByChannel = filterCampaignsByChannel;
window.switchDataView = switchDataView;
window.filterRawData = filterRawData;

console.log('Global function registration completed successfully');

// Additional debugging for button clicks
document.addEventListener('click', function(event) {
    if (event.target.tagName === 'BUTTON') {
        console.log('Button clicked:', event.target.id, event.target.textContent.trim());
        
        if (event.target.onclick) {
            console.log('Button has onclick handler');
        } else {
            console.warn('Button missing onclick handler:', event.target);
        }
    }
});