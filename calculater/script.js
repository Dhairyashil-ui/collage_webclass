// ── State ──────────────────────────────────────────────────
let currentVal = '';
let expression = '';
let operator = null;
let prevVal = '';
let justEvaled = false;
let memory = 0;
let isDegrees = true;

// ── DOM refs ───────────────────────────────────────────────
const resultEl = document.getElementById('result');
const exprEl = document.getElementById('expression');
const modeBadge = document.getElementById('modeBadge');
const memInd = document.getElementById('memInd');
const degBtn = document.getElementById('btn-deg');

// ── Particle background ────────────────────────────────────
(function spawnParticles() {
    const container = document.getElementById('particles');
    for (let i = 0; i < 60; i++) {
        const p = document.createElement('div');
        p.className = 'particle';
        p.style.cssText = `
            left: ${Math.random() * 100}%;
            width: ${Math.random() * 3 + 1}px;
            height: ${Math.random() * 3 + 1}px;
            animation-duration: ${Math.random() * 12 + 8}s;
            animation-delay: ${Math.random() * 12}s;
            opacity: ${Math.random() * 0.6 + 0.2};
        `;
        container.appendChild(p);
    }
})();

// ── Display helpers ────────────────────────────────────────
function setDisplay(val) {
    const str = String(val);
    resultEl.classList.remove('shrink', 'extra-shrink');
    if (str.length > 12) resultEl.classList.add('extra-shrink');
    else if (str.length > 9) resultEl.classList.add('shrink');
    resultEl.textContent = str;
}

function setExpression(str) {
    exprEl.textContent = str;
}

function flashDisplay() {
    resultEl.style.color = '#93c5fd';
    setTimeout(() => { resultEl.style.color = ''; }, 180);
}

// ── Ripple effect ──────────────────────────────────────────
function triggerRipple(btn) {
    btn.classList.remove('ripple');
    void btn.offsetWidth; // reflow
    btn.classList.add('ripple');
}

// ── Trig helpers ───────────────────────────────────────────
function toRad(v) { return isDegrees ? (v * Math.PI / 180) : v; }

// ── Safe evaluate ─────────────────────────────────────────
function computeOp(a, op, b) {
    a = parseFloat(a); b = parseFloat(b);
    switch (op) {
        case '+': return a + b;
        case '−': return a - b;
        case '×': return a * b;
        case '÷': return b === 0 ? 'Error' : a / b;
        case '%': return a * b / 100;
    }
}

function formatResult(n) {
    if (n === 'Error') return 'Error';
    if (!isFinite(n)) return 'Error';
    // Limit decimals
    const s = parseFloat(n.toPrecision(12)).toString();
    return s;
}

