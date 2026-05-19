# Admin System Setup Guide

## Overview
This guide explains how to set up the first admin account for the EasyChef application.

## Features

### User Side - Admin Application
- During registration, users can opt to "Apply for admin account"
- When selected, an admin request is created in Firestore and set to "pending" status
- Users receive confirmation that their request is pending review

### Admin Side - Admin Panel
- Admins can view all pending admin requests
- Admins can approve or reject requests with optional rejection reasons
- The Admin Panel is accessible via the Profile screen (only visible to admins)
- Admin status is displayed as a badge under the profile name

## Setting Up the First Admin Account

### Option 1: Using Firebase Console (Recommended for Initial Setup)

1. **Create User Account Normally**
   - Register a user account in the app as usual
   - Note the user's UID from Firebase Authentication

2. **Update User Document in Firestore**
   - Go to Firebase Console → Firestore Database
   - Navigate to: `users` → {user_uid}
   - Add/Update the following field:
     ```
     isAdmin: true
     adminApprovedAt: (current timestamp)
     adminApprovedBy: "system"
     ```

3. **Create Admin Request Record (Optional but Recommended)**
   - Go to `adminRequests` collection
   - Create a new document with ID = {user_uid}
   - Set the following data:
     ```
     {
       userId: "{user_uid}",
       userName: "{user_name}",
       userEmail: "{user_email}",
       status: "approved",
       requestedAt: (current timestamp),
       reviewedAt: (current timestamp),
       reviewedBy: "system"
     }
     ```

4. **Verify**
   - Log out and log back in with the admin account
   - An "Admin" badge should appear under the profile name
   - An "Admin Panel" button should appear in the Profile screen

### Option 2: Using the App's Admin Service (For Development)

If you prefer programmatic setup, you can use the `createFirstAdmin` function from `services/adminService.ts`:

```typescript
import { createFirstAdmin } from './services/adminService';

// Call this function with the user's details
await createFirstAdmin(userId, userName, userEmail);
```

However, this requires adding a temporary UI component or console access to call this function.

### Option 3: Firebase Cloud Function (Advanced)

Create a Cloud Function that can be called to set up the first admin:

```typescript
export const createFirstAdmin = functions.https.onRequest((request, response) => {
  // Validate authorization
  // Update user document
  // Create admin request record
  // Return success
});
```

## Admin Workflow

### Viewing Admin Requests
1. Go to Profile tab
2. Tap "Admin Panel" button (visible only to admins)
3. See all pending admin requests with:
   - User name and email
   - Request date
   - Approve/Reject buttons

### Approving a Request
1. Click the "Approve" button on a request
2. The user will be automatically set as admin
3. Request status changes to "approved"

### Rejecting a Request
1. Click the "Reject" button on a request
2. Enter an optional rejection reason
3. Confirm the rejection
4. The request status changes to "rejected"

## Database Schema

### Users Collection
```typescript
{
  displayName: string;
  isAdmin: boolean;
  adminApprovedAt?: Timestamp;
  adminApprovedBy?: string;
  // ... other user fields
}
```

### Admin Requests Collection
```typescript
{
  userId: string;
  userName: string;
  userEmail: string;
  status: 'pending' | 'approved' | 'rejected';
  requestedAt: Timestamp;
  reviewedAt?: Timestamp;
  reviewedBy?: string;
  rejectionReason?: string;
}
```

## Security Considerations

- Admin status is only fetched from Firestore, not from Firebase Auth custom claims
- The admin panel route checks `isAdmin` before allowing access
- All admin actions are logged with the admin's user ID
- Consider implementing rate limiting for admin operations in production

## Troubleshooting

### Admin Badge Not Showing
- Verify `isAdmin: true` is set in the user's document in Firestore
- Log out and log back in to refresh the auth state
- Check browser console for any errors in AuthContext

### Admin Panel Not Accessible
- Ensure you're logged in as an admin user
- Verify `isAdmin` field is set in Firestore
- Clear app cache and restart the app

### Admin Request Stuck in Pending
- Check Firestore for the adminRequests document
- Verify the status field is exactly "pending"
- Check Firebase rules if requests are being saved properly

## Next Steps

After setting up the first admin account, you can:
1. Log in as admin
2. Review any pending admin requests
3. Set up other admins by approving their requests through the Admin Panel
4. Implement additional admin features as needed (e.g., user management, analytics dashboard)
