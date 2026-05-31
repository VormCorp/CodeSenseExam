'use strict';

// ════════════════════════════════════════════════════════
//  ANTI-CHEAT
// ════════════════════════════════════════════════════════

window.addEventListener('keydown', e => {
  const k = e.key.toUpperCase();
  if (
    e.key === 'F12' ||
    (e.ctrlKey && e.shiftKey && (k === 'I' || k === 'J' || k === 'C')) ||
    (e.ctrlKey && !e.shiftKey && k === 'U')
  ) { e.preventDefault(); e.stopPropagation(); return false; }
});

document.addEventListener('contextmenu', e => { if (_qActive()) e.preventDefault(); });

function _qActive() {
  return document.getElementById('quizScreen')?.classList.contains('active');
}

let tabSwitches = 0;

(function _initTabWarn() {
  const el = document.createElement('div');
  el.id = 'tabWarnOverlay';
  el.className = 'overlay';
  el.innerHTML =
    '<div class="omodal">'
    + '<h3>⚠️ Tab Switch Detected</h3>'
    + '<p id="tabWarnMsg"></p>'
    + '<div class="omodal-btns"><button class="btn-nav" id="tabWarnDismiss">Return to Quiz</button></div>'
    + '</div>';
  document.body.appendChild(el);
  document.getElementById('tabWarnDismiss').addEventListener('click', () => {
    document.getElementById('tabWarnOverlay').classList.remove('show');
  });
})();

document.addEventListener('visibilitychange', () => {
  if (!_qActive()) return;
  if (document.hidden) {
    tabSwitches++;
  } else if (tabSwitches > 0) {
    const penalty = tabSwitches >= 3 && tabSwitches % 2 === 1;
    document.getElementById('tabWarnMsg').textContent =
      'Tab switch #' + tabSwitches + ' has been recorded in your results.'
      + (penalty ? ' You have lost a life for repeated switching.' : '');
    document.getElementById('tabWarnOverlay').classList.add('show');
    if (penalty) loseLife();
  }
});

// ════════════════════════════════════════════════════════
//  SECURE CONFIG
// ════════════════════════════════════════════════════════

// PIN stored as SHA-256('8115' + salt) — plaintext never present
const _PH = '0860faf9a34aa1f04a2a7ee5723d0813cd3712bb0150b50f675973867685583e';

async function _vp(input) {
  const data = new TextEncoder().encode(input + 'cs_vorm_2025');
  const buf = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('') === _PH;
}

// Correct answers — XOR-obfuscated + base64 encoded
const _EA = 'FENBEhV+Xl8NYn9eXw0KEl5cDWJtME8NGwxQQQN4bS9BegljQEEVZGNDQU9MIx5BEBV+XjYDe21eT2IbY1AsA2RjKVwNC2NBMA0IYxwYTVVjKU9jG2NQLgMVbTNPDRsLUDANCmMpXQ0KEl5fDQtjQUF6CRJeXA1if15cDQoSXlwNYn9eXA0LEl5fDQhjKV0NCGNAQRVkY0JBEBUUQkETFXxeWHwVFEJBExV7L0F6CGNAQRJkEg==';
const _XK = [0x4f, 0x72, 0x6d, 0x21, 0x39];
const _A = (function() {
  const raw = atob(_EA);
  return JSON.parse(raw.split('').map((c, i) =>
    String.fromCharCode(c.charCodeAt(0) ^ _XK[i % _XK.length])
  ).join(''));
})();

const EMAIL_RE = /^[a-zA-Z0-9._%+\-]+@education\.nsw\.gov\.au$/;
let studentEmail = '';
let currentQ = 0;
let lives = 3;
let hintsLeft = 3;
let answered  = new Array(35).fill(false);
let scores    = new Array(35).fill(0);
let userAns   = new Array(35).fill(null);
let hintUsed  = new Array(35).fill(false);

