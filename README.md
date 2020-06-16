# Question Interactives

## Development

### Initial steps

1. Clone this repo and `cd` into it
2. Run `npm install` to pull dependencies
3. Run `npm start` to run `webpack-dev-server` in development mode with hot module replacement

### Building

If you want to build a local version run `npm build`, it will create the files in the `dist` folder.
You *do not* need to build to deploy the code, that is automatic. See more info in the Deployment section below.

### LARA Interactive API

The question interactives make use of the [LARA Interactive API](https://github.com/concord-consortium/lara/blob/master/lara-typescript/README.md#lara-interactive-api). To test the question interactives against a locally modified version of the LARA Interactive API:

```
cd [lara/lara-typescript]
npm run lara-api:link      # creates global symlink for clients to link to
cd [question-interactives]
npm run lara-api:link      # symlinks the question-interactives to the global symlink
```

To restore use of the published version of the LARA Interactive API:

```
cd [question-interactives]
npm run lara-api:unlink    # restores use of the published version for question-interactives
cd [lara/lara-typescript]
npm run lara-api:unlink    # removes the global symlink
```

### Notes

1. Make sure if you are using Visual Studio Code that you use the workspace version of TypeScript.
   To ensure that you are open a TypeScript file in VSC and then click on the version number next to
   `TypeScript React` in the status bar and select 'Use Workspace Version' in the popup menu.

## Deployment

Production releases to S3 are based on the contents of the /dist folder and are built automatically by Travis
for each branch pushed to GitHub and each merge into production.

Merges into production are deployed to https://models-resources.concord.org/question-interactives.

Other branches are deployed to https://models-resources.concord.org/question-interactives/branch/<name>.

You can view the status of all the branch deploys [here](https://travis-ci.org/concord-consortium/question-interactives/branches).

### Testing

Run `npm test` to run jest tests. Run `npm run test:full` to run jest and Cypress tests.

##### Cypress Run Options

Inside of your `package.json` file:
1. `--browser browser-name`: define browser for running tests
2. `--group group-name`: assign a group name for tests running
3. `--spec`: define the spec files to run
4. `--headed`: show cypress test runner GUI while running test (will exit by default when done)
5. `--no-exit`: keep cypress test runner GUI open when done running
6. `--record`: decide whether or not tests will have video recordings
7. `--key`: specify your secret record key
8. `--reporter`: specify a mocha reporter

##### Cypress Run Examples

1. `cypress run --browser chrome` will run cypress in a chrome browser
2. `cypress run --headed --no-exit` will open cypress test runner when tests begin to run, and it will remain open when tests are finished running.
3. `cypress run --spec 'cypress/integration/examples/smoke-test.js'` will point to a smoke-test file rather than running all of the test files for a project.

## License

Question Interactives are Copyright 2020 (c) by the Concord Consortium and is distributed under the [MIT license](http://www.opensource.org/licenses/MIT).

See license.md for the complete license text.
