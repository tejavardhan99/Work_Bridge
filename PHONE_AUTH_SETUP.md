# Firebase Phone OTP Authentication Integration Guide

## Overview

WorkBridge now uses **Firebase Phone Authentication** instead of email OTP verification. This is ideal for rural workers who may not have regular email access.

## Architecture Changes

### Removed Components
- ❌ Email OTP verification page (`OTPVerification.jsx`)
- ❌ Email-based OTP endpoints
- ❌ Email verification logic

### New Components

#### Frontend
- ✅ **PhoneRegister.jsx** - User registration with phone number
- ✅ **PhoneLogin.jsx** - User login with phone number
- ✅ **PhoneOTPVerify.jsx** - 6-digit SMS OTP verification
- ✅ **firebaseAuth.js** - Firebase Phone Auth service
- ✅ Updated **api.js** - Backend integration endpoints
- ✅ Updated **routes/index.jsx** - New routing for phone auth

#### Backend
- ✅ **PhoneRegisterView** - Register with verified phone
- ✅ **PhoneLoginView** - Login with verified phone
- ✅ New serializers - `PhoneRegisterSerializer`, `PhoneLoginSerializer`

## Authentication Flow

### Registration Flow
```
1. User fills Phone Register form:
   - Name
   - Phone (with country code, e.g., +919876543210)
   - Password
   - Role (Worker/Employer)

2. Click "Send OTP" → Firebase sends SMS to phone

3. User enters 6-digit OTP in verification screen

4. Firebase verifies OTP and returns auth credential

5. Frontend calls `/api/v1/auth/phone-register/` with:
   - name
   - phone
   - password
   - role
   - idToken (Firebase verified credential)

6. Backend:
   - Checks if user exists by phone
   - If new: creates user + profile
   - Returns JWT tokens

7. Frontend stores tokens and redirects to dashboard
```

### Login Flow
```
1. User fills Phone Login form:
   - Phone (with country code)
   - Password

2. Click "Send OTP" → Firebase sends SMS

3. User enters 6-digit OTP

4. Firebase verifies and returns credential

5. Frontend calls `/api/v1/auth/phone-login/` with:
   - phone
   - idToken

6. Backend:
   - Finds user by phone
   - Returns JWT tokens

7. Frontend redirects to dashboard
```

## Environment Setup

### Firebase Configuration
Add to `.env.local` or set in `frontend/src/services/firebase.js`:

```env
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url
```

### Firebase Console Setup
1. Go to Firebase Console
2. Enable "Phone" authentication method
3. Add test phone numbers for development (optional)
4. Configure reCAPTCHA v3 for production

## API Endpoints

### Register with Phone
```
POST /api/v1/auth/phone-register/

Request:
{
  "name": "John Doe",
  "phone": "+919876543210",
  "password": "SecurePassword123",
  "role": "worker",
  "idToken": "firebase_id_token"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "worker"
    },
    "tokens": {
      "access": "jwt_access_token",
      "refresh": "jwt_refresh_token"
    }
  }
}
```

### Login with Phone
```
POST /api/v1/auth/phone-login/

Request:
{
  "phone": "+919876543210",
  "idToken": "firebase_id_token"
}

Response:
{
  "success": true,
  "data": {
    "user": {
      "id": "user_id",
      "name": "John Doe",
      "phone": "+919876543210",
      "role": "worker"
    },
    "tokens": {
      "access": "jwt_access_token",
      "refresh": "jwt_refresh_token"
    }
  }
}
```

## Frontend Routes

```javascript
/phone-register      // Registration page
/phone-login        // Login page
/phone-otp-verify   // OTP verification page (both register & login)
/register           // Alias for /phone-register
/login              // Alias for /phone-login
```

## Key Features

### User Experience
- ✅ Mobile-first OTP UI
- ✅ 6-digit input with auto-focus
- ✅ 60-second OTP resend countdown
- ✅ Animated loading states
- ✅ Error message clarity
- ✅ Toast notifications
- ✅ Responsive design

### Security
- ✅ Firebase Phone Authentication (industry standard)
- ✅ reCAPTCHA verification (prevents abuse)
- ✅ JWT tokens (access + refresh)
- ✅ Phone-based identification (no email required)
- ✅ Password hashing

### Reliability
- ✅ OTP resend capability
- ✅ Session storage for registration data
- ✅ User duplicate checking
- ✅ Automatic profile creation for workers/employers

## Testing Locally

### Test Phone Numbers (Firebase Console)
1. Add test phone numbers in Firebase Auth settings
2. Use test numbers + any 6-digit code for OTP

### Test Flow
1. Go to http://localhost:3000/phone-register
2. Fill form (use test phone number)
3. Click "Send OTP"
4. Enter 6-digit OTP (any number for test)
5. Verify successful registration/redirect

## Frontend Files Changed

```
src/
├── pages/
│   ├── PhoneRegister.jsx         (NEW)
│   ├── PhoneLogin.jsx            (NEW)
│   └── PhoneOTPVerify.jsx        (NEW)
├── services/
│   ├── firebaseAuth.js           (NEW)
│   └── api.js                    (UPDATED)
└── routes/
    └── index.jsx                 (UPDATED)
```

## Backend Files Changed

```
apps/accounts/
├── views.py                      (UPDATED - added PhoneRegisterView, PhoneLoginView)
├── serializers.py                (UPDATED - added phone serializers)
└── urls.py                       (UPDATED - added phone routes)
```

## Important Notes

### Phone Number Format
- Users must provide phone with country code
- Examples: `+919876543210`, `+1234567890`, `+44123456789`
- Frontend has validation for phone format

### Email Optional
- Registration no longer requires email
- Phone is the primary identifier
- User can update profile email later

### Firebase Token
- Frontend obtains Firebase ID token after OTP verification
- Token is sent to backend for user verification
- Backend trusts Firebase-verified phone numbers

### Production Checklist
- [ ] Configure reCAPTCHA in Firebase Console
- [ ] Add real phone numbers to test
- [ ] Set up proper error handling
- [ ] Enable production rates in Firebase
- [ ] Test with real SMS delivery

## Troubleshooting

### OTP Not Received
1. Check phone number format (with country code)
2. Verify reCAPTCHA is configured
3. Check Firebase Auth quotas
4. Check if phone number is in test list (development)

### "User with this phone number not found"
- Ensure registration was completed before login
- Check phone number format matches

### Firebase Errors
- `auth/invalid-phone-number` - Wrong format
- `auth/too-many-requests` - Rate limit hit
- `auth/invalid-verification-code` - Wrong OTP

## Future Enhancements

1. **Biometric Authentication** - Add fingerprint/face auth
2. **WhatsApp OTP** - Send OTP via WhatsApp
3. **Email Fallback** - Optional email for account recovery
4. **Phone Change** - Allow users to update phone number
5. **Multi-factor Auth** - Additional security layers

## Support

For issues or questions:
- Check Firebase Console logs
- Review browser console for client errors
- Check Django server logs for backend errors
- Verify phone number format in all requests
