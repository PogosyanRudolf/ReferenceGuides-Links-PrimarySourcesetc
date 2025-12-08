// forms.js - Обработка и валидация форм

class FormHandler {
    constructor() {
        this.forms = new Map();
        this.init();
    }

    init() {
        this.setupFormValidation();
        this.setupFileUploads();
        this.setupCharacterCounters();
        this.setupAutoSave();
    }

    setupFormValidation() {
        // Добавляем валидацию для всех форм
        document.querySelectorAll('form').forEach(form => {
            this.setupForm(form);
        });

        // Динамические формы
        document.addEventListener('submit', (e) => {
            if (e.target.tagName === 'FORM') {
                this.handleFormSubmit(e.target);
            }
        });
    }

    setupForm(form) {
        const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
        this.forms.set(formId, {
            element: form,
            isValid: false,
            data: {}
        });

        // Добавляем валидацию для полей
        const inputs = form.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            this.setupInputValidation(input, formId);
        });

        // Добавляем обработчик сброса
        form.addEventListener('reset', () => {
            this.resetForm(formId);
        });
    }

    setupInputValidation(input, formId) {
        const validate = () => {
            this.validateInput(input, formId);
        };

        input.addEventListener('blur', validate);
        input.addEventListener('input', this.debounce(validate, 500));

        // Специальная валидация для email
        if (input.type === 'email') {
            input.addEventListener('input', () => {
                this.validateEmail(input);
            });
        }

        // Специальная валидация для телефона
        if (input.type === 'tel') {
            input.addEventListener('input', () => {
                this.formatPhoneNumber(input);
            });
        }
    }

    validateInput(input, formId) {
        const value = input.value.trim();
        const isValid = this.checkValidity(input, value);
        
        this.updateInputState(input, isValid);
        this.updateFormState(formId);
        
        return isValid;
    }

    checkValidity(input, value) {
        if (input.required && !value) return false;
        
        switch (input.type) {
            case 'email':
                return this.validateEmailFormat(value);
            case 'tel':
                return this.validatePhoneFormat(value);
            case 'url':
                return this.validateUrlFormat(value);
            default:
                if (input.pattern) {
                    const regex = new RegExp(input.pattern);
                    return regex.test(value);
                }
                return true;
        }
    }

    validateEmailFormat(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhoneFormat(phone) {
        // Базовая валидация телефона
        const digits = phone.replace(/\D/g, '');
        return digits.length >= 10;
    }

    validateUrlFormat(url) {
        try {
            new URL(url);
            return true;
        } catch {
            return false;
        }
    }

    updateInputState(input, isValid) {
        if (isValid) {
            input.classList.remove('invalid');
            input.classList.add('valid');
        } else {
            input.classList.remove('valid');
            input.classList.add('invalid');
        }
    }

    updateFormState(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        const inputs = formData.element.querySelectorAll('input, textarea, select');
        const allValid = Array.from(inputs).every(input => {
            if (!input.required) return true;
            return !input.classList.contains('invalid');
        });

        formData.isValid = allValid;
        
        // Обновляем состояние кнопки отправки
        const submitBtn = formData.element.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = !allValid;
        }
    }

    async handleFormSubmit(form) {
        const formId = form.id || Array.from(this.forms.keys())
            .find(key => this.forms.get(key).element === form);
        
        if (!formId) return;

        const formData = this.forms.get(formId);
        if (!formData.isValid) {
            this.showFormError(form, 'Please fix the errors before submitting');
            return;
        }

        // Сбор данных формы
        const data = new FormData(form);
        const jsonData = Object.fromEntries(data);
        
        try {
            // Показываем индикатор загрузки
            this.showLoading(form, true);

            // Отправка данных
            const response = await fetch(form.action || '/api/submit', {
                method: form.method || 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(jsonData)
            });

            if (response.ok) {
                this.showFormSuccess(form, 'Form submitted successfully!');
                form.reset();
            } else {
                throw new Error('Server error');
            }
        } catch (error) {
            this.showFormError(form, 'Error submitting form. Please try again.');
        } finally {
            this.showLoading(form, false);
        }
    }

    showLoading(form, isLoading) {
        const submitBtn = form.querySelector('[type="submit"]');
        if (!submitBtn) return;

        const originalText = submitBtn.textContent;
        
        if (isLoading) {
            submitBtn.innerHTML = '<span class="spinner"></span> Sending...';
            submitBtn.disabled = true;
        } else {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    showFormError(form, message) {
        // Удаляем старые сообщения об ошибках
        const oldErrors = form.querySelectorAll('.form-error-message');
        oldErrors.forEach(error => error.remove());

        // Создаем новое сообщение об ошибке
        const errorDiv = document.createElement('div');
        errorDiv.className = 'form-error-message';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            background: #fee;
            border: 1px solid #c33;
            color: #c33;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-weight: 600;
        `;

        // Вставляем перед кнопкой отправки
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            form.insertBefore(errorDiv, submitBtn);
        } else {
            form.appendChild(errorDiv);
        }

        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    showFormSuccess(form, message) {
        // Удаляем старые сообщения об успехе
        const oldSuccess = form.querySelectorAll('.form-success-message');
        oldSuccess.forEach(success => success.remove());

        // Создаем новое сообщение об успехе
        const successDiv = document.createElement('div');
        successDiv.className = 'form-success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #efe;
            border: 1px solid #3c3;
            color: #3c3;
            padding: 10px;
            margin: 10px 0;
            border-radius: 4px;
            font-weight: 600;
        `;

        // Вставляем перед кнопкой отправки
        const submitBtn = form.querySelector('[type="submit"]');
        if (submitBtn) {
            form.insertBefore(successDiv, submitBtn);
        } else {
            form.appendChild(successDiv);
        }

        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }

    resetForm(formId) {
        const formData = this.forms.get(formId);
        if (!formData) return;

        // Сбрасываем классы валидации
        const inputs = formData.element.querySelectorAll('input, textarea, select');
        inputs.forEach(input => {
            input.classList.remove('valid', 'invalid');
        });

        // Сбрасываем состояние формы
        formData.isValid = false;
        formData.data = {};

        // Включаем кнопку отправки
        const submitBtn = formData.element.querySelector('[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
        }
    }

    setupFileUploads() {
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.addEventListener('change', (e) => {
                this.handleFileUpload(e.target);
            });
        });
    }

    handleFileUpload(input) {
        const files = input.files;
        if (!files.length) return;

        // Проверка размера файла (максимум 10MB)
        const maxSize = 10 * 1024 * 1024; // 10MB
        for (let file of files) {
            if (file.size > maxSize) {
                this.showFileError(input, 'File size exceeds 10MB limit');
                input.value = '';
                return;
            }

            // Проверка типа файла
            const allowedTypes = [
                'image/jpeg', 'image/png', 'image/gif',
                'application/pdf', 'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
            ];

            if (!allowedTypes.includes(file.type)) {
                this.showFileError(input, 'File type not allowed');
                input.value = '';
                return;
            }
        }

        // Показываем информацию о загруженных файлах
        this.showFileInfo(input, files);
    }

    showFileInfo(input, files) {
        // Удаляем старую информацию
        const oldInfo = input.nextElementSibling;
        if (oldInfo && oldInfo.classList.contains('file-info')) {
            oldInfo.remove();
        }

        const fileInfo = document.createElement('div');
        fileInfo.className = 'file-info';
        fileInfo.style.cssText = `
            font-size: 0.9em;
            color: #666;
            margin-top: 5px;
        `;

        if (files.length === 1) {
            fileInfo.textContent = `File: ${files[0].name} (${this.formatFileSize(files[0].size)})`;
        } else {
            fileInfo.textContent = `${files.length} files selected`;
        }

        input.insertAdjacentElement('afterend', fileInfo);
    }

    showFileError(input, message) {
        // Удаляем старую информацию
        const oldInfo = input.nextElementSibling;
        if (oldInfo && oldInfo.classList.contains('file-info')) {
            oldInfo.remove();
        }

        const errorDiv = document.createElement('div');
        errorDiv.className = 'file-error';
        errorDiv.textContent = message;
        errorDiv.style.cssText = `
            font-size: 0.9em;
            color: #c33;
            margin-top: 5px;
        `;

        input.insertAdjacentElement('afterend', errorDiv);

        // Автоматически скрываем через 5 секунд
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    setupCharacterCounters() {
        document.querySelectorAll('textarea[maxlength], input[maxlength]').forEach(input => {
            this.setupCharacterCounter(input);
        });
    }

    setupCharacterCounter(input) {
        const maxLength = input.getAttribute('maxlength');
        if (!maxLength) return;

        // Создаем счетчик символов
        const counter = document.createElement('div');
        counter.className = 'char-counter';
        counter.style.cssText = `
            font-size: 0.8em;
            color: #666;
            text-align: right;
            margin-top: 2px;
        `;

        const updateCounter = () => {
            const currentLength = input.value.length;
            const remaining = maxLength - currentLength;
            
            counter.textContent = `${currentLength}/${maxLength}`;
            
            if (remaining < 0) {
                counter.style.color = '#c33';
            } else if (remaining < 20) {
                counter.style.color = '#f90';
            } else {
                counter.style.color = '#666';
            }
        };

        input.addEventListener('input', updateCounter);
        updateCounter();

        input.insertAdjacentElement('afterend', counter);
    }

    setupAutoSave() {
        // Автосохранение для длинных форм
        document.querySelectorAll('form[data-autosave]').forEach(form => {
            this.setupAutoSaveForForm(form);
        });
    }

    setupAutoSaveForForm(form) {
        const formId = form.id || `form-${Math.random().toString(36).substr(2, 9)}`;
        const storageKey = `autosave_${formId}`;
        
        // Загружаем сохраненные данные
        const savedData = localStorage.getItem(storageKey);
        if (savedData) {
            try {
                const data = JSON.parse(savedData);
                this.restoreFormData(form, data);
            } catch (e) {
                console.error('Error restoring form data:', e);
            }
        }
        
        // Сохраняем данные при изменении
        const saveData = this.debounce(() => {
            const data = this.collectFormData(form);
            localStorage.setItem(storageKey, JSON.stringify(data));
            
            // Показываем индикатор сохранения
            this.showAutoSaveIndicator(form, 'Draft saved');
        }, 1000);
        
        form.addEventListener('input', saveData);
        
        // Очищаем сохраненные данные при успешной отправке
        form.addEventListener('submit', () => {
            localStorage.removeItem(storageKey);
        });
    }

    collectFormData(form) {
        const data = {};
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (input.type === 'checkbox' || input.type === 'radio') {
                data[input.name] = input.checked;
            } else {
                data[input.name] = input.value;
            }
        });
        
        return data;
    }

    restoreFormData(form, data) {
        const inputs = form.querySelectorAll('input, textarea, select');
        
        inputs.forEach(input => {
            if (data[input.name] !== undefined) {
                if (input.type === 'checkbox' || input.type === 'radio') {
                    input.checked = data[input.name];
                } else {
                    input.value = data[input.name];
                }
            }
        });
    }

    showAutoSaveIndicator(form, message) {
        // Удаляем старый индикатор
        const oldIndicator = form.querySelector('.autosave-indicator');
        if (oldIndicator) oldIndicator.remove();
        
        // Создаем новый индикатор
        const indicator = document.createElement('div');
        indicator.className = 'autosave-indicator';
        indicator.textContent = message;
        indicator.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: #333;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 0.9em;
            opacity: 0;
            transition: opacity 0.3s;
            z-index: 9999;
        `;
        
        document.body.appendChild(indicator);
        
        // Показываем индикатор
        setTimeout(() => {
            indicator.style.opacity = '1';
        }, 10);
        
        // Скрываем через 2 секунды
        setTimeout(() => {
            indicator.style.opacity = '0';
            setTimeout(() => {
                indicator.remove();
            }, 300);
        }, 2000);
    }

    validateEmail(input) {
        const value = input.value.trim();
        if (!value) return true;
        
        const isValid = this.validateEmailFormat(value);
        this.updateInputState(input, isValid);
        
        return isValid;
    }

    formatPhoneNumber(input) {
        let value = input.value.replace(/\D/g, '');
        
        if (value.length > 0) {
            value = value.match(/.{1,3}/g).join(' ');
        }
        
        input.value = value;
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

// Добавляем стили для спиннера
const addFormStyles = () => {
    const style = document.createElement('style');
    style.textContent = `
        .spinner {
            display: inline-block;
            width: 16px;
            height: 16px;
            border: 2px solid #f3f3f3;
            border-top: 2px solid #1a5d1a;
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin-right: 8px;
            vertical-align: middle;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        input.valid, textarea.valid, select.valid {
            border-color: #3c3 !important;
            background-color: #efe !important;
        }
        
        input.invalid, textarea.invalid, select.invalid {
            border-color: #c33 !important;
            background-color: #fee !important;
        }
    `;
    document.head.appendChild(style);
};

// Инициализация обработчика форм при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    addFormStyles();
    window.formHandler = new FormHandler();
    
    // Глобальные функции для работы с формами
    window.StandardReferenceForms = {
        // Показать форму
        showForm(formSelector) {
            const form = document.querySelector(formSelector);
            if (form) {
                form.style.display = 'block';
                form.scrollIntoView({ behavior: 'smooth' });
            }
        },
        
        // Скрыть форму
        hideForm(formSelector) {
            const form = document.querySelector(formSelector);
            if (form) {
                form.style.display = 'none';
            }
        },
        
        // Сбросить форму
        resetForm(formSelector) {
            const form = document.querySelector(formSelector);
            if (form) {
                form.reset();
                if (window.formHandler) {
                    const formId = form.id || Array.from(window.formHandler.forms.keys())
                        .find(key => window.formHandler.forms.get(key).element === form);
                    if (formId) {
                        window.formHandler.resetForm(formId);
                    }
                }
            }
        },
        
        // Получить данные формы
        getFormData(formSelector) {
            const form = document.querySelector(formSelector);
            if (!form) return null;
            
            const data = new FormData(form);
            return Object.fromEntries(data);
        },
        
        // Проверить валидность формы
        validateForm(formSelector) {
            const form = document.querySelector(formSelector);
            if (!form || !window.formHandler) return false;
            
            const formId = form.id || Array.from(window.formHandler.forms.keys())
                .find(key => window.formHandler.forms.get(key).element === form);
            
            if (!formId) return false;
            
            const formData = window.formHandler.forms.get(formId);
            return formData ? formData.isValid : false;
        }
    };
});
