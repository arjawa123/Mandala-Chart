/**
 * main.js - Application entry point (redesigned for light UI)
 */

import { MandalaState } from './core/mandala.js';
import { History } from './core/history.js';
import { initStorage, triggerAutoSave, saveLocal, loadLocal } from './core/storage.js';
import { api } from './services/api.js';
import { renderGrid, initGrid, stopAllEdits, setFocusMode } from './ui/grid.js';
import { renderBreadcrumb } from './ui/breadcrumb.js';
import { showToast } from './ui/toast.js';
import { TEMPLATES } from './templates/presets.js';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';

// ─── State ────────────────────────────────────────────────
let mandala = new MandalaState();
const history = new History();
let currentProjectId = null;
let selectedCellId = null;
let selectedBlkIdx = null;
let isAiPanelOpen = true;
let isFocusMode = false;

// ─── Zoom / Pan ───────────────────────────────────────────
let scale = 1, panX = 0, panY = 0;
let isPanning = false;
let panStartX = 0, panStartY = 0, panOriginX = 0, panOriginY = 0;

const gridContainer = document.getElementById('grid-container');
const canvasWrap = document.getElementById('canvas-wrap');
const zoomLabel = document.getElementById('zoom-label');

function applyTransform() {
    gridContainer.style.transform = `translate(${panX}px,${panY}px) scale(${scale})`;
    zoomLabel.textContent = `${Math.round(scale * 100)}%`;
}

function zoomBy(delta) {
    scale = Math.min(2.5, Math.max(0.3, scale + delta));
    applyTransform();
}

document.getElementById('btn-zoom-in').addEventListener('click', () => zoomBy(0.12));
document.getElementById('btn-zoom-out').addEventListener('click', () => zoomBy(-0.12));
document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    scale = 1; panX = 0; panY = 0; applyTransform();
});

// Pan & Zoom: pointer/touch on canvasWrap

// --- Pinch-to-zoom & Mobile Pan Logic ---
let initialPinchDistance = null;
let initialScale = 1;

// Mencegah pull-to-refresh & browser scrolling default saat menggunakan area canvas
canvasWrap.style.touchAction = 'none';

canvasWrap.addEventListener('pointerdown', (e) => {
    // Only handle 1 finger/pointer pan if not pinching
    const inner = document.getElementById('canvas-inner');
    if ((e.pointerType === 'mouse' && e.button !== 1 && e.target !== canvasWrap && e.target !== inner) && !e.target.closest('#canvas-inner')) {
        // if clicking a cell with mouse left click, don't pan 
    } else if (e.target === canvasWrap || e.target === inner || e.button === 1) {
        if (!initialPinchDistance) {
            isPanning = true;
            panStartX = e.clientX;
            panStartY = e.clientY;
            panOriginX = panX;
            panOriginY = panY;
            canvasWrap.style.cursor = 'grabbing';
            canvasWrap.setPointerCapture(e.pointerId);
        }
    }
});

window.addEventListener('pointermove', (e) => {
    if (!isPanning || initialPinchDistance) return;
    panX = panOriginX + (e.clientX - panStartX);
    panY = panOriginY + (e.clientY - panStartY);
    applyTransform();
});

window.addEventListener('pointerup', (e) => {
    if (isPanning) {
        isPanning = false;
        canvasWrap.style.cursor = 'default';
        try { canvasWrap.releasePointerCapture(e.pointerId); } catch (ex) { }
    }
});

// Touch native untuk fitur Pinch-to-Zoom dengan dua jari
canvasWrap.addEventListener('touchstart', (e) => {
    if (e.touches.length === 2) {
        isPanning = false; // Batalkan 1-finger pan kalau sedang pinch
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        initialPinchDistance = Math.hypot(dx, dy);
        initialScale = scale;
    }
}, { passive: false });

canvasWrap.addEventListener('touchmove', (e) => {
    if (e.touches.length === 2 && initialPinchDistance) {
        e.preventDefault(); // Mencegah scrolling browser (Safari/Chrome Mobile)
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const currentDistance = Math.hypot(dx, dy);

        let newScale = initialScale * (currentDistance / initialPinchDistance);
        // Batas zoom: terkecil 0.15 (zoom out), paling besar 3x
        scale = Math.min(Math.max(0.15, newScale), 3);
        applyTransform();
    }
}, { passive: false });

