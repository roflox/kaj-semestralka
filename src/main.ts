import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import * as path from "path";
import * as fs from "fs";
import { CreateSecretDTO } from "./secret.dto";
import { Mode, Profile, RequestSchema, ResponseSchema } from "./interfaces";
import * as crypto from "crypto-js";

let mWindow: Electron.BrowserWindow; //main window

class Main {
  private appDataPath = path.join(app.getPath("appData"), "Keychain");
  private appDataFilePath = path.join(
    app.getPath("appData"),
    "Keychain",
    "data.json"
  );
  private appProfileFilePath = path.join(
    app.getPath("appData"),
    "Keychain",
    "profile.json"
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

  public initProfileFile() {
    fs.writeFileSync(
      this.appProfileFilePath,
      JSON.stringify({ mode: Mode.light })
    );
  }

  public initDataFile() {
    fs.writeFileSync(this.appDataFilePath, JSON.stringify({ secrets: [] }));
  }

  public retrieveData(): ResponseSchema {
    this.checkDirectoryAndFiles();
    // this.saveProfile(null);
    try {
      const data: RequestSchema = JSON.parse(
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

  private checkDirectoryAndFiles() {
    if (!fs.existsSync(this.appDataPath)) {
      this.initDataDirectory();
    }
    this.checkFile("data");
    this.checkFile("profile");
  }

  private checkFile(which: string) {
    const file =
      which === "data" ? this.appDataFilePath : this.appProfileFilePath;
    if (!fs.existsSync(file)) {
      switch (which) {
        case "data":
          this.initDataFile();
          break;
        case "profile":
          this.initProfileFile();
          break;
        default:
          console.error(`wtf?`);
      }
    } else {
      try {
        JSON.parse(fs.readFileSync(file).toString());
      } catch (e) {
        console.error(`File: ${file} is broken, try to fix it or delete it`);
      }
    }
  }

  public writeData(secret: CreateSecretDTO): ResponseSchema {
    this.encryptSecret(secret);
    this.checkDirectoryAndFiles();
    const json: RequestSchema = JSON.parse(
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

  public saveProfile(profile: Profile) {
    this.checkDirectoryAndFiles();
    const tmpProfile: Profile = JSON.parse(
      fs.readFileSync(this.appProfileFilePath).toString()
    );
    if (profile && tmpProfile) {
      for (const key of Object.keys(profile)) {
        // @ts-ignore
        tmpProfile[key] = profile[key];
      }
    }
    fs.writeFileSync(this.appProfileFilePath, JSON.stringify(tmpProfile));
  }

  public retrieveProfile(): ResponseSchema {
    this.checkDirectoryAndFiles();
    try {
      return JSON.parse(fs.readFileSync(this.appProfileFilePath).toString());
    } catch (e) {
      return null;
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

ipcMain.on("requestData", event => {
  event.sender.send("receiveData", main.retrieveData());
});

ipcMain.on("theme", (event, profile: Profile) => {
  main.saveProfile(profile);
});

ipcMain.on("requestProfile", event => {
  event.sender.send("receiveProfile", { profile: main.retrieveProfile() });
});

ipcMain.on("writeSecret", (event, secret: CreateSecretDTO) => {
  event.sender.send("receiveData", main.writeData(secret));
});
