import {ipcRenderer} from "electron";
import {CreateSecretDTO, GetSecretDTO} from "./secret.dto";
import {Mode, ResponseSchema, RevealSecretRequest, RevealSecretResponse} from "./interfaces";

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
    private readonly themeSwitch = document.getElementById(
        "theme-switch") as HTMLInputElement;

    private eyeListener = (event: Event) => {
        const target =
            (event.target as HTMLElement).tagName.toLowerCase() === "span"
                ? (event.target as HTMLElement).parentElement
                : (event.target as HTMLElement);
        const parent = target.parentElement.parentElement;
        if (target.classList.contains("eye-slash")) {
            // je vyzadovano zadani hesla, popr se uz heslo zobrazilo
            target.classList.replace("eye-slash", "eye");
            parent.getElementsByTagName("input").item(0).style.display = "none";
            parent.getElementsByTagName("button").item(0).style.display = "none";
            const divs = parent.getElementsByTagName("div");
            divs.item(3).innerText = divs.item(4).innerText;
        } else {
            target.classList.replace("eye", "eye-slash");
            parent.getElementsByTagName("input").item(0).style.display = "block";
            parent.getElementsByTagName("button").item(0).style.display = "block";
            // const divs = parent.getElementsByTagName("div");
            // divs.item(3).innerText = "odhalene heslo";
        }
    };

    private submitRevealListener = (event: Event) => {
        const target = event.target as HTMLButtonElement;
        const parent = target.parentElement.parentElement;
        const password = parent.getElementsByTagName("input").item(0).value;
        if (password.trim().length < 8) {
            this.displayMessage("Password is incorrect.", false);
        } else {
            ipcRenderer.send("revealSecret", {
                id: parseInt(parent.id.substring(6, parent.id.length)),
                password: password
            } as RevealSecretRequest);
        }
    };

    private revealSecret = (event: Event, secret: RevealSecretResponse) => {
        if (!secret.correct) {
            this.displayMessage("Password is incorrect.", false);
        } else {
            // console.log(document.getElementById(`secret${secret.id}`));
            const secretDiv = document.getElementById(`secret${secret.id}`);
            secretDiv.getElementsByTagName("input").item(0).style.display = "none";
            secretDiv.getElementsByTagName("input").item(0).value = "";
            secretDiv.getElementsByTagName("button").item(0).style.display = "none";
            secretDiv.getElementsByTagName("div").item(3).innerText = secret.secret;
        }
    };

    constructor() {
        if (localStorage.getItem("theme")) {
            const mode = localStorage.getItem("theme") as Mode;
            this.setColorMode(mode);
            if(mode===Mode.dark){
                this.themeSwitch.checked = true;
            }
        } else {
            localStorage.setItem("theme", "light");
            this.setColorMode(Mode.light);
        }
        ipcRenderer.on("receiveData", (event: Event, data: ResponseSchema) => {
            this.secretValues = data.secrets;
            this.secrets.innerHTML = "";
            for (const secret of this.secretValues) {
                const li = document.createElement("li");
                const liDiv = document.createElement("div");
                const nameDiv = document.createElement("div");
                const secretDiv = document.createElement("div");
                const tmpDiv = document.createElement("div");
                tmpDiv.style.display = "none";
                tmpDiv.innerText = secret.secret;

                //button
                const button = document.createElement("button") as HTMLButtonElement;
                button.innerText = "Submit Password";
                button.style.display = "none";
                button.addEventListener("click", this.submitRevealListener);

                //input
                const input = document.createElement("input") as HTMLInputElement;
                input.placeholder = "Password";
                input.type = "password";
                input.style.display = "none";

                //iconButton + tooltip
                const tooltip = document.createElement("span");
                const iconButtonDiv = document.createElement("div");
                iconButtonDiv.classList.add("eye");
                iconButtonDiv.appendChild(tooltip);
                iconButtonDiv.addEventListener("click", this.eyeListener);
                tooltip.textContent = "Display secret";

                nameDiv.innerText = secret.name;
                secretDiv.innerText = secret.secret;
                liDiv.appendChild(iconButtonDiv);
                liDiv.appendChild(nameDiv);
                liDiv.appendChild(secretDiv);
                liDiv.appendChild(input);
                liDiv.appendChild(button);
                liDiv.appendChild(tmpDiv);
                liDiv.classList.add("row");
                li.appendChild(liDiv);
                li.id = `secret${secret.id}`;
                this.secrets.appendChild(li);
            }
        });
        ipcRenderer.on("revealSecret", this.revealSecret);
        this.requestProfile();
        this.requestData();
        this.createFormListeners();
        this.colorModeListeners();
    }

    private requestData() {
        ipcRenderer.send("requestData");
    }

    private requestProfile() {
        ipcRenderer.send("requestProfile");
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
                this.secretName.value = "";
                this.secretPassword.value = "";
                this.secretPasswordAgain.value = "";
                this.secretInput.value = "";
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
            this.displayMessage("Secret with this name already exists!", false);
            return false;
        } else {
            this.displayMessage("Secret successfully saved.", true);
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
        // setTimeout(() => {
        //   this.hideMessage();
        // }, 5000);
    }

    private writeSecret(secret: CreateSecretDTO) {
        ipcRenderer.send("writeSecret", secret);
    }

    private hideMessage() {
        this.userInfoBar.style.display = "none";
    }

    private colorModeListeners() {
        const listener = (event: Event) => {
            const element: HTMLElement = event.target as HTMLElement;
            if (element.id == "dark") {
                this.setColorMode(Mode.dark);
                this.themeSwitch.checked = true;
            } else {
                this.setColorMode(Mode.light);
                this.themeSwitch.checked = false;
            }
            localStorage.setItem("theme", element.id);
        };
        this.themeSwitch.addEventListener("change",(e)=>{
             const target = e.target as HTMLInputElement;
             if(target.checked){
                 this.setColorMode(Mode.dark);
                 localStorage.setItem("theme", "dark");
             }else {
                 this.setColorMode(Mode.light);
                 localStorage.setItem("theme", "light");
             }
        })
        document.getElementById("light").addEventListener("click", listener);
        document.getElementById("dark").addEventListener("click", listener);
    }

    private setColorMode(mode: Mode) {
        document
            .getElementsByTagName("body")
            .item(0)
            .classList.remove("light", "dark");
        document
            .getElementsByTagName("body")
            .item(0)
            .classList.add(mode);
    }
}

new Renderer();