canvasWrap.addEventListener('touchend', (e) => {
    if (e.touches.length < 2) {
        initialPinchDistance = null;
    }
});

canvasWrap.addEventListener('wheel', (e) => {
    e.preventDefault();
    zoomBy(e.deltaY < 0 ? 0.08 : -0.08);
}, { passive: false });

// ─── Grid Events ──────────────────────────────────────────
initGrid({
    onCellEdit: (cellId, newLabel) => {
        history.push(mandala.clone());
        mandala.updateCellLabel(cellId, newLabel);
        updateUndoRedo();
        triggerAutoSave(mandala.toJSON());
        // Update breadcrumb if this was a nav cell
        doRefreshBreadcrumb();
    },
    onCellDblClick: (cellId, blkIdx) => {
        if (cellId === mandala.currentViewId) return;
        const cell = mandala.getCell(cellId);
        if (!cell || !Object.keys(cell.children || {}).length) return;
        mandala.navigateTo(cellId);
        isFocusMode = false;
        document.getElementById('btn-focus').classList.remove('hbtn-primary');
        refresh();
    },
    onCellFocus: (cellId, label, blkIdx) => {
        selectedCellId = cellId;
        selectedBlkIdx = blkIdx;
        updateAiContext(label);
    }
});

// ─── Render ───────────────────────────────────────────────
function refresh() {
    renderGrid(mandala);
    doRefreshBreadcrumb();
    updateUndoRedo();
    updateAiContext(selectedCellId ? mandala.getCell(selectedCellId)?.label : null);
}

function doRefreshBreadcrumb() {
    renderBreadcrumb(
        mandala.navStack,
        (id) => mandala.getCell(id)?.label || '',
        (cellId, index) => {
            const stack = mandala.navStack.slice(0, index + 1);
            mandala.getState().currentView = cellId;
            mandala.getState().navStack = stack;
            isFocusMode = false;
            refresh();
        }
    );
}

// ─── Toolbar ──────────────────────────────────────────────
const projectNameEl = document.getElementById('project-name');
projectNameEl.addEventListener('input', () => {
    mandala.name = projectNameEl.value;
    triggerAutoSave(mandala.toJSON());
});

// New
document.getElementById('btn-new').addEventListener('click', () => {
    saveLocal(mandala.toJSON());
    mandala = new MandalaState();
    history.clear();
    currentProjectId = null;
    projectNameEl.value = '';
    selectedCellId = null; selectedBlkIdx = null;
    scale = 1; panX = 0; panY = 0; applyTransform();
    refresh();
    showToast('Proyek baru dibuat', 'info');
});

// Save
document.getElementById('btn-save').addEventListener('click', () => saveToBackend());

async function saveToBackend() {
    try {
        const state = mandala.toJSON();
        if (!currentProjectId) {
            const res = await api.createProject(state.name || 'Proyek Tanpa Nama', state);
            currentProjectId = res.project.id;
            mandala.getState().id = currentProjectId;
            saveLocal(mandala.toJSON());
        } else {
            await api.updateProject(currentProjectId, { name: state.name, data: state });
        }
        showToast('Tersimpan', 'success');
    } catch (err) {
        showToast(`Gagal menyimpan: ${err.message}`, 'error');
    }
}

// Open
document.getElementById('btn-open').addEventListener('click', async () => {
    const modal = document.getElementById('projects-modal');
    const listEl = document.getElementById('projects-list');
    modal.classList.remove('hidden');
    listEl.innerHTML = '<p style="font-size:12px;color:var(--text-muted)">Memuat...</p>';
    try {
        const res = await api.getProjects();
        listEl.innerHTML = '';
        if (!res.projects.length) {
            listEl.innerHTML = '<p style="font-size:12px;color:var(--text-muted);font-style:italic">Tidak ada proyek yang tersimpan.</p>';
            return;
        }
        res.projects.forEach(p => {
            const row = document.createElement('div');
            row.className = 'project-row';
            row.innerHTML = `
                <div>
                    <div class="project-row-name">${p.name || 'Proyek Tanpa Nama'}</div>
                    <div class="project-row-date">${new Date(p.updated_at).toLocaleString()}</div>
                </div>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2"><polyline points="9 18 15 12 9 6"/></svg>
            `;
            row.addEventListener('click', async () => {
                try {
                    const pr = await api.getProject(p.id);
                    mandala = MandalaState.fromJSON(pr.project.data);
                    currentProjectId = p.id;
                    projectNameEl.value = pr.project.name || '';
                    history.clear();
                    scale = 1; panX = 0; panY = 0; applyTransform();
                    refresh();
                    modal.classList.add('hidden');
                    showToast('Proyek dimuat', 'success');
                } catch (err) {
                    showToast(`Gagal memuat: ${err.message}`, 'error');
                }
            });
            listEl.appendChild(row);
        });
    } catch (err) {
        listEl.innerHTML = `<p style="font-size:12px;color:#ef4444">Error: ${err.message}</p>`;
    }
});

