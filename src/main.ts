import { app, BrowserWindow, ipcMain, globalShortcut } from "electron";
import * as path from "path";
import * as fs from "fs";
import { CreateSecretDTO, GetSecretDTO } from "./secret.dto";
import {
  RequestSchema,
  ResponseSchema,
  RevealSecretRequest,
  RevealSecretResponse
} from "./interfaces";
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
    fs.writeFileSync(this.appDataFilePath, JSON.stringify({ secrets: [] }));
  }

  public retrieveData(full?: boolean): ResponseSchema {
    this.checkDirectoryAndFiles();
    try {
      const data: RequestSchema = JSON.parse(
        fs.readFileSync(this.appDataFilePath).toString()
      );
      if (!full) {
        for (const secret of data.secrets) {
          delete secret.password;
        }
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
    this.checkFile();
  }

  private checkFile() {
    if (!fs.existsSync(this.appDataFilePath)) {
      this.initDataFile();
    } else {
      try {
        JSON.parse(fs.readFileSync(this.appDataFilePath).toString());
      } catch (e) {
        console.error(
          `File: ${this.appDataFilePath} is broken, try to fix it or delete it`
        );
      }
    }
  }

  public writeData(secret: CreateSecretDTO): ResponseSchema {
    this.encryptSecret(secret);
    this.checkDirectoryAndFiles();
    const json: RequestSchema = JSON.parse(
      fs.readFileSync(this.appDataFilePath).toString()
    );
    secret.id = json.secrets.length;
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

  private decryptSecret(secret: CreateSecretDTO, password: string) {
    const tmp = crypto.SHA256(password).toString(crypto.enc.Hex);
    if(tmp!==secret.password) {
      return null;
    }
    return crypto.AES.decrypt(secret.secret,tmp,).toString(crypto.enc.Utf8);
  }

  public revealSecret(
    secretRequest: RevealSecretRequest
  ): RevealSecretResponse {
    const data = this.retrieveData(true);
    const secret = data.secrets.find(secret => {
      if (secret.id === secretRequest.id) {
        return secret;
      }
    }) as CreateSecretDTO;
    const decrypted = this.decryptSecret(secret, secretRequest.password);
    if(!decrypted){
      return {id:secret.id,secret:null,correct:false}
    }
    return {id:secret.id,secret:decrypted,correct:true};
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

ipcMain.on("writeSecret", (event, secret: CreateSecretDTO) => {
  event.sender.send("receiveData", main.writeData(secret));
});

ipcMain.on("revealSecret", (event, secretRequest: RevealSecretRequest) => {
  event.sender.send("revealSecret", main.revealSecret(secretRequest));
});
