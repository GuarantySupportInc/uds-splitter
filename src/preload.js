'use strict';

const { contextBridge, ipcRenderer } = require('electron');


contextBridge.exposeInMainWorld('backend', {
    ChooseFileDialog: () => {
        ipcRenderer.send('open-file-dialog')
    },
    SubmitForm: (data) => {
        ipcRenderer.send('submitted-form', data);
    },
    OnFormSubmitted: (callback) => {
        ipcRenderer.on('form-submitted', (event, response) => callback(response))
    },
    ChooseFolderDialog: (channel, event) => {
        ipcRenderer.send('open-directory-dialog', event)
    },
    OnSelectedFile: (callback) => {
        ipcRenderer.on('selected-file', (event, response) => callback(response))
    },
    OnSelectedDirectory: (callback) => {
        ipcRenderer.on('selected-directory', (event, response) => callback(response))
    }
});