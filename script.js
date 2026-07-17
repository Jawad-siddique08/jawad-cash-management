/**
 * JAWAD CASH MANAGEMENT - CORE LOGIC ENGINE
 * Complete, highly-optimized production controller handling authentication levels,
 * localized calculations, database synchronization, PWA state management, and reports.
 */

(function () {
    'use strict';

    // ==========================================
    // SYSTEM STATE CONFIGURATION
    // ==========================================
    const DEFAULT_PASS_VIEWER = "4863";
    const DEFAULT_PASS_ADMIN = "2008";

    let state = {
        role: null, // 'viewer' | 'admin'
        passcodeViewer: localStorage.getItem('jcm_passcode_viewer') || DEFAULT_PASS_VIEWER,
        passcodeAdmin: localStorage.getItem('jcm_passcode_admin') || DEFAULT_PASS_ADMIN,
        ledgerData: [], // Array of ledger records
        loginHistory: [], // Session history
        closedDays: [], // Dates sealed under Daily Closing protocol
        theme: localStorage.getItem('jcm_theme') || 'light-mode',
        filters: {
            date: '',
            month: '',
            year: '2026' // Matches the default index.html selector
        },
        currentEditRowId: null
    };

    // Reference pointer for general operational closures
    let confirmationCallback = null;

    // Localized Pakistani Rupee Currency Formatter
    const currencyFormatter = new Intl.NumberFormat('en-PK', {
        style: 'currency',
        currency: 'PKR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });

    // ==========================================
    // DOM SELECTORS
    // ==========================================
    const DOM = {
        // Overlay and Security Screen
        gatekeeperOverlay: document.getElementById('gatekeeper-overlay'),
        passcodeInput: document.getElementById('passcode-input'),
        toggleGatekeeperPasscode: document.getElementById('toggle-gatekeeper-passcode'),
        gatekeeperError: document.getElementById('gatekeeper-error'),
        btnAuthenticate: document.getElementById('btn-authenticate'),
        appContainer: document.getElementById('app-container'),
        statusBadge: document.getElementById('status-badge'),
        btnLockEdit: document.getElementById('btn-lock-edit'),
        btnThemeToggle: document.getElementById('btn-theme-toggle'),
        btnLogout: document.getElementById('btn-logout'),

        // Live Displays
        liveDate: document.getElementById('live-date'),
        liveTime: document.getElementById('live-time'),
        networkStatusText: document.getElementById('network-status-text'),
        networkStatusBar: document.getElementById('network-status-bar'),

        // Tab System
        navTabs: document.querySelectorAll('.nav-tab'),
        panels: document.querySelectorAll('.tab-panel'),

        // Dashboard Elements
        cardTodayEntries: document.getElementById('card-today-entries'),
        cardLargeCash: document.getElementById('card-large-cash'),
        cardSmallCash: document.getElementById('card-small-cash'),
        cardTodayCash: document.getElementById('card-today-cash'),
        cardAccountCash: document.getElementById('card-account-cash'),
        cardTotalCash: document.getElementById('card-total-cash'),
        cardOverallCash: document.getElementById('card-overall-cash'),
        cardMonthlyCash: document.getElementById('card-monthly-cash'),
        cardMonthlyLabel: document.getElementById('card-monthly-label'),
        cardAverageCash: document.getElementById('card-average-cash'),

        // Dashboard Graphic Visuals
        barComp1Large: document.getElementById('bar-comp1-large'),
        pctComp1Large: document.getElementById('pct-comp1-large'),
        barComp1Small: document.getElementById('bar-comp1-small'),
        pctComp1Small: document.getElementById('pct-comp1-small'),
        barComp2Large: document.getElementById('bar-comp2-large'),
        pctComp2Large: document.getElementById('pct-comp2-large'),
        barComp2Small: document.getElementById('bar-comp2-small'),
        pctComp2Small: document.getElementById('pct-comp2-small'),
        barComp1Account: document.getElementById('bar-comp1-account'),
        pctComp1Account: document.getElementById('pct-comp1-account'),
        barComp2Account: document.getElementById('bar-comp2-account'),
        pctComp2Account: document.getElementById('pct-comp2-account'),
        recentLogsContainer: document.getElementById('recent-logs-container'),

        // Cash Entry Table Elements
        searchDateFilter: document.getElementById('search-date-filter'),
        searchMonthFilter: document.getElementById('search-month-filter'),
        searchYearFilter: document.getElementById('search-year-filter'),
        btnClearFilters: document.getElementById('btn-clear-filters'),
        btnAddEntry: document.getElementById('btn-add-entry'),
        ledgerBody: document.getElementById('ledger-rows-body'),

        // Live Calculating Table Footers (TODAY)
        todayComp1Large: document.getElementById('today-comp1-large'),
        todayComp1Small: document.getElementById('today-comp1-small'),
        todayComp1Account: document.getElementById('today-comp1-account'),
        todayComp2Large: document.getElementById('today-comp2-large'),
        todayComp2Small: document.getElementById('today-comp2-small'),
        todayComp2Account: document.getElementById('today-comp2-account'),
        todayComp1Total: document.getElementById('today-comp1-total'),
        todayComp2Total: document.getElementById('today-comp2-total'),
        todayGrandTotal: document.getElementById('today-grand-total'),

        // Live Calculating Table Footers (OVERALL)
        overallComp1Large: document.getElementById('overall-comp1-large'),
        overallComp1Small: document.getElementById('overall-comp1-small'),
        overallComp1Account: document.getElementById('overall-comp1-account'),
        overallComp2Large: document.getElementById('overall-comp2-large'),
        overallComp2Small: document.getElementById('overall-comp2-small'),
        overallComp2Account: document.getElementById('overall-comp2-account'),
        overallComp1Total: document.getElementById('overall-comp1-total'),
        overallComp2Total: document.getElementById('overall-comp2-total'),
        overallGrandTotal: document.getElementById('overall-grand-total'),

        // Reports View Panel Elements
        reportMonthFilter: document.getElementById('report-month-filter'),
        reportYearFilter: document.getElementById('report-year-filter'),
        btnPrintReport: document.getElementById('btn-print-report'),
        btnExportCsv: document.getElementById('btn-export-csv'),
        reportPeriodText: document.getElementById('report-display-period-text'),
        reportSumComp1: document.getElementById('report-sum-comp1'),
        reportSumComp2: document.getElementById('report-sum-comp2'),
        reportSumGrand: document.getElementById('report-sum-grand'),
        reportMiniRows: document.getElementById('report-mini-rows'),

        // Admin Configuration Controls
        adminViewerPasscode: document.getElementById('admin-viewer-passcode-field'),
        adminAdminPasscode: document.getElementById('admin-admin-passcode-field'),
        btnUpdatePasscodes: document.getElementById('btn-update-passcodes'),
        btnBackupLocal: document.getElementById('btn-backup-local'),
        fileRestoreInput: document.getElementById('file-restore-input'),
        btnTriggerRestore: document.getElementById('btn-trigger-restore'),
        btnFactoryReset: document.getElementById('btn-factory-reset'),
        btnCloseDay: document.getElementById('btn-close-day'),
        btnClearHistory: document.getElementById('btn-clear-history'),
        historyLogBody: document.getElementById('history-log-body'),
        firestoreEngineStatus: document.getElementById('firestore-engine-status'),

        // Elevate Access Modal Portal
        passcodeModal: document.getElementById('passcode-modal'),
        modalPasscodeField: document.getElementById('modal-passcode-field'),
        modalErrorText: document.getElementById('modal-error-text'),
        btnModalVerify: document.getElementById('btn-modal-verify'),

        // Generic Dynamic Confirmation Dialog Portal
        confirmModal: document.getElementById('confirm-modal'),
        confirmModalTitle: document.getElementById('confirm-modal-title'),
        confirmModalMessage: document.getElementById('confirm-modal-message'),
        btnConfirmAction: document.getElementById('btn-confirm-action')
    };

    // ==========================================
    // UTILITY HELPER & DECORATOR FUNCTIONS
    // ==========================================

    /**
     * Standardizes floating value parsed from input string
     */
    function parseCleanNumber(input) {
        if (!input) return 0.00;
        const cleaned = String(input).replace(/[^\d.-]/g, '');
        const val = parseFloat(cleaned);
        return isNaN(val) || val < 0 ? 0.00 : val;
    }

    /**
     * Standardizes dynamic string formats cleanly to Pakistani currency notation
     */
    function formatPKR(amount) {
        return currencyFormatter.format(parseCleanNumber(amount));
    }

    /**
     * Resolves human readable Day name based on absolute date string input
     */
    function resolveDayName(dateString) {
        if (!dateString) return '';
        const parsedDate = new Date(dateString);
        if (isNaN(parsedDate.getTime())) return '';
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return days[parsedDate.getDay()];
    }

    /**
     * Formats default systems generated timestamps
     */
    function getCurrentFormattedTime() {
        const time = new Date();
        return time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' });
    }

    function getCurrentFormattedDate() {
        const date = new Date();
        return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    }

    function getFormattedDateISO(date = new Date()) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    // ==========================================
    // SYSTEM DATABASE & LOCAL STORAGE CORE
    // ==========================================

    /**
     * Initializes structural default local components on fresh setup
     */
    function initDatabaseState() {
        // Theme init
        document.body.className = state.theme;
        
        // Ledger table setup
        const localData = localStorage.getItem('jcm_ledger_data');
        if (localData) {
            state.ledgerData = JSON.parse(localData);
        } else {
            // Setup default placeholder items in local DB so system starts beautifully
            state.ledgerData = [
                {
                    id: "init-row-1",
                    date: getFormattedDateISO(),
                    day: resolveDayName(getFormattedDateISO()),
                    comp1_large: 250000.00,
                    comp1_small: 15000.00,
                    comp1_account: 50000.00,
                    comp2_large: 180000.00,
                    comp2_small: 8500.00,
                    comp2_account: 25000.00,
                    remarks: "Opening Cash Pool Initialized",
                    locked: false
                }
            ];
            commitLedgerToDatabase();
        }

        // Close Days table setup
        const localClosedDays = localStorage.getItem('jcm_closed_days');
        if (localClosedDays) {
            state.closedDays = JSON.parse(localClosedDays);
        }

        // Session Trace initialization
        const traceData = localStorage.getItem('jcm_login_history');
        if (traceData) {
            state.loginHistory = JSON.parse(traceData);
        }
    }

    /**
     * Persists cash record modifications immediately to local variables and syncs
     */
    function commitLedgerToDatabase() {
        localStorage.setItem('jcm_ledger_data', JSON.stringify(state.ledgerData));
        
        // If external cloud Firebase integrations exist, run active backup synchronization
        if (window.FirebaseEngine && window.FirebaseEngine.isConfigured()) {
            window.FirebaseEngine.syncLedgerToCloud(state.ledgerData);
        }
        
        recalculateAllSystemAggregates();
    }

    /**
     * Saves operational session authentication logs safely
     */
    function writeFootprintLog(statusMessage, assignedRole) {
        const userAgent = navigator.userAgent;
        let platform = "Unknown Device Platform";
        if (userAgent.indexOf("Windows") !== -1) platform = "Windows Workspace Terminal";
        else if (userAgent.indexOf("Android") !== -1) platform = "Android Mobile App PWA";
        else if (userAgent.indexOf("iPad") !== -1 || userAgent.indexOf("iPhone") !== -1) platform = "iOS Portal Native App";
        else if (userAgent.indexOf("Macintosh") !== -1) platform = "macOS Workstation client";

        const logItem = {
            date: getFormattedDateISO(),
            time: getCurrentFormattedTime(),
            device: platform,
            role: assignedRole === 'admin' ? 'Administrator Portal' : 'Staff Viewer Access',
            status: statusMessage
        };

        state.loginHistory.unshift(logItem);
        // Constrain history to last 50 entries
        if (state.loginHistory.length > 50) {
            state.loginHistory.pop();
        }

        localStorage.setItem('jcm_login_history', JSON.stringify(state.loginHistory));
        renderLoginTraceLogs();

        if (window.FirebaseEngine && window.FirebaseEngine.isConfigured()) {
            window.FirebaseEngine.syncLogsToCloud(state.loginHistory);
        }
    }

    // ==========================================
    // UI LAYOUT RENDER ENGINE
    // ==========================================

    /**
     * Generates cash entries on-screen while maintaining live element constraints
     */
    function renderLedgerTable() {
        DOM.ledgerBody.innerHTML = '';

        // Match Filter conditions
        const filteredRecords = state.ledgerData.filter(record => {
            if (state.filters.date && record.date !== state.filters.date) return false;
            
            if (record.date) {
                const parts = record.date.split('-'); // [YYYY, MM, DD]
                if (state.filters.month && parts[1] !== state.filters.month) return false;
                if (state.filters.year && parts[0] !== state.filters.year) return false;
            }
            return true;
        });

        // Ensure records are ordered by date descending so latest operations sit up-front
        filteredRecords.sort((a, b) => new Date(b.date) - new Date(a.date));

        if (filteredRecords.length === 0) {
            DOM.ledgerBody.innerHTML = `
                <tr>
                    <td colspan="11" class="text-center text-muted" style="padding: 3rem;">
                        <i class="fa-solid fa-folder-open fa-3x mb-3" style="display:block; opacity: 0.5;"></i>
                        No Cash Ledger Records Found matching specified criteria.
                    </td>
                </tr>
            `;
            return;
        }

        filteredRecords.forEach((record, idx) => {
            const tr = document.createElement('tr');
            tr.dataset.id = record.id;
            
            const isClosed = state.closedDays.includes(record.date);
            const isReadonly = state.role !== 'admin' || isClosed;
            
            if (isClosed || record.locked) {
                tr.classList.add('row-locked');
            }

            const inputDisabledAttr = isReadonly ? 'disabled' : '';

            tr.innerHTML = `
                <td class="col-sno text-center">${idx + 1}</td>
                <td>
                    <input type="date" class="table-input cell-date" value="${record.date || ''}" ${inputDisabledAttr}>
                </td>
                <td class="col-day cell-day">${record.day || ''}</td>
                <td>
                    <input type="text" class="table-input cell-comp1-large text-right font-mono" value="${formatPKR(record.comp1_large)}" ${inputDisabledAttr}>
                </td>
                <td>
                    <input type="text" class="table-input cell-comp1-small text-right font-mono" value="${formatPKR(record.comp1_small)}" ${inputDisabledAttr}>
                </td>
                <td>
                    <input type="text" class="table-input cell-comp1-account text-right font-mono" value="${formatPKR(record.comp1_account || 0)}" ${inputDisabledAttr}>
                </td>
                <td>
                    <input type="text" class="table-input cell-comp2-large text-right font-mono" value="${formatPKR(record.comp2_large)}" ${inputDisabledAttr}>
                </td>
                <td>
                    <input type="text" class="table-input cell-comp2-small text-right font-mono" value="${formatPKR(record.comp2_small)}" ${inputDisabledAttr}>
                </td>
                <td>
                    <input type="text" class="table-input cell-comp2-account text-right font-mono" value="${formatPKR(record.comp2_account || 0)}" ${inputDisabledAttr}>
                </td>
                <td>
                    <input type="text" class="table-input cell-remarks" value="${record.remarks || ''}" placeholder="Enter remarks..." ${inputDisabledAttr}>
                </td>
                <td class="col-actions text-center edit-elements-only ${state.role !== 'admin' ? 'hide' : ''}">
                    <button class="btn-action btn-danger btn-delete-row" title="Delete Ledger Row" ${isClosed ? 'disabled' : ''}>
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </td>
            `;

            // Bind Cell Inputs Event Handlers (Focus / Change / Calculations)
            bindTableRowCellEvents(tr, record);
            DOM.ledgerBody.appendChild(tr);
        });

        // Sync visual visibility toggling actions
        applyRoleAccessPermissions();
    }

    /**
     * Live input events management to enforce Pakistani currency parameters
     */
    function bindTableRowCellEvents(rowElement, record) {
        const dateInput = rowElement.querySelector('.cell-date');
        const comp1LargeInput = rowElement.querySelector('.cell-comp1-large');
        const comp1SmallInput = rowElement.querySelector('.cell-comp1-small');
        const comp1AccountInput = rowElement.querySelector('.cell-comp1-account');
        const comp2LargeInput = rowElement.querySelector('.cell-comp2-large');
        const comp2SmallInput = rowElement.querySelector('.cell-comp2-small');
        const comp2AccountInput = rowElement.querySelector('.cell-comp2-account');
        const remarksInput = rowElement.querySelector('.cell-remarks');
        const deleteBtn = rowElement.querySelector('.btn-delete-row');

        // Focus formatting clean up
        const formatInputOnFocus = (e) => {
            const cleanVal = parseCleanNumber(e.target.value);
            e.target.value = cleanVal === 0 ? '' : cleanVal.toFixed(2);
        };

        const formatInputOnBlur = (e, fieldName) => {
            const rawVal = parseCleanNumber(e.target.value);
            e.target.value = formatPKR(rawVal);
            
            // Commit structure changes to master memory
            const item = state.ledgerData.find(item => item.id === record.id);
            if (item) {
                item[fieldName] = rawVal;
                commitLedgerToDatabase();
            }
        };

        comp1LargeInput.addEventListener('focus', formatInputOnFocus);
        comp1LargeInput.addEventListener('blur', (e) => formatInputOnBlur(e, 'comp1_large'));

        comp1SmallInput.addEventListener('focus', formatInputOnFocus);
        comp1SmallInput.addEventListener('blur', (e) => formatInputOnBlur(e, 'comp1_small'));

        comp1AccountInput.addEventListener('focus', formatInputOnFocus);
        comp1AccountInput.addEventListener('blur', (e) => formatInputOnBlur(e, 'comp1_account'));

        comp2LargeInput.addEventListener('focus', formatInputOnFocus);
        comp2LargeInput.addEventListener('blur', (e) => formatInputOnBlur(e, 'comp2_large'));

        comp2SmallInput.addEventListener('focus', formatInputOnFocus);
        comp2SmallInput.addEventListener('blur', (e) => formatInputOnBlur(e, 'comp2_small'));

        comp2AccountInput.addEventListener('focus', formatInputOnFocus);
        comp2AccountInput.addEventListener('blur', (e) => formatInputOnBlur(e, 'comp2_account'));

        // Date update logic
        dateInput.addEventListener('change', (e) => {
            const newDate = e.target.value;
            const newDay = resolveDayName(newDate);
            
            rowElement.querySelector('.cell-day').innerText = newDay;
            
            const item = state.ledgerData.find(item => item.id === record.id);
            if (item) {
                item.date = newDate;
                item.day = newDay;
                commitLedgerToDatabase();
            }
        });

        // Remarks dynamic save
        remarksInput.addEventListener('change', (e) => {
            const item = state.ledgerData.find(item => item.id === record.id);
            if (item) {
                item.remarks = e.target.value;
                commitLedgerToDatabase();
            }
        });

        // Delete Row Operation Event Trigger
        if (deleteBtn) {
            deleteBtn.addEventListener('click', () => {
                triggerConfirmationDialog(
                    "Delete Row Entry?",
                    `Are you sure you want to delete cash ledger entry S.No: ${rowElement.querySelector('.col-sno').innerText}? This is irreversible.`,
                    () => {
                        state.ledgerData = state.ledgerData.filter(item => item.id !== record.id);
                        commitLedgerToDatabase();
                        renderLedgerTable();
                    }
                );
            });
        }
    }

    /**
     * Real-time engine calculating totals, today's targets and dashboard stats
     */
    function recalculateAllSystemAggregates() {
        const todayISO = getFormattedDateISO();
        
        // --- 1. Aggregations Containers ---
        let totals = {
            today: { c1L: 0, c1S: 0, c1A: 0, c2L: 0, c2S: 0, c2A: 0 },
            overall: { c1L: 0, c1S: 0, c1A: 0, c2L: 0, c2S: 0, c2A: 0 }
        };

        let uniqueDatesWithEntries = new Set();

        state.ledgerData.forEach(rec => {
            const c1lVal = parseCleanNumber(rec.comp1_large);
            const c1sVal = parseCleanNumber(rec.comp1_small);
            const c1aVal = parseCleanNumber(rec.comp1_account);
            const c2lVal = parseCleanNumber(rec.comp2_large);
            const c2sVal = parseCleanNumber(rec.comp2_small);
            const c2aVal = parseCleanNumber(rec.comp2_account);

            if (rec.date) {
                uniqueDatesWithEntries.add(rec.date);
            }

            // Today targets aggregation matching
            if (rec.date === todayISO) {
                totals.today.c1L += c1lVal;
                totals.today.c1S += c1sVal;
                totals.today.c1A += c1aVal;
                totals.today.c2L += c2lVal;
                totals.today.c2S += c2sVal;
                totals.today.c2A += c2aVal;
            }

            // Lifetime tracking calculations
            totals.overall.c1L += c1lVal;
            totals.overall.c1S += c1sVal;
            totals.overall.c1A += c1aVal;
            totals.overall.c2L += c2lVal;
            totals.overall.c2S += c2sVal;
            totals.overall.c2A += c2aVal;
        });

        // Multi-level calculations
        const todayComp1TotalSum = totals.today.c1L + totals.today.c1S + totals.today.c1A;
        const todayComp2TotalSum = totals.today.c2L + totals.today.c2S + totals.today.c2A;
        const todayGrandOverallSum = todayComp1TotalSum + todayComp2TotalSum;

        const overallComp1TotalSum = totals.overall.c1L + totals.overall.c1S + totals.overall.c1A;
        const overallComp2TotalSum = totals.overall.c2L + totals.overall.c2S + totals.overall.c2A;
        const overallGrandOverallSum = overallComp1TotalSum + overallComp2TotalSum;

        // --- 2. Update Cash Entry View Table Footers ---
        DOM.todayComp1Large.innerText = formatPKR(totals.today.c1L).replace("Rs.", "");
        DOM.todayComp1Small.innerText = formatPKR(totals.today.c1S).replace("Rs.", "");
        if (DOM.todayComp1Account) DOM.todayComp1Account.innerText = formatPKR(totals.today.c1A).replace("Rs.", "");
        DOM.todayComp2Large.innerText = formatPKR(totals.today.c2L).replace("Rs.", "");
        DOM.todayComp2Small.innerText = formatPKR(totals.today.c2S).replace("Rs.", "");
        if (DOM.todayComp2Account) DOM.todayComp2Account.innerText = formatPKR(totals.today.c2A).replace("Rs.", "");
        DOM.todayComp1Total.innerText = formatPKR(todayComp1TotalSum);
        DOM.todayComp2Total.innerText = formatPKR(todayComp2TotalSum);
        DOM.todayGrandTotal.innerText = formatPKR(todayGrandOverallSum);

        DOM.overallComp1Large.innerText = formatPKR(totals.overall.c1L).replace("Rs.", "");
        DOM.overallComp1Small.innerText = formatPKR(totals.overall.c1S).replace("Rs.", "");
        if (DOM.overallComp1Account) DOM.overallComp1Account.innerText = formatPKR(totals.overall.c1A).replace("Rs.", "");
        DOM.overallComp2Large.innerText = formatPKR(totals.overall.c2L).replace("Rs.", "");
        DOM.overallComp2Small.innerText = formatPKR(totals.overall.c2S).replace("Rs.", "");
        if (DOM.overallComp2Account) DOM.overallComp2Account.innerText = formatPKR(totals.overall.c2A).replace("Rs.", "");
        DOM.overallComp1Total.innerText = formatPKR(overallComp1TotalSum);
        DOM.overallComp2Total.innerText = formatPKR(overallComp2TotalSum);
        DOM.overallGrandTotal.innerText = formatPKR(overallGrandOverallSum);

        // --- 3. Compute Monthly Dashboard Statistics Target ---
        const currentYearStr = "2026";
        const currentMonthStr = String(new Date().getMonth() + 1).padStart(2, '0');
        let monthlyTotalCashSum = 0;

        state.ledgerData.forEach(rec => {
            if (rec.date) {
                const parts = rec.date.split('-');
                if (parts[0] === currentYearStr && parts[1] === currentMonthStr) {
                    monthlyTotalCashSum += parseCleanNumber(rec.comp1_large) +
                                           parseCleanNumber(rec.comp1_small) +
                                           parseCleanNumber(rec.comp1_account) +
                                           parseCleanNumber(rec.comp2_large) +
                                           parseCleanNumber(rec.comp2_small) +
                                           parseCleanNumber(rec.comp2_account);
                }
            }
        });

        // --- 4. Render Dashboard Summary Card Elements ---
        const todayRecordCount = state.ledgerData.filter(rec => rec.date === todayISO).length;
        DOM.cardTodayEntries.innerText = todayRecordCount;
        
        // Update updated cards logic
        if (DOM.cardLargeCash) DOM.cardLargeCash.innerText = formatPKR(totals.overall.c1L + totals.overall.c2L);
        if (DOM.cardSmallCash) DOM.cardSmallCash.innerText = formatPKR(totals.overall.c1S + totals.overall.c2S);
        if (DOM.cardAccountCash) DOM.cardAccountCash.innerText = formatPKR(totals.overall.c1A + totals.overall.c2A);
        if (DOM.cardTotalCash) DOM.cardTotalCash.innerText = formatPKR(overallGrandOverallSum);
        
        DOM.cardTodayCash.innerText = formatPKR(todayGrandOverallSum);
        DOM.cardOverallCash.innerText = formatPKR(totals.overall.c1L + totals.overall.c1S + totals.overall.c2L + totals.overall.c2S); // Overall Cash physically in Vault
        DOM.cardMonthlyCash.innerText = formatPKR(monthlyTotalCashSum);
        DOM.cardMonthlyLabel.innerText = `${new Date().toLocaleString('en-US', { month: 'long' })} ${currentYearStr} Total`;

        // Calculate average daily balances
        const activeDaysCount = uniqueDatesWithEntries.size || 1;
        const averageCashPerDay = overallGrandOverallSum / activeDaysCount;
        DOM.cardAverageCash.innerText = formatPKR(averageCashPerDay);

        // --- 5. Generate Graphics Allocations profile percentages ---
        const grandTotal = totals.overall.c1L + totals.overall.c1S + totals.overall.c1A +
                           totals.overall.c2L + totals.overall.c2S + totals.overall.c2A;

        if (grandTotal > 0) {
            if (DOM.barComp1Large) DOM.barComp1Large.style.width = `${((totals.overall.c1L / grandTotal) * 100).toFixed(1)}%`;
            if (DOM.pctComp1Large) DOM.pctComp1Large.textContent = `${((totals.overall.c1L / grandTotal) * 100).toFixed(1)}%`;

            if (DOM.barComp1Small) DOM.barComp1Small.style.width = `${((totals.overall.c1S / grandTotal) * 100).toFixed(1)}%`;
            if (DOM.pctComp1Small) DOM.pctComp1Small.textContent = `${((totals.overall.c1S / grandTotal) * 100).toFixed(1)}%`;

            if (DOM.barComp1Account) DOM.barComp1Account.style.width = `${((totals.overall.c1A / grandTotal) * 100).toFixed(1)}%`;
            if (DOM.pctComp1Account) DOM.pctComp1Account.textContent = `${((totals.overall.c1A / grandTotal) * 100).toFixed(1)}%`;

            if (DOM.barComp2Large) DOM.barComp2Large.style.width = `${((totals.overall.c2L / grandTotal) * 100).toFixed(1)}%`;
            if (DOM.pctComp2Large) DOM.pctComp2Large.textContent = `${((totals.overall.c2L / grandTotal) * 100).toFixed(1)}%`;

            if (DOM.barComp2Small) DOM.barComp2Small.style.width = `${((totals.overall.c2S / grandTotal) * 100).toFixed(1)}%`;
            if (DOM.pctComp2Small) DOM.pctComp2Small.textContent = `${((totals.overall.c2S / grandTotal) * 100).toFixed(1)}%`;

            if (DOM.barComp2Account) DOM.barComp2Account.style.width = `${((totals.overall.c2A / grandTotal) * 100).toFixed(1)}%`;
            if (DOM.pctComp2Account) DOM.pctComp2Account.textContent = `${((totals.overall.c2A / grandTotal) * 100).toFixed(1)}%`;
        } else {
            // Reset to 0 if total is empty
            [DOM.barComp1Large, DOM.barComp1Small, DOM.barComp1Account, DOM.barComp2Large, DOM.barComp2Small, DOM.barComp2Account].forEach(b => { if(b) b.style.width = '0%'; });
            [DOM.pctComp1Large, DOM.pctComp1Small, DOM.pctComp1Account, DOM.pctComp2Large, DOM.pctComp2Small, DOM.pctComp2Account].forEach(p => { if(p) p.textContent = '0%'; });
        }
        
        // --- 6. Recent Action Logs Updates ---
        updateRecentEntriesLogList();

        // --- 7. Refresh Reporting Visual State ---
        generateCurrentReportStatement();
    }

    /**
     * Renders a short preview of the latest ledger transactions on the dashboard
     */
    function updateRecentEntriesLogList() {
        DOM.recentLogsContainer.innerHTML = '';
        
        // Sort the data arrays descending to grab latest entries
        const sorted = [...state.ledgerData].sort((a, b) => new Date(b.date) - new Date(a.date));
        const sliced = sorted.slice(0, 5);

        if (sliced.length === 0) {
            DOM.recentLogsContainer.innerHTML = `<li class="log-empty-state">No entries registered in database yet</li>`;
            return;
        }

        sliced.forEach(item => {
            const li = document.createElement('li');
            const total = parseCleanNumber(item.comp1_large) + parseCleanNumber(item.comp1_small) + parseCleanNumber(item.comp1_account) +
                          parseCleanNumber(item.comp2_large) + parseCleanNumber(item.comp2_small) + parseCleanNumber(item.comp2_account);
            li.innerHTML = `
                <div>
                    <strong>${item.date}</strong> - ${item.remarks || 'No remarks recorded'}
                </div>
                <div class="log-time font-mono">
                    ${formatPKR(total)}
                </div>
            `;
            DOM.recentLogsContainer.appendChild(li);
        });
    }

    /**
     * Displays admin system security logs in the panel
     */
    function renderLoginTraceLogs() {
        DOM.historyLogBody.innerHTML = '';
        
        if (state.loginHistory.length === 0) {
            DOM.historyLogBody.innerHTML = `
                <tr>
                    <td colspan="5" class="text-center text-muted">No operational traces logged.</td>
                </tr>
            `;
            return;
        }

        state.loginHistory.forEach(log => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td class="text-bold">${log.date}</td>
                <td class="font-mono">${log.time}</td>
                <td>${log.device}</td>
                <td><span class="badge ${log.role.includes('Admin') ? 'badge-admin' : 'badge-viewer'}">${log.role}</span></td>
                <td><span class="badge-accent">${log.status}</span></td>
            `;
            DOM.historyLogBody.appendChild(tr);
        });
    }

    /**
     * Generates on-screen summaries in the Reporting Panel according to set dropdowns
     */
    function generateCurrentReportStatement() {
        const month = DOM.reportMonthFilter.value;
        const year = DOM.reportYearFilter.value;

        // Render targets updates
        const monthsNames = [
            "January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        DOM.reportPeriodText.innerText = `Statement: ${monthsNames[parseInt(month) - 1]} ${year}`;

        // Compute balances matches
        let comp1Sum = 0;
        let comp2Sum = 0;
        let miniRowsHtml = '';
        let matchedIndex = 1;

        // Sort ascending for ledger reports
        const matchedEntries = state.ledgerData.filter(record => {
            if (record.date) {
                const parts = record.date.split('-');
                return parts[0] === year && parts[1] === month;
            }
            return false;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (matchedEntries.length === 0) {
            DOM.reportSumComp1.innerText = "Rs. 0.00";
            DOM.reportSumComp2.innerText = "Rs. 0.00";
            DOM.reportSumGrand.innerText = "Rs. 0.00";
            DOM.reportMiniRows.innerHTML = `
                <tr>
                    <td colspan="6" class="text-center text-muted">No ledger registers match current statement parameters.</td>
                </tr>
            `;
            return;
        }

        matchedEntries.forEach(item => {
            const c1Total = parseCleanNumber(item.comp1_large) + parseCleanNumber(item.comp1_small) + parseCleanNumber(item.comp1_account);
            const c2Total = parseCleanNumber(item.comp2_large) + parseCleanNumber(item.comp2_small) + parseCleanNumber(item.comp2_account);
            const grandRowTotal = c1Total + c2Total;

            comp1Sum += c1Total;
            comp2Sum += c2Total;

            miniRowsHtml += `
                <tr>
                    <td>${matchedIndex++}</td>
                    <td class="text-bold">${item.date}</td>
                    <td>${item.day}</td>
                    <td class="text-right font-mono">${formatPKR(c1Total).replace("Rs.", "")}</td>
                    <td class="text-right font-mono">${formatPKR(c2Total).replace("Rs.", "")}</td>
                    <td class="text-right font-mono text-bold">${formatPKR(grandRowTotal).replace("Rs.", "")}</td>
                </tr>
            `;
        });

        DOM.reportSumComp1.innerText = formatPKR(comp1Sum);
        DOM.reportSumComp2.innerText = formatPKR(comp2Sum);
        DOM.reportSumGrand.innerText = formatPKR(comp1Sum + comp2Sum);
        DOM.reportMiniRows.innerHTML = miniRowsHtml;
    }

    // ==========================================
    // PERMISSIONS GATEKEEPER & ACCESS PATTERNS
    // ==========================================

    /**
     * Toggles visibility of editing elements based on current roles (Admin vs. Viewer)
     */
    function applyRoleAccessPermissions() {
        if (state.role === 'admin') {
            DOM.statusBadge.className = 'badge badge-admin';
            DOM.statusBadge.innerHTML = '<i class="fa-solid fa-user-shield"></i> Admin Access';
            
            // Unlocked state elements
            DOM.btnAddEntry.removeAttribute('disabled');
            DOM.btnLockEdit.classList.remove('hide');
            
            // Enable editing fields in structural configurations inside Admin Panel
            DOM.adminViewerPasscode.removeAttribute('disabled');
            DOM.adminViewerPasscode.value = state.passcodeViewer;
            DOM.adminAdminPasscode.removeAttribute('disabled');
            DOM.adminAdminPasscode.value = state.passcodeAdmin;
            
            DOM.btnUpdatePasscodes.removeAttribute('disabled');
            DOM.btnBackupLocal.removeAttribute('disabled');
            DOM.fileRestoreInput.removeAttribute('disabled');
            DOM.btnTriggerRestore.removeAttribute('disabled');
            DOM.btnFactoryReset.removeAttribute('disabled');
            DOM.btnCloseDay.removeAttribute('disabled');
            DOM.btnClearHistory.removeAttribute('disabled');

            // Expose table modifications action columns if admin mode is engaged
            document.querySelectorAll('.edit-elements-only').forEach(el => el.classList.remove('hide'));
        } else {
            DOM.statusBadge.className = 'badge badge-viewer';
            DOM.statusBadge.innerHTML = '<i class="fa-solid fa-eye"></i> Viewer Mode';
            
            // Locked constraints inside application
            DOM.btnAddEntry.setAttribute('disabled', 'true');
            DOM.btnLockEdit.classList.add('hide');
            
            // Disabled admin configuration controls
            DOM.adminViewerPasscode.setAttribute('disabled', 'true');
            DOM.adminViewerPasscode.value = '••••';
            DOM.adminAdminPasscode.setAttribute('disabled', 'true');
            DOM.adminAdminPasscode.value = '••••';
            
            DOM.btnUpdatePasscodes.setAttribute('disabled', 'true');
            DOM.btnBackupLocal.setAttribute('disabled', 'true');
            DOM.fileRestoreInput.setAttribute('disabled', 'true');
            DOM.btnTriggerRestore.setAttribute('disabled', 'true');
            DOM.btnFactoryReset.setAttribute('disabled', 'true');
            DOM.btnCloseDay.setAttribute('disabled', 'true');
            DOM.btnClearHistory.setAttribute('disabled', 'true');

            // Hide action buttons in ledger table
            document.querySelectorAll('.edit-elements-only').forEach(el => el.classList.add('hide'));
        }
    }

    /**
     * Upgrades session role permissions if valid security credentials are validated
     */
    function attemptElevateToAdmin(passcodeValue) {
        if (passcodeValue === state.passcodeAdmin) {
            state.role = 'admin';
            writeFootprintLog("Escalated permissions to Administration role", 'admin');
            applyRoleAccessPermissions();
            renderLedgerTable();
            return true;
        }
        return false;
    }

    /**
     * Locks down permissions back to standard viewer status instantly
     */
    function lockDownSessionToViewer() {
        state.role = 'viewer';
        writeFootprintLog("Demoted current session privileges back to standard Viewer mode", 'viewer');
        applyRoleAccessPermissions();
        renderLedgerTable();
    }

    // ==========================================
    // ACTION CONTROLLERS & WORKFLOW HANDLERS
    // ==========================================

    /**
     * Direct navigation menu control panel transitions
     */
    function switchActiveTabPanel(targetPanelId) {
        // Guard access: If user clicks on Admin panel but is only a viewer, prompter activates
        if (targetPanelId === 'tab-admin' && state.role !== 'admin') {
            DOM.modalPasscodeField.value = '';
            DOM.modalErrorText.classList.add('hide');
            DOM.passcodeModal.classList.remove('hide');
            DOM.modalPasscodeField.focus();
            return;
        }

        DOM.navTabs.forEach(tab => {
            if (tab.getAttribute('data-target') === targetPanelId) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });

        DOM.panels.forEach(panel => {
            if (panel.id === targetPanelId) {
                panel.classList.add('active');
            } else {
                panel.classList.remove('active');
            }
        });
    }

    /**
     * Generates and appends a blank cash ledger structure ready for inputs
     */
    function executeInsertNewLedgerRow() {
        if (state.role !== 'admin') return;

        const newRowId = `row-${Date.now()}`;
        const defaultDate = getFormattedDateISO();
        
        // Block insertion if targeted date is closed already
        if (state.closedDays.includes(defaultDate)) {
            alert(`Entries for today (${defaultDate}) are closed under daily closing protocols. Reopen via the admin panel first.`);
            return;
        }

        const newRecord = {
            id: newRowId,
            date: defaultDate,
            day: resolveDayName(defaultDate),
            comp1_large: 0.00,
            comp1_small: 0.00,
            comp1_account: 0.00,
            comp2_large: 0.00,
            comp2_small: 0.00,
            comp2_account: 0.00,
            remarks: '',
            locked: false
        };

        state.ledgerData.unshift(newRecord);
        commitLedgerToDatabase();
        renderLedgerTable();
    }

    /**
     * Prompts a styled modal window demanding user confirmation before destructive executions
     */
    function triggerConfirmationDialog(title, message, executionCallback) {
        DOM.confirmModalTitle.innerText = title;
        DOM.confirmModalMessage.innerText = message;
        confirmationCallback = executionCallback;
        DOM.confirmModal.classList.remove('hide');
    }

    // ==========================================
    // DATA EXPORT & DISASTER SYSTEM CORES
    // ==========================================

    /**
     * Creates a download link with complete JSON package representations of stored cash states
     */
    function executeLocalDataBackupDownload() {
        if (state.role !== 'admin') return;

        const dataDump = {
            version: "2026.1",
            exportTimestamp: new Date().toISOString(),
            ledgerData: state.ledgerData,
            closedDays: state.closedDays,
            systemCredentials: {
                viewer: state.passcodeViewer,
                admin: state.passcodeAdmin
            }
        };

        const jsonString = JSON.stringify(dataDump, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `JCM_Backup_${getFormattedDateISO()}_${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        writeFootprintLog("Database Local JSON Backup file exported successfully.", 'admin');
    }

    /**
     * Imports structured JSON files to override the database elements
     */
    function handleBackupFileRestore(fileEvent) {
        const file = fileEvent.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const parsed = JSON.parse(e.target.result);
                
                // Security compliance structural check on imported object properties
                if (!parsed.ledgerData || !Array.isArray(parsed.ledgerData)) {
                    throw new Error("Invalid structure format detected: ledgerData is missing.");
                }

                triggerConfirmationDialog(
                    "Confirm Ledger Recovery?",
                    "Are you absolutely sure you want to restore this file? It will OVERWRITE all current entries instantly.",
                    () => {
                        state.ledgerData = parsed.ledgerData;
                        
                        if (parsed.closedDays && Array.isArray(parsed.closedDays)) {
                            state.closedDays = parsed.closedDays;
                            localStorage.setItem('jcm_closed_days', JSON.stringify(state.closedDays));
                        }

                        if (parsed.systemCredentials) {
                            if (parsed.systemCredentials.viewer) {
                                state.passcodeViewer = parsed.systemCredentials.viewer;
                                localStorage.setItem('jcm_passcode_viewer', state.passcodeViewer);
                            }
                            if (parsed.systemCredentials.admin) {
                                state.passcodeAdmin = parsed.systemCredentials.admin;
                                localStorage.setItem('jcm_passcode_admin', state.passcodeAdmin);
                            }
                        }

                        commitLedgerToDatabase();
                        renderLedgerTable();
                        writeFootprintLog("Ledger database recovered and restored successfully from backup file.", 'admin');
                        alert("Database configuration restored successfully.");
                    }
                );
            } catch (err) {
                alert("Error: The backup file is invalid or corrupted. details: " + err.message);
            }
        };
        reader.readAsText(file);
    }

    /**
     * Erases all operational memory and databases resetting system defaults
     */
    function executeFactoryResetPurge() {
        triggerConfirmationDialog(
            "PURGE SYSTEM RECORDS AND DATABASES?",
            "WARNING! You are about to initiate a structural hard factory reset. All cash records, closed days logs, credentials and sync channels will be deleted permanently.",
            () => {
                localStorage.clear();
                
                state.role = null;
                state.passcodeViewer = DEFAULT_PASS_VIEWER;
                state.passcodeAdmin = DEFAULT_PASS_ADMIN;
                state.ledgerData = [];
                state.closedDays = [];
                state.loginHistory = [];
                
                initDatabaseState();
                
                // Force layout reload back to authentication gatekeeper
                window.location.reload();
            }
        );
    }

    /**
     * Executes localized printed report page compilations
     */
    function executeReportPrintProtocol() {
        window.print();
    }

    /**
     * Converts statement metrics matching selection parameters cleanly to a CSV spreadsheet
     */
    function executeExportStatementCSV() {
        const month = DOM.reportMonthFilter.value;
        const year = DOM.reportYearFilter.value;

        const matchedEntries = state.ledgerData.filter(record => {
            if (record.date) {
                const parts = record.date.split('-');
                return parts[0] === year && parts[1] === month;
            }
            return false;
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        if (matchedEntries.length === 0) {
            alert("This statement criteria contains 0 ledger outputs. Select matching fields first.");
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        
        // Table CSV header structure
        csvContent += "S.No,Date,Day,Comp 1 Large Cash,Comp 1 Small Cash,Comp 1 Account,Comp 1 Sub Total,Comp 2 Large Cash,Comp 2 Small Cash,Comp 2 Account,Comp 2 Sub Total,Daily Grand Total,Remarks\r\n";

        matchedEntries.forEach((item, index) => {
            const c1l = parseCleanNumber(item.comp1_large);
            const c1s = parseCleanNumber(item.comp1_small);
            const c1a = parseCleanNumber(item.comp1_account);
            const c1t = c1l + c1s + c1a;

            const c2l = parseCleanNumber(item.comp2_large);
            const c2s = parseCleanNumber(item.comp2_small);
            const c2a = parseCleanNumber(item.comp2_account);
            const c2t = c2l + c2s + c2a;

            const grand = c1t + c2t;
            const rem = (item.remarks || "").replace(/,/g, " ");

            csvContent += `${index + 1},${item.date},${item.day},${c1l},${c1s},${c1a},${c1t},${c2l},${c2s},${c2a},${c2t},${grand},${rem}\r\n`;
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `JCM_Statement_${year}_${month}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        writeFootprintLog(`Exported transaction monthly CSV report for period ${month}/${year}`, 'admin');
    }

    /**
     * Closes operations on the current Date, archiving and locking matching entries
     */
    function executeDayClosingProtocol() {
        if (state.role !== 'admin') return;

        const dateToClose = getFormattedDateISO();

        if (state.closedDays.includes(dateToClose)) {
            // Already sealed, so admin protocol will toggle to reopen it
            triggerConfirmationDialog(
                "REOPEN SEED LEDGER ENTRIES?",
                `Do you want to REOPEN the sealed ledger entries registered for date: ${dateToClose}? This enables modification permissions.`,
                () => {
                    state.closedDays = state.closedDays.filter(d => d !== dateToClose);
                    localStorage.setItem('jcm_closed_days', JSON.stringify(state.closedDays));
                    
                    state.ledgerData.forEach(item => {
                        if (item.date === dateToClose) {
                            item.locked = false;
                        }
                    });

                    commitLedgerToDatabase();
                    renderLedgerTable();
                    writeFootprintLog(`Reopened ledger database operations for closed date: ${dateToClose}`, 'admin');
                    alert(`Date ledger balance sheets for ${dateToClose} are now unlocked.`);
                }
            );
        } else {
            // Close operations
            triggerConfirmationDialog(
                "EXECUTE DAILY CLOSING PROTOCOL?",
                `Warning! Sealing operations for date: ${dateToClose} prevents standard editing modules from writing changes unless authorized administrators reopen ledger registers. Do you want to proceed?`,
                () => {
                    state.closedDays.push(dateToClose);
                    localStorage.setItem('jcm_closed_days', JSON.stringify(state.closedDays));
                    
                    state.ledgerData.forEach(item => {
                        if (item.date === dateToClose) {
                            item.locked = true;
                        }
                    });

                    commitLedgerToDatabase();
                    renderLedgerTable();
                    writeFootprintLog(`Locked and sealed daily operations register for date: ${dateToClose}`, 'admin');
                    alert(`Daily closing protocol finalized. Balance sheets for ${dateToClose} are now locked.`);
                }
            );
        }
    }

    // ==========================================
    // SYSTEM INITIALIZATION & EVENTS BINDING
    // ==========================================

    /**
     * Binds general system layout elements and interaction events
     */
    function bindInterfaceCoreEvents() {
        // --- 1. System Login Auth Triggers ---
        DOM.btnAuthenticate.addEventListener('click', () => {
            const pass = DOM.passcodeInput.value;
            if (pass === state.passcodeAdmin) {
                state.role = 'admin';
                DOM.gatekeeperOverlay.classList.add('hide');
                DOM.appContainer.classList.remove('hide');
                writeFootprintLog("Logged into secure management portal", 'admin');
                applyRoleAccessPermissions();
                renderLedgerTable();
            } else if (pass === state.passcodeViewer) {
                state.role = 'viewer';
                DOM.gatekeeperOverlay.classList.add('hide');
                DOM.appContainer.classList.remove('hide');
                writeFootprintLog("Logged into secure management portal", 'viewer');
                applyRoleAccessPermissions();
                renderLedgerTable();
            } else {
                DOM.gatekeeperError.classList.remove('hide');
                DOM.passcodeInput.value = '';
                DOM.passcodeInput.focus();
            }
        });

        DOM.passcodeInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                DOM.btnAuthenticate.click();
            }
        });

        DOM.toggleGatekeeperPasscode.addEventListener('click', () => {
            const type = DOM.passcodeInput.getAttribute('type') === 'password' ? 'text' : 'password';
            DOM.passcodeInput.setAttribute('type', type);
            DOM.toggleGatekeeperPasscode.querySelector('i').classList.toggle('fa-eye');
            DOM.toggleGatekeeperPasscode.querySelector('i').classList.toggle('fa-eye-slash');
        });

        // --- 2. Perm elevate Modal verification actions ---
        DOM.btnModalVerify.addEventListener('click', () => {
            const pass = DOM.modalPasscodeField.value;
            if (attemptElevateToAdmin(pass)) {
                DOM.passcodeModal.classList.add('hide');
                switchActiveTabPanel('tab-admin');
            } else {
                DOM.modalErrorText.classList.remove('hide');
                DOM.modalPasscodeField.value = '';
                DOM.modalPasscodeField.focus();
            }
        });

        DOM.modalPasscodeField.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') DOM.btnModalVerify.click();
        });

        document.querySelectorAll('.modal-dismiss-trigger').forEach(btn => {
            btn.addEventListener('click', () => {
                DOM.passcodeModal.classList.add('hide');
                DOM.confirmModal.classList.add('hide');
            });
        });

        DOM.btnConfirmAction.addEventListener('click', () => {
            if (confirmationCallback) {
                confirmationCallback();
                confirmationCallback = null;
            }
            DOM.confirmModal.classList.add('hide');
        });

        // Lock Edit Immediate Action
        DOM.btnLockEdit.addEventListener('click', () => {
            lockDownSessionToViewer();
        });

        // Theme switch execution
        DOM.btnThemeToggle.addEventListener('click', () => {
            if (document.body.classList.contains('light-mode')) {
                document.body.className = 'dark-mode';
                state.theme = 'dark-mode';
                DOM.btnThemeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
            } else {
                document.body.className = 'light-mode';
                state.theme = 'light-mode';
                DOM.btnThemeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
            }
            localStorage.setItem('jcm_theme', state.theme);
        });

        // Logout Session trigger
        DOM.btnLogout.addEventListener('click', () => {
            triggerConfirmationDialog(
                "Sign Out System?",
                "Are you sure you want to terminate your secure cash management portal session?",
                () => {
                    writeFootprintLog("Terminated session. Sign out", state.role);
                    state.role = null;
                    DOM.passcodeInput.value = '';
                    DOM.gatekeeperOverlay.classList.remove('hide');
                    DOM.appContainer.classList.add('hide');
                }
            );
        });

        // --- 3. Navigation link mapping selectors ---
        DOM.navTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const dest = tab.getAttribute('data-target');
                switchActiveTabPanel(dest);
            });
        });

        // --- 4. Ledger row filtration configurations ---
        const executeFilterQuery = () => {
            state.filters.date = DOM.searchDateFilter.value;
            state.filters.month = DOM.searchMonthFilter.value;
            state.filters.year = DOM.searchYearFilter.value;
            renderLedgerTable();
        };

        DOM.searchDateFilter.addEventListener('change', () => {
            // Clear month filter when specific date is defined to prevent calculation overrides
            if (DOM.searchDateFilter.value) {
                DOM.searchMonthFilter.value = '';
            }
            executeFilterQuery();
        });
        
        DOM.searchMonthFilter.addEventListener('change', executeFilterQuery);
        DOM.searchYearFilter.addEventListener('change', executeFilterQuery);

        DOM.btnClearFilters.addEventListener('click', () => {
            DOM.searchDateFilter.value = '';
            DOM.searchMonthFilter.value = '';
            DOM.searchYearFilter.value = '2026';
            executeFilterQuery();
        });

        DOM.btnAddEntry.addEventListener('click', executeInsertNewLedgerRow);

        // --- 5. Report view configuration filters ---
        DOM.reportMonthFilter.addEventListener('change', generateCurrentReportStatement);
        DOM.reportYearFilter.addEventListener('change', generateCurrentReportStatement);
        DOM.btnPrintReport.addEventListener('click', executeReportPrintProtocol);
        DOM.btnExportCsv.addEventListener('click', executeExportStatementCSV);

        // --- 6. Administrators secure settings modifications ---
        DOM.btnUpdatePasscodes.addEventListener('click', () => {
            const vPass = DOM.adminViewerPasscode.value.trim();
            const aPass = DOM.adminAdminPasscode.value.trim();

            if (vPass.length < 4 || aPass.length < 4) {
                alert("Credentials must contain at least 4 alphanumeric characters.");
                return;
            }

            triggerConfirmationDialog(
                "Update Secure Credentials?",
                "Are you sure you want to modify system login credentials?",
                () => {
                    state.passcodeViewer = vPass;
                    state.passcodeAdmin = aPass;
                    localStorage.setItem('jcm_passcode_viewer', vPass);
                    localStorage.setItem('jcm_passcode_admin', aPass);
                    
                    writeFootprintLog("Modified administrative gateway credentials", 'admin');
                    alert("Gateway access credentials updated successfully.");
                }
            );
        });

        document.querySelectorAll('.btn-pwd-reveal').forEach(btn => {
            btn.addEventListener('click', () => {
                const fieldId = btn.getAttribute('data-target');
                const field = document.getElementById(fieldId);
                const type = field.getAttribute('type') === 'password' ? 'text' : 'password';
                field.setAttribute('type', type);
                btn.querySelector('i').classList.toggle('fa-eye');
                btn.querySelector('i').classList.toggle('fa-eye-slash');
            });
        });

        DOM.btnBackupLocal.addEventListener('click', executeLocalDataBackupDownload);
        DOM.btnTriggerRestore.addEventListener('click', () => DOM.fileRestoreInput.click());
        DOM.fileRestoreInput.addEventListener('change', handleBackupFileRestore);
        DOM.btnFactoryReset.addEventListener('click', executeFactoryResetPurge);
        DOM.btnCloseDay.addEventListener('click', executeDayClosingProtocol);
        
        DOM.btnClearHistory.addEventListener('click', () => {
            triggerConfirmationDialog(
                "Purge Security Logs history?",
                "Are you sure you want to clear the logs history?",
                () => {
                    state.loginHistory = [];
                    localStorage.removeItem('jcm_login_history');
                    renderLoginTraceLogs();
                }
            );
        });

        // Network connection listener checks
        window.addEventListener('online', () => {
            DOM.networkStatusText.innerText = "Cloud Sync Online";
            DOM.networkStatusBar.querySelector('.status-dot').className = 'status-dot online';
        });
        window.addEventListener('offline', () => {
            DOM.networkStatusText.innerText = "Offline Mode Active";
            DOM.networkStatusBar.querySelector('.status-dot').className = 'status-dot offline';
        });
    }

    /**
     * Initializes structural live chronometers
     */
    function launchRealTimeChronometer() {
        const updateClock = () => {
            DOM.liveTime.innerText = getCurrentFormattedTime();
            DOM.liveDate.innerText = getCurrentFormattedDate();
        };
        updateClock();
        setInterval(updateClock, 1000);
    }

    /**
     * Interrogates the configuration parameters of firebase.js wrapper
     */
    function verifyFirebaseCloudPresence() {
        if (window.FirebaseEngine) {
            window.FirebaseEngine.initialize(function (success) {
                if (success) {
                    DOM.firestoreEngineStatus.innerText = "Connected & Active";
                    DOM.firestoreEngineStatus.className = "badge badge-admin";
                    
                    // Attempt real-time data fetch from Cloud Segment
                    window.FirebaseEngine.pullLedgerFromCloud(function (cloudData) {
                        if (cloudData && cloudData.length > 0) {
                            state.ledgerData = cloudData;
                            localStorage.setItem('jcm_ledger_data', JSON.stringify(cloudData));
                            recalculateAllSystemAggregates();
                            renderLedgerTable();
                        }
                    });
                } else {
                    DOM.firestoreEngineStatus.innerText = "Unconfigured / Local Only";
                    DOM.firestoreEngineStatus.className = "badge badge-viewer";
                }
            });
        }
    }

    // ==========================================
    // MODULE LOAD ENTRY POINT
    // ==========================================
    document.addEventListener('DOMContentLoaded', () => {
        initDatabaseState();
        bindInterfaceCoreEvents();
        launchRealTimeChronometer();
        recalculateAllSystemAggregates();
        renderLoginTraceLogs();
        
        // Initializing matching Month option according to current Month
        const currentMonthIdx = String(new Date().getMonth() + 1).padStart(2, '0');
        DOM.reportMonthFilter.value = currentMonthIdx;
        generateCurrentReportStatement();

        // Check Firebase Integration
        verifyFirebaseCloudPresence();
    });

})();