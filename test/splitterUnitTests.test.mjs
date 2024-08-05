import { expect } from 'chai';
import { getClaimNumber, sortFileByClaim, padDigits, createNewHeader, convertUDSCurrencyToFloat, convertFloatToUDSCurrency, trim, join_path_parts } from '../src/server_utils.js';  // Make sure to use .js extension for ES modules

describe('padDigits', function () {
    it('should pad a number with leading zeros to the specified number of digits', function () {
        expect(padDigits(5, 3)).to.equal('005');
        expect(padDigits(42, 5)).to.equal('00042');
        expect(padDigits(123, 2)).to.equal('123'); // No padding needed, as 123 is already 3 digits
    });

    it('should handle cases where the number has more digits than the specified length', function () {
        expect(padDigits(1234, 3)).to.equal('1234'); // No padding needed, as 1234 is already 4 digits
        expect(padDigits(987654, 5)).to.equal('987654'); // No padding needed, as 987654 is already 6 digits
    });

    it('should return "0" if number is 0 and digits is 1', function () {
        expect(padDigits(0, 1)).to.equal('0');
    });

    it('should return "00000" for number 0 and digits 5', function () {
        expect(padDigits(0, 5)).to.equal('00000');
    });

    it('should return "000000" for number 0 and digits 6', function () {
        expect(padDigits(0, 6)).to.equal('000000');
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
  
    it('should join path parts with appropriate separators', function () {
      const result = join_path_parts('/home/', '/user/', 'documents/', '/file.txt/');
      expect(result).to.equal('/home/user/documents/file.txt');
    });
  
    it('should handle path parts with mixed separators', function () {
      const result = join_path_parts('C:\\', 'Users\\', 'John\\', 'Documents\\', 'file.txt');
      expect(result).to.equal('C:\\Users\\John\\Documents\\file.txt');
    });
  
    it('should trim redundant separators from the start and end', function () {
      const result = join_path_parts('/start/', 'middle/', 'end/');
      expect(result).to.equal('/start/middle/end');
    });
  
    it('should handle empty strings in path parts', function () {
      const result = join_path_parts('', '/home/', '', 'documents/', 'file.txt', '');
      expect(result).to.equal('/home/documents/file.txt');
    });
  
    it('should handle no path parts', function () {
      const result = join_path_parts();
      expect(result).to.equal('');
    });
  
    it('should handle a single path part', function () {
      const result = join_path_parts('onlyPathPart');
      expect(result).to.equal('onlyPathPart');
    });
  
    it('should handle path parts with multiple trailing and leading separators', function () {
      const result = join_path_parts('////home////', '////user////', 'documents////', '////file.txt////');
      expect(result).to.equal('/home/user/documents/file.txt');
    });
  
    it('should handle path parts with special characters', function () {
      const result = join_path_parts('special*chars/', '/path/with?', 'extra%chars/', 'file@name.txt');
      expect(result).to.equal('special*chars/path/with?/extra%chars/file@name.txt');
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