document.getElementById('projects-modal-close').addEventListener('click', () => {
    document.getElementById('projects-modal').classList.add('hidden');
});

// ─── Undo / Redo ──────────────────────────────────────────
document.getElementById('btn-undo').addEventListener('click', doUndo);
document.getElementById('btn-redo').addEventListener('click', doRedo);

function doUndo() {
    const prev = history.undo(mandala.clone());
    if (prev) { mandala = MandalaState.fromJSON(prev); refresh(); triggerAutoSave(mandala.toJSON()); }
    else showToast('Tidak ada yang bisa di-undo', 'info');
}
function doRedo() {
    const next = history.redo(mandala.clone());
    if (next) { mandala = MandalaState.fromJSON(next); refresh(); triggerAutoSave(mandala.toJSON()); }
    else showToast('Tidak ada yang bisa di-redo', 'info');
}
function updateUndoRedo() {
    document.getElementById('btn-undo').disabled = !history.canUndo();
    document.getElementById('btn-redo').disabled = !history.canRedo();
}

window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') { e.preventDefault(); doUndo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') { e.preventDefault(); doRedo(); }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); saveToBackend(); }
});

// ─── Focus Mode ───────────────────────────────────────────
const btnFocus = document.getElementById('btn-focus');
btnFocus.addEventListener('click', () => {
    if (!isFocusMode) {
        if (selectedBlkIdx === null || selectedBlkIdx === 4) {
            showToast('Pilih salah satu sub-tujuan terlebih dahulu', 'info');
            return;
        }
        isFocusMode = true;
        setFocusMode(selectedBlkIdx);
        btnFocus.classList.add('hbtn-primary');
    } else {
        isFocusMode = false;
        setFocusMode(null);
        btnFocus.classList.remove('hbtn-primary');
    }
});

// ─── Templates ────────────────────────────────────────────
document.getElementById('btn-template').addEventListener('click', () => {
    const modal = document.getElementById('template-modal');
    const listEl = document.getElementById('template-list');
    listEl.innerHTML = '';
    TEMPLATES.forEach(tpl => {
        const card = document.createElement('div');
        card.className = 'template-card';
        card.innerHTML = `
            <div class="template-card-title">${tpl.name}</div>
            <div class="template-card-goal">${tpl.mainGoal}</div>
            <div class="template-card-pillars">${tpl.pillars.slice(0, 4).join(' · ')}...</div>
        `;
        card.addEventListener('click', () => {
            history.push(mandala.clone());
            mandala.loadTemplate(tpl);
            projectNameEl.value = tpl.name;
            mandala.name = tpl.name;
            scale = 1; panX = 0; panY = 0; applyTransform();
            refresh();
            modal.classList.add('hidden');
            showToast(`Template "${tpl.name}" dimuat`, 'success');
            triggerAutoSave(mandala.toJSON());
        });
        listEl.appendChild(card);
    });
    modal.classList.remove('hidden');
});

document.getElementById('template-modal-close').addEventListener('click', () => {
    document.getElementById('template-modal').classList.add('hidden');
});

// Close modals on backdrop click
['template-modal', 'projects-modal', 'ai-result-modal'].forEach(id => {
    const el = document.getElementById(id);
    el.addEventListener('click', (e) => { if (e.target === el) el.classList.add('hidden'); });
});

// ─── AI Panel ─────────────────────────────────────────────
const aiPanel = document.getElementById('ai-panel');
const btnAiToggle = document.getElementById('btn-ai-toggle');

// Dragging Logic for Mobile Bottom Sheet (Menggunakan transform Y agar 60fps)
let startY = 0;
let isDragging = false;
let currentTranslateY = 0;
let panelHeight = 0;

// Determine if we are on a mobile sized screen
const isMobile = () => window.innerWidth <= 768;

