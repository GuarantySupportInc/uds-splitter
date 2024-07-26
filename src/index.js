'use strict';

const { createNewTrailer, sortFileByClaim, getClaimNumber } = require('./utils');
const { app, ipcMain, BrowserWindow, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');

let electron_path;
if(process.platform === 'win32')
  electron_path = 'node_modules/.bin/electron.cmd'
else
  electron_path = 'node_modules/.bin/electron';

require('electron-reload')(__dirname, {
  hardResetMethod: 'exit'
})

let mainWindow;

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  mainWindow.loadFile(path.join(__dirname, 'index.html'));

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
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


//main function on submission
ipcMain.on('submission-form', (event, formData) => {
  console.log('Form data received:', formData);
  const filePath = formData.filePath;
  const fileName = path.basename(filePath);
  const recordType = fileName[5];
  const { name } = path.parse(filePath);
  const numberOfFiles = parseInt(formData['number-of-files']);
  const outputDir = formData.outputDir;
  let isProcessingCanceled = false;
  console.log('File path received:', filePath);
  const progressWindow = new BrowserWindow({
    width: 400,
    height: 250,
    parent: mainWindow,
    modal: true,
    webPreferences: {
      contextIsolation: true,
      enableRemoteModule: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  progressWindow.loadFile(path.join(__dirname, 'progress.html'));
  fs.readFile(formData.filePath, 'utf-8', (err, data) => {
    if (err) {
      console.error('Error reading file:', err);
      event.sender.send('form-submitted', 'Error processing file.');
    } 
    else {
      const lines = data.split('\n');

      const header = lines.shift();
      let trailer = lines.pop();
      const numberOfLinesInFile = lines.length;
      const linesPerFile = Math.ceil(numberOfLinesInFile / numberOfFiles);

      const result = sortFileByClaim(lines, recordType);
      const sortedLines = result.sortedLines;
      const uniqueClaims = result.uniqueClaims;

      //THE FOLLOWING CODE IS CAN BE USED AS A RESTRAINT ON THE USER TO NOT REQUEST MORE FILES THAN THERE ARE UNIQUE CLAIMS
      //BUT THE WAY IT WORKS WITHOUT THE FOLLOWING CODE IMPLEMENTED IS IT WILL CREATE THE NUMBER OF FILES UNTIL THE LINES ARE ITERATED THROUGH
      //WOULD NEED TO GET SENT BACK TO THE RENDERER TO DISPLAY A MESSAGE TO THE USER IF WE GO THIS ROUTE
      // if (numberOfFiles > uniqueClaims) {    
      //   console.error('Number of files requested is greater than the number of unique claims.');
      //   event.sender.send('form-submitted', 'Number of files requested is greater than the number of unique claims. Please lower the number of files and try again.');
      //   return;
      // }
      
      let fileIndex = 1;
      let i = 0;

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

        const chunk = sortedLines.slice(i, endIndex);
        const newTrailer = createNewTrailer(chunk, recordType, trailer);
        const fileContent = [header, ...chunk, newTrailer].join('\n') + '\n';
        const newFileName = `${outputDir}/${name}-${fileIndex}.txt`;
        let progress = Math.round(((i + linesPerFile) / numberOfLinesInFile) * 100);  //progress is kinda difficult to calc with this method since we're not using two loops.. this is basically just saying when a file is done.. maybe can keep track of chunk len outside the loop
        progressWindow.webContents.send('progress-update', progress);
        fs.writeFile(newFileName, fileContent, (writeErr) => {
          if (writeErr) {
            console.error('Error writing file:', writeErr);
          } else {
            console.log(`File ${newFileName} written successfully.`);
          }
        });
        fileIndex++;
        i = endIndex;
      }
      if (isProcessingCanceled) {
        event.sender.send('form-submitted', 'Processing was canceled.');
        progressWindow.close();
        progressWindow.webContents.send('progress-done', 'Processing was canceled.');
      } else {
        event.sender.send('form-submitted', 'Form data and file processed successfully!');
        progressWindow.webContents.send('progress-done', 'Form data and file processed successfully!');
      }
    }
  });
  // progressWindow.webContents.send('progress-done', 'Form data and file processed successfully!');  #when done
});

//choose file
ipcMain.on('open-file-dialog', (event) => {
  const result = dialog.showOpenDialogSync(mainWindow,{
      properties: ['openFile'],
      filters: [
        { name: 'Text Files', extensions: ['txt', 'text'] },
      ],
  });

  if (result && result.length > 0) {
      event.sender.send('selected-file', result[0]);
  } else {
      event.sender.send('selected-file', 'canceled');
  }
});

//choose output dir
ipcMain.on('open-directory-dialog', (event) => {
  const result = dialog.showOpenDialogSync(mainWindow, {
      properties: ['openDirectory'],
  });

  if (result && result.length > 0) {
      event.sender.send('selected-directory', result[0]);
  } else {
      event.sender.send('selected-directory', 'canceled');
  }
});

//choose zip file
ipcMain.on('open-zip-file-dialog', (event) => {
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
});

ipcMain.on('cancel-processing', (event) => {
  isProcessingCanceled = true;
  console.log('Processing canceled by the user.');
});