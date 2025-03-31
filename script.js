// Initialize Socket.IO connection
const socket = io('http://localhost:8000'); // Will be replaced with actual server URL

// Emergency button functionality
document.getElementById('emergencyBtn')?.addEventListener('click', () => {
    // Show confirmation dialog
    const confirmed = confirm('Are you sure you want to send an emergency alert?');
    if (confirmed) {
        // Get user's current location if possible
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const location = {
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    };
                    // Emit emergency event with location
                    socket.emit('emergency', {
                        userId: 'current-user-id', // Replace with actual user ID
                        location: location,
                        timestamp: new Date().toISOString()
                    });
                    showEmergencyNotification('Emergency alert sent with your location');
                },
                () => {
                    // Fallback if location access is denied
                    socket.emit('emergency', {
                        userId: 'current-user-id',
                        timestamp: new Date().toISOString()
                    });
                    showEmergencyNotification('Emergency alert sent without location');
                }
            );
        } else {
            // Fallback if geolocation is not supported
            socket.emit('emergency', {
                userId: 'current-user-id',
                timestamp: new Date().toISOString()
            });
            showEmergencyNotification('Emergency alert sent');
        }
    }
});

// Function to show emergency notification to user
function showEmergencyNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in';
    notification.innerHTML = `
        <div class="flex items-center space-x-2">
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Remove notification after 5 seconds
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
    }, 5000);
}

// Listen for emergency notifications from server
socket.on('emergencyAlert', (data) => {
    const notification = document.createElement('div');
    notification.className = 'fixed top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-fade-in w-max max-w-xs md:max-w-md';
    notification.innerHTML = `
        <div class="flex items-center space-x-3">
            <i class="fas fa-bell text-xl"></i>
            <div>
                <p class="font-semibold">Emergency Alert</p>
                <p class="text-sm">${data.message || 'A user has triggered an emergency alert'}</p>
                ${data.location ? `<p class="text-xs mt-1"><i class="fas fa-map-marker-alt"></i> Location recorded</p>` : ''}
            </div>
        </div>
    `;
    document.body.appendChild(notification);
    
    // Remove notification after 8 seconds
    setTimeout(() => {
        notification.classList.add('opacity-0', 'transition-opacity', 'duration-300');
        setTimeout(() => notification.remove(), 300);
    }, 8000);
});

// Initialize service worker for push notifications
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').then(registration => {
            console.log('ServiceWorker registration successful');
        }).catch(err => {
            console.log('ServiceWorker registration failed: ', err);
        });
    });
}