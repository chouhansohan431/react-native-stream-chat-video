import React, { useEffect } from 'react'
import { View, Text, StyleSheet, Animated, Image } from 'react-native'
import { colors, fonts, spacing } from '../../theme'

type SplashScreenProps = {
  onFinish: () => void
}

export default function SplashScreen({ onFinish }: SplashScreenProps) {
  const fadeAnim = new Animated.Value(0)

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start()
  }, [fadeAnim])

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
        },
      ]}
    >
      <View style={styles.content}>
        <View style={styles.logoContainer}>
          <Text style={styles.logo}>💬</Text>
        </View>
        <Text style={styles.appName}>ChatFlow</Text>
        <Text style={styles.tagline}>Connect & Chat</Text>
      </View>
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    opacity: 0.9,
  },
  logo: {
    fontSize: 48,
  },
  appName: {
    fontSize: fonts.xxxlarge,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.sm,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: fonts.medium,
    color: colors.white,
    opacity: 0.8,
    fontWeight: '400',
  },
})
