const STORAGE_KEY = "hussain-compiler-workspace-v1";
const SETTINGS_KEY = "hussain-compiler-settings-v1";
const DEFAULT_SETTINGS = { autoCloseBrackets: true, fontSize: 13 };
const SAMPLE = `# Welcome to Hussain Compiler\n# Write Python here, then click Run Python\n\ndef greet(name):\n    return f"Hello, {name}!"\n\nprint(greet("Python"))\n`;
const PACKAGE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*(?:\[[A-Za-z0-9_,.-]+\])?(?:(?:===|==|~=|!=|<=|>=|<|>)\s*[A-Za-z0-9.*+_-]+(?:,(?:===|==|~=|!=|<=|>=|<|>)\s*[A-Za-z0-9.*+_-]+)*)?$/;

const elements = Object.fromEntries([
  "fileList", "newFileBtn", "openFilesBtn", "filePicker", "saveBtn", "downloadBtn",
  "runBtn", "stopBtn", "deleteFileBtn", "activeFileName", "dirtyMark", "saveState",
  "runtimeStatus", "statusDot", "pythonVersion", "cursorPosition", "console", "runState",
  "clearOutputBtn", "downloadOutputImageBtn", "packageForm", "packageName", "installBtn", "toast", "workspace",
  "mainPanel", "explorerBtn", "searchBtn", "runActivityBtn", "extensionsBtn", "aboutBtn",
  "rootNewFileBtn", "rootOpenFilesBtn", "windowTitle", "breadcrumbFileName", "toggleWordWrapItem",
  "settingsDialog", "settingsCloseBtn", "settingsDoneBtn", "autoCloseBracketsSetting", "fontSizeSetting", "fontSizeValue",
].map((id) => [id, document.getElementById(id)]));

let savedActiveFile = null;
let files = readWorkspace();
let activeFile = savedActiveFile && Object.hasOwn(files, savedActiveFile)
  ? savedActiveFile
  : Object.keys(files)[0];
let editor;
let worker = null;
let runtimePromise = null;
let rejectRuntimePromise = null;
let busy = false;
let saveTimer = 0;
let toastTimer = 0;
let operationId = 0;
let pendingInputRequest = null;
let pendingInputEditor = null;
let settings = readSettings();
let errorLine = null;

function readSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "null");
    return {
      autoCloseBrackets: typeof saved?.autoCloseBrackets === "boolean" ? saved.autoCloseBrackets : DEFAULT_SETTINGS.autoCloseBrackets,
      fontSize: Number.isInteger(saved?.fontSize) ? Math.min(24, Math.max(10, saved.fontSize)) : DEFAULT_SETTINGS.fontSize,
    };
  } catch (_) {
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings() {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (_) {
    showToast("Preferences could not be saved in this browser.", true);
  }
}

function readWorkspace() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (saved && saved.files && Object.keys(saved.files).length) {
      savedActiveFile = saved.activeFile || null;
      return Object.assign(Object.create(null), saved.files);
    }
  } catch (_) { /* Start with the sample if storage is unavailable or invalid. */ }
  return Object.assign(Object.create(null), { "main.py": SAMPLE });
}

function saveWorkspace() {
  if (editor && activeFile) files[activeFile] = editor.getValue();
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ files, activeFile }));
    elements.saveState.textContent = "Saved locally";
    elements.dirtyMark.hidden = true;
    return true;
  } catch (error) {
    elements.saveState.textContent = "Save failed";
    showToast("Browser storage is full or unavailable.", true);
    return false;
  }
}

function scheduleSave() {
  elements.dirtyMark.hidden = false;
  elements.saveState.textContent = "Unsaved changes";
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveWorkspace, 300);
}

function showToast(message, isError = false) {
  elements.toast.textContent = message;
  elements.toast.classList.toggle("error", isError);
  elements.toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => elements.toast.classList.remove("show"), 2800);
}

function setRuntimeStatus(text, state = "idle") {
  elements.runtimeStatus.textContent = text;
  elements.statusDot.className = `status-dot${state === "ready" ? " ready" : state === "busy" ? " busy" : state === "error" ? " error" : ""}`;
}

function appendOutput(text, kind = "") {
  const line = document.createElement("div");
  line.className = `console-line${kind ? ` ${kind}` : ""}`;
  line.textContent = text;
  elements.console.append(line);
  elements.console.scrollTop = elements.console.scrollHeight;
}

