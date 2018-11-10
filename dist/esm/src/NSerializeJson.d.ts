import { IValueParser } from "./IValueParser";
import { IOptions } from "./IOptions";
export declare class NSerializeJson {
    static options: IOptions;
    static parsers: IValueParser[];
    private static parseValue;
    static serializeForm(htmlFormElement: HTMLFormElement): object;
    static serializeIntoObject(obj: any, htmlElement: HTMLElement): any;
    private static searchAndSet;
}
