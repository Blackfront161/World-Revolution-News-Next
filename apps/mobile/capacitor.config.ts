import type { CapacitorConfig } from '@capacitor/cli';

/** Local Capacitor contract for the separately delivered Android wrapper. */
const config: CapacitorConfig = {
  appId: 'com.world.revolution',
  appName: 'World Revolution News',
  webDir: 'dist',
  plugins: {
    // Every WRN theme keeps a black canvas; use light system-bar icons.
    SystemBars: { style: 'DARK' },
  },
};

export default config;
