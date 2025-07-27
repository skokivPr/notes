// --- DOM Element References ---
const notesListEl = document.getElementById('notes-list');
const editorContainer = document.getElementById('editor-container');
const spreadsheetContainer = document.getElementById('spreadsheet-container');
const spreadsheetTable = document.getElementById('spreadsheet-table');
const addRowBtn = document.getElementById('add-row-btn');
const addColBtn = document.getElementById('add-col-btn');
const delRowBtn = document.getElementById('del-row-btn');
const delColBtn = document.getElementById('del-col-btn');
const addNoteBtn = document.getElementById('add-note-btn');
const deleteNoteBtn = document.getElementById('delete-note-btn');
const noteTitleInput = document.getElementById('note-title-input');
const editorLangSelector = document.getElementById('editor-lang-selector');
const toggleViewBtn = document.getElementById('toggle-view-btn');
const langSwitcherBtn = document.getElementById('lang-switcher-btn');
const themeSwitcherBtn = document.getElementById('theme-switcher-btn');
const importNotesBtn = document.getElementById('import-notes-btn');
const exportNotesBtn = document.getElementById('export-notes-btn');
const importFileInput = document.getElementById('import-file-input');
const loadingOverlay = document.getElementById('loading-overlay');
const customModal = document.getElementById('custom-modal');
const modalConfirmBtn = document.getElementById('modal-confirm-btn');
const modalCancelBtn = document.getElementById('modal-cancel-btn');
const boldBtn = document.getElementById('format-bold-btn');
const italicBtn = document.getElementById('format-italic-btn');
const underlineBtn = document.getElementById('format-underline-btn');
const alignLeftBtn = document.getElementById('align-left-btn');
const alignCenterBtn = document.getElementById('align-center-btn');
const alignRightBtn = document.getElementById('align-right-btn');
const textColorPicker = document.getElementById('text-color-picker');
const bgColorPicker = document.getElementById('bg-color-picker');
const fontSizeSelector = document.getElementById('font-size-selector');

// --- Application State ---
let monacoEditor;
let isEditorViewActive = true;
let currentNoteId = null;
let notesCache = {}; // Cache for note data
let saveTimeout; // For debouncing save operations
let currentLanguage = 'pl';
let currentTheme = 'light';
let selectedCell = null;
let selectedColumn = null;
let selectedRow = null;
let isResizing = false;
let resizeStartX = 0;
let resizeStartY = 0;
let resizeTarget = null;
let resizeType = null; // 'column' or 'row'

// --- Language and Translations ---
const translations = {
    pl: {
        my_notes: 'Moje Notatki', add_note_title: 'Dodaj nową notatkę', storage_info: 'Zapisano lokalnie', note_title_placeholder: 'Wprowadź tytuł notatki...', switch_theme_title: 'Zmień motyw', switch_lang_title: 'Zmień język', switch_view_notes_title: 'Pokaż arkusz', switch_view_sheet_title: 'Pokaż edytor', delete_note_title: 'Usuń bieżącą notatkę', import_notes_title: 'Importuj notatki', export_notes_title: 'Eksportuj notatki', loading: 'Ładowanie...', delete_confirm_title: 'Potwierdź usunięcie', delete_confirm_body: 'Czy na pewno chcesz usunąć tę notatkę? Tej operacji nie można cofnąć.', cancel: 'Anuluj', delete: 'Usuń', untitled_note: 'Notatka bez tytułu', no_content: 'Brak treści', select_note_prompt: '// Wybierz notatkę lub utwórz nową.', welcome_message: `// Witaj w Notatkach Monaco!\n// Kliknij ikonę '+', aby utworzyć nową notatkę.\n// Twoje notatki będą zapisywane automatycznie.`, init_failed: 'Nie udało się zainicjować aplikacji. Sprawdź konsolę.', add_row_title: 'Dodaj Wiersz', add_col_title: 'Dodaj Kolumnę', del_row_title: 'Usuń Ostatni Wiersz', del_col_title: 'Usuń Ostatnią Kolumnę', row_label: 'Wiersz', col_label: 'Kolumna', export_success: 'Notatki zostały wyeksportowane pomyślnie', import_success: 'Notatki zostały zaimportowane pomyślnie', import_error: 'Błąd podczas importu notatek', invalid_file: 'Nieprawidłowy plik. Wybierz plik JSON z notatkami.'
    },
    en: {
        my_notes: 'My Notes', add_note_title: 'Add new note', storage_info: 'Stored Locally', note_title_placeholder: 'Enter note title...', switch_theme_title: 'Switch theme', switch_lang_title: 'Switch language', switch_view_notes_title: 'Show spreadsheet', switch_view_sheet_title: 'Show editor', delete_note_title: 'Delete current note', import_notes_title: 'Import notes', export_notes_title: 'Export notes', loading: 'Loading...', delete_confirm_title: 'Confirm Deletion', delete_confirm_body: 'Are you sure you want to delete this note? This action cannot be undone.', cancel: 'Cancel', delete: 'Delete', untitled_note: 'Untitled Note', no_content: 'No content', select_note_prompt: '// Select a note or create a new one.', welcome_message: `// Welcome to Monaco Notes!\n// Click the '+' icon to create a new note.\n// Your notes will be saved automatically.`, init_failed: 'Failed to initialize application. Check console for details.', add_row_title: 'Add Row', add_col_title: 'Add Column', del_row_title: 'Delete Last Row', del_col_title: 'Delete Last Column', row_label: 'Row', col_label: 'Column', export_success: 'Notes exported successfully', import_success: 'Notes imported successfully', import_error: 'Error importing notes', invalid_file: 'Invalid file. Please select a JSON file with notes.'
    }
};

