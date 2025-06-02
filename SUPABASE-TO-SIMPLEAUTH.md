# Supabase to SimpleAuth Conversion Guide

This guide will help you convert your Supabase authentication calls to SimpleAuth equivalents.

## 1. Import Changes

### Supabase Import:
```javascript
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
```

### SimpleAuth Import:
```javascript
import auth from '../auth/auth.js'
```

## 2. Authentication Operations

### Sign In

#### Supabase:
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'email@example.com',
  password: 'password'
})
```

#### SimpleAuth:
```javascript
const { success, user } = auth.signIn('email@example.com', 'password')
```

### Sign Up

#### Supabase:
```javascript
const { data, error } = await supabase.auth.signUp({
  email: 'email@example.com',
  password: 'password',
  options: {
    data: {
      first_name: 'John',
      last_name: 'Doe',
      role: 'student'
    }
  }
})
```

#### SimpleAuth:
```javascript
const { success } = auth.signUp('email@example.com', 'password', {
  firstName: 'John',
  lastName: 'Doe',
  role: 'student'
})
```

### Get Current User

#### Supabase:
```javascript
const { data: { user } } = await supabase.auth.getUser()
```

#### SimpleAuth:
```javascript
const user = auth.getCurrentUser()
```

### Sign Out

#### Supabase:
```javascript
const { error } = await supabase.auth.signOut()
```

#### SimpleAuth:
```javascript
auth.signOut()
```

## 3. Profile Operations

### Get Profile

#### Supabase:
```javascript
const { data: profile, error } = await supabase
  .from('profiles')
  .select('*')
  .eq('id', userId)
  .single()
```

#### SimpleAuth:
```javascript
const profile = auth.getProfile(userId)
```

### Update Profile

#### Supabase:
```javascript
const { error } = await supabase
  .from('profiles')
  .update({
    full_name: 'New Name',
    bio: 'New bio'
  })
  .eq('id', userId)
```

#### SimpleAuth:
```javascript
const { success, profile } = auth.updateProfile({
  id: userId,
  full_name: 'New Name',
  bio: 'New bio'
})
```

## 4. Handling Errors

### Supabase:
```javascript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'email@example.com',
  password: 'password'
})

if (error) {
  console.error('Error signing in:', error.message)
  return
}
```

### SimpleAuth:
```javascript
const { success, user, message } = auth.signIn('email@example.com', 'password')

if (!success) {
  console.error('Error signing in:', message)
  return
}
```

## 5. Additional Notes

- SimpleAuth stores all data in localStorage, so it will be lost if the browser storage is cleared
- No network requests are made with SimpleAuth
- All operations are synchronous (no need for async/await)
- Test users are pre-defined in SimpleAuth 