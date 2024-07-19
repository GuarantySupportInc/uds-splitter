const createNewTrailer = require('./utils');

const { app, ipcMain, BrowserWindow, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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
  const filePath = formData.filePath;
  const linesPerFile = parseInt(formData['lines-per-file']);
  const outputDir = formData.outputDir;
  if (filePath) {
    console.log('File path received:', filePath);
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
        
        
        let fileIndex = 1;
        for (let i = 0; i < numberOfLinesInFile; i += linesPerFile) {
          const chunk = lines.slice(i, i + linesPerFile);
          // maybe put functions here to process the chunk for changes w header/trailer
          const newTrailer = createNewTrailer(chunk, filePath, trailer);

          const fileContent = [header, ...chunk, newTrailer].join('\n');
          const newFileName = `${outputDir}/file-${fileIndex}.txt`;
          fs.writeFile(newFileName, fileContent, (writeErr) => {
            if (writeErr) {
              console.error('Error writing file:', writeErr);
            } else {
              console.log(`File ${newFileName} written successfully.`);
            }
          });
    
          fileIndex++;
          let progress = Math.round(((i + linesPerFile) / numberOfLinesInFile) * 100);  //progress is kinda difficult to calc with this method since we're not using two loops.. this is basically just saying when a file is done.. maybe can keep track of chunk len outside the loop
          progressWindow.webContents.send('progress-update', progress);
        }
        event.sender.send('form-submitted', 'Form data and file processed successfully!');
        progressWindow.webContents.send('progress-done', 'Form data and file processed successfully!');
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