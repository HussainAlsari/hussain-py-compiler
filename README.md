# Hussain Compiler

Hussain Compiler is a browser-based Python IDE powered by [Pyodide](https://pyodide.org/) and WebAssembly. It lets you write, run, and test Python code directly in the browser with a VS Code-inspired interface.
## Link
https://hussaincompiler.com/
## picture

<img width="1920" height="918" alt="Hussain Compiler screenshot" src="https://github.com/user-attachments/assets/a3ce49aa-770d-4d7d-b517-25f5f380f8cb" />

## Features

- Python editor with syntax highlighting, line numbers, automatic bracket and quote closing, undo/redo, find/replace, and go to line.
- Settings for toggling automatic closing and adjusting editor font size, saved in the browser.
- Python errors point to their source line in the editor when the traceback includes a matching file and line.
- File, Edit, Selection, View, Settings, Run, Terminal, and Help menus, plus common keyboard shortcuts.
- Run Python programs in a Web Worker. `input()` requests appear directly in the terminal; type there and press Enter.
- Warn about likely endless `while` loops and stop code that runs continuously for 10 seconds; time spent waiting for `input()` is excluded.
- Start the Python runtime in the background as you begin typing, with status updates while Python and imported packages load.
- Multiple workspace files, file import, local browser storage, and file download.
- Export the active Python input and terminal output together as a styled PNG image.
- Install packages with `micropip` and load packages supported by Pyodide when imported.
- Responsive VS Code-inspired dark interface.

## Run locally

Python execution needs an internet connection the first time so the browser can download CodeMirror and the Pyodide runtime. In this folder, start a local web server:

```bash
python -m http.server 8000
```

Open <http://localhost:8000> in a modern browser. Opening `index.html` directly as a `file://` URL is not supported because the Python worker uses ES modules.

## Python and package support

This is Python running in WebAssembly, not a native system Python installation, and it does not produce executable binaries. The standard library and packages built for Pyodide are supported. `micropip` can install additional packages.

## Python Courses

Click the 🎓 button in the activity bar to open built-in courses: Python Basics, Data Structures and Functions, and Intermediate Python (15 lessons).
Each lesson explains a topic, loads starter code into the editor, and lets you press **Check** to compare your program's output with the expected result. Hints, solutions, and progress (saved in the browser) are included.
Lesson content lives in `courses.js`; add or edit lessons in the `COURSES` array.

## Languages

Open **Settings > Editor Settings…** and choose:

- **Interface language**: translates the menus, buttons, messages and prompts (English and العربية are built in; Arabic switches the text direction automatically).
- **Course language**: the language of the lessons. It can differ from the interface language.
- **Any other language**: click **Export template**, translate the values in the JSON file (keep the keys, `{placeholders}`, and code inside `<pre>`/`<code>`), set `code` (for example `fr`), `name` and `dir`, then **Import pack**. Imported packs are stored in this browser. To ship a pack with the site, save it as `lang/<code>.js` using `HC.register({...})` like `lang/ar.js` and add its `<script>` tag to `index.html`.

Each lesson also has an **In simple words** analogy, a **Line by line** walkthrough of the example, **Common mistakes**, and a **Try the example** button.

## Task panel

Inside a lesson file, the **Task** button in the lesson bar shows or hides a panel with the question (in the course language), the expected output, and a requirements list that ticks itself as your code satisfies each one. When **Check** fails, the panel shows your output next to the expected output with the differing lines highlighted. Lesson files only get a short two-line comment; enable **Full task comment in lesson files** in Editor Settings to put the whole question in the file instead.
