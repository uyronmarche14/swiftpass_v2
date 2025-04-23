/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const redPalette = {
  primary: "#E31837", // Less aggressive red
  light: "#FF4B5C", // Softer red
  lighter: "#FF8C99", // Very soft red
  lightest: "#FFE5E8", // Very light pink
  dark: "#CC0000",
  darker: "#990000",
};

export const Colors = {
  light: {
    text: "#1A1A1A",
    background: "#FFFFFF",
    tint: redPalette.primary,
    icon: redPalette.light,
    tabIconDefault: redPalette.lighter,
    tabIconSelected: redPalette.primary,
    secondary: redPalette.light,
    success: "#2ECC71", // Keep success green
    danger: redPalette.darker,
    card: "#FFFFFF",
    cardBorder: "#F0F0F0",
    inputBorder: "#E0E0E0",
    inputBackground: "#FFFFFF",
    buttonPrimary: redPalette.primary,
    buttonSecondary: redPalette.lightest,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: "#fff",
    icon: "#9BA1A6",
    tabIconDefault: "#9BA1A6",
    tabIconSelected: "#fff",
  },
};
