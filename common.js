// common.js - Общие функции для всего сайта

// Конфигурация сайта
const SITE_CONFIG = {
    defaultLanguage: 'en',
    languages: ['en', 'ru', 'hy', 'de', 'es', 'fr'],
    languageNames: {
        en: '🇬🇧 English',
        ru: '🇷🇺 Русский',
        hy: '🇦🇲 Հայերեն',
        de: '🇩🇪 Deutsch',
        es: '🇪🇸 Español',
        fr: '🇫🇷 Français'
    },
    apiEndpoints: {
        contact: '/api/contact',
        newsletter: '/api/newsletter'
    }
};

// Основной класс приложения
class StandardReferenceApp {
    constructor() {
        this.currentLanguage = SITE_CONFIG.defaultLanguage;
        this.isMobileMenuOpen = false;
        this.init();
    }

    init() {
        this.setupLanguage();
        this.setupMobileMenu();
        this.setupEventListeners();
        this.setupAccessibility();
        this.loadContent();
    }

    // Настройка языка
    setupLanguage() {
        const savedLanguage = localStorage.getItem('preferredLanguage');
        this.currentLanguage = savedLanguage || SITE_CONFIG.defaultLanguage;
        this.updateLanguageSelectors();
        this.loadTranslations();
    }

    updateLanguageSelectors() {
        // Обновляем все селекторы языка на странице
        const selectors = document.querySelectorAll('.language-dropdown, #languageSelect, #mobileLanguageSelect');
        selectors.forEach(selector => {
            if (selector) {
                selector.value = this.currentLanguage;
            }
        });
    }

    // Загрузка переводов
    async loadTranslations() {
        try {
            // Если файл translations.js уже загружен через script tag
            if (typeof translations !== 'undefined') {
                this.translations = translations;
                this.applyTranslations();
            } else {
                // Динамическая загрузка файла переводов
                const response = await fetch('translations.js');
                const text = await response.text();
                // Извлекаем объект translations из JavaScript файла
                const translationsMatch = text.match(/const translations = (\{.*?\});/s);
                if (translationsMatch) {
                    this.translations = JSON.parse(translationsMatch[1].replace(/(\w+):/g, '"$1":'));
                    this.applyTranslations();
                }
            }
        } catch (error) {
            console.error('Error loading translations:', error);
            this.translations = {};
        }
    }

    // Применение переводов ко всем элементам
    applyTranslations() {
        if (!this.translations || !this.translations[this.currentLanguage]) return;

        const langData = this.translations[this.currentLanguage];
        
        // Обновляем текст элементов с data-translate
        document.querySelectorAll('[data-translate]').forEach(element => {
            const key = element.getAttribute('data-translate');
            if (langData[key]) {
                if (element.tagName === 'INPUT' || element.tagName === 'TEXTAREA') {
                    element.placeholder = langData[key];
                } else if (element.tagName === 'IMG') {
                    element.alt = langData[key];
                } else {
                    element.textContent = langData[key];
                }
            }
        });

        // Обновляем атрибут lang
        document.documentElement.lang = this.currentLanguage;

        // Обновляем заголовок страницы
        this.updatePageTitle(langData);
    }

    updatePageTitle(langData) {
        const pageTitle = document.querySelector('title');
        if (!pageTitle) return;

        const titleKey = pageTitle.getAttribute('data-translate');
        if (titleKey && langData[titleKey] && langData['siteTitle']) {
            document.title = `${langData[titleKey]} - ${langData['siteTitle']}`;
        }
    }

