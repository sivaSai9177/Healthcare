-- Create organization join requests table
CREATE TABLE IF NOT EXISTS organization_join_request (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organization(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
  
  -- Request details
  requested_role VARCHAR(50) NOT NULL DEFAULT 'member',
  message TEXT,
  
  -- Status tracking
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'cancelled')),
  
  -- Review details
  reviewed_by TEXT REFERENCES "user"(id),
  reviewed_at TIMESTAMP,
  review_note TEXT,
  
  -- Auto-approval settings
  auto_approved BOOLEAN NOT NULL DEFAULT FALSE,
  
  -- Timestamps
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX idx_unique_join_request ON organization_join_request(organization_id, user_id);
CREATE INDEX idx_request_org_id ON organization_join_request(organization_id);
CREATE INDEX idx_request_user_id ON organization_join_request(user_id);
CREATE INDEX idx_request_status ON organization_join_request(status);
CREATE INDEX idx_request_created_at ON organization_join_request(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_organization_join_request_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER organization_join_request_updated_at
  BEFORE UPDATE ON organization_join_request
  FOR EACH ROW
  EXECUTE FUNCTION update_organization_join_request_updated_at();

-- Add permissions for the table
GRANT SELECT, INSERT, UPDATE, DELETE ON organization_join_request TO authenticated;