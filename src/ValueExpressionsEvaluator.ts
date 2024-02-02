import {ValueExpression} from "~/ValueExpression";
import {evaluateTokenInContext, RecursiveObject} from "~/common";

export class ValueExpressionsEvaluator {
    protected tokensLookupTable: Record<string, string | number> = {};

    constructor(public expressions: ValueExpression[], public ctx: RecursiveObject) {
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

    evaluate(expression: ValueExpression) {
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
