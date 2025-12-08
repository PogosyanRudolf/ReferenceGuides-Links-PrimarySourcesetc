// consultants.js - Функционал для страницы консультантов

class ConsultantsPage {
    constructor() {
        this.consultants = [];
        this.currentFilter = 'all';
        this.init();
    }

    async init() {
        await this.loadConsultants();
        this.setupFilters();
        this.setupContactButtons();
        this.setupSearch();
        this.setupAnimations();
        this.setupConsultantModal();
    }

    async loadConsultants() {
        // Загрузка данных консультантов (можно заменить на реальный API)
        this.consultants = [
            {
                id: 1,
                name: "Dr. Alexander Petrov",
                title: "Science & Research Director",
                expertise: ["Biotechnology", "Genetics", "Bioinformatics", "Research Methods"],
                category: "science",
                experience: 15,
                publications: 50,
                projects: 100,
                description: "15+ years experience in academic research and scientific consulting. Published over 50 peer-reviewed papers.",
                available: true
            },
            // ... остальные консультанты
        ];

        this.renderConsultants();
    }

    renderConsultants() {
        const container = document.querySelector('.consultants-grid');
        if (!container) return;

        container.innerHTML = this.consultants
            .filter(consultant => this.currentFilter === 'all' || consultant.category === this.currentFilter)
            .map(consultant => this.createConsultantCard(consultant))
            .join('');
    }

    createConsultantCard(consultant) {
        return `
            <div class="consultant-card" data-id="${consultant.id}" data-category="${consultant.category}">
                <div class="consultant-photo">${this.getAvatar(consultant.name)}</div>
                <div class="consultant-info">
                    <h3>${consultant.name}</h3>
                    <div class="consultant-title">${consultant.title}</div>
                    
                    <div class="expertise-tags">
                        ${consultant.expertise.map(tag => `<span class="expertise-tag">${tag}</span>`).join('')}
                    </div>
                    
                    <p class="consultant-description">${consultant.description}</p>
                    
                    <div class="consultant-stats">
                        <div class="stat-item">
                            <span class="stat-value">${consultant.experience}+</span>
                            <span class="stat-label">Years</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${consultant.publications}+</span>
                            <span class="stat-label">Publications</span>
                        </div>
                        <div class="stat-item">
                            <span class="stat-value">${consultant.projects}+</span>
                            <span class="stat-label">Projects</span>
                        </div>
                    </div>
                    
                    <button class="contact-btn" data-consultant-id="${consultant.id}">
                        Contact Expert
                    </button>
                </div>
            </div>
        `;
    }

    getAvatar(name) {
        // Генерация инициалов для аватара
        const initials = name.split(' ').map(n => n[0]).join('');
        return `<span class="avatar-initials">${initials}</span>`;
    }

