// ── State ──────────────────────────────────────────────────────
const state = {
  current: "0",
  previous: "",
  operator: null,
  shouldReset: false,
  justEqualed: false,
};

// ── DOM refs ───────────────────────────────────────────────────
const displayCurrent = document.getElementById("display-current");
const displayHistory = document.getElementById("display-history");
const btnGrid = document.getElementById("btn-grid");

// ── Core calculate ─────────────────────────────────────────────
function calculate(a, op, b) {
  const n1 = parseFloat(a);
  const n2 = parseFloat(b);
  let result;
  switch (op) {
    case "+":
      result = n1 + n2;
      break;
    case "−":
      result = n1 - n2;
      break;
    case "×":
      result = n1 * n2;
      break;
    case "÷":
      if (n2 === 0) return "Error";
      result = n1 / n2;
      break;
    default:
      return b;
  }
  // Fix floating point (e.g. 0.1 + 0.2)
  return parseFloat(result.toPrecision(12));
}

// ── Handlers ───────────────────────────────────────────────────
function handleDigit(digit) {
  if (state.shouldReset || state.current === "0") {
    // Replace display, but keep '0' for leading zero prevention
    if (digit === "0" && (state.shouldReset || state.current === "0")) {
      state.current = "0";
      if (state.shouldReset) {
        state.current = digit;
      }
    } else {
      state.current = digit;
    }
    state.shouldReset = false;
  } else {
    if (state.current.replace("-", "").length >= 14) return; // length cap
    state.current += digit;
  }
  state.justEqualed = false;
  updateDisplay();
}

function handleDecimal() {
  if (state.shouldReset) {
    state.current = "0.";
    state.shouldReset = false;
    updateDisplay();
    return;
  }
  if (state.current.includes(".")) return;
  state.current += ".";
  updateDisplay();
}

function handleOperator(op) {
  clearActiveOp();

  // Chain operations: 5 + 3 then × computes 8 first
  if (state.operator && !state.shouldReset) {
    const result = calculate(state.previous, state.operator, state.current);
    if (result === "Error") {
      showError();
      return;
    }
    state.current = String(result);
    state.previous = String(result);
  } else {
    state.previous = state.current;
  }

  state.operator = op;
  state.shouldReset = true;
  state.justEqualed = false;

  displayHistory.textContent = `${formatNum(state.previous)} ${op}`;

  // Highlight active operator button
  const opBtn = [...document.querySelectorAll(".btn-operator")].find(
    (b) => b.dataset.operator === op,
  );
  if (opBtn) opBtn.classList.add("active-op");

  updateDisplay();
}

function handleEquals() {
  if (!state.operator) return;

  const expr = `${formatNum(state.previous)} ${state.operator} ${formatNum(state.current)} =`;
  const result = calculate(state.previous, state.operator, state.current);

  if (result === "Error") {
    showError(expr);
    return;
  }

  displayHistory.textContent = expr;
  state.current = String(result);
  state.operator = null;
  state.previous = "";
  state.shouldReset = true;
  state.justEqualed = true;

  clearActiveOp();
  updateDisplay();
}

function handleClear() {
  state.current = "0";
  state.previous = "";
  state.operator = null;
  state.shouldReset = false;
  state.justEqualed = false;
  clearActiveOp();
  displayHistory.textContent = "";
  displayCurrent.classList.remove("error");
  updateDisplay();
  document.querySelector('[data-action="clear"]').textContent = "AC";
}

function handleSign() {
  if (state.current === "0" || state.current === "Error") return;
  state.current = state.current.startsWith("-")
    ? state.current.slice(1)
    : "-" + state.current;
  updateDisplay();
}

function handlePercent() {
  if (state.current === "Error") return;
  state.current = String(parseFloat(state.current) / 100);
  updateDisplay();
}

// ── Display helpers ────────────────────────────────────────────
function formatNum(str) {
  if (!str || str === "Error") return str;
  const n = parseFloat(str);
  if (isNaN(n)) return str;
  // Use locale formatting only for integers or if result is clean
  if (str.includes(".")) {
    // Show as-is but limit decimals shown
    const parts = str.split(".");
    if (parts[1] && parts[1].length > 8) {
      return parseFloat(n.toFixed(8)).toString();
    }
    return str;
  }
  return n.toLocaleString("en-US");
}

