"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("./Util");
var ParserList_1 = require("./ParserList");
var Constants_1 = require("./Constants");
var NSerializeJson = (function () {
    function NSerializeJson() {
    }
    NSerializeJson.parseValue = function (options, parsers, value, type) {
        if (Util_1.isStringNullOrEmpty(type)) {
            var autoParser = this.parsers.filter(function (x) { return x.name === "auto"; })[0];
            return autoParser.parse(value, options.forceNullOnEmpty);
        }
        var parser = this.parsers.filter(function (x) { return x.name === type; })[0];
        if (parser == null) {
            throw Constants_1.pluginName + ": couldn't find ther parser for type '" + type + "'.";
        }
        return parser.parse(value, options.forceNullOnEmpty);
    };
    NSerializeJson.serializeForm = function (htmlFormElement, options, parsers) {
        var _this = this;
        if (options == null) {
            options = this.options;
        }
        else {
            options = __assign({}, this.options, options);
        }
        if (parsers == null) {
            parsers = this.parsers;
        }
        else {
            if (!Array.isArray(parsers)) {
                throw Error("'parsers' arg in 'serializeForm' method must be an array or null.");
            }
            parsers = __assign({}, this.parsers, parsers);
        }
        var nodeList = htmlFormElement.querySelectorAll("input, select, textarea");
        var htmlInputElements = Util_1.nodeListToArray(nodeList);
        var checkedElements = htmlInputElements.filter(function (x) {
            if (x.disabled ||
                ((x.getAttribute("type") === "radio" && !x.checked) ||
                    (x.getAttribute("type") === "checkbox" && !x.checked))) {
                return false;
            }
            return true;
        });
        var resultObject = {};
        checkedElements.forEach(function (x) { return _this.serializeIntoObject(options, parsers, resultObject, x); });
        return resultObject;
    };
    NSerializeJson.serializeIntoObject = function (options, parsers, obj, htmlElement) {
        var value = null;
        if (htmlElement.tagName.toLowerCase() === "select") {
            var firstSelectOpt = Array.from(htmlElement.options).filter(function (x) { return x.selected; })[0];
            if (firstSelectOpt) {
                value = firstSelectOpt.getAttribute("value");
            }
        }
        else {
            value = htmlElement.value;
        }
        var pathStr = htmlElement.getAttribute("name");
        if (Util_1.isStringNullOrEmpty(pathStr))
            return obj;
        var path = [];
        var type = null;
        var typeIndex = pathStr.indexOf(":");
        if (typeIndex > -1) {
            type = pathStr.substring(typeIndex + 1, pathStr.length);
            if (type === "skip") {
                return obj;
            }
            pathStr = pathStr.substring(0, typeIndex);
        }
        else {
            type = htmlElement.getAttribute("data-value-type");
        }
        if (options.onBeforeParseValue != null) {
            value = options.onBeforeParseValue(value, type);
        }
        var parsedValue = this.parseValue(options, parsers, value, type);
        if (options.useDotSeparatorInPath) {
            var addArrayToPath = false;
            path = pathStr.split(".");
            var pathIndexShift = 0;
            for (var index = 0; index < path.length; index++) {
                var step = path[index + pathIndexShift];
                if (step === undefined)
                    continue;
                var indexOfBrackets = step.indexOf("[]");
                if (indexOfBrackets === -1) {
                    var leftBracketIndex = step.indexOf("["), rightBracketIndex = step.indexOf("]");
                    if (leftBracketIndex !== -1 && rightBracketIndex !== -1) {
                        var arrayContent = step.slice(leftBracketIndex + 1, rightBracketIndex);
                        path[index + pathIndexShift] = step.replace("[" + arrayContent + "]", "");
                        if (!Util_1.isStringNullOrEmpty(arrayContent) && !Util_1.isStringInteger(arrayContent)) {
                            throw Error("Path '" + pathStr + "' must be empty or contain a number in array brackets.");
                        }
                        if (arrayContent) {
                            path.splice(index + pathIndexShift + 1, 0, arrayContent);
                        }
                        pathIndexShift++;
                    }
                }
                else {
                    if (index !== path.length - 1) {
                        if (indexOfBrackets > -1 && indexOfBrackets !== path.length - 1) {
                            throw Constants_1.pluginName + ": error in path '" + pathStr + "' empty values in the path mean array and should be at the end.";
                        }
                    }
                    else {
                        if (indexOfBrackets > -1) {
                            path[index + pathIndexShift] = step.replace("[]", "");
                            addArrayToPath = true;
                        }
                    }
                }
            }
            if (addArrayToPath) {
                path.push("");
            }
        }
        else {
            path = pathStr.split("[").map(function (x, i) { return x.replace("]", ""); });
            path.forEach(function (step, index) {
                if (index !== path.length - 1 && Util_1.isStringNullOrEmpty(step))
                    throw Constants_1.pluginName + ": error in path '" + pathStr + "' empty values in the path mean array and should be at the end.";
            });
        }
        this.searchAndSet(options, obj, path, 0, parsedValue);
        return obj;
    };
    NSerializeJson.searchAndSet = function (options, currentObj, path, pathIndex, parsedValue, arrayInternalIndex) {
        if (arrayInternalIndex === void 0) { arrayInternalIndex = 0; }
        var step = path[pathIndex];
        var isFinalStep = pathIndex === path.length - 1;
        var nextStep = path[pathIndex + 1];
        if (currentObj == null || typeof currentObj == "string") {
            path = path.map(function (x) { return Util_1.isStringNullOrEmpty(x) ? "[]" : x; });
            console.log(Constants_1.pluginName + ": there was an error in path '" + path + "' in step '" + step + "'.");
            throw Constants_1.pluginName + ": error.";
        }
        console.log("-----------------------");
        var isArrayStep = Util_1.isStringNullOrEmpty(step);
        var isIntegerStep = Util_1.isStringInteger(step);
        var isNextStepAnArray = Util_1.isStringInteger(nextStep) || nextStep == "";
        if (isArrayStep) {
            if (isFinalStep) {
                currentObj.push(parsedValue);
                return;
            }
            else {
                if (currentObj[arrayInternalIndex] == null) {
                    currentObj[arrayInternalIndex] = {};
                }
                step = arrayInternalIndex;
                arrayInternalIndex++;
            }
        }
        else if (isIntegerStep && options.useNumKeysAsArrayIndex) {
            var arrayKey = parseInt(step);
            if (!Util_1.isArray(currentObj)) {
                currentObj = [];
            }
            if (isFinalStep) {
                currentObj[arrayKey] = parsedValue;
                return;
            }
            else {
                if (currentObj[arrayKey] == null) {
                    currentObj[arrayKey] = {};
                }
            }
        }
        else {
            if (isFinalStep) {
                currentObj[step] = parsedValue;
                return;
            }
            else {
                if (options.useNumKeysAsArrayIndex) {
                    if (isNextStepAnArray) {
                        if (!Util_1.isArray(currentObj[step]))
                            currentObj[step] = [];
                    }
                    else {
                        if (currentObj[step] == null)
                            currentObj[step] = {};
                    }
                }
                else {
                    if (currentObj[step] == null)
                        currentObj[step] = {};
                }
            }
        }
        pathIndex++;
        this.searchAndSet(options, currentObj[step], path, pathIndex, parsedValue, arrayInternalIndex);
    };
    NSerializeJson.options = {
        useNumKeysAsArrayIndex: true,
        useDotSeparatorInPath: false,
        forceNullOnEmpty: false
    };
    NSerializeJson.parsers = ParserList_1.parserList.slice();
    return NSerializeJson;
}());
exports.NSerializeJson = NSerializeJson;
//# sourceMappingURL=NSerializeJson.js.map