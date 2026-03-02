/**
 * storage.js - Auto save to localStorage and backend sync
 */

const LS_KEY = 'mandala_project';
const LS_CURRENT_ID = 'mandala_current_id';
const DEBOUNCE_MS = 2000;
const BACKEND_SYNC_MS = 15000;

let debounceTimer = null;
let backendTimer = null;
let _api = null;
let _onSaved = null;

export function initStorage(api, onSaved) {
    _api = api;
    _onSaved = onSaved;
}

/**
 * Save to localStorage immediately
 */
export function saveLocal(state) {
    try {
        localStorage.setItem(LS_KEY, JSON.stringify(state));
        localStorage.setItem(LS_CURRENT_ID, state.id);
    } catch (e) {
        console.warn('localStorage save failed:', e);
    }
}

/**
 * Load from localStorage
 */
export function loadLocal() {
    try {
        const raw = localStorage.getItem(LS_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Debounced auto-save (localStorage + backend)
 */
export function autoSave(state) {
    saveLocal(state);

    // Debounce backend sync
    clearTimeout(backendTimer);
    backendTimer = setTimeout(async () => {
        if (_api && state.id) {
            try {
                await _api.updateProject(state.id, { name: state.name, data: state });
                if (_onSaved) _onSaved();
            } catch (e) {
                console.warn('Backend sync failed:', e);
            }
        }
    }, BACKEND_SYNC_MS);
}

/**
 * Trigger auto-save after debounce delay
 */
export function triggerAutoSave(state) {
    saveLocal(state);
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => autoSave(state), DEBOUNCE_MS);
}

export function clearStorage() {
    localStorage.removeItem(LS_KEY);
    localStorage.removeItem(LS_CURRENT_ID);
}
