/* Catalogue transcribed from the supplied review's Tables 2–3 and References. */
const SITE_CONFIG = { dataFile: 'paperlist.csv' };

/* Quoted fields, escaped quotes, BOMs, CRLF and multiline CSV cells are supported. */
function parseCSV(text) {
    const records = [];
    let record = [], value = '', quoted = false;
    const source = text.replace(/^\uFEFF/, '');
    for (let i = 0; i < source.length; i++) {
        const char = source[i];
        if (char === '"') {
            if (quoted && source[i + 1] === '"') { value += '"'; i++; }
            else if (quoted || value.length === 0) { quoted = !quoted; }
            else { throw new Error('Unexpected quote in CSV field.'); }
        } else if (char === ',' && !quoted) { record.push(value); value = ''; }
        else if ((char === '\n' || char === '\r') && !quoted) {
            record.push(value);
            if (record.some(cell => cell.trim())) records.push(record);
            record = []; value = '';
            if (char === '\r' && source[i + 1] === '\n') i++;
        } else { value += char; }
    }
    if (quoted) throw new Error('Unclosed quote in CSV file.');
    record.push(value);
    if (record.some(cell => cell.trim())) records.push(record);
    if (!records.length) throw new Error('The CSV file has no column headers.');
    const columns = records.shift().map(column => column.trim());
    if (columns.some(column => !column) || new Set(columns).size !== columns.length) throw new Error('CSV column names must be nonempty and unique.');
    if (!columns.includes('Paper Title')) throw new Error('The CSV needs a Paper Title column.');
    const rows = records.map((cells, index) => {
        if (cells.length !== columns.length) throw new Error(`CSV record ${index + 2} has the wrong number of fields.`);
        return Object.fromEntries(columns.map((column, i) => [column, cells[i].trim()]));
    });
    return { columns, rows };
}

