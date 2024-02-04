import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import * as process from 'process';

const program = new Command();

const {
    version
} = JSON.parse(readFileSync(join(process.cwd(), 'package.json')).toString());

program
    .name('quarksy')
    .description('Transforms design tokens to code')
    .version(version)
    .argument('[inputFile]', 'tokens file to be transformed', 'tokens.json')
    .option('-p, --platform <string...>', 'for which platforms you want to transform your tokens', 'css')
    .option('--token-prefix <string>', 'prefix for token variable names')
    .option('--token-set-prefix <string>', 'prefix for token sets variable names, eg. typography which may be build of many properties')
    .option('-o, --output-dir <string>', 'output directory', 'design-tokens')
    .action((inputFile, a) => {
        console.log('===>', inputFile, a);
    })

program.parse();
