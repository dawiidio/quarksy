import {
    readFile
} from 'node:fs/promises';
import {
    resolve
} from 'node:path';

interface RecursiveObject {
    [key: string]: RecursiveObject | any
}

const getPropValueByStringPath = <T = any>(target: RecursiveObject, path: string): T | undefined => {
    const keys = path.split('.');
    const key = keys.shift() as string;

    if (keys.length !== 0 && target[key] instanceof Object)
        return getPropValueByStringPath(target[key], keys.join('.'));
    else if (keys.length === 0)
        return target[key];
}

const TOKEN_REF_REGEX = /(?<reference>\{[\w\.?\d?]+\})/mi;

const REGEX = /(?<operator>^|[\-\+\*\/])(?<expression>\{?[#\w\.\d]+\}?)/gm;
const NUMBER_VALUE_REGEX = /^\d+$|^\d+px$/mi;

type ExpressionTokenType = 'operator' | 'value' | 'token';

interface Token {
    type: ExpressionTokenType
    expression: string
    value?: string | number
}

const isFigmaTokenReference = (val: string) => TOKEN_REF_REGEX.test(val);
const isNumberValue = (val: string) => NUMBER_VALUE_REGEX.test(val);

const evaluateTokenInContext = (token: string, ctx: RecursiveObject): string | number | undefined => {
    const path = token.replaceAll(/[{}]/g, '');
    const val = getPropValueByStringPath(ctx, `${path}.value`);

    return isNumberValue(val) ? parseInt(val.replace('px', '')) : val;
}

class Expression {
    tokens: Token[] = [];
    canBeEvaluatedToNumber: boolean = true;
    expression: string;

    constructor(
        expression: string,
        public path?: string,
        public type?: string,
    ) {
        this.expression = expression.replaceAll(' ', '');

        if (expression.includes('('))
            throw new Error(`Found "(" in expression - function calls and nested expressions are not supported yet :(`);

        this.parse();
    }

    get figmaTokens() {
        return this.tokens.filter(({type}) => type === 'token');
    }

    parse() {
        const matches = [...this.expression.matchAll(REGEX)];

        matches.forEach((val, i) => {
            const {
                operator,
                expression,
            } = val.groups || {};

            if (operator) {
                this.tokens.push({
                    expression: operator,
                    type: "operator",
                });
            }

            if (isFigmaTokenReference(expression)) {
                this.tokens.push({
                    expression,
                    type: 'token'
                });
                return;
            }

            if (isNumberValue(expression)) {
                const withoutPx = expression.replaceAll('px', '');

                this.tokens.push({
                    expression: expression,
                    type: 'value',
                    value: parseInt(withoutPx)
                });
                return;
            }

            this.tokens.push({
                expression,
                type: 'value'
            });
            this.canBeEvaluatedToNumber = false;
        });
    }
}

class ExpressionsEvaluator {
    protected tokensLookupTable: Record<string, string | number> = {};

    constructor(public expressions: Expression[], public ctx: RecursiveObject) {
        this.createTokensLookupTableFromContext();
    }

    protected createTokensLookupTableFromContext() {
        this.tokensLookupTable = this.expressions.reduce((acc, exp) => {
            return {
                ...acc,
                ...exp.figmaTokens.reduce((acc2, {expression: token}) => {
                    if (acc[token])
                        return acc[token];

                    const val = evaluateTokenInContext(token, this.ctx);

                    if (val === undefined)
                        throw new Error(`Value for token ${token} not found in current context!`);

                    return {
                        ...acc2,
                        [token]: val,
                    };
                }, {})
            }
        }, {} as Record<string, string | number>);
    }

    evaluate(expression: Expression) {
        let tokensCanBeEvaluated = true;

        const exp = expression.tokens
            .map(({type, expression, value}) => {
                let val;

                switch (type) {
                    case "operator":
                        val = expression;
                        break;
                    case "token":
                        val = this.tokensLookupTable[expression];
                        break;
                    case "value":
                        val = value !== undefined ? value : expression;
                        break;
                    default:
                        throw new Error(`Unknown token type ${type}`);
                }

                if (type !== 'operator' && typeof val === 'string') {
                    tokensCanBeEvaluated = false;
                }

                return val;
            })
            .join('');

        if (expression.canBeEvaluatedToNumber && tokensCanBeEvaluated) {
            const executor = new Function(`return ${exp};`);
            return executor();
        }

        return exp;
    }
}

interface FigmaValueObject {
    value: string | number | Record<string, string | number>
    type: string
}

const isFigmaValueObject = (val: any): val is FigmaValueObject => Boolean(val?.type);

interface RecursiveFigmaObj {
    [key: string]: FigmaValueObject | RecursiveFigmaObj
}

interface Parser {
    type: string

    parse(
        expressions: Expression[],
        executor: ExpressionsEvaluator,
        figmaTokens: TokensObject
    ): string;
}

class DefaultParser implements Parser {
    public readonly type = 'default';

    parse(expressions: Expression[], evaluator: ExpressionsEvaluator): string {
        const val = evaluator.evaluate(expressions.at(0) as Expression);

        // todo assumption to px may be wrong
        return typeof val === 'string' ? val : `${val}px`;
    }
}

class TokensObject {
    expressions: Expression[];
    protected expressionsEvaluator: ExpressionsEvaluator;
    protected parsers = new Map<string, Parser>();

    constructor(public obj: RecursiveFigmaObj) {
        this.expressions = TokensObject.createExpressionsFromFigmaObject(obj);
        this.expressionsEvaluator = new ExpressionsEvaluator(this.expressions, obj);
        this.registerParser(new DefaultParser());
    }

    getValueForKey(path: string) {
        const matchingExpressions = this.expressions.filter(exp => exp.path?.startsWith(path));

        if (!matchingExpressions.length)
            throw new Error(`No matching expressions found for path ${path}`);

        const types = [...new Set(matchingExpressions.map((exp) => exp.type)).values()];

        if (types.length > 1) {
            throw new Error(`Wrong path. For path ${path} found expressions with different types ${path}`);
        }

        const type = types.at(1) || 'default';

        if (type === 'default' && matchingExpressions.length > 1) {
            throw new Error(`Many expressions for path ${path} - to support multiple matching expressions you must register custom parser`);
        }

        const parser = this.parsers.get(type);

        if (!parser)
            throw new Error(`Parser for type ${type} not found`);

        return parser.parse(matchingExpressions, this.expressionsEvaluator, this);

    }

    registerParser(parser: Parser) {
        this.parsers.set(parser.type, parser);
    }

    static createExpressionsFromFigmaObject(obj: RecursiveFigmaObj, path = ''): Expression[] {
        return Object
            .entries(obj)
            .flatMap(([key, val]) => {
                const currentPath = `${path ? `${path}.` : ''}${key}`;

                if (isFigmaValueObject(val)) {
                    if (typeof val.value === 'object') {
                        return Object
                            .entries(val.value)
                            .map(([nestedValueKey, nestedValue]) => {
                                return new Expression(
                                    nestedValue as string,
                                    `${currentPath}.value.${nestedValueKey}`,
                                    val.type
                                );
                            });
                    }

                    return [new Expression(val.value as string, `${currentPath}.value`, val.type)];
                }

                return TokensObject.createExpressionsFromFigmaObject(val, currentPath);
            });
    }
}

const kebabize = (str: string) => str.replace(/[A-Z]+(?![a-z])|[A-Z]/g, ($: string, ofs: string) => (ofs ? "-" : "") + $.toLowerCase())

async function main() {
    const b = await readFile(resolve('./tokens.json'));
    const tokensObject = JSON.parse(b.toString());
    const ft = new TokensObject(tokensObject);

    console.log('======>', ft.getValueForKey('fontSize.xl'));
}

main();