aiPanel.addEventListener('pointerdown', (e) => {
    if (!isMobile() || !e.target.closest('.ai-panel-header')) return;
    isDragging = true;
    startY = e.clientY;
    panelHeight = aiPanel.offsetHeight;

    const style = window.getComputedStyle(aiPanel);
    const matrix = new WebKitCSSMatrix(style.transform);
    currentTranslateY = matrix.m41 ? matrix.m42 : 0;

    // Matikan transisi native CSS untuk drag GPU realtime
    aiPanel.style.transition = 'none';
    aiPanel.setPointerCapture(e.pointerId);
});

aiPanel.addEventListener('pointermove', (e) => {
    if (!isDragging) return;
    e.preventDefault(); // cegah native scrolling

    const dy = e.clientY - startY;
    let targetY = currentTranslateY + dy;

    // Cegah drag sampai lepas / terbang ke atas layar, mentok ujung atas (0)
    if (targetY < 0) targetY = 0;

    // Gunakan transform GPU rendering agar pergerakan sehalus mentega
    aiPanel.style.transform = `translateY(${targetY}px)`;
});

aiPanel.addEventListener('pointerup', (e) => {
    if (!isDragging) return;
    isDragging = false;
    aiPanel.releasePointerCapture(e.pointerId);

    // Kembalikan transisi native CSS
    aiPanel.style.transition = 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)';

    const style = window.getComputedStyle(aiPanel);
    const matrix = new WebKitCSSMatrix(style.transform);
    const finalY = matrix.m41 ? matrix.m42 : 0;

    // Jika ditarik ke bawah lebih dari seperempat, kita drop / sembunyikan secara utuh
    if (finalY > panelHeight * 0.25) {
        isAiPanelOpen = false;
        aiPanel.classList.add('collapsed');
        btnAiToggle.classList.remove('active');
    } else {
        // Balikkan seperti dibuka penuh
        isAiPanelOpen = true;
        aiPanel.classList.remove('collapsed');
        btnAiToggle.classList.add('active');
    }

    // Hapus inline transform styling agar sistem class CSS ambil alih lagi
    setTimeout(() => {
        aiPanel.style.transform = '';
        aiPanel.style.transition = '';
    }, 10);
});

btnAiToggle.addEventListener('click', () => {
    isAiPanelOpen = !isAiPanelOpen;
    aiPanel.classList.toggle('collapsed', !isAiPanelOpen);
    btnAiToggle.classList.toggle('active', isAiPanelOpen);
});
btnAiToggle.classList.add('active');

function updateAiContext(label) {
    document.getElementById('ai-context-label').textContent = label ? (label.length > 32 ? label.slice(0, 30) + '...' : label) : '—';
}

function setAiStatus(status) {
    const badge = document.getElementById('ai-status-badge');
    badge.textContent = status;
    badge.className = `ai-badge${['loading', 'done', 'error'].includes(status) ? ' ' + status : ''}`;
}

function addAiHistory(action, input, output) {
    const container = document.getElementById('ai-history');
    container.querySelector('.ai-history-empty')?.remove();

    const item = document.createElement('div');
    item.className = 'ai-history-item';
    item.innerHTML = `
        <div class="ai-history-action">${action}</div>
        <div class="ai-history-text">${(input || '').slice(0, 80)}</div>
        <div class="ai-history-text" style="color:var(--text-primary)">${(typeof output === 'string' ? output : JSON.stringify(output)).slice(0, 100)}</div>
    `;
    container.prepend(item);
    if (container.querySelectorAll('.ai-history-item').length > 8) {
        container.lastElementChild.remove();
    }
}

// Generate 8 Pillars
document.getElementById('btn-ai-pillars').addEventListener('click', async () => {
    const mainGoal = mandala.getRootViewCell()?.label;
    if (!mainGoal) { showToast('Masukkan tujuan utama terlebih dahulu', 'info'); return; }
    setAiStatus('loading');
    try {
        const res = await api.generatePillars(mainGoal, currentProjectId);
        if (!Array.isArray(res.pillars) || res.pillars.length < 8) throw new Error('Respons AI tidak valid');
        history.push(mandala.clone());
        mandala.fillPillars(res.pillars);
        refresh();
        triggerAutoSave(mandala.toJSON());
        setAiStatus('done');
        addAiHistory('Generate Pilar', mainGoal, res.pillars.join(' · '));
        showToast('8 pilar berhasil dibuat', 'success');
    } catch (err) {
        setAiStatus('error');
        showToast(`AI: ${err.message}`, 'error');
    } finally {
        setTimeout(() => setAiStatus('idle'), 2500);
    }
});

