# NLP.js integration with Microsoft Bot Builder

This is a demonstration of a bot which uses a private NLP, rather than sending its data to the cloud for classification.

## Running locally

Install MongoDB and start it up:

```shell
docker run -p 27017:27017 mongo
```

Build the code:
```shell
make setup
make build
make ms
```

Download and install Microsoft Bot Framework Emulator.

Open the Bot Emulator and connect to: `http://localhost:3001/api/messages`.

Say `hello`

## Building

tl;dr: `make`

To install dependencies: `make setup`

To retrain the bot: `make train`

To run the bot for slack: `make slack`

To run against microsoft bot framework `make ms`

## Training

To train the bot, please see https://github.com/notquiterussell/botbuilder-nlpjs

## Credits

Smalltalk based on the work here: https://github.com/alyssaong1/botframework-smalltalk