async function downloadInputOutputImage() {
  const width = 1280;
  const scale = 1.5;
  const padding = 48;
  const contentWidth = width - padding * 2;
  const font = '15px Consolas, "Courier New", monospace';
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) {
    showToast("Could not create the PNG image.", true);
    return;
  }
  context.font = font;

  const wrapText = (text) => {
    const wrapped = [];
    for (const sourceLine of String(text).split("\n")) {
      if (!sourceLine) {
        wrapped.push("");
        continue;
      }
      let line = "";
      for (const character of sourceLine) {
        if (line && context.measureText(line + character).width > contentWidth) {
          wrapped.push(line);
          line = "";
        }
        line += character;
      }
      wrapped.push(line);
    }
    return wrapped;
  };

  const sections = [{ title: `INPUT · ${activeFile || "main.py"}`, color: "#75beff", lines: wrapText(editor?.getValue() || "") }, {
    title: "OUTPUT · TERMINAL",
    color: "#75beff",
    lines: [...elements.console.children].flatMap((node) => {
      const text = node.innerText ?? node.textContent ?? "";
      const isWelcome = node.classList.contains("welcome-line");
      const lineColor = node.classList.contains("error") ? "#f48771" :
        node.classList.contains("system") || isWelcome ? "#a0a0a0" : "#d4d4d4";
      return wrapText(text).map((line) => ({ text: line, color: lineColor }));
    }),
  }];

  const lineHeight = 23;
  const sectionGap = 27;
  const headerHeight = 122;
  const maxLines = 700;
  let rows = 0;
  for (const section of sections) {
    section.rendered = section.lines.map((line) => typeof line === "string"
      ? { text: line, color: "#d4d4d4" }
      : line);
    if (rows + section.rendered.length > maxLines) {
      const availableLines = Math.max(0, maxLines - rows - 1);
      section.rendered = availableLines ? section.rendered.slice(-availableLines) : [];
      if (rows < maxLines) section.rendered.unshift({ text: "… earlier lines omitted to keep the image size manageable …", color: "#858585" });
    }
    rows += section.rendered.length;
  }

  const height = Math.min(20000, headerHeight + sections.reduce((sum, section) => sum + sectionGap + (section.rendered.length + 1) * lineHeight, 0) + padding);
  canvas.width = width * scale;
  canvas.height = height * scale;
  context.scale(scale, scale);
  context.fillStyle = "#1e1e1e";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "#252526";
  context.fillRect(0, 0, width, 68);
  context.fillStyle = "#ffffff";
  context.font = '600 20px Arial, sans-serif';
  context.fillText("Hussain Compiler", padding, 39);
  context.fillStyle = "#aaaaaa";
  context.font = '14px Arial, sans-serif';
  context.fillText("Python input and output", padding, 57);
  context.fillStyle = "#858585";
  context.textAlign = "right";
  context.fillText(new Date().toLocaleString(), width - padding, 39);
  context.textAlign = "left";

  let y = headerHeight;
  context.font = font;
  for (const section of sections) {
    context.fillStyle = section.color;
    context.font = '600 14px Arial, sans-serif';
    context.fillText(section.title, padding, y);
    y += sectionGap;
    context.font = font;
    for (const line of section.rendered) {
      if (y > height - padding) break;
      context.fillStyle = line.color;
      context.fillText(line.text, padding, y);
      y += lineHeight;
    }
    y += lineHeight;
  }

  try {
    const blob = await new Promise((resolve, reject) => canvas.toBlob((image) => image ? resolve(image) : reject(new Error("PNG encoding failed")), "image/png"));
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const baseName = (activeFile || "main.py").split("/").pop().replace(/\.py$/i, "") || "python";
    link.href = url;
    link.download = `${baseName}-input-output.png`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    showToast("Input and output saved as a PNG image.");
  } catch (error) {
    showToast(`Could not download image: ${error.message}`, true);
  }
}

function safeFileName(name) {
  const normalized = String(name || "").trim().replaceAll("\\", "/");
  const parts = normalized.split("/").filter((part) => part && part !== ".");
  if (!parts.length || parts.some((part) => part === "..") || normalized.startsWith("/")) return "";
  return parts.join("/");
}

function renderFiles() {
  elements.fileList.replaceChildren();
  Object.keys(files).sort((a, b) => a.localeCompare(b)).forEach((name) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `file-row${name === activeFile ? " active" : ""}`;
    row.title = name;
    const type = document.createElement("span");
    type.className = "file-type";
    type.textContent = name.toLowerCase().endsWith(".py") ? "Py" : "·";
    const label = document.createElement("span");
    label.className = "file-name";
    label.textContent = name;
    row.append(type, label);
    row.addEventListener("click", () => openWorkspaceFile(name));
    elements.fileList.append(row);
  });
}

function openWorkspaceFile(name) {
  if (!Object.hasOwn(files, name)) return;
  if (activeFile && editor) files[activeFile] = editor.getValue();
  activeFile = name;
  clearErrorLocation();
  editor.setValue(files[name]);
  elements.dirtyMark.hidden = true;
  elements.saveState.textContent = "Saved locally";
  updateFileTitle();
  renderFiles();
  saveWorkspace();
}

function createFile() {
  const proposed = prompt("File name (for example: main.py):", "new_file.py");
  if (proposed === null) return;
  let name = safeFileName(proposed);
  if (!name) {
    showToast("Enter a valid relative file name inside the workspace.", true);
    return;
  }
  if (!name.includes(".")) name += ".py";
  if (Object.hasOwn(files, name)) {
    showToast("A file with this name already exists.", true);
    return;
  }
  files[name] = "";
  openWorkspaceFile(name);
  editor.focus();
}

function importFiles(fileList) {
  const selected = Array.from(fileList || []);
  if (!selected.length) return;
  let remaining = selected.length;
  let imported = 0;
  let firstImported = null;
  let failed = false;
  const completeOne = () => {
    remaining -= 1;
    if (remaining !== 0) return;
    renderFiles();
    saveWorkspace();
    if (firstImported) openWorkspaceFile(firstImported);
    showToast(failed ? `Imported ${imported} of ${selected.length} files.` : `Imported ${imported} file(s) into the browser workspace.`, failed);
  };
  for (const file of selected) {
    const name = safeFileName(file.webkitRelativePath || file.name);
    if (!name) {
      failed = true;
      completeOne();
      continue;
    }
    const reader = new FileReader();
    reader.onload = () => {
      files[name] = String(reader.result ?? "");
      imported += 1;
      if (!firstImported) firstImported = name;
      completeOne();
    };
    reader.onerror = () => {
      failed = true;
      completeOne();
    };
    reader.readAsText(file);
  }
}

