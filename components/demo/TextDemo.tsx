import React from 'react';
import { ScrollView, View } from 'react-native';
import { 
  Text, 
  Heading1, 
  Heading2, 
  Heading3, 
  Body, 
  Caption, 
  Code, 
  Link,
  AnimatedHeading,
  FadeInText,
} from '@/components/universal/typography/Text';
import { VStack, HStack, Card, Separator } from '../universal';

export function TextDemo() {
  return (
    <ScrollView className="flex-1 bg-background">
      <VStack className="p-4 space-y-6">
        {/* Animated Heading */}
        <AnimatedHeading delay={0}>
          Text Component Showcase
        </AnimatedHeading>
        
        {/* Typography Sizes */}
        <Card className="p-4">
          <Heading2 className="mb-4">Typography Sizes</Heading2>
          <VStack className="space-y-2">
            <Text size="xs">Extra Small Text (xs)</Text>
            <Text size="sm">Small Text (sm)</Text>
            <Text size="base">Base Text (base)</Text>
            <Text size="lg">Large Text (lg)</Text>
            <Text size="xl">Extra Large Text (xl)</Text>
            <Text size="2xl">2X Large Text (2xl)</Text>
            <Text size="3xl">3X Large Text (3xl)</Text>
          </VStack>
        </Card>
        
        {/* Font Weights */}
        <Card className="p-4">
          <Heading2 className="mb-4">Font Weights</Heading2>
          <VStack className="space-y-2">
            <Text weight="normal">Normal Weight Text</Text>
            <Text weight="medium">Medium Weight Text</Text>
            <Text weight="semibold">Semibold Weight Text</Text>
            <Text weight="bold">Bold Weight Text</Text>
          </VStack>
        </Card>
        
        {/* Colors */}
        <Card className="p-4">
          <Heading2 className="mb-4">Color Variants</Heading2>
          <VStack className="space-y-2">
            <Text color="foreground">Foreground Color</Text>
            <Text color="muted">Muted Color</Text>
            <Text color="primary">Primary Color</Text>
            <Text color="secondary">Secondary Color</Text>
            <Text color="destructive">Destructive Color</Text>
            <Text color="accent">Accent Color</Text>
            <Text color="success">Success Color</Text>
            <Text color="warning">Warning Color</Text>
            <Text color="info">Info Color</Text>
          </VStack>
        </Card>
        
        {/* Interactive Text */}
        <Card className="p-4">
          <Heading2 className="mb-4">Interactive Text</Heading2>
          <VStack className="space-y-3">
            <Text onPress={() => {}}>
              Press me! (with animation)
            </Text>
            
            <Link onPress={() => {}}>
              This is a link with underline
            </Link>
            
            <Code copyable>
              const code = "Click to copy!";
            </Code>
            
            <Text 
              color="primary" 
              weight="semibold"
              animated
              animateOnPress
              onPress={() => {}}
            >
              Custom Interactive Text
            </Text>
          </VStack>
        </Card>
        
        {/* Font Families */}
        <Card className="p-4">
          <Heading2 className="mb-4">Font Families</Heading2>
          <VStack className="space-y-2">
            <Text font="sans">Sans Serif Font (Default)</Text>
            <Text font="serif">Serif Font Family</Text>
            <Text font="mono">Monospace Font Family</Text>
          </VStack>
        </Card>
        
        {/* Text Transformations */}
        <Card className="p-4">
          <Heading2 className="mb-4">Text Transformations</Heading2>
          <VStack className="space-y-2">
            <Text transform="uppercase">uppercase text</Text>
            <Text transform="lowercase">LOWERCASE TEXT</Text>
            <Text transform="capitalize">capitalize each word</Text>
          </VStack>
        </Card>
        
        {/* Letter Spacing */}
        <Card className="p-4">
          <Heading2 className="mb-4">Letter Spacing</Heading2>
          <VStack className="space-y-2">
            <Text letterSpacing="tighter">Tighter Letter Spacing</Text>
            <Text letterSpacing="tight">Tight Letter Spacing</Text>
            <Text letterSpacing="normal">Normal Letter Spacing</Text>
            <Text letterSpacing="wide">Wide Letter Spacing</Text>
            <Text letterSpacing="wider">Wider Letter Spacing</Text>
            <Text letterSpacing="widest">Widest Letter Spacing</Text>
          </VStack>
        </Card>
        
        {/* Line Height */}
        <Card className="p-4">
          <Heading2 className="mb-4">Line Height</Heading2>
          <VStack className="space-y-4">
            <Text lineHeight="none">
              Line height none. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
            <Text lineHeight="tight">
              Line height tight. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
            <Text lineHeight="normal">
              Line height normal. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
            <Text lineHeight="relaxed">
              Line height relaxed. Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
              Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
            </Text>
          </VStack>
        </Card>
        
        {/* Animated Text Examples */}
        <Card className="p-4">
          <Heading2 className="mb-4">Animated Text</Heading2>
          <VStack className="space-y-4">
            <FadeInText delay={100} duration={800}>
              This text fades in with a delay
            </FadeInText>
            
            <FadeInText delay={300} duration={800} size="lg" weight="semibold">
              Larger text with longer delay
            </FadeInText>
            
            <FadeInText delay={500} duration={800} color="primary">
              Primary colored fade-in text
            </FadeInText>
            
            <AnimatedHeading delay={700}>
              Animated Heading with Spring
            </AnimatedHeading>
          </VStack>
        </Card>
        
        {/* Convenience Components */}
        <Card className="p-4">
          <Heading2 className="mb-4">Convenience Components</Heading2>
          <VStack className="space-y-3">
            <Heading1>Heading 1</Heading1>
            <Heading2>Heading 2</Heading2>
            <Heading3>Heading 3</Heading3>
            <Body>Body text for regular content</Body>
            <Caption>Caption text for descriptions</Caption>
            <Code>Code snippet component</Code>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}