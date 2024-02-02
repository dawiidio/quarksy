import {ValueExpression} from "~/ValueExpression";
import {ValueExpressionsEvaluator} from "~/ValueExpressionsEvaluator";
import {TokensObject} from "~/TokensObject";

export interface Parser {
    type: string

    parse(
        expressions: ValueExpression[],
        executor: ValueExpressionsEvaluator,
        figmaTokens: TokensObject
    ): string;
}