# Healthcare System Data Flow Diagrams

This document illustrates the data flow for key processes in the healthcare alert system.

## Alert Creation and Management Flow

```mermaid
flowchart TD
    %% Actors
    HU[Healthcare User/Operator]
    Doc[Doctor]
    Nurse[Nurse]
    System[System]
    
    %% Data Stores
    DB[(Database)]
    WS[WebSocket Server]
    Redis[(Redis Cache)]
    
    %% Alert Creation Flow
    HU -->|Creates Alert| CreateAlert[Create Alert API]
    CreateAlert -->|Validate Permissions| CheckPerms{Has create_alert permission?}
    CheckPerms -->|No| Denied[Access Denied]
    CheckPerms -->|Yes| ValidateData[Validate Alert Data]
    ValidateData -->|Invalid| ValidationError[Return Validation Error]
    ValidateData -->|Valid| SaveAlert[Save to Alerts Table]
    
    SaveAlert -->|Store| DB
    SaveAlert -->|If Patient Linked| LinkPatient[Create Patient Alert Record]
    LinkPatient -->|Store| DB
    
    SaveAlert -->|Create Timeline Event| TimelineEvent[Alert Created Event]
    TimelineEvent -->|Store| DB
    
    SaveAlert -->|Trigger| NotifySystem[Notification System]
    NotifySystem -->|Broadcast| WS
    NotifySystem -->|Cache| Redis
    NotifySystem -->|Based on Department/Urgency| TargetUsers[Target Healthcare Users]
    
    %% Alert Acknowledgment Flow
    Doc -->|Views Alert| GetAlerts[Get Active Alerts API]
    GetAlerts -->|Query by Department/Role| DB
    DB -->|Return Alerts| AlertList[Alert List]
    
    Doc -->|Acknowledges| AckAlert[Acknowledge Alert API]
    AckAlert -->|Validate| CheckAckPerms{Has acknowledge_alerts permission?}
    CheckAckPerms -->|No| Denied
    CheckAckPerms -->|Yes| CreateAck[Create Acknowledgment Record]
    
    CreateAck -->|Store| DB
    CreateAck -->|Update Alert Status| UpdateAlert[Update Alert Table]
    UpdateAlert -->|Set acknowledged_by, acknowledged_at| DB
    
    CreateAck -->|Create Timeline Event| AckEvent[Alert Acknowledged Event]
    AckEvent -->|Store| DB
    
    CreateAck -->|Stop Escalation Timer| StopTimer[Cancel Escalation]
    StopTimer -->|Update Redis| Redis
    
    %% Alert Escalation Flow
    System -->|Monitor Unacknowledged| EscalationTimer[Escalation Timer Service]
    EscalationTimer -->|Check Redis| Redis
    Redis -->|Unacknowledged Alerts| CheckEscalation{Time Exceeded?}
    CheckEscalation -->|No| Wait[Continue Monitoring]
    CheckEscalation -->|Yes| Escalate[Trigger Escalation]
    
    Escalate -->|Create Escalation Record| EscRecord[Alert Escalation Entry]
    EscRecord -->|Store| DB
    
    Escalate -->|Update Alert| UpdateEscLevel[Increment Escalation Level]
    UpdateEscLevel -->|Store| DB
    
    Escalate -->|Notify Next Tier| NotifyHigher[Notify Senior Staff]
    NotifyHigher -->|Broadcast| WS
    
    %% Patient Care Team Assignment
    Doc -->|Assign to Patient| AssignCare[Assign Care Team API]
    AssignCare -->|Validate| CheckAssignPerms{Has manage_patients permission?}
    CheckAssignPerms -->|No| Denied
    CheckAssignPerms -->|Yes| DeactivateOld[Deactivate Previous Assignment]
    
    DeactivateOld -->|Update| DB
    DeactivateOld -->|Create New| NewAssignment[Create Care Team Assignment]
    NewAssignment -->|Store| DB
    
    NewAssignment -->|If Primary Role| UpdatePatient[Update Patient Record]
    UpdatePatient -->|Set primaryDoctorId/attendingNurseId| DB
    
    NewAssignment -->|Log| AuditLog[Healthcare Audit Log]
    AuditLog -->|Store| DB
```

## Alert Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> Created: Healthcare User Creates Alert
    
    Created --> Active: Alert Saved to Database
    Active --> Acknowledged: Healthcare Professional Acknowledges
    Active --> Escalated: No Acknowledgment Within Time Limit
    
    Acknowledged --> InProgress: Professional Responds
    Acknowledged --> Delegated: Assigned to Another User
    Acknowledged --> Resolved: Issue Addressed
    
    Escalated --> Acknowledged: Senior Staff Acknowledges
    Escalated --> HigherEscalation: Still No Response
    
    Delegated --> InProgress: Delegated User Responds
    Delegated --> Resolved: Delegated User Resolves
    
    InProgress --> Resolved: Issue Resolved
    InProgress --> Escalated: Unable to Handle
    
    HigherEscalation --> CriticalAlert: Maximum Escalation Reached
    CriticalAlert --> Acknowledged: Emergency Response
    
    Resolved --> [*]: Alert Closed
    
    note right of Active
        - Triggers WebSocket notifications
        - Starts escalation timer
        - Creates timeline event
    end note
    
    note right of Acknowledged
        - Stops escalation timer
        - Records response time
        - Updates metrics
    end note
    
    note right of Escalated
        - Notifies next tier
        - Creates escalation record
        - Updates urgency level
    end note