// Map custom language names to Monaco language IDs
function getMonacoLanguage(language) {
    const languageMap = {
        'javascript': 'javascript',
        'typescript': 'typescript',
        'html': 'html',
        'css': 'css',
        'scss': 'scss',
        'json': 'json',
        'xml': 'xml',
        'markdown': 'markdown',
        'python': 'python',
        'java': 'java',
        'csharp': 'csharp',
        'cpp': 'cpp',
        'c': 'c',
        'php': 'php',
        'ruby': 'ruby',
        'go': 'go',
        'rust': 'rust',
        'swift': 'swift',
        'kotlin': 'kotlin',
        'sql': 'sql',
        'shell': 'shell',
        'yaml': 'yaml',
        'dockerfile': 'dockerfile',
        'plaintext': 'plaintext'
    };
    return languageMap[language] || 'plaintext';
}

function setLanguage(lang) {
    currentLanguage = lang;
    document.documentElement.lang = lang;
    document.querySelectorAll('[data-lang-key]').forEach(element => {
        const key = element.dataset.langKey;
        const translation = translations[lang][key];
        if (translation) {
            if (element.placeholder) element.placeholder = translation;
            else if (element.title) element.title = translation;
            else element.textContent = translation;
        }
    });
    renderNotesList();
    if (!currentNoteId && monacoEditor) displayNote(null);
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.body.dataset.theme = currentTheme;
    const icon = themeSwitcherBtn.querySelector('i');
    icon.classList.toggle('fa-moon', currentTheme === 'light');
    icon.classList.toggle('fa-sun', currentTheme === 'dark');
    if (monacoEditor) monaco.editor.setTheme(currentTheme === 'dark' ? 'vs-dark' : 'vs');
    localStorage.setItem('notes-theme', currentTheme);
}

function loadNotesFromLocalStorage() {
    const notesJSON = localStorage.getItem('monaco-notes-v3');
    return notesJSON ? JSON.parse(notesJSON) : {};
}

function saveNotesToLocalStorage() {
    localStorage.setItem('monaco-notes-v3', JSON.stringify(notesCache));
}

// --- Spreadsheet Logic ---
function createCellData(content = "") {
    return {
        content,
        style: {
            bold: false, italic: false, underline: false,
            color: '', bgColor: '',
            textAlign: 'left', fontSize: '14px'
        }
    };
}

function getSheetData() {
    if (!currentNoteId || !notesCache[currentNoteId]) {
        return {
            data: [[createCellData(), createCellData()], [createCellData(), createCellData()]],
            columnWidths: [120, 120],
            rowHeights: [30, 30]
        };
    }
    const sheetData = notesCache[currentNoteId].sheetData;
    if (!sheetData || !sheetData.data) {
        return {
            data: [[createCellData(), createCellData()], [createCellData(), createCellData()]],
            columnWidths: [120, 120],
            rowHeights: [30, 30]
        };
    }
    return {
        data: sheetData.data || [[createCellData(), createCellData()], [createCellData(), createCellData()]],
        columnWidths: sheetData.columnWidths || Array(sheetData.data[0]?.length || 2).fill(120),
        rowHeights: sheetData.rowHeights || Array(sheetData.data?.length || 2).fill(30)
    };
}

