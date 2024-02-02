export interface RecursiveTokensObj {
    [key: string]: TokenValueObject | RecursiveTokensObj
}

export interface TokenValueObject {
    value: string | number | Record<string, string | number>
    type: string
}