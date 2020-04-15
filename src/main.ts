import { app, BrowserWindow, ipcMain, dialog } from "electron";
import * as path from "path";
import * as fs from "fs";
import { Secret } from "./Secret";

let mWindow: Electron.BrowserWindow; //main window

class Main {
  private appDataPath = path.join(app.getPath("appData"), "Keychain");
  private appDataFilePath = path.join(
    app.getPath("appData"),
    "Keychain",
    "data.json"
  );

  constructor() {}

  public createWindow() {
    mWindow = new BrowserWindow({
      webPreferences: {
        preload: path.join(__dirname, "preload.js"),
        nodeIntegration: true
      }
    });
    mWindow.loadFile(path.join(__dirname, "./index.html")); //loads index.html to user
    mWindow.setMenu(null);
    mWindow.on("closed", () => {
      mWindow = null;
    });
    mWindow.maximize();
  }

  public initDataDirectory() {
    fs.mkdirSync(this.appDataPath);
    this.initDataFile();
  }

  public initDataFile() {
    // fs.writeFileSync(this.appDataFilePath, "", "utf-8");
    fs.closeSync(fs.openSync(this.appDataFilePath, "w"));
  }

  public retrieveData(): Secret[] {
    if (!fs.existsSync(this.appDataPath)) {
      this.initDataDirectory();
      return [];
    } else if (!fs.existsSync(this.appDataFilePath)) {
      this.initDataFile();
      return [];
    } else {
      try {
        console.log(
          JSON.parse(fs.readFileSync(this.appDataFilePath).toString())
        );
      } catch (e) {
        console.log(
          "Your data file is corrupted, try to fix it manually or delete it."
        );
      }
      return [];
    }
  }
}

const main = new Main();

app.on("ready", main.createWindow);

app.on("window-all-closed", () => {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mWindow === null) {
    main.createWindow();
  }
});

ipcMain.on("test", (event, message) => {
  main.retrieveData();
});
