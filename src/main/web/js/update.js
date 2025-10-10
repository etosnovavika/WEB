
$(document).ready(function() {
    const config = {
        defaultX: 0,
        defaultY: 0,
        defaultR: 1,
        minY: -3,
        maxY: 3,
        maxDecimalPlaces: 3
    };

    let rValue = config.defaultR;
    const rButton = $(".r-button");
    const yInput = $("#y");
    const xInput = $("#x");

    initializeForm();

    function initializeForm() {
        setDefaults();
        setupEventListeners();
        loadFromHistory();
        const savedRange = localStorage.getItem('lastRange');
        if (savedRange) {
            try {
                const { xMin, xMax, r } = JSON.parse(savedRange);
                console.log('Восстановлен диапазон из localStorage:', xMin, xMax, r);

                // Подставляем R в форму
                const rInput = document.getElementById('r');
                if (rInput) {
                    rInput.value = r;
                    rInput.readOnly = true;
                }

                // Обновляем глобальные переменные
                window.currentR = r;

                // Визуально показываем
                const rHint = document.getElementById('rHint');
                if (rHint) {
                    rHint.textContent = `Восстановлен диапазон: X=[${xMin}, ${xMax}], R=${r}`;
                    rHint.style.display = 'inline';
                }

                if (typeof refresh === 'function') refresh(r);
            } catch (e) {
                console.error('Ошибка восстановления диапазона из localStorage:', e);
            }
        }

    }

    function setDefaults() {
        $(`input[name="x"][value="${config.defaultX}"]`).prop('checked', true);
        yInput.val(config.defaultY);
        setR(config.defaultR);
    }

    function setR(r) {
        rValue = parseFloat(r);

        // Обновляем график
        if (typeof refresh === 'function') {
            refresh(rValue);
        }

        // Обновляем таблицу
        rButton.removeClass("selected");
        $(`.r-button[value="${rValue}"]`).addClass("selected");

        // console.log('R установлен:', rValue);
    }

    function validateYInput() {
        let value = yInput.val();

        // Удаляем недопустимые символы
        value = value.replace(/[^0-9.,-]/g, '').replace(/,/g, '.');

        // Обработка минусов
        const minusCount = (value.match(/-/g) || []).length;
        if (minusCount > 1) {
            value = '-' + value.replace(/-/g, '');
        }
        if (minusCount === 1 && value.indexOf('-') !== 0) {
            value = '-' + value.replace(/-/g, '');
        }

        // Валидация числа для y
        const numValue = parseFloat(value);
        if (!isNaN(numValue)) {
            // Проверка диапазона
            if (numValue < config.minY) {
                value = config.minY.toString();
            } else if (numValue > config.maxY) {
                value = config.maxY.toString();
            }

            // Ограничение дробной части
            const parts = value.split('.');
            if (parts[1] && parts[1].length > config.maxDecimalPlaces) {
                value = parts[0] + '.' + parts[1].substring(0, config.maxDecimalPlaces);
            }
        }

        yInput.val(value);
    }

    function getFormData() {
        try {
            // --- X ---
            const xRaw = xInput.val().trim();
            if (xRaw === '') {
                throw new Error('Введите значение X');
            }
            const x = parseFloat(xRaw);
            if (isNaN(x)) {
                throw new Error('X должно быть числом');
            }

            // --- Y ---
            const yRaw = yInput.val().trim();
            if (yRaw === '') {
                throw new Error('Введите значение Y');
            }
            const y = parseFloat(yRaw);
            if (isNaN(y)) {
                throw new Error('Y должно быть числом');
            }
            if (y < config.minY || y > config.maxY) {
                throw new Error(`Y должен быть в диапазоне [${config.minY}, ${config.maxY}]`);
            }

            // --- R ---
            const rRaw = $('#r').val()?.trim();
            if (!rRaw) {
                throw new Error('Введите значение R');
            }
            const r = parseFloat(rRaw);
            if (isNaN(r)) {
                throw new Error('R должно быть числом');
            }

            if (window.currentR !== undefined && r !== window.currentR) {
                throw new Error(`Значение R (${r}) не совпадает с активным диапазоном (${window.currentR}).`);
            }


            rValue = r;

            return { x, y, r };
        } catch (error) {
            alert(error.message);
            return null;
        }
    }



    function loadFromHistory() {
        if (window.pointsHistoryAPI) {
            const history = window.pointsHistoryAPI.getHistory();
            if (history.length > 0) {
                const lastPoint = history[history.length - 1];
                console.log('Загружаем последнюю точку из истории:', lastPoint);

                // Устанавливаем значения из последней точки
                const xValue = parseFloat(lastPoint.x);
                $(`input[name="x"][value="${xValue}"]`).prop('checked', true);

                yInput.val(lastPoint.y);
                setR(lastPoint.r);
            }
        }
    }

    function setupEventListeners() {

        rButton.on("click", function() {
            setR($(this).val());
        });


        yInput.on('input', validateYInput);


        yInput.on('blur', function() {
            if (yInput.val() && !isNaN(parseFloat(yInput.val()))) {
                validateYInput();
            }
        });


        window.getFormData = getFormData;
    }


    window.formManager = {
        setR,
        getFormData,
        validateYInput,
        loadFromHistory
    };
});