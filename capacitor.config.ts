import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.omniversesyndicate.codex',
  appName: 'CODEX Wallet',
  webDir: 'dist/public',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: "#0a0a0f",
      androidSplashResourceName: "splash",
      androidScaleType: "CENTER_CROP",
      showSpinner: false,
      spinnerColor: "#9945FF",
      splashFullScreen: true,
      splashImmersive: true,
      iosSpinnerStyle: "large",
      layoutName: "launch_screen",
      useDialog: false
    },
    StatusBar: {
      style: 'dark',
      backgroundColor: "#0a0a0f",
      overlaysWebView: false
    },
    Keyboard: {
      resize: 'body',
      resizeOnFullScreen: true
    },
    LocalNotifications: {
      smallIcon: "ic_stat_icon",
      iconColor: "#9945FF",
      sound: "notification.wav"
    }
  },
  ios: {
    contentInset: 'automatic',
    backgroundColor: "#0a0a0f",
    preferredContentMode: 'mobile'
  },
  android: {
    backgroundColor: "#0a0a0f"
  }
};

export default config;
