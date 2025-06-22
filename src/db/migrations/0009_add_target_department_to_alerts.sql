-- Add target_department column to alerts table
ALTER TABLE alerts 
ADD COLUMN IF NOT EXISTS target_department department_type;

-- Add index for better query performance on department filtering
CREATE INDEX IF NOT EXISTS idx_alerts_target_department ON alerts(target_department);