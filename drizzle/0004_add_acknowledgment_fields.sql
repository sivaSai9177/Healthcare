-- Add new fields to alert_acknowledgments table
ALTER TABLE alert_acknowledgments
ADD COLUMN IF NOT EXISTS urgency_assessment VARCHAR(20),
ADD COLUMN IF NOT EXISTS response_action VARCHAR(20),
ADD COLUMN IF NOT EXISTS estimated_response_time INTEGER,
ADD COLUMN IF NOT EXISTS delegated_to TEXT REFERENCES users(id);

-- Add indexes for better query performance (if not exists)
CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_response_action ON alert_acknowledgments(response_action);
CREATE INDEX IF NOT EXISTS idx_alert_acknowledgments_delegated_to ON alert_acknowledgments(delegated_to);