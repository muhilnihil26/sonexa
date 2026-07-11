import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.sonexa.war",
  appName: "Sonexa",
  webDir: "build/capacitor-web",
  bundledWebRuntime: false,
  version: "1.0.0",
  android: {
    backgroundColor: "#08080c",
    buildOptions: {
      signingType: "apksigner",
    },
  },
  server: {
    url: "https://sonexa-listen-beyond-main.vercel.app",
    cleartext: false,
    androidScheme: "https",
  },
  plugins: {
    FirebaseAuthentication: {
      skipNativeAuth: true,
      providers: ["google.com"],
    },
    CapacitorHttp: {
      enabled: true,
    },
  },
};

export default config;
