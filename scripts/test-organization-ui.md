# Organization UI Testing Guide

## Prerequisites
1. Database migration completed ✅
2. Test organization created ✅
3. App running with `bun run local:healthcare` ✅

## Test Scenarios

### 1. Access Organization Dashboard

1. **Login as Admin/Manager**
   - Email: `saipramod273@gmail.com`
   - Password: any password
   - Role: Head Doctor (should have admin privileges)

2. **Navigate to Organization**
   - On web: Look for "Organization" in the sidebar
   - On mobile: Check the Organization tab in bottom navigation
   - Direct URL: http://localhost:8081/(home)/organization-dashboard

### 2. Test Organization Features

#### A. View Organization Overview
- Check the organization overview block shows:
  - Organization name: "Test Healthcare Organization"
  - Plan: Pro
  - Members: 1
  - Storage usage

#### B. Member Management
- View member list
- Should see yourself as "owner"
- Try the search/filter functionality

#### C. Quick Actions
- Test "Settings" quick action
- Should navigate to organization settings

#### D. Create New Organization
- Click "New Org" in quick actions
- Or navigate to: http://localhost:8081/(home)/create-organization
- Test the 5-step wizard:
  1. Choose organization type
  2. Enter basic information
  3. Set preferences
  4. Invite team members
  5. Review and create

### 3. Test Organization Settings

Navigate to: http://localhost:8081/(home)/organization-settings

#### Tabs to Test:
1. **General Settings**
   - Edit organization name
   - Update industry
   - Change website
   - Modify description

2. **Security Settings**
   - Toggle 2FA requirement
   - Set guest access
   - Configure password policy
   - Add domain restrictions

3. **Notifications**
   - Configure email preferences
   - Set in-app notifications
   - Choose notification frequency

4. **Features**
   - Toggle feature flags
   - Note plan restrictions

### 4. Test Join by Code

1. Use the generated code: `TEST-E2M0DX`
2. Login as a different user (e.g., `johndoe@gmail.com`)
3. The join by code feature should be accessible from:
   - Organization dashboard
   - Or through API endpoint

### 5. Expected Results

✅ **Working Features:**
- Organization dashboard displays correctly
- Member list shows current members
- Settings can be viewed and updated
- Activity log tracks all actions
- Role-based access control works

⚠️ **Known Limitations:**
- Email invitations not sent (no email service configured)
- Some metrics may show mock data
- Real-time updates use polling (not WebSocket)

### 6. API Testing via Browser Console

Open browser console and test:

```javascript
// Get current organization
const org = await window.api.organization.listUserOrganizations.query({});
console.log('My organizations:', org);

// Get organization details
const orgId = '11d80e94-1007-4815-9ac6-ca70f051aca2';
const details = await window.api.organization.get.query({ organizationId: orgId });
console.log('Organization details:', details);

// Get members
const members = await window.api.organization.getMembers.query({ 
  organizationId: orgId,
  page: 1,
  limit: 10 
});
console.log('Members:', members);
```

## Troubleshooting

### Can't see Organization tab?
- Ensure you're logged in as admin or manager role
- Clear browser cache
- Check console for errors

### API errors?
- Check browser console for detailed errors
- Verify you're using the correct organization ID
- Ensure you have proper permissions

### UI not updating?
- The app uses polling for real-time updates
- Refresh the page to see latest changes
- Check network tab for API calls

---

Organization ID: `11d80e94-1007-4815-9ac6-ca70f051aca2`
Join Code: `TEST-E2M0DX`