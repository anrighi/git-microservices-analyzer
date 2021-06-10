const vscode = require("vscode");

class CountDecorationProvider {
  constructor() {
    this.disposables = [];
    this.disposables.push(vscode.window.registerFileDecorationProvider(this));
  }

  provideFileDecoration(uri) {
    return {
      badge: "10",
      tooltip: "User count",
    };
  }

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  }
}

module.exports = { CountDecorationProvider };
