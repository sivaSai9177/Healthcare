import React, { useState } from 'react';
import { View, ScrollView, Pressable } from 'react-native';
import { useFilterPresets } from '@/contexts/AlertFilterContext';
import { 
  Text, 
  Button, 
  Symbol,
  HStack,
  VStack,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  Input,
} from '@/components/universal';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { haptic } from '@/lib/ui/haptics';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

export function AlertFilterPresets() {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const {
    presets,
    commonPresets,
    savePreset,
    loadPreset,
    deletePreset,
    createCommonPresets,
  } = useFilterPresets();
  
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  const handleLoadPreset = (presetId: string) => {
    haptic('light');
    loadPreset(presetId);
    setSelectedPreset(presetId);
  };

  const handleSavePreset = async () => {
    if (!presetName.trim()) return;
    
    try {
      await savePreset(presetName);
      setShowSaveDialog(false);
      setPresetName('');
      haptic('success');
    } catch (error) {
      haptic('error');
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    haptic('medium');
    try {
      await deletePreset(presetId);
      if (selectedPreset === presetId) {
        setSelectedPreset(null);
      }
      haptic('success');
    } catch (error) {
      haptic('error');
    }
  };

  const handleCreateDefaults = async () => {
    haptic('medium');
    try {
      await createCommonPresets();
      haptic('success');
    } catch (error) {
      haptic('error');
    }
  };

  return (
    <>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ 
          paddingHorizontal: spacing[4] as number,
          gap: spacing[2] as number,
        }}
      >
        {/* Save Current Button */}
        <Pressable onPress={() => setShowSaveDialog(true)}>
          <Animated.View
            entering={FadeIn.duration(200)}
            style={{
              backgroundColor: theme.primary + '20',
              paddingHorizontal: spacing[3] as number,
              paddingVertical: spacing[2] as number,
              borderRadius: 8,
              borderWidth: 1,
              borderColor: theme.primary + '30',
            }}
          >
            <HStack gap={spacing[1] as number} alignItems="center">
              <Symbol name="plus.circle" size="xs" color={theme.primary} />
              <Text size="sm" weight="medium" style={{ color: theme.primary }}>
                Save Current
              </Text>
            </HStack>
          </Animated.View>
        </Pressable>

        {/* Preset Pills */}
        {presets.map((preset) => (
          <Pressable
            key={preset.id}
            onPress={() => handleLoadPreset(preset.id)}
            onLongPress={() => handleDeletePreset(preset.id)}
          >
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{
                backgroundColor: selectedPreset === preset.id 
                  ? theme.primary 
                  : theme.card,
                paddingHorizontal: spacing[3] as number,
                paddingVertical: spacing[2] as number,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: selectedPreset === preset.id 
                  ? theme.primary 
                  : theme.border,
              }}
            >
              <HStack gap={spacing[1] as number} alignItems="center">
                {preset.isDefault && (
                  <Symbol 
                    name="star.fill" 
                    size="xs" 
                    color={selectedPreset === preset.id ? 'white' : theme.warning} 
                  />
                )}
                <Text 
                  size="sm" 
                  weight="medium" 
                  style={{ 
                    color: selectedPreset === preset.id ? 'white' : theme.foreground 
                  }}
                >
                  {preset.name}
                </Text>
              </HStack>
            </Animated.View>
          </Pressable>
        ))}

        {/* Create Defaults Button (if no presets) */}
        {presets.length === 0 && (
          <Pressable onPress={handleCreateDefaults}>
            <Animated.View
              entering={FadeIn.duration(200)}
              style={{
                backgroundColor: theme.accent + '20',
                paddingHorizontal: spacing[3] as number,
                paddingVertical: spacing[2] as number,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: theme.accent + '30',
              }}
            >
              <HStack gap={spacing[1] as number} alignItems="center">
                <Symbol name="wand.and.stars" size="xs" color={theme.accent} />
                <Text size="sm" weight="medium" style={{ color: theme.accent }}>
                  Create Defaults
                </Text>
              </HStack>
            </Animated.View>
          </Pressable>
        )}
      </ScrollView>

      {/* Save Preset Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Filter Preset</DialogTitle>
          </DialogHeader>
          
          <VStack gap={spacing[3] as number} p={spacing[4] as number}>
            <Input
              placeholder="Preset name"
              value={presetName}
              onChangeText={setPresetName}
              autoFocus
              onSubmitEditing={handleSavePreset}
            />
            
            <Text size="sm" colorTheme="mutedForeground">
              Save your current filter settings as a preset for quick access
            </Text>
          </VStack>
          
          <DialogFooter>
            <Button
              variant="ghost"
              onPress={() => setShowSaveDialog(false)}
            >
              Cancel
            </Button>
            <Button
              onPress={handleSavePreset}
              disabled={!presetName.trim()}
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}