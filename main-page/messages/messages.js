// Import Supabase client
import { supabase } from '../../supabase-config.js';

// DOM Elements
const darkModeToggle = document.getElementById('darkModeToggle');
const conversationItems = document.querySelectorAll('.p-4.hover\\:bg-gray-50, .p-4.bg-gray-100');
const messageTextarea = document.querySelector('textarea[placeholder="Type a message..."]');
const sendButton = document.querySelector('button.p-3.bg-primary-500');
const chatMessages = document.querySelector('.flex-1.overflow-y-auto.p-6');
const filterButtons = document.querySelectorAll('.mt-4.flex button');
const attachFileButton = document.querySelector('button svg[d*="M15.172 7l-6.586"]').parentElement;
const imageButton = document.querySelector('button svg[d*="M4 16l4.586-4.586"]').parentElement;
const searchInput = document.querySelector('input[placeholder="Search messages..."]');
const newMessageButton = document.querySelector('button.w-full.bg-primary-500');

// Sample data (would be fetched from Supabase in a real app)
const conversations = [
    {
        id: 1,
        contactName: 'Dr. Smith',
        contactTitle: 'Mathematics Professor',
        lastMessage: 'Yes, the office hours are still on for tomorrow at 2pm.',
        avatar: 'https://ui-avatars.com/api/?name=Dr.+Smith&background=0D8ABC&color=fff',
        timestamp: '5m',
        unread: false,
        active: true,
        online: true
    },
    {
        id: 2,
        contactName: 'Prof. Johnson',
        contactTitle: 'Computer Science',
        lastMessage: 'Don\'t forget to submit your project proposal by Friday.',
        avatar: 'https://ui-avatars.com/api/?name=Prof.+Johnson&background=2563EB&color=fff',
        timestamp: 'Yesterday',
        unread: true,
        online: false
    },
    {
        id: 3,
        contactName: 'Study Group',
        contactTitle: '5 members',
        lastMessage: 'Alex: Let\'s meet at the library around 6pm tonight.',
        avatar: 'https://ui-avatars.com/api/?name=Study+Group&background=DC2626&color=fff',
        timestamp: 'Monday',
        unread: false,
        online: false,
        isGroup: true
    },
    {
        id: 4,
        contactName: 'Dr. Williams',
        contactTitle: 'English Department',
        lastMessage: 'Your essay on Shakespeare was excellent. I\'d like to discuss it further.',
        avatar: 'https://ui-avatars.com/api/?name=Dr.+Williams&background=047857&color=fff',
        timestamp: 'Last week',
        unread: false,
        online: false
    },
    {
        id: 5,
        contactName: 'Academic Advisor',
        contactTitle: 'Student Services',
        lastMessage: 'I\'ve reviewed your course selection for next semester. Everything looks good.',
        avatar: 'https://ui-avatars.com/api/?name=Academic+Advisor&background=7C3AED&color=fff',
        timestamp: '2 weeks ago',
        unread: false,
        online: true
    }
];

