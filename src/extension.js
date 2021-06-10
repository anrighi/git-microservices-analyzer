const vscode = require("vscode");
const util = require("util");
const exec = util.promisify(require("child_process").exec);
const moment = require("moment");

const chartCreator = require("./chartCreator.js");
const fileDecorator = require("./classes/CountDecorationProvider");

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
  console.log(
    'Congratulations, your extension "git-microservices-analyzer" is now active!'
  );

  const filePath = vscode.workspace.workspaceFolders[0].uri.fsPath;

  const LINES_TRESHOLD = 10;
  const MODULES_TRESHOLD = 2;

  async function execute(command, callback) {
    await exec(command, function (error, stdout) {
      callback(stdout);
    });
  }

  const getLogs = async function () {
    execute(
      `cd ${filePath} && git log --pretty=format:"%H%n%an - %ae%n%at"`,
      function (log) {
        this.log = log.split("\n");
      }
    );
  };

  const getDiffTree = async function (c, author, date) {
    execute(
      `cd ${filePath} && git diff-tree --numstat ${c}`,
      function (origCommit) {
        let commit,
          modifiedFiles,
          commitLine,
          matches,
          editedLines,
          authorParsing;

        commit = origCommit.split("\n");

        if (!commit) {
          return;
        }

        modifiedFiles = {};

        for (let i = 1; i < commit.length; i++) {
          matches = [];

          commitLine = commit[i];
          matches = commitLine.match(/(\d+)\s+(\d+)\s+([\w\-]+)\//);

          if (matches && matches.length > 0) {
            editedLines =
              Number.parseInt(matches[1]) + Number.parseInt(matches[2]);

            if (editedLines > LINES_TRESHOLD) {
              modifiedFiles = {
                ...modifiedFiles,
                [matches[3]]:
                  Number.parseInt(matches[1]) + Number.parseInt(matches[2]),
              };
            }
          }
        }

        authorParsing = author.split(" - ");

        if (
          commit[0].length > 0 &&
          modifiedFiles &&
          Object.keys(modifiedFiles).length >= MODULES_TRESHOLD
        ) {
          this.output.push({
            commitName: commit[0],
            author: { name: authorParsing[0], email: authorParsing[1] },
            date: moment(new Date(date * 1000)).format("DD/MM/YYYY HH:mm:ss"),
            modifiedFiles,
          });
        }
      }
    );
  };

  let dataAnalysis = vscode.commands.registerCommand(
    "git-microservices-analyzer.analyze",
    async () => {
      let c;
      this.output = [];

      vscode.window.showInformationMessage("Analysis started");

      getLogs();

      for (let j = 0; j < this.log.length; j = j + 3) {
        c = this.log[j];
        getDiffTree(c, this.log[j + 1], this.log[j + 2]);
      }

      setTimeout(() => {
        chartCreator.getBarData(this.output);
        chartCreator.getChordData(this.output);
      }, 15000);

      return true;
    }
  );

  context.subscriptions.push(dataAnalysis);

  let provider = new fileDecorator.CountDecorationProvider();
  context.subscriptions.push(provider);

  const fileColorEngine = () => {
    const gitExtension = vscode.extensions.getExtension("vscode.git").exports;
    const git = gitExtension.getAPI(1);

    const repo = git.repositories[0];
    const changes = repo.state.workingTreeChanges;

    const repoUri = repo.rootUri.path;

    const modules = {};

    let path, moduleName;

    changes.forEach((c) => {
      path = c.uri.path;
      moduleName = path.replace(repoUri, "").split("/")[1];

      if (!modules[moduleName]) {
        modules[moduleName] = [];
      }

      modules[moduleName] = [c.uri, ...modules[moduleName]];
    });

    const editedModules = Object.keys(modules);

    if (editedModules.length <= 1) {
      return true;
    }

    provider.reset();

    const maxValue = editedModules.map(em => { return { name: em, length: modules[em].length } })

    maxValue.sort((a, b) => b.length - a.length)

    delete editedModules[editedModules.indexOf(maxValue[0].name)];

    editedModules.forEach((em) => {
      modules[em].forEach((filePath) => {
        provider.setUri(filePath);
      });
    });
  }

  vscode.workspace.onDidSaveTextDocument(() => fileColorEngine());
}

// this method is called when your extension is deactivated
function deactivate() { }

module.exports = {
  activate,
  deactivate,
};
