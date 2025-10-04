// // js/fetch.js
// $(function() {
//     const form = $('#form');
//     const resultContainer = $('#resultContainer'); // если используешь карточки
//     const tableBody = $('#results-table tbody');   // если у тебя таблица результатов (опционально)
//
//     // История точек - новый массив для хранения всех результатов
//     const pointsHistory = loadHistoryFromStorage();
//
//     // Загрузка истории из localStorage
//     function loadHistoryFromStorage() {
//         try {
//             const saved = localStorage.getItem('pointsHistory');
//             if (saved) {
//                 const history = JSON.parse(saved);
//                 console.log('Загружена история из localStorage:', history.length, 'точек');
//                 return history;
//             }
//         } catch (e) {
//             console.error('Ошибка загрузки истории из localStorage:', e);
//         }
//         return [];
//     }
//
//     // Сохранение истории в localStorage
//     function saveHistoryToStorage() {
//         try {
//             localStorage.setItem('pointsHistory', JSON.stringify(pointsHistory));
//             console.log('История сохранена в localStorage:', pointsHistory.length, 'точек');
//         } catch (e) {
//             console.error('Ошибка сохранения истории в localStorage:', e);
//         }
//     }
//
//     // Экранируем значения перед вставкой в HTML (простая защита от XSS)
//     function escapeHtml(s) {
//         if (s == null) return '';
//         return String(s)
//             .replace(/&/g, '&amp;')
//             .replace(/</g, '&lt;')
//             .replace(/>/g, '&gt;')
//             .replace(/"/g, '&quot;')
//             .replace(/'/g, '&#x27;');
//     }
//
//     // Формируем карточку результата из объекта ответа
//     function renderResultCard(data) {
//         // ожидаем data = { x, y, r, result, time, bench }
//         const hit = data.result ? '✓' : '✗';
//         return `
//       <div class="result">
//         <div class="coord">X: ${escapeHtml(data.x)}</div>
//         <div class="coord">Y: ${escapeHtml(data.y)}</div>
//         <div class="coord">R: ${escapeHtml(data.r)}</div>
//         <div class="hit">Результат: ${escapeHtml(hit)}</div>
//         <div class="time">Время: ${escapeHtml(data.time)}</div>
//         <div class="exec">Время работы: ${escapeHtml(data.bench)} нс</div>
//       </div>
//     `;
//     }
//
//     // Добавить строку в таблицу результатов
//     function addRowToTableFromResponse(data) {
//         if (!tableBody || tableBody.length === 0) return;
//         const row = `
//       <tr>
//         <td>${escapeHtml(data.x)}</td>
//         <td>${escapeHtml(data.y)}</td>
//         <td>${escapeHtml(data.r)}</td>
//         <td>${escapeHtml(data.result ? '✓' : '✗')}</td>
//         <td>${escapeHtml(data.time)}</td>
//         <td>${escapeHtml(data.bench)}</td>
//       </tr>
//     `;
//         tableBody.prepend(row);
//     }
//
//     // Восстановление всей таблицы из истории
//     function restoreTableFromHistory() {
//         if (!tableBody || tableBody.length === 0) return;
//
//         // Очищаем таблицу
//         tableBody.empty();
//
//         // Добавляем все точки из истории (в обратном порядке, чтобы новые были сверху)
//         pointsHistory.slice().reverse().forEach(data => {
//             addRowToTableFromResponse(data);
//         });
//
//         console.log('Таблица восстановлена из истории:', pointsHistory.length, 'строк');
//     }
//
//     // Восстановление карточек результатов
//     function restoreCardsFromHistory() {
//         if (!resultContainer || resultContainer.length === 0) return;
//
//         // Очищаем контейнер
//         resultContainer.empty();
//
//         // Добавляем все карточки из истории (в обратном порядке)
//         pointsHistory.slice().reverse().forEach(data => {
//             const cardHtml = renderResultCard(data);
//             resultContainer.prepend(cardHtml);
//         });
//
//         console.log('Карточки восстановлены из истории:', pointsHistory.length, 'карточек');
//     }
//
//     // Функция для добавления точки в историю
//     function addToHistory(data) {
//         const historyItem = {
//             x: data.x,
//             y: data.y,
//             r: data.r,
//             result: data.result,
//             time: data.time,
//             bench: data.bench,
//             timestamp: new Date().toISOString()
//         };
//
//         pointsHistory.push(historyItem);
//         saveHistoryToStorage();
//
//         console.log('Точка добавлена в историю. Всего точек:', pointsHistory.length);
//     }
//
//     // Функция для получения всей истории
//     function getHistory() {
//         return pointsHistory.slice(); // возвращаем копию массива
//     }
//
//     // Функция для очистки истории
//     function clearHistory() {
//         pointsHistory.length = 0;
//         saveHistoryToStorage();
//
//         // Очищаем UI
//         if (tableBody && tableBody.length) {
//             tableBody.empty();
//         }
//         if (resultContainer && resultContainer.length) {
//             resultContainer.empty();
//         }
//
//         // Очищаем точки на графике
//         if (typeof window.plot?.clearPoints === 'function') {
//             window.plot.clearPoints();
//         }
//
//         console.log('История точек очищена');
//     }
//
//     // Функция для получения последней точки
//     function getLastPoint() {
//         return pointsHistory.length > 0 ? pointsHistory[pointsHistory.length - 1] : null;
//     }
//
//     // Функция для получения точек по определенному R
//     function getPointsByR(rValue) {
//         return pointsHistory.filter(point => point.r === rValue);
//     }
//
//     // Восстановление точек на графике
//     function restorePointsOnGraph() {
//         if (typeof window.plot?.syncWithHistory === 'function') {
//             window.plot.syncWithHistory();
//         } else if (typeof window.insertPoint === 'function') {
//             // Старая версия - добавляем точки по одной
//             pointsHistory.forEach(point => {
//                 try {
//                     insertPoint(Number(point.x), Number(point.y), Number(point.r), point.result);
//                 } catch (e) {
//                     console.warn('Ошибка восстановления точки на графике:', e);
//                 }
//             });
//         }
//         console.log('Точки восстановлены на графике:', pointsHistory.length, 'точек');
//     }
//
//     // Отправка запроса через fetch — ЖЁСТКО ожидаем JSON
//     async function sendRequest(xValue, yValue, selectedR) {
//         const url = `/fcgi-bin/WEB1_2.jar?x=${encodeURIComponent(xValue)}&y=${encodeURIComponent(yValue)}&r=${encodeURIComponent(selectedR)}`;
//         console.log('Sending request:', url);
//
//         try {
//             const resp = await fetch(url, { method: 'GET', cache: 'no-cache' });
//
//             console.log('HTTP', resp.status, resp.statusText);
//             const ctype = (resp.headers.get('Content-Type') || '').toLowerCase();
//             console.log('Content-Type:', ctype);
//
//             if (!resp.ok) {
//                 const text = await resp.text();
//                 console.error('Server returned error status:', resp.status, text);
//                 throw new Error('Server error: ' + resp.status);
//             }
//
//             // строго: если не json — считаем это ошибкой (не парсим HTML)
//             if (!ctype.includes('application/json')) {
//                 const body = await resp.text();
//                 console.error('Unexpected Content-Type, expected JSON. Body:', body);
//                 throw new Error('Unexpected response Content-Type (expected application/json).');
//             }
//
//             const data = await resp.json(); // {x,y,r,result,time,bench}
//             console.log('Parsed JSON:', data);
//
//             // Добавляем точку в историю
//             addToHistory(data);
//
//             // рисуем точку (использует глобальную insertPoint из plot.js)
//             if (typeof insertPoint === 'function') {
//                 try {
//                     insertPoint(Number(data.x), Number(data.y), Number(data.r), data.result);
//                 } catch (e) {
//                     console.warn('insertPoint failed:', e);
//                 }
//             }
//
//             // добавляем карточку/строку
//             if (resultContainer && resultContainer.length) {
//                 const cardHtml = renderResultCard(data);
//                 resultContainer.prepend(cardHtml);
//             }
//             addRowToTableFromResponse(data);
//
//             // вернём данные для возможного дальнейшего использования
//             return data;
//         } catch (err) {
//             console.error('Request failed:', err);
//             alert('Ошибка при отправке/получении данных. Смотри консоль.');
//             throw err;
//         }
//     }
//
//     // Обработка сабмита формы — используем sendRequest
//     form.on('submit', function(e) {
//         e.preventDefault();
//
//         // Используем глобальную функцию валидации, если доступна
//         let xValue, yValue, selectedR;
//
//         if (typeof window.formManager?.getFormData === 'function') {
//             const formData = window.formManager.getFormData();
//             if (!formData) return;
//             ({ x: xValue, y: yValue, r: selectedR } = formData);
//         } else {
//             // Старая версия валидации
//             xValue = parseFloat($('input[name="x"]:checked').val());
//             yValue = $('#y').val().replace(',', '.'); // оставляем строку, но сервер валидирует
//             selectedR = parseFloat($('.r-button.selected').val());
//
//             if (Number.isNaN(xValue) || xValue === undefined) {
//                 alert('Выберите X.');
//                 return;
//             }
//             if (!selectedR && selectedR !== 0) {
//                 alert('Выберите R.');
//                 return;
//             }
//         }
//
//         sendRequest(xValue, yValue, selectedR)
//             .then(() => {
//                 // обновляем график (refresh берёт новый R)
//                 if (typeof refresh === 'function') refresh(selectedR);
//             })
//             .catch(() => { /* уже обработано в sendRequest */ });
//     });
//
//     // Инициализация при загрузке
//     function initialize() {
//         // Восстанавливаем UI из истории
//         restoreTableFromHistory();
//         restoreCardsFromHistory();
//         restorePointsOnGraph();
//
//         console.log('Приложение инициализировано. Точек в истории:', pointsHistory.length);
//     }
//
//     // Делаем функции истории доступными глобально для использования в других скриптах
//     window.pointsHistoryAPI = {
//         getHistory,
//         clearHistory,
//         getLastPoint,
//         getPointsByR,
//         addToHistory,
//         saveHistoryToStorage
//     };
//
//     // Инициализируем при загрузке
//     initialize();
// });
// js/fetch.js
$(function() {
    const form = $('#form');
    const resultContainer = $('#resultContainer');
    const tableBody = $('#results-table tbody');

    // История точек - загружаем из cookies
    const pointsHistory = loadHistoryFromCookies();

    // Загрузка истории из cookies
    function loadHistoryFromCookies() {
        try {
            const cookieValue = getCookie('pointsHistory');
            if (cookieValue) {
                const history = JSON.parse(cookieValue);
                console.log('Загружена история из cookies:', history.length, 'точек');
                return history;
            }
        } catch (e) {
            console.error('Ошибка загрузки истории из cookies:', e);
        }
        return [];
    }

    // Сохранение истории в cookies
    function saveHistoryToCookies() {
        try {
            // Сохраняем на 30 дней
            setCookie('pointsHistory', JSON.stringify(pointsHistory), 30);
            console.log('История сохранена в cookies:', pointsHistory.length, 'точек');
        } catch (e) {
            console.error('Ошибка сохранения истории в cookies:', e);
        }
    }

    // Вспомогательные функции для работы с cookies
    function setCookie(name, value, days) {
        const date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        const expires = "expires=" + date.toUTCString();
        document.cookie = name + "=" + encodeURIComponent(value) + ";" + expires + ";path=/";
    }

    function getCookie(name) {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length, c.length));
        }
        return null;
    }

    function deleteCookie(name) {
        document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    }

    // Экранируем значения перед вставкой в HTML
    function escapeHtml(s) {
        if (s == null) return '';
        return String(s)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    // Формируем карточку результата из объекта ответа
    function renderResultCard(data) {
        const hit = data.result ? '✓' : '✗';
        return `
      <div class="result">
        <div class="coord">X: ${escapeHtml(data.x)}</div>
        <div class="coord">Y: ${escapeHtml(data.y)}</div>
        <div class="coord">R: ${escapeHtml(data.r)}</div>
        <div class="hit">Результат: ${escapeHtml(hit)}</div>
        <div class="time">Время: ${escapeHtml(data.time)}</div>
        <div class="exec">Время работы: ${escapeHtml(data.bench)} нс</div>
      </div>
    `;
    }

    // Добавить строку в таблицу результатов
    function addRowToTableFromResponse(data) {
        if (!tableBody || tableBody.length === 0) return;
        const row = `
      <tr>
        <td>${escapeHtml(data.x)}</td>
        <td>${escapeHtml(data.y)}</td>
        <td>${escapeHtml(data.r)}</td>
        <td>${escapeHtml(data.result ? '✓' : '✗')}</td>
        <td>${escapeHtml(data.time)}</td>
        <td>${escapeHtml(data.bench)}</td>
      </tr>
    `;
        tableBody.prepend(row);
    }

    // Восстановление всей таблицы из истории
    function restoreTableFromHistory() {
        if (!tableBody || tableBody.length === 0) return;

        tableBody.empty();

        pointsHistory.slice().reverse().forEach(data => {
            addRowToTableFromResponse(data);
        });

        console.log('Таблица восстановлена из cookies:', pointsHistory.length, 'строк');
    }

    // Восстановление карточек результатов
    function restoreCardsFromHistory() {
        if (!resultContainer || resultContainer.length === 0) return;

        resultContainer.empty();

        pointsHistory.slice().reverse().forEach(data => {
            const cardHtml = renderResultCard(data);
            resultContainer.prepend(cardHtml);
        });

        console.log('Карточки восстановлены из cookies:', pointsHistory.length, 'карточек');
    }

    // Функция для добавления точки в историю
    function addToHistory(data) {
        const historyItem = {
            x: data.x,
            y: data.y,
            r: data.r,
            result: data.result,
            time: data.time,
            bench: data.bench,
            timestamp: new Date().toISOString()
        };

        pointsHistory.push(historyItem);
        saveHistoryToCookies(); // Сохраняем в cookies

        console.log('Точка добавлена в историю. Всего точек:', pointsHistory.length);
    }

    // Функция для получения всей истории
    function getHistory() {
        return pointsHistory.slice();
    }

    // Функция для очистки истории
    function clearHistory() {
        pointsHistory.length = 0;
        saveHistoryToCookies(); // Обновляем cookies

        // Очищаем UI
        if (tableBody && tableBody.length) {
            tableBody.empty();
        }
        if (resultContainer && resultContainer.length) {
            resultContainer.empty();
        }

        // Очищаем точки на графике
        if (typeof window.plot?.clearPoints === 'function') {
            window.plot.clearPoints();
        } else if (window.points && Array.isArray(window.points)) {
            window.points.length = 0;
            if (typeof refresh === 'function') refresh(2);
        }

        console.log('История точек очищена');
    }

    // Функция для получения последней точки
    function getLastPoint() {
        return pointsHistory.length > 0 ? pointsHistory[pointsHistory.length - 1] : null;
    }

    // Функция для получения точек по определенному R
    function getPointsByR(rValue) {
        return pointsHistory.filter(point => point.r === rValue);
    }

    // Восстановление точек на графике
    function restorePointsOnGraph() {
        if (typeof window.plot?.syncWithHistory === 'function') {
            window.plot.syncWithHistory();
        } else if (typeof window.insertPoint === 'function') {
            pointsHistory.forEach(point => {
                try {
                    insertPoint(Number(point.x), Number(point.y), Number(point.r), point.result);
                } catch (e) {
                    console.warn('Ошибка восстановления точки на графике:', e);
                }
            });
        }
        console.log('Точки восстановлены на графике из cookies:', pointsHistory.length, 'точек');
    }

    // Отправка запроса через fetch
    async function sendRequest(xValue, yValue, selectedR) {
        const url = `/fcgi-bin/WEB1_2.jar?x=${encodeURIComponent(xValue)}&y=${encodeURIComponent(yValue)}&r=${encodeURIComponent(selectedR)}`;
        console.log('Sending request:', url);

        try {
            const resp = await fetch(url, { method: 'GET', cache: 'no-cache' });

            console.log('HTTP', resp.status, resp.statusText);
            const ctype = (resp.headers.get('Content-Type') || '').toLowerCase();

            if (!resp.ok) {
                const text = await resp.text();
                console.error('Server returned error status:', resp.status, text);
                throw new Error('Server error: ' + resp.status);
            }

            if (!ctype.includes('application/json')) {
                const body = await resp.text();
                console.error('Unexpected Content-Type, expected JSON. Body:', body);
                throw new Error('Unexpected response Content-Type (expected application/json).');
            }

            const data = await resp.json();
            console.log('Parsed JSON:', data);

            // Добавляем точку в историю (автоматически сохраняется в cookies)
            addToHistory(data);

            // рисуем точку
            if (typeof insertPoint === 'function') {
                try {
                    insertPoint(Number(data.x), Number(data.y), Number(data.r), data.result);
                } catch (e) {
                    console.warn('insertPoint failed:', e);
                }
            }

            // добавляем карточку/строку
            if (resultContainer && resultContainer.length) {
                const cardHtml = renderResultCard(data);
                resultContainer.prepend(cardHtml);
            }
            addRowToTableFromResponse(data);

            return data;
        } catch (err) {
            console.error('Request failed:', err);
            alert('Ошибка при отправке/получении данных. Смотри консоль.');
            throw err;
        }
    }

    // Обработка сабмита формы
    form.on('submit', function(e) {
        e.preventDefault();

        let xValue, yValue, selectedR;

        if (typeof window.formManager?.getFormData === 'function') {
            const formData = window.formManager.getFormData();
            if (!formData) return;
            ({ x: xValue, y: yValue, r: selectedR } = formData);
        } else {
            xValue = parseFloat($('input[name="x"]:checked').val());
            yValue = $('#y').val().replace(',', '.');
            selectedR = parseFloat($('.r-button.selected').val());

            if (Number.isNaN(xValue) || xValue === undefined) {
                alert('Выберите X.');
                return;
            }
            if (!selectedR && selectedR !== 0) {
                alert('Выберите R.');
                return;
            }
        }

        sendRequest(xValue, yValue, selectedR)
            .then(() => {
                if (typeof refresh === 'function') refresh(selectedR);
            })
            .catch(() => { /* уже обработано в sendRequest */ });
    });

    // Инициализация при загрузке
    function initialize() {
        // Восстанавливаем UI из cookies
        restoreTableFromHistory();
        restoreCardsFromHistory();
        restorePointsOnGraph();

        console.log('Приложение инициализировано. Точек в истории:', pointsHistory.length);
    }

    // Делаем функции истории доступными глобально
    window.pointsHistoryAPI = {
        getHistory,
        clearHistory,
        getLastPoint,
        getPointsByR,
        addToHistory,
        saveHistoryToCookies
    };

    // Добавляем функцию для ручного управления cookies
    window.cookiesManager = {
        setCookie,
        getCookie,
        deleteCookie,
        clearAllCookies: function() {
            deleteCookie('pointsHistory');
            console.log('Все cookies очищены');
        }
    };

    // Инициализируем при загрузке
    initialize();
    async function sendRange(xMin, xMax, r) {
        try {
            const params = new URLSearchParams();
            params.append("xMin", xMin);
            params.append("xMax", xMax);
            params.append("r", r);

            const response = await fetch("/fcgi-bin/WEB1_2_2.jar", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: params.toString()
            });

            const data = await response.json();
            if (response.ok) {
                console.log("Диапазон обновлён:", data);
                alert("Диапазон X обновлён, R установлен: " + r);
            } else {
                console.error("Ошибка:", data.error);
                alert("Ошибка: " + data.error);
            }
        } catch (err) {
            console.error("Сеть/сервер не отвечает:", err);
            alert("Сервер недоступен");
        }
    }

    $('#rangeForm').on('submit', function(e) {
        e.preventDefault();
        const xMin = parseFloat($('#xMin').val());
        const xMax = parseFloat($('#xMax').val());
        const r = parseFloat($('#rRange').val());

        if (Number.isNaN(xMin) || Number.isNaN(xMax) || Number.isNaN(r)) {
            alert("Введите все значения!");
            return;
        }

        sendRange(xMin, xMax, r);
    });
});