function updateDisplay() {
  const num = parseFloat(state.current);
  let display;

  if (state.current === "Error") {
    display = "Error";
  } else if (state.current.endsWith(".")) {
    // User just typed decimal point — keep the dot visible
    display = formatNum(state.current.slice(0, -1)) + ".";
  } else if (!isNaN(num) && !state.current.includes(".")) {
    display = num.toLocaleString("en-US");
  } else {
    display = state.current;
  }

  displayCurrent.textContent = display;

  // Dynamic font size
  displayCurrent.classList.remove("long", "vlong");
  if (display.length > 12) displayCurrent.classList.add("vlong");
  else if (display.length > 8) displayCurrent.classList.add("long");

  // Switch AC <-> C
  const clearBtn = document.querySelector('[data-action="clear"]');
  if (state.current !== "0" || state.previous || state.operator) {
    clearBtn.textContent = "C";
  } else {
    clearBtn.textContent = "AC";
  }
}

function showError(history = "") {
  state.current = "Error";
  state.previous = "";
  state.operator = null;
  state.shouldReset = true;
  displayHistory.textContent = history;
  displayCurrent.textContent = "Error";
  displayCurrent.classList.add("error");
  clearActiveOp();
}

function clearActiveOp() {
  document
    .querySelectorAll(".btn-operator")
    .forEach((b) => b.classList.remove("active-op"));
}

function flashBtn(el) {
  if (!el) return;
  el.classList.add("pressed");
  setTimeout(() => el.classList.remove("pressed"), 120);
}

// ── Event delegation ───────────────────────────────────────────
btnGrid.addEventListener("click", (e) => {
  const btn = e.target.closest(".btn");
  if (!btn) return;

  if (btn.dataset.digit !== undefined) handleDigit(btn.dataset.digit);
  if (btn.dataset.operator !== undefined) handleOperator(btn.dataset.operator);
  if (btn.dataset.action) {
    switch (btn.dataset.action) {
      case "clear":
        handleClear();
        break;
      case "sign":
        handleSign();
        break;
      case "percent":
        handlePercent();
        break;
      case "decimal":
        handleDecimal();
        break;
      case "equals":
        handleEquals();
        break;
    }
  }
});

// ── Keyboard support ───────────────────────────────────────────
const keyMap = {
  0: "0",
  1: "1",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  "+": { type: "op", val: "+" },
  "-": { type: "op", val: "−" },
  "*": { type: "op", val: "×" },
  "/": { type: "op", val: "÷" },
  Enter: { type: "action", val: "equals" },
  "=": { type: "action", val: "equals" },
  Backspace: { type: "backspace" },
  Escape: { type: "action", val: "clear" },
  Delete: { type: "action", val: "clear" },
  ".": { type: "action", val: "decimal" },
  ",": { type: "action", val: "decimal" },
  "%": { type: "action", val: "percent" },
};

document.addEventListener("keydown", (e) => {
  // Prevent scroll on space/arrow
  if ([" ", "ArrowUp", "ArrowDown"].includes(e.key)) e.preventDefault();

  const mapped = keyMap[e.key];
  if (!mapped) return;

  let targetBtn;

  if (typeof mapped === "string") {
    // It's a digit
    targetBtn = document.querySelector(`[data-digit="${mapped}"]`);
    flashBtn(targetBtn);
    handleDigit(mapped);
  } else if (mapped.type === "op") {
    targetBtn = document.querySelector(`[data-operator="${mapped.val}"]`);
    flashBtn(targetBtn);
    handleOperator(mapped.val);
  } else if (mapped.type === "action") {
    targetBtn = document.querySelector(`[data-action="${mapped.val}"]`);
    flashBtn(targetBtn);
    switch (mapped.val) {
      case "equals":
        handleEquals();
        break;
      case "clear":
        handleClear();
        break;
      case "decimal":
        handleDecimal();
        break;
      case "percent":
        handlePercent();
        break;
    }
  } else if (mapped.type === "backspace") {
    targetBtn = document.querySelector('[data-action="clear"]');
    flashBtn(targetBtn);
    if (state.current.length > 1 && state.current !== "Error") {
      state.current = state.current.slice(0, -1) || "0";
      updateDisplay();
    } else {
      handleClear();
    }
  }
});
