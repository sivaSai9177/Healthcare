import * as React from 'react';
import { useState, useEffect } from 'react';
import { View, ScrollView, Switch, Platform } from 'react-native';
import { VStack, HStack } from '@/components/universal/layout';
import { Text } from '@/components/universal/typography';
import { Card, Badge } from '@/components/universal/display';
import { Button } from '@/components/universal/interaction';
import { Slider, Select } from '@/components/universal/form';
import { useTheme } from '@/lib/theme/provider';
import { useSpacing } from '@/lib/stores/spacing-store';
import { api } from '@/lib/api/trpc';
import { showSuccessAlert, showErrorAlert } from '@/lib/core/alert';
import { haptic } from '@/lib/ui/haptics';
import { ALERT_TYPE_CONFIG } from '@/types/healthcare';
import * as Notifications from 'expo-notifications';
import { Audio } from 'expo-av';

interface SoundPreferences {
  enabled: boolean;
  volume: number;
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  criticalOverride: boolean;
  sounds: {
    [alertType: string]: {
      enabled: boolean;
      soundFile: string;
      vibrate: boolean;
    };
  };
}

const DEFAULT_PREFERENCES: SoundPreferences = {
  enabled: true,
  volume: 0.8,
  quietHoursEnabled: false,
  quietHoursStart: '22:00',
  quietHoursEnd: '07:00',
  criticalOverride: true,
  sounds: {
    cardiac_arrest: { enabled: true, soundFile: 'critical', vibrate: true },
    code_blue: { enabled: true, soundFile: 'urgent', vibrate: true },
    fire: { enabled: true, soundFile: 'critical', vibrate: true },
    security: { enabled: true, soundFile: 'alert', vibrate: true },
    medical_emergency: { enabled: true, soundFile: 'urgent', vibrate: true },
  },
};

const SOUND_OPTIONS = [
  { value: 'critical', label: 'Critical Alert' },
  { value: 'urgent', label: 'Urgent Alert' },
  { value: 'alert', label: 'Standard Alert' },
  { value: 'chime', label: 'Chime' },
  { value: 'notification', label: 'Notification' },
];

