import { isNumberValue, isTokenStringReference, EXP_OP_PAIR_REGEX, NUMBER_VALUE_REGEX } from '~/common';

export type ValueExpressionSingleTokenType = 'operator' | 'value' | 'token';

export interface ValueExpressionSingleToken {
    type: ValueExpressionSingleTokenType
    stringExpression: string
    value?: string | number
    ext?: string
}

export class ValueExpression {
    tokens: ValueExpressionSingleToken[] = [];
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

    get tokenExpressions() {
        return this.tokens.filter(({type}) => type === 'token');
    }

    protected parse() {
        const matches = [...this.expression.matchAll(EXP_OP_PAIR_REGEX)];

        matches.forEach((val, i) => {
            const {
                operator,
                expression,
            } = val.groups || {};

            if (operator) {
                this.tokens.push({
                    stringExpression: operator,
                    type: "operator",
                });
            }

            if (isTokenStringReference(expression)) {
                this.tokens.push({
                    stringExpression: expression,
                    type: 'token'
                });
                return;
            }

            if (isNumberValue(expression)) {
                const match = expression.match(NUMBER_VALUE_REGEX) as RegExpMatchArray;

                this.tokens.push({
                    stringExpression: expression,
                    type: 'value',
                    value: parseInt(match.groups!.numbers),
                    ext: match.groups!.ext
                });
                return;
            }

            this.tokens.push({
                stringExpression: expression,
                type: 'value'
            });
            this.canBeEvaluatedToNumber = false;
        });
    }
}