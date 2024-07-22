
function createNewTrailer(chunk, fileName, trailer) {
  const recordType = fileName[5];
  let totalAmount = 0;
  let newTrailer;

  switch (recordType) {
    case 'A':
    // Add your logic for type A here
    break;
    case 'B':
      for (let i = 0; i < chunk.length; i++) {
        const unearnedPremiumAmount = convertUDSCurrencyToFloat(chunk[i].substring(284, 294));
        totalAmount += unearnedPremiumAmount;
      }
      newTrailer = trailer.substring(0, 64) + chunk.length.toString().padStart(9, '0') + convertFloatToUDSCurrency(totalAmount) + trailer.substring(88);
      break;
    case 'F':
      //has been validated that it is working as expected
      const chunkLength = chunk.length;
      const newTrailerVal = chunkLength.toString().padStart(9, '0');
      newTrailer = trailer.substring(0,64) + newTrailerVal + trailer.substring(73);
      break;
    case 'G':
      for (let i = 0; i < currentLines.length; i++) {
        checkAmount = convertUDSCurrencyToFloat(currentLines[i].substring(222, 234));
        totalAmount += checkAmount;
      }
      newTrailer = trailer.substring(0, 64) + chunk.length.toString().padStart(9, '0') + convertFloatToUDSCurrency(totalAmount) + trailer.substring(88);
      break;
    case 'I':
      // Add your logic for type I here
      break;
    default:
      console.log('Invalid Record Type');
      break;
  }

    return newTrailer;
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
  
    // Convert to a string and pad with leading zeros to ensure the length is 14 characters
    const amountString = amountInCents.toString().padStart(14, '0');
  
    // Append the sign at the end
    return amountString + sign;
}
  
module.exports = createNewTrailer;