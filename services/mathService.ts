
import { CardItem, Difficulty } from '../types';

// Safe factorial function
const factorial = (n: number): number => {
  if (n < 0) return NaN;
  if (n === 0 || n === 1) return 1;
  if (n > 170) return Infinity; // Javascript limitation
  let result = 1;
  for (let i = 2; i <= n; i++) result *= i;
  return result;
};

// Global context for the safe evaluator
const MATH_CONTEXT: any = {
  sqrt: Math.sqrt,
  fact: factorial,
  pow: Math.pow,
};

export const generateInitialDeck = (): Record<number, number> => {
  const deck: Record<number, number> = {};
  for (let i = 0; i <= 10; i++) {
    deck[i] = 2; // 2 cards per number
  }
  return deck;
};

export const evaluateExpression = (items: CardItem[]): number | null => {
  if (items.length === 0) return null;

  try {
    // Basic construction logic...
    // Advanced token parsing for Factorial (!) and Sqrt (√) syntax fixes
    
    // Re-do construction for maximum robustness
    let finalExpr = "";

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const val = item.value;

      if (item.type === 'NUMBER') {
        finalExpr += val;
      } else if (val === '!') {
         // Should be handled by regex replacement later to wrap previous number
         finalExpr += '!'; 
      } else if (val === '√') {
        finalExpr += 'Math.sqrt(';
      } else {
        switch(val) {
          case '×': finalExpr += '*'; break;
          case '÷': finalExpr += '/'; break;
          case '−': finalExpr += '-'; break;
          case '^': finalExpr += '**'; break;
          default: finalExpr += val;
        }
      }
    }
    
    // ALTERNATIVE STRATEGY: Replace the tokens with function calls using regex on the rough string
    // 1. Build basic string with placeholders
    let raw = items.map(i => {
       if (i.type === 'NUMBER') return i.value;
       if (i.value === '×') return '*';
       if (i.value === '÷') return '/';
       if (i.value === '−') return '-';
       if (i.value === '^') return '**';
       return i.value;
    }).join('');

    // 2. Handle Factorial: (\d+)! -> fact($1)
    // Supports 5! -> fact(5). Does NOT support (2+3)! without complex parsing.
    raw = raw.replace(/(\d+)!/g, 'fact($1)');
    
    // 3. Handle Sqrt: √(\d+) -> sqrt($1)
    // Supports √9 -> sqrt(9). 
    raw = raw.replace(/√(\d+)/g, 'sqrt($1)');
    
    // 4. Handle Sqrt with parens: √\( -> sqrt(
    raw = raw.replace(/√\(/g, 'sqrt(');

    // Execute
    // We use Function constructor with context args.
    const func = new Function('fact', 'sqrt', `return ${raw};`);
    const result = func(factorial, Math.sqrt);

    if (!isFinite(result) || isNaN(result)) return null;
    return Number.isInteger(result) ? result : parseFloat(result.toFixed(3));

  } catch (e) {
    return null; // Invalid expression
  }
};

export const generateTarget = (level: number, difficulty: Difficulty): number => {
  let min = 1;
  let max = 10;

  switch (difficulty) {
    case Difficulty.EASY:
      // Linear scaling, stays relatively low
      min = 1 + (level * 2);
      max = 20 + (level * 5);
      break;
      
    case Difficulty.MEDIUM:
      // Faster scaling
      min = 10 + (level * 5);
      max = 50 + (level * 10);
      break;
      
    case Difficulty.HARD:
      // Big numbers fast
      min = 25 + (level * 10);
      max = 100 + (level * 20);
      break;

    case Difficulty.CUSTOM:
      return 0; // Should be set by user
      
    default:
      min = 1; max = 20;
  }

  return Math.floor(Math.random() * (max - min + 1)) + min;
};
