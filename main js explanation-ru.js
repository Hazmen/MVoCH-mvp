// Ждем, пока HTML-документ полностью загрузится и будет готов к работе с JavaScript.
// Это гарантирует, что все элементы на странице будут доступны для выбора.
document.addEventListener('DOMContentLoaded', () => {

    // Находим элементы на странице по их классам и ID
    // inp — поле ввода, куда пользователь вводит число
    let inp = document.querySelector('.input')

    // counter — элемент, в котором будет отображаться количество шагов
    let counter = document.querySelector('.steps-count')

    // steps — контейнер, куда добавляются шаги последовательности Коллатца
    let steps = document.querySelector('.steps')

    // btn — кнопка, по которой запускается вычисление
    let btn = document.querySelector('.btn')

    // maxstat — элемент, показывающий максимальное число в последовательности
    let maxstat = document.querySelector('.max-stat')

    // copyBtn — кнопка для копирования последовательности
    let copyBtn = document.querySelector('.copy')

    // currentNum — элемент, показывающий текущее число в процессе анимации
    let currentNum = document.querySelector('.currentNumDig')

    // speedRange — элемент ползунка, отвечающий за скорость анимации
    let speedRange = document.getElementById('speed')

    // valueLabel — элемент, показывающий текущую скорость (например, "2x")
    let valueLabel = document.getElementById('speedValue')

    // currentSpeed — текущая скорость, взятая из значения ползунка
    let currentSpeed = speedRange.value;

    // stepSpeed — задержка в миллисекундах между шагами (изначально 750 мс)
    let stepSpeed = 750;

    // isRunning — флаг, показывает, запущен ли процесс вычисления
    let isRunning = false;

    // currentTimeout — хранит ID текущего setTimeout, чтобы можно было его отменить
    let currentTimeout = null;

    // Создаём глобальный объект CollatzApp, чтобы другие скрипты могли с ним взаимодействовать
    window.CollatzApp = {
        // lastList — хранит последнюю вычисленную последовательность
        lastList: [],
        // onNewList — функция, вызываемая при новой последовательности (пока null)
        onNewList: null,
    };

    // Событие, срабатывающее при вводе символа в поле inp
    inp.addEventListener("beforeinput", e => {
        // Проверяем, введён ли символ (e.data)
        if (e.data && !/^\d+$/.test(e.data)) {
            // Если введён не цифра, отменяем ввод
            e.preventDefault();
        }
    });

    // Функция находит максимальное число в списке (игнорирует строки)
    function maxOfList(list) {
        // Начальное значение максимума — null
        let max = null;

        // Проходим по каждому элементу списка
        for (let v of list) {
            // Проверяем, является ли элемент числом или BigInt
            if (typeof v === "number" || typeof v === "bigint") {
                // Если max ещё не установлен или текущий элемент больше max
                if (max === null || v > max) {
                    // Обновляем max
                    max = v;
                }
            }
        }

        // Возвращаем максимальное найденное число
        return max;
    }

    // Функция сокращает длинные числа для отображения
    function shortenNumForCND(value, mode = 'auto') {
        // Преобразуем значение в строку (bigint или number)
        let str = (typeof value === 'bigint') ? value.toString() : String(value);

        // Если строка короче 12 символов, возвращаем как есть
        if (str.length <= 12) return str;

        // Если режим — dots (точки), возвращаем "123456...7890"
        if (mode === 'dots') {
            return str.slice(0, 6) + '...' + str.slice(-4);
        }

        // Если режим — e (экспоненциальный), возвращаем "1.234e+10"
        if (mode === 'e') {
            const first = str[0];           // Первая цифра
            const after = str.slice(1);     // Остальная часть
            const exp = after.length;       // Длина остатка = показатель степени
            return `${first}.${after.slice(0, 3)}e+${exp}`;
        }

        // Если режим auto и строка короче 15 символов
        if (mode === 'auto') {
            if (str.length <= 15) {
                const first = str[0];       // Первая цифра
                const after = str.slice(1); // Остальная часть
                const exp = after.length;   // Показатель степени
                return `${first}.${after.slice(0, 3)}e+${exp}`;
            }
        }

        // Если ни одно условие не сработало, возвращаем строку как есть
        return str;
    }

    // Функция настраивает слушатель для ползунка скорости
    function speedRangeGetValue(){
        // При изменении значения ползунка
        speedRange.addEventListener('input', () => {
            // Преобразуем значение в число
            currentSpeed = Number(speedRange.value)
            // Отображаем скорость как "2x", "3x" и т.д.
            valueLabel.innerHTML = currentSpeed + 'x';

            // В зависимости от скорости устанавливаем задержку между шагами
            if (currentSpeed == 1) {
                stepSpeed = 750;    // 1x — 750 мс
            } else if (currentSpeed == 2) {
                stepSpeed = 150;    // 2x — 150 мс
            } else if (currentSpeed == 3) {
                stepSpeed = 50;     // 3x — 50 мс
            } else if (currentSpeed == 4) {
                stepSpeed = 10;     // 4x — 10 мс
            } else if (currentSpeed == 5) {
                stepSpeed = false;  // 5x — без задержки (очень быстро)
            }
        })
    }

    // Функция анимирует шаги последовательности
    function playSteps(list, i = 0) {
        // Если достигли конца списка, останавливаем выполнение
        if (i >= list.length) {
            isRunning = false;  // Сбрасываем флаг запуска
            return;
        }

        // Берём текущий элемент из списка
        const value = list[i];

        // Создаём новый элемент <p> для отображения шага
        const p = document.createElement('p');
        
        // Если элемент — число, добавляем номер шага
        p.textContent = (typeof value === 'number' || typeof value === 'bigint')
            ? `${i + 1}. ${value}` 
            : value;

        // Добавляем элемент в контейнер шагов
        steps.appendChild(p);

        // Прокручиваем контейнер шагов вниз, чтобы показать последний элемент
        steps.scrollTo({ top: steps.scrollHeight });

        // Берём подсписок от начала до текущего шага (включительно)
        const shown = list.slice(0, i + 1);

        // Считаем количество шагов (только числовые элементы)
        const stepsCount = shown.filter(x => typeof x === 'number' || typeof x === 'bigint').length;

        // Обновляем счётчик шагов на странице
        counter.textContent = `количество шагов: ${stepsCount}`;

        // Находим максимальное число среди показанных
        const max = maxOfList(shown);

        // Обновляем отображение максимального числа
        maxstat.textContent = `самое большое число: ${max === null ? '-' : String(max)}`;

        // Обновляем текущее число на индикаторе
        currentNum.textContent = (typeof value === 'number' || typeof value === 'bigint')
                                 ? shortenNumForCND(value, 'e') : '1';

        // Обновляем график с небольшой задержкой
        setTimeout(() => {
            // Вызываем функцию обновления графика
            updateGraph(shown);
        }, 50); // Задержка 50 мс перед обновлением графика

        // Устанавливаем таймер для следующего шага
        currentTimeout = setTimeout(() => {
            // Рекурсивно вызываем playSteps для следующего элемента
            playSteps(list, i + 1);
        }, stepSpeed); // С задержкой в зависимости от скорости
    }

    // Вызываем функцию настройки ползунка скорости
    speedRangeGetValue();

    // Функция проверяет и преобразует строку в число (Number или BigInt)
    function IntOrBigInt(inputValue) {
        // Убираем пробелы по краям
        const s = inputValue.trim();

        // Проверяем, состоит ли строка только из цифр
        if (!/^[0-9]+$/.test(s)) {
            // Если нет — возвращаем ошибку
            return { error: "Введите положительное число."};
        }

        // Убираем дробную часть (если есть)
        const normalized = s.split('.')[0]

        // Если строка длиннее 2 символов, используем BigInt
        if (normalized.length > 2) {
            return { value: BigInt(s), isBig: true };
        }

        // Иначе используем Number
        return { value: Number(s), isBig: false };
    }

    // Функция временно меняет текст элемента на заданное время
    function changeForASec(item, changetxt, time){
        // Сохраняем старый текст
        old = item.textContent
        // Меняем текст на новый
        item.textContent = changetxt
        // Через заданное время возвращаем старый текст
        setTimeout(() => {item.innerHTML = old;}, time)
    }

    // Добавляем обработчик клика на кнопку копирования
    copyBtn.addEventListener('click', () => {
        // Парсим введённое значение
        const parsed = IntOrBigInt(inp.value);

        // Вычисляем последовательность Коллатца
        const spisok = collatzSmart(parsed.value, parsed.isBig);

        // Фильтруем только числа (убираем строки типа "цикл достигнут")
        const numsOnly = spisok.filter(x => typeof x === "number" || typeof x === "bigint");

        // Объединяем числа в строку с переносами строк
        const textToCopy = numsOnly.join('\n');

        // Копируем текст в буфер обмена
        navigator.clipboard.writeText(textToCopy)
            // Если копирование прошло успешно
            .then(() => {
                // Показываем "Скопировано!" на 500 мс
                changeForASec(copyBtn, 'Скопировано!', 500)
            })
            // Если произошла ошибка
            .catch(err => {
                // Показываем ошибку на 500 мс
                changeForASec(copyBtn, `Error: ${err}`, 500)
            })
    })

    // Функция проверяет, чётное ли число
    function isEven(number){
        // Возвращает true, если число делится на 2
        return number % 2 === 0;
    }

    // Добавляем обработчик клика на основную кнопку
    btn.addEventListener('click', function(){
        // Очищаем контейнер шагов
        steps.textContent = '';

        // Парсим введённое значение
        const parsed = IntOrBigInt(inp.value);
        console.log('parsed:', parsed, typeof parsed.value);

        // Если была ошибка — выводим её
        if (parsed.error) {
            steps.textContent = parsed.error;
            return;
        }

        // Вычисляем последовательность
        const spisok = collatzSmart(parsed.value, parsed.isBig);

        // Сохраняем последовательность в глобальный объект
        window.CollatzApp.lastList = spisok;

        // Если задана функция onNewList, вызываем её
        if (typeof window.CollatzApp.onNewList === 'function') {
            window.CollatzApp.onNewList(spisok);
        }

        // Если процесс уже запущен, останавливаем его
        if(isRunning) {
            clearTimeout(currentTimeout);   // Очищаем текущий таймер
            isRunning = false;              // Сбрасываем флаг
        }

        // Устанавливаем флаг запуска
        isRunning = true;

        // Запускаем анимацию шагов
        playSteps(spisok);
    })

    // Функция вычисляет последовательность Коллатца
    function collatzSmart(n, isBig) {
        console.log('collatzSmart start, n:', n, typeof n, 'isBig:', isBig);

        // Создаём список, начинающийся с введённого числа
        const spisok = [n];

        // Определяем константы в зависимости от типа (number или bigint)
        const ONE = isBig ? 1n : 1;
        const TWO = isBig? 2n : 2;
        const THREE = isBig? 3n : 3;

        // Пока n не равно 1
        while (n !== ONE) {
            // Если n чётное
            if (n % TWO === (isBig ? 0n : 0)) {
                n = n / TWO;        // Делим на 2
            } else {
                n = n * THREE + ONE // Иначе: умножаем на 3 и прибавляем 1
            }

            // Добавляем новое значение в список
            spisok.push(n);

            // Если список стал слишком длинным — останавливаем
            if (spisok.length > 16000) {
                spisok.push('Отличное число, но шаги вызывают приступ у сайта!');
                break;
            }
        }
        
        // Если n стало 1, добавляем сообщение о завершении
        if (n === ONE) {
            spisok.push("Цикл достигнут.")
        }

        // Возвращаем список шагов
        return spisok;
    }

    // Графическая логика
    // Переменная для хранения экземпляра графика
    let graphInstance = null;

    // Функция обновляет график на основе списка шагов
    function updateGraph(list) {
        // Фильтруем только числовые элементы
        const spis = list.filter(x => typeof x === 'number' || typeof x === 'bigint');

        // Преобразуем числа в логарифмический масштаб для графика
        const nums = spis.map(x => graphLogSize(x));

        // Если графика ещё нет — инициализируем его
        if (!graphInstance) {
            // Инициализируем график в элементе с id 'sim-graph' в темной теме
            graphInstance = echarts.init(document.getElementById('sim-graph'), 'dark');
            // Показываем индикатор загрузки
            graphInstance.showLoading();
        }

        // Опции графика
        var option = {
            // Заголовок графика
            title: {
                text: 'Linear chart'
            },

            // Всплывающая подсказка при наведении на график
            tooltip: {
                // Показывается при наведении на ось
                trigger: 'axis',
                // Функция, определяющая, что показывать в подсказке
                formatter: function (params) {
                    // Берём первый элемент из параметров (т.к. ось)
                    const p = params[0];
                    // Номер шага
                    const step = p.dataIndex;
                    // Значение на этом шаге
                    const value = spis[step];

                    // Если значение отсутствует, просто показываем шаг
                    if (value === undefined) {
                        return `Step: ${step}`;
                    }

                    // Проверяем, чётное ли число (для отображения операции)
                    const isEven = (typeof value === 'bigint')
                        ? (value % 2n === 0n)    // Для bigint
                        : (value % 2 === 0);     // Для number

                    // Определяем операцию
                    const oper = isEven ? "/ 2" : "* 3 + 1";

                    // Возвращаем HTML-строку для подсказки
                    return `
                        Step: ${step}<br>
                        Value: ${toolTipShorten(value)}<br>
                        Operation: ${oper}
                    `;
                }
            },

            // Панель инструментов (кнопки: масштаб, сброс, сохранить)
            toolbox: {
                feature: {
                    // Инструмент масштабирования
                    dataZoom: {
                        // Отключаем масштаб по оси Y
                        yAxisIndex: 'none'
                    },
                    // Кнопка сброса
                    restore: {},
                    // Кнопка сохранения как изображение
                    saveAsImage: {}
                }
            },

            // Инструменты масштабирования (колесо мыши и ползунок)
            dataZoom: [
                {
                    // Внутренний масштаб (работает колесом мыши)
                    type: 'inside',
                    start: 0,   // Начало видимого диапазона
                    end: 100    // Конец видимого диапазона
                },
                {
                    // Видимый ползунок внизу графика
                    start: 0,
                    end: 10
                }
            ],

            // Ось X (шаги)
            xAxis: {
                type: 'category',           // Категориальная ось (целые числа)
                name: 'Step',               // Подпись оси
                boundaryGap: false,         // Без зазора между точками
                data: spis.map((_, i) => i) // Массив номеров шагов
            },

            // Ось Y (значения)
            yAxis: {
                type: 'value',              // Числовая ось
                name: 'Value',              // Подпись оси
                // Форматирование подписей на оси Y
                axisLabel: {
                    // Функция, определяющая, как отображать числа на оси Y
                    formatter: function(v) {
                        // Если список пуст — просто форматируем значение
                        if (!Array.isArray(spis) || spis.length === 0) return yAxisValueShorten(v);

                        // Ищем ближайшее значение в списке к текущему v
                        let nearestIdx = 0;
                        let minDiff = Infinity;
                        for (let i = 0; i < nums.length; i++) {
                            // Разница между логарифмическим значением и v
                            const d = Math.abs(nums[i] - v);
                            if (d < minDiff) { 
                                minDiff = d; 
                                nearestIdx = i; 
                            }
                        }

                        // Находим оригинальное значение
                        const orig = spis[nearestIdx];

                        // Возвращаем форматированное значение
                        return formatOriginalForAxis(orig);
                    }
                }
            },

            // Данные для отображения на графике
            series: [{
                type: 'line',           // Линейный график
                data: nums,             // Данные (в логарифмическом масштабе)
                showSymbol: true,       // Показывать точки
                symbol: 'circle',       // Форма точек
                symbolSize: 6           // Размер точек
            }]
        }

        // Применяем настройки к графику (notMerge = true — заменяет старые)
        graphInstance.setOption(option, true);

        // Скрываем индикатор загрузки
        graphInstance.hideLoading();
    }

    // Функция, вызываемая при получении новой последовательности
    window.CollatzApp.onNewList = function(list) {
        console.log("Список получен! Победа!");
        // Не вызываем drawGraph, т.к. обновления теперь через updateGraph
    };
});

