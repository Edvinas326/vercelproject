// notifications.js - Handle notification functionality

document.addEventListener('DOMContentLoaded', () => {
    initializeNotifications();
});

function initializeNotifications() {
    const notificationButton = document.getElementById('notificationButton');
    const notificationDropdown = document.getElementById('notificationDropdown');
    const markAllReadButton = document.getElementById('markAllRead');
    const notificationCount = document.getElementById('notificationCount');
    const notificationsList = document.getElementById('notificationsList');
    
    if (!notificationButton || !notificationDropdown) return;
    
    // Toggle notification dropdown
    notificationButton.addEventListener('click', (e) => {
        e.stopPropagation();
        notificationDropdown.classList.toggle('hidden');
        
        // If the dropdown is visible, close it when clicking outside
        if (!notificationDropdown.classList.contains('hidden')) {
            document.addEventListener('click', closeNotificationsOnClickOutside);
        } else {
            document.removeEventListener('click', closeNotificationsOnClickOutside);
        }
    });
    
    // Function to close notifications dropdown when clicking outside
    function closeNotificationsOnClickOutside(e) {
        if (!notificationDropdown.contains(e.target) && e.target !== notificationButton) {
            notificationDropdown.classList.add('hidden');
            document.removeEventListener('click', closeNotificationsOnClickOutside);
        }
    }
    
    // Mark all notifications as read
    markAllReadButton.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Mark all notifications as read
        const unreadNotifications = notificationsList.querySelectorAll('.notification-item.unread');
        unreadNotifications.forEach(notification => {
            notification.classList.remove('unread');
            const indicator = notification.querySelector('.bg-primary-500');
            if (indicator) indicator.remove();
        });
        
        // Update the notification count
        updateNotificationCount();
    });
    
    // Individual notification click handler to mark as read
    const notificationItems = notificationsList.querySelectorAll('.notification-item');
    notificationItems.forEach(item => {
        item.addEventListener('click', () => {
            item.classList.remove('unread');
            const indicator = item.querySelector('.bg-primary-500');
            if (indicator) indicator.remove();
            
            // Update the notification count
            updateNotificationCount();
        });
    });
    
    // Function to update notification count
    function updateNotificationCount() {
        const unreadCount = notificationsList.querySelectorAll('.notification-item.unread').length;
        
        if (unreadCount === 0) {
            notificationCount.classList.add('hidden');
        } else {
            notificationCount.classList.remove('hidden');
            notificationCount.textContent = unreadCount;
        }
    }
    
    // Initialize notification count
    updateNotificationCount();
    
    // Simulate new notification (for demo purposes)
    let notificationDemo = document.createElement('button');
    notificationDemo.id = 'demoNotification';
    notificationDemo.className = 'fixed bottom-4 right-4 bg-primary-500 text-white px-4 py-2 rounded-md shadow-md hover:bg-primary-600 transition-colors';
    notificationDemo.textContent = 'Add New Notification';
    notificationDemo.style.zIndex = '50';
    document.body.appendChild(notificationDemo);
    
    notificationDemo.addEventListener('click', () => {
        addNewNotification({
            title: 'New Notification',
            message: 'This is a demo notification added by clicking the button.',
            icon: 'info',
            time: 'Just now'
        });
    });
}

// Function to add a new notification
function addNewNotification(notification) {
    const notificationsList = document.getElementById('notificationsList');
    const notificationCount = document.getElementById('notificationCount');
    
    if (!notificationsList || !notificationCount) return;
    
    // Create icon based on notification type
    let iconHTML = '';
    let iconBgClass = '';
    let iconColor = '';
    
    switch(notification.icon) {
        case 'success':
            iconBgClass = 'bg-green-100 dark:bg-green-900';
            iconColor = 'text-green-500 dark:text-green-300';
            iconHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
            break;
        case 'warning':
            iconBgClass = 'bg-yellow-100 dark:bg-yellow-900';
            iconColor = 'text-yellow-500 dark:text-yellow-300';
            iconHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>';
            break;
        case 'error':
            iconBgClass = 'bg-red-100 dark:bg-red-900';
            iconColor = 'text-red-500 dark:text-red-300';
            iconHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
            break;
        case 'message':
            iconBgClass = 'bg-purple-100 dark:bg-purple-900';
            iconColor = 'text-purple-500 dark:text-purple-300';
            iconHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>';
            break;
        default: // info
            iconBgClass = 'bg-blue-100 dark:bg-blue-900';
            iconColor = 'text-blue-500 dark:text-blue-300';
            iconHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>';
    }
    
    // Create new notification element
    const notificationItem = document.createElement('div');
    notificationItem.className = 'notification-item p-4 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors unread';
    
    notificationItem.innerHTML = `
        <div class="flex items-start">
            <div class="flex-shrink-0 mr-3">
                <div class="w-8 h-8 rounded-full ${iconBgClass} flex items-center justify-center">
                    <svg class="w-4 h-4 ${iconColor}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        ${iconHTML}
                    </svg>
                </div>
            </div>
            <div class="flex-1">
                <p class="text-sm font-medium text-gray-900 dark:text-white">${notification.title}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">${notification.message}</p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">${notification.time}</p>
            </div>
            <div class="w-2 h-2 bg-primary-500 rounded-full"></div>
        </div>
    `;
    
    // Add notification to the list (prepend to show newest first)
    notificationsList.insertBefore(notificationItem, notificationsList.firstChild);
    
    // Mark individual notification as read when clicked
    notificationItem.addEventListener('click', () => {
        notificationItem.classList.remove('unread');
        const indicator = notificationItem.querySelector('.bg-primary-500');
        if (indicator) indicator.remove();
        
        // Update the notification count
        updateNotificationCount();
    });
    
    // Update notification count
    function updateNotificationCount() {
        const unreadCount = notificationsList.querySelectorAll('.notification-item.unread').length;
        
        if (unreadCount === 0) {
            notificationCount.classList.add('hidden');
        } else {
            notificationCount.classList.remove('hidden');
            notificationCount.textContent = unreadCount;
        }
    }
    
    // Update notification count with the new notification
    updateNotificationCount();
    
    // Optional: Show notification badge animation
    notificationCount.classList.add('animate-pulse');
    setTimeout(() => {
        notificationCount.classList.remove('animate-pulse');
    }, 1000);
}

// Export functions for use in other files
export { addNewNotification }; 