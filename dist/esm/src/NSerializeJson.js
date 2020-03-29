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
import { isStringNullOrEmpty, isStringInteger, isArray, nodeListToArray } from "./Util";
import { parserList } from "./ParserList";
import { pluginName } from "./Constants";
var NSerializeJson = (function () {
    function NSerializeJson() {
    }
    NSerializeJson.parseValue = function (options, parsers, value, type) {
        if (isStringNullOrEmpty(type)) {
            var autoParser = this.parsers.filter(function (x) { return x.name === "auto"; })[0];
            return autoParser.parse(value, options.forceNullOnEmpty);
        }
        var parser = this.parsers.filter(function (x) { return x.name === type; })[0];
        if (parser == null) {
            throw Error(pluginName + ": couldn't find ther parser for type '" + type + "'.");
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
                throw Error(pluginName + ": 'parsers' arg in 'serializeForm' method must be an array or null.");
            }
            parsers = __assign({}, this.parsers, parsers);
        }
        var nodeList = htmlFormElement.querySelectorAll("input, select, textarea");
        var htmlInputElements = nodeListToArray(nodeList);
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
    NSerializeJson.serializeIntoObject = function (options, parsers, resultObject, htmlElement) {
        var value = null;
        var tagName = htmlElement.tagName.toLowerCase();
        var nameAttr = htmlElement.getAttribute("name");
        var isMultiSelect = false;
        if (tagName === "select") {
            var selectElement = htmlElement;
            isMultiSelect = selectElement.multiple == true;
            var selectedOptionValues = Array
                .from(selectElement.options)
                .filter(function (x) { return x.selected; })
                .map(function (x) { return x.getAttribute("value"); });
            if (selectedOptionValues) {
                value = selectedOptionValues;
            }
        }
        else {
            value = htmlElement.value;
        }
        if (isStringNullOrEmpty(nameAttr))
            return resultObject;
        var valueType = null;
        var typeIndex = nameAttr.indexOf(":");
        if (typeIndex > -1) {
            valueType = nameAttr.substring(typeIndex + 1, nameAttr.length);
            if (valueType === "skip") {
                return resultObject;
            }
            nameAttr = nameAttr.substring(0, typeIndex);
        }
        else {
            valueType = htmlElement.getAttribute("data-value-type");
        }
        var path = [];
        if (options.onBeforeParseValue != null) {
            value = options.onBeforeParseValue(value, valueType);
        }
        var parsedValue = this.parseValue(options, parsers, value, valueType);
        if (options.useDotSeparatorInPath) {
            var addArrayToPath = false;
            path = nameAttr.split(".");
            var pathIndexShift = 0;
            for (var pathIndex = 0; pathIndex < path.length; pathIndex++) {
                var step = path[pathIndex + pathIndexShift];
                if (step === undefined)
                    continue;
                var emptyBrackets = "[]";
                var indexOfBrackets = step.indexOf(emptyBrackets);
                var hasEmptyBrackets = indexOfBrackets > -1;
                if (hasEmptyBrackets) {
                    if (pathIndex !== path.length - 1) {
                        throw pluginName + ": error in path '" + nameAttr + "' empty values in the path mean array and should be at the end.";
                    }
                    else {
                        if (indexOfBrackets > -1) {
                            path[pathIndex + pathIndexShift] = step.replace(emptyBrackets, "");
                            if (!isMultiSelect) {
                                addArrayToPath = true;
                            }
                        }
                    }
                }
                else {
                    var leftBracketIndex = step.indexOf("["), rightBracketIndex = step.indexOf("]");
                    if (leftBracketIndex !== -1 && rightBracketIndex !== -1) {
                        var arrayContent = step.slice(leftBracketIndex + 1, rightBracketIndex);
                        path[pathIndex + pathIndexShift] = step.replace("[" + arrayContent + "]", "");
                        if (!isStringNullOrEmpty(arrayContent) && !isStringInteger(arrayContent)) {
                            throw Error("Path '" + nameAttr + "' must be empty or contain a number in array brackets.");
                        }
                        if (arrayContent) {
                            path.splice(pathIndex + pathIndexShift + 1, 0, arrayContent);
                        }
                        pathIndexShift++;
                    }
                }
            }
            if (addArrayToPath) {
                path.push("");
            }
        }
        else {
            path = nameAttr.split("[").map(function (x, i) { return x.replace("]", ""); });
            path.forEach(function (step, pathIndex) {
                var isLastStep = pathIndex === path.length - 1;
                if (!isLastStep && isStringNullOrEmpty(step)) {
                    throw Error(pluginName + ": error in path '" + nameAttr + "' empty values in the path mean array and should be at the end.");
                }
            });
        }
        this.searchAndSet(options, isMultiSelect, resultObject, path, 0, parsedValue);
        return resultObject;
    };
    NSerializeJson.searchAndSet = function (options, isMultiSelect, currentObj, path, pathIndex, parsedValue, arrayInternalIndex) {
        if (arrayInternalIndex === void 0) { arrayInternalIndex = 0; }
        var step = path[pathIndex];
        if (step == undefined) {
            step = null;
        }
        var isLastStep = true;
        if (isMultiSelect) {
            if (!options.useDotSeparatorInPath && path.length > 1 && isStringNullOrEmpty(step)) {
                isLastStep = pathIndex === path.length - 2;
            }
        }
        else {
            isLastStep = pathIndex === path.length - 1;
        }
        var nextStep = path[pathIndex + 1];
        if (currentObj == null || typeof currentObj == "string") {
            path = path.map(function (x) { return isStringNullOrEmpty(x) ? "[]" : x; });
            throw Error(pluginName + ": there was an error in path '" + path + "' in step '" + step + "'.");
        }
        var isArrayStep = isStringNullOrEmpty(step);
        var isIntegerStep = isStringInteger(step);
        var isNextStepAnArray = isStringInteger(nextStep) || nextStep == "";
        if (isArrayStep) {
            if (isLastStep) {
                if (isMultiSelect && !options.useDotSeparatorInPath) {
                }
                else {
                }
                if (!isMultiSelect) {
                    currentObj.push(parsedValue);
                }
                return;
            }
            else {
                if (currentObj[arrayInternalIndex] == null) {
                    currentObj[arrayInternalIndex] = {};
                }
                arrayInternalIndex++;
            }
        }
        else if (isIntegerStep && options.useNumKeysAsArrayIndex) {
            var arrayKey = parseInt(step);
            if (!isArray(currentObj)) {
                currentObj = [];
            }
            if (isLastStep) {
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
            if (isLastStep) {
                currentObj[step] = parsedValue;
                return;
            }
            else {
                if (options.useNumKeysAsArrayIndex) {
                    if (isNextStepAnArray) {
                        if (!isArray(currentObj[step]))
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
        this.searchAndSet(options, isMultiSelect, currentObj[step], path, pathIndex, parsedValue, arrayInternalIndex);
    };
    NSerializeJson.options = {
        useNumKeysAsArrayIndex: true,
        useDotSeparatorInPath: false,
        forceNullOnEmpty: false
    };
    NSerializeJson.parsers = parserList.slice();
    return NSerializeJson;
}());
export { NSerializeJson };
//# sourceMappingURL=NSerializeJson.js.map