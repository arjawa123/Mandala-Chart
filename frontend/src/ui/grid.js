/**
 * grid.js - Mandala 9x9 grid DOM renderer (redesigned)
 */

import { ACCENT_COLORS } from '../core/mandala.js';

const gridContainer = document.getElementById('grid-container');

// Block color names mapped to CSS vars
const BLOCK_COLOR_NAMES = ['c0', 'c1', 'c2', 'c3', null, 'c5', 'c6', 'c7', 'c8'];

let _selectedCellId = null;
let _focusedBlock = null;
let _onCellEdit = null;
let _onCellDblClick = null;
let _onCellFocus = null;

export function initGrid({ onCellEdit, onCellDblClick, onCellFocus }) {
    _onCellEdit = onCellEdit;
    _onCellDblClick = onCellDblClick;
    _onCellFocus = onCellFocus;
}

export function setSelectedCell(id) { _selectedCellId = id; }
export function getSelectedCell() { return _selectedCellId; }

export function renderGrid(mandala) {
    gridContainer.innerHTML = '';

    const viewCell = mandala.getRootViewCell();
    if (!viewCell) return;

    const mainLabel = viewCell.label || '';
    const children = viewCell.children || {};

    const grid = document.createElement('div');
    grid.className = 'mandala-grid';

    for (let row = 0; row < 9; row++) {
        for (let col = 0; col < 9; col++) {
            const blkRow = Math.floor(row / 3);
            const blkCol = Math.floor(col / 3);
            const blkIdx = blkRow * 3 + blkCol;
            const cellInBlk = (row % 3) * 3 + (col % 3);
            const isMainCenter = blkIdx === 4 && cellInBlk === 4;
            const isBlkCenter = cellInBlk === 4;
            const isMainBlock = blkIdx === 4;
            const accentColor = ACCENT_COLORS[blkIdx];
            const child = children[blkIdx];
            const grandChild = child?.children?.[cellInBlk];

            let cellId = null, label = '', canNavigate = false;

            if (isMainBlock) {
                if (isMainCenter) {
                    cellId = viewCell.id;
                    label = mainLabel;
                } else {
                    const sibChild = children[cellInBlk];
                    cellId = sibChild?.id || null;
                    label = sibChild?.label || '';
                    canNavigate = !!sibChild;
                }
            } else {
                if (isBlkCenter) {
                    cellId = child?.id || null;
                    label = child?.label || '';
                    canNavigate = !!child;
                } else {
                    cellId = grandChild?.id || null;
                    label = grandChild?.label || '';
                }
            }

            const cell = document.createElement('div');
            cell.className = 'mc';
            cell.dataset.cellId = cellId || '';
            cell.dataset.blkIdx = blkIdx;
            cell.dataset.cellInBlk = cellInBlk;

            // Block background using CSS vars
            if (!isMainBlock) {
                const cn = BLOCK_COLOR_NAMES[blkIdx];
                if (cn) cell.style.background = `var(--${cn}-soft)`;
            } else if (isMainCenter) {
                // handled by .center-main
            }

            // Block separators (visual gap between 3x3 blocks)
            if (col === 2 || col === 5) cell.classList.add('blk-sep-right');
            if (row === 2 || row === 5) cell.classList.add('blk-sep-bottom');

            if (isMainCenter) cell.classList.add('center-main');
            else if (isBlkCenter) {
                cell.classList.add('center-sub');
                if (accentColor) {
                    cell.style.background = 'var(--bg-cell-center)';
                    cell.style.border = `2px solid ${accentColor}`;
                }
            }

            if (_selectedCellId && cellId === _selectedCellId) cell.classList.add('selected');
            if (_focusedBlock !== null && blkIdx !== _focusedBlock && blkIdx !== 4) cell.classList.add('dimmed');

            // Text
            const textEl = document.createElement('div');
            textEl.className = 'mc-text';
            if (label) {
                textEl.textContent = label;
            } else {
                const ph = document.createElement('span');
                ph.className = 'mc-placeholder';
                ph.textContent = isMainCenter ? 'Tujuan Utama' : (isBlkCenter ? 'Sub Tujuan' : '');
                textEl.appendChild(ph);
            }
            cell.appendChild(textEl);

            // Events
            let clickTimer = null;
            cell.addEventListener('click', (e) => {
                e.stopPropagation();
                clearTimeout(clickTimer);
                clickTimer = setTimeout(() => {
                    if (!cellId) return;
                    _selectedCellId = cellId;
                    if (_onCellFocus) _onCellFocus(cellId, label, blkIdx);
                    startEdit(cell, textEl, cellId, label, isMainCenter, isBlkCenter);
                }, 180);
            });
            cell.addEventListener('dblclick', (e) => {
                e.stopPropagation();
                clearTimeout(clickTimer);
                if (!canNavigate && !isMainCenter) return;
                if (!cellId) return;
                stopAllEdits(grid);
                if (_onCellDblClick) _onCellDblClick(cellId, blkIdx);
            });

            grid.appendChild(cell);
        }
    }

    gridContainer.appendChild(grid);
}

function startEdit(cell, textEl, cellId, currentLabel, isMainCenter, isBlkCenter) {
    stopAllEdits(cell.closest('.mandala-grid'));
    textEl.style.visibility = 'hidden';

    const input = document.createElement('textarea');
    input.className = 'mc-input';
    input.value = currentLabel;
    input.placeholder = isMainCenter ? 'Masukkan tujuan utama...' : (isBlkCenter ? 'Sub tujuan...' : 'Tindakan...');
    input.maxLength = 120;
    if (isMainCenter) { input.style.fontWeight = '700'; input.style.fontSize = '11px'; }

    cell.appendChild(input);
    input.focus();
    input.select();

    const finish = () => {
        const val = input.value.trim();
        input.remove();
        textEl.style.visibility = '';
        textEl.innerHTML = '';
        if (val) {
            textEl.textContent = val;
        } else {
            const ph = document.createElement('span');
            ph.className = 'mc-placeholder';
            ph.textContent = isMainCenter ? 'Tujuan Utama' : (isBlkCenter ? 'Sub Tujuan' : '');
            textEl.appendChild(ph);
        }
        if (val !== currentLabel && _onCellEdit) _onCellEdit(cellId, val);
    };

    input.addEventListener('blur', finish);
    input.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') { input.value = currentLabel; input.blur(); }
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); input.blur(); }
    });
}

export function stopAllEdits(container) {
    container?.querySelectorAll('.mc-input').forEach(inp => inp.blur());
}

export function setFocusMode(blockIdx) {
    if (_focusedBlock === blockIdx) {
        _focusedBlock = null;
    } else {
        _focusedBlock = blockIdx;
    }
    gridContainer.querySelectorAll('.mc').forEach(cell => {
        const blk = parseInt(cell.dataset.blkIdx);
        if (_focusedBlock === null) {
            cell.classList.remove('dimmed');
        } else if (blk !== _focusedBlock && blk !== 4) {
            cell.classList.add('dimmed');
        } else {
            cell.classList.remove('dimmed');
        }
    });
    return _focusedBlock;
}
