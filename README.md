# Question Interactives

This project is organized as a mono-repository managed by npm workspaces and lerna.

## First build and browse

```
npm install
npm build
npm start
```

This will:
- install the top level package.json and dependencies in each subfolder
- copy the static folders to `dist`
- run `lerna build` which runs `npm build` in each subfolder
- run a local webserver serving the `dist` folder

## Running a single interactive

```
cd package/[interactive folder]
npm start
```

This runs the webpack dev server. It will automatically rebuild and reload the page when the sources are changed.

## Running all the interactives

In one terminal, run:
```
cd package/[interactive folder] && npm watch
```
Repeat that for all the interactives that you want to work on.


In another terminal, run:
```
npm start
```

This shows an index page listing the available interactives at: http://127.0.0.1:8080/.

Changes to the files in `[interactive folder]` will cause a rebuild.
You need to manually refresh the web browser after the build is complete.

## Local development setup:

1. At the moment there is no way to preview your interactive in isolation. You will need to **create a new Library Interactive in your local LARA instance** to develop in this repo. You could also create a Library Interactive on the staging server, but you should clean up after yourself so that we don't end up with a lot of `https://localhost/` development references on the staging server.
2. The `Base URL` of your Library interactive will be something like: `http://localhost:8080/<your interactive directory>/` where your interactive directory would be something like `open-response`. That should point to the top-level index of your interactive, e.g. `open-response/index.tsx`.
3. You will probably want to check the `Save Interactive State` checkbox, and possibly the checkbox for `Interactive provides an authoring UI.`

## Testing

### Unit tests

 Run `npm test` to run Jest tests in each interactive / package.

### E2E tests (Cypress)

Cypress tests are defined as one of the packages in the mono-repository: `packages/tests-e2e`.

Run `npm build` and then `npm start` in top-level directory to serve all the interactives.
Then open another terminal and run `npm run test:cypress` to start Cypress E2E tests.

## Mono Repo Setup

This repository is configured with npm workspaces and lerna to run commands on subfolders.
Individual packages specify their dependencies in their own package.json files.
npm takes care of 'hoisting' all modules into the top-level node_modules folder. This is done by the `npm install` command.
Inside of the `<subfolder>/node_modules` folder should only be a .bin folder which contains the usual dev tool executables.

### Installing a new dependency

Run `npm i <new dep> -w <interactive name>` or `npm i <new dep> -w <interactive name> --save-dev`.
If you need to add it to the workspace root run `npm i <new dep> --save`.
If you need to add it to all the workspaces run `npm i <new dep> --workspaces (--save-dev)`.

### Updating a shared dependency

When updating a dependency that is shared by multiple interactives, e.g. Webpack, it is easiest to find/replace the relevant dependencies in the editor and then run `npm install` from the root folder to synchronize the dependencies appropriately. `npm build` and `npm test` can then be used to verify that the update didn't break anything obvious.

### Import checking

Because of this hoisted dependency setup, it makes it possible to import dependencies in your code without declaring one in the subfolder's package.json file. That could happen if the top-level package.json or some other subfolder package.json added this dependency. In those two cases the dependency is now in the top-level node_modules folder. To prevent this 'undeclared dependency' problem the eslint-plugin-import module is added. It is configured to force all imports in your code to be declared in the code's package.json.

### Adding a new interactive

Use the following steps to add a new interactive:
- make a copy of the `starter` folder under `packages` and rename it with the name of the interactive in kebab-case.
  For example, if the new interactive is named "New interactive", then the folder will be named "new-interactive".
- search your newly created folder for instances of the string `starter` and replace it with the name of your interactive. For example, this string might appear in `readme.md`, and `package.json`.
- cd into your new interactive folder and run `npm start`.  DO NOT RUN `npm start` from the root folder as that just starts a http server for everything in `dist`.
- load http://localhost:8080/new-interactive/demo.html to see the default starter authoring, runtime and report-item html.  Note: the default port is 8080 and you will need to change `new-interactive` to the name you picked.  The demo will show you some example authored and interactive state and point you where to start customizing the interactive.


## Deployment

Production releases to S3 are based on the contents of the `/dist` folder and are built automatically by GitHub Actions
for each branch pushed to GitHub and each merge into production.

Merges into production are deployed to https://models-resources.concord.org/question-interactives.

Other branches are deployed to https://models-resources.concord.org/question-interactives/branch/<name>.

You can view the status of all the branch deploys [here](https://github.com/concord-consortium/question-interactives/actions).

To deploy a production release:

1. Copy CHANGELOG.md to CHANGES.md
    - Update CHANGES.md with the output of running `npm run release-notes question-interactives-[new=version-string]` from dev-templates/scripts. More details on how to do this are given [here](https://github.com/concord-consortium/dev-templates/tree/main/scripts)
    - Review this list against recently merged PRs in GitHub UI
2. Update package, commit, and tag
    1. Run `npx lerna version [new-version-string] --no-git-tag-version`. This updates the version in lerna.json and package.json files in all the interactives. ` --no-git-tag-version` ensures that lerna doesn't commit and push these changes to GitHub automatically (so there's time to review them and add a commit message).
    2. Create a new commit with the CHANGES.md message
    3. Create a tag `v[new-version-string]` with the CHANGES.md message
  - Simpler version, only on **Mac or Linux**:
      - Run `npx lerna version -m "$(< CHANGES.md)" [new-version-string] --no-push`
      - This updates the version in package.json and package-lock.json and creates a commit with the comment from CHANGES.md, and creates a tag with the name `v[new-version-string]` that has a description based on CHANGES.md.
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
7. In order to keep the fullscreen interactive used within CFM also get the most recent release, we also need to update the production branch of question interactives. To do this, run the following commands:
  - `git checkout production`
  - `git reset --hard v[new-version-string]>`
  - `git push --force origin production`
8. Verify the build and tests in Github Actions at https://github.com/concord-consortium/question-interactives/actions
9. Update the production library interactives by individually opening each one and updating the baseUrl with this new version **<-- this step actually releases the new code to the interactives in production**. If the release features involve adding one or more new question types in the library interactives, we will need to add them in the library interactives page in LARA production
10. Test a few sample question interactives by creating a test activity in Production that uses the updated or added interactives
11. Clean up your working directory by deleting `CHANGES.md`

### Lerna versioning notes

Lerna is set to use fixed versioning. It means that all the packages will use the same version that is specified in lerna.json.
In the future, it might be useful to switch to independent versioning mode.

Also, `lerna version` tool has many options that might simplify release process. See:
https://github.com/lerna/lerna/tree/main/commands/version

## LARA Interactive API

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

## Notes

Make sure if you are using Visual Studio Code that you use the workspace version of TypeScript.
To ensure that you are open a TypeScript file in VSC and then click on the version number next to
`TypeScript React` in the status bar and select 'Use Workspace Version' in the popup menu.

## License

Question Interactives are Copyright 2020 (c) by the Concord Consortium and is distributed under the [MIT license](http://www.opensource.org/licenses/MIT).

See license.md for the complete license text.
