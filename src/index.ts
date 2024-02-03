import {
    readFile,
    writeFile
} from 'node:fs/promises';
import {
    resolve,
} from 'node:path';
import { TokensObjectParser } from '~/TokensObjectParser';
import { CssPlatform } from '~/platforms/CssPlatform';

async function main() {
    const b = await readFile(resolve('./tokens.json'));
    const tokensObject = JSON.parse(b.toString());
    const ft = new TokensObjectParser(tokensObject);

    const css = new CssPlatform();

    await Promise.all(css.run(ft).map(async ([fileName, content]) => {
        await writeFile(fileName, content);
    }));
}

main();
