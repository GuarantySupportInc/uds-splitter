const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('node:path');

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


//main function on submission
ipcMain.on('submission-form', (event, formData) => {
  console.log('Form data received:', formData);
  let linesPerFile = formData['lines-per-file'];
  let outputDir = formData['output-folder'];
  if (formData.filePath) {
    console.log('File path received:', formData.filePath);
    const progressWindow = new BrowserWindow({
      width: 400,
      height: 250,
      parent: mainWindow,
      modal: true,
      webPreferences: {
        contextIsolation: true,
        enableRemoteModule: false,
      },
    });

    progressWindow.loadFile(path.join(__dirname, 'progress.html'));
    const fs = require('fs');
    fs.readFile(formData.filePath, 'utf-8', (err, data) => {
      if (err) {
        console.error('Error reading file:', err);
        event.sender.send('form-submitted', 'Error processing file.');
      } 
      else {
        const lines = data.split('\n');
        const numberOfLinesInFile = lines.length;


        // progressWindow.webContents.send('progress-update', progress); needs to be within a for loop of some sort.. needs to know total lines ahead of time
        event.sender.send('form-submitted', 'Form data and file processed successfully!');
      }
    });
    // progressWindow.webContents.send('progress-done', 'Form data and file processed successfully!');  #when done
  } 
  else {
    event.sender.send('form-submitted', 'Form data processed successfully without file.');
  }
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