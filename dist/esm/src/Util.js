export function isStringJsonObject(arg) {
    try {
        JSON.parse(arg);
        return true;
    }
    catch (e) { }
    return false;
}
export function isArray(arg) {
    return Array.isArray(arg);
}
export function isStringNumber(arg) {
    return typeof arg == 'number' || /^[-+]?\d+([Ee][+-]?\d+)?(\.\d+)?$/.test(arg);
}
export function isStringInteger(arg) {
    return /^[-+]?\d+([Ee][+-]?\d+)?$/.test(arg);
}
export function isStringNullOrEmpty(arg) {
    return arg == null || arg.trim() === "";
}
export var nodeListToArray = function (nodeList) {
    return Array.prototype.slice.call(nodeList);
};
//# sourceMappingURL=Util.js.map