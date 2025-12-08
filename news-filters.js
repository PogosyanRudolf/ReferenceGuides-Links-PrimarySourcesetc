// news-filters.js - Фильтрация новостей на странице Culture News

class NewsFilter {
    constructor() {
        this.currentCategory = 'all';
        this.newsCards = document.querySelectorAll('.news-card');
        this.categoryButtons = document.querySelectorAll('.category-btn');
        this.init();
    }

    init() {
        this.setupCategoryButtons();
        this.setupSearch();
        this.setupLazyLoading();
        this.setupAnimations();
    }

    setupCategoryButtons() {
        this.categoryButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                e.preventDefault();
                this.filterByCategory(button.dataset.category);
            });
        });
    }

    filterByCategory(category) {
        // Обновляем активную кнопку
        this.categoryButtons.forEach(btn => btn.classList.remove('active'));
        const activeBtn = document.querySelector(`[data-category="${category}"]`);
        if (activeBtn) activeBtn.classList.add('active');

        // Фильтруем карточки
        this.newsCards.forEach(card => {
            if (category === 'all' || card.dataset.category === category) {
                card.style.display = 'block';
                this.animateCardIn(card);
            } else {
                this.animateCardOut(card);
            }
        });

        this.currentCategory = category;
        
        // Сохраняем состояние в URL
        this.updateURL(category);
    }

    animateCardIn(card) {
        card.style.animation = 'none';
        setTimeout(() => {
            card.style.animation = 'fadeIn 0.5s ease forwards';
        }, 10);
    }

    animateCardOut(card) {
        card.style.animation = 'fadeOut 0.3s ease forwards';
        setTimeout(() => {
            card.style.display = 'none';
            card.style.animation = '';
        }, 300);
    }

    setupSearch() {
        const searchInput = document.getElementById('newsSearch');
        if (!searchInput) return;

        searchInput.addEventListener('input', this.debounce(() => {
            this.filterBySearch(searchInput.value.toLowerCase());
        }, 300));
    }

    filterBySearch(query) {
        this.newsCards.forEach(card => {
            const title = card.querySelector('.news-title')?.textContent.toLowerCase() || '';
            const excerpt = card.querySelector('.news-excerpt')?.textContent.toLowerCase() || '';
            const category = card.dataset.category;
            
            const matchesSearch = title.includes(query) || excerpt.includes(query);
            const matchesCategory = this.currentCategory === 'all' || category === this.currentCategory;
            
            if (matchesSearch && matchesCategory) {
                card.style.display = 'block';
                this.highlightText(card, query);
            } else {
                card.style.display = 'none';
            }
        });
    }

    highlightText(card, query) {
        if (!query) return;

        const elements = card.querySelectorAll('.news-title, .news-excerpt');
        elements.forEach(element => {
            const html = element.textContent;
            const highlighted = html.replace(
                new RegExp(query, 'gi'),
                match => `<mark class="search-highlight">${match}</mark>`
            );
            element.innerHTML = highlighted;
        });
    }

    setupLazyLoading() {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target.querySelector('img');
                    if (img && img.dataset.src) {
                        img.src = img.dataset.src;
                        img.removeAttribute('data-src');
                    }
                    observer.unobserve(entry.target);
                }
            });
        }, {
            rootMargin: '50px'
        });

        this.newsCards.forEach(card => {
            observer.observe(card);
        });
    }

    setupAnimations() {
        // Добавляем анимации при скролле
        const animateOnScroll = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animate-on-scroll');
                }
            });
        });

        document.querySelectorAll('.news-card, .event-card').forEach(card => {
            animateOnScroll.observe(card);
        });
    }

    updateURL(category) {
        if (window.history.replaceState) {
            const url = new URL(window.location);
            if (category === 'all') {
                url.searchParams.delete('category');
            } else {
                url.searchParams.set('category', category);
            }
            window.history.replaceState({}, '', url);
        }
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

// Инициализация при загрузке страницы новостей
if (document.querySelector('.news-grid')) {
    document.addEventListener('DOMContentLoaded', () => {
        window.newsFilter = new NewsFilter();
        
        // Загружаем категорию из URL
        const urlParams = new URLSearchParams(window.location.search);
        const categoryFromURL = urlParams.get('category');
        if (categoryFromURL) {
            window.newsFilter.filterByCategory(categoryFromURL);
        }
    });
}
