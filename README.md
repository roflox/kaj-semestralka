# Semestrální práce


## Popis
Aplikace je napsaná v Typescriptu a využívá nástroj Electron. Elektron jsem zvolil jelikož potřebuji ukládat data do filesystému a ne jen do LocalStorage.

## Prerequisities
npm

## Spuštění
### Stáhnout potřebné moduly
`npm install`

### Vytvořit build
`npm run build`

### Vytvořit package pro cílovou platformu

#### Mac - x64
`npm run pack-mac`

#### Linux - x64
`npm run pack-lin`


#### Windows - x64
`npm run pack-win`

#### Všechny podporované platformy
`npm run pack-all`

Ve složce `out/` si najíc cílovou platformu, např. `win-32-x64` a spustit Keychain.exe
