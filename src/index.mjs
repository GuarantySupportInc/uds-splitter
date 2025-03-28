import path from "path";
import fs from "fs";
import {
  create_zip_files,
  createNewHeader,
  createNewTrailer, extract_uds_file_from_florida_zip,
  getClaimNumber,
  join_path_parts,
  sortFileByClaim,
  swap_batch_number_in_file_name
} from "./server_utils.mjs";

import {app, BrowserWindow, dialog, ipcMain, Menu, MenuItem, shell} from "electron";

import {updateElectronApp, UpdateSourceType} from "update-electron-app";

import electron_squirrel_startup from "electron-squirrel-startup";

// import electron_reload from "electron-reload";

import defaultLogger from "electron-log/node.js";

// defaultLogger.errorHandler.startCatching()
// defaultLogger.eventLogger.startLogging()
console.log = defaultLogger.log;

defaultLogger.debug("Starting up")

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (electron_squirrel_startup) {
  app.quit();
}

if(fs.existsSync(path.resolve(path.dirname(process.execPath), '..', 'update.exe')) || fs.existsSync(path.resolve(path.dirname(process.execPath), '..', 'Update.exe'))) {
  // https://github.com/electron/electron/issues/4535#issuecomment-186662815

  // Basically Setup.exe generates the Update.exe file which does NOT exist with the `npm run make` command.
  // So we need to only run the Update logic if the Executable environment was 'set up' by Setup.exe and
  // not run the Update logic at all otherwise since it is likely a development environment.
  updateElectronApp(
      {
        logger: logger,
        updateSource: {
          type: UpdateSourceType.StaticStorage,
          baseUrl: `https://github.com/GuarantySupportInc/uds-splitter/releases/download/v${app.getVersion()}`
        }
      }
  ); // additional configuration options available
} else {
  defaultLogger.debug("updateElectronApp() not called because we may be in a development environment.")
}
app.enableSandbox()
// app.on('ready', (launchInfo) => {
//   app.enableSandbox()
// })

// electron_reload(path.resolve("src"), {
//   hardResetMethod: 'exit'
// })

let mainWindow;

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 500,
    height: 900,
    resizable: false,
    center: true,
    modal: false,
    webPreferences: {
      preload: path.join(path.resolve("src"), 'preload.mjs'),
      nodeIntegration: false
    },
    icon: path.join(path.resolve("src"), 'icon.ico'),
  });

  mainWindow.setMenu(Menu.buildFromTemplate([
    {
      label: 'Help',
      submenu: [
        { role: 'help', label: "Product Page", click: async () => {
          await shell.openExternal("https://www.guarantysupport.com/uds-splitter-utility/")
        } },
        { role: 'help', label: "Source Code", click: async () => {
          await shell.openExternal("https://github.com/GuarantySupportInc/uds-splitter")
        } },
        { role: 'help', label: "License", click: async () => {
          await shell.openExternal("https://github.com/GuarantySupportInc/uds-splitter/blob/master/LICENSE")
        } },
        { role: 'help', label: "Manual", click: async () => {
          await shell.openExternal("https://www.guarantysupport.com/uds-splitter-utility/#user-manual")
        } },
      ]
    }
  ]))

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(path.resolve("src"), 'index.html'));

  // Open the DevTools.
  mainWindow.webContents.openDevTools();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  createWindow();

  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Error handling not working as expected
// Handle uncaught exceptions globally in the main process
// app.on('uncaughtException', (error) => {
//   defaultLogger.error('Uncaught Exception:', error.message);

//   // Send the error to the renderer process
//   if (mainWindow && mainWindow.webContents) {
//       mainWindow.webContents.send('backend-exception', error.message);
//   }

// });

