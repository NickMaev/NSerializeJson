import { IValueParser } from "./IValueParser";
import { IOptions } from "./IOptions";
export declare class NSerializeJson {
    static options: IOptions;
    static parsers: IValueParser[];
    private static parseValue;
    static serializeForm(htmlFormElement: HTMLFormElement, options?: IOptions, parsers?: IValueParser[]): object;
    private static serializeIntoObject;
    private static searchAndSet;
}
