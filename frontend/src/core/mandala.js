/**
 * mandala.js - Core grid logic and state management
 */

import { v4 as uuidv4 } from './uuid.js';

// 8 positions around center (excluding position 4 = center)
export const SURROUNDING = [0, 1, 2, 3, 5, 6, 7, 8];

// Map block index to color accent class
export const ACCENT_COLORS = [
    '#f78166', // 0 - red
    '#ff9f43', // 1 - orange
    '#ffd166', // 2 - yellow
    '#06d6a0', // 3 - green
    null,      // 4 - center (main goal)
    '#a78bfa', // 5 - purple
    '#ec4899', // 6 - pink
    '#67e8f9', // 7 - cyan
    '#58a6ff', // 8 - blue
];

function createCell(id, label = '', parentId = null) {
    return {
        id,
        label,
        parentId,
        children: {}
    };
}

function createDefaultState(name = 'Untitled') {
    const rootId = 'root';
    const state = {
        id: uuidv4(),
        name,
        currentView: rootId,
        navStack: [rootId],
        cells: {}
    };

    // Root cell
    state.cells[rootId] = createCell(rootId, '', null);

    // 8 children of root
    SURROUNDING.forEach(pos => {
        const childId = `${rootId}-${pos}`;
        state.cells[rootId].children[pos] = createCell(childId, '', rootId);
        state.cells[childId] = state.cells[rootId].children[pos];

        // 8 grandchildren per child
        SURROUNDING.forEach(subPos => {
            const gcId = `${childId}-${subPos}`;
            state.cells[childId].children[subPos] = createCell(gcId, '', childId);
            state.cells[gcId] = state.cells[childId].children[subPos];
        });
    });

    return state;
}

export class MandalaState {
    constructor(initialState = null) {
        this._state = initialState || createDefaultState();
    }

    getState() {
        return this._state;
    }

    setState(newState) {
        this._state = newState;
    }

    // Deep clone state
    clone() {
        return JSON.parse(JSON.stringify(this._state));
    }

    get currentViewId() {
        return this._state.currentView;
    }

    get navStack() {
        return this._state.navStack;
    }

    get name() {
        return this._state.name;
    }

    set name(val) {
        this._state.name = val;
    }

    getCell(id) {
        return this._state.cells[id] || null;
    }

    getRootViewCell() {
        return this._state.cells[this._state.currentView];
    }

    /**
     * Update cell label
     */
    updateCellLabel(cellId, label) {
        if (this._state.cells[cellId]) {
            this._state.cells[cellId].label = label;
        }
    }

    /**
     * Navigate into a sub-goal (double click)
     */
    navigateTo(cellId) {
        if (!this._state.cells[cellId]) return false;
        this._state.currentView = cellId;
        if (!this._state.navStack.includes(cellId)) {
            this._state.navStack.push(cellId);
        } else {
            // Trim stack to this point
            const idx = this._state.navStack.indexOf(cellId);
            this._state.navStack = this._state.navStack.slice(0, idx + 1);
        }
        return true;
    }

    /**
     * Navigate to root
     */
    navigateToRoot() {
        this._state.currentView = 'root';
        this._state.navStack = ['root'];
    }

    /**
     * Check if current view is root
     */
    isAtRoot() {
        return this._state.currentView === 'root';
    }

    /**
     * Get children of current view cell
     */
    getCurrentChildren() {
        const cell = this.getRootViewCell();
        return cell ? cell.children : {};
    }

    /**
     * Get grandchildren of a specific child
     */
    getChildChildren(childPos) {
        const child = this.getCurrentChildren()[childPos];
        return child ? child.children : {};
    }

    /**
     * Fill pillars (8 sub-goals from AI)
     */
    fillPillars(labels) {
        if (!Array.isArray(labels)) return;
        const viewCell = this.getRootViewCell();
        if (!viewCell) return;
        SURROUNDING.forEach((pos, i) => {
            if (labels[i] !== undefined && viewCell.children[pos]) {
                viewCell.children[pos].label = labels[i] || '';
                this._state.cells[viewCell.children[pos].id].label = labels[i] || '';
            }
        });
    }

    /**
     * Fill breakdown (8 actions for a sub-goal from AI)
     */
    fillBreakdown(parentPos, labels) {
        if (!Array.isArray(labels)) return;
        const viewCell = this.getRootViewCell();
        if (!viewCell) return;
        const child = viewCell.children[parentPos];
        if (!child) return;
        SURROUNDING.forEach((pos, i) => {
            if (labels[i] !== undefined && child.children[pos]) {
                child.children[pos].label = labels[i] || '';
                this._state.cells[child.children[pos].id].label = labels[i] || '';
            }
        });
    }

    /**
     * Serialize full state for save
     */
    toJSON() {
        return this.clone();
    }

    /**
     * Load from JSON
     */
    static fromJSON(data) {
        const state = new MandalaState(data);
        return state;
    }

    /**
     * Load a template
     */
    loadTemplate(template) {
        const fresh = createDefaultState(template.name);
        const rootCell = fresh.cells['root'];
        rootCell.label = template.mainGoal;

        SURROUNDING.forEach((pos, i) => {
            const subLabel = template.pillars[i] || '';
            const child = rootCell.children[pos];
            if (child) {
                child.label = subLabel;
                fresh.cells[child.id].label = subLabel;
            }
        });

        this._state = { ...fresh, id: this._state.id };
        this._state.navStack = ['root'];
        this._state.currentView = 'root';
    }
}

export { createDefaultState };
