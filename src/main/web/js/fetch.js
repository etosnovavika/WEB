
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

    // Восстановление результатов
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

    function clearHistory() {
        console.group('Очистка истории');

        // Очищаем массив точек и сохраняем пустое состояние в cookies
        pointsHistory.length = 0;
        saveHistoryToCookies();

        // Удаляем сохранённый диапазон из localStorage
        localStorage.removeItem('lastRange');
        console.log('lastRange удалён из localStorage');

        // Очищаем таблицу и карточки
        if (tableBody && tableBody.length) {
            tableBody.empty();
            console.log('Таблица результатов очищена');
        }
        if (resultContainer && resultContainer.length) {
            resultContainer.empty();
            console.log('Карточки очищены');
        }

        // Удаляем точки с графика
        if (typeof window.plot?.clearPoints === 'function') {
            window.plot.clearPoints();
            console.log('Точки удалены через plot.clearPoints()');
        } else if (window.points && Array.isArray(window.points)) {
            window.points.length = 0;
            console.log('Точки удалены из window.points');
        }

        //перерисовываем график
        const lastR = (() => {
            try {
                const stored = localStorage.getItem('lastRange');
                return stored ? JSON.parse(stored).r : 1;
            } catch {
                return 1;
            }
        })();

        if (typeof window.refresh === 'function') {
            refresh(lastR);
            console.log('График перерисован после очистки');
        }


        console.log('История точек полностью очищена');
        console.groupEnd();
    }


    // получаем последнюю точку
    function getLastPoint() {
        return pointsHistory.length > 0 ? pointsHistory[pointsHistory.length - 1] : null;
    }

    //расставляем для r
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

   // отправка запроса для пост
    async function sendRequest(xValue, yValue, selectedR) {
        const url = `/fcgi-bin/WEB1_2_2.jar?x=${encodeURIComponent(xValue)}&y=${encodeURIComponent(yValue)}&r=${encodeURIComponent(selectedR)}`;
        console.log('Sending request:', url);

        try {
            const resp = await fetch(url, {method: 'GET', cache: 'no-cache'});

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

            // Добавляем точку в историю
            addToHistory(data);

            // рисуем точку
            if (typeof insertPoint === 'function') {
                try {
                    insertPoint(Number(data.x), Number(data.y), Number(data.r), data.result);
                } catch (e) {
                    console.warn('insertPoint failed:', e);
                }
            }

            // добавляем контейнер
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
    form.on('submit', function (e) {
        e.preventDefault();

        let xValue, yValue, selectedR;

        if (typeof window.formManager?.getFormData === 'function') {
            const formData = window.formManager.getFormData();
            if (!formData) return;
            ({x: xValue, y: yValue, r: selectedR} = formData);
        } else {
            xValue = parseFloat($('#x').val());
            yValue = $('#y').val().replace(',', '.');
            selectedR = xValue = parseFloat($('#r').val());

            if (Number.isNaN(xValue) || xValue === undefined) {
                alert('Выберите X.');
                return;
            }
            if (Number.isNaN(selectedR)) {
                alert('Введите значение R.');
                return;
            }
        }

        sendRequest(xValue, yValue, selectedR)
            .then(() => {
                if (typeof refresh === 'function') refresh(selectedR);
            })
            .catch(() => { /* уже обработано в sendRequest */
            });
    });


    function initialize() {
        // Восстанавливаем таблицу из cookies
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

    // для ручного управления cookies
    window.cookiesManager = {
        setCookie,
        getCookie,
        deleteCookie,
        clearAllCookies: function () {
            deleteCookie('pointsHistory');
            console.log('Все cookies очищены');
        }
    };


    initialize();

    async function sendRange(xMin, xMax, r) {
        const response = await fetch("/fcgi-bin/WEB1_2_2.jar", {
            method: "POST",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({xMin, xMax, r})
        });

        const data = await response.json();

        if (data.error) {
            alert("Ошибка: " + data.error);
        } else {
            //  Сохраняем текущее значение диапазона
            const rangeData = {xMin, xMax, r};
            window.currentR = r;
            localStorage.setItem('lastRange', JSON.stringify(rangeData));


            const rInput = document.getElementById('r');
            if (rInput) {
                rInput.value = r;
                rInput.readOnly = true;
            }


            const rHint = document.getElementById('rHint');
            if (rHint) {
                rHint.textContent = `Диапазон: X=[${xMin}, ${xMax}], R=${r}`;
                rHint.style.display = 'inline';
            }
            updateRangeFormFields(xMin, xMax, r);

            alert(data.message || "Диапазон обновлён!");
        }
    }

    function updateRangeFormFields(xMin, xMax, r) {
        const xMinInput = document.getElementById('xMin');
        const xMaxInput = document.getElementById('xMax');
        const rRangeInput = document.getElementById('rRange');

        if (xMinInput) xMinInput.value = xMin;
        if (xMaxInput) xMaxInput.value = xMax;
        if (rRangeInput) rRangeInput.value = r;
    }

    function restoreRangeFromStorage() {
        const savedRange = localStorage.getItem('lastRange');
        if (!savedRange) return;

        try {
            const {xMin, xMax, r} = JSON.parse(savedRange);

            // Обновляем форму диапазона
            updateRangeFormFields(xMin, xMax, r);

            // Обновляем форму точки
            const rInput = document.getElementById('r');
            if (rInput) {
                rInput.value = r;
                rInput.readOnly = true;
            }

            const rHint = document.getElementById('rHint');
            if (rHint) {
                rHint.textContent = `Восстановлен диапазон: X=[${xMin}, ${xMax}], R=${r}`;
                rHint.style.display = 'inline';
            }


            if (typeof refresh === 'function') refresh(r);

            window.currentR = r;
        } catch (e) {
            console.error('Ошибка восстановления диапазона из localStorage:', e);
        }
    }


    $('#rangeForm').on('submit', function (e) {
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

    $(document).ready(function () {
        restoreRangeFromStorage();
    });
    $('#clearHistoryBtn').on('click', function () {
        if (confirm('Очистить историю, диапазон и все точки?')) {
            clearHistory();
        }
    });
});