// Current conversation messages
const currentConversation = [
    {
        id: 1,
        sender: 'Dr. Smith',
        content: 'Hello! Do you have any questions about the homework assignment due this Friday?',
        timestamp: '10:32 AM',
        isUser: false,
        avatar: 'https://ui-avatars.com/api/?name=Dr.+Smith&background=0D8ABC&color=fff'
    },
    {
        id: 2,
        content: 'Yes, I was wondering if we need to include proofs for the theorems in problem 3?',
        timestamp: '10:45 AM',
        isUser: true
    },
    {
        id: 3,
        sender: 'Dr. Smith',
        content: 'That\'s a good question. Yes, please include the proofs. They don\'t need to be very formal, but I want to see your reasoning.',
        timestamp: '10:51 AM',
        isUser: false,
        avatar: 'https://ui-avatars.com/api/?name=Dr.+Smith&background=0D8ABC&color=fff'
    },
    {
        id: 4,
        sender: 'Dr. Smith',
        content: 'Also, are you planning to come to office hours tomorrow at 2pm? I\'ll be available then if you have more questions.',
        timestamp: '10:52 AM',
        isUser: false,
        avatar: 'https://ui-avatars.com/api/?name=Dr.+Smith&background=0D8ABC&color=fff'
    },
    {
        id: 5,
        content: 'Thanks for clarifying! I\'ll make sure to include the proofs. And yes, I was planning to stop by your office hours tomorrow. Are they still at 2pm in your office?',
        timestamp: '11:03 AM',
        isUser: true
    },
    {
        id: 6,
        sender: 'Dr. Smith',
        content: 'Yes, the office hours are still on for tomorrow at 2pm.',
        timestamp: '11:04 AM',
        isUser: false,
        avatar: 'https://ui-avatars.com/api/?name=Dr.+Smith&background=0D8ABC&color=fff',
        read: true
    }
];

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize dark mode
    initDarkMode();
    
    // Add event listeners
    if (darkModeToggle) {
        darkModeToggle.addEventListener('click', toggleDarkMode);
    }
    
    if (sendButton) {
        sendButton.addEventListener('click', sendMessage);
    }
    
    if (messageTextarea) {
        // Auto-resize textarea as user types
        messageTextarea.addEventListener('input', autoResizeTextarea);
        
        messageTextarea.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
    }
    
    // Handle conversation selection
    conversationItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            conversationItems.forEach(conv => {
                conv.classList.remove('bg-gray-100', 'dark:bg-gray-700', 'border-l-4', 'border-primary-500');
                conv.classList.add('hover:bg-gray-50', 'dark:hover:bg-gray-750');
            });
            
            // Add active class to clicked item
            item.classList.add('bg-gray-100', 'dark:bg-gray-700', 'border-l-4', 'border-primary-500');
            item.classList.remove('hover:bg-gray-50', 'dark:hover:bg-gray-750');
            
            // Remove unread indicator if present
            const unreadIndicator = item.querySelector('.w-2.h-2.rounded-full.bg-primary-500');
            if (unreadIndicator) {
                unreadIndicator.remove();
            }
            
            // In a real app, you would load the conversation here
            // For now, we'll just scroll to the bottom of the current conversation
            scrollToBottom();
        });
    });
    
    // Filter messages
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            filterButtons.forEach(btn => {
                btn.classList.remove('border-b-2', 'border-primary-500', 'text-primary-600', 'dark:text-primary-400');
                btn.classList.add('text-gray-500', 'dark:text-gray-400');
            });
            
            button.classList.remove('text-gray-500', 'dark:text-gray-400');
            button.classList.add('border-b-2', 'border-primary-500', 'text-primary-600', 'dark:text-primary-400');
            
            // In a real app, you would filter the conversations here
            filterConversations(button.textContent.trim().toLowerCase());
        });
    });
    
    // Search functionality
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const searchTerm = searchInput.value.toLowerCase();
            searchConversations(searchTerm);
        });
    }
    
    // Attach file functionality
    if (attachFileButton) {
        attachFileButton.addEventListener('click', () => {
            // Create a file input
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            // Trigger the file input click
            fileInput.click();
            
            // Handle file selection
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    // Here you would handle the file upload
                    // For now we'll just show a message about the selection
                    const fileMessage = `Selected file: ${file.name} (${formatFileSize(file.size)})`;
                    
                    // Add a message showing the file attachment
                    addAttachmentMessage(file.name, formatFileSize(file.size));
                }
                document.body.removeChild(fileInput);
            });
        });
    }
    
    // Image attachment functionality
    if (imageButton) {
        imageButton.addEventListener('click', () => {
            // Create a file input specifically for images
            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = 'image/*';
            fileInput.style.display = 'none';
            document.body.appendChild(fileInput);
            
            // Trigger the file input click
            fileInput.click();
            
            // Handle file selection
            fileInput.addEventListener('change', () => {
                if (fileInput.files.length > 0) {
                    const file = fileInput.files[0];
                    // Here you would handle the image upload
                    // For demo, we'll create an image preview in the chat
                    addImageMessage(file);
                }
                document.body.removeChild(fileInput);
            });
        });
    }
    
    // New message button
    if (newMessageButton) {
        newMessageButton.addEventListener('click', () => {
            showNewMessageModal();
        });
    }
    
    // Scroll to bottom of chat on page load
    scrollToBottom();
});

// Initialize Dark Mode
function initDarkMode() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    updateDarkModeIcons(isDarkMode);
}

