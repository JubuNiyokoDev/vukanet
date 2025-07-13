import React from 'react';
import {View, StyleSheet, ViewStyle} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
} from 'react-native-reanimated';
import {useEffect} from 'react';

interface AnimatedCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  delay?: number;
  animationType?: 'fadeIn' | 'slideUp' | 'scale';
}

const AnimatedCard: React.FC<AnimatedCardProps> = ({
  children,
  style,
  delay = 0,
  animationType = 'fadeIn',
}) => {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(50);
  const scale = useSharedValue(0.8);

  useEffect(() => {
    const timer = setTimeout(() => {
      opacity.value = withTiming(1, {duration: 600});
      translateY.value = withSpring(0, {damping: 15, stiffness: 100});
      scale.value = withSpring(1, {damping: 15, stiffness: 100});
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, opacity, translateY, scale]);

  const animatedStyle = useAnimatedStyle(() => {
    switch (animationType) {
      case 'slideUp':
        return {
          opacity: opacity.value,
          transform: [{translateY: translateY.value}],
        };
      case 'scale':
        return {
          opacity: opacity.value,
          transform: [{scale: scale.value}],
        };
      default:
        return {
          opacity: opacity.value,
        };
    }
  });

  return (
    <Animated.View style={[styles.card, style, animatedStyle]}>
      {children}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
});

export default AnimatedCard;