// ════════════════════════════════════════════════════════
//  QUESTIONS  (answers removed — stored in _A above)
// ════════════════════════════════════════════════════════
const Q = [

// ─── 1 · Unistructural ─────────────────────────────────
{ id:1, solo:'uni', label:'Getting Started', section:'A', pts:1, type:'choice',
  text:'Which symbol do you use to assign (store) a value into a variable?',
  choices:['==','=','!=',':'],
  hint:'One of these checks whether two things are equal. One stores a value. They look similar but do completely different jobs.',
  fb:{ok:'✓ Correct! A single = stores a value into a variable. Double == checks if two things are equal.',
      bad:'✗ A single = is the assignment operator — it stores a value. == checks equality.'}},

// ─── 2 · Unistructural ─────────────────────────────────
{ id:2, solo:'uni', label:'Getting Started', section:'A', pts:1, type:'choice',
  text:'What data type is the value "Hello"?',
  choices:['int','float','bool','str'],
  hint:'In Python, text values are always wrapped in quotes. The data type name is short for "string".',
  fb:{ok:'✓ Correct! Text values in Python are called strings — str for short.',
      bad:'✗ Text wrapped in quotes is a string — str in Python.'}},

// ─── 3 · Unistructural ─────────────────────────────────
{ id:3, solo:'uni', label:'Getting Started', section:'A', pts:1, type:'choice',
  text:'What is the value of x after these two lines run?\n\nx = 4\nx = 10',
  choices:['4','10','14','x'],
  hint:'Python runs line by line from top to bottom. When you assign a variable twice, what happens to the first value?',
  fb:{ok:'✓ Correct! Python runs line by line. The second assignment replaces the first, so x ends up as 10.',
      bad:'✗ Python runs top to bottom. The second line x = 10 replaces the first, so x is 10.'}},

// ─── 4 · Unistructural ─────────────────────────────────
{ id:4, solo:'uni', label:'Getting Started', section:'A', pts:1, type:'hotspot',
  text:'Click the line that contains a syntax error:',
  lines:['name = "Sam"', 'age = 12', 'print(name', 'score = 100'],
  hint:'Every opening bracket in Python needs a matching closing bracket on the same line.',
  fb:{ok:'✓ Correct! Line 3 is missing the closing bracket. It should be print(name).',
      bad:'✗ Line 3 is the error — print(name is missing its closing bracket ).'}},

// ─── 5 · Multistructural ───────────────────────────────
{ id:5, solo:'multi', label:'Finding My Feet', section:'A', pts:2, type:'selectall',
  text:'Select ALL of the valid Python variable names:',
  options:['my_score','2fast','total','_count','first name'],
  hint:'Variable names have three rules — think about what characters are allowed, what they can start with, and whether spaces are permitted.',
  fb:{ok:'✓ All correct! my_score, total and _count are all valid. 2fast starts with a number (not allowed) and first name has a space (not allowed).',
      part:'⚠ Partial marks. 2fast starts with a number — not allowed. first name has a space — not allowed.',
      bad:'✗ Valid names can use letters, numbers and underscores but cannot start with a number or contain spaces.'}},

// ─── 6 · Multistructural ───────────────────────────────
{ id:6, solo:'multi', label:'Finding My Feet', section:'A', pts:2, type:'choice',
  text:'What does this code print?\n\nx = 3\nprint(x + 2)',
  choices:['3','5','x + 2','32'],
  hint:'When Python sees a variable name inside print(), it uses the value stored in that variable — not the name itself.',
  fb:{ok:'✓ Correct! x holds the value 3, so x + 2 = 5.',
      bad:'✗ x holds 3, so Python calculates 3 + 2 = 5 and prints that.'}},

// ─── 7 · Multistructural ───────────────────────────────
{ id:7, solo:'multi', label:'Finding My Feet', section:'A', pts:2, type:'dragorder',
  text:'These lines build a greeting message. Drag them into the correct order:',
  items:[
    {id:'B', text:'B  —  name = "Alex"'},
    {id:'C', text:'C  —  greeting = "Hello " + name'},
    {id:'A', text:'A  —  print(greeting)'}
  ],
  hint:'You can only use a variable after it has been created. Which line creates name? Which line needs name to already exist?',
  fb:{ok:'✓ Correct! First create name, then build greeting using name, then print greeting.',
      bad:'✗ You must create name first, then build greeting (which uses name), then print greeting.'}},

// ─── 8 · Multistructural ───────────────────────────────
{ id:8, solo:'multi', label:'Finding My Feet', section:'A', pts:2, type:'selectall',
  text:'Select ALL of the valid Python comparison operators:',
  options:['x == 5','x = 5','x != 5','x <> 5','x >= 5'],
  hint:'Comparison operators always produce True or False. One of these options is assignment, not comparison. One was removed from Python a long time ago.',
  fb:{ok:'✓ Correct! == (equal), != (not equal) and >= (greater or equal) are all comparisons. Single = is assignment. <> is not valid Python.',
      part:'⚠ Nearly there. x = 5 is assignment, not comparison. x <> 5 is not valid Python 3.',
      bad:'✗ Valid comparisons: ==, !=, >=. Single = assigns a value. <> is not valid Python 3.'}},

// ─── 9 · Multistructural ───────────────────────────────
{ id:9, solo:'multi', label:'Finding My Feet', section:'A', pts:2, type:'choice',
  text:'What does this code print?\n\nscore = 40\nif score >= 50:\n    print("Pass")\nelse:\n    print("Not yet")',
  choices:['Pass','Not yet','40','Nothing'],
  hint:'The condition checks whether score is 50 or more. Ask yourself: is 40 greater than or equal to 50?',
  fb:{ok:'✓ Correct! 40 is not >= 50, so the condition is False and the else branch runs.',
      bad:'✗ 40 is not >= 50, so the if condition is False. Python runs the else branch instead.'}},

// ─── 10 · Multistructural ──────────────────────────────
{ id:10, solo:'multi', label:'Finding My Feet', section:'A', pts:2, type:'match',
  text:'Match each value on the left to its correct data type on the right:',
  pairs:[
    {val:'42',       type:'int'},
    {val:'"yes"',    type:'str'},
    {val:'3.5',      type:'float'},
    {val:'False',    type:'bool'}
  ],
  hint:'Think about what each category means — whole numbers, decimals, text in quotes, and true/false answers.',
  fb:{ok:'✓ Correct! Whole numbers → int, decimals → float, text in quotes → str, True/False → bool.',
      part:'⚠ Some were wrong. Whole numbers are int, decimals are float, text in quotes is str, True/False is bool.',
      bad:'✗ 42 → int, 3.5 → float, "yes" → str, False → bool.'}},

// ─── 11 · Relational ───────────────────────────────────
{ id:11, solo:'rel', label:'Connecting the Dots', section:'A', pts:3, type:'choice',
  text:'What does this code print?\n\nfor i in range(3):\n    print(i)',
  choices:['1 2 3','0 1 2','0 1 2 3','3'],
  hint:'range() starts counting from a specific number by default, and it always stops before the number you give it — not at it.',
  fb:{ok:'✓ Correct! range(3) produces 0, 1, 2 — it starts at 0 and stops before reaching 3.',
      bad:'✗ range(3) produces 0, 1, 2. It starts at 0 and stops before (not at) 3.'}},

// ─── 12 · Relational ───────────────────────────────────
{ id:12, solo:'rel', label:'Connecting the Dots', section:'A', pts:3, type:'hotspot',
  text:'This should print "Pass" when score is 50 or above. Click the line with the logic error:',
  lines:['score = 50', 'if score > 50:', '    print("Pass")', 'else:', '    print("Try again")'],
  hint:'There is a difference between "more than" and "at least as much as". Which one includes the boundary value itself?',
  fb:{ok:'✓ Correct! > 50 misses exactly 50. It should be >= 50 (50 or more).',
      bad:'✗ Line 2 is the error. > 50 excludes exactly 50. It should be >= 50 to include the boundary.'}},

// ─── 13 · Relational ───────────────────────────────────
{ id:13, solo:'rel', label:'Connecting the Dots', section:'A', pts:3, type:'dragorder',
  text:'Arrange these lines so the program prints a personalised score message:',
  items:[
    {id:'C', text:'C  —  score_text = str(score)'},
    {id:'A', text:'A  —  print("Your score is: " + score_text)'},
    {id:'B', text:'B  —  score = 25'}
  ],
  hint:'You cannot convert a variable that does not exist yet, and you cannot print a variable that has not been created. What must come first?',
  fb:{ok:'✓ Correct! Create score first, convert it to a string, then print it.',
      bad:'✗ Order: score = 25 first, then score_text = str(score), then the print.'}},

// ─── 14 · Relational ───────────────────────────────────
{ id:14, solo:'rel', label:'Connecting the Dots', section:'A', pts:3, type:'selectall',
  text:'What does this code print? Select ALL values that appear in the output:\n\nfor i in range(1, 6):\n    print(i)',
  options:['0','1','3','5','6'],
  hint:'range() always stops before the end number, not at it. What is the first number range() gives when you start at 1?',
  fb:{ok:'✓ Correct! range(1, 6) produces 1, 2, 3, 4, 5 — it starts at 1 and stops before 6.',
      part:'⚠ range(1, 6) starts at 1 (not 0) and stops before 6 (so 6 never appears).',
      bad:'✗ range(1, 6) produces 1, 2, 3, 4, 5. It starts at 1 and stops before reaching 6.'}},

// ─── 15 · Relational ───────────────────────────────────
{ id:15, solo:'rel', label:'Connecting the Dots', section:'A', pts:3, type:'choice',
  text:'What does this code print?\n\nage = 14\nif age >= 18:\n    print("Adult")\nelif age >= 13:\n    print("Teen")\nelse:\n    print("Child")',
  choices:['Adult','Teen','Child','Adult and Teen'],
  hint:'Python checks each condition from top to bottom and stops at the first one that is True. Does 14 satisfy the first condition?',
  fb:{ok:'✓ Correct! 14 is not >= 18 (False), but 14 is >= 13 (True), so "Teen" prints and Python skips the rest.',
      bad:'✗ Python checks top to bottom. 14 >= 18 is False, 14 >= 13 is True → "Teen". It never reaches the else.'}},

// ─── 16 · Relational ───────────────────────────────────
{ id:16, solo:'rel', label:'Connecting the Dots', section:'A', pts:3, type:'match',
  text:'Match each code snippet to the value it outputs:',
  pairs:[
    {val:'print(10 - 3)',  type:'7'},
    {val:'print(10 // 4)', type:'2'},
    {val:'print(3 * 4)',   type:'12'},
    {val:'print(9 - 9)',   type:'0'}
  ],
  hint:'Three of these are straightforward arithmetic. The // operator might be new — it divides and then drops any decimal, giving a whole number result.',
  fb:{ok:'✓ Correct! 10-3=7, 10//4=2 (floor division drops the remainder), 3*4=12, 9-9=0.',
      part:'⚠ Check the // operator — it divides and drops the decimal part, so 10 // 4 = 2 (not 2.5).',
      bad:'✗ 10-3=7, 10//4=2 (floor division), 3*4=12, 9-9=0.'}},

// ─── 17 · Extended Abstract ────────────────────────────
{ id:17, solo:'ext', label:'Thinking Like a Programmer', section:'A', pts:4, type:'dragorder',
  text:'Arrange these lines to make a program that counts up and prints each number while count is less than 4:',
  items:[
    {id:'C', text:'C  —  while count < 4:'},
    {id:'A', text:'A  —  print(count)'},
    {id:'B', text:'B  —  count = 1'},
    {id:'D', text:'D  —  count = count + 1'}
  ],
  hint:'You need to set up the variable before the loop, start the loop, do the action inside it, then update the variable so the loop eventually ends.',
  fb:{ok:'✓ Correct! Set count to 1, start the while loop, print inside it, then increase count so it eventually stops.',
      bad:'✗ Order: count = 1, while count < 4:, then indented print(count), then indented count = count + 1.'}},

// ─── 18 · Extended Abstract ────────────────────────────
{ id:18, solo:'ext', label:'Thinking Like a Programmer', section:'A', pts:4, type:'hotspot',
  text:'This program should count down from 5 to 1 but runs forever instead. Click the line causing the infinite loop:',
  lines:['count = 5', 'while count > 0:', '    print(count)', '    count + 1'],
  hint:'There is a difference between calculating something and storing the result back into a variable. Which line does a calculation but never saves the answer?',
  fb:{ok:'✓ Correct! count + 1 calculates a new value but throws it away — count never changes. It needs to be count = count - 1.',
      bad:'✗ Line 4 is the bug. count + 1 calculates but does not update count. It should be count = count - 1.'}},

// ─── 19 · Extended Abstract ────────────────────────────
{ id:19, solo:'ext', label:'Thinking Like a Programmer', section:'A', pts:4, type:'selectall',
  text:'A student wants to print every number from 1 to 5 using a for loop.\n\nSelect ALL options that correctly do this:',
  options:[
    'for i in range(1, 6): print(i)',
    'for i in range(5): print(i)',
    'for i in range(1, 5): print(i)',
    'for i in range(1, 6, 1): print(i)'
  ],
  hint:'range() always stops before the end value — so to include 5, what end value do you need? The third argument in range() is the step size. A step of 1 moves one number at a time.',
  fb:{ok:'✓ Correct! Options 1 and 4 both print 1 to 5. Option 2 starts at 0. Option 3 stops before 5.',
      part:'⚠ Check carefully. range(5) starts at 0. range(1, 5) stops at 4, missing 5.',
      bad:'✗ Only range(1, 6) and range(1, 6, 1) correctly produce 1, 2, 3, 4, 5.'}},

// ─── 20 · Extended Abstract ────────────────────────────
{ id:20, solo:'ext', label:'Thinking Like a Programmer', section:'A', pts:4, type:'hotspot',
  text:'This program should print every item in the list, but it only prints the same thing three times. Click the line with the bug:',
  lines:['fruits = ["apple", "banana", "cherry"]', 'for item in fruits:', '    print(fruits)'],
  hint:'Inside a for loop, the loop variable holds one item at a time. Are you printing the loop variable, or the whole list?',
  fb:{ok:'✓ Correct! print(fruits) prints the entire list on every loop. It should be print(item) to print one item at a time.',
      bad:'✗ Line 3 is the bug. print(fruits) prints the whole list every time. It should be print(item) — item holds one value per loop.'}},

// ════════════════════════════════════════════════════════
//  SECTION B — Computational Thinking  Q21-Q30
// ════════════════════════════════════════════════════════

{ id:21, solo:'uni', label:'Getting Started', section:'B', pts:1, type:'choice',
  text:"A student wants to store a person's name in their program. Which data type should they use?",
  choices:['int','float','str','bool'],
  hint:'Think about what kind of information a name is — is it a number, a decimal, text, or a true/false value?',
  fb:{ok:'✓ Correct! Names are text, so str (string) is the right data type.',
      bad:'✗ A name is text, so str (string) is the correct choice.'}},

{ id:22, solo:'uni', label:'Getting Started', section:'B', pts:1, type:'choice',
  text:'A game needs to track whether a player is currently alive or not. Which data type fits best?',
  choices:['int','str','float','bool'],
  hint:'This value only ever has two possible states. There is a data type in Python designed exactly for two-state values.',
  fb:{ok:'✓ Correct! bool is perfect for two-state values like alive/not alive — it holds True or False.',
      bad:'✗ bool holds True or False, making it ideal for two-state values like alive/not alive.'}},

{ id:23, solo:'multi', label:'Finding My Feet', section:'B', pts:2, type:'selectall',
  text:"A program needs to store a student's age. Which data type is the most sensible choice? Select ALL that apply:",
  options:['int — a whole number like 14','float — a decimal like 14.5','str — text like "14"','bool — True or False'],
  hint:'Age is always a whole number. Which data type stores whole numbers? Could you do maths on an age stored as text?',
  fb:{ok:'✓ Correct! int is the right choice. Age is a whole number and you may need to do arithmetic with it.',
      part:'⚠ int is the best choice. float technically works but age is always whole. str means you cannot do arithmetic.',
      bad:'✗ int is best for age — it is a whole number and you may need to add or compare it.'}},

{ id:24, solo:'multi', label:'Finding My Feet', section:'B', pts:2, type:'choice',
  text:'A teacher wants to store a class list of 25 student names so the program can loop through them one by one. Which structure fits best?',
  choices:['A single str variable','A list','An int variable','A bool variable'],
  hint:'When you need to store multiple items of the same kind and process them one at a time, which Python structure is designed for that?',
  fb:{ok:'✓ Correct! A list is designed to hold multiple items in order, which you can then loop through one by one.',
      bad:'✗ A list holds multiple items in order and works perfectly with a for loop to process each one.'}},

{ id:25, solo:'multi', label:'Finding My Feet', section:'B', pts:2, type:'selectall',
  text:"A program tracks a student's test score stored as an int. Which operations make sense for this data? Select ALL that apply:",
  options:['Add 5 bonus points to the score','Check if the score is greater than 50','Loop through the score one item at a time','Print the score to the screen'],
  hint:'Think about what you can actually do with a single number. Can you loop through a number the same way you loop through a list?',
  fb:{ok:'✓ Correct! You can do arithmetic, compare, and print a number. You cannot loop through a single integer — it is not a collection.',
      part:'⚠ You can add to, compare, and print a number. Looping through a single integer does not make sense.',
      bad:'✗ A number can be added to, compared, and printed. It cannot be looped through — only collections like lists can be iterated.'}},

{ id:26, solo:'rel', label:'Connecting the Dots', section:'B', pts:3, type:'choice',
  text:'A program needs to check every name in a list and print a greeting for each one. Which combination of tools does it need?',
  choices:['A variable and an if statement','A list and a for loop','A float and a while loop','A bool and a for loop'],
  hint:'You need something to hold all the names together, and something to go through them one by one automatically.',
  fb:{ok:'✓ Correct! A list holds all the names, and a for loop visits each one automatically.',
      bad:'✗ A list stores all the names together, and a for loop processes each one in turn.'}},

{ id:27, solo:'rel', label:'Connecting the Dots', section:'B', pts:3, type:'selectall',
  text:'A student is building a quiz game that keeps asking questions until the player gets 3 correct. Which tools would the program need? Select ALL that apply:',
  options:['A variable to count correct answers','A while loop','A list of questions','A float to store the score','A bool to store the player name'],
  hint:'Break the problem down — what needs to be stored? What needs to repeat? What holds the questions themselves?',
  fb:{ok:'✓ Correct! You need a counter variable, a while loop to keep going, and a list to hold the questions.',
      part:'⚠ You need a counter, a while loop, and a list of questions. A float is not right for counting whole numbers, and a bool stores True/False not a name.',
      bad:'✗ The program needs a counter variable (int), a while loop to repeat, and a list to hold the questions.'}},

{ id:28, solo:'rel', label:'Connecting the Dots', section:'B', pts:3, type:'hotspot',
  text:'A student writes this program to print each item from their shopping list, but it prints the whole list every time instead of one item. Click the line with the bug:',
  lines:['shopping = ["milk", "bread", "eggs"]','for item in shopping:','    print(shopping)'],
  hint:'Inside a for loop, the loop variable holds one item at a time. Are you printing the loop variable, or the whole list?',
  fb:{ok:'✓ Correct! print(shopping) prints the entire list every loop. It should be print(item) — item holds one value at a time.',
      bad:'✗ Line 3 is the bug. print(shopping) prints the whole list every time. It should be print(item).'}},

{ id:29, solo:'ext', label:'Thinking Like a Programmer', section:'B', pts:4, type:'choice',
  text:'A program stores the prices of 5 items. It needs to find the most expensive one. Which approach makes the most sense?',
  choices:['Store all 5 prices in separate variables and compare them one by one','Store all 5 prices in a list and use a loop to find the highest','Store all prices as a single str and read the characters','Store the prices as bool values'],
  hint:'Imagine the program needed to handle 500 items instead of 5. Which approach would still work without needing to rewrite everything?',
  fb:{ok:'✓ Correct! A list and a loop scales to any number of items. Separate variables become unmanageable as the data grows.',
      bad:'✗ A list and a loop is the right approach. It works whether you have 5 items or 500, without rewriting the code.'}},

{ id:30, solo:'ext', label:'Thinking Like a Programmer', section:'B', pts:4, type:'selectall',
  text:'A program asks a user to guess a whole number between 1 and 10 and keeps asking until they get it right. Which of these would the program need? Select ALL that apply:',
  options:['A variable to store the secret number','A variable to store the user guess','A while loop to keep asking','A list to store all guesses','A way to compare the guess to the secret number','A float to store the guess'],
  hint:'Think through what the program actually does step by step. What does it store? What does it repeat? What decision does it make?',
  fb:{ok:'✓ Correct! You need two variables, a while loop, and a comparison. A list of all guesses is not required, and a float is wrong for whole numbers.',
      part:'⚠ A list of guesses is not needed — just the current guess. A float is wrong since the numbers are whole.',
      bad:'✗ The program needs: a variable for the secret number, a variable for the guess, a while loop, and a comparison. No list or float needed.'}},

// ════════════════════════════════════════════════════════
//  SECTION C — AI & Ethics  Q31-Q35
// ════════════════════════════════════════════════════════

{ id:31, solo:'uni', label:'Getting Started', section:'C', pts:3, type:'choice',
  text:'A student asks an AI to explain what a for loop does in plain English. Is this a good use of AI for learning?',
  choices:['Yes — asking AI to explain concepts helps you understand them','No — you should only use textbooks and teachers','No — AI explanations are always incorrect','Yes — but only if the teacher gives permission first'],
  hint:'Think about the purpose of the action. Is the student trying to understand something, or trying to avoid doing the work?',
  fb:{ok:'✓ Correct! Using AI to explain concepts you do not understand is a legitimate learning strategy — just like asking a teacher or looking something up.',
      bad:'✗ Using AI to understand a concept is a valid learning approach. The student is trying to learn, not avoid work.'}},

{ id:32, solo:'uni', label:'Getting Started', section:'C', pts:3, type:'choice',
  text:'A student copies an AI solution to a coding assignment and submits it as their own work without reading or understanding it. What best describes this?',
  choices:['Efficient use of available tools','Academic dishonesty','A reasonable shortcut under time pressure','Acceptable if the code works correctly'],
  hint:'The key detail is "without reading or understanding it". The purpose of the assignment is to develop your own skills. What happens to your learning if something else does the work?',
  fb:{ok:'✓ Correct! Submitting work you did not produce or understand as your own is academic dishonesty, regardless of the tool used to generate it.',
      bad:'✗ Submitting AI-generated work as your own without understanding it is academic dishonesty. The code being correct does not change that.'}},

{ id:33, solo:'multi', label:'Finding My Feet', section:'C', pts:4, type:'selectall',
  text:'Which of these are good ways to use AI when learning to code? Select ALL that apply:',
  options:['Ask AI to explain an error message you do not understand','Ask AI to write your entire assignment for you','Ask AI to give you a hint when you are stuck on a problem','Ask AI to check your finished code and explain what each part does','Copy AI-generated code into your work without reading it','Ask AI to quiz you on what you have learned'],
  hint:'The question is whether the AI is helping you learn or replacing your learning. Which options still require you to think, understand, and do the work yourself?',
  fb:{ok:'✓ Correct! Getting explanations, hints, code reviews, and practice questions all support your learning. Having AI write your assignment or copying code without reading it replaces your learning.',
      part:'⚠ Having AI write your assignment replaces your learning entirely. Copying code without reading it means you learn nothing from it.',
      bad:'✗ Good AI use keeps you in the driving seat — getting explanations, hints, reviews, and quizzes. Bad use is when AI does the thinking for you.'}},

{ id:34, solo:'rel', label:'Connecting the Dots', section:'C', pts:6, type:'selectall',
  text:'A student gets this error: TypeError: can only concatenate str (not int) to str They ask an AI to explain it. The AI gives a clear explanation. Which responses show good learning practice? Select ALL that apply:',
  options:['Read the explanation carefully and try to fix the code themselves','Copy whatever fix the AI suggests without reading it','Use the explanation to understand what went wrong','Ask the AI to rewrite the broken section for them','Apply what they learned to avoid the same error in future code'],
  hint:'AI gave them the understanding — now what should they do with it? Which options mean the student is doing the thinking, and which mean the AI is still doing the work?',
  fb:{ok:'✓ Correct! Reading the explanation, understanding what went wrong, and applying that knowledge are all signs of genuine learning.',
      part:'⚠ The goal is to understand and fix it yourself. Copying a fix or asking AI to rewrite the code means the error is resolved but nothing was learned.',
      bad:'✗ Good responses use the explanation to understand and fix the problem independently. Copying AI fixes or asking for rewrites replaces understanding with a quick patch.'}},

{ id:35, solo:'ext', label:'Thinking Like a Programmer', section:'C', pts:9, type:'selectall',
  text:'A student is stuck on a Python assignment. Which of these four approaches show responsible and effective use of AI for learning? | A: Pastes the full task and asks AI to write the solution, then submits it. | B: Gets an error, asks AI what it means, fixes it themselves. | C: Has not started, asks AI for a strategy hint, writes their own code. | D: Finishes the task, asks AI to review their code and explain improvements.',
  options:['Approach A — ask AI to write the full solution','Approach B — ask AI to explain an error, fix it yourself','Approach C — ask AI for a starting strategy, write your own code','Approach D — ask AI to review your finished work'],
  hint:'Ask yourself: in each approach, who is doing the thinking and the coding? Learning happens when you are the one working through the problem.',
  fb:{ok:'✓ Excellent! Approaches B, C and D all keep the student doing the thinking and coding. AI is used to support, not replace. Approach A produces a result but no learning.',
      part:'⚠ Approach A is the problem — the student does not write or understand any code, and submits AI work as their own. B, C and D all involve the student doing the actual work.',
      bad:'✗ Approaches B, C and D are all responsible. In each one the student does the coding and uses AI only for explanation, hints, or feedback. Approach A replaces the work entirely.'}}
];

