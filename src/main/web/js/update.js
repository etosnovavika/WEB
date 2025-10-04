// $(document).ready(function() {
//     let rValue = 1;
//
//     const rButton = $(".r-button");
//     const yInput = $("#y");
//
//     setDefaults();
//
//     function setDefaults() {
//         $('input[name="x"][value="0"]').prop('checked', true);
//         $('#y').val(0);
//         setR(1);
//     }
//
//     function setR(r) {
//         rValue = r;
//         refresh(rValue);
//
//         rButton.removeClass("selected");
//         $('.r-button[value="' + r + '"]').addClass("selected");
//     }
//
//     rButton.on("click", function () {
//         setR($(this).val());
//     });
//
//     yInput.on('input', function() {
//         yInput.val(yInput.val().replace(/[^0-9.,-]/g, ''));
//         yInput.val(yInput.val().replace(/,/g, '.'));
//
//         if (yInput.val() && (parseFloat(yInput.val()) < -3 || parseFloat(yInput.val()) > 3)) {
//             yInput.val(parseFloat(yInput.val()) > 3 ? 3 : -3);
//         }
//
//         if (yInput.val().indexOf('.') !== -1 && yInput.val().split('.')[1].length > 3) {
//             yInput.val(yInput.val().substring(0, yInput.val().indexOf('.') + 4));
//         }
//
//         if ((yInput.val().match(/\./g) || []).length > 1) {
//             yInput.val(yInput.val().substring(0, yInput.val().lastIndexOf('.')));
//         }
//
//         if ((yInput.val().match(/\./g) || []).length === 1 && yInput.val().indexOf('.') === 0) {
//             yInput.val('0' + yInput.val());
//         }
//     });
// });
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
    const xInputs = $('input[name="x"]');

    initializeForm();

    function initializeForm() {
        setDefaults();
        setupEventListeners();
        loadFromHistory();
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

        // Обновляем UI
        rButton.removeClass("selected");
        $(`.r-button[value="${rValue}"]`).addClass("selected");

        console.log('R установлен:', rValue);
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

        // Валидация числа
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
            // Проверка X
            const selectedX = $('input[name="x"]:checked');
            if (selectedX.length === 0) {
                throw new Error('Выберите значение X');
            }
            const x = parseFloat(selectedX.val());

            // Проверка Y
            const y = parseFloat(yInput.val());
            if (isNaN(y)) {
                throw new Error('Введите корректное значение Y');
            }
            if (y < config.minY || y > config.maxY) {
                throw new Error(`Y должен быть в диапазоне [${config.minY}, ${config.maxY}]`);
            }

            // Проверка R
            if (!rValue && rValue !== 0) {
                throw new Error('Выберите значение R');
            }

            return { x, y, r: rValue };
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
        // Кнопки R
        rButton.on("click", function() {
            setR($(this).val());
        });

        // Ввод Y
        yInput.on('input', validateYInput);

        // Валидация при потере фокуса
        yInput.on('blur', function() {
            if (yInput.val() && !isNaN(parseFloat(yInput.val()))) {
                validateYInput();
            }
        });

        // Глобальная функция для получения данных формы
        window.getFormData = getFormData;
    }

    // Экспорт функций для использования в других скриптах
    window.formManager = {
        setR,
        getFormData,
        validateYInput,
        loadFromHistory
    };
});