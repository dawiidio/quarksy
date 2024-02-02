import {isNumberValue, isTokenStringReference, REGEX} from "~/common";

export type ValueExpressionSingleTokenType = 'operator' | 'value' | 'token';

export interface ValueExpressionSingleToken {
    type: ValueExpressionSingleTokenType
    expression: string
    value?: string | number
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

            if (isTokenStringReference(expression)) {
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