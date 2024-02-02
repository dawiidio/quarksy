import {ValueExpression} from "~/ValueExpression";
import {ValueExpressionsEvaluator} from "~/ValueExpressionsEvaluator";
import {Parser} from "~/Parser";

export class DefaultParser implements Parser {
    public readonly type = 'default';

    parse(expressions: ValueExpression[], evaluator: ValueExpressionsEvaluator): string {
        const val = evaluator.evaluate(expressions.at(0) as ValueExpression);

        // todo assumption to px may be wrong
        return typeof val === 'string' ? val : `${val}px`;
    }
}