// Вспомогательные функции вне основного блока

// Функция сокращает длинные числа (например, "123456...7890")
function shorten(numStr) {
    // Если длина строки меньше или равна 12 — возвращаем как есть
    if (numStr.length <= 12) return numStr;
    // Иначе возвращаем первые 6 символов + "..." + последние 4 символа
    return numStr.slice(0, 6) + "..." + numStr.slice(-4);
}

// Функция нормализует значение для графика
function normalize(value) {
    // Если значение — обычное число — возвращаем его как есть
    if (typeof value === 'number') {
        return value;
    }

    // Преобразуем значение в строку
    const str = value.toString();
    // Длина строки
    const len = str.length;

    // Если число помещается в Number — возвращаем как Number
    if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return Number(value);
    }

    // Иначе возвращаем логарифм длины
    return Math.log10(len);
}

// Функция сокращает значение для всплывающей подсказки
function toolTipShorten(value) {
    // Преобразуем значение в строку
    const s = value.toString();

    // Если длина строки меньше или равна 15 — возвращаем как есть
    if (s.length <= 15) {
        return s;
    }

    // Иначе возвращаем первые 6 символов + "..." + последние 6 символов
    return s.slice(0, 6) + "..." + s.slice(-6);
}

// Функция преобразует число в логарифмический масштаб для графика
function graphLogSize(value) {
    // Если значение — обычное число
    if (typeof value === 'number') {
        // Если число не конечное — возвращаем NaN
        if (!isFinite(value)) return NaN;
        // Возвращаем логарифм по основанию 10 от максимального из 1 и value
        return Math.log10(Math.max(1, value));
    }

    // Преобразуем значение в строку
    const s = value.toString();
    // Константа k = 15
    const k = 15
    // Первые 15 символов строки
    const leadStr = s.slice(0, k);
    // Преобразуем их в число
    const leadNum = Number(leadStr);
    // Длина всей строки
    const len = s.length;

    // Приближённый логарифм
    const approxLog10 = Math.log10(leadNum) + (len - k);

    // Возвращаем приближённый логарифм
    return approxLog10; 
}

