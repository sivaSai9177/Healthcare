import { z } from 'zod';
import { router, createPermissionProcedure } from '../trpc';
import { log } from '@/lib/core/debug/logger';
import { db } from '@/src/db';
import { 
  patients, 
  patientVitals, 
  careTeamAssignments
} from '@/src/db/patient-schema';
import { alerts, healthcareAuditLogs } from '@/src/db/healthcare-schema';
import { users } from '@/src/db/schema';
import { eq, and, desc, or, gte, isNull, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

// Permission-based procedures
const viewPatientsProcedure = createPermissionProcedure('view_patients');
const managePatientsProcedure = createPermissionProcedure('manage_patients');

// Validation schemas
const CreatePatientSchema = z.object({
  mrn: z.string().min(1).max(20),
  name: z.string().min(1).max(255),
  dateOfBirth: z.date(),
  gender: z.enum(['male', 'female', 'other', 'unknown']),
  bloodType: z.enum(['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']).optional(),
  roomNumber: z.string().max(10).optional(),
  bedNumber: z.string().max(10).optional(),
  admissionDate: z.date(),
  primaryDiagnosis: z.string().optional(),
  secondaryDiagnoses: z.array(z.string()).optional(),
  allergies: z.array(z.string()).optional(),
  medications: z.array(z.object({
    name: z.string(),
    dosage: z.string(),
    frequency: z.string(),
  })).optional(),
  emergencyContact: z.object({
    name: z.string(),
    relationship: z.string(),
    phone: z.string(),
  }).optional(),
  departmentId: z.string().uuid().optional(),
  flags: z.object({
    dnr: z.boolean().optional(),
    fallRisk: z.boolean().optional(),
    allergyAlert: z.boolean().optional(),
  }).optional(),
});

const UpdatePatientSchema = CreatePatientSchema.partial().extend({
  id: z.string().uuid(),
});

const RecordVitalsSchema = z.object({
  patientId: z.string().uuid(),
  heartRate: z.number().min(30).max(250).optional(),
  bloodPressureSystolic: z.number().min(50).max(300).optional(),
  bloodPressureDiastolic: z.number().min(30).max(200).optional(),
  temperature: z.string().optional(), // In Celsius, stored as string for precision
  respiratoryRate: z.number().min(5).max(60).optional(),
  oxygenSaturation: z.number().min(50).max(100).optional(),
  bloodGlucose: z.number().min(20).max(600).optional(),
  pain: z.number().min(0).max(10).optional(),
  notes: z.string().optional(),
});

export const patientRouter = router({
  // Create a new patient
  createPatient: managePatientsProcedure
    .input(CreatePatientSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        // Check if MRN already exists
        const existing = await db
          .select()
          .from(patients)
          .where(eq(patients.mrn, input.mrn))
          .limit(1);

        if (existing.length > 0) {
          throw new TRPCError({
            code: 'CONFLICT',
            message: 'Patient with this MRN already exists',
          });
        }

        // Create patient
        const [newPatient] = await db.insert(patients).values({
          ...input,
          hospitalId: ctx.user.organizationId || ctx.hospitalContext?.userHospitalId,
          secondaryDiagnoses: input.secondaryDiagnoses || [],
          allergies: input.allergies || [],
          medications: input.medications || [],
          emergencyContact: input.emergencyContact || {},
          flags: input.flags || {},
        }).returning();

        // Log the patient creation
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'patient_created',
          entityType: 'patient',
          entityId: newPatient.id,
          hospitalId: newPatient.hospitalId,
          metadata: {
            mrn: newPatient.mrn,
            name: newPatient.name,
          },
          ipAddress: ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip'),
          userAgent: ctx.req.headers.get('user-agent'),
        });

        log.info('Patient created', 'PATIENT', {
          patientId: newPatient.id,
          mrn: newPatient.mrn,
        });

        return newPatient;
      } catch (error) {
        log.error('Failed to create patient', 'PATIENT', error);
        throw error;
      }
    }),

  // Get patient details
  getDetails: viewPatientsProcedure
    .input(z.object({
      patientId: z.string().uuid(),
    }))
    .query(async ({ input, ctx }) => {
      try {
        const [patient] = await db
          .select({
            patient: patients,
            primaryDoctor: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
            attendingNurse: {
              id: users.id,
              name: users.name,
              email: users.email,
            },
          })
          .from(patients)
          .leftJoin(users, eq(patients.primaryDoctorId, users.id))
          .leftJoin(users, eq(patients.attendingNurseId, users.id))
          .where(eq(patients.id, input.patientId))
          .limit(1);

        if (!patient) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Patient not found',
          });
        }

        // Get active alerts for this patient
        const activeAlerts = await db
          .select({
            id: alerts.id,
            type: alerts.alertType,
            urgencyLevel: alerts.urgencyLevel,
            status: alerts.status,
            createdAt: alerts.createdAt,
          })
          .from(alerts)
          .where(
            and(
              eq(alerts.patientId, input.patientId),
              or(
                eq(alerts.status, 'active'),
                eq(alerts.status, 'acknowledged')
              )
            )
          )
          .orderBy(desc(alerts.urgencyLevel));

        // Get care team
        const careTeam = await db
          .select({
            id: careTeamAssignments.id,
            role: careTeamAssignments.role,
            user: {
              id: users.id,
              name: users.name,
              email: users.email,
              role: users.role,
            },
            assignedAt: careTeamAssignments.assignedAt,
          })
          .from(careTeamAssignments)
          .leftJoin(users, eq(careTeamAssignments.userId, users.id))
          .where(
            and(
              eq(careTeamAssignments.patientId, input.patientId),
              eq(careTeamAssignments.isActive, true)
            )
          );

        log.info('Patient details fetched', 'PATIENT', {
          patientId: input.patientId,
        });

        return {
          ...patient.patient,
          primaryDoctor: patient.primaryDoctor,
          attendingNurse: patient.attendingNurse,
          activeAlerts,
          careTeam,
        };
      } catch (error) {
        log.error('Failed to fetch patient details', 'PATIENT', error);
        throw error;
      }
    }),

  // Update patient information
  updatePatient: managePatientsProcedure
    .input(UpdatePatientSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, ...updateData } = input;
      
      try {
        const [updatedPatient] = await db
          .update(patients)
          .set({
            ...updateData,
            updatedAt: new Date(),
          })
          .where(eq(patients.id, id))
          .returning();

        if (!updatedPatient) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Patient not found',
          });
        }

        // Log the update
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'patient_updated',
          entityType: 'patient',
          entityId: id,
          hospitalId: updatedPatient.hospitalId,
          metadata: {
            changes: updateData,
          },
          ipAddress: ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip'),
          userAgent: ctx.req.headers.get('user-agent'),
        });

        return updatedPatient;
      } catch (error) {
        log.error('Failed to update patient', 'PATIENT', error);
        throw error;
      }
    }),
    
  // Get current vitals
  getCurrentVitals: viewPatientsProcedure
    .input(z.object({
      patientId: z.string().uuid(),
    }))
    .query(async ({ input }) => {
      try {
        // Get the most recent vitals
        const [currentVitals] = await db
          .select()
          .from(patientVitals)
          .where(eq(patientVitals.patientId, input.patientId))
          .orderBy(desc(patientVitals.recordedAt))
          .limit(1);

        if (!currentVitals) {
          return null;
        }

        // Calculate trends by comparing with previous vitals
        const previousVitals = await db
          .select()
          .from(patientVitals)
          .where(eq(patientVitals.patientId, input.patientId))
          .orderBy(desc(patientVitals.recordedAt))
          .limit(2)
          .offset(1);

        const trends = previousVitals.length > 0 ? {
          heartRateTrend: calculateTrend(previousVitals[0].heartRate, currentVitals.heartRate),
          bloodPressureTrend: calculateTrend(
            previousVitals[0].bloodPressureSystolic, 
            currentVitals.bloodPressureSystolic
          ),
          oxygenTrend: calculateTrend(previousVitals[0].oxygenSaturation, currentVitals.oxygenSaturation),
          temperatureTrend: calculateTrend(
            parseFloat(previousVitals[0].temperature || '0'), 
            parseFloat(currentVitals.temperature || '0')
          ),
          respiratoryRateTrend: calculateTrend(previousVitals[0].respiratoryRate, currentVitals.respiratoryRate),
        } : {};

        log.info('Patient vitals fetched', 'PATIENT', {
          patientId: input.patientId,
        });
        
        return {
          ...currentVitals,
          ...trends,
        };
      } catch (error) {
        log.error('Failed to fetch patient vitals', 'PATIENT', error);
        throw error;
      }
    }),

  // Record new vitals
  recordVitals: managePatientsProcedure
    .input(RecordVitalsSchema)
    .mutation(async ({ input, ctx }) => {
      try {
        const [newVitals] = await db.insert(patientVitals).values({
          ...input,
          recordedBy: ctx.user.id,
          metadata: {},
        }).returning();

        // Check for critical values and create alerts if necessary
        await checkCriticalVitals(newVitals, ctx.user.id);

        // Log the vitals recording
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'vitals_recorded',
          entityType: 'patient',
          entityId: input.patientId,
          hospitalId: ctx.user.organizationId || ctx.hospitalContext?.userHospitalId,
          metadata: {
            vitalsId: newVitals.id,
            values: input,
          },
          ipAddress: ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip'),
          userAgent: ctx.req.headers.get('user-agent'),
        });

        return newVitals;
      } catch (error) {
        log.error('Failed to record vitals', 'PATIENT', error);
        throw error;
      }
    }),
    
  // Get vitals history
  getVitalsHistory: viewPatientsProcedure
    .input(z.object({
      patientId: z.string().uuid(),
      timeRange: z.enum(['1h', '6h', '24h', '72h']).default('24h'),
    }))
    .query(async ({ input }) => {
      try {
        // Calculate time offset based on range
        const hoursMap = { '1h': 1, '6h': 6, '24h': 24, '72h': 72 };
        const hours = hoursMap[input.timeRange];
        const startTime = new Date(Date.now() - hours * 60 * 60 * 1000);

        const history = await db
          .select()
          .from(patientVitals)
          .where(
            and(
              eq(patientVitals.patientId, input.patientId),
              gte(patientVitals.recordedAt, startTime)
            )
          )
          .orderBy(desc(patientVitals.recordedAt));

        const [current] = history;

        return {
          current,
          history,
          statistics: calculateVitalsStatistics(history),
        };
      } catch (error) {
        log.error('Failed to fetch vitals history', 'PATIENT', error);
        throw error;
      }
    }),
    
  // Get patients list
  getPatientsList: viewPatientsProcedure
    .input(z.object({
      hospitalId: z.string().uuid(),
      departmentId: z.string().uuid().optional(),
      doctorId: z.string().uuid().optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
      includeDischarge: z.boolean().default(false),
    }))
    .query(async ({ input, ctx }) => {
      try {
        let query = db
          .select({
            patient: patients,
            activeAlerts: sql<number>`COUNT(DISTINCT ${alerts.id})`,
          })
          .from(patients)
          .leftJoin(
            alerts,
            and(
              eq(alerts.patientId, patients.id),
              eq(alerts.status, 'active')
            )
          )
          .where(eq(patients.hospitalId, input.hospitalId))
          .groupBy(patients.id);

        // Filter by department if specified
        if (input.departmentId) {
          query = query.where(eq(patients.departmentId, input.departmentId));
        }

        // Filter by doctor if specified
        if (input.doctorId) {
          query = query.leftJoin(
            careTeamAssignments,
            and(
              eq(careTeamAssignments.patientId, patients.id),
              eq(careTeamAssignments.userId, input.doctorId),
              eq(careTeamAssignments.isActive, true)
            )
          ).where(eq(careTeamAssignments.userId, input.doctorId));
        }

        // Filter discharged patients
        if (!input.includeDischarge) {
          query = query.where(isNull(patients.dischargeDate));
        }

        const patientsList = await query
          .orderBy(desc(patients.admissionDate))
          .limit(input.limit)
          .offset(input.offset);

        // Get total count
        const [{ count }] = await db
          .select({ count: sql<number>`count(*)` })
          .from(patients)
          .where(eq(patients.hospitalId, input.hospitalId));

        return {
          patients: patientsList,
          total: Number(count),
        };
      } catch (error) {
        log.error('Failed to fetch patients list', 'PATIENT', error);
        throw error;
      }
    }),

  // Assign patient to care team member
  assignToCareTeam: managePatientsProcedure
    .input(z.object({
      patientId: z.string().uuid(),
      userId: z.string().uuid(),
      role: z.enum(['primary_doctor', 'attending_nurse', 'specialist', 'resident', 'intern']),
      notes: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        // Deactivate any existing assignment for this role
        await db
          .update(careTeamAssignments)
          .set({
            isActive: false,
            unassignedAt: new Date(),
          })
          .where(
            and(
              eq(careTeamAssignments.patientId, input.patientId),
              eq(careTeamAssignments.role, input.role),
              eq(careTeamAssignments.isActive, true)
            )
          );

        // Create new assignment
        const [assignment] = await db.insert(careTeamAssignments).values({
          patientId: input.patientId,
          userId: input.userId,
          role: input.role,
          notes: input.notes,
        }).returning();

        // Update patient record if primary doctor or nurse
        if (input.role === 'primary_doctor') {
          await db
            .update(patients)
            .set({ primaryDoctorId: input.userId })
            .where(eq(patients.id, input.patientId));
        } else if (input.role === 'attending_nurse') {
          await db
            .update(patients)
            .set({ attendingNurseId: input.userId })
            .where(eq(patients.id, input.patientId));
        }

        // Log the assignment
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'care_team_assigned',
          entityType: 'patient',
          entityId: input.patientId,
          hospitalId: ctx.user.organizationId || ctx.hospitalContext?.userHospitalId,
          metadata: {
            assignedUserId: input.userId,
            role: input.role,
          },
          ipAddress: ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip'),
          userAgent: ctx.req.headers.get('user-agent'),
        });

        return assignment;
      } catch (error) {
        log.error('Failed to assign to care team', 'PATIENT', error);
        throw error;
      }
    }),

  // Discharge patient
  dischargePatient: managePatientsProcedure
    .input(z.object({
      patientId: z.string().uuid(),
      dischargeNotes: z.string(),
      dischargeDiagnosis: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      try {
        const [dischargedPatient] = await db
          .update(patients)
          .set({
            dischargeDate: new Date(),
            isActive: false,
            primaryDiagnosis: input.dischargeDiagnosis,
            updatedAt: new Date(),
          })
          .where(eq(patients.id, input.patientId))
          .returning();

        if (!dischargedPatient) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Patient not found',
          });
        }

        // Deactivate all care team assignments
        await db
          .update(careTeamAssignments)
          .set({
            isActive: false,
            unassignedAt: new Date(),
          })
          .where(
            and(
              eq(careTeamAssignments.patientId, input.patientId),
              eq(careTeamAssignments.isActive, true)
            )
          );

        // Resolve any active alerts
        await db
          .update(alerts)
          .set({
            status: 'resolved',
            resolvedAt: new Date(),
            description: 'Patient discharged',
          })
          .where(
            and(
              eq(alerts.patientId, input.patientId),
              eq(alerts.status, 'active')
            )
          );

        // Log the discharge
        await db.insert(healthcareAuditLogs).values({
          userId: ctx.user.id,
          action: 'patient_discharged',
          entityType: 'patient',
          entityId: input.patientId,
          hospitalId: dischargedPatient.hospitalId,
          metadata: {
            dischargeNotes: input.dischargeNotes,
            dischargeDiagnosis: input.dischargeDiagnosis,
          },
          ipAddress: ctx.req.headers.get('x-forwarded-for') || ctx.req.headers.get('x-real-ip'),
          userAgent: ctx.req.headers.get('user-agent'),
        });

        return dischargedPatient;
      } catch (error) {
        log.error('Failed to discharge patient', 'PATIENT', error);
        throw error;
      }
    }),
});

