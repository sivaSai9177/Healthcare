# Healthcare System Entity Relationship Diagram

This document illustrates the database schema relationships for the healthcare alert system.

## Entity Relationship Diagram

```mermaid
erDiagram
    USERS ||--o| HEALTHCARE_USERS : extends
    USERS ||--o{ ALERTS : creates
    USERS ||--o{ ALERT_ACKNOWLEDGMENTS : acknowledges
    USERS ||--o{ CARE_TEAM_ASSIGNMENTS : assigned_to
    USERS ||--o{ PATIENT_VITALS : records
    USERS ||--o{ ALERT_TIMELINE_EVENTS : performs
    
    HEALTHCARE_USERS ||--|| HOSPITALS : belongs_to
    
    PATIENTS ||--o{ PATIENT_ALERTS : has
    PATIENTS ||--o{ PATIENT_VITALS : monitored_by
    PATIENTS ||--o{ CARE_TEAM_ASSIGNMENTS : cared_by
    PATIENTS }o--|| HOSPITALS : admitted_to
    PATIENTS }o--o| DEPARTMENTS : assigned_to
    PATIENTS }o--o| USERS : primary_doctor
    PATIENTS }o--o| USERS : attending_nurse
    
    ALERTS ||--o{ PATIENT_ALERTS : linked_to
    ALERTS ||--o{ ALERT_ACKNOWLEDGMENTS : acknowledged_by
    ALERTS ||--o{ ALERT_ESCALATIONS : escalated_through
    ALERTS ||--o{ ALERT_TIMELINE_EVENTS : tracked_by
    ALERTS }o--|| HOSPITALS : created_at
    ALERTS }o--o| DEPARTMENTS : targeted_to
    
    HOSPITALS ||--o{ DEPARTMENTS : contains
    
    USERS {
        string id PK
        string email UK
        string name
        string role
        string organizationId FK
        string defaultHospitalId FK
        timestamp createdAt
        timestamp updatedAt
    }
    
    HEALTHCARE_USERS {
        string userId PK,FK
        string hospitalId FK
        string licenseNumber
        string department
        string specialization
        boolean isOnDuty
        timestamp shiftStartTime
        timestamp shiftEndTime
    }
    
    HOSPITALS {
        uuid id PK
        uuid organizationId FK
        string name
        string code UK
        text address
        jsonb contactInfo
        jsonb settings
        boolean isActive
        boolean isDefault
        timestamp createdAt
        timestamp updatedAt
    }
    
    DEPARTMENTS {
        uuid id PK
        uuid hospitalId FK
        string name
        text description
        string headDoctorId FK
        boolean isActive
        timestamp createdAt
    }
    
    PATIENTS {
        uuid id PK
        string mrn UK
        string name
        timestamp dateOfBirth
        string gender
        string bloodType
        string roomNumber
        string bedNumber
        timestamp admissionDate
        timestamp dischargeDate
        text primaryDiagnosis
        jsonb secondaryDiagnoses
        jsonb allergies
        jsonb medications
        jsonb emergencyContact
        jsonb insuranceInfo
        jsonb flags
        uuid hospitalId FK
        uuid departmentId FK
        string primaryDoctorId FK
        string attendingNurseId FK
        boolean isActive
        timestamp createdAt
        timestamp updatedAt
    }
    
    ALERTS {
        uuid id PK
        string roomNumber
        string alertType
        integer urgencyLevel
        text description
        string createdBy FK
        timestamp createdAt
        string status
        string targetDepartment
        string acknowledgedBy FK
        timestamp acknowledgedAt
        integer escalationLevel
        integer currentEscalationTier
        timestamp nextEscalationAt
        timestamp resolvedAt
        uuid hospitalId FK
        uuid patientId FK
        text handoverNotes
        jsonb responseMetrics
    }
    
    PATIENT_ALERTS {
        uuid id PK
        uuid patientId FK
        uuid alertId FK
        boolean isActive
        timestamp createdAt
    }
    
    ALERT_ACKNOWLEDGMENTS {
        uuid id PK
        uuid alertId FK
        string userId FK
        timestamp acknowledgedAt
        integer responseTimeSeconds
        text notes
        string urgencyAssessment
        string responseAction
        integer estimatedResponseTime
        string delegatedTo FK
    }
    
    CARE_TEAM_ASSIGNMENTS {
        uuid id PK
        uuid patientId FK
        string userId FK
        string role
        timestamp assignedAt
        timestamp unassignedAt
        boolean isActive
        text notes
    }
    
    PATIENT_VITALS {
        uuid id PK
        uuid patientId FK
        timestamp recordedAt
        string recordedBy FK
        integer heartRate
        integer bloodPressureSystolic
        integer bloodPressureDiastolic
        string temperature
        integer respiratoryRate
        integer oxygenSaturation
        integer bloodGlucose
        integer pain
        text notes
        jsonb metadata
    }
    
    ALERT_ESCALATIONS {
        uuid id PK
        uuid alertId FK
        string from_role
        string to_role
        timestamp escalatedAt
        string reason
    }
    
    ALERT_TIMELINE_EVENTS {
        uuid id PK
        uuid alertId FK
        string eventType
        timestamp eventTime
        string userId FK
        text description
        jsonb metadata
    }
```

## Key Relationships

### 1. User Relationships
- **Users → Healthcare Users**: One-to-one extension relationship for medical-specific fields
- **Users → Patients**: 
  - One-to-many as primary doctor
  - One-to-many as attending nurse
- **Users → Care Team Assignments**: One-to-many (a user can be assigned to multiple patients)
- **Users → Alerts**: One-to-many (users create and acknowledge alerts)

### 2. Patient Relationships
- **Patients → Hospital**: Many-to-one (patients belong to a hospital)
- **Patients → Department**: Many-to-one optional (patients may be assigned to departments)
- **Patients → Care Team**: One-to-many (through care team assignments)
- **Patients → Alerts**: Many-to-many (through patient_alerts junction table)
- **Patients → Vitals**: One-to-many (continuous monitoring)

### 3. Alert Relationships
- **Alerts → Hospital**: Many-to-one (alerts are hospital-specific)
- **Alerts → Patients**: Many-to-many (an alert can involve multiple patients)
- **Alerts → Department**: Many-to-one optional (targeted to specific departments)
- **Alerts → Acknowledgments**: One-to-many (multiple acknowledgments possible)
- **Alerts → Timeline Events**: One-to-many (full lifecycle tracking)
- **Alerts → Escalations**: One-to-many (escalation history)

### 4. Hospital & Department Relationships
- **Hospital → Departments**: One-to-many
- **Hospital → Healthcare Users**: One-to-many
- **Hospital → Patients**: One-to-many

## Notable Design Patterns

1. **Junction Tables**: `patient_alerts` enables many-to-many relationships between patients and alerts
2. **Audit Trail**: `alert_timeline_events` and `healthcare_audit_logs` provide comprehensive tracking
3. **Soft Deletes**: Most entities use `isActive` flags rather than hard deletes
4. **JSON Fields**: Flexible storage for metadata, settings, and complex medical data
5. **Role-Based Access**: User roles and department assignments control access and routing

## Index Strategy
The schema includes strategic indexes on:
- Foreign key relationships
- Status and department combinations for alert queries
- Organization and default flags for hospital lookups
- Response action and delegation for acknowledgment queries