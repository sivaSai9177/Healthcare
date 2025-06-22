# Organization Flow Guide

## Overview
This guide explains how organizations work in the Hospital Alert System, including creation, joining, and management.

## Organization Structure

### 1. Organization Types
- **healthcare**: Medical facilities (hospitals, clinics)
- **business**: Regular companies
- **nonprofit**: Non-profit organizations
- **education**: Educational institutions
- **personal**: Personal workspaces

### 2. User Roles & Organization Permissions

#### Who Can Create Organizations?
- **Admin** ✅: Can create new organizations AND join existing ones
- **Healthcare Users** ❌: Cannot create - must join existing organizations
- **Other Users** ❌: Cannot create - optional to join

#### Who Must Have Organizations?
- **Admin** ✅: Required (can create or join)
- **Doctor** ✅: Required (must join with code)
- **Nurse** ✅: Required (must join with code)
- **Operator** ✅: Required (must join with code)
- **Head Doctor** ✅: Required (must join with code)
- **Manager** ⚠️: Optional (can join later)
- **User/Guest** ⚠️: Optional (can join later)

## Organization Codes

### Code Format
- Pattern: `XXXX-YYYYYY` (e.g., `HOSP-A7B3C9`)
- Prefix: First 4 letters from organization name
- Suffix: 6 random alphanumeric characters

### Code Properties
- **Type**: Can be 'member' or 'admin' invitation
- **Max Uses**: Configurable limit (null = unlimited)
- **Expiration**: Optional expiration date
- **Active Status**: Can be deactivated

### Code Generation
Only users with 'codes.generate' permission can create codes:
- Organization owners
- Organization admins
- Users with specific permission grant

## Profile Completion Flow

### For Admin Users
1. Select "Admin" role
2. Choose to either:
   - Enter organization code to join existing
   - OR create new organization (name required)
3. Complete profile

### For Healthcare Users
1. Select healthcare role (doctor/nurse/operator/head_doctor)
2. Must enter valid organization code
3. Select hospital from organization (if multiple)
4. Select department
5. Complete profile

### For Other Users
1. Select role
2. Organization is optional - can skip
3. Can join organization later from settings

## Database Schema

### Key Tables
1. **organization**: Core organization data
2. **organization_member**: User-organization relationships
3. **organization_code**: Invitation codes
4. **hospitals**: Healthcare facilities within organizations
5. **healthcare_users**: Extended data for healthcare roles

### Member Roles in Organization
- **owner**: Full control, can delete organization
- **admin**: Can manage members, settings, generate codes
- **manager**: Can view analytics, manage some settings
- **member**: Basic access
- **guest**: Limited access

## Common Scenarios

### Scenario 1: Hospital Setup
1. Admin creates organization "City Medical Center"
2. Admin generates organization code: `CITY-X7Y9Z2`
3. Admin shares code with healthcare staff
4. Doctors/nurses join using the code
5. They're automatically assigned to the organization

### Scenario 2: Multi-Hospital Network
1. Admin creates organization "Regional Health Network"
2. Admin adds multiple hospitals:
   - Downtown Medical Center
   - Northside Clinic
   - Southside Emergency
3. Healthcare staff join organization and select their hospital

### Scenario 3: Emergency Services
1. Admin creates "City Emergency Services"
2. Operators join with organization code
3. They handle dispatch for all associated hospitals

## Best Practices

1. **Code Security**
   - Set expiration dates for temporary codes
   - Use max uses limit for controlled access
   - Deactivate codes when no longer needed

2. **Organization Naming**
   - Use clear, descriptive names
   - Include location for multi-site organizations
   - Avoid special characters for better code generation

3. **Hospital Structure**
   - Set one hospital as default per organization
   - Use clear hospital codes for identification
   - Keep hospital names consistent and searchable

## Troubleshooting

### Healthcare User Can't Complete Profile
- Ensure they have a valid organization code
- Check code hasn't expired or reached max uses
- Verify organization is active

### Organization Code Not Working
- Check code is typed correctly (case-sensitive)
- Verify code is still active
- Ensure user role matches code type

### Can't See Organization After Joining
- Check member status is 'active'
- Verify organization status is 'active'
- Ensure proper permissions are set