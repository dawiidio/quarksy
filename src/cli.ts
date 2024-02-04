#!/usr/bin/env node

import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import * as process from 'process';
import { readFile, writeFile } from 'node:fs/promises';
import { TokensObjectParser } from '~/TokensObjectParser';
import { CssPlatform } from '~/platforms/CssPlatform';
import { Platform } from '~/platforms/Platform';
import { writePlatformOutputToFileSystem } from '~/common';

const program = new Command();

const {
    version,
} = JSON.parse(readFileSync(join(__dirname, '..', 'package.json')).toString());

interface ProgramOptions {
    platform: string[];
    tokenPrefix?: string;
    tokenSetPrefix?: string;
    outputDir?: string;
}

const platformFactory = (options: ProgramOptions): Platform[] => {
    return options.platform.map(platformName => {
        switch (platformName) {
            case 'css':
                return new CssPlatform({
                    outFileName: 'design-tokens.css',
                    cssVariablePrefix: options.tokenPrefix,
                    cssClassPrefix: options.tokenSetPrefix,
                });
            default:
                throw new Error(`Unknown platform ${platformName}`);
        }
    });
};

program
    .name('quarksy')
    .description('Transforms design tokens to code')
    .version(version)
    .argument('[inputFile]', 'tokens file to be transformed', 'tokens.json')
    .option('-p, --platform <string...>', 'for which platforms you want to transform your tokens', ['css'])
    .option('--token-prefix <string>', 'prefix for token variable names')
    .option('--token-set-prefix <string>', 'prefix for token sets variable names, eg. typography which may be build of many properties')
    .option('-o, --output-dir <string>', 'output directory')
    .action(async (inputFile: string, options: ProgramOptions) => {
        const {
            outputDir = process.cwd(),
        } = options;
        console.log(`Tokens input file: ${inputFile}`);
        const tokensObject = JSON.parse((await readFile(resolve(inputFile))).toString());
        const tokensObjectParser = new TokensObjectParser(tokensObject);

        const pathsToGeneratedFiles = await Promise.all(
            platformFactory(options).flatMap((platform) =>
                writePlatformOutputToFileSystem(platform.run(tokensObjectParser), outputDir)
            )
        );

        console.log(`Generated platforms files: ${pathsToGeneratedFiles.map(path => `\n - ${path}`)}`);
    });

program.parse();
