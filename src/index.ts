import {
    readFile
} from 'node:fs/promises';
import {
    resolve
} from 'node:path';
import {TokensObject} from "~/TokensObject";

async function main() {
    const b = await readFile(resolve('./tokens.json'));
    const tokensObject = JSON.parse(b.toString());
    const ft = new TokensObject(tokensObject);

    console.log('======>', ft.getValueForKey('fontSize.xl'));
}

main();
