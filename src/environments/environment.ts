// Development environment configuration
// Replace these values with your Firebase project config

export const environment = {
  production: false,
  firebase: {
    apiKey: 'AIzaSyBeHdde0pv1hB5_mKCbe0sfO5AAkI5wmms',
    authDomain: 'familyops-6e2d1.firebaseapp.com',
    projectId: 'familyops-6e2d1',
    storageBucket: 'familyops-6e2d1.firebasestorage.app',
    messagingSenderId: '662115430672',
    appId: '1:662115430672:web:58fbcc7b84a09ba3147595',
    measurementId: 'G-5VWXL4WZJW',
  },
  // Web Push certificate key pair from Firebase Console >
  // Project settings > Cloud Messaging > Web configuration.
  // Public by design; without it the browser cannot be registered for push.
  vapidKey: 'BL9lbThH8GHaJKwB_bRRm5oj7Gef8Z2HdlWF_bsPwqjcTT2Vc_2TbCikDlUPEhbFVOEPpbsP0Tmwx4tkA5z6NgQ',

  // App configuration
  appName: 'FamilyOps',
  defaultLanguage: 'he',
  // Feature flags
  features: {
    offlineMode: true,
    debugMode: true,
  },
};
