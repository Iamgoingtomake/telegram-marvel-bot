## Install

* Install dependencies:
```bash
npm install
```
* Create a Marvel Unlimited account [here](https://www.marvel.com/comics/unlimited)
* Sign in [developer.marvel.com](https://developer.marvel.com/account) and get your public and private key
* Create [a new bot](https://core.telegram.org/bots) in Telegram, you will get a token
* create a .env file with MARVEL_PUBLIC_KEY, MARVEL_PRIVATE_KEY, TELEGRAM_TOKEN variables.

## Use

* /help: command to get the instructions
* /aboutCharacter character: You can get the biography of a character, you can also specify the universe or name by placing it in parentheses.
```
Ejemplo: /aboutCharacter Spider-man (Ultimate) or /aboutCharacter Venom (Flash Thompson)
```
* /getComicsWhere character: Get a list of some comics in which a character has participated, you can specify the universe or name in parentheses.
```
Ejemplo: /getComicsWhere Captain America
```
* /getEventInfo event: Get a list of some comics in which a character has participated, you can specify the universe or name in parentheses.
```
Ejemplo: /getEventInfo civil war
```
