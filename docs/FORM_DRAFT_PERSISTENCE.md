# Form Draft Persistence Documentation

## Overview

Form draft persistence automatically saves user input as they type, preventing data loss from crashes, accidental navigation, or interruptions. This is especially critical in healthcare settings where interruptions are common.

## How It Works

### 1. **Storage Layer** (`/lib/storage/draft-storage.ts`)
- **Native Platforms (iOS/Android)**: Uses AsyncStorage
- **Web Platform**: Uses localStorage
- **Automatic platform detection**: No configuration needed
- **Draft expiry**: 24 hours (configurable)
- **Version control**: Prevents incompatible draft restoration

### 2. **React Hook** (`/hooks/useFormDraft.ts`)
- Integrates with react-hook-form
- Auto-saves on form value changes with debouncing
- Restores drafts on component mount
- Shows user-friendly notifications
- Handles draft clearing on successful submission

### 3. **Implementation Examples**

#### Shift Handover Form
```typescript
// In ShiftHandoverForm.tsx
const { saveDraft, clearDraft, draftAge, isRestoring } = useFormDraft({
  formKey: 'shift-handover',
  watch,
  reset,
  autoSaveDelay: 1500, // Save every 1.5 seconds
  showRestoreNotification: true,
  onDraftRestored: (data) => {
    logger.healthcare.info('Draft restored', { 
      hasNotes: !!data.notes 
    });
  },
});

// Clear draft on successful submission
const onSubmit = async (data) => {
  await clearDraft();
  // ... submit logic
};
```

#### Alert Creation Form
```typescript
// In AlertCreationFormSimplified.tsx
const { saveDraft, clearDraft, draftAge, isRestoring } = useFormDraft({
  formKey: 'alert-creation',
  watch,
  reset,
  autoSaveDelay: 1000,
  excludeFields: [], // Save all fields
  showRestoreNotification: true,
});
```

## Features

### 1. **User Feedback**
- Shows "Draft saved" indicator with age
- Displays loading state during restoration
- Optional toast notification when draft is restored

### 2. **Smart Behavior**
- Only saves non-empty forms
- Excludes sensitive fields (configurable)
- User-specific drafts (tied to user ID)
- Automatic cleanup on logout

### 3. **Error Resilience**
- Graceful handling of storage errors
- Doesn't break app if storage fails
- Corrupted drafts are automatically removed

## Testing the Feature

### Manual Testing Steps:

1. **Test Draft Save**:
   - Start filling out the Shift Handover form
   - Type some notes (e.g., "Patient in room 302...")
   - Wait 2 seconds
   - You should see "Draft saved" indicator

2. **Test Draft Restoration**:
   - Fill out part of a form
   - Force close the app (or refresh on web)
   - Reopen and navigate back to the form
   - You should see "Draft Restored" notification
   - Form should contain your previous input

3. **Test Draft Clearing**:
   - Fill and submit a form successfully
   - Navigate away and come back
   - Form should be empty (draft was cleared)

4. **Test Logout Behavior**:
   - Fill out a form partially
   - Log out
   - Log back in
   - Draft should be cleared (security feature)

### Platform-Specific Testing:

**iOS/Android**:
```bash
# Kill app completely
# iOS: Double-tap home, swipe up on app
# Android: Recent apps, swipe away

# Reopen app and check draft restoration
```

**Web**:
```javascript
// Check localStorage in DevTools
localStorage.getItem('draft:userId:form-key')
```

## Best Practices

1. **Form Keys**: Use descriptive, unique keys
   ```typescript
   formKey: 'shift-handover' // Good
   formKey: 'form1' // Bad
   ```

2. **Exclude Sensitive Data**:
   ```typescript
   excludeFields: ['password', 'ssn', 'creditCard']
   ```

3. **Auto-save Delay**: Balance between performance and data safety
   - Quick forms: 1000ms (1 second)
   - Long forms: 2000-3000ms
   - Heavy forms: 3000-5000ms

4. **User Communication**: Always show draft status
   ```typescript
   {draftAge && (
     <Text size="xs">Draft saved {draftAge} min ago</Text>
   )}
   ```

## Troubleshooting

### Draft Not Saving:
1. Check browser console for storage errors
2. Verify form has non-empty values
3. Check if storage quota is exceeded
4. Ensure form key is unique

### Draft Not Restoring:
1. Verify draft hasn't expired (24hr default)
2. Check if user ID matches
3. Look for version mismatch warnings
4. Ensure `reset` function is provided

### Performance Issues:
1. Increase `autoSaveDelay`
2. Exclude large fields (e.g., base64 images)
3. Limit draft size to essential fields

## Security Considerations

1. **User-Specific Drafts**: Each user's drafts are isolated
2. **Automatic Cleanup**: Drafts cleared on logout
3. **Expiration**: 24-hour default expiry
4. **No Sensitive Data**: Use `excludeFields` for passwords, etc.
5. **Local Storage Only**: Drafts never sent to server

## Future Enhancements

1. **Selective Field Saving**: Save only modified fields
2. **Conflict Resolution**: Handle multiple draft versions
3. **Cloud Sync**: Optional server-side draft backup
4. **Compression**: For large forms with lots of data
5. **Analytics**: Track draft usage patterns