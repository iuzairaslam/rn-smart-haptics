# Contributing

Contributions are always welcome, no matter how large or small!

We want this community to be friendly and respectful to each other. Please follow it in all your interactions with the project. Before contributing, please read the [code of conduct](./CODE_OF_CONDUCT.md).

## Development workflow

This project is a monorepo managed using [Yarn workspaces](https://yarnpkg.com/features/workspaces). It contains the following packages:

- The library package in the root directory.
- An example app in the `example/` directory.

To get started with the project, make sure you have the correct version of [Node.js](https://nodejs.org/) installed. See the [`.nvmrc`](./.nvmrc) file for the version used in this project.

Run `yarn` in the root directory to install the required dependencies for each package:

```sh
yarn
```

> Since the project relies on Yarn workspaces, you cannot use [`npm`](https://github.com/npm/cli) for development without manually migrating.

The [example app](/example/) demonstrates usage of the library. You need to run it to test any changes you make.

It is configured to use the local version of the library, so any changes you make to the library's source code will be reflected in the example app. Changes to the library's JavaScript code will be reflected in the example app without a rebuild, but native code changes will require a rebuild of the example app.

If you want to use Android Studio or Xcode to edit the native code, you can open the `example/android` or `example/ios` directories respectively in those editors. To edit the Objective-C or Swift files, open `example/ios/RnSmartHapticsExample.xcworkspace` in Xcode and find the source files at `Pods > Development Pods > rn-smart-haptics`.

To edit the Java or Kotlin files, open `example/android` in Android studio and find the source files at `rn-smart-haptics` under `Android`.

You can use various commands from the root directory to work with the project.

To start the packager:

```sh
yarn example start
```

To run the example app on Android:

```sh
yarn example android
```

To run the example app on iOS:

```sh
yarn example ios
```

To confirm that the app is running with the new architecture, you can check the Metro logs for a message like this:

```sh
Running "RnSmartHapticsExample" with {"fabric":true,"initialProps":{"concurrentRoot":true},"rootTag":1}
```

Note the `"fabric":true` and `"concurrentRoot":true` properties.

Make sure your code passes TypeScript:

```sh
yarn typecheck
```

To check for linting errors, run the following:

```sh
yarn lint
```

To fix formatting errors, run the following:

```sh
yarn lint --fix
```



### Scripts

The `package.json` file contains various scripts for common tasks:

- `yarn`: setup project by installing dependencies.
- `yarn typecheck`: type-check files with TypeScript.
  - `yarn lint`: lint files with [ESLint](https://eslint.org/).
    - `yarn example start`: start the Metro server for the example app.
- `yarn example android`: run the example app on Android.
- `yarn example ios`: run the example app on iOS.
  
### Sending a pull request

> **Working on your first pull request?** You can learn how from this _free_ series: [How to Contribute to an Open Source Project on GitHub](https://app.egghead.io/playlists/how-to-contribute-to-an-open-source-project-on-github).

When you're sending a pull request:

- Prefer small pull requests focused on one change.
- Verify that linters and tests are passing.
- Review the documentation to make sure it looks good.
- Follow the pull request template when opening a pull request.
- For pull requests that change the API or implementation, discuss with maintainers first by opening an issue.

## Releases (maintainers)

Keep **npm**, **`package.json`**, and **git tags** in sync: the published tarball version must match **`version`** in `package.json`, and the release tag must be **`v` + that same string** (e.g. `1.0.2` in `package.json` → tag **`v1.0.2`**). npm does not allow republishing an existing version.

**GitHub’s “Packages” tab** only lists packages published to **GitHub Packages**; it stays empty while you publish only to **registry.npmjs.org**. The canonical public package page is **npm**, linked from this repo’s README.

### npm

1. Update **[CHANGELOG.md](CHANGELOG.md)** and bump **`version`** in **[package.json](./package.json)** on `main` (or your release branch).
2. Open a PR if you want review, then merge.
3. Create and push an annotated tag that matches the version, e.g. **`v1.0.1`**:
   ```sh
   git tag -a v1.0.1 -m "v1.0.1"
   git push origin v1.0.1
   ```
4. **[Publish to npm](.github/workflows/publish.yml)** runs on tag push **`v*`** (same layout as [react-native-adaptive-text](https://github.com/iuzairaslam/react-native-adaptive-text)): **`npm install --legacy-peer-deps`**, **`npm run typecheck`**, then **`npm publish --access public`**. The **`prepare`** script builds **`lib/`** during publish.

Configure a repository secret **`NPM_TOKEN`** (npm “Automation” or “Publish” token). Without it, the workflow fails at the publish step.

To publish locally instead:

```sh
yarn verify
yarn publish:npm
# or: npm publish --access public
```

Use your own npm login; do not commit tokens.

### GitHub Actions

- **Publish** (`.github/workflows/publish.yml`) runs on **`v*`** tags and on **workflow_dispatch** (manual). There is no separate CI workflow in this repo—run **`yarn verify`** locally before merging when you change native or library code.
