const vscode = require("vscode");

class CountDecorationProvider {
  constructor() {

    this._onDidChangeDecorations = new vscode.EventEmitter();
    this.onDidChangeFileDecorations = this._onDidChangeDecorations.event;

    this.handleChange();

    this.fileList = [];

    this.disposables = [];
    this.disposables.push(vscode.window.registerFileDecorationProvider(this));
  }

  handleChange() {
    vscode.workspace.onDidSaveTextDocument(() => {
      this._onDidChangeDecorations.fire();
    })
  }

  reset() {
    this.fileList = [];
  }

  setUri(uri) {
    this.fileList.push(uri);
  }

  provideFileDecoration(uri) {

    if (!this.fileList.some(a => a.path === uri.path)) {
      return;
    }

    return {
      badge: "NC",
      tooltip: "notCommittable",
      propagate: true,
      color: vscode.ThemeColor("charts.purple")
    };
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}

module.exports = { CountDecorationProvider };
