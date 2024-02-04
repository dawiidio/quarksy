# @dawiidio/quarksy

This is a small, 0-dependency design-tokens parser. What are design tokens? 
For example, you may check out figma and their Tokens Studio to learn more.
In one sentence: tokens are single source of truth for both designers and 
developers saved in json file which you can export from e.g. Figma tool.

For example, it can generate css output for tokens like the below example:

```css
:root {
    --sizing-base: 2px;
    --sizing-xs: 4px;
    --sizing-s: 8px;
    --sizing-m: 24px;
    --sizing-l: 24px;
    --sizing-xl: 32px;
    --colors-primary-100: #c7fadb;
    --colors-primary-500: #05eb62;
    --colors-primary-900: #066d2f;
    --colors-secondary-100: #e9d5f8;
    --colors-secondary-500: #941bf0;
    --colors-secondary-900: #3e046a;
    --font-size-s: 14px;
    --font-size-m: 16px;
    --font-size-l: 24px;
    --font-size-xl: 36px;
    --border-radius-m: 6px;
    --font-family-primary: Ubuntu;
    --font-family-secondary: Nunito;
    --font-weight-bold: 800;
    --font-weight-thin: 300;
    --font-weight-normal: 500;
    --spacing-s: 4px;
    --spacing-m: 8px;
    --spacing-l: 24px;
}

.typography-H3 { 
   font-family: Nunito;
   font-weight: 500;
   font-size: 36px; 
}

.typography-Body1 { 
   font-family: Ubuntu;
   font-weight: 300;
   font-size: 16px; 
}
```

it will resolve all token aliases like the below ones

```json
{
  "typography": {
    "H3": {
      "value": {
        "fontFamily": "{fontFamily.secondary}",
        "fontWeight": "{fontWeight.normal}",
        "fontSize": "{fontSize.xl}"
      },
      "type": "typography"
    }
  }
}
```

to these values:

```css
.typography-H3 { 
   font-family: Nunito;
   font-weight: 500;
   font-size: 36px; 
}
```

## Installation

```shell
npm i @dawiidio/quarksy

// or

yarn add @dawiidio/quarksy
```

## Cli usage

```text
Usage: quarksy [options] [inputFile]

Transforms design tokens to code

Arguments:
  inputFile                    tokens file to be transformed (default: "tokens.json")

Options:
  -V, --version                output the version number
  -p, --platform <string...>   for which platforms you want to transform your tokens (default: ["css"])
  --token-prefix <string>      prefix for token variable names
  --token-set-prefix <string>  prefix for token sets variable names, eg. typography which may be build of many
                               properties
  -o, --output-dir <string>    output directory
  -h, --help                   display help for command
```

## Programmatic usage

Below you can see simple example, for implementation hints see `src/platforms/CssPlatform.ts`

```ts
import {
    TokensObjectParser,
    writePlatformOutputToFileSystem,
    Platform
} from '@dawiidio/quarksy';

async function main() {
    const myDesignTokensObject = {
        // json export from eg. Figma tokens
    };

    const tokensObjectParser = new TokensObjectParser(myDesignTokensObject);

    class MyPlatform extends Platform {
        run(tokensObject: TokensObjectParser): [string, string][] {
            // do something to transform tokensObject to platform specific code
            return []
        }
    }

    const myPlatform = new MyPlatform();
    
    await writePlatformOutputToFileSystem(myPlatform.run(tokensObjectParser));
}
```

## Supported platforms

For now only CSS, soon will be more :)