function downloadCurrentFile() {
  if (!activeFile) return;
  const blob = new Blob([editor.getValue()], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = activeFile.split("/").pop();
  link.click();
  URL.revokeObjectURL(url);
}

function deleteCurrentFile() {
  if (Object.keys(files).length < 2) {
    showToast("The workspace must contain at least one file.", true);
    return;
  }
  const name = activeFile;
  if (!confirm(`Delete ${name} from the workspace?`)) return;
  delete files[name];
  activeFile = Object.keys(files)[0];
  openWorkspaceFile(activeFile);
  renderFiles();
}

function ensureRuntime() {
  if (runtimePromise) return runtimePromise;
  setRuntimeStatus("Loading Python WebAssembly…", "busy");
  if (!busy) elements.runState.textContent = "Loading Python…";
  appendOutput("Preparing Python in the background. The first launch downloads the runtime; your browser can reuse cached files later.", "system");
  runtimePromise = new Promise((resolve, reject) => {
    rejectRuntimePromise = reject;
    worker = new Worker("./py-worker.js", { type: "module" });
    worker.addEventListener("message", (event) => {
      const message = event.data || {};
      if (message.type === "ready") {
        elements.pythonVersion.textContent = message.version;
        const statusRuntime = document.getElementById("statusRuntime");
        if (statusRuntime) statusRuntime.textContent = `Python ${message.version} · WASM`;
        setRuntimeStatus(`Python ${message.version} ready`, "ready");
        if (!busy) elements.runState.textContent = "Python ready";
        resolve(worker);
        rejectRuntimePromise = null;
      } else if (message.type === "init-error") {
        setRuntimeStatus("Could not load Python", "error");
        if (!busy) elements.runState.textContent = "Could not load Python";
        rejectRuntimePromise?.(new Error(message.message));
        rejectRuntimePromise = null;
        runtimePromise = null;
        worker?.terminate();
        worker = null;
        appendOutput(message.message, "error");
      } else if (message.type === "output") {
        appendOutput(message.text, message.error ? "error" : "");
      } else if (message.type === "progress") {
        elements.runState.textContent = message.text;
        setRuntimeStatus("Preparing Python…", "busy");
      } else if (message.type === "installed") {
        appendOutput(`${message.package} installed for this browser session.`, "system");
      } else if (message.type === "input-request") {
        beginTerminalInput(message);
      } else if (message.type === "error") {
        appendOutput(message.message, "error");
        showErrorLocation(message.line, message.filename);
        setRuntimeStatus("Execution error", "error");
      } else if (message.type === "done") {
        pendingInputRequest = null;
        if (pendingInputEditor) pendingInputEditor.contentEditable = "false";
        pendingInputEditor = null;
        elements.clearOutputBtn.disabled = false;
        busy = false;
        elements.runBtn.disabled = false;
        elements.installBtn.disabled = false;
        elements.stopBtn.disabled = true;
        elements.runState.textContent = message.operation === "install"
          ? (message.ok ? "Installation complete" : "Installation failed")
          : (message.ok ? "Finished" : "Finished with errors");
        if (message.ok && message.id === operationId) setRuntimeStatus(`Python ${elements.pythonVersion.textContent} ready`, "ready");
      }
    });
    worker.addEventListener("error", (event) => {
      setRuntimeStatus("Could not load runtime", "error");
      if (!busy) elements.runState.textContent = "Could not load Python";
      rejectRuntimePromise?.(event.error || new Error(event.message));
      runtimePromise = null;
      worker?.terminate();
      worker = null;
      appendOutput(event.message || "Python worker error.", "error");
      finishOperation();
    });
  });
  return runtimePromise;
}

function finishOperation() {
  pendingInputRequest = null;
  if (pendingInputEditor) pendingInputEditor.contentEditable = "false";
  pendingInputEditor = null;
  elements.clearOutputBtn.disabled = false;
  busy = false;
  elements.runBtn.disabled = false;
  elements.installBtn.disabled = false;
  elements.stopBtn.disabled = true;
}

function clearErrorLocation() {
  if (!editor || errorLine === null) return;
  editor.setGutterMarker(errorLine, "hussain-error-gutter", null);
  editor.removeLineClass(errorLine, "background", "hussain-error-line");
  errorLine = null;
}

function showErrorLocation(lineNumber, filename) {
  if (!editor || !Number.isInteger(lineNumber) || lineNumber < 1 || filename !== activeFile) return;
  clearErrorLocation();
  const line = Math.min(lineNumber - 1, editor.lineCount() - 1);
  const marker = document.createElement("span");
  marker.className = "error-gutter-marker";
  marker.textContent = "➜";
  marker.title = `Error on line ${line + 1}`;
  marker.setAttribute("aria-label", `Error on line ${line + 1}`);
  editor.setGutterMarker(line, "hussain-error-gutter", marker);
  editor.addLineClass(line, "background", "hussain-error-line");
  errorLine = line;
  editor.scrollIntoView({ line, ch: 0 }, 80);
}

async function runCode() {
  if (busy || !editor) return;
  clearErrorLocation();
  saveWorkspace();
  const filename = activeFile;
  const code = editor.getValue();
  const workspaceFiles = Object.assign({}, files, { [filename]: code });
  busy = true;
  operationId += 1;
  elements.runBtn.disabled = true;
  elements.installBtn.disabled = true;
  elements.stopBtn.disabled = false;
  elements.runState.textContent = "Running…";
  appendOutput(`▶ ${activeFile}`, "system");
  try {
    const activeWorker = await ensureRuntime();
    if (!busy || activeWorker !== worker) return;
    setRuntimeStatus("Running program…", "busy");
    activeWorker.postMessage({
      type: "run", id: operationId, files: workspaceFiles, filename, code,
    });
  } catch (error) {
    appendOutput(String(error?.message || error), "error");
    elements.runState.textContent = "Could not run";
    finishOperation();
  }
}

async function installPackage(event) {
  event.preventDefault();
  if (busy) return;
  const packageName = elements.packageName.value.trim();
  if (!PACKAGE_PATTERN.test(packageName)) {
    showToast("Enter a package name such as requests or package==1.2.3.", true);
    return;
  }
  busy = true;
  operationId += 1;
  elements.runBtn.disabled = true;
  elements.installBtn.disabled = true;
  elements.stopBtn.disabled = false;
  elements.runState.textContent = `Installing ${packageName}…`;
  appendOutput(`＋ Installing ${packageName}`, "system");
  try {
    const activeWorker = await ensureRuntime();
    if (!busy || activeWorker !== worker) return;
    setRuntimeStatus("Installing package…", "busy");
    activeWorker.postMessage({ type: "install", id: operationId, package: packageName });
    elements.packageName.value = "";
  } catch (error) {
    appendOutput(String(error?.message || error), "error");
    elements.runState.textContent = "Could not install";
    finishOperation();
  }
}

function stopExecution() {
  if (!busy) return;
  worker?.terminate();
  worker = null;
  runtimePromise = null;
  rejectRuntimePromise?.(new Error("Execution stopped."));
  rejectRuntimePromise = null;
  operationId += 1;
  if (pendingInputEditor) {
    pendingInputEditor.contentEditable = "false";
    pendingInputEditor.closest(".console-input-line")?.classList.add("cancelled");
  }
  pendingInputEditor = null;
  pendingInputRequest = null;
  elements.clearOutputBtn.disabled = false;
  appendOutput("Stopped. A fresh Python session will start the next time you run code.", "system");
  elements.runState.textContent = "Stopped";
  setRuntimeStatus("Python session reset", "idle");
  finishOperation();
}

function beginTerminalInput(message) {
  pendingInputRequest = message.requestId;
  elements.clearOutputBtn.disabled = true;
  const line = document.createElement("div");
  line.className = "console-line console-input-line";
  const prompt = document.createElement("span");
  prompt.className = "console-input-prompt";
  prompt.textContent = "› ";
  const label = document.createElement("span");
  label.className = "console-input-label";
  label.textContent = message.prompt || "Enter a value:";
  const value = document.createElement("span");
  value.className = "console-input-value";
  value.contentEditable = "true";
  value.setAttribute("role", "textbox");
  value.setAttribute("aria-label", "Type your input directly in the terminal, then press Enter");
  value.setAttribute("spellcheck", "false");
  line.append(prompt, label, value);
  elements.console.append(line);
  pendingInputEditor = value;
  elements.runState.textContent = "Type in the terminal and press Enter";
  elements.console.scrollTop = elements.console.scrollHeight;
  value.focus();
}

function submitTerminalInput(event) {
  if (event.key !== "Enter" || event.shiftKey || pendingInputRequest === null || !pendingInputEditor || !worker) return;
  event.preventDefault();
  const requestId = pendingInputRequest;
  const value = String(pendingInputEditor.innerText || "").replace(/\r/g, "").split("\n", 1)[0];
  pendingInputEditor.contentEditable = "false";
  worker.postMessage({ type: "input-response", requestId, value });
  pendingInputRequest = null;
  pendingInputEditor = null;
  elements.clearOutputBtn.disabled = false;
  elements.runState.textContent = "Running…";
}

function handleTerminalClick() {
  if (pendingInputEditor) pendingInputEditor.focus();
}

function updateFileTitle() {
  const name = activeFile || "main.py";
  const shortName = name.split("/").pop();
  elements.activeFileName.textContent = shortName;
  elements.activeFileName.title = name;
  elements.breadcrumbFileName.textContent = shortName;
  elements.breadcrumbFileName.title = name;
  elements.windowTitle.textContent = `${shortName} — Hussain Compiler`;
  document.title = `${shortName} — Hussain Compiler`;
}

function findInEditor() {
  const query = prompt("Find:", editor.getSelection());
  if (query === null || query === "") return;
  const source = editor.getValue();
  const cursorIndex = editor.indexFromPos(editor.getCursor());
  const index = source.indexOf(query, cursorIndex) >= 0
    ? source.indexOf(query, cursorIndex)
    : source.indexOf(query);
  if (index < 0) {
    showToast(`Could not find “${query}”.`);
    return;
  }
  editor.setSelection(editor.posFromIndex(index), editor.posFromIndex(index + query.length));
  editor.focus();
}

function replaceInEditor() {
  const query = prompt("Find:", editor.getSelection());
  if (query === null || query === "") return;
  const replacement = prompt("Replace with:", "");
  if (replacement === null) return;
  const source = editor.getValue();
  const matches = [];
  let from = 0;
  while ((from = source.indexOf(query, from)) !== -1) {
    matches.push(from);
    from += query.length;
  }
  if (!matches.length) {
    showToast(`Could not find “${query}”.`);
    return;
  }
  editor.operation(() => {
    matches.reverse().forEach((index) => {
      editor.replaceRange(replacement, editor.posFromIndex(index), editor.posFromIndex(index + query.length));
    });
  });
  showToast(`Replaced ${matches.length} occurrence(s).`);
  editor.focus();
}

function goToLine() {
  const requested = prompt(`Go to line (1–${editor.lineCount()}):`, String(editor.getCursor().line + 1));
  if (requested === null) return;
  const line = Number.parseInt(requested, 10);
  if (!Number.isInteger(line) || line < 1 || line > editor.lineCount()) {
    showToast(`Enter a line number between 1 and ${editor.lineCount()}.`, true);
    return;
  }
  editor.setCursor({ line: line - 1, ch: 0 });
  editor.focus();
  editor.scrollIntoView({ line: line - 1, ch: 0 }, 80);
}

function toggleExplorer() {
  elements.workspace.classList.toggle("sidebar-collapsed");
  elements.explorerBtn.classList.toggle("active", !elements.workspace.classList.contains("sidebar-collapsed"));
}

function togglePanel() {
  elements.mainPanel.classList.toggle("panel-hidden");
}

let wordWrapEnabled = false;
function toggleWordWrap() {
  wordWrapEnabled = !wordWrapEnabled;
  editor.setOption("lineWrapping", wordWrapEnabled);
  elements.toggleWordWrapItem.classList.toggle("checked", wordWrapEnabled);
  elements.toggleWordWrapItem.setAttribute("aria-pressed", String(wordWrapEnabled));
}

function applyEditorSettings() {
  if (!editor) return;
  editor.setOption("autoCloseBrackets", settings.autoCloseBrackets);
  editor.getWrapperElement().style.fontSize = `${settings.fontSize}px`;
  elements.fontSizeValue.value = `${settings.fontSize} px`;
  elements.fontSizeValue.textContent = `${settings.fontSize} px`;
  editor.refresh();
}

function openSettings() {
  if (!elements.settingsDialog.open) elements.settingsDialog.showModal();
}

function initSettings() {
  elements.autoCloseBracketsSetting.checked = settings.autoCloseBrackets;
  elements.fontSizeSetting.value = String(settings.fontSize);
  elements.fontSizeValue.value = `${settings.fontSize} px`;
  elements.fontSizeValue.textContent = `${settings.fontSize} px`;
  elements.autoCloseBracketsSetting.addEventListener("change", () => {
    settings.autoCloseBrackets = elements.autoCloseBracketsSetting.checked;
    applyEditorSettings();
    saveSettings();
  });
  elements.fontSizeSetting.addEventListener("input", () => {
    settings.fontSize = Number(elements.fontSizeSetting.value);
    applyEditorSettings();
  });
  elements.fontSizeSetting.addEventListener("change", saveSettings);
  const close = () => elements.settingsDialog.close();
  elements.settingsCloseBtn.addEventListener("click", close);
  elements.settingsDoneBtn.addEventListener("click", close);
  elements.settingsDialog.addEventListener("click", (event) => {
    if (event.target === elements.settingsDialog) close();
  });
}

function runCommand(command) {
  if (!editor && ["undo", "redo", "find", "replace", "select-all", "indent", "outdent", "go-to-line", "toggle-word-wrap"].includes(command)) {
    showToast("The code editor is unavailable.", true);
    return;
  }
  switch (command) {
    case "new-file": createFile(); break;
    case "open-files": elements.filePicker.click(); break;
    case "save": saveWorkspace(); showToast("Workspace saved in this browser."); break;
    case "download": downloadCurrentFile(); break;
    case "delete-file": deleteCurrentFile(); break;
    case "undo": editor.undo(); editor.focus(); break;
    case "redo": editor.redo(); editor.focus(); break;
    case "find": findInEditor(); break;
    case "replace": replaceInEditor(); break;
    case "select-all": editor.execCommand("selectAll"); editor.focus(); break;
    case "indent": editor.indentLine(editor.getCursor().line, "add"); editor.focus(); break;
    case "outdent": editor.indentLine(editor.getCursor().line, "subtract"); editor.focus(); break;
    case "go-to-line": goToLine(); break;
    case "toggle-sidebar": toggleExplorer(); break;
    case "toggle-panel": togglePanel(); break;
    case "toggle-word-wrap": toggleWordWrap(); break;
    case "settings": openSettings(); break;
    case "run": runCode(); break;
    case "stop": stopExecution(); break;
    case "focus-terminal":
      if (pendingInputEditor) pendingInputEditor.focus();
      else elements.console.focus();
      break;
    case "clear-terminal":
      if (!pendingInputRequest) elements.console.replaceChildren();
      break;
    case "python-docs": window.open("https://docs.python.org/3/", "_blank", "noopener,noreferrer"); break;
    case "about": showToast("Hussain Compiler — a browser-based Python IDE powered by Pyodide."); break;
    default: return;
  }
}

function closeMenus() {
  document.querySelectorAll(".menu-trigger[aria-expanded='true']").forEach((button) => button.setAttribute("aria-expanded", "false"));
  document.querySelectorAll(".menu-dropdown:not([hidden])").forEach((menu) => { menu.hidden = true; });
}

function initMenus() {
  const menuBar = document.getElementById("menuBar");
  menuBar.addEventListener("click", (event) => {
    const trigger = event.target.closest(".menu-trigger");
    if (trigger) {
      const dropdown = trigger.nextElementSibling;
      const open = trigger.getAttribute("aria-expanded") === "true";
      closeMenus();
      if (!open) {
        trigger.setAttribute("aria-expanded", "true");
        dropdown.hidden = false;
      }
      return;
    }
    const item = event.target.closest("[data-command]");
    if (item) {
      const command = item.dataset.command;
      closeMenus();
      runCommand(command);
    }
  });
  document.addEventListener("click", (event) => {
    if (!event.target.closest("#menuBar")) closeMenus();
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenus();
  });
}

function initShortcuts() {
  document.addEventListener("keydown", (event) => {
    const mod = event.ctrlKey || event.metaKey;
    const key = event.key.toLowerCase();
    let command = null;
    if (event.key === "F5" && event.shiftKey) command = "stop";
    else if (event.key === "F5") command = "run";
    else if (mod && event.key === "Enter") command = "run";
    else if (mod && key === "n") command = "new-file";
    else if (mod && key === "o") command = "open-files";
    else if (mod && key === "s" && event.shiftKey) command = "download";
    else if (mod && key === "s") command = "save";
    else if (mod && key === "f") command = "find";
    else if (mod && key === "h") command = "replace";
    else if (mod && key === "g") command = "go-to-line";
    else if (mod && key === "b") command = "toggle-sidebar";
    else if (mod && key === "j") command = "toggle-panel";
    else if (mod && event.key === "`") command = "focus-terminal";
    if (!command) return;
    event.preventDefault();
    event.stopPropagation();
    runCommand(command);
  }, true);
}

function updateCursor() {
  if (!editor) return;
  const cursor = editor.getCursor();
  elements.cursorPosition.textContent = `Ln ${cursor.line + 1}, Col ${cursor.ch + 1}`;
}

function initEditor() {
  if (!window.CodeMirror) {
    elements.runBtn.disabled = true;
    elements.installBtn.disabled = true;
    showToast("Could not load the code editor. Check your internet connection and reload the page.", true);
    return;
  }
  editor = CodeMirror.fromTextArea(document.getElementById("code"), {
    mode: "python",
    theme: "material-darker",
    lineNumbers: true,
    matchBrackets: true,
    autoCloseBrackets: settings.autoCloseBrackets,
    gutters: ["hussain-error-gutter", "CodeMirror-linenumbers"],
    indentUnit: 4,
    tabSize: 4,
    indentWithTabs: false,
    lineWrapping: false,
    autofocus: true,
    extraKeys: {
      "Ctrl-Enter": runCode,
      "Cmd-Enter": runCode,
      Tab(cm) {
        if (cm.somethingSelected()) cm.indentSelection("add");
        else cm.replaceSelection("    ", "end");
      },
    },
  });
  editor.setValue(files[activeFile] ?? SAMPLE);
  let runtimeWarmupStarted = false;
  editor.on("inputRead", () => {
    if (runtimeWarmupStarted || runtimePromise) return;
    runtimeWarmupStarted = true;
    window.setTimeout(() => { void ensureRuntime().catch(() => {}); }, 250);
  });
  editor.on("change", () => {
    clearErrorLocation();
    scheduleSave();
  });
  editor.on("cursorActivity", updateCursor);
  updateFileTitle();
  renderFiles();
  applyEditorSettings();
  updateCursor();
}

elements.newFileBtn.addEventListener("click", createFile);
elements.rootNewFileBtn.addEventListener("click", createFile);
elements.openFilesBtn.addEventListener("click", () => elements.filePicker.click());
elements.rootOpenFilesBtn.addEventListener("click", () => elements.filePicker.click());
elements.filePicker.addEventListener("change", (event) => {
  importFiles(event.target.files);
  event.target.value = "";
});
elements.saveBtn.addEventListener("click", () => {
  saveWorkspace();
  showToast("Workspace saved in this browser.");
});
elements.downloadBtn.addEventListener("click", downloadCurrentFile);
elements.runBtn.addEventListener("click", runCode);
elements.stopBtn.addEventListener("click", stopExecution);
elements.deleteFileBtn.addEventListener("click", deleteCurrentFile);
elements.clearOutputBtn.addEventListener("click", () => elements.console.replaceChildren());
elements.downloadOutputImageBtn.addEventListener("click", downloadInputOutputImage);
elements.packageForm.addEventListener("submit", installPackage);
elements.console.addEventListener("keydown", submitTerminalInput);
elements.console.addEventListener("click", handleTerminalClick);
elements.packageName.addEventListener("keydown", (event) => {
  if (event.key === "Enter") installPackage(event);
});
elements.explorerBtn.addEventListener("click", toggleExplorer);
elements.searchBtn.addEventListener("click", findInEditor);
elements.runActivityBtn.addEventListener("click", runCode);
elements.extensionsBtn.addEventListener("click", () => document.querySelector(".package-box").scrollIntoView({ block: "nearest" }));
elements.aboutBtn.addEventListener("click", () => showToast("Hussain Compiler — a browser-based Python IDE powered by Pyodide."));
window.addEventListener("beforeunload", saveWorkspace);
initMenus();
initShortcuts();
initSettings();
initEditor();


// Resizable workspace panels and terminal zoom controls.
(() => {
  const workspace = document.getElementById('workspace');
  const sidebar = document.getElementById('sidebar');
  const main = document.getElementById('mainPanel');
  const output = document.querySelector('.output-panel');
  const consolePanel = document.getElementById('console');
  if (!workspace || !sidebar || !main || !output || !consolePanel) return;
  const read = (key, fallback) => { try { const n=Number(localStorage.getItem(key)); return n>0&&Number.isFinite(n)?n:fallback; } catch (_) { return fallback; } };
  const save = (key, value) => { try { localStorage.setItem(key,String(Math.round(value))); } catch (_) {} };
  let sideWidth=Math.min(440,Math.max(180,read('hussain-explorer-width',244)));
  let terminalHeight=read('hussain-terminal-height',0);
  let fontSize=Math.min(24,Math.max(10,read('hussain-terminal-font-size',12)));
  const css=document.createElement('style');
  css.textContent=`.workspace{grid-template-columns:48px var(--explorer-width,244px) 7px minmax(0,1fr)!important}.sidebar{grid-column:2}.main-panel{grid-column:4;grid-template-rows:36px minmax(150px,1fr) 7px var(--terminal-height,27%)!important}.main-panel.panel-hidden{grid-template-rows:36px minmax(0,1fr) 0 0!important}.panel-splitter{position:relative;z-index:4;touch-action:none;user-select:none;background:#202020}.panel-splitter:hover,.panel-splitter:focus-visible{outline:0;background:#007acc}.explorer-splitter{grid-column:3;grid-row:1;cursor:col-resize;border-inline:1px solid #303031}.terminal-splitter{grid-row:3;cursor:row-resize;border-block:1px solid #303031}.main-panel.panel-hidden .terminal-splitter{display:none}.terminal-zoom{display:inline-flex;align-items:center;gap:3px}.terminal-zoom button{width:22px;height:22px;padding:0;border:1px solid #414141;border-radius:3px;background:#252526;color:#ddd;cursor:pointer;font:13px var(--mono)}.terminal-zoom button:hover{border-color:#007acc;color:#fff}.terminal-zoom button:disabled{opacity:.4}.terminal-zoom-value{min-width:34px;text-align:center;font:10px var(--mono)}@media(max-width:760px){.workspace{grid-template-columns:40px minmax(0,1fr)!important}.main-panel{grid-column:2}.explorer-splitter{display:none}}`;
  document.head.append(css);
  workspace.style.setProperty('--explorer-width',sideWidth+'px');
  if(terminalHeight)main.style.setProperty('--terminal-height',terminalHeight+'px');
  const makeSplitter=(className,label,orientation,parent,before)=>{const el=document.createElement('div');el.className='panel-splitter '+className;el.setAttribute('role','separator');el.setAttribute('aria-label',label);el.setAttribute('aria-orientation',orientation);el.tabIndex=0;parent.insertBefore(el,before);return el;};
  const sideSplit=makeSplitter('explorer-splitter','Resize Explorer panel','vertical',workspace,main);
  const termSplit=makeSplitter('terminal-splitter','Resize terminal panel','horizontal',main,output);
  const bind=(el,update,pointerValue,keyAxis)=>{el.addEventListener('pointerdown',e=>{if(e.button!==0)return;e.preventDefault();el.setPointerCapture(e.pointerId);const move=p=>update(pointerValue(p));const done=()=>{el.removeEventListener('pointermove',move);el.removeEventListener('pointerup',done);el.removeEventListener('pointercancel',done);};el.addEventListener('pointermove',move);el.addEventListener('pointerup',done,{once:true});el.addEventListener('pointercancel',done,{once:true});});el.addEventListener('keydown',e=>{const step=e.shiftKey?40:16;const key=keyAxis==='x'?(e.key==='ArrowRight'?step:e.key==='ArrowLeft'?-step:0):(e.key==='ArrowUp'?step:e.key==='ArrowDown'?-step:0);if(!key)return;e.preventDefault();update((keyAxis==='x'?sideWidth:terminalHeight)+key);});};
  bind(sideSplit,w=>{sideWidth=Math.min(440,Math.max(180,w));workspace.style.setProperty('--explorer-width',sideWidth+'px');sideSplit.setAttribute('aria-valuenow',String(Math.round(sideWidth)));save('hussain-explorer-width',sideWidth);},e=>e.clientX-workspace.getBoundingClientRect().left-48,'x');
  bind(termSplit,h=>{const max=Math.max(180,main.clientHeight-203);terminalHeight=Math.min(max,Math.max(120,h));main.style.setProperty('--terminal-height',terminalHeight+'px');termSplit.setAttribute('aria-valuenow',String(Math.round(terminalHeight)));save('hussain-terminal-height',terminalHeight);},e=>main.getBoundingClientRect().bottom-e.clientY,'y');
  const zoom=document.createElement('div');zoom.className='terminal-zoom';zoom.setAttribute('aria-label','Terminal font size');zoom.innerHTML='<button type="button" aria-label="Decrease terminal font size" title="Decrease terminal font size">−</button><span class="terminal-zoom-value" aria-live="polite"></span><button type="button" aria-label="Increase terminal font size" title="Increase terminal font size">+</button>';
  const outActions=document.querySelector('.output-actions');const label=zoom.querySelector('span');const buttons=zoom.querySelectorAll('button');
  const applyZoom=()=>{consolePanel.style.setProperty('font-size',fontSize+'px','important');label.textContent=fontSize+'px';buttons[0].disabled=fontSize<=10;buttons[1].disabled=fontSize>=24;};
  buttons[0].addEventListener('click',()=>{fontSize=Math.max(10,fontSize-1);save('hussain-terminal-font-size',fontSize);applyZoom();});
  buttons[1].addEventListener('click',()=>{fontSize=Math.min(24,fontSize+1);save('hussain-terminal-font-size',fontSize);applyZoom();});
  outActions?.prepend(zoom);applyZoom();
})();

// Keep one set of controls when page-level initialization runs before deferred scripts.
for (const selector of ['.explorer-splitter','.terminal-splitter','.terminal-zoom']) {
  document.querySelectorAll(selector).forEach((element,index)=>{ if(index>0) element.remove(); });
}


// Python autocomplete popup for the CodeMirror editor.
(() => {
  const wrapper = document.querySelector('.CodeMirror');
  const cm = wrapper?.CodeMirror;
  if (!cm || cm.__hussainAutocomplete) return;
  cm.__hussainAutocomplete = true;
  const words = 'and as assert async await break class continue def del elif else except False finally for from global if import in is lambda nonlocal not or pass raise return True try while with yield abs all any bool dict enumerate float input int isinstance len list map max min open print range set sorted str sum tuple type zip append capitalize clear copy count extend format get insert items join keys lower pop remove replace split strip upper values'.split(/\s+/);
  const menu = document.createElement('div');
  menu.className = 'hussain-completion-menu';
  menu.setAttribute('role','listbox');
  menu.setAttribute('aria-label','Python completion suggestions');
  menu.hidden = true;
  document.body.append(menu);
  let choices = []; let selected = 0; let start = null;
  const hide = () => { menu.hidden = true; menu.replaceChildren(); choices = []; start = null; };
  const accept = (index = selected) => {
    const choice = choices[index]; if (!choice || start === null) return;
    const cur = cm.getCursor(); cm.replaceRange(choice,{line:cur.line,ch:start},cur,'+autocomplete'); hide(); cm.focus();
  };
  const update = (force = false) => {
    const cur = cm.getCursor(); const before = cm.getLine(cur.line).slice(0,cur.ch); const match = before.match(/[A-Za-z_]\w*$/);
    if (!match || (!force && match[0].length < 1)) return hide();
    const token = cm.getTokenAt(cur); if (!force && /^(comment|string|string-2)$/.test(token.type || '')) return hide();
    const prefix = match[0]; const identifiers = cm.getValue().match(/\b[A-Za-z_]\w*\b/g) || [];
    choices = [...new Set([...words,...identifiers])].filter(w => w.toLowerCase().startsWith(prefix.toLowerCase()) && w !== prefix).sort((a,b) => Number(!a.startsWith(prefix))-Number(!b.startsWith(prefix)) || a.localeCompare(b)).slice(0,8);
    if (!choices.length) return hide(); start = cur.ch-prefix.length; selected = 0;
    menu.replaceChildren(...choices.map((word,index) => {
      const item=document.createElement('button'); item.type='button'; item.className='hussain-completion-option'; item.setAttribute('role','option'); item.setAttribute('aria-selected',String(index===selected)); item.textContent=word;
      item.addEventListener('mousedown',e=>e.preventDefault()); item.addEventListener('click',()=>accept(index)); return item;
    }));
    const caret=cm.cursorCoords(null,'page'); menu.style.left=Math.max(4,caret.left-window.scrollX)+'px'; menu.style.top=Math.max(4,caret.bottom-window.scrollY)+'px'; menu.hidden=false;
  };
  const move=delta=>{if(!choices.length)return false;selected=(selected+delta+choices.length)%choices.length;[...menu.children].forEach((item,index)=>item.setAttribute('aria-selected',String(index===selected)));return true;};
  cm.on('inputRead',()=>window.setTimeout(()=>update(),0)); cm.on('cursorActivity',hide);
  cm.addKeyMap({Down:()=>move(1),Up:()=>move(-1),Enter:()=>false,Tab:()=>{if(menu.hidden)return false;accept();return true;},Esc:()=>{if(menu.hidden)return false;hide();return true;},'Ctrl-Space':()=>{update(true);return true;},'Cmd-Space':()=>{update(true);return true;}});  const style=document.createElement('style'); style.textContent='.hussain-completion-menu{position:fixed;z-index:9999;width:min(280px,calc(100vw - 24px));max-height:220px;overflow:auto;padding:4px;border:1px solid #454545;border-radius:5px;background:#252526;box-shadow:0 8px 22px #0009}.hussain-completion-menu[hidden]{display:none}.hussain-completion-option{display:block;width:100%;padding:5px 9px;border:0;border-radius:3px;background:transparent;color:#d4d4d4;cursor:pointer;font:12px Consolas,monospace;text-align:left}.hussain-completion-option:hover,.hussain-completion-option[aria-selected=true]{outline:0;background:#094771;color:#fff}'; document.head.append(style);
})();
