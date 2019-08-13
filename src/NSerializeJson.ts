import { isStringNullOrEmpty, isStringInteger, isArray, nodeListToArray } from "./Util";
import { IValueParser } from "./IValueParser";
import { IOptions } from "./IOptions";
import { parserList } from "./ParserList";
import { pluginName } from "./Constants";
import { isNumber } from "util";

export class NSerializeJson {

    static options: IOptions = {
        useNumKeysAsArrayIndex: true,
        useDotSeparatorInPath: false,
        forceNullOnEmpty: false
    };

    public static parsers: IValueParser[] = [...parserList];

    private static parseValue(options: IOptions, parsers: IValueParser[], value: string, type: string): any {        
        if (isStringNullOrEmpty(type)) {
            var autoParser = this.parsers.filter(x => x.name === "auto")[0];
            return autoParser.parse(value, options.forceNullOnEmpty);
        }
        var parser = this.parsers.filter(x => x.name === type)[0];
        if (parser == null) {
            throw `${pluginName}: couldn't find ther parser for type '${type}'.`;
        }
        return parser.parse(value, options.forceNullOnEmpty);
    }

    public static serializeForm(htmlFormElement: HTMLFormElement, options?: IOptions, parsers?: IValueParser[]): object {

        if (options == null) {
            options = this.options;
        } else {
            options = { ...this.options, ...options };
        }

        if (parsers == null) {
            parsers = this.parsers;
        } else {

            if (!Array.isArray(parsers)) {
                throw Error("'parsers' arg in 'serializeForm' method must be an array or null.");
            }

            parsers = { ...this.parsers, ...parsers };
        }

        var nodeList = htmlFormElement.querySelectorAll("input, select, textarea");
        var htmlInputElements = nodeListToArray(nodeList) as HTMLInputElement[];
        var checkedElements = htmlInputElements.filter(x => {
            if (x.disabled ||
               ((x.getAttribute("type") === "radio" && !x.checked) ||
                (x.getAttribute("type") === "checkbox" && !x.checked))) {
                return false;
            }
            return true;
        });

        var resultObject = {};
        checkedElements.forEach(x => this.serializeIntoObject(options, parsers, resultObject, x));

        return resultObject;
    }

    private static serializeIntoObject(options: IOptions, parsers: IValueParser[], obj: any, htmlElement: HTMLElement): any {

        var value = null;
        if (htmlElement.tagName.toLowerCase() === "select") {
            var firstSelectOpt = Array.from((htmlElement as any).options).filter(x => (x as any).selected)[0] as any;
            if (firstSelectOpt) {
                value = firstSelectOpt.getAttribute("value");
            }
        } else {
            value = (htmlElement as any).value;
        }
        var pathStr = htmlElement.getAttribute("name");
        if (isStringNullOrEmpty(pathStr))
            return obj;
        var path = [];
        var type:string = null;
        var typeIndex = pathStr.indexOf(":");
        if (typeIndex > -1) {
            type = pathStr.substring(typeIndex + 1, pathStr.length);
            if (type === "skip") {
                return obj;
            }
            pathStr = pathStr.substring(0, typeIndex);
        } else {
            type = htmlElement.getAttribute("data-value-type");
        }

        if (options.onBeforeParseValue != null) {
            value = options.onBeforeParseValue(value, type);
        }
        var parsedValue = this.parseValue(options, parsers, value, type);

        if (options.useDotSeparatorInPath) {
            var addArrayToPath: boolean = false;
            path = pathStr.split(".");

            var pathIndexShift = 0;

            for (var index = 0; index < path.length; index++) {

                var step = path[index + pathIndexShift];

                if (step === undefined)
                    continue;

                var indexOfBrackets = step.indexOf("[]");

                if (indexOfBrackets === -1) {

                    // Not empty brackets: [].

                    var leftBracketIndex = step.indexOf("["),
                        rightBracketIndex = step.indexOf("]");

                    if (leftBracketIndex !== -1 && rightBracketIndex !== -1) {

                        // Has content in brackets: [*content*].

                        var arrayContent = step.slice(leftBracketIndex + 1, rightBracketIndex);
                        path[index + pathIndexShift] = step.replace(`[${arrayContent}]`, "");

                        if (!isStringNullOrEmpty(arrayContent) && !isStringInteger(arrayContent)) {
                            throw Error(`Path '${pathStr}' must be empty or contain a number in array brackets.`);
                        }

                        if (arrayContent) {
                            path.splice(index + pathIndexShift + 1, 0, arrayContent);
                        }

                        pathIndexShift++;
                    }

                } else {
                    if (index !== path.length - 1) {
                        if (indexOfBrackets > -1 && indexOfBrackets !== path.length - 1) {
                            //console.log(indexOfBrackets);
                            //console.log(index);
                            //console.log(path.length);
                            throw `${pluginName}: error in path '${pathStr}' empty values in the path mean array and should be at the end.`;
                        }
                    } else {
                        // Last step.
                        if (indexOfBrackets > -1) {
                            path[index + pathIndexShift] = step.replace("[]", "");
                            addArrayToPath = true;
                        }
                    }
                }
            }

            if (addArrayToPath) {
                path.push(""); // Add an empty element which means an array.
            }

        } else {
            path = pathStr.split("[").map((x, i) => x.replace("]", ""));
            path.forEach((step, index) => {
                if (index !== path.length - 1 && isStringNullOrEmpty(step))
                    throw `${pluginName}: error in path '${pathStr}' empty values in the path mean array and should be at the end.`;
            });
        }
        
        this.searchAndSet(options, obj, path, 0, parsedValue);

        return obj;
    }