// Toggle Dark Mode
function toggleDarkMode() {
    const isDarkMode = document.documentElement.classList.contains('dark');
    
    if (isDarkMode) {
        document.documentElement.classList.remove('dark');
        localStorage.setItem('darkMode', 'disabled');
    } else {
        document.documentElement.classList.add('dark');
        localStorage.setItem('darkMode', 'enabled');
    }
    
    updateDarkModeIcons(!isDarkMode);
}

// Update Dark Mode Icons
function updateDarkModeIcons(isDarkMode) {
    if (!darkModeToggle) return;
    
    const sunIcon = darkModeToggle.querySelector('svg:first-of-type');
    const moonIcon = darkModeToggle.querySelector('svg:last-of-type');
    
    if (isDarkMode) {
        sunIcon.style.display = 'block';
        moonIcon.style.display = 'none';
    } else {
        sunIcon.style.display = 'none';
        moonIcon.style.display = 'block';
    }
}

// Auto-resize textarea
function autoResizeTextarea() {
    messageTextarea.style.height = 'auto';
    let newHeight = messageTextarea.scrollHeight;
    // Cap at maximum height
    if (newHeight > 120) newHeight = 120;
    // Set minimum height
    if (newHeight < 44) newHeight = 44;
    messageTextarea.style.height = newHeight + 'px';
}

