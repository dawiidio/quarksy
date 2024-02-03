import { TokensObjectParser } from '~/TokensObjectParser';
import { Platform } from '~/platforms/Platform';
import { camelCaseToKebabCase } from '~/common';

export interface CssPlatformOptions {
    cssVariablePrefix?: string
    outFileName?: string
}

export class CssPlatform extends Platform<CssPlatformOptions> {
    getDefaultOptions(): CssPlatformOptions {
        return {
            cssVariablePrefix: '',
            outFileName: 'design-system.css'
        }
    }

    run(tokensObject: TokensObjectParser): [string, string][] {
        let variablesAcc = ':root {';
        let generalAcc = '';
        const typographyClasses: Record<string, [string, string][]> = {}

        tokensObject.expressions.forEach(exp => {
            switch (exp.type) {
                case 'typography': {
                    const pathParts = exp.path!.split('.');
                    const cssProperty = camelCaseToKebabCase(pathParts.pop() as string);
                    // remove common "value" key
                    pathParts.pop();

                    const className = pathParts.join('-');

                    if (!typographyClasses[className]) {
                        typographyClasses[className] = [];
                    }

                    const {
                        val, ext= ''
                    } = tokensObject.expressionsEvaluator.evaluate(exp);

                    typographyClasses[className].push([
                        cssProperty,
                        `${val}${ext}`
                    ]);
                }
                break;
                default: {
                    const nameWithoutValuePostfix = exp.path!.replace(/\.value$/, '');
                    const prefix = this.options?.cssVariablePrefix ? `${this.options.cssVariablePrefix}-` : '';
                    const cssVarName = (prefix) + camelCaseToKebabCase(nameWithoutValuePostfix.replaceAll('.', '-'));
                    const {
                        val, ext= ''
                    } = tokensObject.expressionsEvaluator.evaluate(exp);
                    variablesAcc += `\n    --${cssVarName}: ${val}${ext};`;
                }
            }
        });

        variablesAcc += '\n}'
        generalAcc += variablesAcc;

        generalAcc += '\n';
        generalAcc += Object.entries(typographyClasses).reduce((acc, [key, val]) => {
            return acc + `\n.${key.replaceAll('.', '-')} { \n${val.map(v => '   ' + v.join(': ') + ';').join('\n')} \n}\n`
        }, '');


        return [[this.options.outFileName as string, generalAcc]];
    }
}