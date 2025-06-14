import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { 
  Input, 
  PasswordInput, 
  SearchInput, 
  EmailInput 
} from '@/components/universal/form/Input';
import { VStack, Card, Button, Text, Heading2 } from '../universal';

export function InputDemo() {
  const [values, setValues] = useState({
    basic: '',
    email: '',
    password: '',
    search: '',
    floating: '',
    character: '',
    error: '',
    success: 'Valid input',
  });
  
  const [showError, setShowError] = useState(false);
  
  const handleChange = (field: string) => (text: string) => {
    setValues(prev => ({ ...prev, [field]: text }));
  };
  
  return (
    <ScrollView className="flex-1 bg-background">
      <VStack className="p-4 space-y-6">
        <Heading2>Input Component Showcase</Heading2>
        
        {/* Basic Inputs */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Basic Inputs</Text>
          <VStack className="space-y-4">
            <Input
              label="Basic Input"
              placeholder="Enter text..."
              value={values.basic}
              onChangeText={handleChange('basic')}
            />
            
            <Input
              label="Required Field"
              placeholder="This field is required"
              isRequired
              hint="This field must be filled out"
            />
            
            <Input
              label="Disabled Input"
              placeholder="Cannot edit this"
              value="Disabled content"
              isDisabled
            />
            
            <Input
              label="Loading State"
              placeholder="Loading..."
              isLoading
              value="Processing..."
            />
          </VStack>
        </Card>
        
        {/* Input Sizes */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Size Variants</Text>
          <VStack className="space-y-4">
            <Input
              size="sm"
              label="Small Input"
              placeholder="Small size"
            />
            
            <Input
              size="md"
              label="Medium Input (Default)"
              placeholder="Medium size"
            />
            
            <Input
              size="lg"
              label="Large Input"
              placeholder="Large size"
            />
          </VStack>
        </Card>
        
        {/* Input Variants */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Visual Variants</Text>
          <VStack className="space-y-4">
            <Input
              variant="outline"
              label="Outline Variant (Default)"
              placeholder="Standard outline input"
            />
            
            <Input
              variant="filled"
              label="Filled Variant"
              placeholder="Filled background"
            />
            
            <Input
              variant="ghost"
              label="Ghost Variant"
              placeholder="Minimal styling"
            />
          </VStack>
        </Card>
        
        {/* Floating Label */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Floating Label Animation</Text>
          <VStack className="space-y-4">
            <Input
              label="Floating Label"
              placeholder="Focus to see animation"
              value={values.floating}
              onChangeText={handleChange('floating')}
              floatingLabel
            />
            
            <Input
              label="Static Label"
              placeholder="No floating animation"
              floatingLabel={false}
            />
          </VStack>
        </Card>
        
        {/* Icons and Elements */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Icons & Elements</Text>
          <VStack className="space-y-4">
            <Input
              label="With Left Icon"
              leftIcon="person"
              placeholder="Username"
            />
            
            <Input
              label="With Right Icon"
              rightIcon="checkmark.circle"
              placeholder="Verified input"
            />
            
            <Input
              label="With Clear Button"
              showClearButton
              placeholder="Type to see clear button"
              value={values.character}
              onChangeText={handleChange('character')}
            />
          </VStack>
        </Card>
        
        {/* Specialized Inputs */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Specialized Inputs</Text>
          <VStack className="space-y-4">
            <EmailInput
              label="Email Address"
              placeholder="user@example.com"
              value={values.email}
              onChangeText={handleChange('email')}
              hint="We'll never share your email"
            />
            
            <PasswordInput
              label="Password"
              placeholder="Enter password"
              value={values.password}
              onChangeText={handleChange('password')}
              hint="Click the eye icon to toggle visibility"
            />
            
            <SearchInput
              placeholder="Search for anything..."
              value={values.search}
              onChangeText={handleChange('search')}
            />
          </VStack>
        </Card>
        
        {/* Validation States */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Validation & Feedback</Text>
          <VStack className="space-y-4">
            <Input
              label="Error State"
              placeholder="This has an error"
              value={values.error}
              onChangeText={handleChange('error')}
              error={showError ? "This field has an error" : undefined}
              shakeOnError
            />
            
            <Input
              label="Success State"
              placeholder="Valid input"
              value={values.success}
              onChangeText={handleChange('success')}
              success
              hint="Great! This looks good"
            />
            
            <Button 
              onPress={() => setShowError(!showError)}
              variant="outline"
              size="sm"
            >
              Toggle Error State
            </Button>
          </VStack>
        </Card>
        
        {/* Character Count */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Character Counting</Text>
          <VStack className="space-y-4">
            <Input
              label="Bio"
              placeholder="Tell us about yourself..."
              showCharacterCount
              maxLength={100}
              multiline
              numberOfLines={3}
              style={{ minHeight: 80 }}
            />
            
            <Input
              label="Username"
              placeholder="Choose a username"
              showCharacterCount
              maxLength={20}
              leftIcon="at"
            />
          </VStack>
        </Card>
        
        {/* Rounded Corners */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Border Radius</Text>
          <VStack className="space-y-4">
            <Input
              rounded="none"
              label="No Rounding"
              placeholder="Sharp corners"
            />
            
            <Input
              rounded="sm"
              label="Small Rounding"
              placeholder="Subtle corners"
            />
            
            <Input
              rounded="md"
              label="Medium Rounding (Default)"
              placeholder="Standard corners"
            />
            
            <Input
              rounded="lg"
              label="Large Rounding"
              placeholder="Rounded corners"
            />
            
            <Input
              rounded="full"
              label="Full Rounding"
              placeholder="Pill-shaped"
            />
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}