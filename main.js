document.addEventListener('DOMContentLoaded', () => {
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

    function shortenNumForCND(value, mode = 'auto') {
        let str = (typeof value === 'bigint') ? value.toString() : String(value);

        if (str.length <= 12) return str;

        if (mode === 'dots') {
            return str.slice(0, 6) + '...' + str.slice(-4);
        }

        if (mode === 'e') {
            const first = str[0];
            const after = str.slice(1);
            const exp = after.length;
            return `${first}.${after.slice(0, 3)}e+${exp}`;
        }

        if (mode === 'auto') {
            if (str.length <= 15) {
                const first = str[0];
                const after = str.slice(1);
                const exp = after.length;
                return `${first}.${after.slice(0, 3)}e+${exp}`;
            }
        }

        return str;
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

    // Recursive timeout-based playback
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

        // Work only with already displayed steps
        const shown = list.slice(0, i + 1);

        // Step count (numbers only)
        const stepsCount = shown.filter(x => typeof x === 'number' || typeof x === 'bigint').length;
        counter.textContent = `Number of steps: ${stepsCount}`;

        // Maximum among displayed numbers
        const max = maxOfList(shown);
        maxstat.textContent = `Highest number: ${max === null ? '-' : String(max)}`;

        // Current number for indicator
        currentNum.textContent = (typeof value === 'number' || typeof value === 'bigint')
                                 ? shortenNumForCND(value, 'e') : '1';

        // Update graph with delay
        setTimeout(() => {
            updateGraph(shown);
        }, 50); // 50ms delay before graph update

        currentTimeout = setTimeout(() => {
            playSteps(list, i + 1);
        }, stepSpeed);
    }

    speedRangeGetValue();

    function IntOrBigInt(inputValue) {
        const s = inputValue.trim();

        if (!/^[0-9]+$/.test(s)) {
            return { error: "Please enter a positive integer." };
        }

        const normalized = s.split('.')[0]

        if (normalized.length > 2) {
            return { value: BigInt(s), isBig: true };
        }

        return { value: Number(s), isBig: false };
    }

    function changeForASec(item, changetxt, time){
        const old = item.textContent;
        item.textContent = changetxt;
        setTimeout(() => { item.textContent = old; }, time);
    }

    copyBtn.addEventListener('click', () => {
        const parsed = IntOrBigInt(inp.value);

        const spisok = collatzSmart(parsed.value, parsed.isBig);

        const numsOnly = spisok.filter(x => typeof x === "number" || typeof x === "bigint");
        const textToCopy = numsOnly.join('\n');

        navigator.clipboard.writeText(textToCopy)
            .then(() => {
                changeForASec(copyBtn, 'Copied!', 500);
            })
            .catch(err => {
                changeForASec(copyBtn, `Error: ${err}`, 500);
            });
    });

    function isEven(number){
        return number % 2 === 0;
    }

    btn.addEventListener('click', function(){
        steps.textContent = '';

        const parsed = IntOrBigInt(inp.value);
        console.log('parsed:', parsed, typeof parsed.value);
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
    });

    function collatzSmart(n, isBig) {
        console.log('collatzSmart start, n:', n, typeof n, 'isBig:', isBig);
        const spisok = [n];

        const ONE = isBig ? 1n : 1;
        const TWO = isBig ? 2n : 2;
        const THREE = isBig ? 3n : 3;

        while (n !== ONE) {
            if (n % TWO === (isBig ? 0n : 0)) {
                n = n / TWO;
            } else {
                n = n * THREE + ONE;
            }

            spisok.push(n);

            if (spisok.length > 16000) {
                spisok.push('Great number, but the steps are crashing the site!');
                break;
            }
        }
        
        if (n === ONE) {
            spisok.push("Cycle reached.");
        }

        return spisok;
    }

    // Graph logic
    let graphInstance = null;

    function updateGraph(list) {
        const spis = list.filter(x => typeof x === 'number' || typeof x === 'bigint');
        const nums = spis.map(x => graphLogSize(x));

        if (!graphInstance) {
            graphInstance = echarts.init(document.getElementById('sim-graph'), 'dark');
            graphInstance.showLoading();
        }

        var option = {
            title: {
                text: 'Linear chart'
            },

            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const p = params[0];
                    const step = p.dataIndex;
                    const value = spis[step];

                    if (value === undefined) {
                        return `Step: ${step}`;
                    }

                    const isEven = (typeof value === 'bigint')
                        ? (value % 2n === 0n)
                        : (value % 2 === 0);

                    const oper = isEven ? "/ 2" : "* 3 + 1";

                    return `
                        Step: ${step}<br>
                        Value: ${toolTipShorten(value)}<br>
                        Operation: ${oper}
                    `;
                }
            },

            toolbox: {
                feature: {
                    dataZoom: {
                        yAxisIndex: 'none'
                    },
                    restore: {},
                    saveAsImage: {}
                }
            },

            dataZoom: [
                {
                    type: 'inside',
                    start: 0,
                    end: 100
                },
                {
                    start: 0,
                    end: 10
                }
            ],

            xAxis: {
                type: 'category',
                name: 'Step',
                boundaryGap: false,
                data: spis.map((_, i) => i)
            },

            yAxis: {
                type: 'value',
                name: 'Value',
                axisLabel: {
                    formatter: function(v) {
                        if (!Array.isArray(spis) || spis.length === 0) return yAxisValueShorten(v);

                        let nearestIdx = 0;
                        let minDiff = Infinity;
                        for (let i = 0; i < nums.length; i++) {
                            const d = Math.abs(nums[i] - v);
                            if (d < minDiff) { minDiff = d; nearestIdx = i; }
                        }

                        const orig = spis[nearestIdx];
                        return formatOriginalForAxis(orig);
                    }
                }
            },

            series: [{
                type: 'line',
                data: nums,
                showSymbol: true,
                symbol: 'circle',
                symbolSize: 6
            }]
        }

        graphInstance.setOption(option, true); // notMerge = true
        graphInstance.hideLoading();
    }

    // Graph initialization callback (not used for dynamic updates, but kept for consistency)
    window.CollatzApp.onNewList = function(list) {
        console.log("List received! Victory!");
        // Graph updates now handled via updateGraph
    };
});

