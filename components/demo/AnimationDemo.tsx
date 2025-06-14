import React, { useState } from 'react';
import { View, ScrollView } from 'react-native';
import {
  Text,
  Card,
  Button,
  VStack,
  HStack,
  Badge,
  Separator,
  Switch,
} from '@/components/universal';
import { PageContainer, AnimatedLayout, StaggeredList } from '@/components/layout/AnimatedLayout';
import { useFadeAnimation, useScaleAnimation, useEntranceAnimation } from '@/lib/ui/animations';
import { useAnimationStore } from '@/lib/stores/animation-store';
import { cn } from '@/lib/core/utils';

/**
 * Animation Demo Component
 * Showcases the enhanced animation system
 */
export function AnimationDemo() {
  const [activeDemo, setActiveDemo] = useState<'entrance' | 'interaction' | 'list'>('entrance');
  const { enableAnimations, setEnableAnimations, animationSpeed, setAnimationSpeed } = useAnimationStore();

  return (
    <PageContainer>
      <ScrollView className="flex-1">
        <VStack className="p-6 gap-6">
          {/* Header */}
          <AnimatedLayout type="fade">
            <Card className="p-6">
              <VStack gap={4}>
                <Text size="2xl" weight="bold">Animation System Demo</Text>
                <Text className="text-muted-foreground">
                  Explore our enhanced animation system with Tailwind and Reanimated
                </Text>
              </VStack>
            </Card>
          </AnimatedLayout>

          {/* Animation Controls */}
          <AnimatedLayout type="slide" delay={100}>
            <Card className="p-6">
              <VStack gap={4}>
                <Text size="lg" weight="semibold">Animation Controls</Text>
                
                <HStack justify="between" align="center">
                  <Text>Enable Animations</Text>
                  <Switch
                    value={enableAnimations}
                    onValueChange={setEnableAnimations}
                  />
                </HStack>

                <VStack gap={2}>
                  <Text size="sm">Animation Speed</Text>
                  <HStack gap={2}>
                    {[0.5, 1, 2].map((speed) => (
                      <Button
                        key={speed}
                        variant={animationSpeed === speed ? 'default' : 'outline'}
                        size="sm"
                        onPress={() => setAnimationSpeed(speed)}
                      >
                        {speed}x
                      </Button>
                    ))}
                  </HStack>
                </VStack>
              </VStack>
            </Card>
          </AnimatedLayout>

          {/* Demo Selector */}
          <AnimatedLayout type="slide" delay={200}>
            <Card className="p-6">
              <VStack gap={4}>
                <Text size="lg" weight="semibold">Select Demo</Text>
                <HStack gap={2} className="flex-wrap">
                  {(['entrance', 'interaction', 'list'] as const).map((demo) => (
                    <Button
                      key={demo}
                      variant={activeDemo === demo ? 'default' : 'outline'}
                      size="sm"
                      onPress={() => setActiveDemo(demo)}
                      className="capitalize"
                    >
                      {demo}
                    </Button>
                  ))}
                </HStack>
              </VStack>
            </Card>
          </AnimatedLayout>

          <Separator />

          {/* Demo Content */}
          {activeDemo === 'entrance' && <EntranceAnimationDemo />}
          {activeDemo === 'interaction' && <InteractionAnimationDemo />}
          {activeDemo === 'list' && <ListAnimationDemo />}
        </VStack>
      </ScrollView>
    </PageContainer>
  );
}

/**
 * Entrance Animation Demo
 */
function EntranceAnimationDemo() {
  return (
    <VStack gap={4}>
      <AnimatedLayout type="fade">
        <Card className="p-6">
          <Text size="lg" weight="semibold">Fade Animation</Text>
          <Text className="text-muted-foreground">
            Simple fade in animation
          </Text>
        </Card>
      </AnimatedLayout>

      <AnimatedLayout type="slide" delay={100}>
        <Card className="p-6">
          <Text size="lg" weight="semibold">Slide Animation</Text>
          <Text className="text-muted-foreground">
            Slide up from bottom with fade
          </Text>
        </Card>
      </AnimatedLayout>

      <AnimatedLayout type="scale" delay={200}>
        <Card className="p-6">
          <Text size="lg" weight="semibold">Scale Animation</Text>
          <Text className="text-muted-foreground">
            Scale in from 95% to 100%
          </Text>
        </Card>
      </AnimatedLayout>

      <AnimatedLayout type="scale-fade" delay={300}>
        <Card className="p-6">
          <Text size="lg" weight="semibold">Scale + Fade Animation</Text>
          <Text className="text-muted-foreground">
            Combined scale and fade effect
          </Text>
        </Card>
      </AnimatedLayout>
    </VStack>
  );
}

/**
 * Interaction Animation Demo
 */
function InteractionAnimationDemo() {
  return (
    <VStack gap={4}>
      <Card 
        className={cn(
          "p-6",
          "transition-all duration-200",
          "hover:scale-[1.02] hover:shadow-lg",
          "active:scale-[0.98]"
        )}
      >
        <Text size="lg" weight="semibold">Hover & Press Effects</Text>
        <Text className="text-muted-foreground">
          Hover to lift, press to scale down
        </Text>
      </Card>

      <Card className="p-6">
        <VStack gap={3}>
          <Text size="lg" weight="semibold">Button Animations</Text>
          <HStack gap={3} className="flex-wrap">
            <Button 
              variant="default"
              className="animate-pulse"
            >
              Pulse
            </Button>
            <Button 
              variant="secondary"
              className="animate-bounce"
            >
              Bounce
            </Button>
            <Button 
              variant="outline"
              className="hover:animate-shake"
            >
              Hover to Shake
            </Button>
          </HStack>
        </VStack>
      </Card>

      <Card className="p-6 animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]">
        <Text size="lg" weight="semibold">Shimmer Effect</Text>
        <Text className="text-muted-foreground">
          Loading skeleton animation
        </Text>
      </Card>
    </VStack>
  );
}

/**
 * List Animation Demo
 */
function ListAnimationDemo() {
  const items = [
    { id: 1, title: 'First Item', color: 'destructive' },
    { id: 2, title: 'Second Item', color: 'secondary' },
    { id: 3, title: 'Third Item', color: 'default' },
    { id: 4, title: 'Fourth Item', color: 'success' },
    { id: 5, title: 'Fifth Item', color: 'warning' },
  ];

  return (
    <VStack gap={4}>
      <Text size="lg" weight="semibold">Staggered List Animation</Text>
      
      {items.map((item, index) => (
        <AnimatedLayout 
          key={item.id} 
          type="slide" 
          delay={index * 100}
        >
          <Card className="p-4">
            <HStack justify="between" align="center">
              <Text weight="medium">{item.title}</Text>
              <Badge variant={item.color as any}>
                Item {item.id}
              </Badge>
            </HStack>
          </Card>
        </AnimatedLayout>
      ))}

      <AnimatedLayout type="fade" delay={600}>
        <Card className="p-6 text-center">
          <Text className="text-muted-foreground">
            Each item animates with a staggered delay
          </Text>
        </Card>
      </AnimatedLayout>
    </VStack>
  );
}