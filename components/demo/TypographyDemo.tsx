import React from 'react';
import { ScrollView, View } from 'react-native';
import { 
  Display1, 
  Display2, 
  Heading1, 
  Heading2, 
  Heading3, 
  Heading4, 
  Heading5, 
  Heading6,
  BodyLarge,
  Body,
  BodySmall,
  Label,
  Caption,
  Overline,
  ButtonText,
  ButtonLargeText,
  Code,
  CodeBlock,
  Link,
  Text,
  TruncatedText,
  EllipsisText,
  ClampedText,
} from '@/components/universal/typography';
import { Card } from '@/components/universal/display';
import { VStack, HStack, Box, Divider } from '@/components/universal/layout';
import { Button } from '@/components/universal/interaction';
import { useTypography, useResponsiveTypography, useSystemFontScale } from '@/hooks/useTypography';
import { useSpacing } from '@/lib/stores/spacing-store';

export function TypographyDemo() {
  const { spacing, density, setDensity } = useSpacing();
  const typography = useTypography();
  const responsive = useResponsiveTypography();
  const systemScale = useSystemFontScale();
  
  const longText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.";
  
  return (
    <ScrollView className="flex-1 bg-background">
      <VStack gap={spacing[6]} className="p-4">
        {/* Density Controls */}
        <Card>
          <VStack gap={spacing[4]}>
            <Heading3>Typography Density</Heading3>
            <Caption>Current density: {density}</Caption>
            <HStack gap={spacing[2]}>
              <Button
                size="sm"
                variant={density === 'compact' ? 'default' : 'outline'}
                onPress={() => setDensity('compact')}
              >
                Compact
              </Button>
              <Button
                size="sm"
                variant={density === 'medium' ? 'default' : 'outline'}
                onPress={() => setDensity('medium')}
              >
                Medium
              </Button>
              <Button
                size="sm"
                variant={density === 'large' ? 'default' : 'outline'}
                onPress={() => setDensity('large')}
              >
                Large
              </Button>
            </HStack>
            <Caption>
              Font scale: {systemScale.fontScale}x {systemScale.isLargeText && '(Large Text)'}
            </Caption>
          </VStack>
        </Card>
        
        {/* Display Styles */}
        <Card>
          <VStack gap={spacing[4]}>
            <Overline>DISPLAY STYLES</Overline>
            <Display1>Display 1 - Hero Text</Display1>
            <Display2>Display 2 - Feature Text</Display2>
          </VStack>
        </Card>
        
        {/* Heading Hierarchy */}
        <Card>
          <VStack gap={spacing[3]}>
            <Overline>HEADING HIERARCHY</Overline>
            <Heading1>Heading 1 - Page Title</Heading1>
            <Heading2>Heading 2 - Section</Heading2>
            <Heading3>Heading 3 - Subsection</Heading3>
            <Heading4>Heading 4 - Group</Heading4>
            <Heading5>Heading 5 - Subgroup</Heading5>
            <Heading6>Heading 6 - Minor</Heading6>
          </VStack>
        </Card>
        
        {/* Body Text */}
        <Card>
          <VStack gap={spacing[3]}>
            <Overline>BODY TEXT</Overline>
            <BodyLarge>Body Large - Important content that needs emphasis</BodyLarge>
            <Body>Body - Regular paragraph text for main content</Body>
            <BodySmall>Body Small - Secondary information or fine print</BodySmall>
          </VStack>
        </Card>
        
        {/* UI Components */}
        <Card>
          <VStack gap={spacing[3]}>
            <Overline>UI COMPONENTS</Overline>
            <Label>Label Text - Form fields and inputs</Label>
            <Caption>Caption - Helper text and descriptions</Caption>
            <HStack gap={spacing[2]}>
              <Button>
                <ButtonText>Button Text</ButtonText>
              </Button>
              <Button size="lg">
                <ButtonLargeText>Large Button</ButtonLargeText>
              </Button>
            </HStack>
          </VStack>
        </Card>
        
        {/* Interactive Text */}
        <Card>
          <VStack gap={spacing[3]}>
            <Overline>INTERACTIVE TEXT</Overline>
            <Link onPress={() => {}}>
              This is a clickable link
            </Link>
            <Code>const example = "inline code";</Code>
            <CodeBlock>
{`function example() {
  return "code block";
}`}
            </CodeBlock>
          </VStack>
        </Card>
        
        {/* Text Truncation */}
        <Card>
          <VStack gap={spacing[3]}>
            <Overline>TEXT TRUNCATION</Overline>
            
            <Box>
              <Label>Ellipsis Text (1 line)</Label>
              <EllipsisText>{longText}</EllipsisText>
            </Box>
            
            <Box>
              <Label>Clamped Text (2 lines)</Label>
              <ClampedText lines={2}>{longText}</ClampedText>
            </Box>
            
            <Box>
              <Label>Expandable Text (3 lines)</Label>
              <TruncatedText lines={3} expandable>
                {longText + " " + longText}
              </TruncatedText>
            </Box>
          </VStack>
        </Card>
        
        {/* Responsive Typography */}
        <Card>
          <VStack gap={spacing[3]}>
            <Overline>RESPONSIVE TYPOGRAPHY</Overline>
            <Text size={{ xs: 'sm', md: 'base', lg: 'lg' }}>
              This text changes size based on screen width
            </Text>
            <Text>
              Current size: {responsive.getResponsiveSize('sm', 'base', 'lg')}px
            </Text>
          </VStack>
        </Card>
        
        {/* Typography with Presets */}
        <Card>
          <VStack gap={spacing[3]}>
            <Overline>USING PRESETS</Overline>
            <Text preset="h1">H1 Preset</Text>
            <Text preset="body">Body Preset</Text>
            <Text preset="label">Label Preset</Text>
            <Text preset="caption">Caption Preset</Text>
            <Text preset="button">Button Preset</Text>
          </VStack>
        </Card>
        
        {/* Custom Styling */}
        <Card>
          <VStack gap={spacing[3]}>
            <Overline>CUSTOM STYLING</Overline>
            <Text 
              size="xl" 
              weight="bold" 
              color="primary"
              letterSpacing="wide"
              lineHeight="tight"
            >
              Custom styled text
            </Text>
            <Text 
              size="sm" 
              weight="light" 
              color="muted"
              letterSpacing="wider"
              transform="uppercase"
            >
              Light uppercase text with wide spacing
            </Text>
          </VStack>
        </Card>
        
        {/* All Sizes */}
        <Card>
          <VStack gap={spacing[2]}>
            <Overline>ALL SIZES</Overline>
            <Text size="xs">Extra Small (xs)</Text>
            <Text size="sm">Small (sm)</Text>
            <Text size="base">Base</Text>
            <Text size="lg">Large (lg)</Text>
            <Text size="xl">Extra Large (xl)</Text>
            <Text size="2xl">2X Large (2xl)</Text>
            <Text size="3xl">3X Large (3xl)</Text>
            <Text size="4xl">4X Large (4xl)</Text>
            <Text size="5xl">5X Large (5xl)</Text>
            <Text size="6xl">6X Large (6xl)</Text>
            <Text size="7xl">7X Large (7xl)</Text>
            <Text size="8xl">8X Large (8xl)</Text>
            <Text size="9xl">9X Large (9xl)</Text>
          </VStack>
        </Card>
        
        {/* All Weights */}
        <Card>
          <VStack gap={spacing[2]}>
            <Overline>ALL WEIGHTS</Overline>
            <Text size="lg" weight="thin">Thin Weight</Text>
            <Text size="lg" weight="light">Light Weight</Text>
            <Text size="lg" weight="normal">Normal Weight</Text>
            <Text size="lg" weight="medium">Medium Weight</Text>
            <Text size="lg" weight="semibold">Semibold Weight</Text>
            <Text size="lg" weight="bold">Bold Weight</Text>
            <Text size="lg" weight="black">Black Weight</Text>
          </VStack>
        </Card>
        
        {/* Colors */}
        <Card>
          <VStack gap={spacing[2]}>
            <Overline>COLORS</Overline>
            <Text size="lg" color="foreground">Foreground Color</Text>
            <Text size="lg" color="muted">Muted Color</Text>
            <Text size="lg" color="primary">Primary Color</Text>
            <Text size="lg" color="secondary">Secondary Color</Text>
            <Text size="lg" color="destructive">Destructive Color</Text>
            <Text size="lg" color="accent">Accent Color</Text>
            <Text size="lg" color="success">Success Color</Text>
            <Text size="lg" color="warning">Warning Color</Text>
            <Text size="lg" color="info">Info Color</Text>
          </VStack>
        </Card>
      </VStack>
    </ScrollView>
  );
}