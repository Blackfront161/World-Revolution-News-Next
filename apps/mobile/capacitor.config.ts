import type { CapacitorConfig } from '@capacitor/cli';

/** Contract only: no native Android directory is generated in WRN-G3-001. */
const config: CapacitorConfig = {
  appId: 'com.world.revolution',
  appName: 'WRN Foundation',
  webDir: 'dist',
};

export default config;
