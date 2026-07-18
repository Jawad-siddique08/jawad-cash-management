/**
 * JAWAD CASH MANAGEMENT SYSTEM - CLOUD INTEGRATION ARCHITECTURE
 * Integration Strategy: Event-Driven Realtime Sync Bridge
 * Dependency: Firebase Web SDK (Compat Layer for Seamless Vanilla JS Integration)
 * 
 * Instructions: Include this file in index.html *after* script.js.
 * Ensure the following script tags are loaded in your HTML header:
 *   - https://www.gstatic.com/firebasejs/10.8.0/firebase-app-compat.js
 *   - https://www.gstatic.com/firebasejs/10.8.0/firebase-auth-compat.js
 *   - https://www.gstatic.com/firebasejs/10.8.0/firebase-database-compat.js
 */

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_PLACEHOLDER",
    authDomain: "jawad-cash-ledger.firebaseapp.com",
    databaseURL: "https://jawad-cash-ledger-default-rtdb.firebaseio.com",
    projectId: "jawad-cash-ledger",
    storageBucket: "jawad-cash-ledger.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// INITIALIZE CORE FIREBASE SERVICES
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const rtdb = firebase.database();
const googleProvider = new firebase.auth.GoogleAuthProvider();

// CENTRALIZED BI-DIRECTIONAL CLOUD SYNC MANAGER
const CloudSyncBridge = {
    isSyncing: false,

    initializeBridge() {
        this.bindAuthenticationLifecycle();
        this.bindLocalApplicationStateEvents();
        this.bindManualUserTriggerEvents();
        console.log("Firebase Cloud Integration Architecture initialized successfully.");
    },

    // 1. AUTHENTICATION LIFECYCLE ROUTINES
    bindAuthenticationLifecycle() {
        const DOM = window.AppEngine.ui.DOM;

        // Login Button Execution Loop
        if (DOM.firebaseGoogleLoginBtn) {
            DOM.firebaseGoogleLoginBtn.addEventListener("click", () => {
                auth.signInWithPopup(googleProvider)
                    .catch(error => {
                        console.error("Google Authentication Transaction Aborted: ", error);
                        alert("Authentication Failure: " + error.message);
                    });
            });
        }

        // Monitor Authentication State Realtime Transitions
        auth.onAuthStateChanged(user => {
            if (user) {
                // User Clearances Granted
                window.AppEngine.state.currentUser = user;
                window.AppEngine.state.isCloudConnected = true;
                
                // Update Core Footer Connection Diagnostics UI Elements
                if (DOM.footerConnectionDot) DOM.footerConnectionDot.className = "dot status-online";
                if (DOM.footerConnectionText) DOM.footerConnectionText.innerText = "Connected to Cloud Sync Engine";
                
                // Update Administrative Interface Target Elements
                if (DOM.googleUserProfileInfo) DOM.googleUserProfileInfo.classList.remove("hidden");
                if (DOM.firebaseGoogleLoginBtn) DOM.firebaseGoogleLoginBtn.classList.add("hidden");
                if (DOM.googleUserAvatar) DOM.googleUserAvatar.src = user.photoURL || "";
                if (DOM.googleUserName) DOM.googleUserName.innerText = user.displayName || "Authorized User";
                if (DOM.googleUserEmail) DOM.googleUserEmail.innerText = user.email;

                // Fire Auto-Pull Restoration Protocol Sequence on Successful Connection
                this.executeSilentCloudCheckAndSync(user.uid);
            } else {
                // Session Unauthorized / Logged Out State
                window.AppEngine.state.currentUser = null;
                window.AppEngine.state.isCloudConnected = false;

                if (DOM.footerConnectionDot) DOM.footerConnectionDot.className = "dot status-offline";
                if (DOM.footerConnectionText) DOM.footerConnectionText.innerText = "Local Caching Only Mode";
                
                if (DOM.googleUserProfileInfo) DOM.googleUserProfileInfo.classList.add("hidden");
                if (DOM.firebaseGoogleLoginBtn) DOM.firebaseGoogleLoginBtn.classList.remove("hidden");
                
                window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Offline", false, "Authenticate below to unlock cloud backup matrices.");
            }
        });
    },

    // 2. AUTOMATIC REACTIVE SYNC DRIVERS
    bindLocalApplicationStateEvents() {
        // Intercept local cache updates emitted by window.AppEngine.cache.commitStateToCache()
        window.addEventListener("jcm_local_state_changed", (event) => {
            const currentAuthedUser = auth.currentUser;
            if (!currentAuthedUser || this.isSyncing) return;

            // Trigger silent cloud backup stream logic
            this.pushStateToCloudNode(currentAuthedUser.uid, event.detail, false);
        });
    },

    // 3. INTER-SCRIPT EVENT CONTROLLERS FOR TOP-LEVEL ACTION LINKS
    bindManualUserTriggerEvents() {
        window.addEventListener("firebase_manual_backup_requested", () => {
            const currentAuthedUser = auth.currentUser;
            if (!currentAuthedUser) return;

            const structuredPayload = {
                records: window.AppEngine.state.records,
                loginHistory: window.AppEngine.state.loginHistory,
                security: window.AppEngine.state.security,
                closingLog: window.AppEngine.state.closingLog,
                theme: window.AppEngine.state.theme
            };

            this.pushStateToCloudNode(currentAuthedUser.uid, structuredPayload, true);
        });

        window.addEventListener("firebase_manual_restore_requested", () => {
            const currentAuthedUser = auth.currentUser;
            if (!currentAuthedUser) return;

            this.pullStateFromCloudNode(currentAuthedUser.uid, true);
        });
    },

    // 4. TRANSACTION execution engines - CLOUD PUSH WRAPPERS
    pushStateToCloudNode(uid, dataPayload, isExplicitUserRequest = false) {
        if (isExplicitUserRequest) {
            window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Syncing...", true, "Pushing local data blocks to remote clusters...");
        }

        rtdb.ref(`users/${uid}/ledger_master_state`).set(dataPayload)
            .then(() => {
                window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Active", true, "Cloud snapshot matches local hardware cache.");
                if (isExplicitUserRequest) alert("Database Transaction Finalized: Cloud ledger state fully synchronized.");
            })
            .catch(error => {
                console.error("Cloud Node Storage Rejection: ", error);
                window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Sync Error", false, error.message);
                if (isExplicitUserRequest) alert("Cloud Sync Aborted: " + error.message);
            });
    },

    // 5. TRANSACTION EXECUTION ENGINES - CLOUD PULL WRAPPERS
    pullStateFromCloudNode(uid, isExplicitUserRequest = false) {
        window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Fetching...", true, "Querying latest remote database state snapshot...");
        
        rtdb.ref(`users/${uid}/ledger_master_state`).once("value")
            .then(snapshot => {
                const cloudData = snapshot.val();
                if (!cloudData) {
                    window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Active", true, "No remote database snapshots found. Ready for first backup initialization.");
                    if (isExplicitUserRequest) alert("Restoration Block Empty: No cloud data sequences found matching this account signature.");
                    return;
                }

                // Block recursive callback feedback loop cycles
                this.isSyncing = true;

                // Overwrite engine state context cleanly
                if (cloudData.records) window.AppEngine.state.records = cloudData.records;
                if (cloudData.loginHistory) window.AppEngine.state.loginHistory = cloudData.loginHistory;
                if (cloudData.security) window.AppEngine.state.security = cloudData.security;
                if (cloudData.closingLog) window.AppEngine.state.closingLog = cloudData.closingLog;
                if (cloudData.theme) window.AppEngine.state.theme = cloudData.theme;

                // Sync engine structural updates out to local storage cache blocks instantly
                const storageKey = window.AppEngine.cache.storageKey;
                localStorage.setItem(storageKey, JSON.stringify(cloudData));

                // Re-render interfaces to align with new cloud context variables data stream
                window.AppEngine.ui.assertActiveCachedThemeContext();
                window.AppEngine.ui.applyAccessStateSecurityMatrix();
                window.AppEngine.ui.recompileAccountingDataCalculations();

                this.isSyncing = false;

                window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Active", true, "Remote state data matrix successfully restored.");
                if (isExplicitUserRequest) alert("Data Restoration Complete: App ledger state is now synchronized with cloud snapshot.");
            })
            .catch(error => {
                console.error("Cloud Node Retrieval Rejection: ", error);
                window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Pull Error", false, error.message);
                if (isExplicitUserRequest) alert("Restoration Aborted: " + error.message);
            });
    },

    // 6. INITIALIZATION SILENT AUTO-SYNC MERGE MANAGER
    executeSilentCloudCheckAndSync(uid) {
        rtdb.ref(`users/${uid}/ledger_master_state`).once("value")
            .then(snapshot => {
                const cloudData = snapshot.val();
                const localRecordsCount = window.AppEngine.state.records.length;

                if (!cloudData) {
                    // Scenario A: Cloud empty, local state exists -> Seed cloud immediately
                    if (localRecordsCount > 0) {
                        const localStateBackup = JSON.parse(localStorage.getItem(window.AppEngine.cache.storageKey));
                        this.pushStateToCloudNode(uid, localStateBackup, false);
                    } else {
                        window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Active", true, "Cloud state clean. Ready for entry logs.");
                    }
                    return;
                }

                const cloudRecordsCount = cloudData.records ? cloudData.records.length : 0;

                // Scenario B: Conflict Resolution -> Auto merge if local baseline is completely empty
                if (localRecordsCount === 0 && cloudRecordsCount > 0) {
                    this.pullStateFromCloudNode(uid, false);
                } else {
                    // Scenario C: Both exist -> Default to safety optimization parameters
                    window.AppEngine.ui.updateCloudSyncTelemetryDashboard("Active", true, "Cloud and Local cache engines synchronized.");
                }
            })
            .catch(error => {
                console.error("Silent Sync Routing Interrupted: ", error);
            });
    }
};

// Start Cloud Sync Engine Initialization Loop on Application Load Verification Events
document.addEventListener("DOMContentLoaded", () => {
    // Graceful confirmation pause context checking if global AppEngine is available
    const checkEngineReadyInterval = setInterval(() => {
        if (window.AppEngine && window.AppEngine.ui && window.AppEngine.ui.DOM) {
            clearInterval(checkEngineReadyInterval);
            CloudSyncBridge.initializeBridge();
        }
    }, 50);
});