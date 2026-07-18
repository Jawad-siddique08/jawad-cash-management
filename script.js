/**
 * JAWAD CASH MANAGEMENT SYSTEM - COMMERCIAL CORE ENGINE
 * Architecture Strategy: Progressive Vanilla Javascript App Architecture
 * Operational Context: Commercial Grade Data Processing, Multi-level Auth, Fail-Safe Local Cache
 */

// GLOBAL CORE STORAGE STATE ENGINE
window.AppEngine = {
    state: {
        records: [],
        loginHistory: [],
        security: {
            webPin: "4863",
            adminPin: "2008"
        },
        closingLog: {
            closedDates: [] // Array tracking YYYY-MM-DD strings that are closed
        },
        accessLevel: 0, // 0 = Completely Locked, 1 = View Only Access, 2 = Full Admin Control
        activeTab: "dashboard-section",
        theme: "light-theme",
        isCloudConnected: false,
        currentUser: null
    },

    // CACHE SYNC LAYER MANAGERS
    cache: {
        storageKey: "JCM_OFFLINE_CACHE_PROD",
        
        initializeLocalCache() {
            const cachePayload = localStorage.getItem(this.storageKey);
            if (cachePayload) {
                try {
                    const parsedData = JSON.parse(cachePayload);
                    if (parsedData.records) window.AppEngine.state.records = parsedData.records;
                    if (parsedData.loginHistory) window.AppEngine.state.loginHistory = parsedData.loginHistory;
                    if (parsedData.security) window.AppEngine.state.security = parsedData.security;
                    if (parsedData.closingLog) window.AppEngine.state.closingLog = parsedData.closingLog;
                    if (parsedData.theme) window.AppEngine.state.theme = parsedData.theme;
                } catch (e) {
                    console.error("Local structural recovery cache reading failure: ", e);
                }
            } else {
                this.commitStateToCache();
            }
        },

        commitStateToCache() {
            const cachePayload = {
                records: window.AppEngine.state.records,
                loginHistory: window.AppEngine.state.loginHistory,
                security: window.AppEngine.state.security,
                closingLog: window.AppEngine.state.closingLog,
                theme: window.AppEngine.state.theme
            };
            localStorage.setItem(this.storageKey, JSON.stringify(cachePayload));
            
            // Dispatch dynamic event notifications targeted for independent firebase sync bridges
            window.dispatchEvent(new CustomEvent("jcm_local_state_changed", { detail: cachePayload }));
        }
    },

    // UTILITIES & DATA TYPE PARSERS
    utils: {
        parseNumeric(value) {
            if (!value) return 0;
            if (typeof value === "number") return Math.abs(value);
            const sanitized = value.toString().replace(/[^0-9.]/g, "");
            const parsed = parseFloat(sanitized);
            return isNaN(parsed) ? 0 : Math.abs(parsed);
        },

        formatPKR(value) {
            const numericalValue = this.parseNumeric(value);
            return "PKR " + numericalValue.toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
        },

        computeDayName(dateString) {
            if (!dateString) return "---";
            const structuralParts = dateString.split("-");
            if (structuralParts.length !== 3) return "---";
            // Construct safe Date objects preventing timezone displacement offsets
            const evaluationDate = new Date(structuralParts[0], structuralParts[1] - 1, structuralParts[2]);
            const options = { weekday: "Long" };
            return evaluationDate.toLocaleDateString("en-US", options);
        },

        getSystemDateString() {
            const trackingDate = new Date();
            const year = trackingDate.getFullYear();
            const month = String(trackingDate.getMonth() + 1).padStart(2, "0");
            const day = String(trackingDate.getDate()).padStart(2, "0");
            return `${year}-${month}-${day}`;
        },

        generateUUID() {
            return "row-id-" + Math.random().toString(36).substr(2, 9) + "-" + Date.now().toString(36);
        }
    },

    // INTERACTION INITIALIZATION HANDLERS
    ui: {
        DOM: {},

        cacheDOMSelectors() {
            this.DOM = {
                // Security Framework Panels
                webAuthOverlay: document.getElementById("website-auth-overlay"),
                webPinInput: document.getElementById("website-pin-input"),
                webAuthError: document.getElementById("website-auth-error"),
                webAuthSubmit: document.getElementById("website-auth-submit-btn"),
                appContainer: document.getElementById("app-container"),
                accessBadge: document.getElementById("access-badge"),
                accessStatusText: document.getElementById("access-status-text"),
                
                // Clock Structures
                liveDate: document.getElementById("live-date"),
                liveTime: document.getElementById("live-time"),
                
                // Navigation Links Elements
                navLinks: document.querySelectorAll(".nav-btn"),
                navBackup: document.getElementById("nav-btn-backup"),
                navRestore: document.getElementById("nav-btn-restore"),
                themeToggle: document.getElementById("theme-toggle-btn"),
                logoutBtn: document.getElementById("logout-btn"),
                
                // General Metric Dashboard Links
                dashTodayEntries: document.getElementById("dash-today-entries-count"),
                dashC1Large: document.getElementById("dash-c1-large"),
                dashC1Small: document.getElementById("dash-c1-small"),
                dashC1TotalCash: document.getElementById("dash-c1-total-cash"),
                dashC1TotalAccount: document.getElementById("dash-c1-total-account"),
                dashC2Large: document.getElementById("dash-c2-large"),
                dashC2Small: document.getElementById("dash-c2-small"),
                dashC2TotalCash: document.getElementById("dash-c2-total-cash"),
                dashC2TotalAccount: document.getElementById("dash-c2-total-account"),
                dashGrandTodayCash: document.getElementById("dash-grand-today-cash"),
                dashGrandTodayAccount: document.getElementById("dash-grand-today-account"),
                
                // Operational Cash Ledgers Elements
                adminUnlockBtn: document.getElementById("admin-unlock-btn"),
                adminLockBtn: document.getElementById("admin-lock-btn"),
                adminAuthModal: document.getElementById("admin-auth-modal"),
                adminPinInput: document.getElementById("admin-pin-input"),
                adminAuthError: document.getElementById("admin-auth-error"),
                adminAuthCancel: document.getElementById("admin-auth-cancel"),
                adminAuthSubmit: document.getElementById("admin-auth-submit"),
                ledgerRowsContainer: document.getElementById("ledger-rows-container"),
                tableAddRowBtn: document.getElementById("table-add-row-btn"),
                adminActionElements: document.querySelectorAll(".admin-action-element"),
                adminActionCells: document.querySelectorAll(".col-actions"),
                
                // Table Accounting Today Section Elements
                totTC1Large: document.getElementById("tot-t-c1-large"),
                totTC1Small: document.getElementById("tot-t-c1-small"),
                totTC1Account: document.getElementById("tot-t-c1-account"),
                totTC1Cash: document.getElementById("tot-t-c1-cash"),
                totTC1WithAccount: document.getElementById("tot-t-c1-with-account"),
                totTC2Large: document.getElementById("tot-t-c2-large"),
                totTC2Small: document.getElementById("tot-t-c2-small"),
                totTC2Account: document.getElementById("tot-t-c2-account"),
                totTC2Cash: document.getElementById("tot-t-c2-cash"),
                totTC2WithAccount: document.getElementById("tot-t-c2-with-account"),
                totTGrandCash: document.getElementById("tot-t-grand-cash"),
                totTGrandWithAccount: document.getElementById("tot-t-grand-with-account"),

                // Table Accounting Overall Section Elements
                totOC1Large: document.getElementById("tot-o-c1-large"),
                totOC1Small: document.getElementById("tot-o-c1-small"),
                totOC1Account: document.getElementById("tot-o-c1-account"),
                totOC1Cash: document.getElementById("tot-o-c1-cash"),
                totOC1WithAccount: document.getElementById("tot-o-c1-with-account"),
                totOC2Large: document.getElementById("tot-o-c2-large"),
                totOC2Small: document.getElementById("tot-o-c2-small"),
                totOC2Account: document.getElementById("tot-o-c2-account"),
                totOC2Cash: document.getElementById("tot-o-c2-cash"),
                totOC2WithAccount: document.getElementById("tot-o-c2-with-account"),
                totOGrandCash: document.getElementById("tot-o-grand-cash"),
                totOGrandWithAccount: document.getElementById("tot-o-grand-with-account"),
                
                // Reporting Interfaces Parameters
                reportPrintBtn: document.getElementById("report-print-btn"),
                reportCsvBtn: document.getElementById("report-csv-btn"),
                filterDateInput: document.getElementById("filter-date-input"),
                filterMonthInput: document.getElementById("filter-month-input"),
                filterYearInput: document.getElementById("filter-year-input"),
                filterClearBtn: document.getElementById("filter-clear-btn"),
                reportRowsContainer: document.getElementById("report-rows-container"),
                monthlySummaryCardsGrid: document.getElementById("monthly-summary-cards-grid"),
                
                // Administrative Control Systems Parameters
                adminRestrictedBanner: document.getElementById("admin-restricted-view-banner"),
                adminWebPinInput: document.getElementById("admin-set-web-pin"),
                adminSaveWebPinBtn: document.getElementById("btn-save-web-pin"),
                adminAdmPinInput: document.getElementById("admin-set-adm-pin"),
                adminSaveAdmPinBtn: document.getElementById("btn-save-adm-pin"),
                firebaseGoogleLoginBtn: document.getElementById("firebase-google-login-btn"),
                googleUserProfileInfo: document.getElementById("google-user-profile-info"),
                googleUserAvatar: document.getElementById("google-user-avatar"),
                googleUserName: document.getElementById("google-user-name"),
                googleUserEmail: document.getElementById("google-user-email"),
                cloudStatusBadge: document.getElementById("cloud-status-badge"),
                lblLastBackupTimestamp: document.getElementById("lbl-last-backup-timestamp"),
                lblBackupStatusText: document.getElementById("lbl-backup-status-text"),
                adminManualBackupBtn: document.getElementById("admin-btn-manual-backup"),
                adminManualRestoreBtn: document.getElementById("admin-btn-manual-restore"),
                adminExportRawBtn: document.getElementById("admin-btn-export-raw"),
                adminHardResetBtn: document.getElementById("admin-btn-hard-reset"),
                dayClosingStatusBadge: document.getElementById("day-closing-status-badge"),
                adminCloseDayBtn: document.getElementById("admin-btn-close-day"),
                adminReopenDayBtn: document.getElementById("admin-btn-reopen-day"),
                loginHistoryRowsContainer: document.getElementById("login-history-rows-container"),
                
                // Footer Diagnostics References
                footerConnectionDot: document.getElementById("footer-connection-dot"),
                footerConnectionText: document.getElementById("footer-connection-text")
            };
        },

        initializeEvents() {
            // Level 1 Authorization Events Setup
            this.DOM.webPinInput.addEventListener("keypress", (e) => { if (e.key === "Enter") this.processLevel1Authentication(); });
            this.DOM.webAuthSubmit.addEventListener("click", () => this.processLevel1Authentication());
            
            // Tab View Operations System Setup
            this.DOM.navLinks.forEach(btn => {
                btn.addEventListener("click", (e) => {
                    const TargetSectionId = btn.getAttribute("data-target");
                    this.switchTabContext(TargetSectionId);
                });
            });

            // Level 2 Admin Elevation Prompts Setup
            this.DOM.adminUnlockBtn.addEventListener("click", () => {
                this.DOM.adminAuthModal.classList.remove("hidden");
                this.DOM.adminPinInput.value = "";
                this.DOM.adminAuthError.style.display = "none";
                this.DOM.adminPinInput.focus();
            });
            this.DOM.adminLockBtn.addEventListener("click", () => {
                window.AppEngine.state.accessLevel = 1;
                this.applyAccessStateSecurityMatrix();
            });
            this.DOM.adminAuthCancel.addEventListener("click", () => this.DOM.adminAuthModal.classList.add("hidden"));
            this.DOM.adminPinInput.addEventListener("keypress", (e) => { if (e.key === "Enter") this.processLevel2Authentication(); });
            this.DOM.adminAuthSubmit.addEventListener("click", () => this.processLevel2Authentication());
            
            // Core Data Modification Actions Triggers
            this.DOM.tableAddRowBtn.addEventListener("click", () => this.appendNewRecordRowData());
            
            // Live Filtering Execution Listeners Setup
            this.DOM.filterDateInput.addEventListener("input", () => this.renderReportsViewsPipeline());
            this.DOM.filterMonthInput.addEventListener("change", () => this.renderReportsViewsPipeline());
            this.DOM.filterYearInput.addEventListener("input", () => this.renderReportsViewsPipeline());
            this.DOM.filterClearBtn.addEventListener("click", () => {
                this.DOM.filterDateInput.value = "";
                this.DOM.filterMonthInput.value = "";
                this.DOM.filterYearInput.value = "";
                this.renderReportsViewsPipeline();
            });

            // Theme Custom Alteration Trigger Event
            this.DOM.themeToggle.addEventListener("click", () => this.toggleApplicationThemeSystem());
            
            // Administrative PIN Enforcement Alterations
            this.DOM.adminSaveWebPinBtn.addEventListener("click", () => this.alterSystemAccessPinCode(1));
            this.DOM.adminSaveAdmPinBtn.addEventListener("click", () => this.alterSystemAccessPinCode(2));

            // Hard Storage Purge Configurations Trigger
            this.DOM.adminHardResetBtn.addEventListener("click", () => this.executeFactoryClearDataRoutine());
            this.DOM.adminExportRawBtn.addEventListener("click", () => this.triggerBackupJSONDownloadStream());
            
            // End Day Closing Actions Pipeline Triggers
            this.DOM.adminCloseDayBtn.addEventListener("click", () => this.processCloseDayExecution());
            this.DOM.adminReopenDayBtn.addEventListener("click", () => this.processReopenDayExecution());
            
            // Top Level Actions Integration Pipelines
            this.DOM.navBackup.addEventListener("click", () => this.triggerManualCloudTransaction("backup"));
            this.DOM.adminManualBackupBtn.addEventListener("click", () => this.triggerManualCloudTransaction("backup"));
            this.DOM.navRestore.addEventListener("click", () => this.triggerManualCloudTransaction("restore"));
            this.DOM.adminManualRestoreBtn.addEventListener("click", () => this.triggerManualCloudTransaction("restore"));
            
            // Document Extraction Printing & Export Engines
            this.DOM.reportPrintBtn.addEventListener("click", () => window.print());
            this.DOM.reportCsvBtn.addEventListener("click", () => this.generateStructuredCSVFileDownload());

            this.DOM.logoutBtn.addEventListener("click", () => {
                window.location.reload();
            });
        },

        // CLOCK LIFE PIPELINE INTERACTION ENGINE
        startClockPipelineLoop() {
            const executeClockUpdate = () => {
                const currentMoment = new Date();
                
                // Format date cleanly: YYYY-MM-DD
                const year = currentMoment.getFullYear();
                const month = String(currentMoment.getMonth() + 1).padStart(2, "0");
                const day = String(currentMoment.getDate()).padStart(2, "0");
                this.DOM.liveDate.innerText = `${year}-${month}-${day}`;
                
                // Format time: HH:MM:SS AM/PM
                this.DOM.liveTime.innerText = currentMoment.toLocaleTimeString("en-US", {
                    hour12: true,
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit"
                });
            };
            executeClockUpdate();
            setInterval(executeClockUpdate, 1000);
        },

        // SECURITY ELEVATION OPERATIONS LOGIC
        processLevel1Authentication() {
            const inputVal = this.DOM.webPinInput.value.trim();
            if (inputVal === window.AppEngine.state.security.webPin || inputVal === window.AppEngine.state.security.adminPin) {
                this.DOM.webAuthError.style.display = "none";
                this.DOM.webAuthOverlay.classList.add("hidden");
                this.DOM.appContainer.classList.remove("hidden");
                
                // Assign security clearance dynamically depending on tracking entry signatures
                window.AppEngine.state.accessLevel = (inputVal === window.AppEngine.state.security.adminPin) ? 2 : 1;
                
                this.logAuthenticationTransactionInstance();
                this.applyAccessStateSecurityMatrix();
                this.recompileAccountingDataCalculations();
                this.startClockPipelineLoop();
            } else {
                this.DOM.webAuthError.style.display = "block";
                this.DOM.webPinInput.value = "";
                this.DOM.webPinInput.focus();
            }
        },

        processLevel2Authentication() {
            const inputVal = this.DOM.adminPinInput.value.trim();
            if (inputVal === window.AppEngine.state.security.adminPin) {
                this.DOM.adminAuthError.style.display = "none";
                this.DOM.adminAuthModal.classList.add("hidden");
                window.AppEngine.state.accessLevel = 2;
                this.applyAccessStateSecurityMatrix();
                this.logAuthenticationTransactionInstance("Admin Elevation");
            } else {
                this.DOM.adminAuthError.style.display = "block";
                this.DOM.adminPinInput.value = "";
                this.DOM.adminPinInput.focus();
            }
        },

        logAuthenticationTransactionInstance(type = "Website Access") {
            const now = new Date();
            const logEntry = {
                date: now.toLocaleDateString("en-US"),
                time: now.toLocaleTimeString("en-US"),
                updateTime: now.toLocaleTimeString("en-US"),
                metadata: `${type} (${navigator.userAgent.slice(0, 45)}...)`
            };
            window.AppEngine.state.loginHistory.unshift(logEntry);
            if (window.AppEngine.state.loginHistory.length > 50) window.AppEngine.state.loginHistory.pop();
            window.AppEngine.cache.commitStateToCache();
            this.renderAuthenticationHistoryRecords();
        },

        // SECURITY ACCESS RIGHTS STRUCTURAL RESTRICTIONS FORWARDING MATRICES
        applyAccessStateSecurityMatrix() {
            const UI = this.DOM;
            const level = window.AppEngine.state.accessLevel;

            if (level === 2) {
                // Admin Access Mode Enabled
                UI.accessBadge.className = "access-badge admin-mode-badge";
                UI.accessStatusText.innerText = "Administrator Mode";
                UI.adminUnlockBtn.classList.add("hidden");
                UI.adminLockBtn.classList.remove("hidden");
                
                document.querySelectorAll(".admin-mutable").forEach(el => el.removeAttribute("disabled"));
                UI.adminRestrictedBanner.classList.add("hidden");
                
                // Show actions column header in table head
                const actionsTh = document.querySelector(".commercial-ledger-table th.col-actions");
                if (actionsTh) actionsTh.classList.remove("hidden");
                
                UI.tableAddRowBtn.parentElement.classList.remove("hidden");
            } else {
                // Read Only Mode Enforcement
                UI.accessBadge.className = "access-badge view-mode-badge";
                UI.accessStatusText.innerText = "View Only Mode";
                UI.adminUnlockBtn.classList.remove("hidden");
                UI.adminLockBtn.classList.add("hidden");
                
                document.querySelectorAll(".admin-mutable").forEach(el => el.setAttribute("disabled", "true"));
                UI.adminRestrictedBanner.classList.remove("hidden");
                
                const actionsTh = document.querySelector(".commercial-ledger-table th.col-actions");
                if (actionsTh) actionsTh.classList.add("hidden");
                
                UI.tableAddRowBtn.parentElement.classList.add("hidden");
            }

            // Repopulate components layout to assert accessibility restrictions accurately across cell rows
            this.renderLedgerDataRecords();
            this.renderAuthenticationHistoryRecords();
            this.updateClosingOperationalStatusBadge();
        },

        // SYSTEM TAB APPLICATION SWITCH ENGINE
        switchTabContext(targetSectionId) {
            window.AppEngine.state.activeTab = targetSectionId;
            
            document.querySelectorAll(".tab-content").forEach(section => {
                if (section.id === targetSectionId) {
                    section.classList.remove("hidden");
                    section.classList.add("active");
                } else {
                    section.classList.add("hidden");
                    section.classList.remove("active");
                }
            });

            this.DOM.navLinks.forEach(btn => {
                if (btn.getAttribute("data-target") === targetSectionId) {
                    btn.classList.add("active");
                } else {
                    btn.classList.remove("active");
                }
            });

            // Context view rendering initialization dependencies pipeline
            if (targetSectionId === "dashboard-section") this.renderMetricsDashboardView();
            if (targetSectionId === "cash-entry-section") this.renderLedgerDataRecords();
            if (targetSectionId === "reports-section") this.renderReportsViewsPipeline();
            if (targetSectionId === "admin-panel-section") {
                this.renderAuthenticationHistoryRecords();
                this.updateClosingOperationalStatusBadge();
            }
        },

        // MASTER CENTRAL ACCOUNTING DATA COMPILATION TRANSFORM LOOPS
        recompileAccountingDataCalculations() {
            const records = window.AppEngine.state.records;
            const systemTodayStr = window.AppEngine.utils.getSystemDateString();
            
            // Initialization matrices tracking allocations
            const TodayTotals = { c1Large: 0, c1Small: 0, c1Account: 0, c2Large: 0, c2Small: 0, c2Account: 0 };
            const OverallTotals = { c1Large: 0, c1Small: 0, c1Account: 0, c2Large: 0, c2Small: 0, c2Account: 0 };
            
            records.forEach(row => {
                const c1L = window.AppEngine.utils.parseNumeric(row.c1Large);
                const c1S = window.AppEngine.utils.parseNumeric(row.c1Small);
                const c1A = window.AppEngine.utils.parseNumeric(row.c1Account);
                const c2L = window.AppEngine.utils.parseNumeric(row.c2Large);
                const c2S = window.AppEngine.utils.parseNumeric(row.c2Small);
                const c2A = window.AppEngine.utils.parseNumeric(row.c2Account);

                // Cumulative aggregation allocations loop
                OverallTotals.c1Large += c1L;
                OverallTotals.c1Small += c1S;
                OverallTotals.c1Account += c1A;
                OverallTotals.c2Large += c2L;
                OverallTotals.c2Small += c2S;
                OverallTotals.c2Account += c2A;

                // Daily processing synchronization boundary checks
                if (row.date === systemTodayStr) {
                    TodayTotals.c1Large += c1L;
                    TodayTotals.c1Small += c1S;
                    TodayTotals.c1Account += c1A;
                    TodayTotals.c2Large += c2L;
                    TodayTotals.c2Small += c2S;
                    TodayTotals.c2Account += c2A;
                }
            });

            this.renderFooterAccountingTotalInterfaceElements(TodayTotals, OverallTotals);
            
            // Auto update views dependencies relative to active tracking properties
            if (window.AppEngine.state.activeTab === "dashboard-section") this.renderMetricsDashboardView();
        },

        renderFooterAccountingTotalInterfaceElements(T, O) {
            const U = window.AppEngine.utils;
            const DOM = this.DOM;

            // Today Structural Output Display Bindings
            DOM.totTC1Large.innerText = U.formatPKR(T.c1Large);
            DOM.totTC1Small.innerText = U.formatPKR(T.c1Small);
            DOM.totTC1Account.innerText = U.formatPKR(T.c1Account);
            const tC1Cash = T.c1Large + T.c1Small;
            DOM.totTC1Cash.innerText = U.formatPKR(tC1Cash);
            DOM.totTC1WithAccount.innerText = U.formatPKR(tC1Cash + T.c1Account);

            DOM.totTC2Large.innerText = U.formatPKR(T.c2Large);
            DOM.totTC2Small.innerText = U.formatPKR(T.c2Small);
            DOM.totTC2Account.innerText = U.formatPKR(T.c2Account);
            const tC2Cash = T.c2Large + T.c2Small;
            DOM.totTC2Cash.innerText = U.formatPKR(tC2Cash);
            DOM.totTC2WithAccount.innerText = U.formatPKR(tC2Cash + T.c2Account);

            const grandTodayCash = tC1Cash + tC2Cash;
            const grandTodayWithAcc = (tC1Cash + T.c1Account) + (tC2Cash + T.c2Account);
            DOM.totTGrandCash.innerText = U.formatPKR(grandTodayCash);
            DOM.totTGrandWithAccount.innerText = U.formatPKR(grandTodayWithAcc);

            // Cumulative Historical Output Display Bindings
            DOM.totOC1Large.innerText = U.formatPKR(O.c1Large);
            DOM.totOC1Small.innerText = U.formatPKR(O.c1Small);
            DOM.totOC1Account.innerText = U.formatPKR(O.c1Account);
            const oC1Cash = O.c1Large + O.c1Small;
            DOM.totOC1Cash.innerText = U.formatPKR(oC1Cash);
            DOM.totOC1WithAccount.innerText = U.formatPKR(oC1Cash + O.c1Account);

            DOM.totOC2Large.innerText = U.formatPKR(O.c2Large);
            DOM.totOC2Small.innerText = U.formatPKR(O.c2Small);
            DOM.totOC2Account.innerText = U.formatPKR(O.c2Account);
            const oC2Cash = O.c2Large + O.c2Small;
            DOM.totOC2Cash.innerText = U.formatPKR(oC2Cash);
            DOM.totOC2WithAccount.innerText = U.formatPKR(oC2Cash + O.c2Account);

            const grandOverallCash = oC1Cash + oC2Cash;
            const grandOverallWithAcc = (oC1Cash + O.c1Account) + (oC2Cash + O.c2Account);
            DOM.totOGrandCash.innerText = U.formatPKR(grandOverallCash);
            DOM.totOGrandWithAccount.innerText = U.formatPKR(grandOverallWithAcc);
        },

        // VIEW RENDERING INTERACTIVE INTERFACES - DASHBOARD
        renderMetricsDashboardView() {
            const U = window.AppEngine.utils;
            const records = window.AppEngine.state.records;
            const todayStr = U.getSystemDateString();

            let todayCount = 0;
            const Metrics = { c1L: 0, c1S: 0, c1A: 0, c2L: 0, c2S: 0, c2A: 0 };

            records.forEach(row => {
                if (row.date === todayStr) {
                    todayCount++;
                    Metrics.c1L += U.parseNumeric(row.c1Large);
                    Metrics.c1S += U.parseNumeric(row.c1Small);
                    Metrics.c1A += U.parseNumeric(row.c1Account);
                    Metrics.c2L += U.parseNumeric(row.c2Large);
                    Metrics.c2S += U.parseNumeric(row.c2Small);
                    Metrics.c2A += U.parseNumeric(row.c2Account);
                }
            });

            // DOM UI Values Interception Injection Routing
            this.DOM.dashTodayEntries.innerText = todayCount;
            this.DOM.dashC1Large.innerText = U.formatPKR(Metrics.c1L);
            this.DOM.dashC1Small.innerText = U.formatPKR(Metrics.c1S);
            
            const c1Total = Metrics.c1L + Metrics.c1S;
            this.DOM.dashC1TotalCash.innerText = U.formatPKR(c1Total);
            this.DOM.dashC1TotalAccount.innerText = U.formatPKR(c1Total + Metrics.c1A);

            this.DOM.dashC2Large.innerText = U.formatPKR(Metrics.c2L);
            this.DOM.dashC2Small.innerText = U.formatPKR(Metrics.c2S);
            
            const c2Total = Metrics.c2L + Metrics.c2S;
            this.DOM.dashC2TotalCash.innerText = U.formatPKR(c2Total);
            this.DOM.dashC2TotalAccount.innerText = U.formatPKR(c2Total + Metrics.c2A);

            this.DOM.dashGrandTodayCash.innerText = U.formatPKR(c1Total + c2Total);
            this.DOM.dashGrandTodayAccount.innerText = U.formatPKR((c1Total + Metrics.c1A) + (c2Total + Metrics.c2A));
        },

        // VIEW RENDERING INTERACTIVE INTERFACES - CASH ENTRY LEDGER TABLE
        renderLedgerDataRecords() {
            const container = this.DOM.ledgerRowsContainer;
            container.innerHTML = "";
            
            const records = window.AppEngine.state.records;
            const isAdmin = (window.AppEngine.state.accessLevel === 2);
            
            if (records.length === 0) {
                container.innerHTML = `<tr><td colspan="${isAdmin ? 11 : 10}" class="center-text text-muted" style="padding: 20px;">No transaction rows found inside the current ledger context. Click "Add New Entry Row" to build logs.</td></tr>`;
                return;
            }

            records.forEach((row, index) => {
                const tr = document.createElement("tr");
                
                // Assert structural state variable parameter checks to verify lock criteria properties
                const isDayLocked = window.AppEngine.state.closingLog.closedDates.includes(row.date);
                const isInputEditable = isAdmin && !isDayLocked;

                tr.innerHTML = `
                    <td class="col-sno center-text"><span class="static-cell-text">${index + 1}</span></td>
                    <td class="col-date">
                        <input type="date" class="cell-input ledger-data-field" data-id="${row.id}" data-field="date" value="${row.date}" ${isInputEditable ? "" : "disabled"}>
                    </td>
                    <td class="col-day center-text"><span class="static-cell-text text-muted" id="day-lbl-${row.id}">${window.AppEngine.utils.computeDayName(row.date)}</span></td>
                    
                    <td class="col-sub"><input type="text" class="cell-input numeric-field ledger-data-field" data-id="${row.id}" data-field="c1Large" value="${row.c1Large}" ${isInputEditable ? "" : "disabled"}></td>
                    <td class="col-sub"><input type="text" class="cell-input numeric-field ledger-data-field" data-id="${row.id}" data-field="c1Small" value="${row.c1Small}" ${isInputEditable ? "" : "disabled"}></td>
                    <td class="col-sub"><input type="text" class="cell-input numeric-field ledger-data-field" data-id="${row.id}" data-field="c1Account" value="${row.c1Account}" ${isInputEditable ? "" : "disabled"}></td>
                    
                    <td class="col-sub"><input type="text" class="cell-input numeric-field ledger-data-field" data-id="${row.id}" data-field="c2Large" value="${row.c2Large}" ${isInputEditable ? "" : "disabled"}></td>
                    <td class="col-sub"><input type="text" class="cell-input numeric-field ledger-data-field" data-id="${row.id}" data-field="c2Small" value="${row.c2Small}" ${isInputEditable ? "" : "disabled"}></td>
                    <td class="col-sub"><input type="text" class="cell-input numeric-field ledger-data-field" data-id="${row.id}" data-field="c2Account" value="${row.c2Account}" ${isInputEditable ? "" : "disabled"}></td>
                    
                    <td class="col-remarks"><input type="text" class="cell-input ledger-data-field" data-id="${row.id}" data-field="remarks" value="${row.remarks}" ${isInputEditable ? "" : "disabled"} placeholder="..."></td>
                    
                    ${isAdmin ? `<td class="col-actions center-text"><button class="btn-row-delete" data-id="${row.id}" title="Remove Entry Row" ${!isDayLocked ? "" : "disabled style='opacity:0.3; cursor:not-allowed;'" }><i class="fa-solid fa-square-minus"></i></button></td>` : ""}
                `;

                container.appendChild(tr);
            });

            this.bindLedgerRowInteractionInputListeners();
        },

        bindLedgerRowInteractionInputListeners() {
            const self = this;
            
            // Text and digit transformations input validation hooks
            document.querySelectorAll(".ledger-data-field").forEach(input => {
                input.addEventListener("change", function() {
                    const rowId = this.getAttribute("data-id");
                    const fieldName = this.getAttribute("data-field");
                    let assignedValue = this.value;

                    // Match matching item object reference mappings targeting state arrays
                    const index = window.AppEngine.state.records.findIndex(r => r.id === rowId);
                    if (index !== -1) {
                        if (fieldName === "date") {
                            window.AppEngine.state.records[index].date = assignedValue;
                            const labelDay = document.getElementById(`day-lbl-${rowId}`);
                            if (labelDay) labelDay.innerText = window.AppEngine.utils.computeDayName(assignedValue);
                        } else if (this.classList.contains("numeric-field")) {
                            const rawNumeric = window.AppEngine.utils.parseNumeric(assignedValue);
                            window.AppEngine.state.records[index][fieldName] = rawNumeric;
                            this.value = rawNumeric; // Keep raw format in input cell during current runtime focus cycles
                        } else {
                            window.AppEngine.state.records[index][fieldName] = assignedValue;
                        }

                        // Auto Commit processing loops execution parameters
                        window.AppEngine.cache.commitStateToCache();
                        self.recompileAccountingDataCalculations();
                    }
                });

                // Clear formatting on focus for easy value typing input operations
                if (input.classList.contains("numeric-field")) {
                    input.addEventListener("focus", function() {
                        if (this.value === "0") this.value = "";
                    });
                    input.addEventListener("blur", function() {
                        if (this.value.trim() === "") this.value = "0";
                    });
                }
            });

            // Row Removal Event Registrations Execution Control Loops
            document.querySelectorAll(".btn-row-delete").forEach(btn => {
                btn.addEventListener("click", function() {
                    const targetId = this.getAttribute("data-id");
                    const index = window.AppEngine.state.records.findIndex(r => r.id === targetId);
                    if (index !== -1) {
                        const targetRecord = window.AppEngine.state.records[index];
                        if (window.AppEngine.state.closingLog.closedDates.includes(targetRecord.date)) {
                            alert("This transaction row falls within a closed date segment and cannot be modified.");
                            return;
                        }
                        if (confirm("Are you sure you want to permanently remove this financial record row?")) {
                            window.AppEngine.state.records.splice(index, 1);
                            window.AppEngine.cache.commitStateToCache();
                            self.renderLedgerDataRecords();
                            self.recompileAccountingDataCalculations();
                        }
                    }
                });
            });
        },

        appendNewRecordRowData() {
            const U = window.AppEngine.utils;
            const systemDateStr = U.getSystemDateString();

            if (window.AppEngine.state.closingLog.closedDates.includes(systemDateStr)) {
                alert("Today's financial ledger books have been closed by an administrator. Reopen the session in the Admin Console to build further entries.");
                return;
            }

            const modelTemplate = {
                id: U.generateUUID(),
                date: systemDateStr,
                c1Large: 0,
                c1Small: 0,
                c1Account: 0,
                c2Large: 0,
                c2Small: 0,
                c2Account: 0,
                remarks: ""
            };

            window.AppEngine.state.records.unshift(modelTemplate);
            window.AppEngine.cache.commitStateToCache();
            this.renderLedgerDataRecords();
            this.recompileAccountingDataCalculations();
        },

        // VIEW RENDERING INTERACTIVE INTERFACES - REPORTS & ANALYTICS DATA SHEETS
        renderReportsViewsPipeline() {
            const U = window.AppEngine.utils;
            const container = this.DOM.reportRowsContainer;
            container.innerHTML = "";

            // Query parameter criteria parsing loops
            const filterDate = this.DOM.filterDateInput.value; // YYYY-MM-DD
            const filterMonth = this.DOM.filterMonthInput.value; // MM
            const filterYear = this.DOM.filterYearInput.value.trim(); // YYYY

            const records = window.AppEngine.state.records;
            let targetedFilteredStream = records.filter(row => {
                // Precise Calendar Processing Match Evaluation Checks
                if (filterDate && row.date !== filterDate) return false;
                
                if (row.date) {
                    const structuralParts = row.date.split("-"); // [YYYY, MM, DD]
                    if (filterMonth && structuralParts[1] !== filterMonth) return false;
                    if (filterYear && structuralParts[0] !== filterYear) return false;
                } else {
                    if (filterMonth || filterYear) return false;
                }
                return true;
            });

            if (targetedFilteredStream.length === 0) {
                container.innerHTML = `<tr><td colspan="10" class="center-text text-muted" style="padding: 20px;">No matching filter transactions stream logs recovered in the ledger stack context.</td></tr>`;
                this.renderAggregatedMonthlySummaryGrid(targetedFilteredStream);
                return;
            }

            // Stream rendering loops execution block
            targetedFilteredStream.forEach((row, index) => {
                const tr = document.createElement("tr");
                const c1Total = U.parseNumeric(row.c1Large) + U.parseNumeric(row.c1Small);
                const c2Total = U.parseNumeric(row.c2Large) + U.parseNumeric(row.c2Small);

                tr.innerHTML = `
                    <td class="center-text">${index + 1}</td>
                    <td>style="white-space:nowrap;"${row.date}</td>
                    <td class="center-text text-muted">${U.computeDayName(row.date)}</td>
                    <td>${U.formatPKR(row.c1Large)}</td>
                    <td>${U.formatPKR(row.c1Small)}</td>
                    <td class="text-blue">${U.formatPKR(row.c1Account)}</td>
                    <td>${U.formatPKR(row.c2Large)}</td>
                    <td>${U.formatPKR(row.c2Small)}</td>
                    <td class="text-blue">${U.formatPKR(row.c2Account)}</td>
                    <td style="text-align:left; font-size:0.8rem;">${row.remarks || "---"}</td>
                `;
                container.appendChild(tr);
            });

            this.renderAggregatedMonthlySummaryGrid(targetedFilteredStream);
        },

        renderAggregatedMonthlySummaryGrid(filteredStream) {
            const U = window.AppEngine.utils;
            const grid = this.DOM.monthlySummaryCardsGrid;
            grid.innerHTML = "";

            // Aggregate historical records down into separate calendar months groupings indexes mapping keys
            const MonthlyMatricesMap = {};

            filteredStream.forEach(row => {
                if (!row.date) return;
                const dateParts = row.date.split("-");
                if (dateParts.length !== 3) return;
                
                // Formulate aggregate groupings targeting specific year-month unique block keys
                const matrixGroupKey = `${dateParts[0]}-${dateParts[1]}`; // e.g. 2026-07
                
                if (!MonthlyMatricesMap[matrixGroupKey]) {
                    MonthlyMatricesMap[matrixGroupKey] = {
                        c1TotalCash: 0,
                        c1WithAccount: 0,
                        c2TotalCash: 0,
                        c2WithAccount: 0,
                        combinedCash: 0,
                        combinedWithAccount: 0,
                        label: new Date(dateParts[0], dateParts[1] - 1, 1).toLocaleDateString("en-US", { month: "long", year: "numeric" })
                    };
                }

                const c1L = U.parseNumeric(row.c1Large);
                const c1S = window.AppEngine.utils.parseNumeric(row.c1Small);
                const c1A = window.AppEngine.utils.parseNumeric(row.c1Account);
                const c2L = window.AppEngine.utils.parseNumeric(row.c2Large);
                const c2S = window.AppEngine.utils.parseNumeric(row.c2Small);
                const c2A = window.AppEngine.utils.parseNumeric(row.c2Account);

                const c1Cash = c1L + c1S;
                const c2Cash = c2L + c2S;

                MonthlyMatricesMap[matrixGroupKey].c1TotalCash += c1Cash;
                MonthlyMatricesMap[matrixGroupKey].c1WithAccount += (c1Cash + c1A);
                MonthlyMatricesMap[matrixGroupKey].c2TotalCash += c2Cash;
                MonthlyMatricesMap[matrixGroupKey].c2WithAccount += (c2Cash + c2A);
                MonthlyMatricesMap[matrixGroupKey].combinedCash += (c1Cash + c2Cash);
                MonthlyMatricesMap[matrixGroupKey].combinedWithAccount += ((c1Cash + c1A) + (c2Cash + c2A));
            });

            // Compile card UI modules dynamically depending on generated groupings matrix logs map tracking metrics
            const sortedGroupKeys = Object.keys(MonthlyMatricesMap).sort().reverse();
            
            if (sortedGroupKeys.length === 0) {
                grid.innerHTML = `<div class="text-muted text-sm">No monthly summary compilation metrics processing nodes mapped to this stream subset.</div>`;
                return;
            }

            sortedGroupKeys.forEach(key => {
                const node = MonthlyMatricesMap[key];
                const card = document.createElement("div");
                card.className = "month-matrix-card";
                
                card.innerHTML = `
                    <h4><i class="fa-solid fa-calendar-check"></i> ${node.label}</h4>
                    <div class="month-matrix-row"><span>Comp 1 Cash Total:</span> <span>${U.formatPKR(node.c1TotalCash)}</span></div>
                    <div class="month-matrix-row"><span>Comp 1 With Account:</span> <span>${U.formatPKR(node.c1WithAccount)}</span></div>
                    <hr class="card-divider" style="margin:6px 0;">
                    <div class="month-matrix-row"><span>Comp 2 Cash Total:</span> <span>${U.formatPKR(node.c2TotalCash)}</span></div>
                    <div class="month-matrix-row"><span>Comp 2 With Account:</span> <span>${U.formatPKR(node.c2WithAccount)}</span></div>
                    
                    <div class="month-matrix-row highlight"><span>Overall Cash:</span> <span>${U.formatPKR(node.combinedCash)}</span></div>
                    <div class="month-matrix-row highlight" style="color:var(--success);"><span>Overall With Acc:</span> <span>${U.formatPKR(node.combinedWithAccount)}</span></div>
                `;
                grid.appendChild(card);
            });
        },

        generateStructuredCSVFileDownload() {
            const records = window.AppEngine.state.records;
            if (records.length === 0) {
                alert("The operational ledger data stack registry context contains zero elements. Cannot run data packaging operations.");
                return;
            }

            // Construct corporate standardized accounting CSV file contents layout string formatting strings
            let dataLines = [];
            dataLines.push("S.No,Transaction Date,Day Column,Company 1 Large Cash,Company 1 Small Cash,Company 1 Account Index,Company 2 Large Cash,Company 2 Small Cash,Company 2 Account Index,Operator Remarks Metadata Signature");

            records.forEach((row, index) => {
                const dayStr = window.AppEngine.utils.computeDayName(row.date);
                // Sanitize text sequences from comma separation failures boundaries parameters
                const stringRemarks = row.remarks ? row.remarks.replace(/"/g, '""') : "";
                
                const segmentLine = [
                    index + 1,
                    row.date,
                    dayStr,
                    row.c1Large,
                    row.c1Small,
                    row.c1Account,
                    row.c2Large,
                    row.c2Small,
                    row.c2Account,
                    `"${stringRemarks}"`
                ];
                dataLines.push(segmentLine.join(","));
            });

            const comprehensiveCSVContentString = dataLines.join("\n");
            const blobObj = new Blob([comprehensiveCSVContentString], { type: "text/csv;charset=utf-8;" });
            const linkElement = document.createElement("a");
            
            const systemTime = new Date().toISOString().slice(0,10);
            linkElement.href = URL.createObjectURL(blobObj);
            linkElement.setAttribute("download", `Jawad_Cash_Ledger_MasterReport_${systemTime}.csv`);
            document.body.appendChild(linkElement);
            linkElement.click();
            document.body.removeChild(linkElement);
        },

        // VIEW RENDERING INTERACTIVE INTERFACES - TECHNICAL ADM PANEL CONSOLE CONTROLS
        renderAuthenticationHistoryRecords() {
            const container = this.DOM.loginHistoryRowsContainer;
            container.innerHTML = "";
            const history = window.AppEngine.state.loginHistory;

            if (history.length === 0) {
                container.innerHTML = `<tr><td colspan="4" class="center-text text-muted" style="padding:15px;">No operations authorization access session lifecycle events tracked yet in this runtime environment context.</td></tr>`;
                return;
            }

            history.forEach(log => {
                const tr = document.createElement("tr");
                tr.innerHTML = `
                    <td>${log.date}</td>
                    <td>${log.time}</td>
                    <td>${log.updateTime}</td>
                    <td>${log.metadata}</td>
                `;
                container.appendChild(tr);
            });
        },

        updateClosingOperationalStatusBadge() {
            const systemTodayStr = window.AppEngine.utils.getSystemDateString();
            const badge = this.DOM.dayClosingStatusBadge;
            const isTodayClosed = window.AppEngine.state.closingLog.closedDates.includes(systemTodayStr);

            if (isTodayClosed) {
                badge.className = "badge status-closed";
                badge.innerText = "Ledger Immutable & Closed (End of Day)";
                this.DOM.adminCloseDayBtn.classList.add("hidden");
                this.DOM.adminReopenDayBtn.classList.remove("hidden");
            } else {
                badge.className = "badge status-open";
                badge.innerText = "Ledger Unlocked (Open)";
                this.DOM.adminCloseDayBtn.classList.remove("hidden");
                this.DOM.adminReopenDayBtn.classList.add("hidden");
            }
        },

        processCloseDayExecution() {
            const todayStr = window.AppEngine.utils.getSystemDateString();
            if (window.AppEngine.state.closingLog.closedDates.includes(todayStr)) {
                alert("Today's transaction indexing processing block has already been closed out by a prior operation block call.");
                return;
            }
            if (confirm("Executing the Close Today action makes all records associated with today's calendar date completely immutable to standard operators. Proceed?")) {
                window.AppEngine.state.closingLog.closedDates.push(todayStr);
                window.AppEngine.cache.commitStateToCache();
                this.updateClosingOperationalStatusBadge();
                this.renderLedgerDataRecords();
                alert("Day-End structural bookkeeping close routine completed successfully. Records locked.");
            }
        },

        processReopenDayExecution() {
            const todayStr = window.AppEngine.utils.getSystemDateString();
            if (!window.AppEngine.state.closingLog.closedDates.includes(todayStr)) return;
            
            if (confirm("Are you sure you want to lift security constraints and re-open the ledger editing window for today's session?")) {
                const targetIndex = window.AppEngine.state.closingLog.closedDates.indexOf(todayStr);
                if (targetIndex !== -1) {
                    window.AppEngine.state.closingLog.closedDates.splice(targetIndex, 1);
                    window.AppEngine.cache.commitStateToCache();
                    this.updateClosingOperationalStatusBadge();
                    this.renderLedgerDataRecords();
                    alert("Ledger session window successfully unlocked. Modifying entries capability restored.");
                }
            }
        },

        alterSystemAccessPinCode(targetLevelTier) {
            const inputField = (targetLevelTier === 1) ? this.DOM.adminWebPinInput : this.DOM.adminAdmPinInput;
            const newPinValueString = inputField.value.trim();

            if (newPinValueString.length !== 4 || isNaN(parseInt(newPinValueString))) {
                alert("The entered validation credential parameters must consist exactly of 4 numeric characters digits.");
                return;
            }

            if (targetLevelTier === 1) {
                window.AppEngine.state.security.webPin = newPinValueString;
                alert("Level 1 Website Access PIN successfully upgraded. Use the new credential parameters on subsequent authorization prompt entries.");
            } else {
                window.AppEngine.state.security.adminPin = newPinValueString;
                alert("Level 2 Administrative Management Write PIN successfully changed.");
            }

            inputField.value = "";
            window.AppEngine.cache.commitStateToCache();
        },

        triggerBackupJSONDownloadStream() {
            const payload = localStorage.getItem(window.AppEngine.cache.storageKey);
            if (!payload) {
                alert("No local state transaction metrics logs are cached in this processing node context.");
                return;
            }
            const blobObj = new Blob([payload], { type: "application/json" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blobObj);
            link.setAttribute("download", `Emergency_LocalCache_RawDataBackup_${Date.now()}.json`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        },

        executeFactoryClearDataRoutine() {
            if (confirm("CRITICAL WARNING: You are initiating a complete destructuring database wipe routine execution command loop sequence. This action clears ALL local cache indexes permanently. Proceed?")) {
                if (confirm("FINAL SYSTEM INTEGRITY CHECK: Are you absolutely certain? This operation cannot be rolled back or undone under any recovery parameter index.")) {
                    localStorage.removeItem(window.AppEngine.cache.storageKey);
                    window.AppEngine.state.records = [];
                    window.AppEngine.state.loginHistory = [];
                    window.AppEngine.state.closingLog.closedDates = [];
                    window.AppEngine.state.security.webPin = "4863";
                    window.AppEngine.state.security.adminPin = "2008";
                    
                    window.AppEngine.cache.commitStateToCache();
                    alert("Hardware local storage nodes destructuring hard reset routines executed successfully. Re-routing application context to authorization core screen frameworks.");
                    window.location.reload();
                }
            }
        },

        // APPLICATION INTERACTIVE COLOR MATRICES LOGIC SYSTEM
        toggleApplicationThemeSystem() {
            const elementBody = document.body;
            const currentSelectedIcon = this.DOM.themeToggle.querySelector("i");
            const currentSelectedText = this.DOM.themeToggle.querySelector("span");

            if (elementBody.classList.contains("light-theme")) {
                elementBody.classList.remove("light-theme");
                elementBody.classList.add("dark-theme");
                window.AppEngine.state.theme = "dark-theme";
                currentSelectedIcon.className = "fa-solid fa-sun";
                currentSelectedText.innerText = "Light Mode";
            } else {
                elementBody.classList.remove("dark-theme");
                elementBody.classList.add("light-theme");
                window.AppEngine.state.theme = "light-theme";
                currentSelectedIcon.className = "fa-solid fa-moon";
                currentSelectedText.innerText = "Dark Mode";
            }
            window.AppEngine.cache.commitStateToCache();
        },

        assertActiveCachedThemeContext() {
            const elementBody = document.body;
            const icon = this.DOM.themeToggle.querySelector("i");
            const text = this.DOM.themeToggle.querySelector("span");
            
            if (window.AppEngine.state.theme === "dark-theme") {
                elementBody.className = "dark-theme";
                icon.className = "fa-solid fa-sun";
                text.innerText = "Light Mode";
            } else {
                elementBody.className = "light-theme";
                icon.className = "fa-solid fa-moon";
                text.innerText = "Dark Mode";
            }
        },

        // INTERACTION BRIDGE LINK ROUTER TRIGGERS BINDINGS (TARGET FOR FIREBASE CONNECTORS)
        triggerManualCloudTransaction(directionString) {
            if (!window.AppEngine.state.isCloudConnected) {
                alert("No cloud storage network synchronization channels are currently connected. Authenticate with a Google profile node inside the Admin Console first to unlock cloud backups features.");
                return;
            }

            // Dispatch global synchronization tracking indicators triggers to alert operational modules hooks inside firebase logic wrappers
            if (directionString === "backup") {
                window.dispatchEvent(new CustomEvent("firebase_manual_backup_requested"));
            } else if (directionString === "restore") {
                if (confirm("Restoring remote database records replaces all current local ledger rows with the latest cloud storage snapshot state. Proceed?")) {
                    window.dispatchEvent(new CustomEvent("firebase_manual_restore_requested"));
                }
            }
        },

        updateCloudSyncTelemetryDashboard(statusBadgeText, isSuccess, dynamicMessageText) {
            const badge = this.DOM.cloudStatusBadge;
            const text = this.DOM.lblBackupStatusText;
            const timeLog = this.DOM.lblLastBackupTimestamp;

            badge.innerText = statusBadgeText;
            if (isSuccess) {
                badge.className = "badge status-online";
                const eventMoment = new Date();
                timeLog.innerText = `${eventMoment.toLocaleDateString()} at ${eventMoment.toLocaleTimeString()}`;
            } else {
                badge.className = "badge status-offline";
            }
            text.innerText = dynamicMessageText;
        }
    },

    // GLOBAL INTERACTION ENTRY POINT BOOTSTRAP INITIALIZER
    boot: function() {
        this.cache.initializeLocalCache();
        this.ui.cacheDOMSelectors();
        this.ui.initializeEvents();
        this.ui.assertActiveCachedThemeContext();
        
        // Render current local states before cloud triggers map data hooks profiles
        this.ui.recompileAccountingDataCalculations();
        
        console.log("Jawad Cash Management Commercial Core Application Logic Framework Engine loaded successfully.");
    }
};

// Fire processing execution thread sequences instantly on page DOM resolution events
document.addEventListener("DOMContentLoaded", () => {
    window.AppEngine.boot();
});