// ════════════════════════════════════════════════════════
//  GATE LOGIC
// ════════════════════════════════════════════════════════
(function setupPin(){
  const digits = document.querySelectorAll('.pin-digit');
  digits.forEach((d,i)=>{
    d.addEventListener('input', e=>{
      if(e.target.value.length===1 && i<digits.length-1) digits[i+1].focus();
      if(e.target.value.length===1 && i===digits.length-1) checkPin();
    });
    d.addEventListener('keydown', e=>{ if(e.key==='Backspace'&&!d.value&&i>0) digits[i-1].focus(); });
  });
  digits[0].focus();
})();

async function checkPin(){
  const pin=[...document.querySelectorAll('.pin-digit')].map(d=>d.value).join('');
  const ok=await _vp(pin);
  if(ok){ showScreen('emailScreen'); setTimeout(()=>document.getElementById('emailIn').focus(),80); }
  else{
    const row=document.getElementById('pinRow');
    row.classList.add('shake');
    setTimeout(()=>{ row.classList.remove('shake'); document.querySelectorAll('.pin-digit').forEach(d=>d.value=''); document.querySelectorAll('.pin-digit')[0].focus(); },420);
    document.getElementById('pinErr').style.display='block';
  }
}

function checkEmail(){
  const v=document.getElementById('emailIn').value.trim();
  const hint=document.getElementById('emailHint');
  if(!EMAIL_RE.test(v)){
    document.getElementById('emailIn').classList.add('err');
    hint.textContent='✗ Please use a valid @education.nsw.gov.au address.';
    hint.classList.add('err');
    return;
  }
  studentEmail=v;
  document.body.className='section-a';
  window.addEventListener('beforeunload',e=>{ e.preventDefault(); e.returnValue=''; });
  showScreen('quizScreen');
  renderQ(0);
}
document.getElementById('emailIn').addEventListener('keydown',e=>{ if(e.key==='Enter') checkEmail(); });

