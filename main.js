let inp = document.querySelector('.input')
let counter = document.querySelector('.steps-count')
let steps = document.querySelector('.steps')
let btn = document.querySelector('.btn')
let maxstat = document.querySelector('.max-stat')
let copyBtn = document.querySelector('.copy')
let currentNum = document.querySelector('.currentNumDig')

let speedRange = document.getElementById('speed')
let valueLabel = document.getElementById('speedValue')
let currentSpeed = speedRange.value;
let stepSpeed = 750;

let isRunning = false;
let currentTimeout = null;

window.CollatzApp = {
    lastList: [],
    onNewList: null,
};

inp.addEventListener("beforeinput", e => {
    if (e.data && !/^\d+$/.test(e.data)) {
        e.preventDefault();
    }
});

function maxOfList(list) {
    let max = null;

    for (let v of list) {
        if (typeof v === "number" || typeof v === "bigint") {
            if (max === null || v > max) {
                max = v;
            }
        }
    }

    return max;
}

function speedRangeGetValue(){
    speedRange.addEventListener('input', () => {
        currentSpeed = Number(speedRange.value)
        valueLabel.innerHTML = currentSpeed + 'x';
        if (currentSpeed == 1) {
            stepSpeed = 750;
        } else if (currentSpeed == 2) {
            stepSpeed = 150;
        } else if (currentSpeed == 3) {
            stepSpeed = 50;
        } else if (currentSpeed == 4) {
            stepSpeed = 10;
        } else if (currentSpeed == 5) {
            stepSpeed = false;
        }
    })
}

// Способ с рекурсивным TimeOut
function playSteps(list, i = 0) {
    if (i >= list.length) {
        isRunning = false;
        return;
    }

    const value = list[i];
    const p = document.createElement('p');
    p.textContent = (typeof value === 'number' || typeof value === 'bigint')
        ? `${i + 1}. ${value}` 
        : value;
    steps.appendChild(p);
    steps.scrollTo({ top: steps.scrollHeight });

    // Работаем только с уже показанными шагами
    const shown = list.slice(0, i + 1);

    // Количество шагов (только числа)
    const stepsCount = shown.filter(x => typeof x === 'number' || typeof x === 'bigint').length;
    counter.textContent = `количество шагов: ${stepsCount}`;

    // Максимум среди показанных чисел
    const max = maxOfList(shown);
    maxstat.textContent = `самое большое число: ${max === null ? '-' : String(max)}`;

    // Текущее число для индикатора
    currentNum.textContent = (typeof value === 'number' || typeof value === 'bigint') ? String(value) : '1';

    currentTimeout = setTimeout(() => {
        playSteps(list, i + 1);
    }, stepSpeed);
}



speedRangeGetValue();

function IntOrBigInt(inputValue) {
    const s = inputValue.trim();

    if (!/^[0-9]+$/.test(s)) {
        return { error: "Введите положительное число."};
    }

    const normalized = s.split('.')[0]

    if (normalized.length > 32) {
        return { value: BigInt(s), isBig: true };
    }

    return { value: Number(s), isBig: false };
}

function changeForASec(item, changetxt, time){
    old = item.textContent
    item.textContent = changetxt
    setTimeout(() => {item.innerHTML = old;}, time)
}

copyBtn.addEventListener('click', () => {
    const parsed = IntOrBigInt(inp.value);

    const spisok = collatzSmart(parsed.value, parsed.isBig);

    // const text = steps.innerText;
    const numsOnly = spisok.filter(x => typeof x === "number");
    // new Text(numsOnly)
    const textToCopy = numsOnly.join('\n');


    navigator.clipboard.writeText(textToCopy)
        .then(() => {
            changeForASec(copyBtn, 'Скопировано!', 500)
        })
        .catch(err => {
            changeForASec(copyBtn, `Error: ${err}`, 500)
        })
})

function isEven(number){
    return number % 2 === 0;
}

btn.addEventListener('click', function(){
    steps.textContent = '';

    const parsed = IntOrBigInt(inp.value);
    if (parsed.error) {
        steps.textContent = parsed.error;
        return;
    }

    const spisok = collatzSmart(parsed.value, parsed.isBig);

    window.CollatzApp.lastList = spisok;

    if (typeof window.CollatzApp.onNewList === 'function') {
        window.CollatzApp.onNewList(spisok);
    }

    if(isRunning) {
        clearTimeout(currentTimeout);
        isRunning = false;
    }


    isRunning = true;
    playSteps(spisok);

    
    // Способ выполнения вычисления за раз
    // steps.innerHTML = spisok
    // // .slice(0, spisok.length - 1)
    // .map((x, i) => { 
    //     if (i === spisok.length - 1){
    //         return `<p>${x}</p>`
    // } else { 
    //     return `<p>${i + 1}. ${x}</p>`
    // }})
    // .join('');

// ===========================================

    // Способ вычисления пошагово
    // let i = 0;
    // const interval = setInterval(() => {
    //     if (i >= spisok.length) {
    //         clearInterval(interval);
    //         return;
    //     }

    //     const value = spisok[i];
    //     const p = document.createElement('p');
    //     p.textContent = (typeof value === 'number')? `${i + 1}. ${value}`: value;
    //     steps.appendChild(p);
        
    //     i++
    // }, stepSpeed)
    
// ==========================================

    // const list = collatz2(Number(inp.value));

    
})


// btn.addEventListener('click', () => {
//     if (isRunning) return;

//     isRunning = true;
//     steps.textContent = "";
//     const list = collatz2(Number(inp.value));

//     playSteps(list);
// });


function collatz(n){
    while (n !== 1){
        if (n % 2 === 0) {
            n = n / 2
            steps.textContent = n
        } else {
            n = n * 3 + 1
            steps.textContent = n
        }
    }
}

function collatz2(n){
    const spisok = [n];
    if (n <= 0) { 
        steps.textContent = "Введи положительное число" 
        counter.textContent = '';
        maxstat = '';
        return [];
    }

    
    while (n !== 1) { 
        n = (n % 2 === 0)? n / 2 : 3*n+1;
        spisok.push(n) // добавляет n в списокк
        if (spisok.length > 10000) {
            spisok.push("Много шагов, у сайта приступ")
        }

        if (n == 1) {
            spisok.push("Ты достиг бесконечного цикла!")
        }
    }

    // counter.innerHTML = `количество шагов: \n ${spisok.length - 1}`

    // const numsOnly = spisok.filter(x => typeof x === "number");
    // const max = Math.max(...numsOnly) //... < распаковывает список в элементы
    // maxstat.innerHTML = `самое большое число: \n ${max}`
 
    return spisok;
}

function collatzSmart(n, isBig) {
    const spisok = [n];

    const ONE = isBig ? 1n : 1;
    const TWO = isBig? 2n : 2;
    const THREE = isBig? 3n : 3;

    while (n !== ONE) {
        if (n % TWO === 0) {
            n = n / TWO;
        } else {
            n = n * THREE + ONE
        }

        spisok.push(n);

        if (spisok.length > 16000) {
            spisok.push('Отличное число, но шаги вызывают приступ у сайта!');
            break;
        }
    }
    
    if (n === ONE) {
        spisok.push("Цикл достигнут.")
    }

    return spisok;
}








