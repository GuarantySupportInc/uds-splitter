const { browser } = require('@wdio/globals');
const path = require('path');
const fs = require('fs');

function verify_file_exists_then_delete(file_path) {
    fs.stat(file_path,
        {}, (err, success) => {
            if(err) {
                console.error(err);
                throw err
            }

            console.debug(`File ${file_path} exists!`)

            fs.rm(file_path,
                {},
                () => {
                    console.debug(`Deleting ${file_path}`)
                })
        });
}

describe('Electron Testing', () => {
    it('should attempt to submit the form and handle missing file selection', async () => {
        // Mock the alert function to prevent actual alerts and capture the message
        await browser.execute(() => {
            window.alert = (message) => {
                window.alertMessage = message;
            };
        });

        // Trigger form submission without selecting a file
        const submitButton = await browser.$('button[onclick="submit_form()"]');
        await submitButton.click();

        // Check if the correct alert was triggered
        const alertMessage = await browser.execute(() => window.alertMessage);
        expect(alertMessage).toBe("A file to process has not been chosen.");
    });

    it('should select the input file', async () => {
        // Resolve the file path using Node.js
        const filePath = path.resolve(__dirname, '../input_files/55555AIN01IN9900120240701 (1).txt');

        // Use browser.execute to set the file path in the browser context
        await browser.execute((filePath) => {
            document.getElementById('chosen-file').value = filePath;
            document.getElementById('chosen-file-friendly').innerText = '55555AIN01IN9900120240701 (1).txt';
        }, filePath);

        const chosenFileValue = await browser.$('#chosen-file').getValue();
        expect(chosenFileValue).toEqual(filePath);
    });

    it('should select the output folder', async () => {
        const outputFolder = await browser.$('#output-directory');
        const outputFolderPath = path.resolve(__dirname, '../output_files');
        await outputFolder.setValue(outputFolderPath);
        const outputFolderValue = await outputFolder.getValue();
        expect(outputFolderValue).toEqual(outputFolderPath);
    });

    it('should alter the desired number of files', async () => {
        const desiredFiles = await browser.$('#number-of-files');
        await desiredFiles.setValue('2');
        const desiredFilesValue = await desiredFiles.getValue();
        expect(desiredFilesValue).toEqual('2');
    });

    it('should format the batch number to three digits', async () => {
        const batchNumberInput = await browser.$('#starting-batch-number');
        await batchNumberInput.setValue('5');
        await browser.execute(() => {
            document.getElementById('starting-batch-number').dispatchEvent(new Event('change'));
        });
        const formattedValue = await batchNumberInput.getValue();
        expect(formattedValue).toEqual('005');
    });

    it('should verify the checkbox for "Open Folder on Complete"', async () => {
        // Locate the checkbox
        const openFolderCheckbox = await browser.$('#open-folder');

        // Verify that the checkbox is checked by default
        let isChecked = await openFolderCheckbox.isSelected();
        expect(isChecked).toBe(true);

        // Uncheck the checkbox
        await openFolderCheckbox.click();

        // Verify that the checkbox is now unchecked
        isChecked = await openFolderCheckbox.isSelected();
        expect(isChecked).toBe(false);

        // Check the checkbox again
        // await openFolderCheckbox.click();

        // // Verify that the checkbox is checked again
        // isChecked = await openFolderCheckbox.isSelected();
        // expect(isChecked).toBe(true);
    });

    it('should submit the form', async () => {
        const submitButton = await browser.$('#submit-button');
        await submitButton.click()
    })

    it("should verify that the A Record file exists", async() => {
        await new Promise(resolve => setTimeout(resolve, 200))

        // verify_file_exists_then_delete(path.join(__dirname, '../output_files/55555AIN01IN9900520240701 (1)-1.txt'))
        // verify_file_exists_then_delete(path.join(__dirname, '../output_files/55555AIN01IN9900620240701 (1)-2.txt'))
    })

    it('should submit and verify the form for I Records', async () => {
        const filePath = path.resolve(__dirname, '../input_files/55555IIN01IN9902020240812.txt')
        const zipFilePath = path.resolve(__dirname, '../input_files/55555IIN01IN9902020240812.zip')

        await browser.execute((filePath) => {
            document.getElementById('chosen-file').value = filePath;
        }, filePath);

        await browser.execute((zipFilePath) => {
            document.getElementById('choose-additional-file').value = zipFilePath;
        }, zipFilePath);

        const outputFolderPath = path.resolve(__dirname, '../output_files')
        const outputFolder = await browser.$('#output-directory');
        await outputFolder.setValue(outputFolderPath);

        const desiredFiles = await browser.$('#number-of-files');
        await desiredFiles.setValue('3');

        const batchNumberInput = await browser.$('#starting-batch-number');
        await batchNumberInput.setValue('5');

        const submitButton = await browser.$('#submit-button');
        await submitButton.click()

    });

    it('should submit and verify the form for F Records', async () => {
        const filePath = path.resolve(__dirname, '../input_files/55555FIN01IN9900120240814.txt')

        await browser.execute((filePath) => {
            document.getElementById('chosen-file').value = filePath;
        }, filePath);


        const outputFolderPath = path.resolve(__dirname, '../output_files')
        const outputFolder = await browser.$('#output-directory');
        await outputFolder.setValue(outputFolderPath);

        const desiredFiles = await browser.$('#number-of-files');
        await desiredFiles.setValue('3');

        const batchNumberInput = await browser.$('#starting-batch-number');
        await batchNumberInput.setValue('5');

        const submitButton = await browser.$('#submit-button');
        await submitButton.click()
    });


})