// Break Down
document.getElementById('btn-ai-breakdown').addEventListener('click', async () => {
    if (!selectedCellId || selectedBlkIdx === 4 || selectedBlkIdx === null) {
        showToast('Pilih salah satu sel sub-tujuan terlebih dahulu', 'info'); return;
    }
    const cell = mandala.getCell(selectedCellId);
    if (!cell?.label) { showToast('Sel ini tidak memiliki teks', 'info'); return; }
    setAiStatus('loading');
    try {
        const mainGoal = mandala.getRootViewCell()?.label || '';
        const res = await api.breakdown(cell.label, mainGoal, currentProjectId);
        if (!Array.isArray(res.actions) || res.actions.length < 8) throw new Error('Respons AI tidak valid');
        history.push(mandala.clone());
        mandala.fillBreakdown(selectedBlkIdx, res.actions);
        refresh();
        triggerAutoSave(mandala.toJSON());
        setAiStatus('done');
        addAiHistory('Rincikan', cell.label, res.actions.join(' · '));
        showToast('Rincian berhasil dibuat', 'success');
    } catch (err) {
        setAiStatus('error');
        showToast(`AI: ${err.message}`, 'error');
    } finally {
        setTimeout(() => setAiStatus('idle'), 2500);
    }
});

// Improve
document.getElementById('btn-ai-improve').addEventListener('click', async () => {
    if (!selectedCellId) { showToast('Pilih salah satu sel terlebih dahulu', 'info'); return; }
    const cell = mandala.getCell(selectedCellId);
    if (!cell?.label) { showToast('Sel ini kosong', 'info'); return; }
    setAiStatus('loading');
    try {
        const res = await api.improve(cell.label, currentProjectId);
        setAiStatus('done');
        addAiHistory('Perbaiki', cell.label, res.improved);
        showAiResult('Perbaiki dengan AI', cell.label, res.improved, () => {
            history.push(mandala.clone());
            mandala.updateCellLabel(selectedCellId, res.improved);
            refresh();
            triggerAutoSave(mandala.toJSON());
        });
    } catch (err) {
        setAiStatus('error');
        showToast(`AI: ${err.message}`, 'error');
    } finally {
        setTimeout(() => setAiStatus('idle'), 2500);
    }
});

// Make SMART
document.getElementById('btn-ai-smart').addEventListener('click', async () => {
    if (!selectedCellId) { showToast('Pilih salah satu sel terlebih dahulu', 'info'); return; }
    const cell = mandala.getCell(selectedCellId);
    if (!cell?.label) { showToast('Sel ini kosong', 'info'); return; }
    setAiStatus('loading');
    try {
        const res = await api.makeSmart(cell.label, currentProjectId);
        setAiStatus('done');
        addAiHistory('SMART', cell.label, res.smart || JSON.stringify(res));

        let html = `<div class="original">Asli: <strong>${cell.label}</strong></div>`;
        html += `<div class="result">${res.smart || ''}</div>`;
        if (res.breakdown) {
            ['S', 'M', 'A', 'R', 'T'].forEach(k => {
                if (res.breakdown[k]) {
                    html += `<div class="ai-smart-row"><span class="ai-smart-key">${k}</span><span>${res.breakdown[k]}</span></div>`;
                }
            });
        }
        showAiResult('Versi SMART', cell.label, res.smart, () => {
            if (res.smart) {
                history.push(mandala.clone());
                mandala.updateCellLabel(selectedCellId, res.smart);
                refresh();
                triggerAutoSave(mandala.toJSON());
            }
        }, html);
    } catch (err) {
        setAiStatus('error');
        showToast(`AI: ${err.message}`, 'error');
    } finally {
        setTimeout(() => setAiStatus('idle'), 2500);
    }
});

function showAiResult(title, input, output, onApply, customHtml = null) {
    const modal = document.getElementById('ai-result-modal');
    document.getElementById('ai-result-title').textContent = title;
    const content = document.getElementById('ai-result-content');
    if (customHtml) {
        content.innerHTML = customHtml;
    } else {
        content.innerHTML = `
            <div class="original">Asli: <strong>${input}</strong></div>
            <div class="result">${output}</div>
        `;
    }
    modal.classList.remove('hidden');

    const applyBtn = document.getElementById('ai-result-apply');
    const newApply = applyBtn.cloneNode(true);
    applyBtn.parentNode.replaceChild(newApply, applyBtn);
    newApply.addEventListener('click', () => {
        onApply();
        modal.classList.add('hidden');
        showToast('Diterapkan', 'success');
    });

    document.getElementById('ai-result-close').onclick = () => modal.classList.add('hidden');
    document.getElementById('ai-result-dismiss').onclick = () => modal.classList.add('hidden');
}

