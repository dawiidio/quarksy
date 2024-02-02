import { ValueExpression } from '~/ValueExpression';
import { ValueExpressionsEvaluator } from '~/ValueExpressionsEvaluator';
import { RecursiveTokensObj } from '~/types';
import { Parser } from '~/Parser';
import { DefaultParser } from '~/parsers/default';
import { isTokenValueObject } from '~/common';

export class TokensObject {
    expressions: ValueExpression[];
    protected expressionsEvaluator: ValueExpressionsEvaluator;
    protected parsers = new Map<string, Parser>();

    constructor(public obj: RecursiveTokensObj) {
        this.expressions = TokensObject.createExpressionsFromFigmaObject(obj);
        this.expressionsEvaluator = new ValueExpressionsEvaluator(this.expressions, obj);
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

    static createExpressionsFromFigmaObject(obj: RecursiveTokensObj, path = ''): ValueExpression[] {
        return Object
            .entries(obj)
            .flatMap(([key, val]) => {
                const currentPath = `${path ? `${path}.` : ''}${key}`;

                if (isTokenValueObject(val)) {
                    if (typeof val.value === 'object') {
                        return Object
                            .entries(val.value)
                            .map(([nestedValueKey, nestedValue]) => {
                                return new ValueExpression(
                                    nestedValue as string,
                                    `${currentPath}.value.${nestedValueKey}`,
                                    val.type,
                                );
                            });
                    }

                    return [new ValueExpression(val.value as string, `${currentPath}.value`, val.type)];
                }

                return TokensObject.createExpressionsFromFigmaObject(val, currentPath);
            });
    }
}