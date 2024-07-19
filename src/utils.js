
function createNewTrailer(chunk, fileName, trailer) {
  const recordType = fileName[5];
  let newTrailer;

  switch (recordType) {
    case 'A':
    // Add your logic for type A here
    break;
    case 'B':
      // Add your logic for type B here
      break;
    case 'F':
      //has been validated that it is working as expected
      const chunkLength = chunk.length;
      const newTrailerVal = chunkLength.toString().padStart(9, '0');
      newTrailer = trailer.substring(0,64) + newTrailerVal + trailer.substring(73);
      break;
    case 'G':
      // Add your logic for type G here
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
  
module.exports = createNewTrailer;