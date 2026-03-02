/**
 * history.js - Undo/Redo stack
 * Stores immutable JSON snapshots of MandalaState
 */

const MAX_HISTORY = 50;

export class History {
    constructor() {
        this._past = [];
        this._future = [];
    }

    /**
     * Push current state snapshot before making a change
     */
    push(snapshot) {
        this._past.push(JSON.stringify(snapshot));
        if (this._past.length > MAX_HISTORY) {
            this._past.shift();
        }
        this._future = []; // Clear redo on new action
    }

    /**
     * Undo: return previous snapshot
     */
    undo(currentSnapshot) {
        if (this._past.length === 0) return null;
        this._future.push(JSON.stringify(currentSnapshot));
        return JSON.parse(this._past.pop());
    }

    /**
     * Redo: return next snapshot
     */
    redo(currentSnapshot) {
        if (this._future.length === 0) return null;
        this._past.push(JSON.stringify(currentSnapshot));
        return JSON.parse(this._future.pop());
    }

    canUndo() {
        return this._past.length > 0;
    }

    canRedo() {
        return this._future.length > 0;
    }

    clear() {
        this._past = [];
        this._future = [];
    }
}
