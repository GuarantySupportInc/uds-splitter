![uds-splitter-screenshot.png](uds-splitter-screenshot.png)

# UDS Splitter Utility 
Welcome! This is the source code repository for the UDS Splitter desktop utility. Please observe our [LICENSE](LICENSE)
and also make note of the features completed or pending below! The reason for this project is some Guaranty Associations
have had difficulty loading larger Uniform Data Standard 2.0 (UDS) files into their Claim System. This difficulty is
largely because of unoptimized validation pipelines or in-memory data processing from lower versions of programming
languages like Visual Basic. Another issue is UDS 2.0 files cannot be easily split into their individual parts since
some systems rely on the HEADER and TRAILER rows to validate data before importing it which means that manually modifying
UDS records also depends on users knowing how to fix the HEADER and TRAILER for each record type. This software aims to
solve this problem by making the split process easy while still making the new files UDS compatible.

| Status             | Icon          |
|--------------------|---------------|
| :white_check_mark: | Completed     |
| :pencil2:          | In Progress   |
| :x:                | Not completed |


| Stage         | Meaning                                                   |
|---------------|-----------------------------------------------------------|
| Implementation | Code is written in this stage                             |
| Testing       | Code is tested for reliability and flexibility            |
| 3rd-Party Verified | Another party outside GSI has confirmed the feature works |


| Feature                                        | Implementation     | Testing            | 3rd-Party Verified |
|------------------------------------------------|--------------------|--------------------|--------------------|
| Split A Record                                 | :white_check_mark: | :white_check_mark: | :x:                |
| Split F Record                                 | :white_check_mark: | :white_check_mark: | :x:                |
| Split G Record                                 | :white_check_mark: | :white_check_mark: | :x:                |
| Split I Record                                 | :white_check_mark: | :white_check_mark: | :x:                |
| Split M Record                                 | :x:                | :x:                | :x:                |
| Split B Record                                 | :white_check_mark: | :white_check_mark: | :x:                |
| Split C Record                                 | :x:                | :x:                | :x:                |
| Split D Record                                 | :x:                | :x:                | :x:                |
| Keep claims together during split              | :white_check_mark: | :white_check_mark: | :x:                |
| Logging to file                                | :white_check_mark: | :white_check_mark: | :x:                |
| GitHub Checks integration for /dev and /master | :white_check_mark: | :white_check_mark: | :x:                |
| Windows Code Signing Certificate               | :x:                | :x:                | :x:                |
| Apple Code Signing Certificate                 | :x:                | :x:                | :x:                |
| Automatic Record Type Detection                | :white_check_mark: | :white_check_mark: | :x:                |
| Progress Bar                                   | :white_check_mark: | :white_check_mark: | :x:                |
| Open Folder on Complete                        | :white_check_mark: | :white_check_mark: | :x:                |
| Ability to save settings                       | :x:                | :x:                | :x:                |
| 'Help' links in menubar                        | :white_check_mark: | :white_check_mark: | :x:                |
| Downloadable installation executable           | :white_check_mark: | :white_check_mark: | :x:                |
| User Manual                                    | :white_check_mark: | :white_check_mark: | :x:                |


## How to build from source code
This repository is using ElectronJS with the underlying web framework NodeJS. Thus you will need to install the latest
version of [NodeJS](https://nodejs.org/en).
1. Go to project base directory where [package.json](package.json) is located.
2. Run `npm install` which will download all dependencies listed in package.json and their specific required version
3. Run `npm run make` which is a saved command alias in package.json which runs the underlying command `electron-forge make`
4. To test the project, run `npm test` for Unit Tests using Mocha, and `npm run wdio` for UI testing which is another command alias for `wdio run ./wdio.conf.js`. Keep in mind the UI testing is incomplete and is not as comprehensive as the Unit Testing.

## Versioning Scheme
The version displayed at the bottom of the UDS Splitter Desktop utility is simply the date of the last published version.
v{year}.{month}.{day} without '0'-padding. There are only a limited number of features for this desktop utility, so there is no
'roadmap' or major releases which might encourage the versioning to be any other way. If that changes in the future, so will
the versioning scheme.

It is encouraged that you have the latest published release since it will have the latest security patches and bug fixes.
An implemented NodeJS dependency `update-electron-app` claims to assist in this upgrade process automatically, but it is untested.