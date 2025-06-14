import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Select, SelectOption } from '@/components/universal/form/Select';
import { VStack, Card, Text, Heading2 } from '../universal';

// Sample data
const simpleOptions: SelectOption[] = [
  { label: 'React Native', value: 'react-native' },
  { label: 'Flutter', value: 'flutter' },
  { label: 'Swift UI', value: 'swiftui' },
  { label: 'Kotlin', value: 'kotlin' },
  { label: 'Ionic', value: 'ionic' },
];

const iconOptions: SelectOption[] = [
  { label: 'Apple', value: 'apple', icon: 'apple.logo' },
  { label: 'Android', value: 'android', icon: 'android.logo' },
  { label: 'Windows', value: 'windows', icon: 'window.shade.closed' },
  { label: 'Linux', value: 'linux', icon: 'terminal' },
];

const descriptiveOptions: SelectOption[] = [
  { 
    label: 'Free Plan', 
    value: 'free',
    description: 'Basic features for personal use'
  },
  { 
    label: 'Pro Plan', 
    value: 'pro',
    description: '$9/month - Advanced features and priority support'
  },
  { 
    label: 'Enterprise', 
    value: 'enterprise',
    description: 'Custom pricing - Full access and dedicated support'
  },
  { 
    label: 'Student', 
    value: 'student',
    description: 'Free with valid student ID',
    disabled: true
  },
];

const groupedOptions = [
  {
    label: 'Frontend Frameworks',
    options: [
      { label: 'React', value: 'react' },
      { label: 'Vue', value: 'vue' },
      { label: 'Angular', value: 'angular' },
      { label: 'Svelte', value: 'svelte' },
    ]
  },
  {
    label: 'Backend Frameworks',
    options: [
      { label: 'Express', value: 'express' },
      { label: 'Django', value: 'django' },
      { label: 'Ruby on Rails', value: 'rails' },
      { label: 'Spring Boot', value: 'spring' },
    ]
  },
  {
    label: 'Mobile Frameworks',
    options: [
      { label: 'React Native', value: 'react-native' },
      { label: 'Flutter', value: 'flutter' },
      { label: 'Ionic', value: 'ionic' },
    ]
  }
];

const countryOptions: SelectOption[] = [
  { label: 'United States', value: 'us', icon: 'flag' },
  { label: 'Canada', value: 'ca', icon: 'flag' },
  { label: 'United Kingdom', value: 'uk', icon: 'flag' },
  { label: 'Germany', value: 'de', icon: 'flag' },
  { label: 'France', value: 'fr', icon: 'flag' },
  { label: 'Japan', value: 'jp', icon: 'flag' },
  { label: 'Australia', value: 'au', icon: 'flag' },
  { label: 'Brazil', value: 'br', icon: 'flag' },
  { label: 'India', value: 'in', icon: 'flag' },
  { label: 'China', value: 'cn', icon: 'flag' },
];

