/**
 * export.service.js - Export to Markdown and JSON (server-side only)
 * PNG and PDF export is handled client-side via html2canvas/jsPDF in the frontend
 */

const ExportService = {
    /**
     * Convert mandala state to Markdown string
     */
    toMarkdown(projectData) {
        const { name, cells } = projectData;
        if (!cells) return '# Empty Mandala\n';
        const rootCell = cells['root'] || {};
        const mainGoal = rootCell.label || 'Main Goal';
        let md = `# ${name || mainGoal}\n\n`;
        md += `**Main Goal:** ${mainGoal}\n\n---\n\n`;

        const children = rootCell.children || {};
        const ORDER = [0, 1, 2, 3, 5, 6, 7, 8];
        ORDER.forEach((pos, idx) => {
            const child = children[pos];
            if (!child) return;
            const subLabel = child.label || `Pillar ${idx + 1}`;
            md += `## Pillar ${idx + 1}: ${subLabel}\n\n`;
            const grandChildren = child.children || {};
            const SUB_ORDER = [0, 1, 2, 3, 5, 6, 7, 8];
            SUB_ORDER.forEach((sp) => {
                const gc = grandChildren[sp];
                if (gc && gc.label) {
                    md += `- ${gc.label}\n`;
                }
            });
            md += '\n';
        });

        return md;
    },

    /**
     * Export as formatted JSON
     */
    toJSON(projectData) {
        return JSON.stringify(projectData, null, 2);
    }
};

module.exports = ExportService;
