"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("./Util");
exports.parserList = [
    {
        name: "auto",
        parse: function (val, forceNull) {
            if (Util_1.isStringNullOrEmpty(val)) {
                return forceNull ? null : val;
            }
            var result = val.toString().trim();
            if (result.toLowerCase() === "null")
                return null;
            try {
                result = JSON.parse(result);
                return result;
            }
            catch (e) {
            }
            var array = result.split(",");
            if (array.length > 1) {
                result = array.map(function (x) {
                    if (Util_1.isStringNumber(x)) {
                        return parseFloat(x);
                    }
                    else if (Util_1.isStringJsonObject(x)) {
                        return JSON.parse(x);
                    }
                    return x.trim();
                });
            }
            return result;
        }
    },
    {
        name: "number",
        parse: function (val, forceNull) {
            if (Util_1.isStringNullOrEmpty(val)) {
                return forceNull ? null : 0;
            }
            if (Util_1.isStringNumber(val)) {
                return parseFloat(val);
            }
            return 0;
        }
    },
    {
        name: "boolean",
        parse: function (val, forceNull) {
            if (Util_1.isStringNullOrEmpty(val)) {
                return forceNull ? null : false;
            }
            val = val.toString().toLowerCase();
            if (val === "true" || val === "1") {
                return true;
            }
            return false;
        }
    },
    {
        name: "string",
        parse: function (val, forceNull) {
            if (Util_1.isStringNullOrEmpty(val)) {
                return null;
            }
            var result = val.toString().trim();
            if (result.toLowerCase() === "null" || (result === "" && forceNull))
                return null;
            return result;
        }
    },
    {
        name: "array[auto]",
        parse: function (val, forceNull) {
            if (Util_1.isStringNullOrEmpty(val)) {
                if (forceNull)
                    return null;
                return [];
            }
            return val.split(",").map(function (x) {
                var parser = exports.parserList.filter(function (x) { return x.name === "auto"; })[0];
                return parser.parse(x.trim(), forceNull);
            });
        }
    },
    {
        name: "array[string]",
        parse: function (val, forceNull) {
            if (Util_1.isStringNullOrEmpty(val)) {
                if (forceNull)
                    return null;
                return [];
            }
            return val.split(",").map(function (x) { return x.trim().toString(); });
        }
    },
    {
        name: "array[number]",
        parse: function (val, forceNull) {
            if (Util_1.isStringNullOrEmpty(val)) {
                if (forceNull)
                    return null;
                return [];
            }
            return val.split(",").map(function (x) { return parseFloat(x.trim()); });
        }
    },
    {
        name: "json",
        parse: function (val, forceNull) {
            if (Util_1.isStringNullOrEmpty(val)) {
                if (forceNull)
                    return null;
                return {};
            }
            return JSON.parse(val);
        }
    }
];
//# sourceMappingURL=ParserList.js.map