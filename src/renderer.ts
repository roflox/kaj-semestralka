import { ipcRenderer } from "electron";
import { CreateSecretDTO, GetSecretDTO } from "./CreateSecretDTO";
import { GetSchema } from "./Interfaces";
import * as path from "path";

class Renderer {
  private readonly secrets: HTMLElement = document.getElementById("secrets");
  private readonly secretInput: HTMLInputElement = document.getElementById(
    "secret-secret"
  ) as HTMLInputElement;
  private readonly secretName: HTMLInputElement = document.getElementById(
    "secret-name"
  ) as HTMLInputElement;
  private readonly secretPassword: HTMLInputElement = document.getElementById(
    "secret-password"
  ) as HTMLInputElement;
  private readonly secretPasswordAgain: HTMLInputElement = document.getElementById(
    "secret-password-ag"
  ) as HTMLInputElement;
  private readonly saveSecretButton: HTMLElement = document.getElementById(
    "save-secret"
  );
  private readonly userInfoBar: HTMLElement = document.getElementById(
    "user-info-bar"
  );
  private secretValues: GetSecretDTO[] = [];

  constructor() {
    this.requestData();
    ipcRenderer.on("receiveData", (event, data: GetSchema) => {
      this.secretValues = data.secrets;
      let i = 0;
      this.secrets.innerHTML = "";
      for (const secret of this.secretValues) {
        const li = document.createElement("li");
        const tooltip = document.createElement("span");
        const liDiv = document.createElement("div");
        const nameDiv = document.createElement("div");
        const secretDiv = document.createElement("div");
        const iconButtonDiv = document.createElement("div");
        const inputDiv = document.createElement("input");
        iconButtonDiv.classList.add("eye-light");
        inputDiv.type = "text";
        tooltip.textContent = "Display secret";
        iconButtonDiv.appendChild(tooltip);
        inputDiv.style.display = "none";
        nameDiv.innerText = secret.name;
        secretDiv.innerText = secret.secret;
        liDiv.appendChild(iconButtonDiv);
        liDiv.appendChild(nameDiv);
        liDiv.appendChild(secretDiv);
        liDiv.appendChild(inputDiv);
        liDiv.classList.add("row");
        li.appendChild(liDiv);
        li.id = `secret${i++}`;
        this.secrets.appendChild(li);
      }
    });
    this.createFormListeners();
  }

  private requestData() {
    ipcRenderer.send("requestData");
  }

  private createFormListeners() {
    this.secretPasswordAgain.addEventListener("blur", () => {
      this.checkPassword();
    });
    this.saveSecretButton.addEventListener("click", () => {
      if (this.checkForm()) {
        this.writeSecret(
          new CreateSecretDTO(
            this.secretName.value.trim(),
            this.secretInput.value,
            this.secretPassword.value
          )
        );
        // this.secretName.value = "";
        // this.secretPassword.value = "";
        // this.secretPasswordAgain.value = "";
        // this.secretInput.value = "";
      }
    });
  }

  private checkForm(): boolean {
    if (
      !this.secretInput.value.trim() ||
      !this.secretName.value.trim() ||
      !this.checkPassword()
    ) {
      return false;
    } else if (
      this.secretValues
        .map(secret => secret.name)
        .includes(this.secretName.value.trim())
    ) {
      this.displayMessage("Secret with this name already exists!",false);
      return false;
    } else {
      this.displayMessage("Secret successfully saved.",true);
      setTimeout(()=>{
        this.hideMessage()
      },2000);
      return true;
    }
  }

  private checkPassword(): boolean {
    if (this.secretPasswordAgain.value !== this.secretPassword.value) {
      this.displayMessage("Passwords must match!", false);
      return false;
    } else if (this.secretPassword.value.length < 8) {
      this.displayMessage("Password must be at least 8 characters!", false);
      return false;
    } else {
      this.hideMessage();
      return true;
    }
  }

  private displayMessage(message: string, succes: boolean) {
    this.userInfoBar.style.display = "block";
    this.userInfoBar.classList.add("alert");
    if (succes) {
      this.userInfoBar.classList.remove("alert-danger");
      this.userInfoBar.classList.add("alert-success");
    } else {
      this.userInfoBar.classList.add("alert-danger");
      this.userInfoBar.classList.remove("alert-success");
    }
    this.userInfoBar.innerText = message;
  }

  private writeSecret(secret: CreateSecretDTO) {
    ipcRenderer.send("writeSecret", secret);
  }

  private hideMessage() {
    this.userInfoBar.style.display = "none";
  }
}

new Renderer();
