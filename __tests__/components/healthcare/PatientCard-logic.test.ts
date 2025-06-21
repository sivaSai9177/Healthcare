import { describe, it, expect } from '@jest/globals';

describe('PatientCard Component Logic', () => {
  describe('Patient Data Display', () => {
    interface Patient {
      id: string;
      name: string;
      age: number;
      gender: 'M' | 'F' | 'O';
      mrn: string; // Medical Record Number
      room?: string;
      bed?: string;
      admissionDate: Date;
      primaryDiagnosis?: string;
      allergies?: string[];
      alerts?: {
        fallRisk?: boolean;
        isolation?: boolean;
        dnr?: boolean;
        allergies?: boolean;
      };
    }

    const formatPatientInfo = (patient: Patient) => {
      const ageDisplay = `${patient.age}y ${patient.gender}`;
      const locationDisplay = patient.room && patient.bed 
        ? `Room ${patient.room}, Bed ${patient.bed}`
        : patient.room 
        ? `Room ${patient.room}`
        : 'No location assigned';

      const stayDuration = Math.floor(
        (new Date().getTime() - patient.admissionDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      const badges = [];
      if (patient.alerts?.fallRisk) badges.push({ type: 'warning', label: 'Fall Risk', icon: 'alert-triangle' });
      if (patient.alerts?.isolation) badges.push({ type: 'danger', label: 'Isolation', icon: 'shield' });
      if (patient.alerts?.dnr) badges.push({ type: 'critical', label: 'DNR', icon: 'heart-off' });
      if (patient.alerts?.allergies) badges.push({ type: 'warning', label: 'Allergies', icon: 'alert-circle' });

      return {
        primary: patient.name,
        secondary: `${ageDisplay} • MRN: ${patient.mrn}`,
        location: locationDisplay,
        stayDuration: `Day ${stayDuration + 1}`,
        diagnosis: patient.primaryDiagnosis || 'No diagnosis recorded',
        badges,
      };
    };

    it('formats patient demographics', () => {
      const patient: Patient = {
        id: '1',
        name: 'John Doe',
        age: 65,
        gender: 'M',
        mrn: '123456',
        admissionDate: new Date(),
      };

      const info = formatPatientInfo(patient);
      expect(info.primary).toBe('John Doe');
      expect(info.secondary).toBe('65y M • MRN: 123456');
    });

    it('formats location with room and bed', () => {
      const patient: Patient = {
        id: '1',
        name: 'Jane Doe',
        age: 45,
        gender: 'F',
        mrn: '789012',
        room: '301',
        bed: 'A',
        admissionDate: new Date(),
      };

      const info = formatPatientInfo(patient);
      expect(info.location).toBe('Room 301, Bed A');
    });

    it('calculates stay duration', () => {
      const patient: Patient = {
        id: '1',
        name: 'Test Patient',
        age: 50,
        gender: 'O',
        mrn: '345678',
        admissionDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      };

      const info = formatPatientInfo(patient);
      expect(info.stayDuration).toBe('Day 4');
    });

    it('generates alert badges', () => {
      const patient: Patient = {
        id: '1',
        name: 'High Risk Patient',
        age: 80,
        gender: 'M',
        mrn: '111111',
        admissionDate: new Date(),
        alerts: {
          fallRisk: true,
          allergies: true,
        },
      };

      const info = formatPatientInfo(patient);
      expect(info.badges).toHaveLength(2);
      expect(info.badges.find(b => b.label === 'Fall Risk')).toBeDefined();
      expect(info.badges.find(b => b.label === 'Allergies')).toBeDefined();
    });
  });

  describe('Vital Signs Display', () => {
    interface VitalSigns {
      heartRate?: { value: number; unit: 'bpm'; timestamp: Date };
      bloodPressure?: { systolic: number; diastolic: number; timestamp: Date };
      temperature?: { value: number; unit: 'C' | 'F'; timestamp: Date };
      oxygenSaturation?: { value: number; unit: '%'; timestamp: Date };
      respiratoryRate?: { value: number; unit: 'bpm'; timestamp: Date };
    }

    const formatVitalSigns = (vitals: VitalSigns) => {
      const formatted = [];

      if (vitals.heartRate) {
        const status = getHeartRateStatus(vitals.heartRate.value);
        formatted.push({
          label: 'HR',
          value: `${vitals.heartRate.value}`,
          unit: vitals.heartRate.unit,
          status,
          icon: 'heart',
        });
      }

      if (vitals.bloodPressure) {
        const status = getBloodPressureStatus(vitals.bloodPressure.systolic, vitals.bloodPressure.diastolic);
        formatted.push({
          label: 'BP',
          value: `${vitals.bloodPressure.systolic}/${vitals.bloodPressure.diastolic}`,
          unit: 'mmHg',
          status,
          icon: 'activity',
        });
      }

      if (vitals.temperature) {
        const status = getTemperatureStatus(vitals.temperature.value, vitals.temperature.unit);
        formatted.push({
          label: 'Temp',
          value: `${vitals.temperature.value}°`,
          unit: vitals.temperature.unit,
          status,
          icon: 'thermometer',
        });
      }

      if (vitals.oxygenSaturation) {
        const status = getOxygenStatus(vitals.oxygenSaturation.value);
        formatted.push({
          label: 'SpO2',
          value: `${vitals.oxygenSaturation.value}`,
          unit: vitals.oxygenSaturation.unit,
          status,
          icon: 'droplet',
        });
      }

      return formatted;
    };

    const getHeartRateStatus = (value: number) => {
      if (value < 60) return 'low';
      if (value > 100) return 'high';
      return 'normal';
    };

    const getBloodPressureStatus = (systolic: number, diastolic: number) => {
      if (systolic >= 140 || diastolic >= 90) return 'high';
      if (systolic < 90 || diastolic < 60) return 'low';
      return 'normal';
    };

    const getTemperatureStatus = (value: number, unit: 'C' | 'F') => {
      const celsius = unit === 'F' ? (value - 32) * 5/9 : value;
      if (celsius < 36.1) return 'low';
      if (celsius > 37.8) return 'high';
      return 'normal';
    };

    const getOxygenStatus = (value: number) => {
      if (value < 90) return 'critical';
      if (value < 95) return 'low';
      return 'normal';
    };

    it('formats vital signs with status', () => {
      const vitals: VitalSigns = {
        heartRate: { value: 72, unit: 'bpm', timestamp: new Date() },
        bloodPressure: { systolic: 120, diastolic: 80, timestamp: new Date() },
        temperature: { value: 37.0, unit: 'C', timestamp: new Date() },
        oxygenSaturation: { value: 98, unit: '%', timestamp: new Date() },
      };

      const formatted = formatVitalSigns(vitals);
      expect(formatted).toHaveLength(4);
      expect(formatted.every(v => v.status === 'normal')).toBe(true);
    });

    it('detects abnormal heart rate', () => {
      expect(getHeartRateStatus(55)).toBe('low');
      expect(getHeartRateStatus(110)).toBe('high');
      expect(getHeartRateStatus(75)).toBe('normal');
    });

    it('detects abnormal blood pressure', () => {
      expect(getBloodPressureStatus(150, 95)).toBe('high');
      expect(getBloodPressureStatus(85, 55)).toBe('low');
      expect(getBloodPressureStatus(120, 80)).toBe('normal');
    });

    it('detects critical oxygen levels', () => {
      expect(getOxygenStatus(88)).toBe('critical');
      expect(getOxygenStatus(93)).toBe('low');
      expect(getOxygenStatus(98)).toBe('normal');
    });
  });

  describe('Patient Actions', () => {
    interface PatientAction {
      id: string;
      label: string;
      icon: string;
      variant?: 'primary' | 'secondary' | 'danger';
      requiresPermission?: string;
      confirmationRequired?: boolean;
    }

    const getAvailableActions = (
      patient: { id: string; status?: string },
      userPermissions: string[]
    ): PatientAction[] => {
      const actions: PatientAction[] = [
        {
          id: 'view-chart',
          label: 'View Chart',
          icon: 'file-text',
          variant: 'secondary',
        },
        {
          id: 'create-alert',
          label: 'Create Alert',
          icon: 'bell',
          variant: 'primary',
        },
        {
          id: 'record-vitals',
          label: 'Record Vitals',
          icon: 'activity',
          requiresPermission: 'vitals.write',
        },
      ];

      if (userPermissions.includes('patient.discharge')) {
        actions.push({
          id: 'discharge',
          label: 'Discharge',
          icon: 'log-out',
          variant: 'danger',
          requiresPermission: 'patient.discharge',
          confirmationRequired: true,
        });
      }

      if (userPermissions.includes('patient.transfer')) {
        actions.push({
          id: 'transfer',
          label: 'Transfer',
          icon: 'move',
          requiresPermission: 'patient.transfer',
          confirmationRequired: true,
        });
      }

      return actions.filter(action => 
        !action.requiresPermission || userPermissions.includes(action.requiresPermission)
      );
    };

    it('shows basic actions for all users', () => {
      const actions = getAvailableActions({ id: '1' }, []);
      expect(actions.find(a => a.id === 'view-chart')).toBeDefined();
      expect(actions.find(a => a.id === 'create-alert')).toBeDefined();
    });

    it('shows vitals action with permission', () => {
      const actions = getAvailableActions({ id: '1' }, ['vitals.write']);
      expect(actions.find(a => a.id === 'record-vitals')).toBeDefined();
    });

    it('shows discharge action with permission', () => {
      const actions = getAvailableActions({ id: '1' }, ['patient.discharge']);
      const discharge = actions.find(a => a.id === 'discharge');
      expect(discharge).toBeDefined();
      expect(discharge?.confirmationRequired).toBe(true);
      expect(discharge?.variant).toBe('danger');
    });

    it('filters actions by permissions', () => {
      const noPermissions = getAvailableActions({ id: '1' }, []);
      const allPermissions = getAvailableActions({ id: '1' }, [
        'vitals.write',
        'patient.discharge',
        'patient.transfer',
      ]);

      expect(noPermissions.length).toBeLessThan(allPermissions.length);
    });
  });

  describe('Allergy Display', () => {
    interface Allergy {
      allergen: string;
      severity: 'mild' | 'moderate' | 'severe';
      reaction?: string;
      verifiedDate?: Date;
    }

    const formatAllergies = (allergies: Allergy[]) => {
      const severityConfig = {
        mild: { color: 'text-yellow-600', icon: 'info', priority: 3 },
        moderate: { color: 'text-orange-600', icon: 'alert-circle', priority: 2 },
        severe: { color: 'text-red-600', icon: 'alert-triangle', priority: 1 },
      };

      return allergies
        .sort((a, b) => 
          severityConfig[a.severity].priority - severityConfig[b.severity].priority
        )
        .map(allergy => ({
          allergen: allergy.allergen,
          severity: allergy.severity,
          ...severityConfig[allergy.severity],
          display: allergy.reaction 
            ? `${allergy.allergen} - ${allergy.reaction}`
            : allergy.allergen,
          verified: allergy.verifiedDate ? true : false,
        }));
    };

    it('formats and sorts allergies by severity', () => {
      const allergies: Allergy[] = [
        { allergen: 'Aspirin', severity: 'mild' },
        { allergen: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis' },
        { allergen: 'Latex', severity: 'moderate', reaction: 'Hives' },
      ];

      const formatted = formatAllergies(allergies);
      expect(formatted[0].allergen).toBe('Penicillin'); // Severe first
      expect(formatted[1].allergen).toBe('Latex'); // Moderate second
      expect(formatted[2].allergen).toBe('Aspirin'); // Mild last
    });

    it('includes reaction in display', () => {
      const allergies: Allergy[] = [
        { allergen: 'Penicillin', severity: 'severe', reaction: 'Anaphylaxis' },
      ];

      const formatted = formatAllergies(allergies);
      expect(formatted[0].display).toBe('Penicillin - Anaphylaxis');
    });

    it('assigns appropriate colors and icons', () => {
      const allergies: Allergy[] = [
        { allergen: 'Test', severity: 'severe' },
      ];

      const formatted = formatAllergies(allergies);
      expect(formatted[0].color).toBe('text-red-600');
      expect(formatted[0].icon).toBe('alert-triangle');
    });
  });

  describe('Card Layout States', () => {
    const getCardLayout = (props: {
      view: 'compact' | 'standard' | 'expanded';
      screenSize: 'mobile' | 'tablet' | 'desktop';
      isSelected?: boolean;
    }) => {
      const layouts = {
        compact: {
          height: { mobile: 80, tablet: 90, desktop: 100 },
          showVitals: false,
          showAllergies: false,
          showActions: false,
        },
        standard: {
          height: { mobile: 120, tablet: 140, desktop: 160 },
          showVitals: true,
          showAllergies: false,
          showActions: true,
        },
        expanded: {
          height: { mobile: 200, tablet: 240, desktop: 280 },
          showVitals: true,
          showAllergies: true,
          showActions: true,
        },
      };

      const layout = layouts[props.view];
      const height = layout.height[props.screenSize];

      return {
        height,
        showVitals: layout.showVitals,
        showAllergies: layout.showAllergies,
        showActions: layout.showActions,
        border: props.isSelected ? 'border-2 border-primary' : 'border',
        shadow: props.isSelected ? 'shadow-lg' : 'shadow-sm',
      };
    };

    it('adjusts height based on view and screen size', () => {
      const compactMobile = getCardLayout({ view: 'compact', screenSize: 'mobile' });
      expect(compactMobile.height).toBe(80);

      const expandedDesktop = getCardLayout({ view: 'expanded', screenSize: 'desktop' });
      expect(expandedDesktop.height).toBe(280);
    });

    it('shows/hides elements based on view', () => {
      const compact = getCardLayout({ view: 'compact', screenSize: 'desktop' });
      expect(compact.showVitals).toBe(false);
      expect(compact.showAllergies).toBe(false);

      const expanded = getCardLayout({ view: 'expanded', screenSize: 'desktop' });
      expect(expanded.showVitals).toBe(true);
      expect(expanded.showAllergies).toBe(true);
    });

    it('applies selection styles', () => {
      const selected = getCardLayout({ 
        view: 'standard', 
        screenSize: 'desktop',
        isSelected: true,
      });

      expect(selected.border).toBe('border-2 border-primary');
      expect(selected.shadow).toBe('shadow-lg');
    });
  });
});