# Healthcare API Implementation Guide

## Overview
The healthcare API provides comprehensive endpoints for patient management, alert operations, and real-time monitoring in a hospital environment.

## Database Schema

### Core Tables
- **users** - Base user authentication (text ID)
- **healthcare_users** - Healthcare-specific user profiles
- **hospitals** - Hospital organizations
- **departments** - Hospital departments
- **patients** - Patient records
- **alerts** - Alert system
- **alert_timeline_events** - Full alert lifecycle tracking

### Key Relationships
- All user references use `text` type to match the auth system
- Hospitals and other entities use `uuid` for IDs
- Patient records link to doctors, nurses, and departments
- Alerts track full lifecycle with timeline events

## API Endpoints

### Patient Management (`/api/trpc/patient.*`)

#### Create Patient
```typescript
trpc.patient.createPatient.mutate({
  mrn: "MRN-001",
  name: "John Doe",
  dateOfBirth: new Date("1980-01-01"),
  gender: "male",
  bloodType: "O+",
  roomNumber: "101",
  admissionDate: new Date(),
  primaryDiagnosis: "Observation",
  allergies: ["Penicillin"],
  emergencyContact: {
    name: "Jane Doe",
    relationship: "Spouse",
    phone: "555-1234"
  }
})
```

#### Get Patient Details
```typescript
trpc.patient.getDetails.query({ 
  patientId: "uuid" 
})
// Returns: patient info, care team, active alerts
```

#### Record Vitals
```typescript
trpc.patient.recordVitals.mutate({
  patientId: "uuid",
  heartRate: 72,
  bloodPressureSystolic: 120,
  bloodPressureDiastolic: 80,
  temperature: "98.6",
  respiratoryRate: 16,
  oxygenSaturation: 98
})
// Automatically checks for critical values
```

#### Get Vitals History
```typescript
trpc.patient.getVitalsHistory.query({
  patientId: "uuid",
  timeRange: "24h" // 1h, 6h, 24h, 72h
})
// Returns: current vitals, history, statistics
```

### Alert Management (`/api/trpc/healthcare.*`)

#### Create Alert
```typescript
trpc.healthcare.createAlert.mutate({
  roomNumber: "101",
  alertType: "medical_emergency",
  urgencyLevel: 3, // 1-5 (critical to info)
  description: "Patient requires attention",
  patientId: "uuid" // optional
})
```

#### Acknowledge Alert
```typescript
trpc.healthcare.acknowledgeAlert.mutate({
  alertId: "uuid",
  notes: "Responding to alert"
})
```

#### Get Alert Timeline
```typescript
trpc.healthcare.getAlertTimeline.query({
  alertId: "uuid"
})
// Returns complete event history
```

#### Get Alerts Dashboard
```typescript
trpc.healthcare.getAlertsDashboard.query()
// Returns: metrics, active alerts, recent activity
```

## Permission System

### Role-Based Access
- **admin**: Full system access
- **head_doctor**: Department management, analytics
- **doctor**: Patient care, alert acknowledgment
- **nurse**: Alert response, vitals recording
- **operator**: Alert creation, monitoring

### Permission Procedures
```typescript
// Protected routes use permission-based procedures
const viewPatientsProcedure = createPermissionProcedure('view_patients');
const managePatientsProcedure = createPermissionProcedure('manage_patients');
```

## Local Development Setup

### 1. Start Docker PostgreSQL
```bash
bun run db:local:up
```

### 2. Push Schema
```bash
APP_ENV=local bun run db:push:local
```

### 3. Create Test Data
```bash
bun run scripts/create-test-healthcare-data.ts
```

### 4. Test Connection
```bash
bun run scripts/test-db-connection.ts
```

## Test Users
- **Dr. Sarah Johnson** (sarah.johnson@hospital.com) - doctor
- **Nurse Emily Davis** (emily.davis@hospital.com) - nurse
- **Dr. Michael Chen** (michael.chen@hospital.com) - head_doctor
- **Operator John Smith** (john.smith@hospital.com) - operator

## Critical Features

### Automatic Escalation
Alerts automatically escalate through tiers:
1. Nurse (2 min) → Doctor (3 min) → Head Doctor (2 min) → All Staff

### Vital Monitoring
System automatically detects critical vitals:
- Heart rate: <40 or >150 bpm
- Blood pressure: >180/110 or <90/60
- Oxygen: <90%
- Temperature: >39.5°C or <35°C

### Audit Logging
All actions are logged for HIPAA compliance:
- Patient data access
- Alert lifecycle events
- Vital recordings
- Care team changes

## Next Steps
1. Implement WebSocket subscriptions for real-time updates
2. Add notification service (push, SMS, email)
3. Create UI components for alert timeline
4. Build role-based dashboards