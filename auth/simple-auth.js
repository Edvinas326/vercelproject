// Simple Auth Module - Uses localStorage for authentication
const SimpleAuth = {
  // Constants
  STORAGE_KEY: 'simple_auth_user',
  PROFILES_KEY: 'simple_auth_profiles',
  
  // Pre-defined test users
  TEST_USERS: [
    {
      id: '1',
      email: 'teacher@test.com',
      password: 'test123',
      first_name: 'Teacher',
      last_name: 'User',
      role: 'teacher'
    },
    {
      id: '2',
      email: 'admin@test.com',
      password: 'test123',
      first_name: 'Admin',
      last_name: 'User',
      role: 'admin'
    },
    {
      id: '3',
      email: 'student@test.com',
      password: 'test123',
      first_name: 'Student',
      last_name: 'User',
      role: 'student'
    }
  ],
  
  // Initialize the auth system
  init() {
    console.log('Simple Auth initialized');
    // Initialize test users if none exist
    const users = JSON.parse(localStorage.getItem(this.STORAGE_KEY + '_users')) || [];
    
    if (users.length === 0) {
      localStorage.setItem(this.STORAGE_KEY + '_users', JSON.stringify(this.TEST_USERS));
      console.log('Test users created');
      
      // Create profiles for test users
      this._createProfiles(this.TEST_USERS);
    }
  },
  
  // Create profiles for users
  _createProfiles(users) {
    const profiles = users.map(user => ({
      id: user.id,
      full_name: `${user.first_name} ${user.last_name}`,
      username: user.email.split('@')[0],
      email: user.email,
      role: user.role,
      bio: `This is a ${user.role} account.`,
      school: 'Test School',
      grade_level: user.role === 'student' ? '12' : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));
    
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
    console.log('Profiles created:', profiles);
  },
  
  // Sign in a user
  signIn(email, password) {
    console.log('Attempting sign in for:', email);
    const users = JSON.parse(localStorage.getItem(this.STORAGE_KEY + '_users')) || [];
    
    const user = users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      console.log('User not found or password incorrect');
      return { success: false, message: 'Invalid email or password' };
    }
    
    // Create session
    const session = {
      user: {
        id: user.id,
        email: user.email,
        user_metadata: {
          first_name: user.first_name,
          last_name: user.last_name,
          role: user.role
        }
      },
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
    };
    
    // Store in localStorage
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(session));
    console.log('User signed in:', user);
    
    return { 
      success: true, 
      user: session.user
    };
  },
  
  // Sign up a new user
  signUp(email, password, userData) {
    console.log('Attempting sign up for:', email);
    const users = JSON.parse(localStorage.getItem(this.STORAGE_KEY + '_users')) || [];
    
    // Check if user already exists
    if (users.some(u => u.email === email)) {
      console.log('User already exists');
      return { success: false, message: 'User with this email already exists' };
    }
    
    // Create new user
    const newUser = {
      id: Date.now().toString(),
      email,
      password,
      first_name: userData.firstName || '',
      last_name: userData.lastName || '',
      role: userData.role || 'student'
    };
    
    // Add to users
    users.push(newUser);
    localStorage.setItem(this.STORAGE_KEY + '_users', JSON.stringify(users));
    
    // Create profile
    const profiles = JSON.parse(localStorage.getItem(this.PROFILES_KEY)) || [];
    const newProfile = {
      id: newUser.id,
      full_name: `${newUser.first_name} ${newUser.last_name}`,
      username: email.split('@')[0],
      email: newUser.email,
      role: newUser.role,
      bio: '',
      school: '',
      grade_level: newUser.role === 'student' ? '' : null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    profiles.push(newProfile);
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
    
    console.log('User signed up:', newUser);
    return { success: true };
  },
  
  // Sign out the current user
  signOut() {
    localStorage.removeItem(this.STORAGE_KEY);
    console.log('User signed out');
    return { success: true };
  },
  
  // Get the current user
  getCurrentUser() {
    const session = JSON.parse(localStorage.getItem(this.STORAGE_KEY));
    if (!session) {
      return null;
    }
    
    // Check if session is expired
    if (new Date(session.expires_at) < new Date()) {
      this.signOut();
      return null;
    }
    
    return session.user;
  },
  
  // Get a user's profile
  getProfile(userId) {
    const profiles = JSON.parse(localStorage.getItem(this.PROFILES_KEY)) || [];
    return profiles.find(p => p.id === userId);
  },
  
  // Update a user's profile
  updateProfile(profileData) {
    const profiles = JSON.parse(localStorage.getItem(this.PROFILES_KEY)) || [];
    const index = profiles.findIndex(p => p.id === profileData.id);
    
    if (index === -1) {
      console.log('Profile not found');
      return { success: false, message: 'Profile not found' };
    }
    
    // Update profile
    profiles[index] = {
      ...profiles[index],
      ...profileData,
      updated_at: new Date().toISOString()
    };
    
    localStorage.setItem(this.PROFILES_KEY, JSON.stringify(profiles));
    console.log('Profile updated:', profiles[index]);
    
    return { success: true, profile: profiles[index] };
  }
};

// Initialize on load
SimpleAuth.init();

// Export the module
export default SimpleAuth; 