// ─── Export ───────────────────────────────────────────────
const exportBtn = document.getElementById('btn-export');
const exportMenu = document.getElementById('export-menu');
exportBtn.addEventListener('click', (e) => { e.stopPropagation(); exportMenu.classList.toggle('hidden'); });
document.addEventListener('click', () => exportMenu.classList.add('hidden'));

async function exportAsPNG() {
    showToast('Membuat PNG...', 'info');
    const gridEl = document.getElementById('grid-container');
    const prev = gridEl.style.transform;
    gridEl.style.transform = '';
    await new Promise(r => setTimeout(r, 80));
    try {
        const canvas = await html2canvas(gridEl, { backgroundColor: '#f7f8fc', scale: 2, useCORS: true });
        gridEl.style.transform = prev;
        const a = document.createElement('a');
        a.href = canvas.toDataURL('image/png');
        a.download = `mandala-${mandala.name || 'export'}.png`;
        a.click();
        showToast('PNG diekspor', 'success');
    } catch (err) {
        gridEl.style.transform = prev;
        showToast(`Gagal mengekspor PNG: ${err.message}`, 'error');
    }
}

async function exportAsPDF() {
    showToast('Membuat PDF...', 'info');
    const gridEl = document.getElementById('grid-container');
    const prev = gridEl.style.transform;
    gridEl.style.transform = '';
    await new Promise(r => setTimeout(r, 80));
    try {
        const canvas = await html2canvas(gridEl, { backgroundColor: '#f7f8fc', scale: 1.5, useCORS: true });
        gridEl.style.transform = prev;
        const pdf = new jsPDF({ orientation: 'landscape', format: 'a3' });
        const pw = pdf.internal.pageSize.getWidth();
        const ph = pdf.internal.pageSize.getHeight();
        const ratio = Math.min(pw / canvas.width, ph / canvas.height);
        const iw = canvas.width * ratio, ih = canvas.height * ratio;
        pdf.addImage(canvas.toDataURL('image/png'), 'PNG', (pw - iw) / 2, (ph - ih) / 2, iw, ih);
        pdf.save(`mandala-${mandala.name || 'export'}.pdf`);
        showToast('PDF diekspor', 'success');
    } catch (err) {
        gridEl.style.transform = prev;
        showToast(`Gagal mengekspor PDF: ${err.message}`, 'error');
    }
}

document.querySelectorAll('.export-opt').forEach(btn => {
    btn.addEventListener('click', async (e) => {
        const fmt = e.currentTarget.dataset.format;
        exportMenu.classList.add('hidden');
        try {
            if (fmt === 'png') { await exportAsPNG(); }
            else if (fmt === 'pdf') { await exportAsPDF(); }
            else {
                showToast(`Mengekspor ${fmt.toUpperCase()}...`, 'info');
                const blob = await api.exportAs(fmt, mandala.toJSON());
                const ext = { markdown: 'md', json: 'json' }[fmt] || fmt;
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `mandala-${mandala.name || 'export'}.${ext}`;
                a.click(); URL.revokeObjectURL(url);
                showToast(`${fmt.toUpperCase()} diekspor`, 'success');
            }
        } catch (err) {
            showToast(`Gagal mengekspor: ${err.message}`, 'error');
        }
    });
});

// ─── Init ─────────────────────────────────────────────────
async function init() {
    const saved = loadLocal();
    if (saved) {
        mandala = MandalaState.fromJSON(saved);
        projectNameEl.value = mandala.name || '';
        currentProjectId = saved.id || null;
        showToast('Proyek dipulihkan', 'info');
    } else {
        try {
            const res = await api.createProject('Proyek Tanpa Nama', mandala.toJSON());
            currentProjectId = res.project.id;
            mandala.getState().id = currentProjectId;
        } catch {
            // Offline mode
        }
    }
    initStorage(api, () => { });
    btnAiToggle.classList.add('active');
    refresh();
    updateUndoRedo();
}

init();