// Send Message
function sendMessage() {
    if (!messageTextarea || !messageTextarea.value.trim()) return;
    
    const messageText = messageTextarea.value.trim();
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timestamp = `${hours > 12 ? hours - 12 : hours}:${minutes < 10 ? '0' + minutes : minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
    
    const newMessage = {
        id: currentConversation.length + 1,
        content: messageText,
        timestamp: timestamp,
        isUser: true
    };
    
    // Add message to UI
    addMessageToUI(newMessage);
    
    // Clear input and reset height
    messageTextarea.value = '';
    messageTextarea.style.height = '44px';
    
    // In a real app, you would send the message to the server here
    simulateResponse();
}

// Add Message to UI
function addMessageToUI(message) {
    const messageElement = document.createElement('div');
    
    if (message.isUser) {
        messageElement.classList.add('flex', 'items-end', 'flex-row-reverse', 'mb-4', 'max-w-3xl', 'ml-auto');
        messageElement.innerHTML = `
            <div>
                <div class="bg-primary-500 rounded-2xl p-4 shadow-sm">
                    <p class="text-white">${message.content}</p>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-1 text-right">${message.timestamp}</p>
            </div>
        `;
    } else {
        messageElement.classList.add('flex', 'items-start', 'mb-4', 'max-w-3xl');
        messageElement.innerHTML = `
            <img class="w-10 h-10 rounded-full mr-4" src="${message.avatar}" alt="${message.sender}">
            <div>
                <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm">
                    <p class="text-gray-800 dark:text-gray-200">${message.content}</p>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 ml-1 flex items-center">
                    ${message.timestamp}
                    ${message.read ? `
                        <span class="mx-1">•</span>
                        <svg class="w-3 h-3 text-primary-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"></path>
                        </svg>
                        <span class="ml-1">Read</span>
                    ` : ''}
                </p>
            </div>
        `;
    }
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    // Update the conversation list with the last message
    updateConversationList(message);
}

// Add attachment message to UI
function addAttachmentMessage(fileName, fileSize) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timestamp = `${hours > 12 ? hours - 12 : hours}:${minutes < 10 ? '0' + minutes : minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
    
    const messageElement = document.createElement('div');
    messageElement.classList.add('flex', 'items-end', 'flex-row-reverse', 'mb-4', 'max-w-3xl', 'ml-auto');
    messageElement.innerHTML = `
        <div>
            <div class="bg-primary-500 rounded-2xl p-4 shadow-sm">
                <div class="flex items-center">
                    <svg class="w-8 h-8 mr-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                    </svg>
                    <div>
                        <p class="text-white font-medium">${fileName}</p>
                        <p class="text-white text-opacity-80 text-sm">${fileSize}</p>
                    </div>
                </div>
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-1 text-right">${timestamp}</p>
        </div>
    `;
    
    chatMessages.appendChild(messageElement);
    scrollToBottom();
    
    // Update the conversation list
    const message = {
        content: `File: ${fileName}`,
        timestamp: timestamp,
        isUser: true
    };
    updateConversationList(message);
    
    // In a real app, you would send the file to the server here
    simulateResponse();
}

// Add image message to UI
function addImageMessage(file) {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const timestamp = `${hours > 12 ? hours - 12 : hours}:${minutes < 10 ? '0' + minutes : minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
    
    // Create an image preview using FileReader
    const reader = new FileReader();
    reader.onload = function(e) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('flex', 'items-end', 'flex-row-reverse', 'mb-4', 'max-w-3xl', 'ml-auto');
        messageElement.innerHTML = `
            <div>
                <div class="bg-primary-500 rounded-2xl p-2 shadow-sm">
                    <img src="${e.target.result}" alt="Image" class="rounded-xl max-w-full" style="max-height: 300px;">
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1 mr-1 text-right">${timestamp}</p>
            </div>
        `;
        
        chatMessages.appendChild(messageElement);
        scrollToBottom();
        
        // Update the conversation list
        const message = {
            content: `Image: ${file.name}`,
            timestamp: timestamp,
            isUser: true
        };
        updateConversationList(message);
        
        // In a real app, you would send the image to the server here
        simulateResponse();
    };
    reader.readAsDataURL(file);
}

// Update conversation list with last message
function updateConversationList(message) {
    // In a real app, this would update the conversation list with the latest message
    const activeConversation = document.querySelector('.bg-gray-100.dark\\:bg-gray-700');
    if (activeConversation) {
        const lastMessageElement = activeConversation.querySelector('p.text-sm.text-gray-600.dark\\:text-gray-300');
        if (lastMessageElement) {
            lastMessageElement.textContent = message.content;
        }
    }
}

// Simulate AI response (for demo purposes)
function simulateResponse() {
    // After a brief delay, simulate a response
    setTimeout(() => {
        const responses = [
            "I'll look into that for you.",
            "Thanks for letting me know.",
            "That sounds good. I'll schedule it.",
            "Could you provide more details?",
            "I'll see you at the meeting.",
            "Let me check my schedule and get back to you.",
            "That works for me.",
            "Great question, let me find the answer."
        ];
        
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        const now = new Date();
        const hours = now.getHours();
        const minutes = now.getMinutes();
        const timestamp = `${hours > 12 ? hours - 12 : hours}:${minutes < 10 ? '0' + minutes : minutes} ${hours >= 12 ? 'PM' : 'AM'}`;
        
        const responseMessage = {
            id: currentConversation.length + 2,
            sender: 'Dr. Smith',
            content: randomResponse,
            timestamp: timestamp,
            isUser: false,
            avatar: 'https://ui-avatars.com/api/?name=Dr.+Smith&background=0D8ABC&color=fff'
        };
        
        addMessageToUI(responseMessage);
    }, 1000 + Math.random() * 2000); // Random delay between 1-3 seconds
}

// Filter conversations based on tab
function filterConversations(filter) {
    // In a real app, you would filter conversations here
    console.log(`Filtering conversations by: ${filter}`);
    
    // For demo purposes
    if (filter === 'unread') {
        // Show only unread conversations
        conversationItems.forEach(item => {
            const hasUnread = item.querySelector('.w-2.h-2.rounded-full.bg-primary-500');
            if (hasUnread) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    } else if (filter === 'flagged') {
        // For demo, let's just log that we would show flagged conversations
        console.log('Would show flagged conversations');
        // Reset display
        conversationItems.forEach(item => {
            item.style.display = 'block';
        });
    } else {
        // Show all conversations
        conversationItems.forEach(item => {
            item.style.display = 'block';
        });
    }
}

// Search conversations
function searchConversations(searchTerm) {
    conversationItems.forEach(item => {
        const contactName = item.querySelector('h3.text-sm.font-semibold').textContent.toLowerCase();
        const messagePreview = item.querySelector('p.text-sm.text-gray-600').textContent.toLowerCase();
        
        if (contactName.includes(searchTerm) || messagePreview.includes(searchTerm)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Format file size
function formatFileSize(bytes) {
    if (bytes < 1024) {
        return bytes + ' B';
    } else if (bytes < 1024 * 1024) {
        return (bytes / 1024).toFixed(2) + ' KB';
    } else if (bytes < 1024 * 1024 * 1024) {
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    } else {
        return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
    }
}

// Show new message modal
function showNewMessageModal() {
    // This would be expanded in a real app to show a modal for selecting contacts
    alert('New message feature would open a modal to select contacts');
}

// Helper function to scroll chat to bottom
function scrollToBottom() {
    if (chatMessages) {
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }
} 