export function SelectDemo() {
  const [values, setValues] = useState({
    simple: '',
    icons: '',
    descriptive: 'pro',
    searchable: '',
    multiple: [] as string[],
    grouped: '',
    clearable: 'react-native',
    sizes: { sm: '', md: '', lg: '' },
    variants: { outline: '', filled: '', ghost: '' },
    animated: '',
  });
  
  const handleChange = (field: string) => (value: string | string[]) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };
  
  const handleSizeChange = (size: string) => (value: string) => {
    setValues(prev => ({ 
      ...prev, 
      sizes: { ...prev.sizes, [size]: value } 
    }));
  };
  
  const handleVariantChange = (variant: string) => (value: string) => {
    setValues(prev => ({ 
      ...prev, 
      variants: { ...prev.variants, [variant]: value } 
    }));
  };
  
  return (
    <ScrollView className="flex-1 bg-background">
      <VStack className="p-4 space-y-6">
        <Heading2>Select Component Showcase</Heading2>
        
        {/* Basic Select */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Basic Select</Text>
          <VStack className="space-y-4">
            <Select
              label="Choose Framework"
              options={simpleOptions}
              value={values.simple}
              onValueChange={handleChange('simple')}
              placeholder="Select a framework"
            />
            
            <Select
              label="Disabled Select"
              options={simpleOptions}
              value="react-native"
              disabled
              placeholder="Cannot change this"
            />
            
            <Select
              label="With Error"
              options={simpleOptions}
              value=""
              error="Please select a framework"
              placeholder="This field has an error"
            />
          </VStack>
        </Card>
        
        {/* Select with Icons */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">With Icons</Text>
          <Select
            label="Operating System"
            options={iconOptions}
            value={values.icons}
            onValueChange={handleChange('icons')}
            placeholder="Choose your OS"
          />
        </Card>
        
        {/* Descriptive Options */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">With Descriptions</Text>
          <Select
            label="Select Plan"
            options={descriptiveOptions}
            value={values.descriptive}
            onValueChange={handleChange('descriptive')}
            placeholder="Choose a plan"
          />
        </Card>
        
        {/* Searchable Select */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Searchable Select</Text>
          <Select
            label="Country"
            options={countryOptions}
            value={values.searchable}
            onValueChange={handleChange('searchable')}
            placeholder="Search for a country..."
            searchable
          />
        </Card>
        
        {/* Multiple Selection */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Multiple Selection</Text>
          <Select
            label="Select Technologies"
            options={simpleOptions}
            value={values.multiple}
            onValueChange={handleChange('multiple')}
            placeholder="Select multiple options"
            multiple
          />
          <Text size="sm" color="muted" className="mt-2">
            Selected: {values.multiple.join(', ') || 'None'}
          </Text>
        </Card>
        
        {/* Grouped Options */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Grouped Options</Text>
          <Select
            label="Technology Stack"
            grouped={groupedOptions}
            options={[]} // Not needed when using grouped
            value={values.grouped}
            onValueChange={handleChange('grouped')}
            placeholder="Choose from categories"
            searchable
          />
        </Card>
        
        {/* Clearable Select */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Clearable Select</Text>
          <Select
            label="Framework (with clear button)"
            options={simpleOptions}
            value={values.clearable}
            onValueChange={handleChange('clearable')}
            placeholder="Select to see clear button"
            clearable
          />
        </Card>
        
        {/* Size Variants */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Size Variants</Text>
          <VStack className="space-y-4">
            <Select
              label="Small Size"
              options={simpleOptions}
              value={values.sizes.sm}
              onValueChange={handleSizeChange('sm')}
              size="sm"
              placeholder="Small select"
            />
            
            <Select
              label="Medium Size (Default)"
              options={simpleOptions}
              value={values.sizes.md}
              onValueChange={handleSizeChange('md')}
              size="md"
              placeholder="Medium select"
            />
            
            <Select
              label="Large Size"
              options={simpleOptions}
              value={values.sizes.lg}
              onValueChange={handleSizeChange('lg')}
              size="lg"
              placeholder="Large select"
            />
          </VStack>
        </Card>
        
        {/* Visual Variants */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Visual Variants</Text>
          <VStack className="space-y-4">
            <Select
              label="Outline Variant (Default)"
              options={simpleOptions}
              value={values.variants.outline}
              onValueChange={handleVariantChange('outline')}
              variant="outline"
              placeholder="Outline style"
            />
            
            <Select
              label="Filled Variant"
              options={simpleOptions}
              value={values.variants.filled}
              onValueChange={handleVariantChange('filled')}
              variant="filled"
              placeholder="Filled style"
            />
            
            <Select
              label="Ghost Variant"
              options={simpleOptions}
              value={values.variants.ghost}
              onValueChange={handleVariantChange('ghost')}
              variant="ghost"
              placeholder="Ghost style"
            />
          </VStack>
        </Card>
        
        {/* Animation Types */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Animation Types</Text>
          <VStack className="space-y-4">
            <Select
              label="Scale Animation (Default)"
              options={simpleOptions}
              value={values.animated}
              onValueChange={handleChange('animated')}
              animationType="scale"
              placeholder="Opens with scale effect"
            />
            
            <Select
              label="Fade Animation"
              options={simpleOptions}
              value=""
              onValueChange={() => {}}
              animationType="fade"
              placeholder="Opens with fade effect"
            />
            
            <Select
              label="Slide Animation"
              options={simpleOptions}
              value=""
              onValueChange={() => {}}
              animationType="slide"
              placeholder="Opens with slide effect"
            />
            
            <Select
              label="No Stagger Animation"
              options={simpleOptions}
              value=""
              onValueChange={() => {}}
              dropdownStagger={false}
              placeholder="Items appear all at once"
            />
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}