// if you try to import unhandled you will get an error!
// unhandled({
//   showDialog: true, // This shows an error dialog automatically
//   logger: (error) => {
//       defaultLogger.error('Unhandled Error:', error);
//       if (mainWindow && mainWindow.webContents) {
//           mainWindow.webContents.send('backend-exception', error.message);
//       }
//   },
// });
export async function submitted_form(event, formData) {
  defaultLogger.debug('Form data received:', formData);

  // Is file a Florida ZIP?
  if(formData["chosen-file"].match(/\d{5}_FL01[A-Za-z]{2}\d{2}_I_\d{3}/g)) {
    // Extract UDS file from ZIP then process as normal
    await extract_uds_file_from_florida_zip(formData["chosen-file"])
    let extension = path.extname(formData["chosen-file"])
    let extension_index = formData["chosen-file"].lastIndexOf(extension)

    // Swap arguments to put TXT first and ZIP last
    formData["additional-chosen-file"] = formData["chosen-file"]
    formData["chosen-file"] = formData["chosen-file"].substring(0, extension_index - extension.length) + ".txt"
  }

  let filePath = formData["chosen-file"];
  let zip_file_path = formData["additional-chosen-file"]
  const fileName = path.basename(filePath);
  const recordType = fileName[5];
  const file_name = path.parse(filePath).name;
  const numberOfFiles = parseInt(formData["number-of-files"]);
  const outputDir = formData["output-directory"];
  const startingBatchNumber = formData["starting-batch-number"];
  let isProcessingCanceled = false;
  defaultLogger.debug('File path received:', filePath);
  const progressWindow = new BrowserWindow({
    width: 400,
    height: 250,
    parent: mainWindow,
    modal: true,
    center: true,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
      preload: path.join(path.resolve("src"), 'preload.mjs')
    },
    icon: path.join(path.resolve("src"), 'icon.ico'),
  });

  await progressWindow.loadFile(path.join(path.resolve("src"), 'progress.html'));
  defaultLogger.debug('Record type:', recordType);

  fs.readFile(formData["chosen-file"], 'utf-8', async (err, data) => {
    if (err) {
      defaultLogger.error(`Error reading file ${formData["chosen-file"]}: ${err.message}`);
      event.sender.send('backend-exception', err + '\n Please contact support@guarantysupportinc.com with this exception');
    }
    defaultLogger.info('File read successfully.');
    const lines = data.split('\r\n');

    if (lines.length === 0 || !lines[0].includes("HEADER")) {
      defaultLogger.error("Not a valid UDS file: HEADER not found in the first line.");
      event.sender.send('backend-exception', 'Not a valid UDS file: HEADER not found in the first line.');
      // I believe this only returns the async function, not the whole function... hence why 'End' still prints
      return;
    }

    const header = lines.shift();
    let trailer
    let lastLine = lines.pop();      //get the last line of the file.. some records have an extra space at the end and some dont
    if (lastLine.includes("TRAILER")){  //if the last line is the trailer, then we need to keep it
      trailer = lastLine;
    }
    else{
      trailer = lines.pop();          //if the last line is not the trailer, then the next line will be
    }
    const numberOfLinesInFile = lines.length;
    const linesPerFile = Math.ceil(numberOfLinesInFile / numberOfFiles);

    // if for whatever reason the contents are proper UDS but the name of the file is incorrect UDS, then this should catch it...
    // I suppose we could also try to pull the record type from the header? .. but that gets us into trouble based upon the zip needing to go with I Recs..
    let result
    try{
      result = sortFileByClaim(lines, recordType);
    }
    catch(err){
      defaultLogger.error(`Error sorting file by claim: ${err.message}`);
      event.sender.send('backend-exception', err)
      return;
    }

    const sortedLines = result.sortedLines;

    let fileIndex = 1;
    let i = 0;

    let new_uds_files = []

    while (i < sortedLines.length) {
      if (isProcessingCanceled) {
        break;
      }
      let endIndex = Math.min(i + linesPerFile, sortedLines.length);

      // Ensure we do not split claims across files
      if (endIndex < sortedLines.length) {
        const currentClaim = getClaimNumber(sortedLines[endIndex - 1], recordType);
        let nextClaim = getClaimNumber(sortedLines[endIndex], recordType);

        while (currentClaim === nextClaim && endIndex < sortedLines.length) {
          endIndex++;
          if (endIndex < sortedLines.length) {
            nextClaim = getClaimNumber(sortedLines[endIndex], recordType);
          }
        }
      }

      let new_batch_number = parseInt(startingBatchNumber) + fileIndex - 1 // Starting at 1, so need to move the number left
      const chunk = sortedLines.slice(i, endIndex);
      const newTrailer = createNewTrailer(chunk, recordType, new_batch_number, trailer);
      const newHeader = createNewHeader(new_batch_number, header)
      const fileContent = [newHeader, ...chunk, newTrailer].join('\r\n') + '\r\n';
      const new_file_name = swap_batch_number_in_file_name(file_name, new_batch_number)

      let new_file_path;
      if(path.sep === "/") {
        // The problem is Windows will have C:// which doesn't get trimmed, but Linux will have / at the start which DOES get trimmed. Not good.
        // The assumption is outputDir is ALWAYS an absolute path. The "/" solution won't work for relative paths.
        new_file_path = "/" + join_path_parts(outputDir, `${new_file_name}-${fileIndex}.txt`)
      } else {
        new_file_path = join_path_parts(outputDir, `${new_file_name}-${fileIndex}.txt`)
      }

      let progress = Math.round(((i + linesPerFile) / numberOfLinesInFile) * 100);  //progress is kinda difficult to calc with this method since we're not using two loops.. this is basically just saying when a file is done.. maybe can keep track of chunk len outside the loop
      progressWindow.webContents.send('progress-update', progress);
      defaultLogger.debug(`Writing file ${new_file_path}...`);
      fs.writeFile(new_file_path, fileContent, (writeErr) => {
        if (writeErr) {
          throw new Error(`There was an error writing to ${new_file_path}: ${writeErr.message}`)
          event.sender.send('backend-exception', writeErr + '\n Please contact support@guarantysupportinc.com with this exception');
        } else {
          defaultLogger.debug(`File ${new_file_path} written successfully.`);
        }
      });

      new_uds_files.push(new_file_path)

      fileIndex++;
      i = endIndex;
    }

    if (recordType.toLowerCase() === 'i') {
      await create_zip_files(zip_file_path, new_uds_files, (file_name) => { console.info(`Created ${file_name}`) }).catch(result => {
        // Do something with the error message. Maybe a popup?
        defaultLogger.error(result.message)
        event.sender.send('backend-exception', result.message + '\n Please contact support@guarantysupportinc.com with this exception');
      })
    }
    if (isProcessingCanceled) {
      event.sender.send('form-submitted', 'Processing was canceled.');
      progressWindow.close();
      progressWindow.webContents.send('progress-done', 'Processing was canceled.');
    } else {
      event.sender.send('form-submitted', 'Form data and file processed successfully!');
      progressWindow.webContents.send('progress-done', 'Form data and file processed successfully!');

      //opening the folder where the files are written to, if the user decides
      if (formData['open-folder']) {
        shell.openPath(outputDir).then(() => {
          defaultLogger.log('Folder opened successfully');
        }).catch((err) => {
          defaultLogger.error('Error opening folder:', err);
        });
      }
    }
  });
  defaultLogger.debug('End')
}
export function open_uds_file_dialog(event) {
  const result = dialog.showOpenDialogSync(mainWindow,{
    properties: ['openFile'],
    filters: [
      { name: 'Text Files', extensions: ['txt', 'text', "zip"] },
    ],
  });

  if (result && result.length > 0) {
    event.sender.send('selected-file', result[0]);
  } else {
    event.sender.send('selected-file', 'canceled');
  }
}
export function open_directory_dialog(event) {
  const result = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openDirectory'],
  });

  if (result && result.length > 0) {
    event.sender.send('selected-directory', result[0]);
  } else {
    event.sender.send('selected-directory', 'canceled');
  }
}
export function open_zip_file_dialog(event) {
  const result = dialog.showOpenDialogSync(mainWindow, {
    properties: ['openFile'],
    filters: [
      { name: 'Zip Files', extensions: ['zip'] },
    ],
  });

  if (result && result.length > 0) {
    event.sender.send('selected-zip-file', result[0]);
  } else {
    event.sender.send('selected-zip-file', 'canceled');
  }
}
export function get_app_version(event) {
  event.returnValue = app.getVersion();
}
export function cancel_processing(event) {
  //isProcessingCanceled = true;
  defaultLogger.debug('Processing canceled by the user.');
}

ipcMain.on('submitted-form', submitted_form);
ipcMain.on('open-uds-file-dialog', open_uds_file_dialog);
ipcMain.on('open-directory-dialog', open_directory_dialog);
ipcMain.on('open-zip-file-dialog', open_zip_file_dialog);
ipcMain.on("get-app-version", get_app_version);
ipcMain.on('cancel-processing', cancel_processing);