function saveSheetData() {
    if (!currentNoteId) return;
    const table = document.getElementById('spreadsheet-table').querySelector('tbody');
    const data = [];
    for (let i = 0; i < table.rows.length; i++) {
        const row = [];
        for (let j = 1; j < table.rows[i].cells.length; j++) {
            const cellEl = table.rows[i].cells[j];
            const currentData = getSheetData();
            const cellData = currentData.data[i][j - 1] || createCellData();
            cellData.content = cellEl.innerText;
            row.push(cellData);
        }
        data.push(row);
    }

    const currentSheetData = getSheetData();
    notesCache[currentNoteId].sheetData = {
        data: data,
        columnWidths: currentSheetData.columnWidths,
        rowHeights: currentSheetData.rowHeights
    };
    saveNotesToLocalStorage();
}

function applyCellStyles(cellEl, style) {
    cellEl.style.fontWeight = style.bold ? 'bold' : 'normal';
    cellEl.style.fontStyle = style.italic ? 'italic' : 'normal';
    cellEl.style.textDecoration = style.underline ? 'underline' : 'none';
    cellEl.style.color = style.color || '';
    cellEl.style.backgroundColor = style.bgColor || '';
    cellEl.style.textAlign = style.textAlign || 'left';
    cellEl.style.fontSize = style.fontSize || '14px';
}

function renderSpreadsheet() {
    const sheetData = getSheetData();
    const colCount = sheetData.data[0]?.length || 0;

    const tableHead = document.createElement('thead');
    const headRow = document.createElement('tr');

    // Empty corner cell
    const cornerCell = document.createElement('th');
    cornerCell.style.width = '60px';
    cornerCell.style.height = '30px';
    headRow.appendChild(cornerCell);

    // Column headers with resize handles
    for (let i = 0; i < colCount; i++) {
        const th = document.createElement('th');
        th.innerText = String.fromCharCode(65 + i);
        th.style.width = (sheetData.columnWidths[i] || 120) + 'px';
        th.style.position = 'relative';
        th.style.cursor = 'pointer';
        th.setAttribute('data-col-index', i);

        // Add resize handle
        const resizeHandle = document.createElement('div');
        resizeHandle.className = 'column-resize-handle';
        resizeHandle.style.position = 'absolute';
        resizeHandle.style.right = '0';
        resizeHandle.style.top = '0';
        resizeHandle.style.width = '4px';
        resizeHandle.style.height = '100%';
        resizeHandle.style.cursor = 'col-resize';
        resizeHandle.style.backgroundColor = 'transparent';
        resizeHandle.addEventListener('mousedown', (e) => startResize(e, 'column', i));

        th.appendChild(resizeHandle);
        headRow.appendChild(th);
    }
    tableHead.appendChild(headRow);

    const tableBody = document.createElement('tbody');
    sheetData.data.forEach((rowData, rowIndex) => {
        const row = document.createElement('tr');
        row.style.height = (sheetData.rowHeights[rowIndex] || 30) + 'px';

        // Row header with resize handle
        const rowHeader = document.createElement('th');
        rowHeader.innerText = rowIndex + 1;
        rowHeader.style.position = 'relative';
        rowHeader.style.cursor = 'pointer';
        rowHeader.setAttribute('data-row-index', rowIndex);

        // Add resize handle for row
        const rowResizeHandle = document.createElement('div');
        rowResizeHandle.className = 'row-resize-handle';
        rowResizeHandle.style.position = 'absolute';
        rowResizeHandle.style.bottom = '0';
        rowResizeHandle.style.left = '0';
        rowResizeHandle.style.width = '100%';
        rowResizeHandle.style.height = '4px';
        rowResizeHandle.style.cursor = 'row-resize';
        rowResizeHandle.style.backgroundColor = 'transparent';
        rowResizeHandle.addEventListener('mousedown', (e) => startResize(e, 'row', rowIndex));

        rowHeader.appendChild(rowResizeHandle);
        row.appendChild(rowHeader);

        // Data cells
        rowData.forEach((cellData, colIndex) => {
            const cell = document.createElement('td');
            cell.innerText = cellData.content;
            cell.style.width = (sheetData.columnWidths[colIndex] || 120) + 'px';
            cell.style.height = (sheetData.rowHeights[rowIndex] || 30) + 'px';
            applyCellStyles(cell, cellData.style);
            cell.setAttribute('contenteditable', 'true');
            cell.setAttribute('data-row', rowIndex);
            cell.setAttribute('data-col', colIndex);
            cell.setAttribute('tabindex', '0');
            row.appendChild(cell);
        });
        tableBody.appendChild(row);
    });

    spreadsheetTable.innerHTML = '';
    spreadsheetTable.appendChild(tableHead);
    spreadsheetTable.appendChild(tableBody);

    // Add event listeners for header clicks (column/row selection)
    tableHead.querySelectorAll('th[data-col-index]').forEach(th => {
        th.addEventListener('click', (e) => {
            if (e.target.classList.contains('column-resize-handle')) return;
            const colIndex = parseInt(th.getAttribute('data-col-index'));
            selectColumn(colIndex);
        });
    });

    tableBody.querySelectorAll('th[data-row-index]').forEach(th => {
        th.addEventListener('click', (e) => {
            if (e.target.classList.contains('row-resize-handle')) return;
            const rowIndex = parseInt(th.getAttribute('data-row-index'));
            selectRow(rowIndex);
        });
    });

    // Add event listeners for cell clicks
    tableBody.querySelectorAll('td').forEach(td => {
        td.addEventListener('click', () => selectCell(td));
    });

    // Add TAB navigation support
    addTabNavigation();
}

