# Contributing
First and foremost, we appreciate your interest in this project. This document contains essential information if you want to contribute.

## Development discussion
For bugs, new features or improvements, open a new [issue](https://github.com/vostpt/bot/issues/new).

## Which Branch?
Pull requests should always target the `master` branch.

## Coding Style
This project follows the [Airbnb JavaScript style guide](https://github.com/airbnb/javascript).

### JavaScript ESLint
An [ESLint](https://eslint.org/) script is hooked into the CI pipeline, so you'll be notified of any coding standards issues when pushing code.

#### Check
On each build, the `lint` npm script is executed to make sure the coding standards are followed.

#### Fix
If the build breaks due to coding standards, the following command can fix the issues:

```sh
./node_modules/.bin/eslint --fix <file or directory name>
```

Although it is advisable to fix issues by hand to build awareness for the future. Doing it by hand trains us to avoid committing those kinds of issues again.

### PHPDoc
The following is a valid documentation block example:

```js
/**
 * Get earthquakes and filters by a specific date
 *
 * @param {Date} date
 * @returns {Array} earthquakes
 */
const getByDate = async (date) => {
...
};
```

## Committing to git
Each commit **MUST** have a proper message describing the work that has been done.
This is called [Semantic Commit Messages](https://seesparkbox.com/foundry/semantic_commit_messages).

Here's what a commit message should look like:

```txt
feat(Occurrences): implement API client to fetch occurrence data
^--^ ^---------^   ^-------------------------------------------^
|    |             |
|    |             +-> Description of the work in the present tense.
|    |
|    +---------------> Scope of the work.
|
+--------------------> Type: chore, docs, feat, fix, hack, refactor, style, or test.
```

## Branching strategy
We will be using the **branch-per-issue** workflow.

This means that for each open [issue](https://github.com/vostpt/bot/issues), we'll create a corresponding **git** branch.

For instance, issue `#123` should have a corresponding `BOT-123/ShortTaskDescription` branch, which **MUST** branch off the latest code in `master`.
