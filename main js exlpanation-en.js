// Wait for the HTML document to be fully loaded and ready for JavaScript interaction.
// This ensures that all elements on the page will be available for selection.
document.addEventListener('DOMContentLoaded', () => {

    // Find elements on the page by their classes and IDs
    // inp — input field where the user enters a number
    let inp = document.querySelector('.input')

    // counter — element that displays the number of steps
    let counter = document.querySelector('.steps-count')

    // steps — container where Collatz sequence steps are added
    let steps = document.querySelector('.steps')

    // btn — button that starts the computation
    let btn = document.querySelector('.btn')

    // maxstat — element showing the maximum number in the sequence
    let maxstat = document.querySelector('.max-stat')

    // copyBtn — button for copying the sequence
    let copyBtn = document.querySelector('.copy')

    // currentNum — element showing the current number during animation
    let currentNum = document.querySelector('.currentNumDig')

    // speedRange — slider element controlling animation speed
    let speedRange = document.getElementById('speed')

    // valueLabel — element displaying current speed (e.g., "2x")
    let valueLabel = document.getElementById('speedValue')

    // currentSpeed — current speed, taken from the slider value
    let currentSpeed = speedRange.value;

    // stepSpeed — delay in milliseconds between steps (initially 750 ms)
    let stepSpeed = 750;

    // isRunning — flag indicating whether the computation is running
    let isRunning = false;

    // currentTimeout — stores the ID of the current setTimeout to allow cancellation
    let currentTimeout = null;

    // Create a global object CollatzApp so other scripts can interact with it
    window.CollatzApp = {
        // lastList — stores the last computed sequence
        lastList: [],
        // onNewList — function called when a new sequence is generated (currently null)
        onNewList: null,
    };

    // Event triggered when a character is entered into the inp field
    inp.addEventListener("beforeinput", e => {
        // Check if a character was entered (e.data)
        if (e.data && !/^\d+$/.test(e.data)) {
            // If the character is not a digit, cancel the input
            e.preventDefault();
        }
    });

    // Function finds the maximum number in a list (ignores strings)
    function maxOfList(list) {
        // Initial max value — null
        let max = null;

        // Iterate over each element in the list
        for (let v of list) {
            // Check if the element is a number or BigInt
            if (typeof v === "number" || typeof v === "bigint") {
                // If max is not set yet or the current element is greater than max
                if (max === null || v > max) {
                    // Update max
                    max = v;
                }
            }
        }

        // Return the maximum number found
        return max;
    }

    // Function shortens long numbers for display
    function shortenNumForCND(value, mode = 'auto') {
        // Convert the value to a string (bigint or number)
        let str = (typeof value === 'bigint') ? value.toString() : String(value);

        // If the string is shorter than 12 characters, return as is
        if (str.length <= 12) return str;

        // If mode is 'dots', return "123456...7890"
        if (mode === 'dots') {
            return str.slice(0, 6) + '...' + str.slice(-4);
        }

        // If mode is 'e' (exponential), return "1.234e+10"
        if (mode === 'e') {
            const first = str[0];           // First digit
            const after = str.slice(1);     // Remaining part
            const exp = after.length;       // Length of the remainder = exponent
            return `${first}.${after.slice(0, 3)}e+${exp}`;
        }

        // If mode is 'auto' and the string is shorter than 15 characters
        if (mode === 'auto') {
            if (str.length <= 15) {
                const first = str[0];       // First digit
                const after = str.slice(1); // Remaining part
                const exp = after.length;   // Exponent
                return `${first}.${after.slice(0, 3)}e+${exp}`;
            }
        }

        // If none of the conditions apply, return the string as is
        return str;
    }

    // Function sets up a listener for the speed slider
    function speedRangeGetValue(){
        // When the slider value changes
        speedRange.addEventListener('input', () => {
            // Convert the value to a number
            currentSpeed = Number(speedRange.value)
            // Display the speed as "2x", "3x", etc.
            valueLabel.innerHTML = currentSpeed + 'x';

            // Depending on the speed, set the delay between steps
            if (currentSpeed == 1) {
                stepSpeed = 750;    // 1x — 750 ms
            } else if (currentSpeed == 2) {
                stepSpeed = 150;    // 2x — 150 ms
            } else if (currentSpeed == 3) {
                stepSpeed = 50;     // 3x — 50 ms
            } else if (currentSpeed == 4) {
                stepSpeed = 10;     // 4x — 10 ms
            } else if (currentSpeed == 5) {
                stepSpeed = false;  // 5x — no delay (very fast)
            }
        })
    }

    // Function animates the sequence steps
    function playSteps(list, i = 0) {
        // If we've reached the end of the list, stop execution
        if (i >= list.length) {
            isRunning = false;  // Reset the running flag
            return;
        }

        // Get the current element from the list
        const value = list[i];

        // Create a new <p> element to display the step
        const p = document.createElement('p');
        
        // If the element is a number, add the step number
        p.textContent = (typeof value === 'number' || typeof value === 'bigint')
            ? `${i + 1}. ${value}` 
            : value;

        // Append the element to the steps container
        steps.appendChild(p);

        // Scroll the steps container to the bottom to show the latest element
        steps.scrollTo({ top: steps.scrollHeight });

        // Get the sublist from the start up to the current step (inclusive)
        const shown = list.slice(0, i + 1);

        // Count the number of steps (only numeric elements)
        const stepsCount = shown.filter(x => typeof x === 'number' || typeof x === 'bigint').length;

        // Update the step counter on the page
        counter.textContent = `количество шагов: ${stepsCount}`;

        // Find the maximum number among the shown ones
        const max = maxOfList(shown);

        // Update the display of the maximum number
        maxstat.textContent = `самое большое число: ${max === null ? '-' : String(max)}`;

        // Update the current number on the indicator
        currentNum.textContent = (typeof value === 'number' || typeof value === 'bigint')
                                 ? shortenNumForCND(value, 'e') : '1';

        // Update the graph with a small delay
        setTimeout(() => {
            // Call the graph update function
            updateGraph(shown);
        }, 50); // 50ms delay before updating the graph

        // Set a timer for the next step
        currentTimeout = setTimeout(() => {
            // Recursively call playSteps for the next element
            playSteps(list, i + 1);
        }, stepSpeed); // With a delay depending on the speed
    }

    // Call the speed slider setup function
    speedRangeGetValue();

    // Function checks and converts a string to a number (Number or BigInt)
    function IntOrBigInt(inputValue) {
        // Remove leading/trailing spaces
        const s = inputValue.trim();

        // Check if the string consists only of digits
        if (!/^[0-9]+$/.test(s)) {
            // If not — return an error
            return { error: "Введите положительное число."};
        }

        // Remove fractional part (if any)
        const normalized = s.split('.')[0]

        // If the string is longer than 2 characters, use BigInt
        if (normalized.length > 2) {
            return { value: BigInt(s), isBig: true };
        }

        // Otherwise use Number
        return { value: Number(s), isBig: false };
    }

    // Function temporarily changes the text of an element for a given time
    function changeForASec(item, changetxt, time){
        // Save the old text
        old = item.textContent
        // Change the text to the new one
        item.textContent = changetxt
        // After the specified time, revert to the old text
        setTimeout(() => {item.innerHTML = old;}, time)
    }

    // Add a click handler to the copy button
    copyBtn.addEventListener('click', () => {
        // Parse the input value
        const parsed = IntOrBigInt(inp.value);

        // Compute the Collatz sequence
        const spisok = collatzSmart(parsed.value, parsed.isBig);

        // Filter only numbers (remove strings like "cycle reached")
        const numsOnly = spisok.filter(x => typeof x === "number" || typeof x === "bigint");

        // Join the numbers into a string with line breaks
        const textToCopy = numsOnly.join('\n');

        // Copy the text to the clipboard
        navigator.clipboard.writeText(textToCopy)
            // If the copy was successful
            .then(() => {
                // Show "Copied!" for 500 ms
                changeForASec(copyBtn, 'Скопировано!', 500)
            })
            // If an error occurred
            .catch(err => {
                // Show the error for 500 ms
                changeForASec(copyBtn, `Error: ${err}`, 500)
            })
    })

    // Function checks if a number is even
    function isEven(number){
        // Returns true if the number is divisible by 2
        return number % 2 === 0;
    }

    // Add a click handler to the main button
    btn.addEventListener('click', function(){
        // Clear the steps container
        steps.textContent = '';

        // Parse the input value
        const parsed = IntOrBigInt(inp.value);
        console.log('parsed:', parsed, typeof parsed.value);

        // If there was an error — display it
        if (parsed.error) {
            steps.textContent = parsed.error;
            return;
        }

        // Compute the sequence
        const spisok = collatzSmart(parsed.value, parsed.isBig);

        // Save the sequence to the global object
        window.CollatzApp.lastList = spisok;

        // If the onNewList function is defined, call it
        if (typeof window.CollatzApp.onNewList === 'function') {
            window.CollatzApp.onNewList(spisok);
        }

        // If the process is already running, stop it
        if(isRunning) {
            clearTimeout(currentTimeout);   // Clear the current timer
            isRunning = false;              // Reset the flag
        }

        // Set the running flag
        isRunning = true;

        // Start the step animation
        playSteps(spisok);
    })

    // Function computes the Collatz sequence
    function collatzSmart(n, isBig) {
        console.log('collatzSmart start, n:', n, typeof n, 'isBig:', isBig);

        // Create a list starting with the input number
        const spisok = [n];

        // Define constants depending on the type (number or bigint)
        const ONE = isBig ? 1n : 1;
        const TWO = isBig? 2n : 2;
        const THREE = isBig? 3n : 3;

        // While n is not equal to 1
        while (n !== ONE) {
            // If n is even
            if (n % TWO === (isBig ? 0n : 0)) {
                n = n / TWO;        // Divide by 2
            } else {
                n = n * THREE + ONE // Otherwise: multiply by 3 and add 1
            }

            // Add the new value to the list
            spisok.push(n);

            // If the list becomes too long — stop
            if (spisok.length > 16000) {
                spisok.push('Отличное число, но шаги вызывают приступ у сайта!');
                break;
            }
        }
        
        // If n becomes 1, add a message about completion
        if (n === ONE) {
            spisok.push("Цикл достигнут.")
        }

        // Return the list of steps
        return spisok;
    }

    // Graphical logic
    // Variable to store the graph instance
    let graphInstance = null;

    // Function updates the graph based on the list of steps
    function updateGraph(list) {
        // Filter only numeric elements
        const spis = list.filter(x => typeof x === 'number' || typeof x === 'bigint');

        // Convert numbers to logarithmic scale for the graph
        const nums = spis.map(x => graphLogSize(x));

        // If the graph doesn't exist yet — initialize it
        if (!graphInstance) {
            // Initialize the graph in the element with id 'sim-graph' in dark theme
            graphInstance = echarts.init(document.getElementById('sim-graph'), 'dark');
            // Show loading indicator
            graphInstance.showLoading();
        }

        // Graph options
        var option = {
            // Graph title
            title: {
                text: 'Linear chart'
            },

            // Tooltip shown when hovering over the graph
            tooltip: {
                // Shown when hovering over the axis
                trigger: 'axis',
                // Function that determines what to show in the tooltip
                formatter: function (params) {
                    // Get the first element from the parameters (since it's an axis)
                    const p = params[0];
                    // Step number
                    const step = p.dataIndex;
                    // Value at this step
                    const value = spis[step];

                    // If the value is missing, just show the step
                    if (value === undefined) {
                        return `Step: ${step}`;
                    }

                    // Check if the number is even (for displaying the operation)
                    const isEven = (typeof value === 'bigint')
                        ? (value % 2n === 0n)    // For bigint
                        : (value % 2 === 0);     // For number

                    // Determine the operation
                    const oper = isEven ? "/ 2" : "* 3 + 1";

                    // Return an HTML string for the tooltip
                    return `
                        Step: ${step}<br>
                        Value: ${toolTipShorten(value)}<br>
                        Operation: ${oper}
                    `;
                }
            },

            // Toolbar (buttons: zoom, reset, save)
            toolbox: {
                feature: {
                    // Zoom tool
                    dataZoom: {
                        // Disable zoom on the Y-axis
                        yAxisIndex: 'none'
                    },
                    // Reset button
                    restore: {},
                    // Save as image button
                    saveAsImage: {}
                }
            },

            // Zoom tools (mouse wheel and slider)
            dataZoom: [
                {
                    // Internal zoom (works with mouse wheel)
                    type: 'inside',
                    start: 0,   // Start of visible range
                    end: 100    // End of visible range
                },
                {
                    // Visible slider at the bottom of the graph
                    start: 0,
                    end: 10
                }
            ],

            // X-axis (steps)
            xAxis: {
                type: 'category',           // Categorical axis (integers)
                name: 'Step',               // Axis label
                boundaryGap: false,         // No gap between points
                data: spis.map((_, i) => i) // Array of step numbers
            },

            // Y-axis (values)
            yAxis: {
                type: 'value',              // Numerical axis
                name: 'Value',              // Axis label
                // Formatting of axis labels on Y
                axisLabel: {
                    // Function that determines how numbers are displayed on the Y-axis
                    formatter: function(v) {
                        // If the list is empty — just format the value
                        if (!Array.isArray(spis) || spis.length === 0) return yAxisValueShorten(v);

                        // Find the value in the list closest to the current v
                        let nearestIdx = 0;
                        let minDiff = Infinity;
                        for (let i = 0; i < nums.length; i++) {
                            // Difference between the logarithmic value and v
                            const d = Math.abs(nums[i] - v);
                            if (d < minDiff) { 
                                minDiff = d; 
                                nearestIdx = i; 
                            }
                        }

                        // Find the original value
                        const orig = spis[nearestIdx];

                        // Return the formatted value
                        return formatOriginalForAxis(orig);
                    }
                }
            },

            // Data to display on the graph
            series: [{
                type: 'line',           // Line chart
                data: nums,             // Data (in logarithmic scale)
                showSymbol: true,       // Show points
                symbol: 'circle',       // Shape of points
                symbolSize: 6           // Size of points
            }]
        }

        // Apply settings to the graph (notMerge = true — replaces old ones)
        graphInstance.setOption(option, true);

        // Hide the loading indicator
        graphInstance.hideLoading();
    }

    // Function called when a new sequence is received
    window.CollatzApp.onNewList = function(list) {
        console.log("Список получен! Победа!");
        // Do not call drawGraph, as updates are now done via updateGraph
    };
});

