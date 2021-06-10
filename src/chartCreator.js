const fetch = require("node-fetch");
const vscode = require("vscode");

const getBarData = (commitList) => {
  const barChartData = [];

  const dirsFound = {};

  commitList.forEach((o, idx) => {
    folders = Object.entries(o.modifiedFiles);

    for (let fi = 0; fi < folders.length; fi++) {
      mf = folders[fi][0];

      if (dirsFound[mf]?.length > 0) {
        dirsFound[mf] = [...dirsFound[mf], idx];
      } else {
        dirsFound[mf] = [idx];
      }
    }
  });

  dirsKeys = Object.keys(dirsFound);

  for (key in dirsKeys) {
    if (dirsFound[dirsKeys[key]].length === 1) {
      delete dirsFound[dirsKeys[key]];
    }
  }

  dirsFoundKeys = Object.keys(dirsFound);

  dirsFoundKeys.forEach((dfk) => {
    df = dirsFound[dfk];
    barChartData.push({ directory: dfk, count: df.length });
  });

  barChartData.sort((a, b) => b.count - a.count);

  fetch("https://git-microservices-analyzer.ml/bar", {
    method: "post",
    body: JSON.stringify({ data: barChartData, keys: ["count"] }),
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      console.log(data);

      const graph = "Show graph";
      vscode.window
        .showInformationMessage("Occurrences in more than a commit", graph)
        .then((selection) => {
          if (selection === graph) {
            vscode.env.openExternal(vscode.Uri.parse(data.url));
          }
        });
    });

  return;
};

const getChordData = (commitList) => {
  let barChordData = {};

  commitList.forEach((oc) => {
    mfKeys = Object.keys(oc.modifiedFiles);

    mfKeys.forEach((k) => {
      barChordData[k] = {
        ...barChordData[k],
        ...oc.modifiedFiles,
      };
    });
  });

  const bcdKeys = Object.keys(barChordData).sort();

  bcdOutput = [];

  bcdKeys.forEach((bc) => {
    objToParse = barChordData[bc];
    parsedObject = {};

    bcdKeys.forEach((bc2) => {
      parsedObject[bc2] = objToParse[bc2] ?? 0;
    });

    parsedObject[bc] = 0;

    bcdOutput.push(Object.values(parsedObject));
  });

  fetch("https://git-microservices-analyzer.ml/chord", {
    method: "post",
    body: JSON.stringify({ data: bcdOutput, keys: bcdKeys }),
    headers: { "Content-Type": "application/json" },
  })
    .then((response) => response.json())
    .then((data) => {
      const graph = "Show graph";
      vscode.window
        .showInformationMessage("Modules' binding", graph)
        .then((selection) => {
          if (selection === graph) {
            vscode.env.openExternal(vscode.Uri.parse(data.url));
          }
        });
    });

  return;
};

module.exports = {
  getBarData,
  getChordData,
};