function element(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

function safePaperURL(value) {
    if (!value) return null;
    const candidate = value.trim();
    try {
        const url = new URL(/^10\.\d{4,9}\//.test(candidate) ? `https://doi.org/${candidate}` : candidate);
        return ['https:', 'http:'].includes(url.protocol) ? url.href : null;
    } catch { return null; }
}

class PapersViewer {
    constructor() {
        this.allPapersData = [];
        this.filteredData = [];
        this.columns = [];
        this.visibleColumns = new Set();
        this.filterControls = new Map();
        this.sortColumn = null;
        this.sortDirection = 'asc';
        this.collator = new Intl.Collator(undefined, { numeric: true, sensitivity: 'base' });
        this.ready = this.init();
    }

    async init() {
        const main = document.getElementById('papers-container');
        try {
            const embedded = document.getElementById('embedded-papers');
            let data;
            if (embedded) data = JSON.parse(embedded.textContent);
            else {
                const response = await fetch(SITE_CONFIG.dataFile);
                if (!response.ok) throw new Error(`Could not load the catalogue (HTTP ${response.status}).`);
                data = parseCSV(await response.text());
            }
            this.columns = data.columns;
            this.allPapersData = data.rows;
            this.filteredData = [...data.rows];
            const defaults = ['Paper ID', 'Paper Title', 'Year', 'AI Method', 'XR Technology', 'URL'];
            this.visibleColumns = new Set(this.columns.filter(column => defaults.includes(column)));
            this.render();
        } catch (error) {
            const box = element('div', 'load-error');
            box.setAttribute('role', 'alert');
            box.append(element('strong', '', 'The catalogue could not be loaded.'), element('p', '', `${error.message} Please try again later or download the CSV above.`));
            document.getElementById('viewer').replaceChildren(box);
            console.error(error);
        } finally { main.setAttribute('aria-busy', 'false'); }
    }

    getTokens(value) { return (value || '').split(';').map(item => item.trim()).filter(Boolean); }

    getUniqueValues(column) {
        const values = this.allPapersData.flatMap(row => this.getTokens(row[column]));
        const result = [...new Set(values)].sort(this.collator.compare);
        return column === 'Year' ? result.reverse() : result;
    }

    createFilter(column) {
        const wrapper = element('div', 'filter-item');
        const label = element('label', '', column);
        const select = element('select');
        select.id = `filter-${this.columns.indexOf(column)}`;
        label.htmlFor = select.id;
        const all = element('option', '', `All ${column === 'Year' ? 'years' : 'categories'}`);
        all.value = '';
        select.append(all);
        this.getUniqueValues(column).forEach(value => {
            const option = element('option', '', value);
            option.value = value;
            select.append(option);
        });
        select.addEventListener('change', () => this.applyFilters());
        this.filterControls.set(column, select);
        wrapper.append(label, select);
        return wrapper;
    }

    render() {
        const viewer = document.getElementById('viewer');
        viewer.replaceChildren();
        const form = element('form', 'filters');
        form.setAttribute('role', 'search');
        form.setAttribute('aria-label', 'Filter papers');
        form.addEventListener('submit', event => event.preventDefault());
        const grid = element('div', 'filter-grid');
        const searchWrapper = element('div', 'filter-item search-filter');
        const searchLabel = element('label', '', 'Search all fields');
        searchLabel.htmlFor = 'search-all';
        this.searchInput = element('input');
        this.searchInput.type = 'search';
        this.searchInput.id = 'search-all';
        this.searchInput.placeholder = 'Title, author, keyword…';
        this.searchInput.addEventListener('input', () => this.applyFilters());
        searchWrapper.append(searchLabel, this.searchInput);
        grid.append(searchWrapper);
        const preferred = ['Year', 'XR Technology', 'AI Method', 'Technology', 'Medical Application', 'Domain'];
        const mainFilters = preferred.filter(column => this.columns.includes(column)).slice(0, 3);
        mainFilters.forEach(column => grid.append(this.createFilter(column)));
        form.append(grid);
        const extraNames = ['AI Function', 'XR Hardware', 'Clinical Domain', 'Integration Mode', 'TRL', 'AI Technology', 'Medical Application', 'Publication Type', 'Source', 'Methods', 'Target Groups', 'Target Users'];
        const extraFilters = extraNames.filter(column => this.columns.includes(column) && !mainFilters.includes(column));
        if (extraFilters.length) {
            const details = element('details', 'more-filters');
            details.append(element('summary', '', 'More filters'));
            const extraGrid = element('div', 'filter-grid');
            extraFilters.forEach(column => extraGrid.append(this.createFilter(column)));
            details.append(extraGrid);
            form.append(details);
        }
        viewer.append(form);

        const toolbar = element('div', 'result-toolbar');
        this.count = element('p', 'paper-count');
        this.count.setAttribute('role', 'status');
        this.count.setAttribute('aria-live', 'polite');
        const actions = element('div', 'toolbar-actions');
        const clear = element('button', 'clear-filters', 'Clear filters');
        clear.type = 'button';
        clear.addEventListener('click', () => this.clearFilters());
        const selector = element('details', 'column-selector');
        selector.append(element('summary', '', 'Columns'));
        const columnList = element('div', 'column-list');
        this.columns.forEach(column => {
            const label = element('label', 'column-option');
            const check = element('input');
            check.type = 'checkbox';
            check.checked = this.visibleColumns.has(column);
            check.disabled = column === 'Paper Title';
            check.addEventListener('change', () => {
                if (check.checked) this.visibleColumns.add(column);
                else this.visibleColumns.delete(column);
                this.updateTable();
            });
            label.append(check, element('span', '', column));
            columnList.append(label);
        });
        selector.append(columnList);
        actions.append(clear, selector);
        toolbar.append(this.count, actions);
        viewer.append(toolbar);
        viewer.append(element('p', 'table-hint', 'Select a column heading to sort. Scroll horizontally to see more columns.'));
        const tableWrapper = element('div', 'table-wrapper');
        tableWrapper.tabIndex = 0;
        tableWrapper.setAttribute('role', 'region');
        tableWrapper.setAttribute('aria-label', 'Scrollable paper catalogue');
        this.table = element('table');
        this.table.append(element('caption', 'sr-only', 'Papers included in the AI–XR healthcare review'));
        this.thead = element('thead');
        this.tbody = element('tbody');
        this.table.append(this.thead, this.tbody);
        tableWrapper.append(this.table);
        viewer.append(tableWrapper);
        this.updateTable();
    }

    applyFilters() {
        const term = this.searchInput.value.toLocaleLowerCase().trim();
        this.filteredData = this.allPapersData.filter(row => {
            if (term && !Object.values(row).join(' ').toLocaleLowerCase().includes(term)) return false;
            for (const [column, select] of this.filterControls) {
                if (select.value && !this.getTokens(row[column]).includes(select.value)) return false;
            }
            return true;
        });
        this.updateTable();
    }

    clearFilters() {
        this.searchInput.value = '';
        this.filterControls.forEach(select => { select.value = ''; });
        this.applyFilters();
    }

    columnClass(column) {
        return ({ 'Paper ID': 'id-column', 'Paper Title': 'paper-title-column', 'Year': 'year-column', 'Citation': 'citation-column', 'URL': 'url-column', 'DOI': 'url-column' })[column] || '';
    }

    updateTable() {
        this.count.textContent = `Showing ${this.filteredData.length} of ${this.allPapersData.length} studies`;
        const columns = this.columns.filter(column => this.visibleColumns.has(column));
        const focusedSortColumn = document.activeElement?.dataset?.sortColumn;
        const headerRow = element('tr');
        columns.forEach(column => {
            const th = element('th', this.columnClass(column));
            th.scope = 'col';
            th.setAttribute('aria-sort', this.sortColumn === column ? (this.sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
            const displayName = column === 'Paper ID' ? 'Ref.' : (column === 'URL' || column === 'DOI' ? 'Paper link' : column);
            const button = element('button', 'sort-button', displayName);
            button.type = 'button';
            button.dataset.sortColumn = column;
            const icon = element('span', 'sort-icon', this.sortColumn === column ? (this.sortDirection === 'asc' ? '↑' : '↓') : '↕');
            icon.setAttribute('aria-hidden', 'true');
            button.append(icon);
            button.addEventListener('click', () => {
                this.sortDirection = this.sortColumn === column && this.sortDirection === 'asc' ? 'desc' : 'asc';
                this.sortColumn = column;
                this.updateTable();
            });
            th.append(button);
            headerRow.append(th);
        });
        this.thead.replaceChildren(headerRow);
        if (focusedSortColumn) {
            [...this.thead.querySelectorAll('button')].find(button => button.dataset.sortColumn === focusedSortColumn)?.focus({ preventScroll: true });
        }
        const rows = [...this.filteredData];
        if (this.sortColumn) {
            const direction = this.sortDirection === 'asc' ? 1 : -1;
            rows.sort((a, b) => direction * this.collator.compare(a[this.sortColumn] || '', b[this.sortColumn] || ''));
        }
        const fragment = document.createDocumentFragment();
        if (!rows.length) {
            const tr = element('tr');
            const td = element('td', 'no-results', this.allPapersData.length ? 'No papers match these filters. Try another search or clear the filters.' : 'The study catalogue has not been added yet.');
            td.colSpan = columns.length;
            tr.append(td); fragment.append(tr);
        }
        rows.forEach(row => {
            const tr = element('tr');
            columns.forEach(column => {
                const td = element('td', this.columnClass(column));
                if (column === 'URL' || column === 'DOI') {
                    const url = safePaperURL(row[column]);
                    if (url) {
                        const link = element('a', 'paper-link', 'View paper ↗');
                        link.href = url;
                        link.target = '_blank';
                        link.rel = 'noopener noreferrer';
                        link.setAttribute('aria-label', `View ${row['Paper Title']} (opens in a new tab)`);
                        td.append(link);
                    } else { td.textContent = '—'; }
                } else { td.textContent = row[column] || '—'; }
                tr.append(td);
            });
            fragment.append(tr);
        });
        this.tbody.replaceChildren(fragment);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const bundled = document.getElementById('preview-resources');
    if (bundled) {
        const resources = JSON.parse(bundled.textContent);
        const urls = new Map();
        for (const [path, resource] of Object.entries(resources)) {
            const bytes = Uint8Array.from(atob(resource.data), character => character.charCodeAt(0));
            urls.set(path, URL.createObjectURL(new Blob([bytes], { type: resource.type })));
        }
        document.querySelectorAll('a[href]').forEach(link => {
            const [path, fragment] = link.getAttribute('href').split('#');
            if (urls.has(path)) link.href = urls.get(path) + (fragment ? `#${fragment}` : '');
        });
    }
    window.papersViewer = new PapersViewer();
    const dialog = document.getElementById('figure-dialog');
    const expand = document.getElementById('expand-figure');
    const zoom = document.getElementById('zoom-figure');
    expand.addEventListener('click', () => dialog.showModal());
    document.getElementById('close-figure').addEventListener('click', () => dialog.close());
    zoom.addEventListener('click', () => {
        const zoomed = dialog.classList.toggle('is-zoomed');
        zoom.setAttribute('aria-pressed', String(zoomed));
        zoom.textContent = zoomed ? 'Fit to window' : 'Zoom in';
    });
    dialog.addEventListener('click', event => {
        const bounds = dialog.getBoundingClientRect();
        if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
    });
    dialog.addEventListener('close', () => {
        dialog.classList.remove('is-zoomed');
        zoom.setAttribute('aria-pressed', 'false');
        zoom.textContent = 'Zoom in';
        expand.focus({ preventScroll: true });
    });
});
