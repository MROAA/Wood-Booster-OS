import { useState } from 'react';

function compute(operation, a, b) {
  switch (operation) {
    case 'add':
      return { success: true, result: a + b, expression: `${a} + ${b} = ${a + b}` };
    case 'subtract':
      return { success: true, result: a - b, expression: `${a} - ${b} = ${a - b}` };
    case 'multiply':
      return { success: true, result: a * b, expression: `${a} * ${b} = ${a * b}` };
    case 'divide':
      if (b === 0) {
        return { success: false, error: 'Nollalla jakaminen kielletty.' };
      }
      return { success: true, result: a / b, expression: `${a} / ${b} = ${a / b}` };
    case 'sqrt':
      if (a < 0) {
        return { success: false, error: 'Negatiivisen luvun neliöjuuri ei ole reaaliluku.' };
      }
      return { success: true, result: Math.sqrt(a), expression: `sqrt(${a}) = ${Math.sqrt(a)}` };
    default:
      return { success: false, error: `Tuntematon operaatio: ${operation}` };
  }
}

export default function CalculatorApp() {
  const [display, setDisplay] = useState('0');
  const [pendingValue, setPendingValue] = useState(null);
  const [pendingOp, setPendingOp] = useState(null);
  const [error, setError] = useState('');
  const [history, setHistory] = useState([]);

  function runOperation(operation, a, b) {
    const outcome = compute(operation, a, b);
    if (!outcome.success) {
      setError(outcome.error);
      return null;
    }
    setError('');
    setHistory((prev) => [outcome.expression, ...prev].slice(0, 10));
    return outcome.result;
  }

  function inputDigit(digit) {
    setError('');
    setDisplay((prev) => {
      if (prev === '0' || pendingOp === 'sqrt') return digit;
      return prev + digit;
    });
  }

  function inputDecimal() {
    setDisplay((prev) => (prev.includes('.') ? prev : `${prev}.`));
  }

  function chooseOperation(operation) {
    const current = parseFloat(display);

    if (operation === 'sqrt') {
      const result = runOperation('sqrt', current);
      if (result !== null) {
        setDisplay(String(result));
      }
      return;
    }

    if (pendingOp && pendingValue !== null) {
      const result = runOperation(pendingOp, pendingValue, current);
      if (result !== null) {
        setPendingValue(result);
        setDisplay(String(result));
      }
    } else {
      setPendingValue(current);
    }

    setPendingOp(operation);
    setDisplay('0');
  }

  function equals() {
    if (!pendingOp || pendingValue === null) return;
    const current = parseFloat(display);
    const result = runOperation(pendingOp, pendingValue, current);
    if (result !== null) {
      setDisplay(String(result));
    }
    setPendingOp(null);
    setPendingValue(null);
  }

  function clear() {
    setDisplay('0');
    setPendingOp(null);
    setPendingValue(null);
    setError('');
  }

  const DIGIT_ROWS = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
  ];

  return (
    <div className="calculator-app">
      <div className="calculator-display">
        <div className="calculator-expression">
          {pendingOp && pendingValue !== null ? `${pendingValue} ${pendingOp}` : ''}
        </div>
        <div className="calculator-value">{display}</div>
        {error && <div className="calculator-error">{error}</div>}
      </div>

      <div className="calculator-pad">
        {DIGIT_ROWS.map((row) => (
          <div className="calculator-row" key={row.join('')}>
            {row.map((digit) => (
              <button key={digit} className="calculator-btn" onClick={() => inputDigit(digit)}>
                {digit}
              </button>
            ))}
          </div>
        ))}
        <div className="calculator-row">
          <button className="calculator-btn" onClick={() => inputDigit('0')}>0</button>
          <button className="calculator-btn" onClick={inputDecimal}>,</button>
          <button className="calculator-btn calculator-btn-op" onClick={() => chooseOperation('sqrt')}>√</button>
        </div>
        <div className="calculator-row">
          <button className="calculator-btn calculator-btn-op" onClick={() => chooseOperation('divide')}>÷</button>
          <button className="calculator-btn calculator-btn-op" onClick={() => chooseOperation('multiply')}>×</button>
          <button className="calculator-btn calculator-btn-op" onClick={() => chooseOperation('subtract')}>−</button>
        </div>
        <div className="calculator-row">
          <button className="calculator-btn calculator-btn-op" onClick={() => chooseOperation('add')}>+</button>
          <button className="calculator-btn calculator-btn-clear" onClick={clear}>C</button>
          <button className="calculator-btn calculator-btn-equals" onClick={equals}>=</button>
        </div>
      </div>

      {history.length > 0 && (
        <div className="calculator-history">
          {history.map((entry, index) => (
            <div className="calculator-history-entry" key={`${entry}-${index}`}>{entry}</div>
          ))}
        </div>
      )}
    </div>
  );
}