    setupFilters() {
        const filterButtons = document.querySelectorAll('.filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.currentFilter = button.dataset.filter;
                
                // Обновляем активную кнопку
                filterButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Применяем фильтр
                this.applyFilter();
            });
        });
    }

    applyFilter() {
        const cards = document.querySelectorAll('.consultant-card');
        cards.forEach(card => {
            if (this.currentFilter === 'all' || card.dataset.category === this.currentFilter) {
                card.style.display = 'block';
                this.animateCard(card, 'in');
            } else {
                this.animateCard(card, 'out');
            }
        });
    }

    animateCard(card, direction) {
        if (direction === 'in') {
            card.style.animation = 'slideInUp 0.5s ease forwards';
        } else {
            card.style.animation = 'fadeOut 0.3s ease forwards';
            setTimeout(() => {
                card.style.display = 'none';
                card.style.animation = '';
            }, 300);
        }
    }

    setupContactButtons() {
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('contact-btn')) {
                const consultantId = e.target.dataset.consultantId;
                this.openContactModal(consultantId);
            }
        });
    }

    openContactModal(consultantId) {
        const consultant = this.consultants.find(c => c.id == consultantId);
        if (!consultant) return;

        const modal = document.createElement('div');
        modal.className = 'consultant-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <button class="modal-close">&times;</button>
                <h3>Contact ${consultant.name}</h3>
                <form id="consultantContactForm">
                    <input type="hidden" name="consultantId" value="${consultantId}">
                    <div class="form-group">
                        <label>Your Name</label>
                        <input type="text" name="name" required>
                    </div>
                    <div class="form-group">
                        <label>Your Email</label>
                        <input type="email" name="email" required>
                    </div>
                    <div class="form-group">
                        <label>Subject</label>
                        <input type="text" name="subject" value="Consultation with ${consultant.name}" required>
                    </div>
                    <div class="form-group">
                        <label>Message</label>
                        <textarea name="message" required></textarea>
                    </div>
                    <button type="submit">Send Request</button>
                </form>
            </div>
        `;

        document.body.appendChild(modal);
        this.setupModalEvents(modal, consultantId);
    }

    setupModalEvents(modal, consultantId) {
        const closeBtn = modal.querySelector('.modal-close');
        const form = modal.querySelector('#consultantContactForm');

        closeBtn.addEventListener('click', () => modal.remove());
        modal.addEventListener('click', (e) => {
            if (e.target === modal) modal.remove();
        });

        form.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitConsultantRequest(new FormData(form), consultantId);
            modal.remove();
        });
    }

    async submitConsultantRequest(formData, consultantId) {
        try {
            const response = await fetch('/api/consultant-request', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(Object.fromEntries(formData))
            });

            if (response.ok) {
                window.app.showMessage('success', 'Consultation request sent successfully!');
            }
        } catch (error) {
            window.app.showMessage('error', 'Error sending request. Please try again.');
        }
    }

    setupSearch() {
        const searchInput = document.getElementById('consultantSearch');
        if (!searchInput) return;

        searchInput.addEventListener('input', this.debounce(() => {
            this.filterBySearch(searchInput.value.toLowerCase());
        }, 300));
    }

    filterBySearch(query) {
        const cards = document.querySelectorAll('.consultant-card');
        cards.forEach(card => {
            const consultant = this.consultants.find(c => c.id == card.dataset.id);
            if (!consultant) return;

            const matches = consultant.name.toLowerCase().includes(query) ||
                           consultant.title.toLowerCase().includes(query) ||
                           consultant.expertise.some(e => e.toLowerCase().includes(query));

            if (matches && (this.currentFilter === 'all' || consultant.category === this.currentFilter)) {
                card.style.display = 'block';
                this.highlightCard(card, query);
            } else {
                card.style.display = 'none';
            }
        });
    }

    highlightCard(card, query) {
        if (!query) return;

        const elements = card.querySelectorAll('h3, .consultant-title, .expertise-tag');
        elements.forEach(element => {
            const html = element.textContent;
            const highlighted = html.replace(
                new RegExp(query, 'gi'),
                match => `<mark>${match}</mark>`
            );
            if (highlighted !== html) {
                element.innerHTML = highlighted;
            }
        });
    }

    setupAnimations() {
        // Анимация карточек при скролле
        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry, index) => {
                if (entry.isIntersecting) {
                    setTimeout(() => {
                        entry.target.classList.add('animate-in');
                    }, index * 100);
                }
            });
        }, {
            threshold: 0.1
        });

        document.querySelectorAll('.consultant-card').forEach(card => {
            observer.observe(card);
        });
    }

    setupConsultantModal() {
        // Модальное окно с детальной информацией
        document.addEventListener('click', (e) => {
            const card = e.target.closest('.consultant-card');
            if (card && !e.target.classList.contains('contact-btn')) {
                const consultantId = card.dataset.id;
                this.showConsultantDetails(consultantId);
            }
        });
    }

    showConsultantDetails(consultantId) {
        // Реализация модального окна с детальной информацией
        console.log('Showing details for consultant:', consultantId);
    }

    debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
}

// Инициализация страницы консультантов
if (document.querySelector('.consultants-grid')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.consultantsPage = new ConsultantsPage();
    });
}
