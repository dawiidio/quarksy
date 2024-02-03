import { ValueExpression, ValueExpressionSingleToken } from '~/ValueExpression';
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
                ...exp.tokenExpressions.reduce((acc2, {stringExpression: token}) => {
                    if (acc[token]) {
                        return acc2;
                    }

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

    evaluate(expression: ValueExpression): { ext?: string, val: number | string } {
        let tokensCanBeEvaluatedToNumber = true;
        // let allUsedTokens: ValueExpressionSingleToken[] = expression.tokens;
        const usedExtensions = new Set<string>;

        const exp = expression.tokens
            .map(({type, stringExpression, value, ext}) => {
                let val;

                if (ext)
                    usedExtensions.add(ext);

                switch (type) {
                    case "operator":
                        val = stringExpression;
                        break;
                    case "token":
                        val = this.tokensLookupTable[stringExpression];
                        break;
                    case "value":
                        val = value !== undefined ? value : stringExpression;
                        break;
                    default:
                        throw new Error(`Unknown token type ${type}`);
                }

                if (type === 'token') {
                    const ve = new ValueExpression(String(val));
                    tokensCanBeEvaluatedToNumber = ve.canBeEvaluatedToNumber;
                    ve.tokens.map(t => t.ext).forEach(e => e && usedExtensions.add(e))

                    const {
                        val: evaluatedVal, ext: evaluatedExt
                    } = this.evaluate(ve);

                    if (evaluatedExt)
                        usedExtensions.add(evaluatedExt);

                    return evaluatedVal;
                }

                if (type !== 'operator' && typeof val === 'string') {
                    tokensCanBeEvaluatedToNumber = false;
                }

                return val;
            })
            .join('');

        if (expression.canBeEvaluatedToNumber && tokensCanBeEvaluatedToNumber) {
            const executor = new Function(`return ${exp};`);
            const val = executor();

            return {
                val,
                ext: [...usedExtensions.values()].at(0) as string
            }
        }

        return {
            val: exp
        };
    }
}