function showBanner(id){
  const b=document.getElementById(id);
  if(b){ b.classList.add('show'); }
}
function dismissBanner(id){
  const b=document.getElementById(id);
  if(b){ b.classList.remove('show'); }
}

function showScreen(id){
  document.querySelectorAll('.screen').forEach(s=>{
    s.classList.remove('active');
    s.style.display='none';
  });
  const el=document.getElementById(id);
  el.classList.add('active');
  el.style.display=(id==='resultsScreen')?'flex':'block';
}

// ════════════════════════════════════════════════════════
//  LIVES & HINTS
// ════════════════════════════════════════════════════════
function loseLife(){
  lives=Math.max(0,lives-1);
  ['h1','h2','h3'].forEach((id,i)=>{
    const h=document.getElementById(id);
    if(i>=lives) h.classList.add('lost'); else h.classList.remove('lost');
  });
}

function useHint(){
  if(hintsLeft<=0) return;
  const q=Q[currentQ];
  if(hintUsed[currentQ]) return;
  hintsLeft--;
  hintUsed[currentQ]=true;
  loseLife();
  document.getElementById('hintCount').textContent=hintsLeft;
  if(hintsLeft<=0) document.getElementById('hintBtn').disabled=true;
  const strip=document.getElementById('hintStrip'+currentQ);
  if(strip){ strip.classList.add('show'); strip.scrollIntoView({behavior:'smooth',block:'nearest'}); }
}

