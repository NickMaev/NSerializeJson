"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isStringJsonObject(arg) {
    try {
        JSON.parse(arg);
        return true;
    }
    catch (e) { }
    return false;
}
exports.isStringJsonObject = isStringJsonObject;
function isArray(arg) {
    return Array.isArray(arg);
}
exports.isArray = isArray;
function isStringNumber(arg) {
    return typeof arg == 'number' || /^[-+]?\d+([Ee][+-]?\d+)?(\.\d+)?$/.test(arg);
}
exports.isStringNumber = isStringNumber;
function isStringInteger(arg) {
    return /^[-+]?\d+([Ee][+-]?\d+)?$/.test(arg);
}
exports.isStringInteger = isStringInteger;
function isStringNullOrEmpty(arg) {
    return arg == null || arg.trim() === "";
}
exports.isStringNullOrEmpty = isStringNullOrEmpty;
exports.nodeListToArray = function (nodeList) {
    return Array.prototype.slice.call(nodeList);
};
//# sourceMappingURL=Util.js.map