```

## Real-time Alert Distribution Flow

```mermaid
sequenceDiagram
    participant O as Operator
    participant API as API Server
    participant DB as Database
    participant Redis as Redis
    participant WS as WebSocket Server
    participant D1 as Doctor 1
    participant D2 as Doctor 2
    participant N as Nurse
    
    O->>API: Create Alert (Room 305, Code Blue)
    API->>DB: Save Alert Record
    API->>DB: Create Timeline Event
    API->>Redis: Cache Alert Data
    API->>Redis: Set Escalation Timer
    
    API->>WS: Broadcast Alert Event
    
    par Notify Healthcare Staff
        WS->>D1: Alert Notification (Cardiology)
        WS->>D2: Alert Notification (Cardiology)
        WS->>N: Alert Notification (ICU)
    end
    
    D1->>API: Acknowledge Alert
    API->>DB: Create Acknowledgment Record
    API->>DB: Update Alert Status
    API->>Redis: Clear Escalation Timer
    
    API->>WS: Broadcast Acknowledgment
    
    par Update Others
        WS->>D2: Alert Acknowledged by D1
        WS->>N: Alert Acknowledged by D1
        WS->>O: Alert Acknowledged
    end
    
    D1->>API: Update Alert (Responding, ETA 2 min)
    API->>DB: Create Timeline Event
    API->>WS: Broadcast Update
    
    D1->>API: Resolve Alert
    API->>DB: Update Alert Status
    API->>DB: Record Resolution Time
    API->>WS: Broadcast Resolution
```

## Patient-Alert Association Flow

```mermaid
flowchart LR
    subgraph Alert Creation
        A1[Create Alert] --> A2{Link to Patient?}
        A2 -->|Yes| A3[Get Patient ID]
        A2 -->|No| A4[General Alert]
        A3 --> A5[Create Patient Alert Link]
        A5 --> A6[Store in patient_alerts]
    end
    
    subgraph Alert Retrieval
        B1[Get Patient Details] --> B2[Query patient_alerts]
        B2 --> B3[Join with alerts table]
        B3 --> B4[Filter Active Alerts]
        B4 --> B5[Return Alert List]
    end
    
    subgraph Care Team Notification
        C1[Alert Created] --> C2[Find Patient]
        C2 --> C3[Get Care Team]
        C3 --> C4[Query care_team_assignments]
        C4 --> C5[Get Active Assignments]
        C5 --> C6[Notify Care Team Members]
    end
    
    A6 --> B2
    A6 --> C2
```

## Audit and Compliance Flow

```mermaid
flowchart TD
    subgraph User Actions
        UA1[Any User Action]
        UA2[Alert Actions]
        UA3[Patient Actions]
        UA4[Auth Actions]
    end
    
    subgraph Audit System
        AS1[Capture Action Details]
        AS2[Add Metadata]
        AS3[Add Timestamp]
        AS4[Add User Context]
    end
    
    subgraph Storage
        DB1[(Healthcare Audit Logs)]
        DB2[(Alert Timeline Events)]
    end
    
    UA1 --> AS1
    UA2 --> AS1
    UA3 --> AS1
    UA4 --> AS1
    
    AS1 --> AS2
    AS2 --> AS3
    AS3 --> AS4
    
    AS4 --> DB1
    UA2 --> DB2
    
    subgraph Compliance Reporting
        CR1[Generate Reports]
        CR2[Track Response Times]
        CR3[Monitor Escalations]
        CR4[User Activity Logs]
    end
    
    DB1 --> CR1
    DB1 --> CR4
    DB2 --> CR2
    DB2 --> CR3
```

## Key Data Flow Patterns

### 1. **Permission-Based Access**
- All operations check user permissions before execution
- Healthcare-specific permissions extend base user roles
- Department-based filtering for alerts

### 2. **Real-time Updates**
- WebSocket broadcasts for immediate notification
- Redis caching for performance
- Subscription-based updates for active users

### 3. **Escalation Management**
- Timer-based escalation using Redis
- Automatic tier progression
- Configurable escalation rules per alert type

### 4. **Audit Trail**
- Every action creates audit log entries
- Alert-specific timeline events
- Complete traceability for compliance

### 5. **Response Metrics**
- Automatic response time calculation
- Performance tracking per user/department
- Aggregated metrics for reporting