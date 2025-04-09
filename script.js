document.addEventListener('DOMContentLoaded', () => {
    const sidebarLinks = document.querySelectorAll('.sidebar nav ul li a');
    const pages = document.querySelectorAll('.page');
    const newTaskTextInput = document.getElementById('new-task-text');
    const newTaskDateInput = document.getElementById('new-task-date');
    const addTaskButton = document.getElementById('add-task-btn');
    const pendingTasksList = document.getElementById('pending-tasks');
    const completedTasksList = document.getElementById('completed-tasks');
    const futureTasksList = document.getElementById('future-tasks-list');
    const todayTasksList = document.getElementById('today-tasks-list');
    const searchInput = document.getElementById('search-tasks');
    const searchButton = document.getElementById('search-btn');

    const calendarDiv = document.getElementById('calendar-grid');
    const currentMonthDisplay = document.getElementById('current-month');
    const prevMonthButton = document.getElementById('prev-month');
    const nextMonthButton = document.getElementById('next-month');
    let currentDate = new Date();
    let selectedDueDate = null;

    const noteTitleInput = document.getElementById('note-title-input');
    const notesContentTextarea = document.getElementById('notes-content');
    const saveNoteButton = document.getElementById('save-note-btn');
    const noteListElement = document.getElementById('note-list');

    const newLabelNameInput = document.getElementById('new-label-name');
    const createLabelButton = document.getElementById('create-label-btn');
    const filterLabelsDiv = document.getElementById('filter-labels');
    const taskLabelsSelect = document.getElementById('task-labels');

    const STORAGE_KEY = 'taskManagerData';
    let tasks = loadTasks();
    let labels = loadLabels();
    let nextLabelId = labels.length > 0 ? Math.max(...labels.map(l => l.id)) + 1 : 1;
    let activeFilters = [];
    let notes = loadNotes();
    let currentNoteIndex = -1;

    function saveTasks() {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    }

    function loadTasks() {
        const storedTasks = localStorage.getItem(STORAGE_KEY);
        return storedTasks ? JSON.parse(storedTasks) : [];
    }

    function saveLabels() {
        localStorage.setItem('taskManagerLabels', JSON.stringify(labels));
    }

    function loadLabels() {
        const storedLabels = localStorage.getItem('taskManagerLabels');
        return storedLabels ? JSON.parse(storedLabels) : [];
    }

    function saveNotes() {
        localStorage.setItem('taskManagerNotes', JSON.stringify(notes));
    }

    function loadNotes() {
        const storedNotes = localStorage.getItem('taskManagerNotes');
        return storedNotes ? JSON.parse(storedNotes) : [];
    }

    function hideAllPages() {
        pages.forEach(page => {
            page.classList.remove('active');
        });
    }

    function showPage(pageId) {
        const pageToShow = document.getElementById(`${pageId}-page`);
        if (pageToShow) {
            pageToShow.classList.add('active');
        }
    }

    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(event) {
            event.preventDefault();
            const pageToShow = this.getAttribute('data-page');
            hideAllPages();
            showPage(pageToShow);
        });
    });

    showPage('tasks');

    function createLabel() {
        const labelName = newLabelNameInput.value.trim();
        if (labelName) {
            const newLabel = { id: nextLabelId++, name: labelName };
            labels.push(newLabel);
            saveLabels();
            renderLabels();
            newLabelNameInput.value = '';
        }
    }

    function renderLabels() {
        taskLabelsSelect.innerHTML = '<option value="" disabled selected>Select labels</option>';
        filterLabelsDiv.innerHTML = '';
        labels.forEach(label => {
            const option = document.createElement('option');
            option.value = label.id;
            option.textContent = label.name;
            taskLabelsSelect.appendChild(option);

            const filterContainer = document.createElement('div');
            filterContainer.classList.add('filter-label-item');

            const filterButton = document.createElement('button');
            filterButton.textContent = label.name;
            filterButton.dataset.labelId = label.id;
            filterButton.classList.toggle('active', activeFilters.includes(label.id));
            filterButton.addEventListener('click', toggleFilter);
            filterContainer.appendChild(filterButton);

            const deleteLabelButton = document.createElement('button');
            deleteLabelButton.innerHTML = '<i class="fas fa-times"></i>';
            deleteLabelButton.classList.add('delete-label-btn');
            deleteLabelButton.dataset.labelId = label.id;
            deleteLabelButton.addEventListener('click', (event) => {
                const labelIdToDelete = parseInt(event.target.dataset.labelId);
                deleteLabel(labelIdToDelete);
                event.stopPropagation();
            });
            filterContainer.appendChild(deleteLabelButton);

            filterLabelsDiv.appendChild(filterContainer);
        });
    }

    function deleteLabel(labelIdToDelete) {
        const indexToDelete = labels.findIndex(label => label.id === labelIdToDelete);
        if (indexToDelete > -1) {
            labels.splice(indexToDelete, 1);

            tasks.forEach(task => {
                task.labels = task.labels.filter(id => id !== labelIdToDelete);
            });

            activeFilters = activeFilters.filter(id => id !== labelIdToDelete);

            saveLabels();
            saveTasks();
            renderLabels();
            renderTasks();
        }
    }

    function toggleFilter(event) {
        const labelId = parseInt(event.target.dataset.labelId);
        const index = activeFilters.indexOf(labelId);
        if (index > -1) {
            activeFilters.splice(index, 1);
            event.target.classList.remove('active');
        } else {
            activeFilters.push(labelId);
            event.target.classList.add('active');
        }
        renderTasks();
    }

    function addTask() {
        const taskText = newTaskTextInput.value.trim();
        const selectedLabelIds = Array.from(taskLabelsSelect.selectedOptions).map(option => parseInt(option.value));

        if (taskText !== "") {
            const taskObject = {
                text: taskText,
                dueDate: selectedDueDate ? new Date(selectedDueDate).toISOString().split('T')[0] : null,
                completed: false,
                labels: selectedLabelIds
            };
            tasks.push(taskObject);
            saveTasks();
            renderTasks();
            newTaskTextInput.value = "";
            newTaskDateInput.value = "";
            taskLabelsSelect.selectedIndex = -1;
            selectedDueDate = null;
        }
    }

    function createTaskElement(task) {
        const listItem = document.createElement('li');
        const taskSpan = document.createElement('span');
        taskSpan.textContent = task.text;

        const labelsContainer = document.createElement('div');
        labelsContainer.classList.add('labels-container');
        if (task.labels && task.labels.length > 0) {
            task.labels.forEach(labelId => {
                const label = labels.find(l => l.id === labelId);
                if (label) {
                    const labelSpan = document.createElement('span');
                    labelSpan.classList.add('label');
                    labelSpan.textContent = label.name;
                    labelsContainer.appendChild(labelSpan);
                }
            });
        }

        const actionsDiv = document.createElement('div');
        actionsDiv.classList.add('task-actions');

        const completeButton = document.createElement('button');
        completeButton.innerHTML = '<i class="fas fa-check"></i>';
        completeButton.addEventListener('click', () => {
            task.completed = !task.completed;
            saveTasks();
            renderTasks();
        });

        const deleteButton = document.createElement('button');
        deleteButton.innerHTML = '<i class="fas fa-trash-alt"></i>';
        deleteButton.addEventListener('click', () => {
            tasks = tasks.filter(t => t !== task);
            saveTasks();
            renderTasks();
        });

        actionsDiv.appendChild(completeButton);
        actionsDiv.appendChild(deleteButton);

        listItem.appendChild(taskSpan);
        listItem.appendChild(actionsDiv);
        listItem.appendChild(labelsContainer);

        if (task.dueDate) {
            const dueDateSpan = document.createElement('span');
            dueDateSpan.classList.add('due-date');
            dueDateSpan.textContent = formatDate(task.dueDate);
            listItem.appendChild(dueDateSpan);
        }

        return listItem;
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    function renderTasks() {
        pendingTasksList.innerHTML = '';
        completedTasksList.innerHTML = '';
        futureTasksList.innerHTML = '';
        todayTasksList.innerHTML = '';

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        tasks.forEach(task => {
            const matchesFilters = activeFilters.length === 0 || task.labels.some(labelId => activeFilters.includes(labelId));

            if (matchesFilters) {
                const listItem = createTaskElement(task);
                if (task.completed) {
                    listItem.classList.add('completed');
                    completedTasksList.appendChild(listItem);
                } else if (task.dueDate) {
                    const dueDate = new Date(task.dueDate);
                    dueDate.setHours(0, 0, 0, 0);
                    if (dueDate.getTime() > today.getTime()) {
                        futureTasksList.appendChild(listItem);
                    } else if (dueDate.getTime() === today.getTime()) {
                        todayTasksList.appendChild(listItem);
                    } else {
                        pendingTasksList.appendChild(listItem);
                    }
                } else {
                    pendingTasksList.appendChild(listItem);
                }
            }
        });
    }

    function renderCalendar(date) {
        calendarDiv.innerHTML = '';
        const year = date.getFullYear();
        const month = date.getMonth();
        const firstDayOfMonth = new Date(year, month, 1);
        const lastDayOfMonth = new Date(year, month + 1, 0);
        const daysInMonth = lastDayOfMonth.getDate();
        const dayOfWeekOfFirstDay = firstDayOfMonth.getDay();

        const monthNames = ["January", "February", "March", "April", "May", "June",
            "July", "August", "September", "October", "November", "December"
        ];
        currentMonthDisplay.textContent = `${monthNames[month]} ${year}`;

        for (let i = 0; i < dayOfWeekOfFirstDay; i++) {
            const emptyCell = document.createElement('div');
            calendarDiv.appendChild(emptyCell);
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayCell = document.createElement('div');
            dayCell.textContent = i;
            dayCell.classList.add('calendar-day');
            dayCell.dataset.year = year;
            dayCell.dataset.month = month;
            dayCell.dataset.day = i;

            const cellDate = new Date(year, month, i);
            const formattedCellDate = formatDate(cellDate.toISOString().split('T')[0]);
            const hasTask = tasks.some(task => task.dueDate === formattedCellDate && !task.completed);
            if (hasTask) {
                dayCell.classList.add('has-task');
            }

            if (year === currentDate.getFullYear() && month === currentDate.getMonth() && i === currentDate.getDate()) {
                dayCell.classList.add('today');
            }
            calendarDiv.appendChild(dayCell);
        }

        const calendarDays = document.querySelectorAll('.calendar-day');
        calendarDays.forEach(day => {
            day.addEventListener('click', function() {
                const year = this.dataset.year;
                const month = this.dataset.month;
                const day = this.dataset.day;
                selectedDueDate = new Date(year, month, day).toISOString().split('T')[0];
                newTaskDateInput.value = formatDate(selectedDueDate);
                showPage('tasks');
            });
        });
    }

    function navigateMonth(direction) {
        currentDate.setMonth(currentDate.getMonth() + direction);
        renderCalendar(currentDate);
    }

    function displayNotesList() {
        noteListElement.innerHTML = '';
        notes.forEach((note, index) => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                <span class="note-title-sidebar">${note.title || 'Untitled Note'}</span>
                <button class="delete-note-btn" data-index="${index}"><i class="fas fa-trash-alt"></i></button>
            `;
            listItem.addEventListener('click', (event) => {
                if (event.target.classList.contains('delete-note-btn') || event.target.closest('.delete-note-btn')) {
                    const indexToDelete = parseInt(event.target.dataset.index);
                    deleteNote(indexToDelete);
                } else {
                    currentNoteIndex = index;
                    noteTitleInput.value = note.title || '';
                    notesContentTextarea.value = note.content || '';
                    showPage('notes');
                }
            });
            noteListElement.appendChild(listItem);
        });
    }

    function deleteNote(indexToDelete) {
        if (indexToDelete >= 0 && indexToDelete < notes.length) {
            notes.splice(indexToDelete, 1);
            saveNotes();
            displayNotesList();
            if (currentNoteIndex === indexToDelete) {
                noteTitleInput.value = '';
                notesContentTextarea.value = '';
                currentNoteIndex = -1;
            } else if (currentNoteIndex > indexToDelete) {
                currentNoteIndex--;
            }
        }
    }

    function saveNote() {
        const title = noteTitleInput.value.trim();
        const content = notesContentTextarea.value;

        if (currentNoteIndex >= 0 && currentNoteIndex < notes.length) {
            notes[currentNoteIndex] = { title, content };
        } else {
            notes.push({ title, content });
            currentNoteIndex = notes.length - 1;
        }

        saveNotes();
        displayNotesList();
        noteTitleInput.value = '';
        notesContentTextarea.value = '';
        currentNoteIndex = -1;
    }

    function performSearch() {
        const searchTerm = searchInput.value.trim().toLowerCase();
        const allTasksLists = [pendingTasksList, completedTasksList, futureTasksList, todayTasksList];

        allTasksLists.forEach(taskList => {
            Array.from(taskList.children).forEach(taskItem => {
                const taskTextElement = taskItem.querySelector('span');
                if (taskTextElement && taskTextElement.textContent.toLowerCase().includes(searchTerm)) {
                    taskItem.style.display = 'flex';
                } else {
                    taskItem.style.display = 'none';
                }
            });
        });
    }

    createLabelButton.addEventListener('click', createLabel);
    addTaskButton.addEventListener('click', addTask);
    prevMonthButton.addEventListener('click', () => navigateMonth(-1));
    nextMonthButton.addEventListener('click', () => navigateMonth(1));
    saveNoteButton.addEventListener('click', saveNote);
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('input', performSearch);

    renderLabels();
    renderCalendar(currentDate);
    renderTasks();
    displayNotesList();
});