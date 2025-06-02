#!/bin/bash

# Script to remove Supabase and implement SimpleAuth

# 1. Remove Supabase config files
echo "Removing Supabase configuration files..."
rm -f supabase-config.js
rm -f supabase-setup.sql
rm -f supabase-debug.html
rm -f supabase-auth-fix.sql
rm -f remove-all-data.sql

# 2. Create auth directory if it doesn't exist
echo "Setting up SimpleAuth..."
mkdir -p auth

# 3. Move SimpleAuth to auth directory
if [ -f simple-auth.js ]; then
  mv simple-auth.js auth/simple-auth.js
else
  echo "simple-auth.js not found in current directory. Please make sure it exists."
  exit 1
fi

# 4. Create an auth.js file that exports SimpleAuth
cat > auth/auth.js << 'EOL'
// auth.js - Main authentication module
import SimpleAuth from './simple-auth.js';

// Export the authentication module
export default SimpleAuth;
EOL

echo "Created auth.js that exports SimpleAuth"

# 5. Create README with instructions
cat > README-AUTH.md << 'EOL'
# Authentication System

This project now uses a client-side authentication system (SimpleAuth) that stores user data in localStorage.
Supabase has been completely removed.

## Pre-defined Test Users

- Teacher: teacher@test.com / test123
- Admin: admin@test.com / test123
- Student: student@test.com / test123

## How to Use

Import the auth module in your JavaScript files:

```javascript
import auth from '../auth/auth.js';
```

### Common Operations:

```javascript
// Sign in
const { success, user } = auth.signIn(email, password);

// Sign up
const { success } = auth.signUp(email, password, {
  firstName: 'John',
  lastName: 'Doe',
  role: 'student'
});

// Get current user
const user = auth.getCurrentUser();

// Sign out
auth.signOut();

// Get profile
const profile = auth.getProfile(userId);

// Update profile
const { success, profile } = auth.updateProfile({
  id: userId,
  full_name: 'New Name',
  bio: 'New bio'
});
```
EOL

echo "Created README-AUTH.md with instructions"

echo "Script completed. You'll need to manually update your JavaScript files to use SimpleAuth instead of Supabase."
echo "See README-AUTH.md for usage instructions." 