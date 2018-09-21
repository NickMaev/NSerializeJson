export interface IOptions {
    useNumKeysAsArrayIndex: boolean;
    useDotSeparatorInPath: boolean;
    forceNullOnEmpty: boolean;
    onBeforeParseValue?: (value: string, type: string) => string;
}
