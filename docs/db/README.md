# Database Documentation

This directory contains comprehensive documentation for the database schema and data flows of the healthcare alert system.

## Contents

### 1. [Healthcare Entity Relationship Diagram](./healthcare-erd.md)
Detailed ERD showing all database tables and their relationships including:
- User and Healthcare User tables
- Patient management tables
- Alert system tables
- Care team assignments
- Audit and tracking tables

### 2. [Healthcare Data Flow Diagrams](./healthcare-dataflow.md)
Multiple data flow diagrams illustrating:
- Alert creation and management flow
- Alert lifecycle state machine
- Real-time alert distribution sequence
- Patient-alert association flow
- Audit and compliance tracking

## Quick Overview

### Core Entities

1. **Users & Healthcare Users**
   - Base authentication and authorization
   - Healthcare-specific extensions (license, department, shifts)

2. **Patients**
   - Medical records (MRN, vitals, diagnoses)
   - Care team assignments
   - Alert associations

3. **Alerts**
   - Emergency and medical alerts
   - Department-based routing
   - Escalation management
   - Real-time distribution

### Key Relationships

- **Users ↔ Patients**: Through care team assignments and direct relationships (primary doctor, attending nurse)
- **Alerts ↔ Patients**: Many-to-many through `patient_alerts` junction table
- **Alerts ↔ Users**: Creation, acknowledgment, and resolution tracking
- **Hospital ↔ All Entities**: Multi-tenant architecture with hospital-based isolation

### Design Principles

1. **Audit Trail**: Comprehensive logging of all actions
2. **Real-time Updates**: WebSocket-based notifications
3. **Scalability**: Redis caching and efficient indexing
4. **Compliance**: Healthcare regulatory requirements
5. **Multi-tenancy**: Hospital and organization-based data isolation

## Database Technologies

- **PostgreSQL**: Primary database
- **Drizzle ORM**: Type-safe database queries
- **Redis**: Caching and real-time features
- **WebSocket**: Real-time alert distribution

## Related Documentation

- [API Documentation](../api/healthcare-api-implementation.md)
- [Healthcare Module](../modules/healthcare/README.md)
- [Architecture Overview](../architecture/overview.md)