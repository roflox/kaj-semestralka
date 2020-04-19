import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import * as path from "path";
import * as fs from "fs";
import { CreateSecretDTO, GetSecretDTO } from "./CreateSecretDTO";
import { QuerySchema, GetSchema } from "./Interfaces";
import * as crypto from "crypto-js";

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
    globalShortcut.register("f11", function() {
      mWindow.webContents.toggleDevTools();
    });
    globalShortcut.register("f5", function() {
      mWindow.reload();
    });
    mWindow.maximize();
  }

  public initDataDirectory() {
    fs.mkdirSync(this.appDataPath);
    this.initDataFile();
  }

  public initDataFile() {
    // fs.writeFileSync(this.appDataFilePath, "", "utf-8");
    fs.writeFileSync(this.appDataFilePath, JSON.stringify({ secrets: [] }));
  }

  public retrieveData(): GetSchema {
    this.checkDirectoryAndFile();
    try {
      const data: QuerySchema = JSON.parse(
        fs.readFileSync(this.appDataFilePath).toString()
      );
      for (const secret of data.secrets) {
        delete secret.password;
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  private checkDirectoryAndFile() {
    if (!fs.existsSync(this.appDataPath)) {
      this.initDataDirectory();
    } else if (!fs.existsSync(this.appDataFilePath)) {
      this.initDataFile();
    } else {
      try {
        JSON.parse(fs.readFileSync(this.appDataFilePath).toString());
      } catch (e) {
        this.initDataFile();
      }
    }
  }

  public writeData(secret: CreateSecretDTO): GetSchema {
    this.encryptSecret(secret);
    this.checkDirectoryAndFile();
    const json: QuerySchema = JSON.parse(
      fs.readFileSync(this.appDataFilePath).toString()
    );
    json.secrets.push(secret);
    fs.writeFileSync(this.appDataFilePath, JSON.stringify(json));
    for (const secret of json.secrets) {
      delete secret.password;
    }
    return json;
  }

  private encryptSecret(secret: CreateSecretDTO) {
    secret.password = crypto.SHA256(secret.password).toString(crypto.enc.Hex);
    secret.secret = crypto.AES.encrypt(
      secret.secret,
      secret.password
    ).toString();
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

ipcMain.on("requestData", (event, message) => {
  event.sender.send("receiveData", main.retrieveData());
});

ipcMain.on("writeSecret", (event, secret: CreateSecretDTO) => {
  event.sender.send("receiveData", main.writeData(secret));
});