// Функция форматирует значение для подписей на оси Y
function yAxisValueShorten(value) {
    // Если значение не число или не конечное — возвращаем пустую строку
    if (typeof value !== 'number' || !isFinite(value)) return '';

    // Целая часть значения
    let exp = Math.floor(value);
    // Дробная часть значения
    const frac = value - exp;

    // Если экспонента в разумном диапазоне (-3 до 6) — возвращаем округлённое число
    if (exp >= -3 && exp <= 6) {
        const real = Math.round(Math.pow(10, value));
        return String(real);
    }

    // Вычисляем мантиссу
    let mantissa = Math.pow(10, frac);
    // Округляем мантиссу до 2 знаков после запятой
    let mantissaRounded = Number(mantissa.toFixed(2));
    // Если мантисса >= 10, делим её на 10 и увеличиваем экспоненту
    if (mantissaRounded >= 10) {
        mantissaRounded = Number((mantissaRounded / 10).toFixed(2));
        exp += 1;
    }

    // Форматируем строку мантиссы, убирая нули
    let mantissaStr = mantissaRounded % 1 === 0 ? String(mantissaRounded) : String(mantissaRounded).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');

    // Определяем знак для экспоненты
    const sign = exp >= 0 ? '+' : '';
    // Возвращаем строку вида "мантисса e+экспонента"
    return `${mantissaStr}e${sign}${exp}`;
}

