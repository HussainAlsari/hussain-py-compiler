# Hussain Compiler

Hussain Compiler is a browser-based Python IDE powered by [Pyodide](https://pyodide.org/) and WebAssembly. It lets you write, run, and test Python code directly in the browser with a VS Code-inspired interface.
## Link
https://hussainalsari.github.io/hussain-py-compiler/
## picture

<img width="1920" height="918" alt="Hussain Compiler screenshot" src="https://github.com/user-attachments/assets/a3ce49aa-770d-4d7d-b517-25f5f380f8cb" />

## Features

- Python editor with syntax highlighting, line numbers, automatic bracket and quote closing, undo/redo, find/replace, and go to line.
- Settings for toggling automatic closing and adjusting editor font size, saved in the browser.
- Python errors point to their source line in the editor when the traceback includes a matching file and line.
- File, Edit, Selection, View, Settings, Run, Terminal, and Help menus, plus common keyboard shortcuts.
- Run Python programs in a Web Worker. `input()` requests appear directly in the terminal; type there and press Enter.
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
## Search keywords

- Hussain Compiler 
- Hussain python compiler
- github Python Hussain
- Hussain Browser Compiler
- WebAssembly Python editor by Hussain
- Python editor made by Hussian