// ── Handle all button actions ─────────────────────────────
function handleAction(action, val, btn) {
    if (btn) triggerRipple(btn);

    switch (action) {

        case 'digit':
            if (justEvaled) { currentVal = ''; justEvaled = false; }
            if (currentVal === '0' && val !== '0') currentVal = val;
            else if (currentVal.length < 15) currentVal += val;
            setDisplay(currentVal || '0');
            highlightOp(null);
            break;

        case 'decimal':
            if (justEvaled) { currentVal = '0'; justEvaled = false; }
            if (!currentVal.includes('.')) {
                currentVal = (currentVal || '0') + '.';
                setDisplay(currentVal);
            }
            break;

        case 'op':
            if (currentVal === '' && val === '−') {
                currentVal = '-'; setDisplay('-'); break;
            }
            if (operator && currentVal !== '' && prevVal !== '') {
                // Chain calculation
                const res = computeOp(prevVal, operator, currentVal);
                const fmt = formatResult(res);
                setExpression(`${prevVal} ${operator} ${currentVal} ${val}`);
                setDisplay(fmt);
                prevVal = fmt;
                currentVal = '';
            } else {
                if (currentVal !== '') prevVal = currentVal;
                setExpression(`${prevVal} ${val}`);
            }
            operator = val;
            currentVal = '';
            justEvaled = false;
            highlightOp(val);
            break;

        case 'equals':
            if (operator && prevVal !== '' && currentVal !== '') {
                const res = computeOp(prevVal, operator, currentVal);
                const fmt = formatResult(res);
                setExpression(`${prevVal} ${operator} ${currentVal} =`);
                setDisplay(fmt);
                flashDisplay();
                prevVal = fmt;
                currentVal = '';
                operator = null;
                justEvaled = true;
                highlightOp(null);
            }
            break;

        case 'clearAll':
            currentVal = ''; prevVal = ''; operator = null;
            justEvaled = false;
            setDisplay('0'); setExpression('');
            highlightOp(null);
            break;

        case 'clearEntry':
            currentVal = '';
            setDisplay('0');
            break;

        case 'backspace':
            if (currentVal.length > 0) {
                currentVal = currentVal.slice(0, -1);
                setDisplay(currentVal || '0');
            }
            break;

        case 'negate':
            if (currentVal !== '') {
                currentVal = currentVal.startsWith('-')
                    ? currentVal.slice(1)
                    : '-' + currentVal;
                setDisplay(currentVal);
            } else if (prevVal !== '' && justEvaled) {
                prevVal = prevVal.startsWith('-') ? prevVal.slice(1) : '-' + prevVal;
                setDisplay(prevVal);
            }
            break;

        case 'sqrt': applyFn(Math.sqrt); break;
        case 'square': applyFn(x => x * x); break;
        case 'inv': applyFn(x => x === 0 ? 'Error' : 1 / x); break;
        case 'sin': applyFn(x => Math.sin(toRad(x))); break;
        case 'cos': applyFn(x => Math.cos(toRad(x))); break;
        case 'tan': applyFn(x => Math.tan(toRad(x))); break;
        case 'log': applyFn(x => x <= 0 ? 'Error' : Math.log10(x)); break;
        case 'ln': applyFn(x => x <= 0 ? 'Error' : Math.log(x)); break;
        case 'pi':
            currentVal = String(Math.PI);
            setDisplay(currentVal);
            break;

        case 'toggleDeg':
            isDegrees = !isDegrees;
            modeBadge.textContent = isDegrees ? 'DEG' : 'RAD';
            degBtn.textContent = isDegrees ? 'DEG' : 'RAD';
            break;

        /* Memory */
        case 'mc':
            memory = 0;
            memInd.style.display = 'none';
            break;
        case 'mr':
            currentVal = String(memory);
            justEvaled = false;
            setDisplay(currentVal);
            break;
        case 'ms':
            memory = parseFloat(currentVal || prevVal || 0);
            memInd.style.display = 'inline';
            break;
        case 'madd':
            memory += parseFloat(currentVal || prevVal || 0);
            memInd.style.display = 'inline';
            break;
    }
}

function applyFn(fn) {
    const operand = currentVal !== '' ? parseFloat(currentVal) : parseFloat(prevVal || 0);
    const res = fn(operand);
    const fmt = res === 'Error' ? 'Error' : formatResult(res);
    currentVal = fmt;
    justEvaled = true;
    setDisplay(fmt);
    if (fmt !== 'Error') flashDisplay();
}

function highlightOp(op) {
    document.querySelectorAll('.btn.op').forEach(b => {
        b.classList.toggle('active-op', b.dataset.val === op);
    });
}

// ── Event listeners ────────────────────────────────────────
document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('click', () => {
        handleAction(btn.dataset.action, btn.dataset.val, btn);
    });
});

// ── Keyboard support ──────────────────────────────────────
document.addEventListener('keydown', (e) => {
    const key = e.key;
    if (key >= '0' && key <= '9') handleAction('digit', key);
    else if (key === '.') handleAction('decimal');
    else if (key === '+') handleAction('op', '+');
    else if (key === '-') handleAction('op', '−');
    else if (key === '*') handleAction('op', '×');
    else if (key === '/') { e.preventDefault(); handleAction('op', '÷'); }
    else if (key === '%') handleAction('op', '%');
    else if (key === 'Enter' || key === '=') handleAction('equals');
    else if (key === 'Backspace') handleAction('backspace');
    else if (key === 'Escape') handleAction('clearAll');
    else if (key === 'Delete') handleAction('clearEntry');
});