// Функция форматирует значение для оси Y (сокращённо)
function formatOriginalForAxis(value, sigDigits = 2) {
    // Если значение undefined — возвращаем пустую строку
    if (value === undefined) return '';

    // Если значение — обычное число
    if (typeof value === 'number') {
        // Если не конечное — возвращаем пустую строку
        if (!isFinite(value)) return '';
        // Если модуль числа <= 1e6 — возвращаем округлённое
        if (Math.abs(value) <= 1e6) return String(Math.round(value));
        // Разбиваем число на мантиссу и экспоненту
        const parts = value.toExponential(sigDigits - 1).split('e');
        // Убираем нули из мантиссы
        const mant = parts[0].replace(/\.0+$/, '');
        // Экспонента как число
        const exp = Number(parts[1]);
        // Знак для экспоненты
        const sign = exp >= 0 ? '+' : '';
        // Возвращаем строку вида "мантисса e+экспонента"
        return `${mant}e${sign}${exp}`;
    }

    // Преобразуем значение в строку
    const s = value.toString();
    // Если длина строки <= 3 — возвращаем как есть
    if (s.length <= 3) return s;

    // Экспонента = длина строки - 1
    const exp = s.length - 1;
    // Первые sigDigits символов строки
    const lead = s.slice(0, sigDigits);
    // Мантисса = первые цифры / 10^(sigDigits - 1)
    let mantissa = Number(lead) / Math.pow(10, sigDigits - 1);

    // Округляем мантиссу до 2 знаков после запятой
    let mantRounded = Number(mantissa.toFixed(2));
    // Если мантисса >= 10, делим её на 10
    if (mantRounded >= 10) { mantRounded = Number((mantRounded / 10).toFixed(2)); }

    // Форматируем строку мантиссы, убирая нули
    const mantStr = mantRounded % 1 === 0 ? String(mantRounded) : String(mantRounded).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
    // Знак для экспоненты
    const sign = exp >= 0 ? '+' : '';
    // Возвращаем строку вида "мантисса e+экспонента"
    return `${mantStr}e${sign}${exp}`;
}

// Выводим в консоль элементы для отладки (для проверки / не обязательно)
console.log("speed =", document.getElementById("speed"));
console.log("sim-graph =", document.getElementById("sim-graph"));

// Замечание: Это объяснение автор дал написать ИИ потому что он слишком ленивый :P

// P.s. Этот файл работает, если его использовать вместо оригинального main.js (не точно)