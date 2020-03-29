import { IValueParser } from "./IValueParser";
import { isStringNumber, isStringJsonObject, isStringNullOrEmpty, isArray } from "./Util";

export const parserList : IValueParser[] = [
        {
            name: "auto",
            parse: (val: any, forceNull: boolean): any => {
                if (isArray(val)) {
                    return val;
                }
                if (isStringNullOrEmpty(val)) {
                    return forceNull ? null : val;
                }
                var result = val.toString().trim();
                if(result.toLowerCase() === "null")
                    return null;
                if (isStringNumber(val)) {
                    return parseFloat(val);
                }
                try {
                    result = JSON.parse(result);
                    return result;
                } catch(e) {

                }
                return result;
            }
        },
        {
            name: "number",
            parse: (val: any, forceNull: boolean): any => {
                if (isArray(val)) {
                    return val.map(x => parseInt(x));
                }
                if (typeof val === "number") {
                    return val;
                }
                if (isStringNullOrEmpty(val)) {
                    return forceNull ? null : 0;
                }
                if (isStringNumber(val)) {
                    return parseFloat(val);
                }
                return 0;
            }
        },
        {
            name: "boolean",
            parse: (val: any, forceNull: boolean): any => {
                if (isStringNullOrEmpty(val)) {
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
            parse: (val: any, forceNull: boolean): any => {
                if (isStringNullOrEmpty(val)) {
                    return null;
                }
                var result = val.toString().trim();
                if(result.toLowerCase() === "null" || (result === "" && forceNull))
                    return null;
                return result;
            }
        },
        {
            name: "array[auto]",
            parse: (val: any, forceNull: boolean): any => {
                if (isStringNullOrEmpty(val)) {
                    if (forceNull)
                        return null;
                    return [];
                } 
                return val.split(",").map(x => {
                        var parser = parserList.filter(x => x.name === "auto")[0];
                        return parser.parse(x.trim(), forceNull);
                    }
                );
            }
        },
        {
            name: "array[string]",
            parse: (val: any, forceNull: boolean): any => {
                if (isStringNullOrEmpty(val)) {
                    if (forceNull)
                        return null;
                    return [];
                } 
                return val.split(",").map(x => x.trim().toString());
            }
        },
        {
            name: "array[number]",
            parse: (val: any, forceNull: boolean): any => {
                if (isStringNullOrEmpty(val)) {
                    if (forceNull)
                        return null;
                    return [];
                } 
                return val.split(",").map(x => parseFloat(x.trim()));
            }
        },
        {
            name: "json",
            parse: (val: any, forceNull: boolean): any => {
                if (isStringNullOrEmpty(val)) {
                    if (forceNull)
                        return null;
                    return {};
                }
                return JSON.parse(val);
            }
        }
];