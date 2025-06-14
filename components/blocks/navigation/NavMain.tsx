import React from 'react';
import { useRouter } from 'expo-router';
import { Platform, Pressable } from 'react-native';
import { Symbol } from '@/components/universal/display/Symbols';
import { Text } from '@/components/universal/typography/Text';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/universal/interaction/Collapsible";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
} from "@/components/universal/navigation";
import { useAnimationVariant } from '@/hooks/useAnimationVariant';
import { useNavigationTransition } from '@/hooks/useNavigationTransition';
import { haptic } from '@/lib/ui/haptics';

import Animated, {
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export interface NavMainProps {
  items: {
    title: string;
    url: string;
    icon?: string;
    isActive?: boolean;
    items?: {
      title: string;
      url: string;
    }[];
  }[];
}

export function NavMain({ items }: NavMainProps) {
  const router = useRouter();
  const { startTransition } = useNavigationTransition();
  const { config, isAnimated } = useAnimationVariant({ variant: 'moderate' });

  const handleNavigation = (url: string) => {
    if (Platform.OS !== 'web') {
      haptic('selection');
    }
    
    startTransition(() => {
      router.push(url as any);
    });
  };

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <Collapsible
            key={item.title}
            asChild
            defaultOpen={item.isActive}
            className="group/collapsible"
          >
            <SidebarMenuItem>
              <CollapsibleTrigger asChild>
                <SidebarMenuButton 
                  tooltip={item.title}
                  onPress={() => {
                    if (!item.items) {
                      handleNavigation(item.url);
                    }
                  }}
                >
                  {item.icon && <Symbol name={item.icon} size={16} />}
                  <Text>{item.title}</Text>
                  {item.items && (
                    <Symbol 
                      name="chevron.right" 
                      size={12} 
                      className="ml-auto transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" 
                    />
                  )}
                </SidebarMenuButton>
              </CollapsibleTrigger>
              {item.items && (
                <CollapsibleContent>
                  <SidebarMenuSub>
                    {item.items.map((subItem) => (
                      <SidebarMenuSubItem key={subItem.title}>
                        <SidebarMenuSubButton 
                          onPress={() => handleNavigation(subItem.url)}
                        >
                          <Text>{subItem.title}</Text>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    ))}
                  </SidebarMenuSub>
                </CollapsibleContent>
              )}
            </SidebarMenuItem>
          </Collapsible>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}