// Helper functions outside the main block

// Function shortens long numbers (e.g., "123456...7890")
function shorten(numStr) {
    // If the string length is less than or equal to 12 — return as is
    if (numStr.length <= 12) return numStr;
    // Otherwise return the first 6 characters + "..." + the last 4 characters
    return numStr.slice(0, 6) + "..." + numStr.slice(-4);
}

// Function normalizes a value for the graph
function normalize(value) {
    // If the value is a regular number — return it as is
    if (typeof value === 'number') {
        return value;
    }

    // Convert the value to a string
    const str = value.toString();
    // Length of the string
    const len = str.length;

    // If the number fits into Number — return it as Number
    if (value <= BigInt(Number.MAX_SAFE_INTEGER)) {
        return Number(value);
    }

    // Otherwise return the logarithm of the length
    return Math.log10(len);
}

// Function shortens a value for the tooltip
function toolTipShorten(value) {
    // Convert the value to a string
    const s = value.toString();

    // If the string length is less than or equal to 15 — return as is
    if (s.length <= 15) {
        return s;
    }

    // Otherwise return the first 6 characters + "..." + the last 6 characters
    return s.slice(0, 6) + "..." + s.slice(-6);
}

// Function converts a number to logarithmic scale for the graph
function graphLogSize(value) {
    // If the value is a regular number
    if (typeof value === 'number') {
        // If the number is not finite — return NaN
        if (!isFinite(value)) return NaN;
        // Return the base-10 logarithm of the maximum of 1 and value
        return Math.log10(Math.max(1, value));
    }

    // Convert the value to a string
    const s = value.toString();
    // Constant k = 15
    const k = 15
    // First 15 characters of the string
    const leadStr = s.slice(0, k);
    // Convert them to a number
    const leadNum = Number(leadStr);
    // Length of the entire string
    const len = s.length;

    // Approximate logarithm
    const approxLog10 = Math.log10(leadNum) + (len - k);

    // Return the approximate logarithm
    return approxLog10; 
}

