// Simple analytics tracking
document.addEventListener('DOMContentLoaded', () => {
    // Track page view
    trackEvent('page_view', {
        page_title: document.title,
        page_location: window.location.href
    });
    
    // Track tool clicks
    document.querySelectorAll('.tool-btn').forEach(button => {
        button.addEventListener('click', () => {
            trackEvent('tool_click', {
                tool_name: button.dataset.tool
            });
        });
    });
    
    // Track conversions
    document.addEventListener('conversion_complete', (e) => {
        trackEvent('conversion_success', {
            tool_name: e.detail.tool,
            file_type: e.detail.fileType,
            file_size: e.detail.fileSize
        });
    });
});

function trackEvent(eventName, eventData) {
    // In a real implementation, this would send data to your analytics service
    console.log('Analytics event:', eventName, eventData);
    
    // Example: Send to Google Analytics (if configured)
    if (typeof gtag === 'function') {
        gtag('event', eventName, eventData);
    }
    
    // Example: Send to a simple endpoint
    if (process.env.NODE_ENV === 'production') {
        fetch('/api/analytics', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                event: eventName,
                data: eventData,
                timestamp: new Date().toISOString(),
                userAgent: navigator.userAgent,
                screenResolution: `${window.screen.width}x${window.screen.height}`
            })
        }).catch(error => {
            console.error('Analytics error:', error);
        });
    }
}
