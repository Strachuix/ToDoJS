class Todo {
    constructor(text) {
        this.id = Date.now() + Math.random();
        this.text = text;
        this.completed = false;
        this.createdAt = new Date();
    }
}

// Główna klasa aplikacji ToDo
class TodoApp {
    constructor() {
        this.todos = this.loadFromStorage();
        this.currentFilter = 'all';
        this.initializeElements();
        this.bindEvents();
        this.render();
    }

    // Inicjalizacja elementów DOM
    initializeElements() {
        this.todoForm = document.getElementById('todoForm');
        this.todoInput = document.getElementById('todoInput');
        this.todoList = document.getElementById('todoList');
        this.counterText = document.getElementById('counterText');
        this.filterAll = document.getElementById('filterAll');
        this.filterActive = document.getElementById('filterActive');
        this.filterCompleted = document.getElementById('filterCompleted');
        this.clearCompleted = document.getElementById('clearCompleted');
        this.emptyState = document.getElementById('emptyState');
    }

    // Przypisanie event listenerów
    bindEvents() {
        this.todoForm.addEventListener('submit', (e) => this.handleSubmit(e));
        this.filterAll.addEventListener('click', () => this.setFilter('all'));
        this.filterActive.addEventListener('click', () => this.setFilter('active'));
        this.filterCompleted.addEventListener('click', () => this.setFilter('completed'));
        this.clearCompleted.addEventListener('click', () => this.clearCompletedTodos());
    }

    // Dodawanie nowego zadania
    handleSubmit(e) {
        e.preventDefault();
        const text = this.todoInput.value.trim();
        
        if (text) {
            const todo = new Todo(text);
            this.todos.push(todo);
            this.todoInput.value = '';
            this.saveToStorage();
            this.render();
        }
    }

    // Przełączanie statusu zadania
    toggleTodo(id) {
        const todo = this.todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            this.saveToStorage();
            this.render();
        }
    }

    // Usuwanie zadania
    deleteTodo(id) {
        const todoElement = document.querySelector(`[data-id="${id}"]`);
        if (todoElement) {
            todoElement.classList.add('removing');
            setTimeout(() => {
                this.todos = this.todos.filter(t => t.id !== id);
                this.saveToStorage();
                this.render();
            }, 300);
        }
    }

    // Usuwanie wszystkich ukończonych zadań
    clearCompletedTodos() {
        const completedElements = document.querySelectorAll('.todo-item.completed');
        completedElements.forEach(el => el.classList.add('removing'));
        
        setTimeout(() => {
            this.todos = this.todos.filter(t => !t.completed);
            this.saveToStorage();
            this.render();
        }, 300);
    }

    // Ustawianie filtru
    setFilter(filter) {
        this.currentFilter = filter;
        
        // Aktualizacja aktywnego przycisku
        document.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        if (filter === 'all') this.filterAll.classList.add('active');
        else if (filter === 'active') this.filterActive.classList.add('active');
        else if (filter === 'completed') this.filterCompleted.classList.add('active');
        
        this.render();
    }

    // Filtrowanie zadań
    getFilteredTodos() {
        switch (this.currentFilter) {
            case 'active':
                return this.todos.filter(t => !t.completed);
            case 'completed':
                return this.todos.filter(t => t.completed);
            default:
                return this.todos;
        }
    }

    // Formatowanie daty
    formatDate(date) {
        const now = new Date();
        const diff = now - date;
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);

        if (minutes < 1) return 'teraz';
        if (minutes < 60) return `${minutes} min temu`;
        if (hours < 24) return `${hours} godz. temu`;
        if (days < 7) return `${days} dni temu`;
        
        return date.toLocaleDateString('pl-PL');
    }

    // Renderowanie listy zadań
    render() {
        const filteredTodos = this.getFilteredTodos();
        
        // Sortowanie: nieukończone najpierw
        const sortedTodos = filteredTodos.sort((a, b) => {
            if (a.completed === b.completed) {
                return b.createdAt - a.createdAt; // Najnowsze najpierw
            }
            return a.completed - b.completed; // Nieukończone najpierw
        });

        this.todoList.innerHTML = '';
        const emptyState = document.getElementById('emptyState');
        
        if (sortedTodos.length === 0) {
            emptyState.style.display = 'block';
        } else {
            emptyState.style.display = 'none';
            
            sortedTodos.forEach(todo => {
                const li = document.createElement('li');
                li.className = `todo-item ${todo.completed ? 'completed' : ''}`;
                li.dataset.id = todo.id;
                
                li.innerHTML = `
                    <input type="checkbox" class="todo-checkbox" ${todo.completed ? 'checked' : ''}>
                    <span class="todo-text">${this.escapeHtml(todo.text)}</span>
                    <span class="todo-date">${this.formatDate(todo.createdAt)}</span>
                    <button class="delete-btn" title="Usuń zadanie">×</button>
                `;
                
                // Event listenery dla konkretnego zadania
                const checkbox = li.querySelector('.todo-checkbox');
                const deleteBtn = li.querySelector('.delete-btn');
                
                checkbox.addEventListener('change', () => this.toggleTodo(todo.id));
                deleteBtn.addEventListener('click', () => this.deleteTodo(todo.id));
                
                this.todoList.appendChild(li);
            });
        }
        
        this.updateCounter();
    }

    // Aktualizacja licznika zadań
    updateCounter() {
        const total = this.todos.length;
        const completed = this.todos.filter(t => t.completed).length;
        const active = total - completed;
        
        let text;
        if (total === 0) {
            text = 'Brak zadań';
        } else if (total === 1) {
            text = completed === 1 ? '1 zadanie • ukończone' : '1 zadanie • aktywne';
        } else {
            text = `${total} zadań • ${completed} ukończonych`;
        }
        
        this.counterText.textContent = text;
        
        // Pokazuj/ukrywaj przycisk czyszczenia i kontroluj jego stan
        if (completed > 0) {
            this.clearCompleted.disabled = false;
            this.clearCompleted.style.display = 'block';
        } else {
            this.clearCompleted.disabled = true;
            this.clearCompleted.style.display = 'none';
        }
    }

    // Zabezpieczenie przed XSS
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Zapisywanie do localStorage
    saveToStorage() {
        localStorage.setItem('todos', JSON.stringify(this.todos));
    }

    // Wczytywanie z localStorage
    loadFromStorage() {
        const saved = localStorage.getItem('todos');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Konwersja dat z string na Date object
                return parsed.map(todo => ({
                    ...todo,
                    createdAt: new Date(todo.createdAt)
                }));
            } catch (e) {
                console.error('Błąd przy wczytywaniu zadań:', e);
                return [];
            }
        }
        return [];
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new TodoApp();
});