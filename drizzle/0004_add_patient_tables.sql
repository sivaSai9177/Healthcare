-- Add patient tables
CREATE TABLE IF NOT EXISTS "patients" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "mrn" varchar(20) NOT NULL UNIQUE,
  "name" varchar(255) NOT NULL,
  "date_of_birth" timestamp NOT NULL,
  "gender" varchar(20) NOT NULL,
  "blood_type" varchar(5),
  "room_number" varchar(10),
  "bed_number" varchar(10),
  "admission_date" timestamp NOT NULL,
  "discharge_date" timestamp,
  "primary_diagnosis" text,
  "secondary_diagnoses" jsonb,
  "allergies" jsonb,
  "medications" jsonb,
  "emergency_contact" jsonb,
  "insurance_info" jsonb,
  "flags" jsonb DEFAULT '{}',
  "hospital_id" uuid NOT NULL,
  "department_id" uuid,
  "primary_doctor_id" uuid,
  "attending_nurse_id" uuid,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now(),
  "updated_at" timestamp DEFAULT now(),
  CONSTRAINT "gender_check" CHECK ("gender" IN ('male', 'female', 'other', 'unknown')),
  CONSTRAINT "blood_type_check" CHECK ("blood_type" IN ('A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-') OR "blood_type" IS NULL)
);

CREATE TABLE IF NOT EXISTS "patient_vitals" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL,
  "recorded_at" timestamp DEFAULT now(),
  "recorded_by" uuid NOT NULL,
  "heart_rate" integer,
  "blood_pressure_systolic" integer,
  "blood_pressure_diastolic" integer,
  "temperature" varchar(10),
  "respiratory_rate" integer,
  "oxygen_saturation" integer,
  "blood_glucose" integer,
  "pain" integer,
  "notes" text,
  "metadata" jsonb
);

CREATE TABLE IF NOT EXISTS "care_team_assignments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL,
  "user_id" uuid NOT NULL,
  "role" varchar(50) NOT NULL,
  "assigned_at" timestamp DEFAULT now(),
  "unassigned_at" timestamp,
  "is_active" boolean DEFAULT true,
  "notes" text,
  CONSTRAINT "role_check" CHECK ("role" IN ('primary_doctor', 'attending_nurse', 'specialist', 'resident', 'intern'))
);

-- Add new columns to alerts table
ALTER TABLE "alerts" 
ADD COLUMN IF NOT EXISTS "current_escalation_tier" integer DEFAULT 1,
ADD COLUMN IF NOT EXISTS "patient_id" uuid,
ADD COLUMN IF NOT EXISTS "handover_notes" text,
ADD COLUMN IF NOT EXISTS "response_metrics" jsonb;

-- Add patient_alerts junction table
CREATE TABLE IF NOT EXISTS "patient_alerts" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "patient_id" uuid NOT NULL,
  "alert_id" uuid NOT NULL,
  "is_active" boolean DEFAULT true,
  "created_at" timestamp DEFAULT now()
);

-- Add alert timeline events table
CREATE TABLE IF NOT EXISTS "alert_timeline_events" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "alert_id" uuid NOT NULL,
  "event_type" varchar(50) NOT NULL,
  "event_time" timestamp DEFAULT now(),
  "user_id" uuid,
  "description" text,
  "metadata" jsonb,
  CONSTRAINT "event_type_check" CHECK ("event_type" IN ('created', 'viewed', 'acknowledged', 'escalated', 'transferred', 'resolved', 'reopened', 'commented'))
);

-- Add foreign key constraints
DO $$
BEGIN
  ALTER TABLE "patients" ADD CONSTRAINT "patients_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "patients" ADD CONSTRAINT "patients_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "patients" ADD CONSTRAINT "patients_primary_doctor_id_users_id_fk" FOREIGN KEY ("primary_doctor_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "patients" ADD CONSTRAINT "patients_attending_nurse_id_users_id_fk" FOREIGN KEY ("attending_nurse_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  
  ALTER TABLE "patient_vitals" ADD CONSTRAINT "patient_vitals_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "patient_vitals" ADD CONSTRAINT "patient_vitals_recorded_by_users_id_fk" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  
  ALTER TABLE "care_team_assignments" ADD CONSTRAINT "care_team_assignments_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "care_team_assignments" ADD CONSTRAINT "care_team_assignments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
  
  ALTER TABLE "alerts" ADD CONSTRAINT "alerts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE no action ON UPDATE no action;
  
  ALTER TABLE "patient_alerts" ADD CONSTRAINT "patient_alerts_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "patient_alerts" ADD CONSTRAINT "patient_alerts_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE no action ON UPDATE no action;
  
  ALTER TABLE "alert_timeline_events" ADD CONSTRAINT "alert_timeline_events_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE no action ON UPDATE no action;
  ALTER TABLE "alert_timeline_events" ADD CONSTRAINT "alert_timeline_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS "patients_mrn_idx" ON "patients" ("mrn");
CREATE INDEX IF NOT EXISTS "patients_hospital_id_idx" ON "patients" ("hospital_id");
CREATE INDEX IF NOT EXISTS "patients_room_number_idx" ON "patients" ("room_number");
CREATE INDEX IF NOT EXISTS "patient_vitals_patient_id_idx" ON "patient_vitals" ("patient_id");
CREATE INDEX IF NOT EXISTS "patient_vitals_recorded_at_idx" ON "patient_vitals" ("recorded_at");
CREATE INDEX IF NOT EXISTS "care_team_assignments_patient_id_idx" ON "care_team_assignments" ("patient_id");
CREATE INDEX IF NOT EXISTS "care_team_assignments_user_id_idx" ON "care_team_assignments" ("user_id");
CREATE INDEX IF NOT EXISTS "patient_alerts_patient_id_idx" ON "patient_alerts" ("patient_id");
CREATE INDEX IF NOT EXISTS "patient_alerts_alert_id_idx" ON "patient_alerts" ("alert_id");
CREATE INDEX IF NOT EXISTS "alert_timeline_events_alert_id_idx" ON "alert_timeline_events" ("alert_id");
CREATE INDEX IF NOT EXISTS "alert_timeline_events_event_time_idx" ON "alert_timeline_events" ("event_time");