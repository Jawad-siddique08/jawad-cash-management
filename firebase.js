/**
 * JAWAD CASH MANAGEMENT - CLOUD SYNC ENGINE
 * Robust, failure-tolerant client wrapper managing real-time Firestore database sync.
 */

(function () {
    'use strict';

    let db = null;
    let isInitialized = false;

    const FirebaseEngine = {
        /**
         * Checks if the configuration has been modified from the default placeholder values
         */
        isConfigured: function() {
            const cfg = window.JCM_FirebaseConfig;
            return cfg && 
                   cfg.apiKey !== "YOUR_API_KEY_HERE" && 
                   cfg.projectId !== "your-app-id";
        },

        /**
         * Initializes Firebase SDK and Firestore instance
         * @param {Function} callback - returns true if configuration succeeds, false otherwise
         */
        initialize: function (callback) {
            if (!this.isConfigured()) {
                console.warn("JCM Firebase Warning: Firebase is not configured. Running in Local-Only offline mode.");
                if (typeof callback === 'function') callback(false);
                return;
            }

            try {
                // Ensure Firebase SDK libraries are present globally
                if (typeof firebase === 'undefined') {
                    console.error("JCM Firebase Error: Firebase SDK libraries missing from DOM framework.");
                    if (typeof callback === 'function') callback(false);
                    return;
                }

                // Initialize App and get Firestore database instance
                firebase.initializeApp(window.JCM_FirebaseConfig);
                db = firebase.firestore();
                isInitialized = true;

                // Enable offline data persistence for resilient operation during network drops
                db.enablePersistence().catch(function (err) {
                    if (err.code === 'failed-precondition') {
                        console.warn("Firestore Persistence failed: Multiple tabs open simultaneously.");
                    } else if (err.code === 'unimplemented') {
                        console.warn("Firestore Persistence failed: Browser lacks storage capability.");
                    }
                });

                console.log("JCM Cloud Engine: Successfully initialized and connected to Firestore.");
                if (typeof callback === 'function') callback(true);

            } catch (error) {
                console.error("JCM Cloud Engine: Failed to boot.", error);
                if (typeof callback === 'function') callback(false);
            }
        },

        /**
         * Pulls the absolute latest ledger data snapshot from the cloud database
         * @param {Function} callback - returns array of ledger items on success
         */
        pullLedgerFromCloud: function (callback) {
            if (!isInitialized || !db) return;

            db.collection("ledger").doc("master_sheet")
                .get()
                .then((doc) => {
                    if (doc.exists) {
                        const data = doc.data();
                        if (data && Array.isArray(data.records)) {
                            console.log("JCM Cloud Engine: Downloaded clean master dataset from Firestore.");
                            if (typeof callback === 'function') callback(data.records);
                        }
                    } else {
                        console.log("JCM Cloud Engine: No remote ledger state found. Starting fresh upload on next write.");
                    }
                })
                .catch((error) => {
                    console.error("JCM Cloud Engine: Failed to retrieve database records.", error);
                });
        },

        /**
         * Pushes local ledger records up to the master cloud document
         * @param {Array} ledgerData - Current operational array of ledger items
         */
        syncLedgerToCloud: function (ledgerData) {
            if (!isInitialized || !db) return;

            // Run in a secure, non-blocking asynchronous thread
            db.collection("ledger").doc("master_sheet").set({
                records: ledgerData,
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true })
            .then(() => {
                console.log("JCM Cloud Engine: Synced ledger updates up to secure cloud storage.");
            })
            .catch((error) => {
                console.error("JCM Cloud Engine: Cloud write rejected. Retrying locally...", error);
            });
        },

        /**
         * Pushes internal system login/trace footprints to Firestore
         * @param {Array} logs - Security and administrative access logs
         */
        syncLogsToCloud: function (logs) {
            if (!isInitialized || !db) return;

            db.collection("system").doc("trace_logs").set({
                activity: logs,
                lastLogged: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true })
            .then(() => {
                console.log("JCM Cloud Engine: Security and operational traces backup verified.");
            })
            .catch((error) => {
                console.warn("JCM Cloud Engine: Logging sync postponed due to connection state.", error);
            });
        }
    };

    // Expose wrapper globally to be consumed by script.js
    window.FirebaseEngine = FirebaseEngine;

})();