function addSpreadsheetRow() {
    const data = getSheetData();
    const colCount = data.data[0]?.length || 2;
    const newRow = Array(colCount).fill(0).map(() => createCellData());
    data.data.push(newRow);
    data.rowHeights.push(30); // Default height for new row
    notesCache[currentNoteId].sheetData = data;
    renderSpreadsheet();
    saveNotesToLocalStorage();
}

function addSpreadsheetColumn() {
    const data = getSheetData();
    if (data.data.length === 0) data.data.push([]);
    data.data.forEach(row => row.push(createCellData()));
    data.columnWidths.push(120); // Default width for new column
    notesCache[currentNoteId].sheetData = data;
    renderSpreadsheet();
    saveNotesToLocalStorage();
}

function deleteSpreadsheetRow() {
    const data = getSheetData();
    if (data.data.length > 1) {
        data.data.pop();
        data.rowHeights.pop();
        notesCache[currentNoteId].sheetData = data;
        renderSpreadsheet();
        saveNotesToLocalStorage();
    }
}

function deleteSpreadsheetColumn() {
    const data = getSheetData();
    if (data.data[0]?.length > 1) {
        data.data.forEach(row => row.pop());
        data.columnWidths.pop();
        notesCache[currentNoteId].sheetData = data;
        renderSpreadsheet();
        saveNotesToLocalStorage();
    }
}

function setCellStyle(styleProp, value) {
    if (!selectedCell) return;
    const rowIndex = selectedCell.parentElement.rowIndex - 1;
    const colIndex = selectedCell.cellIndex - 1;
    const cellData = notesCache[currentNoteId].sheetData.data[rowIndex][colIndex];

    if (styleProp === 'toggle') {
        cellData.style[value] = !cellData.style[value];
    } else {
        cellData.style[styleProp] = value;
    }

    applyCellStyles(selectedCell, cellData.style);
    saveNotesToLocalStorage();
    updateFormatButtons();
}

function updateFormatButtons() {
    if (!selectedCell) {
        [boldBtn, italicBtn, underlineBtn, alignLeftBtn, alignCenterBtn, alignRightBtn].forEach(b => b.classList.remove('active'));
        fontSizeSelector.value = '14px';
        return;
    };
    const rowIndex = selectedCell.parentElement.rowIndex - 1;
    const colIndex = selectedCell.cellIndex - 1;
    const cellData = notesCache[currentNoteId].sheetData.data[rowIndex][colIndex];
    boldBtn.classList.toggle('active', cellData.style.bold);
    italicBtn.classList.toggle('active', cellData.style.italic);
    underlineBtn.classList.toggle('active', cellData.style.underline);
    alignLeftBtn.classList.toggle('active', cellData.style.textAlign === 'left');
    alignCenterBtn.classList.toggle('active', cellData.style.textAlign === 'center');
    alignRightBtn.classList.toggle('active', cellData.style.textAlign === 'right');
    fontSizeSelector.value = cellData.style.fontSize || '14px';
}

