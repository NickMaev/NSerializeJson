export interface IValueParser {
    name: string;
    parse(val: any, forceNull: boolean): any;
}