// Helper function to calculate trend
function calculateTrend(
  previous: number | null | undefined, 
  current: number | null | undefined
): 'up' | 'down' | 'stable' | undefined {
  if (!previous || !current) return undefined;
  
  const diff = current - previous;
  const percentChange = Math.abs(diff / previous) * 100;
  
  if (percentChange < 5) return 'stable';
  return diff > 0 ? 'up' : 'down';
}

// Helper function to check for critical vitals
async function checkCriticalVitals(vitals: any, userId: string) {
  const criticalConditions = [];
  
  // Check heart rate
  if (vitals.heartRate && (vitals.heartRate < 40 || vitals.heartRate > 150)) {
    criticalConditions.push(`Critical heart rate: ${vitals.heartRate} bpm`);
  }
  
  // Check blood pressure
  if (vitals.bloodPressureSystolic && vitals.bloodPressureDiastolic) {
    if (vitals.bloodPressureSystolic > 180 || vitals.bloodPressureDiastolic > 110) {
      criticalConditions.push(`Critical high blood pressure: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`);
    } else if (vitals.bloodPressureSystolic < 90 || vitals.bloodPressureDiastolic < 60) {
      criticalConditions.push(`Critical low blood pressure: ${vitals.bloodPressureSystolic}/${vitals.bloodPressureDiastolic}`);
    }
  }
  
  // Check oxygen saturation
  if (vitals.oxygenSaturation && vitals.oxygenSaturation < 90) {
    criticalConditions.push(`Critical low oxygen saturation: ${vitals.oxygenSaturation}%`);
  }
  
  // Check temperature
  if (vitals.temperature) {
    const temp = parseFloat(vitals.temperature);
    if (temp > 39.5 || temp < 35) {
      criticalConditions.push(`Critical temperature: ${temp}°C`);
    }
  }
  
  // If critical conditions found, create an alert
  if (criticalConditions.length > 0) {
    // TODO: Create alert using healthcare router
    log.warn('Critical vitals detected', 'PATIENT', {
      patientId: vitals.patientId,
      conditions: criticalConditions,
    });
  }
}

