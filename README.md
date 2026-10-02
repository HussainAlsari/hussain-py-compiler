# Hussain Compiler

Hussain Compiler is a lightweight, browser-based Python IDE with a VS Code-inspired layout. It runs Python through [Pyodide](https://pyodide.org/) and WebAssembly; no backend server is required.

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

## Publish with GitHub Pages

1. Push the contents of this folder to the `main` branch of a GitHub repository.
2. In the repository, open **Settings → Pages** and select **GitHub Actions** as the build and deployment source.
3. The workflow in `.github/workflows/pages.yml` publishes the site after a push to `main`. You can also run it manually from the **Actions** tab.

The site uses relative asset and worker paths, so it works from both a repository subpath and a custom domain.

## Python and package support

This is Python running in WebAssembly, not a native system Python installation, and it does not produce executable binaries. The standard library and packages built for Pyodide are supported. `micropip` can install pure-Python packages and packages with wheels compatible with WebAssembly. Packages that require unsupported operating-system features or native extensions will not work. Files on your computer are not accessible automatically; import files into the workspace. Workspace files are saved in the current browser's local storage.
