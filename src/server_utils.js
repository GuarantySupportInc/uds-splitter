'use strict';


// START OF FILE MUST LOOK LIKE A UDS FILE
const UDS_FILE_REGEX = /^(\d{5})([ABCDEFGIM])([A-Z]{2}\d{2})([A-Z]{2}\d{2})(\d{3})/

function padDigits(number, digits) {
  return Array(Math.max(digits - String(number).length + 1, 0)).join(0) + number;
}

function createNewTrailer(chunk, recordType, new_batch_number, trailer) {
  let totalAmount = 0;
  let newTrailer;

  // Record Specific Fixes
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
      for (let i = 0; i < chunk.length; i++) {
        const checkAmount = convertUDSCurrencyToFloat(chunk[i].substring(222, 234)); //correct UDS position
        totalAmount += checkAmount;
      }
      newTrailer = trailer.substring(0, 64) + chunk.length.toString().padStart(9, '0') + convertFloatToUDSCurrency(totalAmount) + trailer.substring(88);
      break;
    case 'I':
      // Add your logic for type I here
      break;
    default:
      throw new Error(`UDS filename is using an invalid record type: ${recordType}`)
  }

  // Fix Batch Number
  // Header and Trailer have same Batch Number positions.
  newTrailer = trailer.substring(0, 34) + padDigits(new_batch_number,3) + trailer.substring(37)

  return newTrailer;
}

function createNewHeader(chunk, recordType, new_batch_number, header) {
  // Fix Batch Number
  // Header and Trailer have same Batch Number positions.
  return header.substring(0, 34) + padDigits(new_batch_number, 3) + header.substring(37)
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
  return sign === '-' ? -amount : amount;
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
      throw new Error(`UDS filename is using an invalid record type: ${recordType}`);
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
      throw new Error(`UDS filename is using an invalid record type: ${recordType}`);
  }
  return { sortedLines: lines, uniqueClaims: uniqueClaims.size };
}

function file_sep(file_name) {
  let starts_with_volume_letter = /^[A-Za-z]:\\/
  let starts_with_slash = /^\//

  if(starts_with_volume_letter.test(file_name)) {
    // WINDOWS
    return "\\"
  } else if(starts_with_slash.text(file_name)) {
    // LINUX/MAC
    return "/"
  } else if(file_name.includes('\\')) {
    return "\\"
  } else if(file_name.includes("/")) {
    return "/"
  } else {
    throw new Error(`Not sure what file path separator we are using: '${file_name}'`)
  }
}

function swap_batch_number_in_file_name(uds_file_name, new_batch_number) {
  // START OF uds_file_name MUST LOOK LIKE A UDS FILE
  if(!uds_file_name.match(UDS_FILE_REGEX))
    throw new Error(`File name does not appear to match a UDS file name: ${uds_file_name}`);

  // "55555IIN01IN99 | 001 | 20240717.txt"
  return uds_file_name.substring(0, 14) + padDigits(new_batch_number, 3) + uds_file_name.substring(17)
}

function trim(string, character) {
  const end_of_string_regex = new RegExp(character + "*$")
  const start_of_string_regex = new RegExp("^" + character + "*")

  return string.replace(start_of_string_regex, '').replace(end_of_string_regex, '');
}

function join_path_parts(...args) {
  const sep = file_sep(args[0])

  args.forEach(arg => trim(arg, sep))

  return args.join(sep)
}

module.exports = {
  createNewTrailer,
  sortFileByClaim,
  getClaimNumber,
  UDS_FILE_REGEX,
  swap_batch_number_in_file_name,
  join_path_parts,
  createNewHeader
};