import { TokenValueObject } from '~/types';

const camelCaseToKebabCase = (str: string) => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($: string, ofs: string) => (ofs ? "-" : "") + $.toLowerCase());

export const TOKEN_REF_REGEX = /(?<reference>\{[\w\.?\d?]+\})/mi;

export const REGEX = /(?<operator>^|[\-\+\*\/])(?<expression>\{?[#\w\.\d]+\}?)/gm;
export const NUMBER_VALUE_REGEX = /^\d+$|^\d+px$/mi;

export const isTokenStringReference = (val: string) => TOKEN_REF_REGEX.test(val);
export const isNumberValue = (val: string) => NUMBER_VALUE_REGEX.test(val);

export const evaluateTokenInContext = (token: string, ctx: RecursiveObject): string | number | undefined => {
    const path = token.replaceAll(/[{}]/g, '');
    const val = getPropValueByStringPath(ctx, `${path}.value`);

    return isNumberValue(val) ? parseInt(val.replace('px', '')) : val;
}

export interface RecursiveObject {
    [key: string]: RecursiveObject | any
}

export const getPropValueByStringPath = <T = any>(target: RecursiveObject, path: string): T | undefined => {
    const keys = path.split('.');
    const key = keys.shift() as string;

    if (keys.length !== 0 && target[key] instanceof Object)
        return getPropValueByStringPath(target[key], keys.join('.'));
    else if (keys.length === 0)
        return target[key];
}

export const isTokenValueObject = (val: any): val is TokenValueObject => Boolean(val?.type);
