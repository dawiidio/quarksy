import {
    readFile,
    writeFile,
} from 'node:fs/promises';
import {
    resolve,
} from 'node:path';
import { TokensObjectParser } from '~/TokensObjectParser';
import { CssPlatform } from '~/platforms/CssPlatform';

async function main() {
    const b = await readFile(resolve('./tokens.json'));
    const tokensObject = JSON.parse(b.toString());
    const tokensObjectParser = new TokensObjectParser(tokensObject);

    const cssPlatform = new CssPlatform({
        outFileName: 'test.css',
    });

    await Promise.all(
        cssPlatform
            .run(tokensObjectParser)
            .map(async ([fileName, content]) => await writeFile(fileName, content)),
    );
}

main();
