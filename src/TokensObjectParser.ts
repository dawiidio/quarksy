import { ValueExpression } from '~/ValueExpression';
import { ValueExpressionsEvaluator } from '~/ValueExpressionsEvaluator';
import { RecursiveTokensObj } from '~/types';
import { isTokenValueObject } from '~/common';

export class TokensObjectParser {
    expressions: ValueExpression[];
    expressionsEvaluator: ValueExpressionsEvaluator;

    constructor(public obj: RecursiveTokensObj) {
        this.expressions = TokensObjectParser.createExpressionsValuesFromTokensObject(obj);
        this.expressionsEvaluator = new ValueExpressionsEvaluator(this.expressions, obj);
    }

    static createExpressionsValuesFromTokensObject(obj: RecursiveTokensObj, path = ''): ValueExpression[] {
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

                return TokensObjectParser.createExpressionsValuesFromTokensObject(val, currentPath);
            });
    }
}