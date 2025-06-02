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