// --- Column/Row Selection and Resize Functions ---
function selectColumn(colIndex) {
    clearSelection();
    selectedColumn = colIndex;
    const table = document.getElementById('spreadsheet-table');

    // Highlight column header
    const headerCell = table.querySelector(`thead th:nth-child(${colIndex + 2})`);
    if (headerCell) headerCell.classList.add('selected-header');

    // Highlight all cells in column
    const tbody = table.querySelector('tbody');
    for (let i = 0; i < tbody.rows.length; i++) {
        const cell = tbody.rows[i].cells[colIndex + 1];
        if (cell) cell.classList.add('selected-column');
    }
}

function selectRow(rowIndex) {
    clearSelection();
    selectedRow = rowIndex;
    const table = document.getElementById('spreadsheet-table');
    const tbody = table.querySelector('tbody');

    // Highlight row header
    const headerCell = tbody.rows[rowIndex].cells[0];
    if (headerCell) headerCell.classList.add('selected-header');

    // Highlight all cells in row
    for (let i = 1; i < tbody.rows[rowIndex].cells.length; i++) {
        const cell = tbody.rows[rowIndex].cells[i];
        if (cell) cell.classList.add('selected-row');
    }
}

function selectCell(cell) {
    clearSelection();
    selectedCell = cell;
    cell.classList.add('selected');
    updateFormatButtons();
}

function clearSelection() {
    const table = document.getElementById('spreadsheet-table');
    // Clear all selection classes
    table.querySelectorAll('.selected, .selected-column, .selected-row, .selected-header').forEach(el => {
        el.classList.remove('selected', 'selected-column', 'selected-row', 'selected-header');
    });
    selectedCell = null;
    selectedColumn = null;
    selectedRow = null;
    updateFormatButtons();
}

function addTabNavigation() {
    const table = document.getElementById('spreadsheet-table');
    const tbody = table.querySelector('tbody');

    // Remove existing listeners to avoid duplicates
    table.removeEventListener('keydown', handleTabNavigation);

    // Add keydown listener to the table
    table.addEventListener('keydown', handleTabNavigation);

    // Make table focusable
    table.setAttribute('tabindex', '0');
}

function handleTabNavigation(e) {
    // Handle Tab navigation
    if (e.key === 'Tab') {
        e.preventDefault();

        const table = document.getElementById('spreadsheet-table');
        const tbody = table.querySelector('tbody');
        const rows = tbody.rows;

        if (rows.length === 0) return;

        let currentRow = 0;
        let currentCol = 0;

        // Find current selected cell position
        if (selectedCell) {
            currentRow = parseInt(selectedCell.getAttribute('data-row'));
            currentCol = parseInt(selectedCell.getAttribute('data-col'));
        }

        const maxRows = rows.length;
        const maxCols = rows[0].cells.length - 1; // Exclude row header

        if (e.shiftKey) {
            // Shift+Tab: Move to previous cell
            if (currentCol > 0) {
                currentCol--;
            } else if (currentRow > 0) {
                currentRow--;
                currentCol = maxCols - 1;
            } else {
                // Wrap to last cell
                currentRow = maxRows - 1;
                currentCol = maxCols - 1;
            }
        } else {
            // Tab: Move to next cell
            if (currentCol < maxCols - 1) {
                currentCol++;
            } else if (currentRow < maxRows - 1) {
                currentRow++;
                currentCol = 0;
            } else {
                // Wrap to first cell
                currentRow = 0;
                currentCol = 0;
            }
        }

        // Select the new cell
        const newCell = rows[currentRow].cells[currentCol + 1]; // +1 to skip row header
        if (newCell) {
            selectCell(newCell);
            newCell.focus();
        }
    }

    // Handle Escape to clear selection
    if (e.key === 'Escape') {
        clearSelection();
        e.target.blur();
    }
}

function resizeColumn(colIndex, newWidth) {
    if (!currentNoteId) return;
    const data = getSheetData();
    data.columnWidths[colIndex] = Math.max(newWidth, 50); // Minimum width 50px
    notesCache[currentNoteId].sheetData = data;
    renderSpreadsheet();
    saveNotesToLocalStorage();
}

function resizeRow(rowIndex, newHeight) {
    if (!currentNoteId) return;
    const data = getSheetData();
    data.rowHeights[rowIndex] = Math.max(newHeight, 20); // Minimum height 20px
    notesCache[currentNoteId].sheetData = data;
    renderSpreadsheet();
    saveNotesToLocalStorage();
}

function startResize(e, type, index) {
    e.preventDefault();
    isResizing = true;
    resizeType = type;
    resizeTarget = index;
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;

    document.addEventListener('mousemove', handleResize);
    document.addEventListener('mouseup', stopResize);
    document.body.style.cursor = type === 'column' ? 'col-resize' : 'row-resize';
    document.body.classList.add('resizing');
}

