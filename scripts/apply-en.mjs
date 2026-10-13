/*
 * Applies EN translations for a profession (batch). First batch: software.
 * Generates materials/<id>_<exp>_m<N>_<a|b>.en.html, sets materials.en paths
 * and translated quiz text (q.en / options.en), then rewrites js/fields.js.
 *
 * node scripts/apply-en.mjs
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { FIELDS, EXPERTISE, PROFESSIONS } from "../js/fields.js";

const EN = {
  "software|fillestar|m1": {
    facts: ["A variable holds one value: x = 5", "Base types: int, float, str, bool", "A variable name does not start with a digit", "'=' is assignment, '==' is comparison", "type(x) returns the type of the value"],
    qA: [["Which operator assigns a value?", ["!=", "<=", "=", "=="], 2], ["Which variable name is valid?", ["2var", "my-var", "my_var", "class"], 2], ["x=5; y=x; x=7; print(y) outputs?", ["12", "Error", "5", "7"], 2]],
    qB: [["What type is 3.14 in Python?", ["int", "bool", "float", "str"], 2], ["What does type('5') return?", ["bool", "float", "int", "str"], 3], ["What does 7 // 2 return?", ["3", "4", "3.5", "2"], 0]]
  },
  "software|fillestar|m2": {
    facts: ["if checks a True/False condition", "else runs when the condition is False", "elif adds further conditions", "Indentation defines the block", "and/or/not combine conditions"],
    qA: [["Which word adds an alternative condition after if?", ["then", "elif", "else if", "elseif"], 1], ["x=10: if x>5 and x<8: ... what is the condition?", ["False", "True", "Error", "None"], 0], ["x=0. Which condition is True?", ["if x==1:", "if x:", "if not x:", "if x>0:"], 2]],
    qB: [["What defines a code block in Python?", ["Braces {}", "END", "Indentation", "Semicolon"], 2], ["What does not (3>2) return?", ["None", "False", "True", "3"], 1], ["How many times does else run in an if/elif/else chain?", ["Twice", "Whenever if is True", "Always", "At most once, if no condition holds"], 3]]
  },
  "software|fillestar|m3": {
    facts: ["for iterates over a list", "while repeats while the condition is True", "range(n) gives 0..n-1", "A list index starts at 0", "append() adds to the end of the list"],
    qA: [["What does range(3) give?", ["1,2,3", "1,2", "0,1,2", "0,1,2,3"], 2], ["a=[1,2,3]; a.append(4); len(a)?", ["Error", "5", "4", "3"], 2], ["s=0; for i in range(1,5): s+=i; print(s)?", ["10", "15", "4", "5"], 0]],
    qB: [["What is the index of the first element?", ["2", "-1", "0", "1"], 2], ["What does 'while True' without break do?", ["Runs once", "Infinite loop", "Syntax error", "Nothing"], 1], ["a=[10,20,30]; a[-1]?", ["20", "Error", "30", "10"], 2]]
  },
  "software|mid|m1": {
    facts: ["def defines a function", "return gives back the result", "Parameters can have defaults: f(x, y=2)", "Local variables live only inside the function", "A function without return gives None"],
    qA: [["Which keyword creates a function?", ["lambda", "function", "func", "def"], 3], ["def f(x,y=2): return x*y; f(3)?", ["6", "5", "3", "Error"], 0], ["def f(a=[]): a.append(1); return a. f(); f() gives:", ["[1] and [1]", "[1] and [1,1]", "Error", "[1,1] and [1,1]"], 1]],
    qB: [["What does a function without return give?", ["''", "0", "None", "Error"], 2], ["A variable created inside a function is:", ["Global", "Local", "Constant", "Static"], 1], ["What does (lambda x: x**2)(4) do?", ["8", "16", "Error", "4"], 1]]
  },
  "software|mid|m2": {
    facts: ["a[1:3] returns elements at indices 1 and 2", "A list comprehension builds a new list: [x for x in xs if cond]", "sum() adds a list; sorted() returns a new sorted list", "sorted(reverse=True) orders descending", "Slicing creates a new list"],
    qA: [["a=[1,2,3,4]; a[1:3]?", ["[2,3,4]", "[1,2,3]", "[2,3]", "[1,2]"], 2], ["[x for x in [1,2,3,4,5,6] if x%2==0]?", ["[2,4]", "[2,4,6]", "[0,2,4]", "[1,3,5]"], 1], ["[x*x for x in range(5) if x>2]?", ["[9,16]", "[4,9,16]", "[9,16,25]", "[0,1,4]"], 0]],
    qB: [["Which function gives the sum of a list?", ["plus()", "add()", "sum()", "total()"], 2], ["sorted([3,1,2], reverse=True)?", ["[3,1,2]", "[1,2,3]", "[3,2,1]", "Error"], 2], ["Does sorted() change the original list?", ["Yes", "No, it returns a new one", "Depends", "Only numbers"], 1]]
  },
  "software|mid|m3": {
    facts: ["d['a'] reads the value of key 'a'", "d.get('k', 0) returns 0 if 'k' is missing", "max([]) raises ValueError", "enumerate() yields (index, value) pairs", "A dict counts frequencies well"],
    qA: [["How do you get the value of key 'a' in d?", ["d['a']", "d.a", "d(a)", "d{a}"], 0], ["d={}; d['k']=d.get('k',0)+1; d['k']?", ["Error", "None", "1", "0"], 2], ["max([]) in Python:", ["ValueError", "None", "0", "-1"], 0]],
    qB: [["What does enumerate(['x','y']) give?", ["Only indices", "Error", "Pairs (index, value)", "Only values"], 2], ["Why test with an empty list?", ["Speeds up the code", "Reveals edge-case bugs", "It is unnecessary", "For style"], 1], ["Which structure counts frequencies best?", ["set without counting", "tuple", "dict", "string"], 2]]
  },
  "software|senior|m1": {
    facts: ["Binary search is O(log n) and needs a sorted list", "Two nested loops over n give O(n^2)", "O(n log n) beats O(n^2) for large n", "'x in list' is O(n)", "Algorithms differ in complexity, not just speed"],
    qA: [["Complexity of binary search?", ["O(n)", "O(1)", "O(n^2)", "O(log n)"], 3], ["Binary search requires the list to be:", ["Short", "Sorted", "Positive numbers", "Even"], 1], ["Which is fastest for very large n?", ["O(n^3)", "O(2^n)", "O(n^2)", "O(n log n)"], 3]],
    qB: [["Two nested for loops over n give:", ["O(n^2)", "O(n)", "O(log n)", "O(2n)"], 0], ["For n=1024, about how many steps in binary search?", ["32", "1024", "512", "10"], 3], ["'x in list' in Python is:", ["O(1)", "O(log n)", "O(n^2)", "O(n)"], 3]]
  },
  "software|senior|m2": {
    facts: ["A stack is LIFO", "A queue is FIFO", "Set lookup is O(1) on average", "Balanced brackets are checked with a stack", "A binary tree node has at most 2 children", "BFS uses a queue"],
    qA: [["Stack follows:", ["Random", "Priority", "FIFO", "LIFO"], 3], ["Lookup in a set (average):", ["O(log n)", "O(n)", "O(n^2)", "O(1)"], 3], ["To check balanced brackets use:", ["Set", "Dict", "Queue", "Stack"], 3]],
    qB: [["Queue follows:", ["FIFO", "LIFO", "Priority", "Random"], 0], ["Max children of a node in a binary tree?", ["Unlimited", "2", "1", "3"], 1], ["BFS uses:", ["Heap only", "Stack", "Queue", "Nothing"], 2]]
  },
  "software|senior|m3": {
    facts: ["A traceback is read from the bottom (last line)", "range(5) goes 0..4", "The last valid index is len-1", "An off-by-one error is a boundary error", "Reproduce the error first, then fix it"],
    qA: [["Where do you read a traceback first?", ["At the top", "Last line", "Middle", "Never"], 1], ["for i in range(5) goes up to:", ["6", "3", "4", "5"], 2], ["IndexError in a[len(a)] happens because:", ["a is always empty", "Last index is len-1", "Wrong type", "len is wrong"], 1]],
    qB: [["What is an 'off-by-one' error?", ["Type error", "Name error", "Memory error", "A boundary error by 1"], 3], ["First good step in debugging:", ["Delete the code", "Ignore it", "Reproduce the error", "Rewrite everything"], 2], ["Why write a test before the fix?", ["For style", "To confirm the fix and avoid regressions", "Speeds the CPU", "Legally required"], 1]]
  }
};

function esc(s) { return String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])); }
function codeOf(html) { const m = html.match(/<pre>[\s\S]*?<\/pre>/); return m ? m[0] : ""; }

const field = FIELDS.find((f) => f.id === "software");
let count = 0;
for (const exp of Object.keys(field.expertise)) {
  for (const mod of field.expertise[exp].modules) {
    const en = EN["software|" + exp + "|" + mod.id];
    if (!en) { console.warn("no EN for", exp, mod.id); continue; }
    const alA = readFileSync(mod.materials.A.al, "utf8");
    const alB = readFileSync(mod.materials.B.al, "utf8");
    const code = codeOf(alA);
    const head = `<h1>${esc("Software")} - ${esc(exp)} - ${esc(mod.title.replace(/^M\d — /, "M" + mod.id.slice(1) + " - "))}</h1>`;
    const itemsA = en.facts.map((f, i) => `<li${i === en.facts.length - 1 ? ' data-aoi="kritike" data-critical="true"' : ""}>${esc(f)}</li>`).join("\n");
    const joined = en.facts.map((f, i) => i === en.facts.length - 1 ? `<span data-aoi="kritike" data-critical="true">${esc(f)}</span>` : esc(f)).join(" ");
    const pathA = `materials/${field.id}_${exp}_${mod.id}_a.en.html`;
    const pathB = `materials/${field.id}_${exp}_${mod.id}_b.en.html`;
    writeFileSync(pathA, `${head}\n<img class="fig" src="../assets/figures/software.svg" alt="software figure">\n<ul>\n${itemsA}\n</ul>\n${code}\n`);
    writeFileSync(pathB, `${head}\n<img class="fig" src="../assets/figures/software.svg" alt="software figure">\n<p>${joined}</p>\n${code}\n`);
    mod.materials.A.en = pathA;
    mod.materials.B.en = pathB;
    mod.quiz.A.forEach((q, i) => { const t = en.qA[i]; if (t) { q.q.en = t[0]; q.options.forEach((o, j) => { o.en = t[1][j]; }); } });
    mod.quiz.B.forEach((q, i) => { const t = en.qB[i]; if (t) { q.q.en = t[0]; q.options.forEach((o, j) => { o.en = t[1][j]; }); } });
    count++;
  }
}

const js = `/*
 * Generated by scripts/import-pack.mjs + apply-en.mjs — real content pack.
 * EN translations applied for: software.
 * Copyright 2026 Ardit Ceno. All rights reserved.
 */
export const EXPERTISE = ${JSON.stringify(EXPERTISE, null, 2)};
export const COMPLEXITY = { m1: "basic", m2: "intermediate", m3: "advanced" };
export const PROFESSIONS = ${JSON.stringify(PROFESSIONS, null, 2)};
export const FIELDS = ${JSON.stringify(FIELDS, null, 2)};
`;
writeFileSync("js/fields.js", js);
console.log(`EN applied to ${count} software modules`);
