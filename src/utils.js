const fs = require('fs');


function split_records(filePath, linesPerFile, startingBatchNumber, header, trailer, rows, recordType){
    console.log('Handling BRecord');
  
    //iterate through rows and create new files
    let batchNumber = startingBatchNumber;
    let currentLines = [];
    let currentLineCount = 0;
    for (let i = 0; i < rows.length; i++) {
      currentLines.push(rows[i]);
      currentLineCount++;
      if ((currentLineCount == linesPerFile) || (i == rows.length - 1)) {
        let newFilename = create_filename(filePath, batchNumber);
        let newHeader = create_header(header, batchNumber);
        let newTrailer = create_trailer(trailer, recordType, currentLines);
        let newFileContents = newHeader + '\n' + currentLines.join('\n') + '\n' + newTrailer;
        fs.writeFileSync(newFilename, newFileContents);
        batchNumber++;
        currentLines = [];
        currentLineCount = 0;
      }
    }
  }
  
  function create_filename(filePath, batchNumber) {
    let filename = filePath.split('\\').pop();
    return filename.substring(0, 14) + batchNumber.toString().padStart(3, '0') + filename.substring(17);
  }
  
  function create_header(header, batchNumber) {
    return header.substring(0, 34) + batchNumber.toString().padStart(3, '0') + header.substring(37);
  }
  
  function create_trailer(trailer, recordType, currentLines){
    let totalAmount = 0;
    let numberOfRecords = currentLines.length;
    for (let i = 0; i < currentLines.length; i++) {
      switch (recordType) {
        case 'B':
          let unearnedPremiumAmount = convertUDSCurrencyToFloat(currentLines[i].substring(284, 294));
          totalAmount += unearnedPremiumAmount;
          break;
        case 'G':
          checkAmount = convertUDSCurrencyToFloat(currentLines[i].substring(222, 234));
          totalAmount += checkAmount;
          break;
        default:
          console.log(`Unknown record type: ${recordType}`);
          break;
      }
    }
    return trailer.substring(0, 64) + numberOfRecords.toString().padStart(9, '0') + convertFloatToUDSCurrency(totalAmount);
  }
  
  function convertUDSCurrencyToFloat(amountString) {
    // Extract the sign
    const sign = amountString.slice(-1);
    
    // Extract the numeric part and convert to number
    const numericPart = amountString.slice(0, -1);
    
    // Convert to float with two decimal places
    const amount = parseFloat(numericPart) / 100;
    
    // Adjust sign
    const signedAmount = sign === '-' ? -amount : amount;
    
    return signedAmount;
  }
  
  function convertFloatToUDSCurrency(amount){
      // Determine the sign and remove it from the amount
      const sign = amount < 0 ? '-' : '+';
      const absoluteAmount = Math.abs(amount);
    
      // Convert the amount to an integer number of cents
      const amountInCents = Math.round(absoluteAmount * 100);
    
      // Convert to a string and pad with leading zeros to ensure the length is 12 characters
      const amountString = amountInCents.toString().padStart(14, '0');
    
      // Append the sign at the end
      return amountString + sign;
  }