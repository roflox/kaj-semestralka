import { ipcRenderer } from "electron";

(async () => {
  const data = await ipcRenderer.send("retrieveData");
  console.log(data);
})();


const button = document.getElementById("test");
button.addEventListener("click", ev => {
  ipcRenderer.send("test","test");
});