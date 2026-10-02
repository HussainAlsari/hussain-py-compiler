import { loadPyodide } from "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/pyodide.mjs";

emit("progress", { text: "Starting the Python WebAssembly runtime…" });
const runtime = loadPyodide({
  indexURL: "https://cdn.jsdelivr.net/pyodide/v314.0.7/full/",
});
const pendingInputs = new Map();
let nextInputRequestId = 0;

function emit(type, payload = {}) {
  self.postMessage({ type, ...payload });
}

function safeRelativePath(value) {
  return String(value || "")
    .replaceAll("\\", "/")
    .split("/")
    .filter((part) => part && part !== "." && part !== "..")
    .join("/");
}

async function getRuntime() {
  const pyodide = await runtime;
  pyodide.setStdout({ batched: (text) => emit("output", { text }) });
  pyodide.setStderr({ batched: (text) => emit("output", { text, error: true }) });
  pyodide.globals.set("__hussain_request_input", (prompt) => requestInput(prompt));
  pyodide.runPython(`
async def __hussain_input(prompt=None):
    value = await __hussain_request_input("" if prompt is None else str(prompt))
    return str(value)
`);
  return pyodide;
}

function requestInput(prompt) {
  const requestId = ++nextInputRequestId;
  emit("input-request", { requestId, prompt: String(prompt ?? "") });
  return new Promise((resolve) => pendingInputs.set(requestId, resolve));
}

function resolveInput(requestId, value) {
  const resolve = pendingInputs.get(requestId);
  if (!resolve) return;
  pendingInputs.delete(requestId);
  resolve(String(value ?? ""));
}

const INPUT_TRANSFORMER = `
import ast

class _HussainInputAnalysis(ast.NodeVisitor):
    def __init__(self):
        self.uses_input = False
        self.calls = set()

    def visit_FunctionDef(self, node):
        return

    visit_AsyncFunctionDef = visit_FunctionDef
    visit_Lambda = visit_FunctionDef
    visit_ClassDef = visit_FunctionDef

    def visit_Call(self, node):
        if isinstance(node.func, ast.Name):
            if node.func.id == "input":
                self.uses_input = True
            self.calls.add(node.func.id)
        self.generic_visit(node)

class _HussainInputRewriter(ast.NodeTransformer):
    def __init__(self, async_names):
        self.async_names = async_names
        self.explicit_await = 0

    def visit_Await(self, node):
        self.explicit_await += 1
        try:
            node.value = self.visit(node.value)
        finally:
            self.explicit_await -= 1
        return node

    def _visit_function(self, node):
        original = node
        node.decorator_list = [self.visit(item) for item in node.decorator_list]
        node.args = self.visit(node.args)
        if node.returns:
            node.returns = self.visit(node.returns)
        node.body = [self.visit(item) for item in node.body]
        if node.name in self.async_names and isinstance(node, ast.FunctionDef):
            node = ast.AsyncFunctionDef(
                name=node.name, args=node.args, body=node.body,
                decorator_list=node.decorator_list, returns=node.returns,
                type_comment=getattr(node, "type_comment", None),
                type_params=getattr(node, "type_params", []),
            )
            return ast.copy_location(node, original)
        return node

    def visit_FunctionDef(self, node):
        return self._visit_function(node)

    def visit_AsyncFunctionDef(self, node):
        return self._visit_function(node)

    def visit_Call(self, node):
        node = self.generic_visit(node)
        needs_await = False
        if isinstance(node.func, ast.Name) and node.func.id == "input":
            node.func = ast.copy_location(ast.Name(id="__hussain_input", ctx=ast.Load()), node.func)
            needs_await = True
        elif isinstance(node.func, ast.Name) and node.func.id in self.async_names:
            needs_await = True
        if needs_await and not self.explicit_await:
            return ast.copy_location(ast.Await(value=node), node)
        return node

async def __hussain_run(source, filename):
    tree = ast.parse(source, filename=filename)
    functions = []
    class _FunctionCollector(ast.NodeVisitor):
        def visit_FunctionDef(self, node):
            functions.append(node)
            self.generic_visit(node)
        visit_AsyncFunctionDef = visit_FunctionDef
    _FunctionCollector().visit(tree)
    analyses = {}
    for function in functions:
        analysis = _HussainInputAnalysis()
        for statement in function.body:
            analysis.visit(statement)
        analyses.setdefault(function.name, []).append(analysis)
    async_names = {name for name, items in analyses.items() if any(item.uses_input for item in items)}
    changed = True
    while changed:
        changed = False
        for name, items in analyses.items():
            if name not in async_names and any(item.calls & async_names for item in items):
                async_names.add(name)
                changed = True
    tree = _HussainInputRewriter(async_names).visit(tree)
    ast.fix_missing_locations(tree)
    compiled = compile(tree, filename, "exec", flags=ast.PyCF_ALLOW_TOP_LEVEL_AWAIT)
    result = eval(compiled, globals())
    if result is not None:
        await result
    return None
`;