// ════════════════════════════════════════════════════════
//  RENDER
// ════════════════════════════════════════════════════════
function shuffle(arr){ return [...arr].sort(()=>Math.random()-.5); }

function renderQ(idx){
  currentQ=idx;
  const q=Q[idx];
  const sec=q.section||'A';
  document.body.className='section-'+sec.toLowerCase();
  if(idx>0 && sec!==Q[idx-1].section){ showBanner('banner'+sec); }
  const area=document.getElementById('qArea');
  const soloClass={uni:'solo-uni',multi:'solo-multi',rel:'solo-rel',ext:'solo-ext'}[q.solo];

  let h='<div class="qcard">';
  h+='<span class="qpts">'+q.pts+' pt'+(q.pts>1?'s':'')+'</span>';
  h+='<div class="qnum">Question '+(idx+1)+' of 35</div>';
  h+='<span class="solo-badge '+soloClass+'">'+q.label+'</span>';
  h+='<div class="qtxt">'+esc(q.text)+'</div>';
  if(q.codeBlock) h+='<div class="code">'+esc(q.codeBlock)+'</div>';
  h+='<div class="hint-strip" id="hintStrip'+idx+'">💡 '+esc(q.hint)+'</div>';

  if(q.type==='choice')    h+=renderChoice(q,idx);
  if(q.type==='selectall') h+=renderSelectAll(q,idx);
  if(q.type==='dragorder') h+=renderDragOrder(q,idx);
  if(q.type==='match')     h+=renderMatch(q,idx);
  if(q.type==='hotspot')   h+=renderHotspot(q,idx);

  h+='<div class="fb" id="fb'+idx+'"></div>';
  h+='</div>';
  area.innerHTML=h;

  if(q.type==='dragorder') attachDrag(idx);
  if(q.type==='match')     attachMatch(idx);
  if(hintUsed[idx])        document.getElementById('hintStrip'+idx).classList.add('show');
  if(answered[idx])        restoreState(idx);
  updateNav(idx);
  updateProgress();
}