// Function formats a value for Y-axis labels
function yAxisValueShorten(value) {
    // If the value is not a number or not finite — return an empty string
    if (typeof value !== 'number' || !isFinite(value)) return '';

    // Integer part of the value
    let exp = Math.floor(value);
    // Fractional part of the value
    const frac = value - exp;

    // If the exponent is in a reasonable range (-3 to 6) — return the rounded number
    if (exp >= -3 && exp <= 6) {
        const real = Math.round(Math.pow(10, value));
        return String(real);
    }

    // Calculate the mantissa
    let mantissa = Math.pow(10, frac);
    // Round the mantissa to 2 decimal places
    let mantissaRounded = Number(mantissa.toFixed(2));
    // If the mantissa is >= 10, divide it by 10 and increase the exponent
    if (mantissaRounded >= 10) {
        mantissaRounded = Number((mantissaRounded / 10).toFixed(2));
        exp += 1;
    }

    // Format the mantissa string, removing zeros
    let mantissaStr = mantissaRounded % 1 === 0 ? String(mantissaRounded) : String(mantissaRounded).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');

    // Determine the sign for the exponent
    const sign = exp >= 0 ? '+' : '';
    // Return a string like "mantissa e+exponent"
    return `${mantissaStr}e${sign}${exp}`;
}

