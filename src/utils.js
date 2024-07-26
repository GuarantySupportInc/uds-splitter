
function createNewTrailer(chunk, recordType, trailer) {
  let totalAmount = 0;
  let newTrailer;

  switch (recordType) {
    case 'A':
      for (let i = 0; i < chunk.length; i++) {
        const transAmount = convertUDSCurrencyToFloat(chunk[i].substring(430, 442));  //verified length is 12 and ends on either + or -
        totalAmount += transAmount;
      }
      newTrailer = trailer.substring(0, 64) + chunk.length.toString().padStart(9, '0') + convertFloatToUDSCurrency(totalAmount) + trailer.substring(88);  //verified old trailer and current trailer line up.. both + and - amounts have also been verified to be working correctly  
    break;
    case 'B':
      for (let i = 0; i < chunk.length; i++) {
        const unearnedPremiumAmount = convertUDSCurrencyToFloat(chunk[i].substring(284, 294));  //correct UDS position
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
        checkAmount = convertUDSCurrencyToFloat(currentLines[i].substring(222, 234)); //correct UDS position
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

//this function is working as expected based upon the returned A's
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

//this function is working as expected based upon the returned A's
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

function getClaimNumber(line, recordType) {
  let claimNumber;
  switch (recordType) {
    case 'A':
      claimNumber = line.substring(36, 56).trim();
      break;
    case 'B':
      claimNumber = line.substring(16, 36).trim();
      break;
    case 'F':
      claimNumber = line.substring(10, 40).trim();
      break;
    case 'G':
      claimNumber = line.substring(36, 66).trim();
      break;
    case 'I':
      claimNumber = line.substring(10, 30).trim();
      break;
    default:
      console.log('Invalid Record Type');
      break;
  }
  return claimNumber;
}

function sortFileByClaim(lines, recordType) {
  const uniqueClaims = new Set();
  // Sort the lines by claim number
  switch (recordType) {
    case 'A':
      lines.sort((a, b) => {
        const claimNumberA = a.substring(36, 56).trim();
        const claimNumberB = b.substring(36, 56).trim();
        uniqueClaims.add(claimNumberA);
        uniqueClaims.add(claimNumberB);
        return claimNumberA.localeCompare(claimNumberB);
      });
      break;
    case 'B':
      lines.sort((a, b) => {
        const claimNumberA = a.substring(16, 36).trim();
        const claimNumberB = b.substring(16, 36).trim();
        uniqueClaims.add(claimNumberA);
        uniqueClaims.add(claimNumberB);
        return claimNumberA.localeCompare(claimNumberB);
      });
      break;
    case 'F':
      lines.sort((a, b) => {
        const claimNumberA = a.substring(10, 40).trim();
        const claimNumberB = b.substring(10, 40).trim();
        uniqueClaims.add(claimNumberA);
        uniqueClaims.add(claimNumberB);
        return claimNumberA.localeCompare(claimNumberB);
      });
      break;
    case 'G':
      lines.sort((a, b) => {
        const claimNumberA = a.substring(36, 66).trim();
        const claimNumberB = b.substring(36, 66).trim();
        uniqueClaims.add(claimNumberA);
        uniqueClaims.add(claimNumberB);
        return claimNumberA.localeCompare(claimNumberB);
      });
      break;
    case 'I':
      lines.sort((a, b) => {
        const claimNumberA = a.substring(10, 30).trim();
        const claimNumberB = b.substring(10, 30).trim();
        uniqueClaims.add(claimNumberA);
        uniqueClaims.add(claimNumberB);
        return claimNumberA.localeCompare(claimNumberB);
      });
      break;
    default:
      console.log('Invalid Record Type');
      break;
  }
  return { sortedLines: lines, uniqueClaims: uniqueClaims.size };
}

module.exports = {
  createNewTrailer,
  convertUDSCurrencyToFloat,
  convertFloatToUDSCurrency,
  sortFileByClaim,
  getClaimNumber
};