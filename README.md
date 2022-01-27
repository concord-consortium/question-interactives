# Question Interactives

## Development

### Initial steps

1. Clone this repo and `cd` into it
2. Run `npm install` to pull dependencies
3. Run `npm start` to run `webpack-dev-server` in development mode with hot module replacement

### Local development setup:

1. At the moment there is no way to preview your components in isolation. You will need to **create a new Library Interactive in your local LARA instance** to develop in this repo. You could also create a Library Interactive on the staging server, but you should clean up after yourself so that we don't end up with a lot of `https://localhost/` development references on the staging server.
2. The `Base URL` of your Library interactive will be something like: `http://localhost:8080/<your component directory>/` where your component directory would be something like `open-response`. That should point to the top-level index of your component, e.g. `open-response/index.tsx`.
3. You will probably want to check the `Save Interactive State` checkbox, and possibly the checkbox for `Interactive provides an authoring UI.`

#### Adding a new Interactive type:
In addition to copying your component source into `./src/your-component/` you will also
need to add a few new entries to webpack.config.js:

 ```javascript
   // webpack.config.js
   ...
	entry: {
		...
		'YourComponent': './src/your-component/index.tsx'
	},
	...
	new HtmlWebpackPlugin({
		chunks: ['YourComponent'],
		filename: 'your-component/index.html',
		template: 'src/shared/index.html'
	}),
   ...

```

### Building

If you want to build a local version run `npm build`, it will create the files in the `dist` folder.
You *do not* need to build to deploy the code, that is automatic. See more info in the Deployment section below.

### LARA Interactive API

The question interactives make use of the [LARA Interactive API](https://github.com/concord-consortium/lara/blob/master/lara-typescript/README.md#lara-interactive-api). To test the question interactives against a locally modified version of the LARA Interactive API:

```
cd [lara/lara-typescript]
npm install
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

Production releases to S3 are based on the contents of the `/dist` folder and are built automatically by Travis
for each branch pushed to GitHub and each merge into production.

Merges into production are deployed to https://models-resources.concord.org/question-interactives.

Other branches are deployed to https://models-resources.concord.org/question-interactives/branch/<name>.

You can view the status of all the branch deploys [here](https://travis-ci.org/concord-consortium/question-interactives/branches).

To deploy a production release:

1. Copy CHANGELOG.md to CHANGES.md
    - Update CHANGES.md with the output of running `npm run release-notes question-interactives-[new=version-string]` from dev-templates/scripts. More details on how to do this are given [here](https://github.com/concord-consortium/dev-templates/tree/main/scripts)
    - Review this list against recently merged PRs in GitHub UI
2. Update package, commit, and tag
    - **Mac or Linux**:
        - Run `npm version -m "$(< CHANGES.md)" [new-version-string]`
        - This updates the version in package.json and package-lock.json and creates a commit with the comment from CHANGES.md, and creates a tag with the name `v[new-version-string]` that has a description based on CHANGES.md.
    - **Windows**: the command above that injects `CHANGES.md` as the message won't work in the standard windows command application.
        - git-bash: same as above
        - PowerShell: `npm version -m "(type CHANGES.md)" [new-version-string]` might work, I haven't tried it though.
        - Do the steps manually and use a git client so you can paste in the multi line message
            1. `npm version --no-git-tag-version [new-version-string]` (updates package.json and package-lock.json with the new version)
            2. create a new commit with the CHANGES.md message
            3. create a tag `v[new-version-string]` with the CHANGES.md message
3. Push current branch and tag to GitHub
  - `git push origin master`
  - `git push origin v<new version>`
4. Verify the build and tests in Github Actions at https://github.com/concord-consortium/question-interactives/actions
5. Once built, create a few library interactives with the versioned URL in LARA and QA them.
6. Create a GitHub Release
    1. Find the new tag at https://github.com/concord-consortium/question-interactives/tags open it, and edit it
    2. Copy the title from CHANGES.md
    3. Copy the content from CHANGES.md
    4. Hit "Publish Release" button
7. Update the production library interactives by individually opening each one and updating the baseUrl with this new version **<-- this step actually releases the new code to the interactives in production**. If the release features involve adding one or more new question types in the library interactives, we will need to add them in the library interactives page in LARA production
8. Test a few sample question interactives by creating a test activity in Production that uses the updated or added interactives
9. Clean up your working directory by deleting `CHANGES.md`

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
