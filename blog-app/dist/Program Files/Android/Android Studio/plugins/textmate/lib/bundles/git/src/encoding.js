"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.detectEncoding = void 0;
const jschardet = require("jschardet");
function detectEncodingByBOM(buffer) {
    if (!buffer || buffer.length < 2) {
        return null;
    }
    const b0 = buffer.readUInt8(0);
    const b1 = buffer.readUInt8(1);
    if (b0 === 0xFE && b1 === 0xFF) {
        return 'utf16be';
    }
    if (b0 === 0xFF && b1 === 0xFE) {
        return 'utf16le';
    }
    if (buffer.length < 3) {
        return null;
    }
    const b2 = buffer.readUInt8(2);
    if (b0 === 0xEF && b1 === 0xBB && b2 === 0xBF) {
        return 'utf8';
    }
    return null;
}
const IGNORE_ENCODINGS = [
    'ascii',
    'utf-8',
    'utf-16',
    'utf-32'
];
const JSCHARDET_TO_ICONV_ENCODINGS = {
    'ibm866': 'cp866',
    'big5': 'cp950'
};
function detectEncoding(buffer) {
    let result = detectEncodingByBOM(buffer);
    if (result) {
        return result;
    }
    const detected = jschardet.detect(buffer);
    if (!detected || !detected.encoding) {
        return null;
    }
    const encoding = detected.encoding;
    if (0 <= IGNORE_ENCODINGS.indexOf(encoding.toLowerCase())) {
        return null;
    }
    const normalizedEncodingName = encoding.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    const mapped = JSCHARDET_TO_ICONV_ENCODINGS[normalizedEncodingName];
    return mapped || normalizedEncodingName;
}
exports.detectEncoding = detectEncoding;
//# sourceMappingURL=encoding.js.map