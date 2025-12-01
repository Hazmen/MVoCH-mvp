document.addEventListener('DOMContentLoaded', () => {
    window.CollatzApp.onNewList = function(list) {
        console.log("List received! Victory!");

        const spis = list.filter(x => typeof x === 'number' || typeof x === 'bigint');
        
        const nums = spis.map(x => graphLogSize(x));

        drawGraph(nums, spis);
    };

    function drawGraph(nums, spis) {
        var ch1 = echarts.init(document.getElementById('sim-graph'), 'dark');
        ch1.showLoading();

        var option = {
            title: {
                text: 'Linear chart'
            },

            // Add a safe tooltip — check for original data availability
            tooltip: {
                trigger: 'axis',
                formatter: function (params) {
                    const p = params[0];                 // take the first item in the array
                    const step = p.dataIndex;            // step index
                    const value = spis[step];            // original number

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

            // Add X-axis so ECharts correctly creates cartesian coordinates
            xAxis: {
                type: 'category',
                name: 'Step',
                data: nums
            },

            yAxis: {
                type: 'value',
                name: 'Value',
                axisLabel: {
                    formatter: function(v) {
                        // v — this is the log10(original) value
                        // Find the nearest real element from `spis` by scale
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

                // `nums` already contains logarithmic values (from graphLogSize). Do NOT apply graphLogSize again.
                data: nums,

                showSymbol: true,
                symbol: 'circle',
                symbolSize: 6
            }]
        }

        ch1.setOption(option);
        ch1.hideLoading();
    }
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
        // For small numbers, also return log10(value) to keep everything on the same scale
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

    // `value` is log10(originalValue) (or an approximation)
    let exp = Math.floor(value);
    const frac = value - exp;

    // For small numbers — display as actual integers (up to 1e6)
    if (exp >= -3 && exp <= 6) {
        const real = Math.round(Math.pow(10, value));
        return String(real);
    }

    // For large/small numbers, use scientific notation: mantissa * 10^exp
    let mantissa = Math.pow(10, frac);

    // Round mantissa to 2 significant digits (remove trailing zeros)
    let mantissaRounded = Number(mantissa.toFixed(2));
    if (mantissaRounded >= 10) {
        // e.g., rounding yields 10.0 → shift exponent
        mantissaRounded = Number((mantissaRounded / 10).toFixed(2));
        exp += 1;
    }

    // Remove unnecessary trailing zeros in fractional part
    let mantissaStr = mantissaRounded % 1 === 0 ? String(mantissaRounded) : String(mantissaRounded).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');

    const sign = exp >= 0 ? '+' : '';
    return `${mantissaStr}e${sign}${exp}`;
}

// Formats the original number (Number or BigInt) into a compact, readable label for the Y-axis
function formatOriginalForAxis(value, sigDigits = 2) {
    if (value === undefined) return '';

    // For regular numbers — show as-is if small, otherwise use exponential notation
    if (typeof value === 'number') {
        if (!isFinite(value)) return '';
        if (Math.abs(value) <= 1e6) return String(Math.round(value));
        // Large numbers — exponential format
        const parts = value.toExponential(sigDigits - 1).split('e');
        const mant = parts[0].replace(/\.0+$/, '');
        const exp = Number(parts[1]);
        const sign = exp >= 0 ? '+' : '';
        return `${mant}e${sign}${exp}`;
    }

    // For BigInt — build scientific notation from string
    const s = value.toString();
    if (s.length <= 7) return s; // short enough

    const exp = s.length - 1;
    // Take `sigDigits` significant digits
    const lead = s.slice(0, sigDigits);
    let mantissa = Number(lead) / Math.pow(10, sigDigits - 1);

    // Round mantissa to 2 decimal places if needed
    let mantRounded = Number(mantissa.toFixed(2));
    if (mantRounded >= 10) { mantRounded = Number((mantRounded / 10).toFixed(2)); }

    const mantStr = mantRounded % 1 === 0 ? String(mantRounded) : String(mantRounded).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
    const sign = exp >= 0 ? '+' : '';
    return `${mantStr}e${sign}${exp}`;
}
