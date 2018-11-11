"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Util_1 = require("./Util");
var ParserList_1 = require("./ParserList");
var Constants_1 = require("./Constants");
var NSerializeJson = (function () {
    function NSerializeJson() {
    }
    NSerializeJson.parseValue = function (value, type) {
        if (Util_1.isStringNullOrEmpty(type)) {
            var autoParser = this.parsers.filter(function (x) { return x.name === "auto"; })[0];
            return autoParser.parse(value, this.options.forceNullOnEmpty);
        }
        var parser = this.parsers.filter(function (x) { return x.name === type; })[0];
        if (parser == null) {
            throw Constants_1.pluginName + ": couldn't find ther parser for type '" + type + "'.";
        }
        return parser.parse(value, this.options.forceNullOnEmpty);
    };
    NSerializeJson.serializeForm = function (htmlFormElement) {
        var _this = this;
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
        checkedElements.forEach(function (x) { return _this.serializeIntoObject(resultObject, x); });
        return resultObject;
    };
    NSerializeJson.serializeIntoObject = function (obj, htmlElement) {
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
        if (this.options.onBeforeParseValue != null) {
            value = this.options.onBeforeParseValue(value, type);
        }
        var parsedValue = this.parseValue(value, type);
        var pathLength = 0;
        if (this.options.useDotSeparatorInPath) {
            var addArrayToPath = false;
            path = pathStr.split(".");
            pathLength = path.length;
            path.forEach(function (step, index) {
                var indexOfBrackets = step.indexOf("[]");
                if (index !== pathLength - 1) {
                    if (indexOfBrackets > -1) {
                        throw Constants_1.pluginName + ": error in path '" + pathStr + "' empty values in the path mean array and should be at the end.";
                    }
                }
                else {
                    if (indexOfBrackets > -1) {
                        path[index] = step.replace("[]", "");
                        addArrayToPath = true;
                    }
                }
            });
            if (addArrayToPath) {
                path.push("");
            }
        }
        else {
            path = pathStr.split("[").map(function (x, i) { return x.replace("]", ""); });
            pathLength = path.length;
            path.forEach(function (step, index) {
                if (index !== pathLength - 1 && Util_1.isStringNullOrEmpty(step))
                    throw Constants_1.pluginName + ": error in path '" + pathStr + "' empty values in the path mean array and should be at the end.";
            });
        }
        this.searchAndSet(obj, path, 0, parsedValue);
        return obj;
    };
    NSerializeJson.searchAndSet = function (currentObj, path, pathIndex, parsedValue, arrayInternalIndex) {
        if (arrayInternalIndex === void 0) { arrayInternalIndex = 0; }
        var step = path[pathIndex];
        var isFinalStep = pathIndex === path.length - 1;
        var nextStep = path[pathIndex + 1];
        if (currentObj == null || typeof currentObj == "string") {
            path = path.map(function (x) { return Util_1.isStringNullOrEmpty(x) ? "[]" : x; });
            console.log(Constants_1.pluginName + ": there was an error in path '" + path + "' in step '" + step + "'.");
            throw Constants_1.pluginName + ": error.";
        }
        var isArrayStep = Util_1.isStringNullOrEmpty(step);
        var isIntegerStep = Util_1.isStringInteger(step);
        var isNextStepAnArray = Util_1.isStringInteger(nextStep) || Util_1.isStringNullOrEmpty(nextStep);
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
        else if (isIntegerStep && this.options.useNumKeysAsArrayIndex) {
            step = parseInt(step);
            if (!Util_1.isArray(currentObj)) {
                currentObj = [];
            }
            if (isFinalStep) {
                currentObj[step] = parsedValue;
                return;
            }
            else {
                if (currentObj[step] == null)
                    currentObj[step] = {};
            }
        }
        else {
            if (isFinalStep) {
                currentObj[step] = parsedValue;
                return;
            }
            else {
                if (this.options.useNumKeysAsArrayIndex) {
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
        this.searchAndSet(currentObj[step], path, pathIndex, parsedValue, arrayInternalIndex);
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