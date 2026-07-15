/**
 * JAWAD CASH MANAGEMENT - FIREBASE CONFIGURATION
 * Place your unique web app configuration credentials here.
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-app-id.firebaseapp.com",
    projectId: "your-app-id",
    storageBucket: "your-app-id.appspot.com",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Export to global window context for firebase.js to ingest
window.JCM_FirebaseConfig = firebaseConfig;