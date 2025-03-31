// Initialize Socket.IO connection
const socket = io('http://localhost:8000', {
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000
});

// Connection status indicators
socket.on('connect', () => {
  console.log('Connected to server');
  document.dispatchEvent(new Event('serverConnected'));
});

socket.on('disconnect', () => {
  console.log('Disconnected from server');
  document.dispatchEvent(new Event('serverDisconnected'));
});

// Emergency button functionality
document.getElementById('emergencyBtn')?.addEventListener('click', async () => {
    try {
        // Show loading state
        const btn = document.getElementById('emergencyBtn');
        btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Sending...';
        btn.disabled = true;

        // Get precise location
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                enableHighAccuracy: true,
                timeout: 10000,
                maximumAge: 0
            });
        });

        const location = {
            latitude: position.coords.latitude.toFixed(6),
            longitude: position.coords.longitude.toFixed(6),
            accuracy: position.coords.accuracy + 'm',
            timestamp: new Date().toLocaleString(),
            mapUrl: `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`
        };

        // Send emergency alert
        socket.emit('emergencyAlert', {
            type: 'medical',
            severity: 'high',
            userId: 'user-' + Math.floor(Math.random() * 1000), // Temp user ID
            location,
            message: 'PCOS Emergency Assistance Requested',
            contacts: []
        });

        // Show success notification
        showEmergencyNotification(`
            <div>
                <p><i class="fas fa-check-circle text-green-500"></i> Emergency alert sent!</p>
                <p class="text-xs mt-1">Location: ${location.latitude}, ${location.longitude}</p>
                <a href="${location.mapUrl}" target="_blank" class="text-xs underline">View on Map</a>
            </div>
        `);

    } catch (error) {
        console.error('Emergency error:', error);
        showEmergencyNotification(`
            <div class="text-red-500">
                <p><i class="fas fa-exclamation-triangle"></i> Emergency sent without location</p>
                <p class="text-xs">${error.message}</p>
            </div>
        `);
    } finally {
        // Reset button state
        const btn = document.getElementById('emergencyBtn');
        btn.innerHTML = '<i class="fas fa-bell"></i> Emergency';
        btn.disabled = false;
    }
});

// Profile button functionality
function setupProfileButton() {
    const profileBtn = document.createElement('button');
    profileBtn.id = 'profileBtn';
    profileBtn.className = 'flex items-center space-x-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-full transition-all';
    profileBtn.innerHTML = `
        <i class="fas fa-user-circle"></i>
        <span>Profile</span>
    `;
    
    profileBtn.addEventListener('click', () => {
        // In a real app, this would navigate to profile page
        alert('Profile page would open here');
    });

    // Add to navigation
    const nav = document.querySelector('nav > div > div:last-child');
    if (nav) {
        nav.insertBefore(profileBtn, document.getElementById('emergencyBtn'));
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', setupProfileButton);

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