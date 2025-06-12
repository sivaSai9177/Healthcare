-- Create healthcare-specific tables

-- Healthcare users extension
CREATE TABLE "healthcare_users" (
	"user_id" text PRIMARY KEY NOT NULL,
	"hospital_id" varchar(255) NOT NULL,
	"license_number" varchar(100),
	"department" varchar(100),
	"specialization" varchar(100),
	"is_on_duty" boolean DEFAULT false,
	"shift_start_time" timestamp,
	"shift_end_time" timestamp
);
--> statement-breakpoint

-- Hospitals/Organizations
CREATE TABLE "hospitals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" text,
	"contact_info" jsonb,
	"settings" jsonb,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Alert type enum
CREATE TABLE "alert_type_enum" (
	"value" varchar(50) PRIMARY KEY NOT NULL
);
--> statement-breakpoint

-- Alerts table
CREATE TABLE "alerts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"room_number" varchar(10) NOT NULL,
	"alert_type" varchar(50) NOT NULL,
	"urgency_level" integer NOT NULL,
	"description" text,
	"created_by" text NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"acknowledged_by" text,
	"acknowledged_at" timestamp,
	"escalation_level" integer DEFAULT 1,
	"next_escalation_at" timestamp,
	"resolved_at" timestamp,
	"hospital_id" uuid NOT NULL,
	"updated_at" timestamp DEFAULT now(),
	CONSTRAINT "alert_type_check" CHECK ("alert_type" IN ('cardiac_arrest', 'code_blue', 'fire', 'security', 'medical_emergency')),
	CONSTRAINT "urgency_level_check" CHECK ("urgency_level" >= 1 AND "urgency_level" <= 5),
	CONSTRAINT "status_check" CHECK ("status" IN ('active', 'acknowledged', 'resolved', 'cancelled'))
);
--> statement-breakpoint

-- Alert escalations
CREATE TABLE "alert_escalations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"from_role" varchar(50) NOT NULL,
	"to_role" varchar(50) NOT NULL,
	"escalated_at" timestamp DEFAULT now(),
	"reason" varchar(255)
);
--> statement-breakpoint

-- Alert acknowledgments
CREATE TABLE "alert_acknowledgments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"user_id" text NOT NULL,
	"acknowledged_at" timestamp DEFAULT now(),
	"response_time_seconds" integer NOT NULL,
	"notes" text
);
--> statement-breakpoint

-- Notification logs
CREATE TABLE "notification_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"alert_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"notification_type" varchar(20) NOT NULL,
	"sent_at" timestamp DEFAULT now(),
	"delivered_at" timestamp,
	"opened_at" timestamp,
	"status" varchar(20) NOT NULL,
	"error_message" text,
	CONSTRAINT "notification_type_check" CHECK ("notification_type" IN ('push', 'sms', 'email', 'in_app')),
	CONSTRAINT "status_check" CHECK ("status" IN ('sent', 'delivered', 'failed', 'opened'))
);
--> statement-breakpoint

-- Healthcare audit logs
CREATE TABLE "healthcare_audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"entity_type" varchar(50) NOT NULL,
	"entity_id" uuid NOT NULL,
	"timestamp" timestamp DEFAULT now(),
	"metadata" jsonb,
	"success" boolean DEFAULT true,
	"error_message" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"hospital_id" uuid,
	CONSTRAINT "action_check" CHECK ("action" IN ('alert_created', 'alert_acknowledged', 'alert_escalated', 'alert_resolved', 'user_login', 'user_logout', 'permission_changed', 'role_changed')),
	CONSTRAINT "entity_type_check" CHECK ("entity_type" IN ('alert', 'user', 'system', 'permission'))
);
--> statement-breakpoint

-- Departments
CREATE TABLE "departments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text,
	"head_user_id" uuid,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Shift schedules
CREATE TABLE "shift_schedules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"hospital_id" uuid NOT NULL,
	"start_time" timestamp NOT NULL,
	"end_time" timestamp NOT NULL,
	"department_id" uuid,
	"role" varchar(50),
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Alert metrics
CREATE TABLE "alert_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"hospital_id" uuid NOT NULL,
	"metric_date" date NOT NULL,
	"total_alerts" integer DEFAULT 0,
	"acknowledged_alerts" integer DEFAULT 0,
	"escalated_alerts" integer DEFAULT 0,
	"avg_response_time_seconds" integer,
	"alerts_by_type" jsonb,
	"alerts_by_urgency" jsonb,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint

-- Add foreign key constraints
ALTER TABLE "healthcare_users" ADD CONSTRAINT "healthcare_users_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_created_by_user_id_fk" FOREIGN KEY ("created_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_acknowledged_by_user_id_fk" FOREIGN KEY ("acknowledged_by") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alerts" ADD CONSTRAINT "alerts_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_escalations" ADD CONSTRAINT "alert_escalations_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_acknowledgments" ADD CONSTRAINT "alert_acknowledgments_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_acknowledgments" ADD CONSTRAINT "alert_acknowledgments_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_alert_id_alerts_id_fk" FOREIGN KEY ("alert_id") REFERENCES "alerts"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "notification_logs" ADD CONSTRAINT "notification_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "healthcare_audit_logs" ADD CONSTRAINT "healthcare_audit_logs_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "healthcare_audit_logs" ADD CONSTRAINT "healthcare_audit_logs_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "departments" ADD CONSTRAINT "departments_head_user_id_user_id_fk" FOREIGN KEY ("head_user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shift_schedules" ADD CONSTRAINT "shift_schedules_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shift_schedules" ADD CONSTRAINT "shift_schedules_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "shift_schedules" ADD CONSTRAINT "shift_schedules_department_id_departments_id_fk" FOREIGN KEY ("department_id") REFERENCES "departments"("id") ON DELETE no action ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "alert_metrics" ADD CONSTRAINT "alert_metrics_hospital_id_hospitals_id_fk" FOREIGN KEY ("hospital_id") REFERENCES "hospitals"("id") ON DELETE no action ON UPDATE no action;

-- Create unique constraint on alert metrics
CREATE UNIQUE INDEX "alert_metrics_hospital_date_idx" ON "alert_metrics" ("hospital_id", "metric_date");