function handleResize(e) {
    if (!isResizing) return;

    if (resizeType === 'column') {
        const deltaX = e.clientX - resizeStartX;
        const data = getSheetData();
        const currentWidth = data.columnWidths[resizeTarget] || 120;
        resizeColumn(resizeTarget, currentWidth + deltaX);
        resizeStartX = e.clientX;
    } else if (resizeType === 'row') {
        const deltaY = e.clientY - resizeStartY;
        const data = getSheetData();
        const currentHeight = data.rowHeights[resizeTarget] || 30;
        resizeRow(resizeTarget, currentHeight + deltaY);
        resizeStartY = e.clientY;
    }
}

function stopResize() {
    isResizing = false;
    resizeType = null;
    resizeTarget = null;
    document.removeEventListener('mousemove', handleResize);
    document.removeEventListener('mouseup', stopResize);
    document.body.style.cursor = 'default';
    document.body.classList.remove('resizing');
}

// --- Monaco Editor Initialization ---
function initializeEditor() {
    return new Promise((resolve) => {
        require.config({ paths: { 'vs': 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.34.1/min/vs' } });
        require(['vs/editor/editor.main'], () => {
            monacoEditor = monaco.editor.create(editorContainer, { value: translations[currentLanguage].welcome_message, language: 'javascript', theme: currentTheme === 'dark' ? 'vs-dark' : 'vs', automaticLayout: true, wordWrap: 'on', minimap: { enabled: false } });
            monacoEditor.onDidChangeModelContent(() => { if (currentNoteId) { clearTimeout(saveTimeout); saveTimeout = setTimeout(saveCurrentNote, 500); } });
            noteTitleInput.addEventListener('input', () => { if (currentNoteId) { clearTimeout(saveTimeout); saveTimeout = setTimeout(saveCurrentNote, 500); } });
            editorLangSelector.addEventListener('change', (e) => {
                if (monacoEditor && currentNoteId) {
                    const monacoLanguage = getMonacoLanguage(e.target.value);
                    monaco.editor.setModelLanguage(monacoEditor.getModel(), monacoLanguage);
                    saveCurrentNote();
                }
            });
            resolve(monacoEditor);
        });
    });
}

// --- Core Application Logic ---
function renderNotesList() {
    const sortedNotes = Object.values(notesCache).sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
    notesListEl.innerHTML = sortedNotes.map(note => `<div class="note-item ${note.id === currentNoteId ? 'active' : ''}" data-id="${note.id}"><h3>${note.title || translations[currentLanguage].untitled_note}</h3><p>${note.content?.substring(0, 40) || translations[currentLanguage].no_content}</p></div>`).join('');
}

function displayNote(noteId) {
    if (!isEditorViewActive) toggleView();
    if (!noteId || !notesCache[noteId]) {
        if (monacoEditor) monacoEditor.setValue(translations[currentLanguage].select_note_prompt);
        noteTitleInput.value = '';
        noteTitleInput.disabled = true;
        deleteNoteBtn.disabled = true;
        editorLangSelector.disabled = true;
        currentNoteId = null;
        renderNotesList();
        renderSpreadsheet();
        return;
    }
    currentNoteId = noteId;
    const note = notesCache[noteId];
    const noteLang = note.language || 'javascript';

    const monacoLanguage = getMonacoLanguage(noteLang);

    if (monacoEditor.getValue() !== note.content) monacoEditor.setValue(note.content || '');
    if (noteTitleInput.value !== note.title) noteTitleInput.value = note.title || '';
    monaco.editor.setModelLanguage(monacoEditor.getModel(), monacoLanguage);
    editorLangSelector.value = noteLang;
    noteTitleInput.disabled = false;
    deleteNoteBtn.disabled = false;
    editorLangSelector.disabled = false;
    renderNotesList();
    renderSpreadsheet();
    noteTitleInput.focus();
}

function saveCurrentNote() {
    if (!currentNoteId) return;
    const content = monacoEditor.getValue();
    const title = noteTitleInput.value.trim();
    const language = editorLangSelector.value;
    notesCache[currentNoteId] = { ...notesCache[currentNoteId], content: content, title: title || translations[currentLanguage].untitled_note, language: language, updatedAt: Date.now() };
    saveNotesToLocalStorage();
}

function addNewNote() {
    const newNoteId = crypto.randomUUID();
    notesCache[newNoteId] = { id: newNoteId, title: translations[currentLanguage].untitled_note, content: `// ${new Date().toLocaleString(currentLanguage)}\n\n`, language: 'javascript', sheetData: { data: [[createCellData(), createCellData()], [createCellData(), createCellData()]], columnWidths: [120, 120], rowHeights: [30, 30] }, createdAt: Date.now(), updatedAt: Date.now() };
    saveNotesToLocalStorage();
    displayNote(newNoteId);
}

function confirmDeleteNote() {
    if (!currentNoteId) return;
    customModal.style.display = 'flex';
    modalConfirmBtn.onclick = () => {
        delete notesCache[currentNoteId];
        saveNotesToLocalStorage();
        const noteIds = Object.keys(notesCache).sort((a, b) => (notesCache[b].createdAt || 0) - (notesCache[a].createdAt || 0));
        currentNoteId = null;
        displayNote(noteIds[0] || null);
        customModal.style.display = 'none';
    };
    modalCancelBtn.onclick = () => { customModal.style.display = 'none'; };
}

function toggleView() {
    isEditorViewActive = !isEditorViewActive;
    const icon = toggleViewBtn.querySelector('i');
    editorContainer.style.display = isEditorViewActive ? 'block' : 'none';
    spreadsheetContainer.style.display = isEditorViewActive ? 'none' : 'block';
    noteTitleInput.style.visibility = isEditorViewActive ? 'visible' : 'hidden';
    editorLangSelector.style.visibility = isEditorViewActive ? 'visible' : 'hidden';
    if (isEditorViewActive) {
        icon.classList.replace('fa-file-alt', 'fa-file-excel');
        toggleViewBtn.setAttribute('data-lang-key', 'switch_view_notes_title');
    } else {
        icon.classList.replace('fa-file-excel', 'fa-file-alt');
        toggleViewBtn.setAttribute('data-lang-key', 'switch_view_sheet_title');
    }
    setLanguage(currentLanguage);
}

// --- Import/Export Functions ---
function exportNotes() {
    try {
        // Zapisz aktualną notatkę przed eksportem
        if (currentNoteId) {
            saveCurrentNote();
        }

        // Przygotuj dane do eksportu
        const exportData = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            language: currentLanguage,
            theme: currentTheme,
            notes: notesCache
        };

        // Utwórz plik JSON
        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });

        // Utwórz link do pobrania
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(dataBlob);
        downloadLink.download = `notatki-monaco-${new Date().toISOString().split('T')[0]}.json`;

        // Dodaj do DOM i kliknij
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Pokaż komunikat o sukcesie
        showStatusMessage(translations[currentLanguage].export_success, 'success');

        // Zwolnij URL
        URL.revokeObjectURL(downloadLink.href);

    } catch (error) {
        console.error('Export error:', error);
        showStatusMessage(translations[currentLanguage].import_error, 'error');
    }
}

