export function isStringJsonObject(arg: any): boolean {
    try {
        JSON.parse(arg);
        return true;
    } catch(e) {}
    return false;
}

export function isArray(arg: any): boolean {
    return Array.isArray(arg);
}

export function isStringNumber(arg: any): boolean {
    return typeof arg == 'number' || /^[-+]?\d+([Ee][+-]?\d+)?(\.\d+)?$/.test(arg);
}

export function isStringInteger(arg: any): boolean {
    return /^[-+]?\d+([Ee][+-]?\d+)?$/.test(arg);
}

export function isStringNullOrEmpty(arg: string): boolean {
    return arg == null || arg.trim() === "";
}

export const nodeListToArray = (nodeList: NodeListOf<Element>) : HTMLElement[] => {
    return Array.prototype.slice.call(nodeList) as HTMLElement[];
}