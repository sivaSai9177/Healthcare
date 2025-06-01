import React from "react";
import { View, Text, Image, TouchableOpacity } from "react-native";

interface AvatarProps {
  image?: string | null;
  name: string;
  size?: number;
  onPress?: () => void;
}

export function Avatar({ image, name, size = 40, onPress }: AvatarProps) {
  // Get initials from name
  const getInitials = (name: string) => {
    const words = name.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0][0]}${words[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const AvatarContent = () => {
    if (image) {
      return (
        <View 
          style={{ 
            width: size, 
            height: size, 
            borderRadius: size / 2,
            overflow: 'hidden',
            backgroundColor: '#e5e7eb' // gray-200 fallback
          }}
        >
          <Image 
            source={{ uri: image }} 
            style={{ width: '100%', height: '100%' }}
            onError={() => {
              console.log('[Avatar] Failed to load image:', image);
            }}
          />
        </View>
      );
    }

    // Fallback to initials
    return (
      <View 
        style={{ 
          width: size, 
          height: size, 
          borderRadius: size / 2,
          backgroundColor: '#6366f1', // indigo-500
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <Text 
          style={{ 
            color: '#ffffff', 
            fontSize: size * 0.4, 
            fontWeight: '600'
          }}
        >
          {getInitials(name)}
        </Text>
      </View>
    );
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
        <AvatarContent />
      </TouchableOpacity>
    );
  }

  return <AvatarContent />;
}