    // Настройка мобильного меню
    setupMobileMenu() {
        this.mobileMenuBtn = document.getElementById('mobileMenuBtn');
        this.mobileNav = document.getElementById('mobileNav');

        if (this.mobileMenuBtn && this.mobileNav) {
            this.mobileMenuBtn.addEventListener('click', () => this.toggleMobileMenu());
            
            // Закрытие меню при клике вне его
            document.addEventListener('click', (e) => {
                if (this.isMobileMenuOpen && 
                    !e.target.closest('nav') && 
                    !e.target.closest('.mobile-nav')) {
                    this.closeMobileMenu();
                }
            });

            // Закрытие меню на Escape
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && this.isMobileMenuOpen) {
                    this.closeMobileMenu();
                }
            });
        }
    }

    toggleMobileMenu() {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        if (this.mobileNav) {
            this.mobileNav.classList.toggle('active');
        }
        this.mobileMenuBtn.setAttribute('aria-expanded', this.isMobileMenuOpen);
    }

    closeMobileMenu() {
        this.isMobileMenuOpen = false;
        if (this.mobileNav) {
            this.mobileNav.classList.remove('active');
        }
        if (this.mobileMenuBtn) {
            this.mobileMenuBtn.setAttribute('aria-expanded', 'false');
        }
    }

    // Настройка обработчиков событий
    setupEventListeners() {
        // Обработчики изменения языка
        document.addEventListener('change', (e) => {
            if (e.target.classList.contains('language-dropdown') || 
                e.target.id === 'languageSelect' || 
                e.target.id === 'mobileLanguageSelect') {
                this.changeLanguage(e.target.value);
            }
        });

        // Обработчики форм
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'contactForm') {
                e.preventDefault();
                this.handleContactForm(e.target);
            }
            if (e.target.classList.contains('newsletter-form')) {
                e.preventDefault();
                this.handleNewsletterForm(e.target);
            }
        });

        // Ресайз окна
        window.addEventListener('resize', () => this.handleResize());
    }

    // Изменение языка
    changeLanguage(lang) {
        if (SITE_CONFIG.languages.includes(lang)) {
            this.currentLanguage = lang;
            localStorage.setItem('preferredLanguage', lang);
            this.updateLanguageSelectors();
            this.applyTranslations();
            
            // Обновляем URL для SEO (если нужно)
            this.updateLanguageInURL(lang);
        }
    }

    updateLanguageInURL(lang) {
        if (window.history.replaceState) {
            const url = new URL(window.location);
            url.searchParams.set('lang', lang);
            window.history.replaceState({}, '', url);
        }
    }

    // Обработка формы контактов
    async handleContactForm(form) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Валидация
        if (!this.validateForm(data)) {
            this.showMessage('error', 'Please fill all required fields correctly');
            return;
        }

        try {
            // Показать индикатор загрузки
            const submitBtn = form.querySelector('[type="submit"]');
            const originalText = submitBtn.textContent;
            submitBtn.textContent = 'Sending...';
            submitBtn.disabled = true;

            // Отправка данных
            const response = await fetch(SITE_CONFIG.apiEndpoints.contact, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                this.showMessage('success', 'Message sent successfully!');
                form.reset();
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            this.showMessage('error', 'Error sending message. Please try again.');
        } finally {
            // Восстановить кнопку
            if (submitBtn) {
                submitBtn.textContent = originalText;
                submitBtn.disabled = false;
            }
        }
    }

    // Обработка формы подписки
    async handleNewsletterForm(form) {
        const emailInput = form.querySelector('input[type="email"]');
        const email = emailInput.value;

        if (!this.validateEmail(email)) {
            this.showMessage('error', 'Please enter a valid email address');
            return;
        }

        try {
            const response = await fetch(SITE_CONFIG.apiEndpoints.newsletter, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            if (response.ok) {
                this.showMessage('success', 'Successfully subscribed!');
                form.reset();
            }
        } catch (error) {
            this.showMessage('error', 'Subscription failed. Please try again.');
        }
    }

    // Валидация
    validateForm(data) {
        return Object.values(data).every(value => value && value.trim() !== '');
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    // Показать сообщение
    showMessage(type, text) {
        // Удалить существующие сообщения
        const existingMessage = document.querySelector('.site-message');
        if (existingMessage) existingMessage.remove();

        // Создать новое сообщение
        const message = document.createElement('div');
        message.className = `site-message site-message-${type}`;
        message.textContent = text;
        message.setAttribute('role', 'alert');

        // Стили для сообщения
        message.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 15px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 600;
            z-index: 9999;
            animation: slideIn 0.3s ease;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        `;

        if (type === 'success') {
            message.style.background = 'linear-gradient(135deg, #2c822c, #1a5d1a)';
        } else {
            message.style.background = 'linear-gradient(135deg, #dc3545, #c82333)';
        }

        document.body.appendChild(message);

        // Удалить через 5 секунд
        setTimeout(() => {
            message.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 5000);
    }

    // Обработка ресайза
    handleResize() {
        if (window.innerWidth > 768 && this.isMobileMenuOpen) {
            this.closeMobileMenu();
        }
    }

    // Настройка accessibility
    setupAccessibility() {
        // Добавляем aria-label для кнопок без текста
        document.querySelectorAll('button[aria-label=""]').forEach(button => {
            if (!button.textContent.trim()) {
                const icon = button.querySelector('span[class*="icon"]') || button.innerHTML;
                if (icon.includes('☰')) button.setAttribute('aria-label', 'Menu');
                if (icon.includes('🔍')) button.setAttribute('aria-label', 'Search');
            }
        });

        // Пропускаем ссылки для навигации с клавиатуры
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-to-content';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 0;
            background: #1a5d1a;
            color: white;
            padding: 10px;
            z-index: 9999;
        `;
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '0';
        });
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });

        document.body.insertBefore(skipLink, document.body.firstChild);
    }

    // Загрузка контента
    async loadContent() {
        // Здесь может быть загрузка динамического контента
        // Например, новостей, событий и т.д.
        await this.loadNews();
        await this.loadEvents();
    }

    async loadNews() {
        // Загрузка новостей (заглушка)
        console.log('Loading news...');
    }

    async loadEvents() {
        // Загрузка событий (заглушка)
        console.log('Loading events...');
    }

    // Вспомогательные функции
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

    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func(...args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
}

// Инициализация приложения при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.app = new StandardReferenceApp();
    
    // Добавляем CSS анимации для сообщений
    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .skip-to-content:focus {
            top: 0 !important;
        }
        
        /* Анимации для карточек */
        .fade-in {
            animation: fadeIn 0.5s ease;
        }
        
        @keyframes fadeIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
    `;
    document.head.appendChild(style);
});

// Глобальные утилиты
window.StandardReferenceUtils = {
    formatDate(date) {
        return new Date(date).toLocaleDateString(window.app.currentLanguage, {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
};