// Helper function to calculate statistics
function calculateVitalsStatistics(vitals: any[]) {
  if (vitals.length === 0) return {};
  
  const stats = {
    heartRate: { min: Infinity, max: -Infinity, avg: 0 },
    bloodPressureSystolic: { min: Infinity, max: -Infinity, avg: 0 },
    bloodPressureDiastolic: { min: Infinity, max: -Infinity, avg: 0 },
    oxygenSaturation: { min: Infinity, max: -Infinity, avg: 0 },
    temperature: { min: Infinity, max: -Infinity, avg: 0 },
  };
  
  const counts = {
    heartRate: 0,
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    oxygenSaturation: 0,
    temperature: 0,
  };
  
  vitals.forEach(vital => {
    // Heart rate
    if (vital.heartRate) {
      stats.heartRate.min = Math.min(stats.heartRate.min, vital.heartRate);
      stats.heartRate.max = Math.max(stats.heartRate.max, vital.heartRate);
      stats.heartRate.avg += vital.heartRate;
      counts.heartRate++;
    }
    
    // Blood pressure
    if (vital.bloodPressureSystolic) {
      stats.bloodPressureSystolic.min = Math.min(stats.bloodPressureSystolic.min, vital.bloodPressureSystolic);
      stats.bloodPressureSystolic.max = Math.max(stats.bloodPressureSystolic.max, vital.bloodPressureSystolic);
      stats.bloodPressureSystolic.avg += vital.bloodPressureSystolic;
      counts.bloodPressureSystolic++;
    }
    
    if (vital.bloodPressureDiastolic) {
      stats.bloodPressureDiastolic.min = Math.min(stats.bloodPressureDiastolic.min, vital.bloodPressureDiastolic);
      stats.bloodPressureDiastolic.max = Math.max(stats.bloodPressureDiastolic.max, vital.bloodPressureDiastolic);
      stats.bloodPressureDiastolic.avg += vital.bloodPressureDiastolic;
      counts.bloodPressureDiastolic++;
    }
    
    // Oxygen saturation
    if (vital.oxygenSaturation) {
      stats.oxygenSaturation.min = Math.min(stats.oxygenSaturation.min, vital.oxygenSaturation);
      stats.oxygenSaturation.max = Math.max(stats.oxygenSaturation.max, vital.oxygenSaturation);
      stats.oxygenSaturation.avg += vital.oxygenSaturation;
      counts.oxygenSaturation++;
    }
    
    // Temperature
    if (vital.temperature) {
      const temp = parseFloat(vital.temperature);
      stats.temperature.min = Math.min(stats.temperature.min, temp);
      stats.temperature.max = Math.max(stats.temperature.max, temp);
      stats.temperature.avg += temp;
      counts.temperature++;
    }
  });
  
  // Calculate averages
  Object.keys(stats).forEach(key => {
    const k = key as keyof typeof stats;
    if (counts[k] > 0) {
      stats[k].avg = stats[k].avg / counts[k];
    } else {
      stats[k] = { min: 0, max: 0, avg: 0 };
    }
  });
  
  return stats;
}