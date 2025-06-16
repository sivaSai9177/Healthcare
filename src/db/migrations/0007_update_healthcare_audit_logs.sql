-- Update healthcare_audit_logs action check constraint to include shift events
ALTER TABLE healthcare_audit_logs DROP CONSTRAINT IF EXISTS action_check;

ALTER TABLE healthcare_audit_logs ADD CONSTRAINT action_check 
CHECK (action IN ('alert_created', 'alert_acknowledged', 'alert_escalated', 'alert_resolved', 'alert_transferred', 'bulk_alert_acknowledged', 'user_login', 'user_logout', 'permission_changed', 'role_changed', 'patient_created', 'patient_updated', 'patient_discharged', 'vitals_recorded', 'care_team_assigned', 'shift_started', 'shift_ended'));