    private static searchAndSet(options, currentObj: any, path: string[], pathIndex: number, parsedValue: any, arrayInternalIndex: number = 0) : any {
        
        var step: any = path[pathIndex];
        var isFinalStep = pathIndex === path.length - 1; 
        var nextStep = path[pathIndex + 1];

        if (currentObj == null || typeof currentObj == "string") {
            path = path.map(x => isStringNullOrEmpty(x) ? "[]" : x);
            console.log(`${pluginName}: there was an error in path '${path}' in step '${step}'.`);
            throw `${pluginName}: error.`;
        }

        console.log("-----------------------")
        
        var isArrayStep = isStringNullOrEmpty(step); // If [].
        var isIntegerStep = isStringInteger(step);
        var isNextStepAnArray = isStringInteger(nextStep) || nextStep == "";

        //if (step == "1.1")
        //    debugger;

        //console.log("isArrayStep:", isArrayStep)
        //console.log("isIntegerStep:", isIntegerStep)
        //console.log("isNextStepAnArray:", isNextStepAnArray)
        //console.log("path:", path)
        //console.log("step:", step)
        //console.log("nextStep:", nextStep)

        if (isArrayStep) {
            // It's an array.

            if (isFinalStep) {
                currentObj.push(parsedValue);
                return;
            } else {
                if (currentObj[arrayInternalIndex] == null) {
                    currentObj[arrayInternalIndex] = {};
                }
                step = arrayInternalIndex;
                arrayInternalIndex++;
            }

        } else 
        if (isIntegerStep && options.useNumKeysAsArrayIndex) {
            // It's a key of an array.

            var arrayKey = parseInt(step);

            if (!isArray(currentObj)) {
                currentObj = [];
            }

            if (isFinalStep) {
                currentObj[arrayKey] = parsedValue;
                return;
            } else {
                if (currentObj[arrayKey] == null) {
                    currentObj[arrayKey] = {};
                }
            }
        } else {

            // Create new property or override it.

            if (isFinalStep) {
                currentObj[step] = parsedValue;
                return;
            } else {
                if (options.useNumKeysAsArrayIndex) {
                    // We need to determine the next step.
                    // If it will be an integer, we must build an array
                    // instead of object.

                    if (isNextStepAnArray) {
                        if(!isArray(currentObj[step]))
                            currentObj[step] = [];
                    } else {
                        if(currentObj[step] == null)
                            currentObj[step] = {};
                    }
                } else {
                    if(currentObj[step] == null)
                        currentObj[step] = {};
                }
            }
        }
        pathIndex++;
        
        this.searchAndSet(options, currentObj[step], path, pathIndex, parsedValue, arrayInternalIndex);
    }
}