function importNotes() {
    importFileInput.click();
}

function handleFileImport(event) {
    const file = event.target.files[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
        showStatusMessage(translations[currentLanguage].invalid_file, 'error');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const importData = JSON.parse(e.target.result);

            // Sprawdź strukturę danych
            if (!importData.notes || typeof importData.notes !== 'object') {
                throw new Error('Invalid data structure');
            }

            // Zapisz aktualne notatki jako backup (opcjonalnie)
            const currentBackup = JSON.stringify(notesCache);

            // Merge z istniejącymi notatkami lub zastąp (możesz dodać modal do wyboru)
            const shouldMerge = confirm('Czy chcesz połączyć z istniejącymi notatkami? (Anuluj = zastąp wszystkie)');

            if (shouldMerge) {
                // Merge - dodaj nowe ID jeśli konflikt
                Object.keys(importData.notes).forEach(noteId => {
                    let finalId = noteId;

                    // Jeśli ID już istnieje, wygeneruj nowe
                    if (notesCache[noteId]) {
                        finalId = crypto.randomUUID();
                    }

                    notesCache[finalId] = {
                        ...importData.notes[noteId],
                        id: finalId,
                        importedAt: Date.now()
                    };
                });
            } else {
                // Replace - zastąp wszystkie notatki
                notesCache = { ...importData.notes };
            }

            // Zapisz do localStorage
            saveNotesToLocalStorage();

            // Odśwież interfejs
            renderNotesList();

            // Wybierz pierwszą notatkę
            const noteIds = Object.keys(notesCache).sort((a, b) =>
                (notesCache[b].createdAt || 0) - (notesCache[a].createdAt || 0)
            );
            displayNote(noteIds[0] || null);

            showStatusMessage(translations[currentLanguage].import_success, 'success');

        } catch (error) {
            console.error('Import error:', error);
            showStatusMessage(translations[currentLanguage].import_error, 'error');
        }
    };

    reader.readAsText(file);
    // Wyczyść input żeby można było importować ten sam plik ponownie
    event.target.value = '';
}