function shorten(numStr) {
    if (numStr.length <= 12) return numStr;
    return numStr.slice(0, 6) + "..." + numStr.slice(-4);
}

function normalize(value) {
    if (typeof value === 'number') {
        return value;
    }

    const str = value.toString();
    const len = str.length;

    if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return Number(value);
    }

    return Math.log10(len);
}

function toolTipShorten(value) {
    const s = value.toString();

    if (s.length <= 15) {
        return s;
    }

    return s.slice(0, 6) + "..." + s.slice(-6);
}

function graphLogSize(value) {
    if (typeof value === 'number') {
        if (!isFinite(value)) return NaN;
        return Math.log10(Math.max(1, value));
    }

    const s = value.toString();
    const k = 15;
    const leadStr = s.slice(0, k);
    const leadNum = Number(leadStr);
    const len = s.length;

    const approxLog10 = Math.log10(leadNum) + (len - k);

    return approxLog10; 
}

function yAxisValueShorten(value) {
    if (typeof value !== 'number' || !isFinite(value)) return '';

    let exp = Math.floor(value);
    const frac = value - exp;

    if (exp >= -3 && exp <= 6) {
        const real = Math.round(Math.pow(10, value));
        return String(real);
    }

    let mantissa = Math.pow(10, frac);
    let mantissaRounded = Number(mantissa.toFixed(2));
    if (mantissaRounded >= 10) {
        mantissaRounded = Number((mantissaRounded / 10).toFixed(2));
        exp += 1;
    }

    let mantissaStr = mantissaRounded % 1 === 0 ? String(mantissaRounded) : String(mantissaRounded).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');

    const sign = exp >= 0 ? '+' : '';
    return `${mantissaStr}e${sign}${exp}`;
}

function formatOriginalForAxis(value, sigDigits = 2) {
    if (value === undefined) return '';

    if (typeof value === 'number') {
        if (!isFinite(value)) return '';
        if (Math.abs(value) <= 1e6) return String(Math.round(value));
        const parts = value.toExponential(sigDigits - 1).split('e');
        const mant = parts[0].replace(/\.0+$/, '');
        const exp = Number(parts[1]);
        const sign = exp >= 0 ? '+' : '';
        return `${mant}e${sign}${exp}`;
    }

    const s = value.toString();
    if (s.length <= 3) return s;

    const exp = s.length - 1;
    const lead = s.slice(0, sigDigits);
    let mantissa = Number(lead) / Math.pow(10, sigDigits - 1);

    let mantRounded = Number(mantissa.toFixed(2));
    if (mantRounded >= 10) { mantRounded = Number((mantRounded / 10).toFixed(2)); }

    const mantStr = mantRounded % 1 === 0 ? String(mantRounded) : String(mantRounded).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
    const sign = exp >= 0 ? '+' : '';
    return `${mantStr}e${sign}${exp}`;
}

console.log("speed =", document.getElementById("speed"));
console.log("sim-graph =", document.getElementById("sim-graph"));