async function syncFiles(pyodide, files) {
  const root = "/home/pyodide/hussain_workspace";
  pyodide.FS.mkdirTree(root);
  for (const [name, content] of Object.entries(files || {})) {
    const relative = safeRelativePath(name);
    if (!relative) continue;
    const fullPath = `${root}/${relative}`;
    const parent = fullPath.slice(0, fullPath.lastIndexOf("/"));
    pyodide.FS.mkdirTree(parent);
    pyodide.FS.writeFile(fullPath, content, { encoding: "utf8" });
  }
  pyodide.runPython(`
import os, sys
_hussain_root = ${JSON.stringify(root)}
if _hussain_root not in sys.path:
    sys.path.insert(0, _hussain_root)
os.chdir(_hussain_root)
`);
  return root;
}

async function handle(message) {
  const pyodide = await getRuntime();
  if (message.type === "run") {
    const root = await syncFiles(pyodide, message.files);
    const filename = safeRelativePath(message.filename) || "main.py";
    pyodide.globals.set("__name__", "__main__");
    pyodide.globals.set("__file__", `${root}/${filename}`);
    await pyodide.loadPackagesFromImports(message.code, {
      messageCallback: (text) => emit("progress", { text: String(text) }),
    });
    pyodide.globals.set("__hussain_source", message.code);
    pyodide.globals.set("__hussain_filename", `${root}/${filename}`);
    pyodide.runPython(INPUT_TRANSFORMER);
    const result = await pyodide.runPythonAsync("await __hussain_run(__hussain_source, __hussain_filename)");
    pyodide.globals.delete("__hussain_source");
    pyodide.globals.delete("__hussain_filename");
    if (result !== undefined && result !== null) {
      try {
        const rendered = result.toString();
        if (rendered && rendered !== "None") emit("output", { text: rendered });
      } finally {
        result.destroy?.();
      }
    }
    emit("done", { id: message.id, operation: "run", ok: true });
  } else if (message.type === "install") {
    await pyodide.loadPackage("micropip");
    const micropip = pyodide.pyimport("micropip");
    try {
      await micropip.install(message.package);
    } finally {
      micropip.destroy();
    }
    emit("installed", { id: message.id, package: message.package });
    emit("done", { id: message.id, operation: "install", ok: true });
  }
}

function findSourceErrorLine(error, filename) {
  const target = safeRelativePath(filename);
  if (!target) return null;
  const details = String(error?.stack || error);
  const frames = [...details.matchAll(/File\s+["']([^"']+)["'],\s+line\s+(\d+)/g)];
  const matchingFrame = frames.reverse().find((match) => {
    const path = String(match[1]).replaceAll("\\", "/");
    return path === target || path.endsWith(`/${target}`);
  });
  if (matchingFrame) return Number(matchingFrame[2]);
  const syntaxError = [...details.matchAll(/\(([^,()]+), line (\d+)\)/g)].reverse().find((match) => {
    const path = String(match[1]).replaceAll("\\", "/");
    return path === target || path.endsWith(`/${target}`);
  });
  return syntaxError ? Number(syntaxError[2]) : null;
}

runtime.then(async (pyodide) => {
  const version = pyodide.runPython("import sys; sys.version.split()[0]");
  emit("ready", { version });
}).catch((error) => emit("init-error", { message: String(error) }));

self.addEventListener("message", async (event) => {
  const message = event.data || {};
  if (message.type === "input-response") {
    resolveInput(message.requestId, message.value);
    return;
  }
  try {
    await handle(message);
  } catch (error) {
    emit("error", {
      id: message.id,
      message: String(error?.stack || error),
      filename: message.type === "run" ? safeRelativePath(message.filename) : null,
      line: message.type === "run" ? findSourceErrorLine(error, message.filename) : null,
    });
    emit("done", { id: message.id, operation: message.type, ok: false });
  }
});
