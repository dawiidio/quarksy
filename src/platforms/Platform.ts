import { TokensObjectParser } from '~/TokensObjectParser';

export type PathToOutFile = string;
export type FileContent = string;

export abstract class Platform<T extends Record<string, any> = Record<string, any>> {
    public options: T;

    constructor(options?: T) {
        this.options = {
            ...this.getDefaultOptions(),
            ...options,
        }
    }

    getDefaultOptions(): T {
        return {} as T;
    }

    abstract run(tokensObject: TokensObjectParser): [PathToOutFile, FileContent][]
}