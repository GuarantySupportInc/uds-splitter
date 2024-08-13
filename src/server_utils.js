'use strict';


// START OF FILE MUST LOOK LIKE A UDS FILE
const AdmZip = require('adm-zip');
const fs = require("fs");
const path = require("path");
const ReadLine = require('readline')
const { once } = require('events');
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
      newTrailer = trailer.substring(0,64) + chunk.length.toString().padStart(9, '0') + trailer.substring(73);
      break;
    case 'G':
      for (let i = 0; i < chunk.length; i++) {
        const checkAmount = convertUDSCurrencyToFloat(chunk[i].substring(222, 234)); //correct UDS position
        totalAmount += checkAmount;
      }
      newTrailer = trailer.substring(0, 64) + chunk.length.toString().padStart(9, '0') + convertFloatToUDSCurrency(totalAmount) + trailer.substring(88);
      break;
    case 'I':
      newTrailer = trailer.substring(0,64) + chunk.length.toString().padStart(9, '0') + trailer.substring(73);
      break;
    default:
      throw new Error(`UDS filename is using an invalid record type: ${recordType}`)
  }

  // Fix Batch Number
  // Header and Trailer have same Batch Number positions.
  newTrailer = newTrailer.substring(0, 34) + padDigits(new_batch_number,3) + newTrailer.substring(37)

  return newTrailer;
}

function createNewHeader(new_batch_number, header) {
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

function swap_batch_number_in_file_name(uds_file_name, new_batch_number) {
  // START OF uds_file_name MUST LOOK LIKE A UDS FILE
  if(!uds_file_name.match(UDS_FILE_REGEX))
    throw new Error(`File name does not appear to match a UDS file name: ${uds_file_name}`);

  // "55555IIN01IN99 | 001 | 20240717.txt"
  return uds_file_name.substring(0, 14) + padDigits(new_batch_number, 3) + uds_file_name.substring(17)
}

function trim(string, character) {
  if(character === "\\") {
    // When we convert to regex, we kinda need to cancel the '\' twice so it looks like '\\' when it shows up in the string.
    character = "\\\\"
  }
  const end_of_string_regex = new RegExp(character + "*$")
  const start_of_string_regex = new RegExp("^" + character + "*")

  return string.replace(start_of_string_regex, '').replace(end_of_string_regex, '');
}

/**
 * A utility function for creating a clean LOCAL path using the appropriate path separator.
 * @param args
 * @returns {string}
 */
function join_path_parts(...args) {
  let otherSep
  if (path.sep === "/") {
    otherSep = "\\"
  }
  else{
    otherSep = "/"
  }
  args.forEach((arg, index) => args[index] = trim(arg.replaceAll(otherSep, path.sep), path.sep))
  return args.join(path.sep)
}

/**
 * I think the introduction of 'async' has added some out-of-sync issues between threads which results in variables
 * not being populated as expected. Just waiting for those variables to 'catch up' seems good enough for now.
 * @param zip
 * @returns {Promise<void>}
 */
async function wait_for_zip_to_populate(zip) {
  while(!(zip.getEntryCount() > 0)) {
    await new Promise((resolve) => setTimeout(resolve, 100))
  }
}

/**
 * Given a zip file, generate a smaller zip file for each resulting UDS file path. This may seem strange, but we run the
 * risk of reading a ZIP file more than once. For big files that should NOT happen, so we are operating under the
 * assumption that .txt files are cheap and .zip files are expensive which forms the basis of the loop.
 * @param original_zip_file full path
 * @param final_uds_file_paths list of full paths
 */
async function create_zip_files(original_zip_file, final_uds_file_paths) {
  let zip = new AdmZip(original_zip_file, {})

  let file_map = {
    //"{file_path}": "{final_uds_file_path}"
  }

  let zip_map = {
    //"{final_uds_file_path}": "{resulting_zip}"
  }

  // Populate file_map
  for (const path of final_uds_file_paths) {
    // Set up line-by-line processing

    let file_stream = fs.createReadStream(path)

    await Promise.all([once(file_stream, "open")]) // If this is missing, reader becomes an empty iterator.

    let reader = ReadLine.createInterface({input: file_stream, crlfDelay: Infinity})

    if (!(path in zip_map))
      zip_map[path] = new AdmZip(null, {})


    for await (const line of reader) {
      if(line.startsWith("HEADER") || line.startsWith("TRAILER"))
        continue

      if(line === "")
        continue

      let document_path = line.substring(702, 958).trim() // Assuming perfect UDS
      let file_name = line.substring(958, 1214).trim()
      let full_path = "\\" + join_path_parts(document_path, file_name).replaceAll("/", "\\")
      if (!(full_path in file_map)) {
        file_map[full_path] = new Set([path])
      } else {
        file_map[full_path].add(path)
      }
    }
  }

  // Determine where this entry to should go in the resulting uds files
  zip.getEntries("").forEach((entry) => {

    // Zip Slip prevention https://security.snyk.io/research/zip-slip-vulnerability
    let zip_base_directory = original_zip_file.substring(0, original_zip_file.lastIndexOf(path.sep));
    let potential_entry = path.join(zip_base_directory, entry.entryName)
    if(potential_entry.indexOf(path.join(zip_base_directory, path.sep)) !== 0) {
      throw new Error("Zip Slip abuse detected. See link for details: https://security.snyk.io/research/zip-slip-vulnerability.")
    }

    // "\\Images\\test\\somefile.txt"
    let uds_version_of_entry = `\\${trim(entry.entryName, '\\').replaceAll("/", "\\")}`

    if(entry.isDirectory)
      // We don't care about directories.
      return

    if(!(uds_version_of_entry in file_map))
      throw new Error(`${uds_version_of_entry} is not in an a resulting UDS file. Are you sure the ZIP goes with the UDS file?`)

    console.debug(`Processing ZIP entry: ${entry.entryName}`)

    zip.readFileAsync(entry.entryName, (data, err) => {

      if(err)
        throw new Error(`Something went wrong when reading ZIP Entry '${entry.entryName}' from '${original_zip_file}'`)

      // Basically one Full Path could belong to multiple UDS files, so we store the list of UDS files for each full path
      // then we get the resulting ZIP for each eventual UDS file. Thus we hope that zip.readFileAsync() is only called
      // ONCE but the same data is propagated to as many UDS files as we need.

      file_map[uds_version_of_entry].forEach((uds_source_file) => {
        zip_map[uds_source_file].addFile(entry.entryName, data , entry.comment, entry.attr)
        console.debug(zip_map[uds_source_file].getEntryCount())
      })
    })
  })

  for(let key in zip_map) {
    let new_zip_name = `${key.substring(0, key.length - 4)}.zip`

    let new_zip_file = zip_map[key]

    await wait_for_zip_to_populate(new_zip_file)

    if(new_zip_file.getEntryCount() === 0)
      throw new Error(`ZIP file ${new_zip_name} will be created with no entries. Something went wrong.`)

    new_zip_file.writeZip(new_zip_name, (error) => {
      if (error) {
        console.error(error)
      }
    })
  }

}

module.exports = {
  padDigits,
  createNewTrailer,
  sortFileByClaim,
  getClaimNumber,
  convertUDSCurrencyToFloat,
  convertFloatToUDSCurrency,
  UDS_FILE_REGEX,
  swap_batch_number_in_file_name,
  join_path_parts,
  createNewHeader,
  create_zip_files,
  trim,
  wait_for_zip_to_populate
};