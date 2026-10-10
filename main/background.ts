// import { app, ipcMain } from 'electron'
// import serve from 'electron-serve'
// import path from 'path'
// import { createWindow } from './helpers'

// const isProd = process.env.NODE_ENV === 'production'

// if (isProd) {
//   serve({ directory: 'app' })
// } else {
//   app.setPath('userData', `${app.getPath('userData')} (development)`)
// }

// ;(async () => {
//   await app.whenReady()

//   const mainWindow = createWindow('main', {
//     width: 1000,
//     height: 600,
//     webPreferences: {
//       preload: path.join(__dirname, 'preload.js'),
//     },
//   })

//   if (isProd) {
//     await mainWindow.loadURL('app://')
//   } else {
//     const port = process.argv[2]
//     await mainWindow.loadURL(`http://localhost:${port}/`)
//     mainWindow.webContents.openDevTools()
//   }
// })()

// app.on('window-all-closed', () => {
//   app.quit()
// })

// ipcMain.on('message', async (event, arg) => {
//   event.reply('message', `${arg} World!`)
// })

import { app, ipcMain } from "electron";
import serve from "electron-serve";
import path from "path";
import { createWindow } from "./helpers";

const isProd = process.env.NODE_ENV === "production";

app.commandLine.appendSwitch("disable-renderer-backgrounding");
app.commandLine.appendSwitch("disable-background-timer-throttling");
app.commandLine.appendSwitch("disable-backgrounding-occluded-windows");

let blockerId;
// app.whenReady().then(() => {
//   const win = new BrowserWindow({
//     width: 1200,
//     height: 800,
//     webPreferences: {
//       backgroundThrottling: false,
//       contextIsolation: true,
//       nodeIntegration: false,
//     },
//   });
//   win.loadURL("http://localhost:3000"); // or win.loadFile('index.html')
//   blockerId = powerSaveBlocker.start("prevent-app-suspension"); // keep OS from napping
// });
// app.on("window-all-closed", () => {
//   if (blockerId) powerSaveBlocker.stop(blockerId);
//   app.quit();
// });

if (isProd) {
  serve({ directory: "app" });
} else {
  app.setPath("userData", `${app.getPath("userData")} (development)`);
}

(async () => {
  await app.whenReady();

  const mainWindow = createWindow("main", {
    width: 1000,
    height: 600,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      backgroundThrottling: false,
    },
  });

  if (isProd) {
    // Try different paths for production
    try {
      await mainWindow.loadURL("app://./index.html");
    } catch (error) {
      console.error("Failed to load app://, trying file://", error);
      await mainWindow.loadFile(path.join(__dirname, "../app/index.html"));
    }
  } else {
    const port = process.argv[2];
    await mainWindow.loadURL(`http://localhost:${port}/`);
    mainWindow.webContents.openDevTools();
  }
})();

app.on("window-all-closed", () => {
  app.quit();
});

ipcMain.on("message", async (event, arg) => {
  event.reply("message", `${arg} World!`);
});
