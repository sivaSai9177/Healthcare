import React, { useState } from 'react';
import { ScrollView, View } from 'react-native';
import { Button } from '@/components/universal/interaction/Button';
import { Alert, AlertTitle, AlertDescription } from '@/components/universal/feedback/Alert';
import { Badge } from '@/components/universal/display/Badge';
import { VStack, HStack, Card, Text, Heading2, Symbol } from '../universal';

export function CoreComponentsDemo() {
  const [showAlert, setShowAlert] = useState(true);
  const [badgeCount, setBadgeCount] = useState(3);

  return (
    <ScrollView className="flex-1 bg-background">
      <VStack className="p-4 space-y-6">
        <Heading2>Core Components Showcase</Heading2>
        
        {/* Button Component */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Button Variants</Text>
          <VStack className="space-y-3">
            {/* Variants */}
            <HStack className="space-x-2 flex-wrap">
              <Button variant="default">Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
              <Button variant="destructive">Destructive</Button>
            </HStack>
            
            {/* Sizes */}
            <Text size="base" weight="medium" className="mt-4 mb-2">Sizes</Text>
            <HStack className="space-x-2 items-center">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
              <Button size="icon">
                <Symbol name="heart" size={16} />
              </Button>
            </HStack>
            
            {/* States */}
            <Text size="base" weight="medium" className="mt-4 mb-2">States</Text>
            <HStack className="space-x-2 flex-wrap">
              <Button isLoading>Loading</Button>
              <Button isDisabled>Disabled</Button>
              <Button fullWidth className="mt-2">Full Width</Button>
            </HStack>
            
            {/* With Icons */}
            <Text size="base" weight="medium" className="mt-4 mb-2">With Icons</Text>
            <HStack className="space-x-2">
              <Button 
                leftIcon={<Symbol name="chevron.left" size={16} />}
              >
                Back
              </Button>
              <Button 
                rightIcon={<Symbol name="chevron.right" size={16} />}
                variant="outline"
              >
                Next
              </Button>
              <Button 
                leftIcon={<Symbol name="plus" size={16} />}
                variant="secondary"
              >
                Add Item
              </Button>
            </HStack>
          </VStack>
        </Card>
        
        {/* Alert Component */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Alert Variants</Text>
          <VStack className="space-y-3">
            <Alert 
              variant="info"
              title="Information"
              description="This is an informational alert with helpful details."
            />
            
            <Alert 
              variant="success"
              title="Success!"
              description="Your action was completed successfully."
              action={
                <Button size="sm" variant="outline">
                  View Details
                </Button>
              }
            />
            
            <Alert 
              variant="warning"
              title="Warning"
              description="Please review this important information."
              showIcon
            />
            
            <Alert 
              variant="error"
              title="Error"
              description="Something went wrong. Please try again."
              shakeOnError
            />
            
            {showAlert && (
              <Alert 
                variant="default"
                title="Dismissible Alert"
                description="This alert can be closed by clicking the X."
                onClose={() => setShowAlert(false)}
                animationType="slideLeft"
              />
            )}
            
            {!showAlert && (
              <Button 
                variant="outline" 
                size="sm"
                onPress={() => setShowAlert(true)}
              >
                Show Dismissible Alert
              </Button>
            )}
            
            {/* Custom Alert Content */}
            <Alert variant="info">
              <AlertTitle>Custom Content Alert</AlertTitle>
              <AlertDescription>
                You can use AlertTitle and AlertDescription components for custom content.
              </AlertDescription>
              <HStack className="mt-2 space-x-2">
                <Button size="sm" variant="default">Accept</Button>
                <Button size="sm" variant="outline">Decline</Button>
              </HStack>
            </Alert>
          </VStack>
        </Card>
        
        {/* Badge Component */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Badge Variants</Text>
          <VStack className="space-y-4">
            {/* Variants */}
            <HStack className="space-x-2 flex-wrap">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="outline">Outline</Badge>
            </HStack>
            
            {/* Sizes */}
            <Text size="base" weight="medium">Sizes</Text>
            <HStack className="space-x-2 items-center">
              <Badge size="xs">XS</Badge>
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </HStack>
            
            {/* Rounded Options */}
            <Text size="base" weight="medium">Border Radius</Text>
            <HStack className="space-x-2">
              <Badge rounded="sm">Small</Badge>
              <Badge rounded="md">Medium</Badge>
              <Badge rounded="lg">Large</Badge>
              <Badge rounded="full">Full</Badge>
            </HStack>
            
            {/* With Dot */}
            <Text size="base" weight="medium">With Dot Indicator</Text>
            <HStack className="space-x-2">
              <Badge dot variant="success">Active</Badge>
              <Badge dot variant="warning">Pending</Badge>
              <Badge dot variant="error">Offline</Badge>
            </HStack>
            
            {/* Interactive Badge */}
            <Text size="base" weight="medium">Interactive & Animated</Text>
            <HStack className="space-x-2">
              <Badge 
                variant="primary"
                onPress={() => setBadgeCount(badgeCount + 1)}
                animateOnChange
                pulseOnUpdate
              >
                Count: {badgeCount}
              </Badge>
              <Badge 
                variant="outline"
                onPress={() => alert('Badge clicked!')}
              >
                Clickable
              </Badge>
            </HStack>
            
            {/* Animation Types */}
            <Text size="base" weight="medium">Animation Types</Text>
            <HStack className="space-x-2">
              <Badge animationType="scale" animationDelay={100}>Scale</Badge>
              <Badge animationType="scale" animationDelay={200} variant="primary">Delayed</Badge>
              <Badge animationType="scale" animationDelay={300} variant="secondary">Staggered</Badge>
            </HStack>
          </VStack>
        </Card>
        
        {/* Combined Example */}
        <Card className="p-4">
          <Text size="lg" weight="semibold" className="mb-4">Combined Example</Text>
          <VStack className="space-y-3">
            <Alert variant="info" title="New Features Available">
              <AlertDescription>
                We've added new components to the design system.
              </AlertDescription>
              <HStack className="mt-3 space-x-2 items-center">
                <Button size="sm" variant="default">
                  Explore Features
                </Button>
                <Badge variant="success" dot>3 New</Badge>
              </HStack>
            </Alert>
            
            <HStack className="space-x-2 items-center">
              <Button 
                variant="outline"
                leftIcon={<Symbol name="bell" size={16} />}
              >
                Notifications
              </Button>
              <Badge variant="error" rounded="full">{badgeCount}</Badge>
            </HStack>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}