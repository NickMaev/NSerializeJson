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

    private static parseValue(options: IOptions, parsers: IValueParser[], value: any, type: string): any {        
        if (isStringNullOrEmpty(type)) {
            let autoParser = this.parsers.filter(x => x.name === "auto")[0];
            return autoParser.parse(value, options.forceNullOnEmpty);
        }
        let parser = this.parsers.filter(x => x.name === type)[0];
        if (parser == null) {
            throw Error(`${pluginName}: couldn't find ther parser for type '${type}'.`);
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
                throw Error(`${pluginName}: 'parsers' arg in 'serializeForm' method must be an array or null.`);
            }

            parsers = { ...this.parsers, ...parsers };
        }

        let nodeList = htmlFormElement.querySelectorAll("input, select, textarea");
        let htmlInputElements = nodeListToArray(nodeList) as HTMLInputElement[];
        let checkedElements = htmlInputElements.filter(x => {
            if (x.disabled ||
               ((x.getAttribute("type") === "radio" && !x.checked) ||
                (x.getAttribute("type") === "checkbox" && !x.checked))) {
                return false;
            }
            return true;
        });

        let resultObject = {};
        checkedElements.forEach(x => this.serializeIntoObject(options, parsers, resultObject, x));

        return resultObject;
    }

    private static serializeIntoObject(options: IOptions, parsers: IValueParser[], resultObject: object, htmlElement: HTMLElement): any {

        let value = null;

        let tagName = htmlElement.tagName.toLowerCase();
        let nameAttr = htmlElement.getAttribute("name");
        let isMultiSelect: boolean = false;

        if (tagName === "select") {

            let selectElement = htmlElement as HTMLSelectElement;

            isMultiSelect = selectElement.multiple == true;

            let selectedOptionValues =
                Array
                    .from(selectElement.options)
                    .filter(x => x.selected)
                    .map(x => x.getAttribute("value"));

            if (selectedOptionValues) {
                value = selectedOptionValues;
            }

        } else {

            value = (htmlElement as any).value;
        }


        if (isStringNullOrEmpty(nameAttr))
            return resultObject;

        let valueType: string = null;

        let typeIndex = nameAttr.indexOf(":");

        if (typeIndex > -1) {

            valueType = nameAttr.substring(typeIndex + 1, nameAttr.length);

            if (valueType === "skip") {
                return resultObject;
            }

            nameAttr = nameAttr.substring(0, typeIndex);

        } else {

            valueType = htmlElement.getAttribute("data-value-type");
        }

        let path = [];

        if (options.onBeforeParseValue != null) {
            value = options.onBeforeParseValue(value, valueType);
        }
        let parsedValue = this.parseValue(options, parsers, value, valueType);

        if (options.useDotSeparatorInPath) {

            let addArrayToPath: boolean = false;

            path = nameAttr.split(".");

            let pathIndexShift = 0;

            for (let pathIndex = 0; pathIndex < path.length; pathIndex++) {

                let step = path[pathIndex + pathIndexShift];

                if (step === undefined)
                    continue;

                let emptyBrackets = "[]";

                let indexOfBrackets = step.indexOf(emptyBrackets);

                let hasEmptyBrackets = indexOfBrackets > -1;

                if (hasEmptyBrackets) {

                    // Empty brackets in path: [].
                                                           
                    if (pathIndex !== path.length - 1) {

                        throw `${pluginName}: error in path '${nameAttr}' empty values in the path mean array and should be at the end.`;

                    } else {

                        // Last step.

                        if (indexOfBrackets > -1) {

                            path[pathIndex + pathIndexShift] = step.replace(emptyBrackets, "");

                            if (!isMultiSelect) {
                                addArrayToPath = true;
                            }
                        }

                    }

                } else {

                    // Not empty brackets in path: [xxx].

                    let leftBracketIndex = step.indexOf("["),
                        rightBracketIndex = step.indexOf("]");

                    if (leftBracketIndex !== -1 && rightBracketIndex !== -1) {

                        // Has content in brackets: [*content*].

                        let arrayContent = step.slice(leftBracketIndex + 1, rightBracketIndex);
                        path[pathIndex + pathIndexShift] = step.replace(`[${arrayContent}]`, "");

                        if (!isStringNullOrEmpty(arrayContent) && !isStringInteger(arrayContent)) {
                            throw Error(`Path '${nameAttr}' must be empty or contain a number in array brackets.`);
                        }

                        if (arrayContent) {
                            path.splice(pathIndex + pathIndexShift + 1, 0, arrayContent);
                        }

                        pathIndexShift++;
                    }
                }
            }

            if (addArrayToPath) {
                // Add an empty element which means an array.
                path.push("");
            }

        }
        else {

            // Bracket as a path separator.

            path = nameAttr.split("[").map((x, i) => x.replace("]", ""));

            path.forEach((step, pathIndex) => {

                let isLastStep = pathIndex === path.length - 1;

                if (!isLastStep && isStringNullOrEmpty(step)) {
                    throw Error(`${pluginName}: error in path '${nameAttr}' empty values in the path mean array and should be at the end.`);
                }
            });
        }

        this.searchAndSet(options, isMultiSelect, resultObject, path, 0, parsedValue);

        return resultObject;
    }

    private static searchAndSet(options: IOptions, isMultiSelect: boolean, currentObj: any, path: string[], pathIndex: number, parsedValue: any, arrayInternalIndex: number = 0): any {

        //if (isMultiSelect) {
        //    console.log(currentObj);
        //    debugger;
        //}

        let step: string = path[pathIndex];
        if (step == undefined) {
            step = null;
        }

        let isLastStep = true;

        if (isMultiSelect) {
            if (!options.useDotSeparatorInPath && path.length > 1 && isStringNullOrEmpty(step)) {
                isLastStep = pathIndex === path.length - 2;
            }
            //else {
            //    isLastStep = false;
            //}
        } else {
            isLastStep = pathIndex === path.length - 1;
        }

        let nextStep = path[pathIndex + 1];

        if (currentObj == null || typeof currentObj == "string") {
            path = path.map(x => isStringNullOrEmpty(x) ? "[]" : x);
            throw Error(`${pluginName}: there was an error in path '${path}' in step '${step}'.`);
        }

        //console.log("-----------------------")

        let isArrayStep = isStringNullOrEmpty(step); // If [].
        let isIntegerStep = isStringInteger(step);
        let isNextStepAnArray = isStringInteger(nextStep) || nextStep == "";

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

            if (isLastStep) {

                if (isMultiSelect && !options.useDotSeparatorInPath) {
                    //let prevStep = path[pathIndex - 1];
                    //console.log(currentObj);
                    //console.log(prevStep);
                    //console.log(parsedValue);
                    //currentObj[prevStep] = parsedValue;
                    ///?
                } else {
                }

                if (!isMultiSelect) {


                    currentObj.push(parsedValue);
                }

                return;

            } else {

                if (currentObj[arrayInternalIndex] == null) {
                    currentObj[arrayInternalIndex] = {};
                }

                arrayInternalIndex++;
            }

        }
        else if (isIntegerStep && options.useNumKeysAsArrayIndex) {
            // It's a key of an array.

            let arrayKey = parseInt(step);

            if (!isArray(currentObj)) {
                currentObj = [];
            }

            if (isLastStep) {
                currentObj[arrayKey] = parsedValue;
                return;
            } else {
                if (currentObj[arrayKey] == null) {
                    currentObj[arrayKey] = {};
                }
            }
        } else {

            // Create new property or override it.

            if (isLastStep) {

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

        this.searchAndSet(options, isMultiSelect, currentObj[step], path, pathIndex, parsedValue, arrayInternalIndex);
    }
}