// Function formats a value for the Y-axis (shortened)
function formatOriginalForAxis(value, sigDigits = 2) {
    // If the value is undefined — return an empty string
    if (value === undefined) return '';

    // If the value is a regular number
    if (typeof value === 'number') {
        // If not finite — return an empty string
        if (!isFinite(value)) return '';
        // If the absolute value <= 1e6 — return the rounded value
        if (Math.abs(value) <= 1e6) return String(Math.round(value));
        // Split the number into mantissa and exponent
        const parts = value.toExponential(sigDigits - 1).split('e');
        // Remove zeros from the mantissa
        const mant = parts[0].replace(/\.0+$/, '');
        // Exponent as a number
        const exp = Number(parts[1]);
        // Sign for the exponent
        const sign = exp >= 0 ? '+' : '';
        // Return a string like "mantissa e+exponent"
        return `${mant}e${sign}${exp}`;
    }

    // Convert the value to a string
    const s = value.toString();
    // If the string length <= 3 — return as is
    if (s.length <= 3) return s;

    // Exponent = string length - 1
    const exp = s.length - 1;
    // First sigDigits characters of the string
    const lead = s.slice(0, sigDigits);
    // Mantissa = first digits / 10^(sigDigits - 1)
    let mantissa = Number(lead) / Math.pow(10, sigDigits - 1);

    // Round the mantissa to 2 decimal places
    let mantRounded = Number(mantissa.toFixed(2));
    // If the mantissa is >= 10, divide it by 10
    if (mantRounded >= 10) { mantRounded = Number((mantRounded / 10).toFixed(2)); }

    // Format the mantissa string, removing zeros
    const mantStr = mantRounded % 1 === 0 ? String(mantRounded) : String(mantRounded).replace(/\.0+$/, '').replace(/(\.[0-9]*?)0+$/, '$1');
    // Sign for the exponent
    const sign = exp >= 0 ? '+' : '';
    // Return a string like "mantissa e+exponent"
    return `${mantStr}e${sign}${exp}`;
}

// Log elements to the console for debugging
console.log("speed =", document.getElementById("speed"));
console.log("sim-graph =", document.getElementById("sim-graph"));

// Note: This explanation was written by AI because the author is too lazy :P

// P.s. This file also works if you start using it, instead of using original main.js (not sure tho)