import { expect } from 'chai';
import { createNewTrailer, getClaimNumber, sortFileByClaim, padDigits as padDigitsServer, createNewHeader, convertUDSCurrencyToFloat, convertFloatToUDSCurrency, trim, join_path_parts, wait_for_zip_to_populate, create_zip_files } from '../src/server_utils.js';  // Make sure to use .js extension for ES modules
import { convert_form_data_to_dict, file_sep, get_directory_from_path, is_null_or_empty, padDigits as padDigitsLocal} from '../src/local_utils.js';
import { sep, join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { stat, rm } from 'fs/promises';
import AdmZip from 'adm-zip';


describe('createNewTrailer', function () {
    it('should create a new trailer for record type A correctly', function () {
        const chunk = [
            'A55555IN99135005111111              1234562                                 Joe Blow                                                    3829 Coconut Palm Drive                                     Indianapolis             IN46201000020090622191001182008050100001Blow                          Joe                           285 Fishpond Road                                           Chicago                  IL606010000S12345678910000001200098+  8UU                                                                 309   19990304        N   90 28                   UBale of rags fell on employee, knocking her down,landing on top                       UU',
            'A55555IN99105010222222              1234568                                 John Smith                                                  3829 Coconut Palm Drive                                     Indianapolis             IN46201000020090622191001182008050100001Smith                         John                          2709 Rifle Range Rd                                         Chicago                  IN606010000S98765432110000001200098+  8UU                                                                 309   19990304        N   90 28                   UBale of rags fell on employee, knocking her down,landing on top                       UU'
        ];
        const recordType = 'A';
        const new_batch_number = 123;
        const trailer = 'TRAILER             55555AIN01IN99001202407012024070120240701P&C00000000500000006000490+                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ';
    
        const result = createNewTrailer(chunk, recordType, new_batch_number, trailer);
    
    
        const expectedTrailer = 'TRAILER             55555AIN01IN99123202407012024070120240701P&C00000000200000002400196+                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ';
        expect(result).to.equal(expectedTrailer);
    });
    it('should create a new trailer for record type A with a negative amount correctly', function () {
        const chunk = [
            'A55555IN99135005111111              1234562                                 Joe Blow                                                    3829 Coconut Palm Drive                                     Indianapolis             IN46201000020090622191001182008050100001Blow                          Joe                           285 Fishpond Road                                           Chicago                  IL606010000S12345678910000001200098+  8UU                                                                 309   19990304        N   90 28                   UBale of rags fell on employee, knocking her down,landing on top                       UU',
            'A55555IN99105010222222              1234568                                 John Smith                                                  3829 Coconut Palm Drive                                     Indianapolis             IN46201000020090622191001182008050100001Smith                         John                          2709 Rifle Range Rd                                         Chicago                  IN606010000S98765432110000001200098-  8UU                                                                 309   19990304        N   90 28                   UBale of rags fell on employee, knocking her down,landing on top                       UU'
        ];
        const recordType = 'A';
        const new_batch_number = 123;
        const trailer = 'TRAILER             55555AIN01IN99001202407012024070120240701P&C00000000500000006000490+                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ';
    
        const result = createNewTrailer(chunk, recordType, new_batch_number, trailer);
    
    
        const expectedTrailer = 'TRAILER             55555AIN01IN99123202407012024070120240701P&C00000000200000000000000+                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ';
        expect(result).to.equal(expectedTrailer);
    });

    it('should create a new trailer for record type B correctly', function () {
        const chunk = [
            'B55555IN99635005111121                                  FISH                          JOE                           123 Fake St                                                 Laplace                  LA7006800001901010100001          202201032023010320220523180000003078000000118298Y000194100+000000000+               00000 FISH                          JOE                                                                                                                                               ',
            'B55555IN99635005222222                                  MARLIN                        TOM                           324 Fantasy Ln                                              Shreveport               LA7112900001901010100001          202201022023010220220413180000001588000000043900Y000117600+000000000+               00000 MARLIN                        TOM                                                                                                                                               '
        ];
        const recordType = 'B';
        const new_batch_number = 123;
        const trailer = 'TRAILER             55555BIN01IN99001202408052024080520240805P&C00000000500000000390100+                                                                                                                                                                                                                                                                                                                                                                                                                             ';
    
        const result = createNewTrailer(chunk, recordType, new_batch_number, trailer);
    
    
        const expectedTrailer = 'TRAILER             55555BIN01IN99123202408052024080520240805P&C00000000200000000311700+                                                                                                                                                                                                                                                                                                                                                                                                                             ';
        expect(result).to.equal(expectedTrailer);
    });

    it('should create a new trailer for record type F correctly', function () {
        const chunk = [
            'F55555IN991234560                                          .....',
            'F55555IN991234560                                          .....'
        ];
        const recordType = 'F';
        const new_batch_number = 123;
        const trailer = 'TRAILER             55555FIN01IN99001202408052024080520240805P&C000000002000000000000000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             ';
    
        const result = createNewTrailer(chunk, recordType, new_batch_number, trailer);
    
    
        const expectedTrailer = 'TRAILER             55555FIN01IN99123202408052024080520240805P&C000000002000000000000000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             ';
        expect(result).to.equal(expectedTrailer);
    });

    it('should create a new trailer for record type G correctly', function () {
        const chunk = [
            'G55555IN99965005333333              1234567                                           Ralph Steadman                                              00001Steadman                      Ralph                         1999010131000000002360+000000000001Holladay                                                                                                                                                                                                                         ',
            'G55555IN99965005333333              1234567                                           Ralph Steadman                                              00001Steadman                      Ralph                         1999010141000000002360+000000000002Holladay                                                                                                                                                                                                                         '
        ];
        const recordType = 'G';
        const new_batch_number = 123;
        const trailer = 'TRAILER             55555GIN01IN99001202408052024080520240805P&C00000000500000000011800+                                                                                                                                                                                                                                                                                                                                                                                               ';
    
        const result = createNewTrailer(chunk, recordType, new_batch_number, trailer);
    
    
        const expectedTrailer = 'TRAILER             55555GIN01IN99123202408052024080520240805P&C00000000200000000004720+                                                                                                                                                                                                                                                                                                                                                                                               ';
        expect(result).to.equal(expectedTrailer);
    });

    it('should create a new trailer for record type I correctly', function () {
        const chunk = [
            'I55555IN011234567                                                                                                                                                                                                                                                                                                                                                                2010010100000000                                                                                                                                                                    333333              20090622Ralph Steadman                                              00001Steadman                      Ralph                         \Images\test\                                                                                                                                                                                                                                                   one.txt                                                                                                                                                                                                                                                         txt ',
            'I55555IN011234567                                                                                                                                                                                                                                                                                                                                                                2010010100000000                                                                                                                                                                    333333              20090622Ralph Steadman                                              00001Steadman                      Ralph                         \Images\test\                                                                                                                                                                                                                                                   two.txt                                                                                                                                                                                                                                                         txt '
        ];
        const recordType = 'I';
        const new_batch_number = 123;
        const trailer = 'TRAILER             55555IIN01IN99001202408052024080520240805P&C000000002000000000000000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ';
    
        const result = createNewTrailer(chunk, recordType, new_batch_number, trailer);
    
    
        const expectedTrailer = 'TRAILER             55555IIN01IN99123202408052024080520240805P&C000000002000000000000000                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          ';
        expect(result).to.equal(expectedTrailer);
    });

    it('should not create a new trailer for an invalid record type', function () {
        const chunk = ['Some data'];
        const recordType = 'Z';  // Invalid type
        const new_batch_number = 123;
        const trailer = 'TRAILER             55555AIN01IN99001202407012024070120240701P&C00000000500000006000490+                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   ';

        expect(() => createNewTrailer(chunk, recordType, new_batch_number, trailer)).to.throw(Error, `UDS filename is using an invalid record type: ${recordType}`);
    });
});

describe('padDigitsServer', function () {
    it('should pad a number with leading zeros to the specified number of digits', function () {
        expect(padDigitsServer(5, 3)).to.equal('005');
        expect(padDigitsServer(42, 5)).to.equal('00042');
        expect(padDigitsServer(123, 2)).to.equal('123'); // No padding needed, as 123 is already 3 digits
    });

    it('should handle cases where the number has more digits than the specified length', function () {
        expect(padDigitsServer(1234, 3)).to.equal('1234'); // No padding needed, as 1234 is already 4 digits
        expect(padDigitsServer(987654, 5)).to.equal('987654'); // No padding needed, as 987654 is already 6 digits
    });

    it('should return "0" if number is 0 and digits is 1', function () {
        expect(padDigitsServer(0, 1)).to.equal('0');
    });

    it('should return "00000" for number 0 and digits 5', function () {
        expect(padDigitsServer(0, 5)).to.equal('00000');
    });

    it('should return "000000" for number 0 and digits 6', function () {
        expect(padDigitsServer(0, 6)).to.equal('000000');
    });
});

describe('createNewHeader', function () {
    it('should correctly replace the batch number in the header with no padding needed', function () {
        const new_batch_number = 123;
        const header = ' '.repeat(34) + '000' + ' '.repeat(10);
        const expectedHeader = ' '.repeat(34) + '123' + ' '.repeat(10);

        const result = createNewHeader(new_batch_number, header);
        expect(result).to.equal(expectedHeader);
    });
});

describe('convertUDSCurrencyToFloat', function () {
    it('should correctly convert a positive UDS currency string to a float', function () {
        const amountString = '00001385806+'; // Represents 13858.06
        const result = convertUDSCurrencyToFloat(amountString);
        expect(result).to.equal(13858.06);
    });

    it('should correctly convert a negative UDS currency string to a float', function () {
        const amountString = '00001385806-'; // Represents -13858.06
        const result = convertUDSCurrencyToFloat(amountString);
        expect(result).to.equal(-13858.06);
    });

    it('should handle zero value correctly', function () {
        const amountString = '00000000000+'; // Represents 0.00
        const result = convertUDSCurrencyToFloat(amountString);
        expect(result).to.equal(0.00);
    });

    it('should handle large numbers correctly', function () {
        const amountString = '99999999999+'; // Represents 999999999.99
        const result = convertUDSCurrencyToFloat(amountString);
        expect(result).to.equal(999999999.99);
    });

    it('should handle negative large numbers correctly', function () {
        const amountString = '99999999999-'; // Represents -999999999.99
        const result = convertUDSCurrencyToFloat(amountString);
        expect(result).to.equal(-999999999.99);
    });
});

describe('convertFloatToUDSCurrency', function () {
    it('should correctly convert a positive float to a UDS currency string', function () {
        const amount = 13858.06;
        const result = convertFloatToUDSCurrency(amount);
        expect(result).to.equal('00000001385806+');
    });

    it('should correctly convert a negative float to a UDS currency string', function () {
        const amount = -13858.06;
        const result = convertFloatToUDSCurrency(amount);
        expect(result).to.equal('00000001385806-')
    });

    it('should correctly convert zero to a UDS currency string', function () {
        const amount = 0.00;
        const result = convertFloatToUDSCurrency(amount);
        expect(result).to.equal('00000000000000+');
    });

    it('should handle small positive numbers correctly', function () {
        const amount = 0.01;
        const result = convertFloatToUDSCurrency(amount);
        expect(result).to.equal('00000000000001+');
    });

    it('should handle small negative numbers correctly', function () {
        const amount = -0.01;
        const result = convertFloatToUDSCurrency(amount);
        expect(result).to.equal('00000000000001-');
    });

    it('should handle large positive numbers correctly', function () {
        const amount = 999999999.99;
        const result = convertFloatToUDSCurrency(amount);
        expect(result).to.equal('00099999999999+');
    });

    it('should handle large negative numbers correctly', function () {
        const amount = -999999999.99;
        const result = convertFloatToUDSCurrency(amount);
        expect(result).to.equal('00099999999999-');
    });
});

describe('trim', function () {
    it('should trim the specified character from the start and end of the string', function () {
        const result = trim('/hello world/', '/');
        expect(result).to.equal('hello world');
    });

    it('should handle trimming a single character from the start and end of the string', function () {
        const result = trim('---hello---', '-');
        expect(result).to.equal('hello');
    });

    it('should handle trimming backslashes', function () {
        const result = trim('\\\\path\\\\', '\\');
        expect(result).to.equal('path');
    });

    it('should handle trimming spaces', function () {
        const result = trim('   hello world   ', ' ');
        expect(result).to.equal('hello world');
    });

    it('should return the original string if the character is not found at the start or end', function () {
        const result = trim('hello world', '/');
        expect(result).to.equal('hello world');
    });

    it('should return an empty string if the entire string consists of the character to be trimmed', function () {
        const result = trim('////', '/');
        expect(result).to.equal('');
    });

    it('should handle trimming multiple characters', function () {
        const result = trim('---hello---world---', '-');
        expect(result).to.equal('hello---world');
    });
});

describe('join_path_parts', function () {
    if(sep === "/") {
        it('should join path parts with appropriate separators', function () {
        const result = join_path_parts('/home/', '/user/', 'documents/', '/file.txt/');
        expect(result).to.equal('home/user/documents/file.txt');
        });
    } 
    else {
        it('should handle path parts with mixed separators', function () {
        const result = join_path_parts('C:\\', 'Users\\', 'John\\', 'Documents\\', 'file.txt');
        expect(result).to.equal('C:\\Users\\John\\Documents\\file.txt');
        });
    }
  });

  describe('wait_for_zip_to_populate', function () {

it('should wait until the zip has at least one entry', async function () {
    // Mock ZIP object with an initial entry count of 0
    let zip = { getEntryCount: () => 0 };

    // Create a promise that resolves after a short delay
    const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

    // Create a function to simulate adding an entry to the ZIP object
    const addEntryAfterDelay = async (zip) => {
        await delay(500); // Simulate delay
        zip.getEntryCount = () => 1; // Simulate having one entry
    };

    // Start adding an entry after a delay
    addEntryAfterDelay(zip);

    // Measure the time taken to run the function
    const start = Date.now();
    
    // Call the function to wait for the ZIP to populate
    await wait_for_zip_to_populate(zip);
    
    const end = Date.now();
    const duration = end - start;

    // Assert that the function completed within a reasonable time
    expect(duration).to.be.lessThan(1000); // Ensure it completes in under 1 second

    // Assert that the zip object now has at least one entry
    expect(zip.getEntryCount()).to.equal(1);
});

});

describe('getClaimNumber', function () {
    it('should extract claim number for record type A', function () {
        const line = ' '.repeat(36) + '12345678901234567890' + ' '.repeat(20); 
        const recordType = 'A';
        const claimNumber = getClaimNumber(line, recordType);
        expect(claimNumber).to.equal('12345678901234567890');
    });

    it('should extract claim number for record type B', function () {
        const line = ' '.repeat(16) + '09876543210987654321' + ' '.repeat(20); 
        const recordType = 'B';
        const claimNumber = getClaimNumber(line, recordType);
        expect(claimNumber).to.equal('09876543210987654321');
    });

    it('should extract claim number for record type F', function () {
        const line = ' '.repeat(10) + 'FEDCBA98765432109876543210' + ' '.repeat(10);  
        const recordType = 'F';
        const claimNumber = getClaimNumber(line, recordType);
        expect(claimNumber).to.equal('FEDCBA98765432109876543210');
    });

    it('should extract claim number for record type G', function () {
        const line = ' '.repeat(36) + 'G1234567890123456789012345678' + ' '.repeat(10);  
        const recordType = 'G';
        const claimNumber = getClaimNumber(line, recordType);
        expect(claimNumber).to.equal('G1234567890123456789012345678');
    });

    it('should extract claim number for record type I', function () {
        const line = ' '.repeat(10) + 'I1234567890123456789' + ' '.repeat(10);  
        const recordType = 'I';
        const claimNumber = getClaimNumber(line, recordType);
        expect(claimNumber).to.equal('I1234567890123456789');
    });

    it('should throw an error for an invalid record type', function () {
        const line = 'Some data';
        const recordType = 'Z';  // Invalid type
        expect(() => getClaimNumber(line, recordType)).to.throw(Error, 'UDS filename is using an invalid record type');
    });
});

describe('sortFileByClaim', function () {
    it('should sort lines by claim number for record type A', function () {
        const lines = [
            ' '.repeat(36) + '000002' + ' '.repeat(44),
            ' '.repeat(36) + '000001' + ' '.repeat(44),
            ' '.repeat(36) + '000003' + ' '.repeat(44),
        ];
        const recordType = 'A';
        const { sortedLines, uniqueClaims } = sortFileByClaim(lines, recordType);

        expect(sortedLines.map(line => line.substring(36, 56).trim())).to.deep.equal(['000001', '000002', '000003']);
        expect(uniqueClaims).to.equal(3);
    });

    it('should sort lines by claim number for record type B', function () {
        const lines = [
            ' '.repeat(16) + '000004' + ' '.repeat(54),
            ' '.repeat(16) + '000002' + ' '.repeat(54),
            ' '.repeat(16) + '000003' + ' '.repeat(54),
        ];
        const recordType = 'B';
        const { sortedLines, uniqueClaims } = sortFileByClaim(lines, recordType);

        expect(sortedLines.map(line => line.substring(16, 36).trim())).to.deep.equal(['000002', '000003', '000004']);
        expect(uniqueClaims).to.equal(3);
    });

    it('should sort lines by claim number for record type F', function () {
        const lines = [
            ' '.repeat(10) + '000006' + ' '.repeat(50),
            ' '.repeat(10) + '000005' + ' '.repeat(50),
            ' '.repeat(10) + '000001' + ' '.repeat(50),
        ];
        const recordType = 'F';
        const { sortedLines, uniqueClaims } = sortFileByClaim(lines, recordType);

        expect(sortedLines.map(line => line.substring(10, 40).trim())).to.deep.equal(['000001', '000005', '000006']);
        expect(uniqueClaims).to.equal(3);
    });

    it('should sort lines by claim number for record type G', function () {
        const lines = [
            ' '.repeat(36) + '000008' + ' '.repeat(30),
            ' '.repeat(36) + '000007' + ' '.repeat(30),
            ' '.repeat(36) + '000009' + ' '.repeat(30),
        ];
        const recordType = 'G';
        const { sortedLines, uniqueClaims } = sortFileByClaim(lines, recordType);

        expect(sortedLines.map(line => line.substring(36, 66).trim())).to.deep.equal(['000007', '000008', '000009']);
        expect(uniqueClaims).to.equal(3);
    });

    it('should sort lines by claim number for record type I', function () {
        const lines = [
            ' '.repeat(10) + '000011' + ' '.repeat(50),
            ' '.repeat(10) + '000010' + ' '.repeat(50),
            ' '.repeat(10) + '000012' + ' '.repeat(50),
        ];
        const recordType = 'I';
        const { sortedLines, uniqueClaims } = sortFileByClaim(lines, recordType);

        expect(sortedLines.map(line => line.substring(10, 30).trim())).to.deep.equal(['000010', '000011', '000012']);
        expect(uniqueClaims).to.equal(3);
    });

    it('should throw an error for an invalid record type', function () {
        const lines = ['Some data'];
        const recordType = 'Z';  // Invalid type
        expect(() => sortFileByClaim(lines, recordType)).to.throw(Error, 'UDS filename is using an invalid record type');
    });
});

describe('convert_form_data_to_dict', () => {
    it('should convert FormData to a dictionary', () => {
      const formData = new FormData();
      formData.append('key1', 'value1');
      formData.append('key2', 'value2');
  
      const result = convert_form_data_to_dict(formData);
      expect(result).to.deep.equal({
        key1: 'value1',
        key2: 'value2'
      });
    });
  
    it('should handle empty FormData', () => {
      const formData = new FormData();
      const result = convert_form_data_to_dict(formData);
      expect(result).to.deep.equal({});
    });
  
    it('should handle multiple values for the same key', () => {
      const formData = new FormData();
      formData.append('key1', 'value1');
      formData.append('key1', 'value2');
  
      const result = convert_form_data_to_dict(formData);
      expect(result).to.deep.equal({
        key1: 'value2'  // The last value for the same key should overwrite the previous one
      });
    });
  
    it('should handle non-string values', () => {
      const formData = new FormData();
      formData.append('key1', 123);
      formData.append('key2', true);
  
      const result = convert_form_data_to_dict(formData);
      expect(result).to.deep.equal({
        key1: '123',  // FormData converts values to strings
        key2: 'true'
      });
    });
  });

describe('file_sep', () => {
    it('should return "\\" for Windows paths with a volume letter', () => {
        const result = file_sep('C:\\Users\\Test\\file.txt');
        expect(result).to.equal('\\');
    });

    it('should return "/" for Unix-style paths starting with a slash', () => {
        const result = file_sep('/home/user/file.txt');
        expect(result).to.equal('/');
    });

    it('should return "\\" for Windows paths without a volume letter', () => {
        const result = file_sep('Users\\Test\\file.txt');
        expect(result).to.equal('\\');
    });

    it('should return "/" for Unix-style paths with no leading slash', () => {
        const result = file_sep('home/user/file.txt');
        expect(result).to.equal('/');
    });

    it('should throw an error if the file path separator is ambiguous', () => {
        expect(() => file_sep('file.txt')).to.throw(Error, `Not sure what file path separator we are using: 'file.txt'`);
    });

    it('should handle mixed paths by returning the first detected separator', () => {
        const result1 = file_sep('C:\\Users\\Test\\file.txt');
        expect(result1).to.equal('\\');
        
        const result2 = file_sep('/home/user/file.txt');
        expect(result2).to.equal('/');
    });
});

describe('get_directory_from_path', () => {
    it('should return the directory for a Windows-style path', () => {
      const result = get_directory_from_path('C:\\Users\\Test\\file.txt');
      expect(result).to.equal('C:\\Users\\Test');
    });
  
    it('should return the directory for a Unix-style path', () => {
      const result = get_directory_from_path('/home/user/file.txt');
      expect(result).to.equal('/home/user');
    });
  
    it('should return the directory for a Windows path with no volume letter', () => {
      const result = get_directory_from_path('Users\\Test\\file.txt');
      expect(result).to.equal('Users\\Test');
    });
  
    it('should return the directory for a Unix-style path with no leading slash', () => {
      const result = get_directory_from_path('home/user/file.txt');
      expect(result).to.equal('home/user');
    });

    //  TODO: should this be accounted for?
    // it('should return an empty string if there is no directory component in the path', () => {
    //   const result = get_directory_from_path('file.txt');
    //   expect(result).to.equal('');
    // });
  
    it('should handle paths that end with a slash or backslash correctly', () => {
      const result1 = get_directory_from_path('C:\\Users\\Test\\');
      expect(result1).to.equal('C:\\Users\\Test');
  
      const result2 = get_directory_from_path('/home/user/');
      expect(result2).to.equal('/home/user');
    });
});

describe('is_null_or_empty', () => {
    it('should return true for null', () => {
      const result = is_null_or_empty(null);
      expect(result).to.be.true;
    });
  
    it('should return true for undefined', () => {
      const result = is_null_or_empty(undefined);
      expect(result).to.be.true;
    });
  
    it('should return true for an empty string', () => {
      const result = is_null_or_empty('');
      expect(result).to.be.true;
    });
  
    it('should return true for a string with only spaces', () => {
      const result = is_null_or_empty('   ');
      expect(result).to.be.true;
    });
  
    it('should return false for a non-empty string', () => {
      const result = is_null_or_empty('test');
      expect(result).to.be.false;
    });
  
    it('should return false for a number', () => {
      const result = is_null_or_empty(123);
      expect(result).to.be.false;
    });
  
    it('should return false for an object', () => {
      const result = is_null_or_empty({ key: 'value' });
      expect(result).to.be.false;
    });
  
    it('should return false for an array', () => {
      const result = is_null_or_empty([1, 2, 3]);
      expect(result).to.be.false;
    });
  
  });

describe('padDigitsLocal', function () {
    it('should pad a number with leading zeros to the specified number of digits', function () {
        expect(padDigitsLocal(5, 3)).to.equal('005');
        expect(padDigitsLocal(42, 5)).to.equal('00042');
        expect(padDigitsLocal(123, 2)).to.equal('123'); // No padding needed, as 123 is already 3 digits
    });

    it('should handle cases where the number has more digits than the specified length', function () {
        expect(padDigitsLocal(1234, 3)).to.equal('1234'); // No padding needed, as 1234 is already 4 digits
        expect(padDigitsLocal(987654, 5)).to.equal('987654'); // No padding needed, as 987654 is already 6 digits
    });

    it('should return "0" if number is 0 and digits is 1', function () {
        expect(padDigitsLocal(0, 1)).to.equal('0');
    });

    it('should return "00000" for number 0 and digits 5', function () {
        expect(padDigitsLocal(0, 5)).to.equal('00000');
    });

    it('should return "000000" for number 0 and digits 6', function () {
        expect(padDigitsLocal(0, 6)).to.equal('000000');
    });
});

//helper to verify the zip is being made
async function verify_zip_then_delete(file_path) {
    try {
        const zip = new AdmZip(file_path);
        const zipEntries = zip.getEntries();

        await rm(file_path);
        console.debug(`Deleting ${file_path}`);
        return zipEntries.length
    } catch (error) {
        console.error(error);
    }
}

describe('create_zip_files', function() {
    it('should process and parse the zip given the UDS file paths', async function() {
        const __filename = fileURLToPath(import.meta.url);
        const __dirname = dirname(__filename);
        const original_zip_file = resolve(__dirname, './input_files/55555IIN01IN9900120240805.zip');
        const final_uds_file_paths = [
            resolve(__dirname, './input_files/55555IIN01IN9900120240805-1.txt')
        ];

        await create_zip_files(original_zip_file, final_uds_file_paths);
        const new_zip_file_path = resolve(__dirname, './input_files/55555IIN01IN9900120240805-1.zip');
        const result = await verify_zip_then_delete(new_zip_file_path);
        expect(result).to.equal(2);
    });

    // apparently since this is async, it needs to use 'chai-as-promised' but I'm not going to bother with another installed library for one test that should be negative
    // it('should throw an error if the expected path in the UDS is not present in the zip', async function() {
    //     const __filename = fileURLToPath(import.meta.url);
    //     const __dirname = dirname(__filename);
    //     const original_zip_file = resolve(__dirname, './input_files/55555IIN01IN9900120240805.zip');
    //     const final_uds_file_paths = [
    //         resolve(__dirname, './input_files/77777IIN01IN9900120240805-1.txt')
    //     ];

    //     await expect(create_zip_files(original_zip_file, final_uds_file_paths))
    //         .to.throw(Error, '\\Images\\test\\one.txt is not in an a resulting UDS file. Are you sure the ZIP goes with the UDS file?');
    // });
});