function showStatusMessage(message, type = 'info') {
    // Utwórz toast notification
    const toast = document.createElement('div');
    toast.className = `status-toast ${type}`;
    toast.textContent = message;
    toast.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 4px;
        color: white;
        font-weight: 500;
        z-index: 9999;
        opacity: 0;
        transform: translateX(100%);
        transition: all 0.3s ease;
        max-width: 300px;
        word-wrap: break-word;
    `;

    // Ustaw kolor w zależności od typu
    switch (type) {
        case 'success':
            toast.style.backgroundColor = '#48bb78';
            break;
        case 'error':
            toast.style.backgroundColor = '#f56565';
            break;
        default:
            toast.style.backgroundColor = '#4299e1';
    }

    document.body.appendChild(toast);

    // Animacja wejścia
    setTimeout(() => {
        toast.style.opacity = '1';
        toast.style.transform = 'translateX(0)';
    }, 10);

    // Usuń po 3 sekundach
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (toast.parentNode) {
                document.body.removeChild(toast);
            }
        }, 300);
    }, 3000);
}

async function main() {
    try {
        loadingOverlay.style.display = 'flex';
        await initializeEditor();
        const savedTheme = localStorage.getItem('notes-theme');
        if (savedTheme && savedTheme !== currentTheme) toggleTheme();
        setLanguage(currentLanguage);
        notesCache = loadNotesFromLocalStorage();
        const sortedIds = Object.keys(notesCache).sort((a, b) => (notesCache[b].createdAt || 0) - (notesCache[a].createdAt || 0));
        displayNote(sortedIds[0] || null);
    } catch (error) {
        console.error("Initialization failed:", error);
        editorContainer.textContent = `${translations[currentLanguage].init_failed} Błąd: ${error.message}`;
    } finally {
        loadingOverlay.style.display = 'none';
    }
}

// --- Event Listeners ---
addNoteBtn.addEventListener('click', addNewNote);
deleteNoteBtn.addEventListener('click', confirmDeleteNote);
toggleViewBtn.addEventListener('click', toggleView);
themeSwitcherBtn.addEventListener('click', toggleTheme);
langSwitcherBtn.addEventListener('click', () => setLanguage(currentLanguage === 'pl' ? 'en' : 'pl'));
notesListEl.addEventListener('click', (e) => {
    const noteItem = e.target.closest('.note-item');
    if (noteItem && noteItem.dataset.id !== currentNoteId) displayNote(noteItem.dataset.id);
});

addRowBtn.addEventListener('click', addSpreadsheetRow);
addColBtn.addEventListener('click', addSpreadsheetColumn);
delRowBtn.addEventListener('click', deleteSpreadsheetRow);
delColBtn.addEventListener('click', deleteSpreadsheetColumn);
spreadsheetTable.addEventListener('input', (e) => {
    if (e.target.tagName === 'TD') {
        clearTimeout(saveTimeout);
        saveTimeout = setTimeout(saveSheetData, 500);
    }
});

boldBtn.addEventListener('click', () => setCellStyle('toggle', 'bold'));
italicBtn.addEventListener('click', () => setCellStyle('toggle', 'italic'));
underlineBtn.addEventListener('click', () => setCellStyle('toggle', 'underline'));
alignLeftBtn.addEventListener('click', () => setCellStyle('textAlign', 'left'));
alignCenterBtn.addEventListener('click', () => setCellStyle('textAlign', 'center'));
alignRightBtn.addEventListener('click', () => setCellStyle('textAlign', 'right'));
textColorPicker.addEventListener('input', (e) => setCellStyle('color', e.target.value));
bgColorPicker.addEventListener('input', (e) => setCellStyle('bgColor', e.target.value));
fontSizeSelector.addEventListener('change', (e) => setCellStyle('fontSize', e.target.value));

importNotesBtn.addEventListener('click', importNotes);
exportNotesBtn.addEventListener('click', exportNotes);
importFileInput.addEventListener('change', handleFileImport);

main();