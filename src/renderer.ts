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
    private static readonly EYE_HTML = "<path fill=\"currentColor\" d=\"M572.52 241.4C518.29 135.59 410.93 64 288 64S57.68 135.64 3.48 241.41a32.35 32.35 0 0 0 0 29.19C57.71 376.41 165.07 448 288 448s230.32-71.64 284.52-177.41a32.35 32.35 0 0 0 0-29.19zM288 400a144 144 0 1 1 144-144 143.93 143.93 0 0 1-144 144zm0-240a95.31 95.31 0 0 0-25.31 3.79 47.85 47.85 0 0 1-66.9 66.9A95.78 95.78 0 1 0 288 160z\"></path>"
    private static readonly EYE_SLASH_HTML = "<path fill=\"currentColor\" d=\"M320 400c-75.85 0-137.25-58.71-142.9-133.11L72.2 185.82c-13.79 17.3-26.48 35.59-36.72 55.59a32.35 32.35 0 0 0 0 29.19C89.71 376.41 197.07 448 320 448c26.91 0 52.87-4 77.89-10.46L346 397.39a144.13 144.13 0 0 1-26 2.61zm313.82 58.1l-110.55-85.44a331.25 331.25 0 0 0 81.25-102.07 32.35 32.35 0 0 0 0-29.19C550.29 135.59 442.93 64 320 64a308.15 308.15 0 0 0-147.32 37.7L45.46 3.37A16 16 0 0 0 23 6.18L3.37 31.45A16 16 0 0 0 6.18 53.9l588.36 454.73a16 16 0 0 0 22.46-2.81l19.64-25.27a16 16 0 0 0-2.82-22.45zm-183.72-142l-39.3-30.38A94.75 94.75 0 0 0 416 256a94.76 94.76 0 0 0-121.31-92.21A47.65 47.65 0 0 1 304 192a46.64 46.64 0 0 1-1.54 10l-73.61-56.89A142.31 142.31 0 0 1 320 112a143.92 143.92 0 0 1 144 144c0 21.63-5.29 41.79-13.9 60.11z\"></path>";


    private eyeListener = (event: Event) => {
        const target =
            (event.target as HTMLElement).tagName.toLowerCase() === "span"
                ? (event.target as HTMLElement).parentElement
                : (event.target as HTMLElement);
        const parent = target.parentElement.parentElement;
        if (target.classList.contains("eye-slash")) {
            // je vyzadovano zadani hesla, popr se uz heslo zobrazilo
            target.classList.replace("eye-slash", "eye");
            target.getElementsByTagName("svg").item(0).innerHTML=Renderer.EYE_HTML;
            parent.getElementsByTagName("input").item(0).style.display = "none";
            parent.getElementsByTagName("button").item(0).style.display = "none";
            const divs = parent.getElementsByTagName("div");
            divs.item(3).innerText = divs.item(4).innerText;
        } else {
            target.classList.replace("eye", "eye-slash");
            // console.log(target.getElementsByTagName("svg").item(0));
            target.getElementsByTagName("svg").item(0).innerHTML=Renderer.EYE_SLASH_HTML;
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
                const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg") as SVGElement;
                //aria-hidden=\"true\" width=\"10%\" height=\"10%\" focusable=\"false\" data-prefix=\"fas\" data-icon=\"eye\" class=\"svg-inline--fa fa-eye fa-w-18\" role=\"img\" xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 576 512\">

                svg.setAttribute("aria-hidden","true");
                svg.setAttribute("width","16px");
                svg.setAttribute("height","16px");
                svg.setAttribute("focusable","false");
                // svg.setAttribute("data-prefix","fas");
                // svg.setAttribute("data-icon","eye");
                // svg.setAttribute("role","img")
                // svg.setAttribute("xmlns","http://www.w3.org/2000/svg");
                svg.setAttribute("viewBox","0 0 576 512");
                svg.innerHTML = Renderer.EYE_HTML;
                iconButtonDiv.appendChild(svg);
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
