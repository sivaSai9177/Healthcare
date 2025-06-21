import React, { useMemo } from 'react';
import { View } from 'react-native';
import { Select, SelectOption } from '@/components/universal/form';
import { Text } from '@/components/universal/typography/Text';

interface DepartmentOption extends SelectOption {
  category: 'healthcare' | 'emergency' | 'administrative' | 'general';
}

// Predefined departments by category
const DEPARTMENTS: DepartmentOption[] = [
  // Healthcare departments
  { value: 'emergency', label: 'Emergency Department', category: 'healthcare' },
  { value: 'icu', label: 'Intensive Care Unit (ICU)', category: 'healthcare' },
  { value: 'cardiology', label: 'Cardiology', category: 'healthcare' },
  { value: 'pediatrics', label: 'Pediatrics', category: 'healthcare' },
  { value: 'surgery', label: 'Surgery', category: 'healthcare' },
  { value: 'radiology', label: 'Radiology', category: 'healthcare' },
  { value: 'pharmacy', label: 'Pharmacy', category: 'healthcare' },
  { value: 'laboratory', label: 'Laboratory', category: 'healthcare' },
  { value: 'maternity', label: 'Maternity Ward', category: 'healthcare' },
  { value: 'oncology', label: 'Oncology', category: 'healthcare' },
  { value: 'neurology', label: 'Neurology', category: 'healthcare' },
  { value: 'orthopedics', label: 'Orthopedics', category: 'healthcare' },
  { value: 'psychiatry', label: 'Psychiatry', category: 'healthcare' },
  { value: 'general_medicine', label: 'General Medicine', category: 'healthcare' },
  
  // Emergency/Dispatch departments
  { value: 'dispatch_center', label: 'Dispatch Center', category: 'emergency' },
  { value: 'emergency_response', label: 'Emergency Response', category: 'emergency' },
  { value: 'fire_dispatch', label: 'Fire Dispatch', category: 'emergency' },
  { value: 'police_dispatch', label: 'Police Dispatch', category: 'emergency' },
  { value: 'medical_dispatch', label: 'Medical Dispatch', category: 'emergency' },
  
  // Administrative departments
  { value: 'administration', label: 'Administration', category: 'administrative' },
  { value: 'human_resources', label: 'Human Resources', category: 'administrative' },
  { value: 'finance', label: 'Finance', category: 'administrative' },
  { value: 'it_support', label: 'IT Support', category: 'administrative' },
  { value: 'facilities', label: 'Facilities Management', category: 'administrative' },
  
  // General departments (for non-healthcare organizations)
  { value: 'engineering', label: 'Engineering', category: 'general' },
  { value: 'marketing', label: 'Marketing', category: 'general' },
  { value: 'sales', label: 'Sales', category: 'general' },
  { value: 'customer_service', label: 'Customer Service', category: 'general' },
  { value: 'operations', label: 'Operations', category: 'general' },
  { value: 'product', label: 'Product', category: 'general' },
  { value: 'research', label: 'Research & Development', category: 'general' },
];

interface DepartmentSelectorProps {
  value?: string;
  onChange: (value: string) => void;
  userRole: string;
  isRequired?: boolean;
  error?: string;
  label?: string;
}

export function DepartmentSelector({
  value,
  onChange,
  userRole,
  isRequired = false,
  error,
  label
}: DepartmentSelectorProps) {
  // Filter departments based on user role
  const relevantDepartments = useMemo(() => {
    const healthcareRoles = ['doctor', 'nurse', 'head_doctor'];
    const emergencyRoles = ['operator'];
    const adminRoles = ['admin', 'manager'];
    
    if (healthcareRoles.includes(userRole)) {
      // Healthcare professionals see healthcare and administrative departments
      return DEPARTMENTS.filter(d => 
        d.category === 'healthcare' || d.category === 'administrative'
      );
    } else if (emergencyRoles.includes(userRole)) {
      // Emergency operators see emergency and administrative departments
      return DEPARTMENTS.filter(d => 
        d.category === 'emergency' || d.category === 'administrative'
      );
    } else if (adminRoles.includes(userRole)) {
      // Admins and managers see all departments
      return DEPARTMENTS;
    } else {
      // Others see general and administrative departments
      return DEPARTMENTS.filter(d => 
        d.category === 'general' || d.category === 'administrative'
      );
    }
  }, [userRole]);

  // Get help text based on role
  const helpText = useMemo(() => {
    if (userRole === 'doctor' || userRole === 'nurse' || userRole === 'head_doctor') {
      return 'Select the medical department where you\'ll be working';
    } else if (userRole === 'operator') {
      return 'Select the dispatch center you\'ll be operating from';
    } else {
      return 'Select your team or functional area';
    }
  }, [userRole]);

  // Safety check for Select component
  if (!Select) {
    console.error('Select component not found');
    return null;
  }

  return (
    <View className="space-y-2">
      <Select
        label={label || `Department ${isRequired ? '(Required)' : '(Optional)'}`}
        value={value}
        onValueChange={onChange}
        options={relevantDepartments}
        placeholder="Select a department"
        error={error}
        searchable
        animated
      />
      
      <Text size="xs" color="muted">
        {helpText}
      </Text>
    </View>
  );
}

// Export department list for use in other components (e.g., filters)
export { DEPARTMENTS };

// Helper function to get department label by value
export function getDepartmentLabel(value: string): string {
  const dept = DEPARTMENTS.find(d => d.value === value);
  return dept?.label || value;
}

// Helper function to get departments by category
export function getDepartmentsByCategory(category: DepartmentOption['category']): DepartmentOption[] {
  return DEPARTMENTS.filter(d => d.category === category);
}