function esc(t){ return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>'); }

function renderChoice(q,idx){
  let h='<div class="choices">';
  q.choices.forEach((c,ci)=>{
    h+='<div class="ch" data-ci="'+ci+'" onclick="selChoice('+idx+','+ci+')">'+esc(c)+'</div>';
  });
  return h+'</div>';
}

function renderSelectAll(q,idx){
  let h='<div class="sa-note">Select all that apply, then click Check Answer</div><div class="sa-list">';
  q.options.forEach((o,oi)=>{
    h+='<div class="sa-item" data-oi="'+oi+'" onclick="togSA('+idx+','+oi+')"><div class="cb" id="cb'+idx+'_'+oi+'">✓</div><span>'+esc(o)+'</span></div>';
  });
  return h+'</div>';
}

function renderDragOrder(q,idx){
  const shuffled=shuffle(q.items);
  let h='<div class="do-note">Drag to reorder — then click Check Answer</div><div class="do-list" id="doList'+idx+'">';
  shuffled.forEach((item,si)=>{
    h+='<div class="do-item" draggable="true" data-id="'+item.id+'">'
      +'<span class="do-handle">⠿</span>'
      +'<span class="do-idx">'+(si+1)+'</span>'
      +'<span>'+esc(item.text)+'</span></div>';
  });
  return h+'</div>';
}

function renderMatch(q,idx){
  const srcOrder=shuffle([...Array(q.pairs.length).keys()]);
  const tgtOrder=shuffle([...Array(q.pairs.length).keys()]);
  let h='<div class="match-note">Drag items from the left into the correct slot on the right. Click a placed item to return it.</div>';
  h+='<div class="match-wrap">';
  h+='<div><div class="match-col-hdr">Values</div><div class="match-src-list" id="mSrc'+idx+'">';
  srcOrder.forEach(pi=>{
    h+='<div class="msrc" draggable="true" data-pi="'+pi+'">'+esc(q.pairs[pi].val)+'</div>';
  });
  h+='</div></div>';
  h+='<div><div class="match-col-hdr">Types / Outputs</div><div class="match-tgt-list" id="mTgt'+idx+'">';
  tgtOrder.forEach(pi=>{
    h+='<div class="mtgt" id="mt'+idx+'_'+pi+'" data-pi="'+pi+'">'
      +'<span class="mtgt-lbl">'+esc(q.pairs[pi].type)+'</span>'
      +'<div class="mtgt-drop" id="md'+idx+'_'+pi+'"></div></div>';
  });
  h+='</div></div></div>';
  return h;
}

function renderHotspot(q,idx){
  let h='<div class="hs-note">Click the line that contains the error</div><div class="hs-code">';
  q.lines.forEach((line,li)=>{
    h+='<div class="hs-line" data-li="'+li+'" onclick="selHS('+idx+','+li+')">'
      +'<span class="hs-lnum">'+(li+1)+'</span>'
      +'<span>'+esc(line)+'</span></div>';
  });
  return h+'</div>';
}

// ════════════════════════════════════════════════════════
//  INTERACTIONS
// ════════════════════════════════════════════════════════
function selChoice(qIdx,ci){
  if(answered[qIdx]) return;
  document.querySelectorAll('.ch').forEach(c=>c.classList.remove('sel'));
  document.querySelector('.ch[data-ci="'+ci+'"]').classList.add('sel');
  userAns[qIdx]=ci;
  document.getElementById('btnCheck').disabled=false;
}

function togSA(qIdx,oi){
  if(answered[qIdx]) return;
  const item=document.querySelector('.sa-item[data-oi="'+oi+'"]');
  item.classList.toggle('sel');
  if(!Array.isArray(userAns[qIdx])) userAns[qIdx]=[];
  const arr=userAns[qIdx], pos=arr.indexOf(oi);
  if(pos===-1) arr.push(oi); else arr.splice(pos,1);
  document.getElementById('btnCheck').disabled=arr.length===0;
}

function selHS(qIdx,li){
  if(answered[qIdx]) return;
  document.querySelectorAll('.hs-line').forEach(l=>l.classList.remove('sel'));
  document.querySelector('.hs-line[data-li="'+li+'"]').classList.add('sel');
  userAns[qIdx]=li;
  document.getElementById('btnCheck').disabled=false;
}

let dragSrc=null;
function attachDrag(qIdx){
  const list=document.getElementById('doList'+qIdx);
  if(!list) return;
  list.querySelectorAll('.do-item').forEach(item=>{
    item.addEventListener('dragstart',e=>{ dragSrc=item; item.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
    item.addEventListener('dragend',()=>{ item.classList.remove('dragging'); list.querySelectorAll('.do-item').forEach(i=>i.classList.remove('over')); refreshDOIndexes(list); });
    item.addEventListener('dragover',e=>{ e.preventDefault(); if(dragSrc!==item) item.classList.add('over'); });
    item.addEventListener('dragleave',()=>item.classList.remove('over'));
    item.addEventListener('drop',e=>{
      e.preventDefault();
      if(dragSrc&&dragSrc!==item){
        const all=[...list.querySelectorAll('.do-item')];
        if(all.indexOf(dragSrc)<all.indexOf(item)) list.insertBefore(dragSrc,item.nextSibling);
        else list.insertBefore(dragSrc,item);
      }
      item.classList.remove('over');
      refreshDOIndexes(list);
      userAns[qIdx]=[...list.querySelectorAll('.do-item')].map(i=>i.dataset.id);
      document.getElementById('btnCheck').disabled=false;
    });
  });
  userAns[qIdx]=[...list.querySelectorAll('.do-item')].map(i=>i.dataset.id);
  document.getElementById('btnCheck').disabled=false;
}
function refreshDOIndexes(list){ list.querySelectorAll('.do-item').forEach((item,i)=>{ const s=item.querySelector('.do-idx'); if(s) s.textContent=i+1; }); }

let mDragItem=null;
function attachMatch(qIdx){
  const srcList=document.getElementById('mSrc'+qIdx);
  if(!srcList) return;
  function makeDraggable(el){
    el.draggable=true;
    el.addEventListener('dragstart',e=>{ mDragItem=el; el.classList.add('dragging'); e.dataTransfer.effectAllowed='move'; });
    el.addEventListener('dragend',()=>el.classList.remove('dragging'));
  }
  srcList.querySelectorAll('.msrc').forEach(makeDraggable);
  document.getElementById('mTgt'+qIdx).querySelectorAll('.mtgt').forEach(tgt=>{
    tgt.addEventListener('dragover',e=>{ e.preventDefault(); tgt.classList.add('over'); });
    tgt.addEventListener('dragleave',()=>tgt.classList.remove('over'));
    tgt.addEventListener('drop',e=>{
      e.preventDefault(); tgt.classList.remove('over');
      if(!mDragItem) return;
      const dz=tgt.querySelector('.mtgt-drop');
      const existing=dz.querySelector('.msrc');
      if(existing){ existing.classList.remove('in-slot'); existing.onclick=null; srcList.appendChild(existing); makeDraggable(existing); }
      mDragItem.parentNode && mDragItem.parentNode.removeChild(mDragItem);
      mDragItem.classList.add('in-slot');
      mDragItem.draggable=false;
      mDragItem.onclick=()=>{ mDragItem.classList.remove('in-slot'); mDragItem.onclick=null; srcList.appendChild(mDragItem); makeDraggable(mDragItem); tgt.classList.remove('filled'); updateMatchAns(qIdx); };
      dz.appendChild(mDragItem);
      tgt.classList.add('filled');
      updateMatchAns(qIdx);
      mDragItem=null;
    });
  });
}
function updateMatchAns(qIdx){
  const q=Q[qIdx]; let ans={};
  document.getElementById('mTgt'+qIdx).querySelectorAll('.mtgt').forEach(tgt=>{
    const pi=tgt.dataset.pi, placed=tgt.querySelector('.mtgt-drop .msrc');
    ans[pi]=placed?parseInt(placed.dataset.pi):null;
  });
  userAns[qIdx]=ans;
  const filled=Object.values(ans).filter(v=>v!==null).length;
  document.getElementById('btnCheck').disabled=filled<q.pairs.length;
}

// ════════════════════════════════════════════════════════
//  CHECK ANSWER
// ════════════════════════════════════════════════════════
function checkAnswer(){
  const q=Q[currentQ], fb=document.getElementById('fb'+currentQ);
  const ans=_A[currentQ]; // decoded correct answer for this question
  let pts=0, cls='bad', msg=q.fb.bad;

  if(q.type==='choice'){
    const sel=userAns[currentQ], ok=sel===ans;
    pts=ok?q.pts:0; cls=ok?'ok':'bad'; msg=ok?q.fb.ok:q.fb.bad;
    document.querySelectorAll('.ch').forEach(c=>{
      c.classList.add('locked');
      const ci=parseInt(c.dataset.ci);
      if(ci===ans) c.classList.add('ok');
      else if(ci===sel) c.classList.add('bad');
    });

  }else if(q.type==='hotspot'){
    const sel=userAns[currentQ], ok=sel===ans;
    pts=ok?q.pts:0; cls=ok?'ok':'bad'; msg=ok?q.fb.ok:q.fb.bad;
    document.querySelectorAll('.hs-line').forEach(l=>{
      l.classList.add('locked');
      const li=parseInt(l.dataset.li);
      if(li===ans) l.classList.add('ok');
      else if(li===sel) l.classList.add('bad');
    });

  }else if(q.type==='selectall'){
    const sel=(userAns[currentQ]||[]).slice().sort().toString();
    const cor=[...ans].sort().toString();
    const selArr=userAns[currentQ]||[];
    const hitCount=selArr.filter(i=>ans.includes(i)).length;
    const hasWrong=selArr.some(i=>!ans.includes(i));
    const isOk=sel===cor, isPart=!isOk&&hitCount>0&&!hasWrong;
    pts=isOk?q.pts:isPart?Math.floor(q.pts/2):0;
    cls=isOk?'ok':isPart?'part':'bad';
    msg=isOk?q.fb.ok:isPart?q.fb.part:q.fb.bad;
    document.querySelectorAll('.sa-item').forEach(item=>{
      item.classList.add('locked');
      const oi=parseInt(item.dataset.oi);
      if(ans.includes(oi)) item.classList.add('ok');
      else if(selArr.includes(oi)) item.classList.add('bad');
    });

  }else if(q.type==='dragorder'){
    const order=userAns[currentQ]||[];
    const cor=ans;
    let match=0; cor.forEach((id,i)=>{ if(order[i]===id) match++; });
    const isOk=match===cor.length, isPart=!isOk&&match>0;
    pts=isOk?q.pts:isPart?Math.floor(q.pts/2):0;
    cls=isOk?'ok':isPart?'part':'bad';
    msg=isOk?q.fb.ok:q.fb.bad;
    const list=document.getElementById('doList'+currentQ);
    if(list) list.querySelectorAll('.do-item').forEach((item,i)=>{
      item.draggable=false; item.style.cursor='default';
      item.classList.add(cor[i]&&item.dataset.id===cor[i]?'ok':'bad');
    });

  }else if(q.type==='match'){
    const ma=userAns[currentQ]||{};
    let correct=0;
    q.pairs.forEach((_,pi)=>{ if(ma[pi]===pi) correct++; });
    const isOk=correct===q.pairs.length, isPart=!isOk&&correct>0;
    pts=isOk?q.pts:isPart?Math.round(q.pts*correct/q.pairs.length):0;
    cls=isOk?'ok':isPart?'part':'bad';
    msg=isOk?q.fb.ok:isPart?q.fb.part:q.fb.bad;
    document.getElementById('mTgt'+currentQ).querySelectorAll('.mtgt').forEach(tgt=>{
      const pi=parseInt(tgt.dataset.pi), placed=tgt.querySelector('.mtgt-drop .msrc');
      if(placed){ placed.style.cursor='default'; placed.onclick=null; }
      tgt.classList.add(ma[pi]===pi?'ok':'bad');
    });
  }

  fb.textContent=msg; fb.className='fb '+cls; fb.style.display='block';
  scores[currentQ]=pts; answered[currentQ]=true;
  const totalScore=scores.reduce((a,b)=>a+b,0);
  document.getElementById('scoreLbl').textContent=totalScore+' / 100 pts';
  document.getElementById('btnCheck').style.display='none';
  document.getElementById('btnNext').style.display=currentQ<Q.length-1?'inline-block':'none';
  checkSubmitVis();
  updateProgress();
  if(currentQ===Q.length-1) setTimeout(showCompletion,500);
}

// ════════════════════════════════════════════════════════
//  RESTORE STATE (back-nav)
// ════════════════════════════════════════════════════════
function restoreState(idx){
  const q=Q[idx];
  const ans=_A[idx];
  document.getElementById('btnCheck').style.display='none';
  document.getElementById('btnNext').style.display='inline-block';
  const fb=document.getElementById('fb'+idx);
  const cls=scores[idx]===q.pts?'ok':scores[idx]>0?'part':'bad';
  const msg=scores[idx]===q.pts?q.fb.ok:q.fb.bad;
  fb.textContent=msg; fb.className='fb '+cls; fb.style.display='block';

  if(q.type==='choice'){
    const sel=userAns[idx];
    document.querySelectorAll('.ch').forEach(c=>{
      c.classList.add('locked');
      const ci=parseInt(c.dataset.ci);
      if(ci===ans) c.classList.add('ok');
      else if(ci===sel) c.classList.add('bad');
    });
  }else if(q.type==='hotspot'){
    const sel=userAns[idx];
    document.querySelectorAll('.hs-line').forEach(l=>{
      l.classList.add('locked');
      const li=parseInt(l.dataset.li);
      if(li===ans) l.classList.add('ok');
      else if(li===sel) l.classList.add('bad');
    });
  }else if(q.type==='selectall'){
    const selArr=userAns[idx]||[];
    document.querySelectorAll('.sa-item').forEach(item=>{
      item.classList.add('locked');
      const oi=parseInt(item.dataset.oi);
      if(ans.includes(oi)) item.classList.add('ok');
      else if(selArr.includes(oi)) item.classList.add('bad');
    });
  }
}

// ════════════════════════════════════════════════════════
//  NAV & PROGRESS
// ════════════════════════════════════════════════════════
function updateNav(idx){
  document.getElementById('btnBack').disabled=idx===0;
  if(answered[idx]){
    document.getElementById('btnCheck').style.display='none';
    document.getElementById('btnNext').style.display=idx<Q.length-1?'inline-block':'none';
  } else {
    document.getElementById('btnCheck').style.display='inline-block';
    document.getElementById('btnCheck').disabled=!canCheck(idx);
    document.getElementById('btnNext').style.display='none';
  }
  checkSubmitVis();
}
function canCheck(idx){
  const a=userAns[idx];
  if(a===null||a===undefined) return false;
  if(Array.isArray(a)) return a.length>0;
  if(typeof a==='object') return Object.values(a).filter(v=>v!==null).length===Q[idx].pairs.length;
  return true;
}
function checkSubmitVis(){
  if(answered[34]) document.getElementById('btnSubmit').classList.add('vis');
}
function goNext(){ if(currentQ<Q.length-1) renderQ(currentQ+1); }
function goBack(){ if(currentQ>0) renderQ(currentQ-1); }
function updateProgress(){
  const done=answered.filter(Boolean).length;
  document.getElementById('progLbl').textContent='Question '+(currentQ+1)+' of 35';
  document.getElementById('progBar').style.width=((done/35)*100)+'%';
}

// ════════════════════════════════════════════════════════
//  SUBMIT
// ════════════════════════════════════════════════════════
function confirmSubmit(){
  const rem=35-answered.filter(Boolean).length;
  if(rem>0&&!confirm('You have '+rem+' unanswered question'+(rem>1?'s':'')+' remaining. Submit now? Unanswered questions score 0.')) return;
  showResults();
}
function showResults(){
  const total=scores.reduce((a,b)=>a+b,0);
  showScreen('resultsScreen');
  document.getElementById('finalScore').textContent=total;
  const arc=document.getElementById('scoreArc');
  arc.style.strokeDashoffset=358-(total/100)*358;
  const bands=[
    {min:88,lbl:'Thinking Like a Programmer',desc:'Outstanding! You can write Python, think computationally, and use AI as a genuine learning tool.'},
    {min:68,lbl:'Connecting the Dots',desc:'Great work! You can read and predict Python programs, think through problems, and understand responsible AI use.'},
    {min:45,lbl:'Finding My Feet',desc:'Good effort! You know several key ideas across all three sections — keep practising to connect them.'},
    {min:0, lbl:'Getting Started',desc:"You're building your foundations — review the basics across all three sections and give it another go!"}
  ];
  const band=bands.find(b=>total>=b.min);
  document.getElementById('bandLbl').textContent=band.lbl;
  document.getElementById('bandDesc').textContent=band.desc;
}

// ════════════════════════════════════════════════════════
//  PDF
// ════════════════════════════════════════════════════════
function downloadPDF(){
  const {jsPDF}=window.jspdf;
  const doc=new jsPDF({orientation:'portrait',unit:'mm',format:'a4'});
  const W=210, M=18;
  let y=20;
  const total=scores.reduce((a,b)=>a+b,0);

  doc.setFillColor(26,14,46); doc.rect(0,0,W,36,'F');
  doc.setFontSize(17); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
  doc.text('Code Sense — Stage 4 Software Engineering',M,15);
  doc.setFontSize(8.5); doc.setFont('helvetica','normal'); doc.setTextColor(190,165,255);
  doc.text('Vorm Education  ·  Year 7 Procedural Python',M,22);
  doc.text('Generated: '+new Date().toLocaleString('en-AU',{timeZone:'Australia/Sydney'}),M,28);
  doc.text('Student: '+studentEmail,M,34);

  y=46;
  doc.setFillColor(238,230,255); doc.roundedRect(M,y,W-2*M,22,3,3,'F');
  doc.setFontSize(20); doc.setFont('helvetica','bold'); doc.setTextColor(45,27,78);
  doc.text(total+' / 100',M+7,y+9);
  const band=document.getElementById('bandLbl').textContent;
  const desc=document.getElementById('bandDesc').textContent;
  doc.setFontSize(9.5); doc.text(band,M+7,y+15.5);
  doc.setFontSize(7.5); doc.setFont('helvetica','normal'); doc.setTextColor(90,70,130);
  const descLines=doc.splitTextToSize(desc,W-2*M-14);
  doc.text(descLines,M+7,y+20);
  y+=28;

  if(tabSwitches>0){
    doc.setFillColor(255,240,200); doc.roundedRect(M,y,W-2*M,9,2,2,'F');
    doc.setFontSize(8); doc.setFont('helvetica','bold'); doc.setTextColor(160,80,0);
    doc.text('⚠ Tab switches detected during exam: '+tabSwitches,M+3,y+6);
    y+=12;
  }

  const secInfo={
    A:{name:'Section A — Python Syntax',       col:[255,61,127]},
    B:{name:'Section B — Computational Thinking', col:[78,201,110]},
    C:{name:'Section C — AI & Ethics',         col:[242,172,39]}
  };
  const secTotals={A:{g:0,m:0},B:{g:0,m:0},C:{g:0,m:0}};
  Q.forEach((q,i)=>{ const s=q.section||'A'; secTotals[s].g+=scores[i]; secTotals[s].m+=q.pts; });

  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(45,27,78);
  doc.text('Score by Section',M,y); y+=5;
  Object.keys(secTotals).forEach(sec=>{
    const s=secTotals[sec], pct=s.m>0?s.g/s.m:0, info=secInfo[sec];
    doc.setFillColor(info.col[0],info.col[1],info.col[2],20);
    doc.roundedRect(M,y,W-2*M,8,2,2,'F');
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(45,27,78);
    doc.text(info.name,M+3,y+5.5);
    doc.setFont('helvetica','normal');
    doc.text(s.g+' / '+s.m+' pts',W-M-18,y+5.5);
    doc.setFillColor(210,200,235); doc.rect(M+90,y+2.5,45,3,'F');
    doc.setFillColor(...info.col); doc.rect(M+90,y+2.5,45*pct,3,'F');
    y+=10;
  });
  y+=4;

  const soloInfo={
    uni:{name:'Getting Started',     col:[78,201,110]},
    multi:{name:'Finding My Feet',   col:[84,184,255]},
    rel:{name:'Connecting the Dots', col:[242,172,39]},
    ext:{name:'Thinking Like a Programmer',col:[255,61,127]}
  };
  const soloTotals={uni:{g:0,m:0},multi:{g:0,m:0},rel:{g:0,m:0},ext:{g:0,m:0}};
  Q.forEach((q,i)=>{ soloTotals[q.solo].g+=scores[i]; soloTotals[q.solo].m+=q.pts; });

  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(45,27,78);
  doc.text('Score by Level',M,y); y+=5;
  Object.keys(soloTotals).forEach(solo=>{
    const s=soloTotals[solo], pct=s.m>0?s.g/s.m:0, info=soloInfo[solo];
    doc.setFillColor(info.col[0],info.col[1],info.col[2],25);
    doc.roundedRect(M,y,W-2*M,8,2,2,'F');
    doc.setFontSize(8.5); doc.setFont('helvetica','bold'); doc.setTextColor(45,27,78);
    doc.text(info.name,M+3,y+5.5);
    doc.setFont('helvetica','normal');
    doc.text(s.g+' / '+s.m+' pts',W-M-18,y+5.5);
    doc.setFillColor(210,200,235); doc.rect(M+72,y+2.5,55,3,'F');
    doc.setFillColor(...info.col); doc.rect(M+72,y+2.5,55*pct,3,'F');
    y+=10;
  });
  y+=4;

  doc.setFontSize(10); doc.setFont('helvetica','bold'); doc.setTextColor(45,27,78);
  doc.text('Question Breakdown',M,y); y+=5;
  doc.setFillColor(45,27,78); doc.rect(M,y,W-2*M,6.5,'F');
  doc.setFontSize(7.5); doc.setFont('helvetica','bold'); doc.setTextColor(255,255,255);
  doc.text('Q',M+2,y+4.5); doc.text('Question Summary',M+10,y+4.5);
  doc.text('Level',M+100,y+4.5); doc.text('Max',M+128,y+4.5);
  doc.text('Got',M+141,y+4.5); doc.text('Result',M+153,y+4.5);
  y+=6.5;

  Q.forEach((q,i)=>{
    if(y>268){doc.addPage();y=18;}
    doc.setFillColor(i%2===0?246:255,i%2===0?242:255,255);
    doc.rect(M,y,W-2*M,6.5,'F');
    doc.setFontSize(7); doc.setFont('helvetica','normal'); doc.setTextColor(45,27,78);
    doc.text(String(i+1),M+2,y+4.5);
    const summary=q.text.replace(/\n.*/s,'').substring(0,52)+(q.text.length>52?'…':'');
    doc.text(summary,M+10,y+4.5);
    doc.text(soloInfo[q.solo].name.substring(0,16),M+100,y+4.5);
    doc.text(String(q.pts),M+129,y+4.5);
    doc.text(String(scores[i]),M+142,y+4.5);
    const status=!answered[i]?'Skipped':scores[i]===q.pts?'Full marks':scores[i]>0?'Partial':'Incorrect';
    const scol=!answered[i]?[160,160,160]:scores[i]===q.pts?[0,140,50]:scores[i]>0?[170,120,0]:[190,40,40];
    doc.setTextColor(...scol); doc.setFont('helvetica','bold');
    doc.text(status,M+153,y+4.5);
    y+=6.5;
  });

  y+=8;
  if(y>260){doc.addPage();y=18;}
  doc.setFillColor(26,14,46); doc.rect(M,y,W-2*M,12,'F');
  doc.setFontSize(7); doc.setFont('helvetica','italic'); doc.setTextColor(190,165,255);
  doc.text('This PDF was generated in your browser. No data was sent to any server.',M+3,y+5);
  doc.text('Vorm Education  ·  Code Sense  ·  Stage 4 Software Engineering',M+3,y+10);

  doc.save('Code_Sense_'+studentEmail.split('@')[0]+'_'+new Date().toISOString().slice(0,10)+'.pdf');
  studentEmail='(downloaded)';
}

// ════════════════════════════════════════════════════════
//  COMPLETION CELEBRATION
// ════════════════════════════════════════════════════════
function showCompletion(){
  const total=scores.reduce((a,b)=>a+b,0);
  document.getElementById('compScore').textContent=total;
  const bands=[
    {min:88,lbl:'Thinking Like a Programmer'},
    {min:68,lbl:'Connecting the Dots'},
    {min:45,lbl:'Finding My Feet'},
    {min:0, lbl:'Getting Started'}
  ];
  const band=bands.find(b=>total>=b.min);
  document.getElementById('compBand').textContent=band.lbl;
  document.getElementById('completionOverlay').classList.add('show');
  launchConfetti();
}

function submitFromCompletion(){
  document.getElementById('completionOverlay').classList.remove('show');
  showResults();
}

function launchConfetti(){
  const canvas=document.getElementById('confettiCanvas');
  const ctx=canvas.getContext('2d');
  canvas.width=window.innerWidth;
  canvas.height=window.innerHeight;
  const colours=['#ff3d7f','#7c4daa','#f2ac27','#4ec9b0','#ffffff','#54b8ff','#ff6b6b'];
  const particles=[];
  for(let i=0;i<180;i++){
    particles.push({
      x:Math.random()*canvas.width,
      y:Math.random()*canvas.height-canvas.height,
      w:Math.random()*10+5,
      h:Math.random()*5+3,
      colour:colours[Math.floor(Math.random()*colours.length)],
      rot:Math.random()*360,
      rotSpeed:(Math.random()-0.5)*6,
      vx:(Math.random()-0.5)*3,
      vy:Math.random()*4+2,
      opacity:1
    });
  }
  let frame=0;
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      ctx.save();
      ctx.translate(p.x+p.w/2,p.y+p.h/2);
      ctx.rotate(p.rot*Math.PI/180);
      ctx.globalAlpha=p.opacity;
      ctx.fillStyle=p.colour;
      ctx.fillRect(-p.w/2,-p.h/2,p.w,p.h);
      ctx.restore();
      p.x+=p.vx; p.y+=p.vy; p.rot+=p.rotSpeed;
      if(frame>120) p.opacity-=0.012;
    });
    frame++;
    if(frame<220) requestAnimationFrame(draw);
    else ctx.clearRect(0,0,canvas.width,canvas.height);
  }
  draw();
}
