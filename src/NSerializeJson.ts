import { isStringNullOrEmpty, isStringInteger, isArray, nodeListToArray } from "./Util";
import { IValueParser } from "./IValueParser";
import { IOptions } from "./IOptions";
import { parserList } from "./ParserList";
import { pluginName } from "./Constants";

export class NSerializeJson {

    static options: IOptions = {
        useNumKeysAsArrayIndex: true,
        useDotSeparatorInPath: false,
        forceNullOnEmpty: false
    };

    public static parsers: IValueParser[] = [...parserList];

    private static parseValue(value: string, type: string): any {        
        if (isStringNullOrEmpty(type)) {
            var autoParser = this.parsers.filter(x => x.name === "auto")[0];
            return autoParser.parse(value, this.options.forceNullOnEmpty);
        }
        var parser = this.parsers.filter(x => x.name === type)[0];
        if (parser == null) {
            throw `${pluginName}: couldn't find ther parser for type '${type}'`;
        }
        return parser.parse(value, this.options.forceNullOnEmpty);
    }

    public static serializeForm(htmlFormElement: HTMLFormElement): object {
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
        checkedElements.forEach(x => this.serializeIntoObject(resultObject, x));

        return resultObject;
    }

    public static serializeIntoObject(obj: any, htmlElement: HTMLElement) : any {
        var value = null;
        if (htmlElement.tagName.toLowerCase() === "select") {
            var firstSelectOpt = Array.from((htmlElement as any).options).filter(x => (x as any).selected)[0] as any;
            value = firstSelectOpt.getAttribute("value");
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

        if (this.options.onBeforeParseValue != null) {
            value = this.options.onBeforeParseValue(value, type);
        }
        var parsedValue = this.parseValue(value, type);

        var pathLength = 0;
        if (this.options.useDotSeparatorInPath) {
            var addArrayToPath: boolean = false;
            path = pathStr.split(".");
            pathLength = path.length;
            path.forEach((step, index) => {
                var indexOfBrackets = step.indexOf("[]");
                if (index !== pathLength - 1) {
                    if (indexOfBrackets > -1) {
                        throw `${pluginName}: error in path '${pathStr}' empty values in the path mean array and should be at the end.`;
                    }
                } else {
                    // Last step.
                    if (indexOfBrackets > -1) {
                        path[index] = step.replace("[]", "");
                        addArrayToPath = true;
                    }
                }
            });
            if (addArrayToPath) {
                path.push(""); // Add an empty element which means an array.
            }
        } else {
            path = pathStr.split("[").map((x, i) => x.replace("]", ""));
            pathLength = path.length;
            path.forEach((step, index) => {
                if(index !== pathLength - 1 && isStringNullOrEmpty(step))
                    throw `${pluginName}: error in path '${pathStr}' empty values in the path mean array and should be at the end.`;
            });
        }
        
        this.searchAndSet(obj, path, 0, parsedValue);

        return obj;
    }

    private static searchAndSet(currentObj: any, path: string[], pathIndex: number, parsedValue: any, arrayInternalIndex: number = 0) : any {
        
        var step: any = path[pathIndex];
        var isFinalStep = pathIndex === path.length - 1; 
        var nextStep = path[pathIndex + 1];

        if (currentObj == null || typeof currentObj == "string") {
            path = path.map(x => isStringNullOrEmpty(x) ? "[]" : x);
            console.log(`${pluginName}: there was an error in path '${path}' in step '${step}'.`);
            throw `${pluginName}: error.`;
        }
        
        var isArrayStep = isStringNullOrEmpty(step);
        var isIntegerStep = isStringInteger(step);
        var isNextStepAnArray = isStringInteger(nextStep) || isStringNullOrEmpty(nextStep);

        //if (step == "1.1")
        //    debugger;

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
        if (isIntegerStep && this.options.useNumKeysAsArrayIndex) {
            // It's a key of an array.

            step = parseInt(step);

            if (!isArray(currentObj)) {
                currentObj = [];
            }

            if (isFinalStep) {
                currentObj[step] = parsedValue;
                return;
            } else {
                if(currentObj[step] == null)
                    currentObj[step] = {};
            }
        } else {

            // Create new property or override it.

            if (isFinalStep) {
                currentObj[step] = parsedValue;
                return;
            } else {
                if (this.options.useNumKeysAsArrayIndex) {
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
        
        this.searchAndSet(currentObj[step], path, pathIndex, parsedValue, arrayInternalIndex);
    }
}