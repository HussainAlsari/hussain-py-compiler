/* Hussain Compiler - Python Courses (multi-language, beginner-friendly explanations).
   Uses app.js globals (files, editor, openWorkspaceFile) and the HC language engine from i18n.js. */
(() => {
  const HC = window.HC || { T: (s, v) => String(s).replace(/\{(\w+)\}/g, (m, k) => (v && v[k] != null ? v[k] : m)), courseLang: () => "en", packs: {} };
  const T = (s, v) => HC.T(s, v);
  const TC = (s, v) => HC.T(s, v, HC.courseLang());
  const PROGRESS_KEY = "hussain-courses-progress-v1";

  // Each lesson: simple (analogy), body (explanation + example in <pre>), walk ([code, meaning]), mistakes, task, starter, expected, hint, solution, must.
  const COURSES = [
    { id: "basics", title: "Python Basics", level: "Beginner", lessons: [
      { id: "hello", title: "Hello, Python",
        simple: "print() displays a value on the screen. Text goes inside quotes; numbers and calculations don't need them.",
        body: "Use <code>print()</code> to show something on the screen. Text must be inside quotes.\n\n<pre>print(\"Hello\")\nprint(2 + 3)</pre>",
        walk: [["print(\"Hello\")", "Shows the word Hello. The quotes tell Python this is text."], ["print(2 + 3)", "No quotes, so Python does the math and shows 5."]],
        mistakes: ["Forgetting the quotes: print(Hello) fails because Python looks for a variable called Hello.", "Using a capital P: Python is case-sensitive, so Print() does not exist."],
        task: "Print exactly: <code>Hello, World!</code>", starter: "# Print Hello, World!\n", expected: "Hello, World!",
        hint: "print(\"Hello, World!\")", solution: "print(\"Hello, World!\")\n" },
      { id: "vars", title: "Variables and types",
        simple: "A variable is a name that refers to a value. You assign it once with = and can reuse it anywhere after that.",
        body: "A variable stores a value. Common types: <code>int</code> (whole number), <code>float</code> (decimal), <code>str</code> (text), <code>bool</code> (True/False).\n\n<pre>age = 20\nname = \"Sara\"\nprint(name, age)\nprint(type(age))</pre>",
        walk: [["age = 20", "Create a variable named age with the value 20."], ["name = \"Sara\"", "A variable named name that holds the text Sara."], ["print(name, age)", "Show the values of both variables."], ["print(type(age))", "Ask Python what kind of value age holds (int)."]],
        mistakes: ["Using = like in math: in Python = means 'store', while == means 'is equal to'.", "Starting a name with a number: 1price is not allowed, price1 is."],
        task: "Create <code>price = 12</code> and <code>qty = 3</code>, then print their product (<code>36</code>).", starter: "price = 12\nqty = 3\n# print price times qty\n", expected: "36",
        hint: "print(price * qty)", solution: "price = 12\nqty = 3\nprint(price * qty)\n" },
      { id: "fstr", title: "Strings and f-strings",
        simple: "An f-string lets you put variables and expressions directly inside text by writing them in {braces}.",
        body: "f-strings put values inside text. Strings also have helpers like <code>.upper()</code> and <code>.title()</code>.\n\n<pre>name = \"ali\"\nprint(f\"Hi {name.title()}!\")</pre>",
        walk: [["name = \"ali\"", "Store the text ali."], ["f\"Hi {name.title()}!\"", "The f before the quote turns the holes on. {name.title()} becomes Ali."]],
        mistakes: ["Forgetting the f before the quote, so {name} is printed as it is.", "Mixing quote types: use different quotes outside and inside the braces."],
        task: "Given <code>name = \"python\"</code> and <code>year = 1991</code>, print: <code>PYTHON was released in 1991</code>", starter: "name = \"python\"\nyear = 1991\n", expected: "PYTHON was released in 1991",
        hint: "print(f\"{name.upper()} was released in {year}\")", solution: "name = \"python\"\nyear = 1991\nprint(f\"{name.upper()} was released in {year}\")\n" },
      { id: "if", title: "Decisions with if",
        simple: "if runs a block of code only when a condition is True. else covers the case where it is False.",
        body: "Run code only when a condition is true. Indentation (4 spaces) matters a lot.\n\n<pre>n = 7\nif n % 2 == 0:\n    print(\"even\")\nelse:\n    print(\"odd\")</pre>",
        walk: [["n = 7", "Store the number 7."], ["if n % 2 == 0:", "% gives the remainder. If dividing by 2 leaves 0, the number is even."], ["    print(\"even\")", "Indented lines belong to the if. They run only when the condition is True."], ["else:", "Runs when the condition is False."]],
        mistakes: ["Forgetting the colon : at the end of if or else.", "Wrong indentation: lines inside the if must be pushed in by 4 spaces."],
        task: "With <code>score = 85</code>, print <code>Pass</code> if score is 50 or more, otherwise <code>Fail</code>.", starter: "score = 85\n", expected: "Pass",
        hint: "Use if score >= 50: ... else: ...", solution: "score = 85\nif score >= 50:\n    print(\"Pass\")\nelse:\n    print(\"Fail\")\n" },
      { id: "loops", title: "Loops",
        simple: "A loop repeats a block of code. for goes through a sequence of values; while repeats as long as a condition is True.",
        body: "<code>for</code> repeats over a sequence; <code>range(n)</code> gives 0 to n-1. <code>while</code> repeats while a condition is true.\n\n<pre>for i in range(3):\n    print(i)</pre>",
        walk: [["for i in range(3):", "Repeat 3 times; i becomes 0, then 1, then 2."], ["    print(i)", "This indented line is repeated every time."]],
        mistakes: ["Expecting range(5) to include 5: it stops one before (0 to 4).", "Forgetting to indent the line inside the loop."],
        task: "Print the numbers 1 to 5, one per line.", starter: "# use a for loop\n", expected: "1\n2\n3\n4\n5", must: [["for\\s|while\\s", "Use a loop (for or while)."]],
        hint: "for i in range(1, 6): print(i)", solution: "for i in range(1, 6):\n    print(i)\n" },
    ]},
    { id: "structures", title: "Data Structures and Functions", level: "Beginner to Intermediate", lessons: [
      { id: "lists", title: "Lists",
        simple: "A list stores several values in order. You access items by position, starting at 0, and you can add or remove items.",
        body: "A list holds ordered items. Use indexes, <code>append</code>, slicing, <code>len</code>, <code>sum</code> and <code>sorted</code>.\n\n<pre>nums = [3, 1, 2]\nnums.append(5)\nprint(sorted(nums), len(nums))</pre>",
        walk: [["nums = [3, 1, 2]", "Make a list of three numbers."], ["nums.append(5)", "Add 5 to the end."], ["print(sorted(nums), len(nums))", "sorted gives a sorted copy; len counts the items."]],
        mistakes: ["Counting from 1: the first item is nums[0], not nums[1].", "Using () or {} instead of [] to make a list."],
        task: "Given <code>nums = [4, 8, 15, 16, 23, 42]</code>, print the sum of the list.", starter: "nums = [4, 8, 15, 16, 23, 42]\n", expected: "108",
        hint: "print(sum(nums))", solution: "nums = [4, 8, 15, 16, 23, 42]\nprint(sum(nums))\n" },
      { id: "dicts", title: "Dictionaries",
        simple: "A dictionary stores values by key instead of by position, so you look things up by name, for example user[\"name\"].",
        body: "A dictionary maps keys to values.\n\n<pre>user = {\"name\": \"Omar\", \"age\": 30}\nuser[\"city\"] = \"Dubai\"\nfor k, v in user.items():\n    print(k, v)</pre>",
        walk: [["user = {\"name\": \"Omar\", \"age\": 30}", "Two pairs: key name has value Omar; key age has value 30."], ["user[\"city\"] = \"Dubai\"", "Add a new pair (or change an old one)."], ["for k, v in user.items():", "Go through every key and its value together."]],
        mistakes: ["Asking for a key that does not exist causes KeyError; use user.get(\"x\") to be safe.", "Keys are unique: setting the same key again replaces the old value."],
        task: "Given <code>stock = {\"apple\": 3, \"pear\": 5}</code>, add <code>\"kiwi\": 7</code> and print how many items the dictionary has.", starter: "stock = {\"apple\": 3, \"pear\": 5}\n", expected: "3",
        hint: "stock[\"kiwi\"] = 7 then print(len(stock))", solution: "stock = {\"apple\": 3, \"pear\": 5}\nstock[\"kiwi\"] = 7\nprint(len(stock))\n" },
      { id: "funcs", title: "Functions",
        simple: "A function is a named block of code you can reuse. It takes inputs (parameters) and can send back a result with return.",
        body: "Define reusable code with <code>def</code>. Use <code>return</code> to give a value back.\n\n<pre>def square(x):\n    return x * x\n\nprint(square(4))</pre>",
        walk: [["def square(x):", "Create a function named square that takes one input called x."], ["    return x * x", "Send the answer back to whoever called the function."], ["print(square(4))", "Call the function with 4 and print the answer, 16."]],
        mistakes: ["Using print instead of return inside the function, so you cannot reuse the value.", "Defining a function but never calling it: nothing happens until you call it."],
        task: "Write <code>def area(w, h)</code> that returns width times height, then print <code>area(6, 7)</code>.", starter: "# define area(w, h)\n", expected: "42", must: [["def\\s+area\\s*\\(", "Define a function called area."]],
        hint: "def area(w, h):\n    return w * h", solution: "def area(w, h):\n    return w * h\n\nprint(area(6, 7))\n" },
      { id: "comp", title: "List comprehensions",
        simple: "A list comprehension builds a new list from another sequence in one line, and can filter items with if.",
        body: "A compact way to build lists.\n\n<pre>squares = [x * x for x in range(5)]\nevens = [x for x in range(10) if x % 2 == 0]\nprint(squares)\nprint(evens)</pre>",
        walk: [["[x * x for x in range(5)]", "For each x from 0 to 4, compute x * x and collect the results."], ["[x for x in range(10) if x % 2 == 0]", "Keep only the x values where the if condition is True."]],
        mistakes: ["Putting the if before for: the filter goes at the end.", "Squeezing too much into one line: if it is hard to read, use a normal loop."],
        task: "Print a list of the squares of the numbers 1 to 5 using a comprehension. Expected: <code>[1, 4, 9, 16, 25]</code>", starter: "", expected: "[1, 4, 9, 16, 25]", must: [["\\[.*for .* in .*\\]", "Use a list comprehension."]],
        hint: "print([x * x for x in range(1, 6)])", solution: "print([x * x for x in range(1, 6)])\n" },
      { id: "errors", title: "Handling errors",
        simple: "try/except lets your program handle an error instead of crashing: the code in try runs, and if it raises the named error, except runs instead.",
        body: "Catch problems with <code>try</code> / <code>except</code> so your program does not stop.\n\n<pre>try:\n    int(\"abc\")\nexcept ValueError:\n    print(\"not a number\")</pre>",
        walk: [["try:", "Start the code that might fail."], ["    int(\"abc\")", "This fails because abc is not a number."], ["except ValueError:", "Catch exactly this kind of problem."], ["    print(\"not a number\")", "Run this instead of crashing."]],
        mistakes: ["Writing a bare except: it hides real bugs; name the error type.", "Putting lots of code inside try; keep only the line that can fail."],
        task: "Convert <code>text = \"12x\"</code> with <code>int()</code>. If it fails, print <code>Invalid number</code>.", starter: "text = \"12x\"\n", expected: "Invalid number", must: [["try\\s*:", "Use try/except."]],
        hint: "try: int(text) except ValueError: print(...)", solution: "text = \"12x\"\ntry:\n    print(int(text))\nexcept ValueError:\n    print(\"Invalid number\")\n" },
    ]},
    { id: "intermediate", title: "Intermediate Python", level: "Intermediate", lessons: [
      { id: "classes", title: "Classes and objects",
        simple: "A class defines the structure and behaviour of a type of object. Each object created from it keeps its own data in self.",
        body: "A class bundles data and behaviour together.\n\n<pre>class Dog:\n    def __init__(self, name):\n        self.name = name\n    def speak(self):\n        return f\"{self.name} says woof\"\n\nprint(Dog(\"Rex\").speak())</pre>",
        walk: [["class Dog:", "Define a class called Dog."], ["def __init__(self, name):", "Runs when a Dog is created; self means this dog."], ["self.name = name", "Store the name on this object."], ["def speak(self):", "A method that every Dog object has."], ["Dog(\"Rex\").speak()", "Create a Dog named Rex and call speak()."]],
        mistakes: ["Forgetting self as the first parameter of a method.", "Forgetting self. when using an attribute: write self.value, not value."],
        task: "Create a class <code>Counter</code> with an <code>add()</code> method that increases <code>self.value</code> (starting at 0) by 1. Call add three times and print <code>value</code>.", starter: "# class Counter ...\n", expected: "3", must: [["class\\s+Counter", "Create a class named Counter."]],
        hint: "__init__ sets self.value = 0; add does self.value += 1", solution: "class Counter:\n    def __init__(self):\n        self.value = 0\n\n    def add(self):\n        self.value += 1\n\nc = Counter()\nc.add()\nc.add()\nc.add()\nprint(c.value)\n" },
      { id: "inherit", title: "Inheritance",
        simple: "A child class inherits everything from its parent class and can add new behaviour or override existing methods.",
        body: "A child class reuses a parent class and can change its behaviour.\n\n<pre>class Animal:\n    def sound(self): return \"...\"\nclass Cat(Animal):\n    def sound(self): return \"meow\"\n\nprint(Cat().sound())</pre>",
        walk: [["class Animal:", "The parent class."], ["class Cat(Animal):", "Cat inherits from Animal because of the (Animal) part."], ["def sound(self): return \"meow\"", "Cat replaces (overrides) the parent's version."]],
        mistakes: ["Forgetting the parent in brackets: class Cat: is not a child.", "Overriding __init__ without passing the values the parent needs."],
        task: "Make <code>Shape</code> with <code>area()</code> returning 0 and <code>Square(Shape)</code> that takes <code>side</code> and overrides <code>area()</code>. Print <code>Square(5).area()</code>.", starter: "", expected: "25", must: [["class\\s+Square\\s*\\(\\s*Shape", "Square must inherit from Shape."]],
        hint: "class Square(Shape): def __init__(self, side): ...", solution: "class Shape:\n    def area(self):\n        return 0\n\nclass Square(Shape):\n    def __init__(self, side):\n        self.side = side\n\n    def area(self):\n        return self.side ** 2\n\nprint(Square(5).area())\n" },
      { id: "modules", title: "Standard library",
        simple: "A module is a file of ready-made code. import lets you use its functions so you don't have to write them yourself.",
        body: "Python ships with many modules: <code>math</code>, <code>random</code>, <code>json</code>, <code>collections</code>, <code>datetime</code>.\n\n<pre>import math\nprint(math.sqrt(16))</pre>",
        walk: [["import math", "Load the math module."], ["math.sqrt(16)", "Call its sqrt function: the result is 4.0."]],
        mistakes: ["Naming your file the same as a module (math.py): Python imports your file instead.", "Forgetting the module name: write math.sqrt, not just sqrt."],
        task: "Use <code>collections.Counter</code> to count letters in <code>\"banana\"</code> and print how many times <code>\"a\"</code> appears.", starter: "from collections import Counter\n", expected: "3",
        hint: "print(Counter(\"banana\")[\"a\"])", solution: "from collections import Counter\nprint(Counter(\"banana\")[\"a\"])\n" },
      { id: "json", title: "Working with JSON",
        simple: "JSON is a standard text format for data. json.dumps converts Python data to JSON text and json.loads converts it back.",
        body: "<code>json.dumps</code> turns Python data into text; <code>json.loads</code> turns text back into data.\n\n<pre>import json\ns = json.dumps({\"a\": 1})\nprint(json.loads(s)[\"a\"])</pre>",
        walk: [["json.dumps({\"a\": 1})", "Pack Python data into JSON text."], ["json.loads(s)", "Unpack JSON text back into Python data."], ["[\"a\"]", "Then read it like a normal dictionary."]],
        mistakes: ["Mixing up dumps and loads: the s means string. dumps makes a string, loads reads a string.", "JSON needs double quotes: single quotes are not valid JSON."],
        task: "Parse <code>raw = '{\"name\": \"Lina\", \"langs\": [\"py\", \"js\"]}'</code> and print the number of languages.", starter: "import json\nraw = '{\"name\": \"Lina\", \"langs\": [\"py\", \"js\"]}'\n", expected: "2",
        hint: "data = json.loads(raw); print(len(data[\"langs\"]))", solution: "import json\nraw = '{\"name\": \"Lina\", \"langs\": [\"py\", \"js\"]}'\ndata = json.loads(raw)\nprint(len(data[\"langs\"]))\n" },
      { id: "gen", title: "Generators and lambdas",
        simple: "A generator produces values one at a time with yield, instead of building the whole list in memory first.",
        body: "<code>yield</code> produces values one at a time; <code>lambda</code> makes tiny functions.\n\n<pre>def count(n):\n    for i in range(n):\n        yield i\nprint(list(count(3)))</pre>",
        walk: [["def count(n):", "Define a function."], ["    yield i", "Return one value and pause until the next one is requested."], ["list(count(3))", "Ask for every value and put them in a list: [0, 1, 2]."]],
        mistakes: ["Using return instead of yield: return ends the function immediately.", "Printing the generator itself: you must loop over it or use list()."],
        task: "Write a generator <code>evens(n)</code> that yields even numbers below n. Print <code>list(evens(10))</code>.", starter: "", expected: "[0, 2, 4, 6, 8]", must: [["yield", "Use yield."]],
        hint: "for i in range(n): if i % 2 == 0: yield i", solution: "def evens(n):\n    for i in range(n):\n        if i % 2 == 0:\n            yield i\n\nprint(list(evens(10)))\n" },
    ]},
  ];
  HC.courses = COURSES;
  const EXAMPLE_OUTPUTS = {
    hello: "Hello\n5",
    vars: "Sara 20\n<class 'int'>",
    fstr: "Hi Ali!",
    if: "odd",
    loops: "0\n1\n2",
    lists: "[1, 2, 3, 5] 4",
    dicts: "name Omar\nage 30\ncity Dubai",
    funcs: "16",
    comp: "[0, 1, 4, 9, 16]\n[0, 2, 4, 6, 8]",
    errors: "not a number",
    classes: "Rex says woof",
    inherit: "meow",
    modules: "4.0",
    json: "1",
    gen: "[0, 1, 2]",
  };

  // ---- helpers: translated content, safe HTML ----
  const $ = (s, r = document) => r.querySelector(s);
  const norm = (s) => String(s).replace(/\s+/g, "");
  const load = () => { try { return JSON.parse(localStorage.getItem(PROGRESS_KEY) || "{}"); } catch (_) { return {}; } };
  const save = (p) => { try { localStorage.setItem(PROGRESS_KEY, JSON.stringify(p)); } catch (_) {} };
  let progress = load();
  let current = null;
  const key = (c, l) => `${c.id}/${l.id}`;
  const fileFor = (c, l) => `courses/${c.id}-${l.id}.py`;

  const pack = () => (HC.packs || {})[HC.courseLang()];
  const item = (c, l, f) => { const it = pack()?.course?.items?.[l ? key(c, l) : c.id]; return it ? it[f] : undefined; };
  const text = (c, l, f) => item(c, l, f) || (l || c)[f];
  const arr = (c, l, f) => { const a = item(c, l, f); return Array.isArray(a) && a.length ? a : null; };

  const ALLOWED = new Set(["PRE", "CODE", "B", "I", "STRONG", "EM", "BR", "UL", "LI", "P"]);
  function sanitize(s) {
    const doc = new DOMParser().parseFromString(`<body>${s}</body>`, "text/html");
    (function clean(n) {
      [...n.childNodes].forEach((c) => {
        if (c.nodeType === 1) {
          if (!ALLOWED.has(c.tagName)) c.replaceWith(document.createTextNode(c.textContent));
          else { [...c.attributes].forEach((a) => c.removeAttribute(a.name)); clean(c); }
        } else if (c.nodeType !== 3) c.remove();
      });
    })(doc.body);
    return doc.body.innerHTML;
  }
  const fmt = (s) => sanitize(String(s).split(/(<pre>[\s\S]*?<\/pre>)/).map((p) => (/^<pre>/.test(p) ? p : p.replace(/\n\n/g, "<br><br>"))).join(""));
  const exampleOf = (html) => [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("pre")]
    .map((pre) => pre.textContent)
    .filter(Boolean)
    .join("\n");
  const mk = (tag, cls, txt) => { const e = document.createElement(tag); if (cls) e.className = cls; if (txt != null) e.textContent = txt; return e; };
  function renderCodeEditor(container, source) {
    const CodeMirror = window.CodeMirror;
    if (!CodeMirror) {
      container.textContent = source;
      return;
    }
    const codeEditor = CodeMirror(container, {
      value: source,
      mode: "python",
      theme: "material-darker",
      readOnly: "nocursor",
      lineNumbers: true,
      lineWrapping: false,
      viewportMargin: Infinity,
    });
    codeEditor.setSize("100%", "auto");
    requestAnimationFrame(() => codeEditor.refresh());
  }
  // ---- dialog ----
  const dlg = document.createElement("dialog");
  dlg.className = "courses-dialog";
  dlg.setAttribute("aria-label", "Python Courses");
  dlg.innerHTML = `<div class="cd-head"><strong>Python Courses</strong><span class="cd-total"></span><button class="cd-x" type="button" aria-label="Close">×</button></div>
    <div class="cd-body"><nav class="cd-nav" data-i18n-skip></nav><section class="cd-main" data-i18n-skip></section></div>`;
  document.body.appendChild(dlg);
  $(".cd-x", dlg).onclick = () => dlg.close();
  dlg.addEventListener("click", (e) => { if (e.target === dlg) dlg.close(); });

  function renderNav() {
    const nav = $(".cd-nav", dlg); nav.replaceChildren();
    nav.dir = pack()?.dir || "ltr";
    let done = 0, total = 0;
    COURSES.forEach((c) => {
      const cd = c.lessons.filter((l) => progress[key(c, l)]).length;
      const h = mk("div", "cd-course"); h.append(mk("b", "", text(c, null, "title")), mk("small", "", `${TC(c.level)} · ${cd}/${c.lessons.length}`));
      nav.append(h);
      c.lessons.forEach((l, i) => {
        total++; if (progress[key(c, l)]) done++;
        const b = mk("button", "cd-lesson" + (current && current.lesson === l ? " active" : ""), `${progress[key(c, l)] ? "✓" : i + 1 + "."} ${text(c, l, "title")}`);
        b.type = "button"; b.onclick = () => showLesson(c, i); nav.append(b);
      });
    });
    $(".cd-total", dlg).textContent = T("{done}/{total} completed", { done, total });
  }

  function renderLesson() {
    const { course: c, lesson: l, index: i } = current, m = $(".cd-main", dlg);
    m.replaceChildren(); m.dir = pack()?.dir || "ltr";
    m.append(mk("h2", "", `${text(c, null, "title")} · ${i + 1}. ${text(c, l, "title")}`));
    const simple = mk("div", "cd-simple"); simple.append(mk("b", "", TC("In simple words")), mk("p", "", text(c, l, "simple"))); m.append(simple);
    const body = mk("div", "cd-text"); body.innerHTML = fmt(text(c, l, "body"));
    const bodyCodeBlocks = [];
    [...body.childNodes].forEach((node) => {
      if (!(node instanceof HTMLElement) || node.tagName !== "PRE") return;
      let source = node.textContent;
      while (node.nextElementSibling?.tagName === "PRE" && node.nextSibling === node.nextElementSibling) {
        const next = node.nextElementSibling;
        source += `\n${next.textContent}`;
        next.remove();
      }
      const container = mk("div", "cd-inline-code");
      node.replaceWith(container);
      bodyCodeBlocks.push({ container, source });
    });
    m.append(body);
    const meanings = arr(c, l, "walk") || [];
    const exampleCode = exampleOf(fmt(text(c, l, "body")));
    const exampleOutput = EXAMPLE_OUTPUTS[l.id];
    if (!exampleCode || typeof exampleOutput !== "string") {
      throw new Error(`The course example is incomplete for ${key(c, l)}.`);
    }
    const example = mk("section", "cd-example");
    example.append(mk("b", "cd-example-title", TC("Worked example")));
    const io = mk("div", "cd-io-grid");
    const input = mk("div", "cd-io-card cd-io-input");
    const codeContainer = mk("div", "cd-example-code");
    input.append(mk("b", "", TC("Input (code)")), codeContainer);
    const output = mk("div", "cd-io-card cd-io-output");
    const outputBox = mk("pre", "cd-example-output", exampleOutput);
    output.append(mk("b", "", TC("Output")), outputBox);
    io.append(input, output); example.append(io);
    const walk = mk("div", "cd-walk"); walk.append(mk("b", "", TC("Explanation, line by line")));
    l.walk.forEach((w, k) => { const r = mk("div", "cd-walk-row"); r.append(mk("code", "", w[0]), mk("span", "", meanings[k] || w[1])); walk.append(r); });
    example.append(walk); m.append(example);
    renderCodeEditor(codeContainer, exampleCode);
    const mis = mk("div", "cd-mistakes"); mis.append(mk("b", "", TC("Common mistakes")));
    const ul = mk("ul"); (arr(c, l, "mistakes") || l.mistakes).forEach((x) => ul.append(mk("li", "", x))); mis.append(ul); m.append(mis);
    const task = mk("div", "cd-task"); task.append(mk("b", "", TC("Your task"))); const td = mk("div"); td.innerHTML = sanitize(text(c, l, "task")); task.append(td); m.append(task);
    const act = mk("div", "cd-actions");
    const ex = mk("button", "cd-secondary", TC("Try the example")); ex.type = "button"; ex.onclick = tryExample;
    const go = mk("button", "cd-primary", TC("Start lesson in editor")); go.type = "button"; go.onclick = startLesson;
    act.append(ex, go); m.append(act);
    bodyCodeBlocks.forEach(({ container, source }) => renderCodeEditor(container, source));
  }

  function showLesson(c, i) { current = { course: c, lesson: c.lessons[i], index: i }; renderLesson(); renderNav(); }

  function tryExample() {
    const { course, lesson } = current, name = `courses/${course.id}-${lesson.id}-example.py`;
    files[name] = exampleOf(fmt(lesson.body)) || "# no example\n";
    openWorkspaceFile(name); dlg.close(); editor.focus();
  }
  // ---- task comment at the top of every lesson file (in the course language) ----
  const HEADER_RE = /^# ={20,}\n(?:#[^\n]*\n)*?# ={20,}\n\n?/;
  const BAR = "# " + "=".repeat(62) + "\n";
  const plain = (html) => {
    const d = new DOMParser().parseFromString(`<body>${sanitize(html)}</body>`, "text/html");
    d.querySelectorAll("code").forEach((c) => c.replaceWith("`" + c.textContent + "`"));
    d.querySelectorAll("br").forEach((b) => b.replaceWith("\n"));
    return d.body.textContent;
  };
  const wrap = (str, width = 68) => {
    const out = [];
    String(str).split("\n").forEach((par) => {
      let line = "";
      par.split(/\s+/).filter(Boolean).forEach((w) => { if (line && (line + " " + w).length > width) { out.push(line); line = w; } else line = line ? line + " " + w : w; });
      out.push(line);
    });
    return out;
  };
  const commentRows = (rows) => rows
    .flatMap((row) => String(row).split(/\r\n?|\n|\u2028|\u2029/))
    .map((row) => row ? "# " + row : "#")
    .join("\n");
  const SETTINGS_KEY = "hussain-courses-settings-v1";
  const settings = (() => { try { return Object.assign({ fullComment: false, taskPanelPos: "right" }, JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}")); } catch (_) { return { fullComment: false, taskPanelPos: "right" }; } })();
  const saveSettings = () => { try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings)); } catch (_) {} };
  function buildHeader(c, l) {
    if (settings.fullComment) return fullHeader(c, l);
    const rows = [`${TC("Lesson:")} ${text(c, l, "title")}`, ...wrap(TC("See the Task panel for the full question, then press Run to see your output."), 80)];
    return BAR + commentRows(rows) + "\n" + BAR + "\n";
  }
  function fullHeader(c, l) {
    const rows = [`${TC("Lesson:")} ${text(c, l, "title")}`, ""];
    rows.push(TC("Task:"), ...wrap(plain(text(c, l, "task"))), "");
    rows.push(TC("Expected output:"), ...String(l.expected).split("\n").map((x) => "   " + x), "");
    const mustMsgs = arr(c, l, "must") || [];
    if ((l.must || []).length) rows.push(TC("Requirements:"), ...l.must.map((m, k) => "- " + (mustMsgs[k] || TC(m[1]))), "");
    rows.push(...wrap(TC("Write your code below, then press Run to see your output.")));
    return BAR + commentRows(rows) + "\n" + BAR + "\n";
  }
  const withHeader = (code, c, l) => buildHeader(c, l) + String(code).replace(HEADER_RE, "");
  function startLesson() {
    const { course, lesson } = current, name = fileFor(course, lesson);
    const existing = name === activeFile ? editor.getValue() : files[name];
    files[name] = withHeader(existing != null ? existing : lesson.starter, course, lesson);
    barDismissed = null; taskOpen = true;
    if (name === activeFile) { editor.setValue(files[name]); saveWorkspace(); } else openWorkspaceFile(name);
    dlg.close(); syncBar(); editor.focus();
  }
  // When the course language changes, rewrite the header of existing lesson files (your own code is kept).
  function refreshHeaders() {
    let changed = false;
    for (const name of Object.keys(files)) {
      const hit = lessonFromFile(name); if (!hit) continue;
      const cur = name === activeFile ? editor.getValue() : files[name];
      if (!HEADER_RE.test(cur)) continue;
      const next = withHeader(cur, hit.course, hit.lesson);
      if (next === cur) continue;
      files[name] = next; changed = true;
      if (name === activeFile) editor.setValue(next);
    }
    if (changed) saveWorkspace();
  }

  // ---- lesson bar above the editor ----
  const bar = document.createElement("div");
  bar.className = "lesson-bar"; bar.hidden = true;
  bar.innerHTML = `<span class="lb-title" data-i18n-skip></span><span class="lb-msg"></span>
    <div class="lb-controls">
      <button data-a="close" type="button" class="lb-close" aria-label="Close lesson">×</button>
    </div>`;
  $(".editor-stage").prepend(bar);

  const msg = (t, kind = "") => { const m = $(".lb-msg", bar); m.textContent = t; m.className = "lb-msg " + kind; };
  const barTitle = () => { $(".lb-title", bar).textContent = `${text(current.course, null, "title")}: ${text(current.course, current.lesson, "title")}`; };
  // ---- Task panel (question, expected output, live requirements, output comparison) ----
  let taskOpen = true, hooked = false, panelRendered = false;
  const panel = mk("div", "task-panel"); panel.hidden = true; panel.setAttribute("data-i18n-skip", "");
  const panelHead = mk("div", "tp-head");
  const panelMenu = mk("button", "tp-menu"); panelMenu.type = "button"; panelMenu.title = "Panel position"; panelMenu.innerHTML = "⋮";
  panelMenu.addEventListener("click", (e) => {
    e.stopPropagation();
    const opts = [{ v: "right", label: "Right" }, { v: "bottom", label: "Bottom" }, { v: "left", label: "Left" }];
    const idx = opts.findIndex((o) => o.v === settings.taskPanelPos);
    const next = opts[(idx + 1) % opts.length];
    settings.taskPanelPos = next.v;
    saveSettings();
    panel.className = "task-panel " + settings.taskPanelPos;
    panelMenu.title = "Panel position: " + next.label;
  });
  panelHead.append(panelMenu);
  panel.appendChild(panelHead);
  bar.after(panel);
  // ---- Task panel resize handle ----
  const resizeHandle = mk("div", "tp-resize");
  panel.appendChild(resizeHandle);
  let isResizing = false, startX = 0, startWidth = 0;
  resizeHandle.addEventListener("pointerdown", (e) => {
    isResizing = true;
    startX = e.clientX;
    startWidth = panel.offsetWidth;
    resizeHandle.setPointerCapture(e.pointerId);
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  });
  resizeHandle.addEventListener("pointermove", (e) => {
    if (!isResizing) return;
    const delta = e.clientX - startX;
    let newWidth = startWidth + delta;
    if (settings.taskPanelPos === "right") newWidth = startWidth - delta;
    newWidth = Math.max(200, Math.min(600, newWidth));
    panel.style.width = newWidth + "px";
  });
  resizeHandle.addEventListener("pointerup", (e) => {
    isResizing = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    resizeHandle.releasePointerCapture(e.pointerId);
  });
  function applyPanel() {
    panel.hidden = bar.hidden || !taskOpen;
    panel.className = "task-panel " + settings.taskPanelPos;
  }
  function updateReqs() {
    if (!current) return;
    const code = typeof editor !== "undefined" && editor ? editor.getValue() : "";
    panel.querySelectorAll(".tp-reqs li").forEach((li, i) => {
      const m = (current.lesson.must || [])[i]; const ok = !!m && new RegExp(m[0]).test(code);
      li.classList.toggle("ok", ok); li.firstChild.textContent = ok ? "✓ " : "○ ";
    });
  }
  function renderPanel() {
    const { course: c, lesson: l } = current;
    panel.dir = pack()?.dir || "ltr";
    panel.replaceChildren(panelHead, resizeHandle);
    const sec = (label, cls) => { const d = mk("div", "tp-section" + (cls ? " " + cls : "")); d.append(mk("b", "", label)); panel.append(d); return d; };
    const titleDiv = mk("div", "tp-title"); titleDiv.innerHTML = `<b>${text(c, null, "title")}</b> · ${text(c, l, "title")}`;
    panel.appendChild(titleDiv);
    const openBtn = mk("button", "tp-open"); openBtn.type = "button"; openBtn.textContent = "Open Lesson";
    openBtn.addEventListener("click", (e) => { e.stopPropagation(); showLesson(c, current.index); dlg.showModal(); });
    panel.appendChild(openBtn);
    const td = mk("div", "tp-task"); td.innerHTML = sanitize(text(c, l, "task")); sec(TC("Task")).append(td);
    sec(TC("Expected output")).append(mk("pre", "tp-expected", l.expected));
    if ((l.must || []).length) {
      const msgs = arr(c, l, "must") || [], ul = mk("ul");
      l.must.forEach((m, k) => { const li = mk("li"); li.append(document.createTextNode("○ "), document.createTextNode(msgs[k] || TC(m[1]))); ul.append(li); });
      sec(TC("Requirements"), "tp-reqs").append(ul);
    }
    const cmp = mk("div", "tp-compare"); cmp.hidden = true; panel.append(cmp);
    const solBox = mk("div", "tp-solution"); solBox.innerHTML = ""; panel.append(solBox);
    solBox.style.display = "none";
    const nav = mk("div", "tp-nav");
    const prevBtn = mk("button", "tp-nav-btn"); prevBtn.type = "button"; prevBtn.textContent = "‹ Previous";
    prevBtn.addEventListener("click", (e) => { e.stopPropagation(); if (current.index === 0) return; const c = current.course; const prev = c.lessons[current.index - 1]; current = { course: c, lesson: prev, index: current.index - 1 }; startLesson(); });
    const lessonBtn = mk("button", "tp-nav-btn"); lessonBtn.type = "button"; lessonBtn.textContent = "Lesson";
    lessonBtn.addEventListener("click", (e) => { e.stopPropagation(); showLesson(c, current.index); dlg.showModal(); });
    const solBtn = mk("button", "tp-nav-btn solution"); solBtn.type = "button"; solBtn.textContent = "Solution";
    solBtn.addEventListener("click", (e) => { 
      e.stopPropagation(); 
      const hideSol = solBox.style.display !== "none";
      solBox.style.display = hideSol ? "none" : "block";
      solBtn.classList.toggle("on", !hideSol);
      if (!hideSol) { 
  solBox.replaceChildren(mk("b", "", "Solution"));
  const p = mk("pre", ""); 
  renderCodeEditor(p, l.solution); 
  solBox.appendChild(p); 
} else { 
  solBox.innerHTML = ""; 
}
    });
    const nextBtn = mk("button", "tp-nav-btn"); nextBtn.type = "button"; nextBtn.textContent = "Next ›";
    nextBtn.addEventListener("click", (e) => { e.stopPropagation(); const c = current.course; const next = c.lessons[current.index + 1]; if (!next) return; current = { course: c, lesson: next, index: current.index + 1 }; startLesson(); });
    nav.append(prevBtn, lessonBtn, solBtn, nextBtn);
    panel.append(nav);
    updateReqs();
    panelRendered = true;
  }
  function hideCompare() { const c = panel.querySelector(".tp-compare"); if (c) c.hidden = true; }
  function hideSolution() { const c = panel.querySelector(".tp-solution"); if (c) { c.style.display = "none"; c.hidden = true; } }
  function showCompare(out, exp) {
    const cmp = panel.querySelector(".tp-compare"); if (!cmp) return;
    cmp.replaceChildren(); cmp.hidden = false;
    const a = String(out).replace(/\s+$/, "").split("\n"), b = String(exp).split("\n"), n = Math.max(a.length, b.length);
    const squash = (x) => String(x == null ? "" : x).replace(/\s+/g, "");
    const col = (label, mine, other) => {
      const d = mk("div", "tp-col"); d.append(mk("b", "", label));
      const box = mk("pre");
      for (let i = 0; i < n; i++) box.append(mk("div", "ln" + (squash(mine[i]) !== squash(other[i]) ? " bad" : ""), mine[i] == null || mine[i] === "" ? "\u00a0" : mine[i]));
      d.append(box); return d;
    };
    const wrapEl = mk("div", "tp-cols"); wrapEl.append(col(TC("Your output"), a, b), col(TC("Expected output"), b, a)); cmp.append(wrapEl);
  }

  let barFor = null, barDismissed = null;
  function lessonFromFile(name) {
    for (const c of COURSES) for (const [i, l] of c.lessons.entries()) if (name === fileFor(c, l)) return { course: c, lesson: l, index: i };
    return null;
  }
  // The lesson bar is only visible while a lesson file is the active file.
  function syncBar() {
    const hit = lessonFromFile(typeof activeFile === "string" ? activeFile : "");
    if (!hit) { panel.hidden = true; barFor = null; barDismissed = null; applyPanel(); return; }
    const k = key(hit.course, hit.lesson), changed = barFor !== k;
    current = hit; barFor = k;
    if (changed) barDismissed = null;
    if (barDismissed === k) { panel.hidden = true; applyPanel(); return; }
    panel.hidden = false;
    if (changed) msg(T("Write your code, then press Run to see your output."));
    if (changed || !panel.firstChild) renderPanel();
    bar.hidden = false; barTitle();
    applyPanel();
    if (!hooked && typeof editor !== "undefined" && editor) { editor.on("change", () => { if (!panel.hidden) updateReqs(); }); hooked = true; }
    try { editor.refresh(); } catch (_) {}
  }

  const capturedOutput = () => [...document.querySelectorAll("#console .console-line:not(.system):not(.error), #console .console-input-line")].map((n) => n.textContent).join("\n");

  function check() {
    const { course, lesson } = current;
    if (document.getElementById("runState").textContent === "Running…") return msg(T("Wait for the program to finish."), "warn");
    updateReqs();
    const code = editor.getValue(), mustMsgs = arr(course, lesson, "must") || [];
    for (const [k, [re, en]] of (lesson.must || []).entries()) if (!new RegExp(re).test(code)) return msg(mustMsgs[k] || T(en), "bad");
    if (document.querySelector("#console .console-line.error")) return msg(T("Your program has an error. Fix it and run again."), "bad");
    const out = capturedOutput();
    if (!out.trim()) return msg(T("No output yet. Press Run first."), "warn");
    if (norm(out) === norm(lesson.expected)) {
      progress[key(course, lesson)] = true;
      save(progress);
      renderNav();
      hideCompare();
      hideSolution();
      msg(T("Done ✓"), "good");
    } else {
      showCompare(out, lesson.expected);
      taskOpen = true;
      applyPanel();
      msg(T("Not quite. Your output doesn't match yet. Try the hint."), "bad");
    }
  }

  bar.addEventListener("click", (e) => {
    const a = e.target.closest("button")?.dataset.a; if (!a || !current) return;
    const { course, lesson, index } = current;
    if (a === "info") { showLesson(course, index); dlg.showModal(); }
    else if (a === "task") { taskOpen = !taskOpen; applyPanel(); }
    else if (a === "check") check();
    else if (a === "hint") msg(T("Hint: {hint}", { hint: String(text(course, lesson, "hint")).replace(/\n/g, " ") }));
    else if (a === "solution") { if (!confirm("Replace your code with the solution?")) return; editor.setValue(lesson.solution); msg(T("Solution loaded. Run it to see its output.")); }
    else if (a === "next") {
      const next = course.lessons[index + 1];
      if (!next) return msg(T("That was the last lesson in this course!"), "good");
      current = { course, lesson: next, index: index + 1 }; startLesson();
    } else if (a === "prev") {
      if (index === 0) return msg(T("That was the first lesson in this course!"), "warn");
      const prev = course.lessons[index - 1];
      current = { course, lesson: prev, index: index - 1 }; startLesson();
    } else if (a === "close") { bar.hidden = true; barDismissed = barFor; }
  });

  document.addEventListener("hc-lang", () => {
    try { refreshHeaders(); } catch (_) {}
    if (!current) return;
    renderNav(); renderLesson();
    if (!bar.hidden) { barTitle(); renderPanel(); applyPanel(); }
  });

  // ---- mark lesson files: green "lesson" icon in the explorer and editor tab ----
  const isLesson = (n) => /^courses\//.test(n || "");
  function markFiles() {
    const label = T("lesson");
    document.querySelectorAll("#fileList .file-row").forEach((row) => {
      const on = isLesson(row.title), t = row.querySelector(".file-type");
      if (!t) return;
      row.classList.toggle("lesson-file", on);
      if (on && t.textContent !== label) t.textContent = label;
    });
    const activeIsLesson = typeof activeFile === "string" && isLesson(activeFile);
    syncBar();
    document.querySelectorAll(".editor-tabbar .python-file-icon, .breadcrumbs .python-file-icon").forEach((i) => {
      i.classList.toggle("lesson-icon", activeIsLesson);
      const want = activeIsLesson ? label : "Py";
      if (i.textContent !== want && !(want === "Py" && T("Py") === i.textContent)) i.textContent = want;
    });
  }
  const fl = document.getElementById("fileList");
  if (fl) new MutationObserver(markFiles).observe(fl, { childList: true });
  const afn = document.getElementById("activeFileName");
  if (afn) new MutationObserver(markFiles).observe(afn, { childList: true, characterData: true, subtree: true });
  document.addEventListener("hc-lang", markFiles);
  refreshHeaders();
  markFiles();

  // ---- setting: full task comment in lesson files ----
  const settingsDlg = document.getElementById("settingsDialog"), settingsFoot = settingsDlg && settingsDlg.querySelector(".settings-footer");
  if (settingsFoot) {
    const lab = mk("label", "setting-row"); lab.htmlFor = "fullTaskComment";
    const info = mk("span"); info.append(mk("strong", "", "Full task comment in lesson files"), mk("small", "", "Adds the whole question as a comment at the top of the lesson file."));
    const cb = mk("input"); cb.type = "checkbox"; cb.id = "fullTaskComment"; cb.checked = !!settings.fullComment;
    cb.onchange = () => { settings.fullComment = cb.checked; saveSettings(); try { refreshHeaders(); } catch (_) {} };
    lab.append(info, cb); settingsFoot.before(lab);
  }

  // ---- activity bar button ----
  const btn = mk("button", "activity-button", "🎓");
  btn.type = "button"; btn.id = "coursesBtn"; btn.title = "Python Courses"; btn.setAttribute("aria-label", "Python Courses");
  document.getElementById("extensionsBtn").after(btn);
  btn.onclick = () => { renderNav(); if (!current) showLesson(COURSES[0], 0); else renderLesson(); dlg.showModal(); };
})();