export function AlertSoundSettings() {
  const theme = useTheme();
  const { spacing } = useSpacing();
  const [preferences, setPreferences] = useState<SoundPreferences>(DEFAULT_PREFERENCES);
  const [isSaving, setIsSaving] = useState(false);
  const [sound, setSound] = useState<Audio.Sound>();

  // Load user preferences
  const { data: userPreferences, refetch } = api.user.getPreferences.useQuery();
  
  useEffect(() => {
    if (userPreferences?.notificationPreferences) {
      try {
        const parsed = JSON.parse(userPreferences.notificationPreferences);
        if (parsed.soundPreferences) {
          setPreferences(parsed.soundPreferences);
        }
      } catch (error) {
        console.error('Failed to parse notification preferences:', error);
      }
    }
  }, [userPreferences]);

  // Update preferences mutation
  const updatePreferencesMutation = api.user.updatePreferences.useMutation({
    onSuccess: () => {
      showSuccessAlert('Settings Saved', 'Your sound preferences have been updated');
      refetch();
    },
    onError: () => {
      showErrorAlert('Failed to save', 'Please try again');
    },
  });

  const handleSave = async () => {
    setIsSaving(true);
    haptic('medium');
    
    try {
      const currentPrefs = userPreferences?.notificationPreferences 
        ? JSON.parse(userPreferences.notificationPreferences)
        : {};
      
      await updatePreferencesMutation.mutateAsync({
        notificationPreferences: JSON.stringify({
          ...currentPrefs,
          soundPreferences: preferences,
        }),
      });
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const playTestSound = async (soundFile: string) => {
    haptic('light');
    
    if (Platform.OS === 'web') {
      // Web audio playback - placeholder
      console.log(`Would play sound: ${soundFile}.mp3 at volume ${preferences.volume}`);
      showSuccessAlert('Sound Test', `Would play ${soundFile} sound`);
    } else {
      // Native audio playback
      try {
        const soundFileAsset = getSoundFile(soundFile);
        if (!soundFileAsset) {
          console.log(`Sound file not available: ${soundFile}`);
          showSuccessAlert('Sound Test', `Would play ${soundFile} sound`);
          return;
        }
        
        if (sound) {
          await sound.unloadAsync();
        }
        
        const { sound: newSound } = await Audio.Sound.createAsync(
          soundFileAsset,
          { volume: preferences.volume }
        );
        setSound(newSound);
        await newSound.playAsync();
      } catch (error) {
        console.error('Failed to play sound:', error);
        showErrorAlert('Sound Error', 'Could not play test sound');
      }
    }
  };

  const getSoundFile = (soundName: string) => {
    // TODO: Add actual sound files to assets/sounds/
    // For now, return null - sound playback will be implemented when files are added
    console.log(`Sound file requested: ${soundName}.mp3`);
    return null;
  };

  const updateAlertSound = (alertType: string, field: string, value: any) => {
    setPreferences(prev => ({
      ...prev,
      sounds: {
        ...prev.sounds,
        [alertType]: {
          ...prev.sounds[alertType],
          [field]: value,
        },
      },
    }));
  };

  // Cleanup sound on unmount
  useEffect(() => {
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [sound]);

  return (
    <ScrollView showsVerticalScrollIndicator={false}>
      <VStack gap={spacing[4] as any} p={spacing[4]}>
        {/* Master Sound Toggle */}
        <Card>
          <VStack gap={spacing[3] as any} p={spacing[4]}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack gap={spacing[1] as any}>
                <Text size="lg" weight="semibold">Alert Sounds</Text>
                <Text size="sm" colorTheme="mutedForeground">
                  Enable sound notifications for alerts
                </Text>
              </VStack>
              <Switch
                value={preferences.enabled}
                onValueChange={(value) => {
                  haptic('light');
                  setPreferences(prev => ({ ...prev, enabled: value }));
                }}
                trackColor={{ 
                  false: theme.border, 
                  true: theme.primary 
                }}
                thumbColor={preferences.enabled ? '#fff' : '#f4f3f4'}
              />
            </HStack>

            {/* Volume Control */}
            {preferences.enabled && (
              <VStack gap={spacing[2] as any}>
                <HStack justifyContent="space-between" alignItems="center">
                  <Text size="sm" weight="medium">Volume</Text>
                  <Text size="sm" colorTheme="mutedForeground">
                    {Math.round(preferences.volume * 100)}%
                  </Text>
                </HStack>
                <Slider
                  value={preferences.volume}
                  onValueChange={(value) => setPreferences(prev => ({ ...prev, volume: value }))}
                  minimumValue={0}
                  maximumValue={1}
                  step={0.05}
                />
              </VStack>
            )}
          </VStack>
        </Card>

        {/* Quiet Hours */}
        <Card>
          <VStack gap={spacing[3] as any} p={spacing[4]}>
            <HStack justifyContent="space-between" alignItems="center">
              <VStack gap={spacing[1] as any}>
                <Text size="lg" weight="semibold">Quiet Hours</Text>
                <Text size="sm" colorTheme="mutedForeground">
                  Mute non-critical alerts during specified hours
                </Text>
              </VStack>
              <Switch
                value={preferences.quietHoursEnabled}
                onValueChange={(value) => {
                  haptic('light');
                  setPreferences(prev => ({ ...prev, quietHoursEnabled: value }));
                }}
                trackColor={{ 
                  false: theme.border, 
                  true: theme.primary 
                }}
                thumbColor={preferences.quietHoursEnabled ? '#fff' : '#f4f3f4'}
              />
            </HStack>

            {preferences.quietHoursEnabled && (
              <>
                <HStack gap={spacing[3] as any} alignItems="center">
                  <VStack style={{ flex: 1 }}>
                    <Text size="sm" weight="medium">Start Time</Text>
                    <Text size="lg">{preferences.quietHoursStart}</Text>
                  </VStack>
                  <VStack style={{ flex: 1 }}>
                    <Text size="sm" weight="medium">End Time</Text>
                    <Text size="lg">{preferences.quietHoursEnd}</Text>
                  </VStack>
                </HStack>

                <HStack justifyContent="space-between" alignItems="center">
                  <VStack gap={spacing[1] as any} style={{ flex: 1 }}>
                    <Text size="sm" weight="medium">Critical Alert Override</Text>
                    <Text size="xs" colorTheme="mutedForeground">
                      Play sounds for critical alerts even during quiet hours
                    </Text>
                  </VStack>
                  <Switch
                    value={preferences.criticalOverride}
                    onValueChange={(value) => {
                      haptic('light');
                      setPreferences(prev => ({ ...prev, criticalOverride: value }));
                    }}
                    trackColor={{ 
                      false: theme.border, 
                      true: theme.destructive 
                    }}
                    thumbColor={preferences.criticalOverride ? '#fff' : '#f4f3f4'}
                  />
                </HStack>
              </>
            )}
          </VStack>
        </Card>

        {/* Alert Type Settings */}
        <Card>
          <VStack gap={spacing[3] as any} p={spacing[4]}>
            <Text size="lg" weight="semibold">Alert Type Settings</Text>
            
            {Object.entries(ALERT_TYPE_CONFIG).map(([alertType, config]) => {
              const soundPref = preferences.sounds[alertType] || {
                enabled: true,
                soundFile: 'alert',
                vibrate: true,
              };
              
              return (
                <VStack key={alertType} gap={spacing[2] as any}>
                  <HStack justifyContent="space-between" alignItems="center">
                    <HStack gap={spacing[2] as any} alignItems="center">
                      <Text size="xl">{(config as any).icon}</Text>
                      <VStack>
                        <Text weight="medium">{(config as any).label}</Text>
                        <Text size="xs" colorTheme="mutedForeground">
                          {alertType.replace(/_/g, ' ')}
                        </Text>
                      </VStack>
                    </HStack>
                    <Switch
                      value={soundPref.enabled}
                      onValueChange={(value) => {
                        haptic('light');
                        updateAlertSound(alertType, 'enabled', value);
                      }}
                      trackColor={{ 
                        false: theme.border, 
                        true: (config as any).color 
                      }}
                      thumbColor={soundPref.enabled ? '#fff' : '#f4f3f4'}
                    />
                  </HStack>
                  
                  {soundPref.enabled && (
                    <VStack gap={spacing[2] as any} style={{ marginLeft: spacing[10] as number }}>
                      <HStack gap={spacing[2] as any} alignItems="center">
                        <Text size="sm" style={{ width: 60 }}>Sound:</Text>
                        <View style={{ flex: 1 }}>
                          <Select
                            value={soundPref.soundFile}
                            onValueChange={(value) => updateAlertSound(alertType, 'soundFile', value)}
                            options={SOUND_OPTIONS}
                            placeholder="Select sound"
                          />
                        </View>
                        <Button
                          variant="ghost"
                          size="sm"
                          onPress={() => playTestSound(soundPref.soundFile)}
                        >
                          Test
                        </Button>
                      </HStack>
                      
                      <HStack gap={spacing[2] as any} alignItems="center">
                        <Text size="sm" style={{ width: 60 }}>Vibrate:</Text>
                        <Switch
                          value={soundPref.vibrate}
                          onValueChange={(value) => {
                            haptic('light');
                            updateAlertSound(alertType, 'vibrate', value);
                          }}
                          trackColor={{ 
                            false: theme.border, 
                            true: theme.primary 
                          }}
                          thumbColor={soundPref.vibrate ? '#fff' : '#f4f3f4'}
                        />
                      </HStack>
                    </VStack>
                  )}
                </VStack>
              );
            })}
          </VStack>
        </Card>

        {/* Save Button */}
        <Button
          onPress={handleSave}
          isLoading={isSaving}
          fullWidth
          size="lg"
        >
          Save Sound Settings
        </Button>
      </VStack>
    </ScrollView>
  );
}