#!/usr/bin/env node

/*
    Copyright 2025 HaveSource

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
*/

import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import inquirer from 'inquirer';
import PackageJson from '@npmcli/package-json';
import ejs from 'ejs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CreateCordovaPlugin {
    constructor (rootDir, answers) {
        this.answers = answers;

        // Will be used when creating the plugin's package.json
        this.basePackageJson = {
            name: answers.id,
            version: '1.0.0',
            description: answers.description,
            main: 'index.js',
            keywords: ['cordova', 'plugin'],
            author: answers.author,
            license: answers.license
        };

        this.location = {};
        this.location.pluginDir = path.resolve(rootDir, answers.id);
        this.location.srcDir = path.join(this.location.pluginDir, 'src');
        this.location.wwwDir = path.join(this.location.pluginDir, 'www');

        this.additionalData = {};
        this.additionalData.androidPackagePathPartial = this.answers.androidPackage?.split('.')?.join('/');
    }

    async exec () {
        // 1. Build up more locations that are based on selected paths
        await this._createPlatformDirPaths();
        // 2. Make all directories based on paths.
        await this._mkdirForAllLocations();
        // 3. Creates <plugin>/package.json
        await this._createPluginPackageJson();
        // 4. Create plugin.xml
        await this.generatePluginXml();
        // 5. Create plugin's front-end API
        await this.generateFrontendAPI();
        // 6. Create iOS Swift source file if iOS platform is supported
        if (this.answers.platforms.includes('ios')) {
            await this.generateiOSContent();
        }
        // 7. Create Android Kotlin source file if Android platform is supported
        if (this.answers.platforms.includes('android')) {
            await this.generateAndroidContent();
        }
        // 8. Create Electron structure if Electron platform is supported
        if (this.answers.platforms.includes('electron')) {
            await this.generateElectronContent();
        }

        console.log(`\nCordova plugin was successfully created at: ${this.location.pluginDir}\n`);
    }

    async _createPlatformDirPaths () {
        for (const platform of this.answers.platforms) {
            this.location[`platform${ucfirst(platform)}`] = platform === 'android'
                ? path.join(this.location.srcDir, platform, this.answers.androidPackage.split('.').join(path.sep))
                : path.join(this.location.srcDir, platform);
        }
    }

    async _mkdirForAllLocations () {
        for (const p of Object.keys(this.location)) {
            await mkdir(this.location[p], { recursive: true });
        }
    }

    async _createPluginPackageJson () {
        const pkgJson = await PackageJson.create(this.location.pluginDir, {
            data: {
                ...this.basePackageJson,
                cordova: {
                    id: this.answers.id,
                    platforms: this.answers.platforms
                }
            }
        });
        return await pkgJson.save();
    }

    async generatePluginXml () {
        const content = await this._renderEJSFile('plugin.xml.ejs');
        const outputPath = path.join(this.location.pluginDir, 'plugin.xml');
        return await formatAndWriteFile(outputPath, content, 'utf-8');
    }

    async generateFrontendAPI () {
        const content = await this._renderEJSFile('api.js.ejs');
        const outputPath = path.join(this.location.wwwDir, `${this.answers.apiName}.js`);
        return await formatAndWriteFile(outputPath, content, 'utf-8');
    }

    async generateAndroidContent () {
        /*
         * NOTE: "this.location.platformAndroid" is not "<plugin-name>/android". It is android's package location.
         * E.g. "<plugin-name>/src/android/com/example/sampleplugin/"
         */
        const content = await this._renderEJSFile('android.service.kt.ejs');
        const outputPath = path.join(this.location.platformAndroid, `${this.answers.apiName}.kt`);
        return await formatAndWriteFile(outputPath, content, 'utf-8');
    }

    async generateElectronContent () {
        const pkgJson = await PackageJson.create(this.location.platformElectron, {
            data: {
                ...this.basePackageJson,
                name: `${this.basePackageJson.name}-electron`,
                keywords: [
                    ...this.basePackageJson.keywords,
                    'electron',
                    'native'
                ],
                cordova: {
                    serviceName: this.answers.apiName
                }
            }
        });
        await pkgJson.save();

        const content = await this._renderEJSFile('electron.service.js.ejs');
        const outputPath = path.join(this.location.platformElectron, 'index.js');
        return await formatAndWriteFile(outputPath, content, 'utf-8');
    }

    async generateiOSContent () {
        const content = await this._renderEJSFile('ios.service.swift.ejs');
        const outputPath = path.join(this.location.platformIos, `${this.answers.apiName}.swift`);
        return await formatAndWriteFile(outputPath, content, 'utf-8');
    }

    async _renderEJSFile (fileName) {
        return await ejs.renderFile(
            path.join(__dirname, 'template', fileName),
            { answers: this.answers, additionalData: this.additionalData }
        );
    }
}

function ucfirst (str) {
    return str?.charAt(0).toUpperCase() + str?.slice(1) || str;
}

async function formatAndWriteFile (path, content) {
    let formatContent = content.split('\n')
        .map(line => line.replace(/\s+$/, '')) // remove trailing whitespaces
        .join('\n');

    if (!formatContent.endsWith('\n')) {
        formatContent += '\n';
    }

    return await writeFile(path, formatContent, 'utf-8');
}

/**
 * Gathers information from the user that is used for creating the plugin directory structure and files
 *
 * @returns {Object} User answer to the questions
 */
async function gatherPluginInfoByUserInput () {
    console.log('Welcome to the Cordova Plugin initializer tool!\n');

    try {
        const answers = await inquirer.prompt([
            {
                name: 'id',
                message: 'ID (npm package & directory name):',
                default: 'cordova-plugin-sample',
                validate: (id) => /^[a-z0-9]+(?:[-.][a-z0-9]+)*$/.test(id)
            },
            { name: 'name', message: 'Readable Name:', default: 'Cordova Sample Plugin' },
            { name: 'description', message: 'Description:', default: 'A sample Cordova plugin.' },
            { name: 'license', message: 'License (SPDX format):', default: 'MIT' },
            { name: 'author', message: 'Author:', default: '' },
            {
                name: 'platforms',
                message: 'Supported Platform:',
                type: 'checkbox',
                choices: [
                    new inquirer.Separator('Mobile'),
                    { name: 'Android', value: 'android' },
                    { name: 'iOS', value: 'ios' },
                    new inquirer.Separator('Desktop'),
                    { name: 'Electron', value: 'electron' }
                ],
                default: ['ios', 'android']
            },
            { name: 'apiName', message: 'API Name:', default: 'SamplePlugin' }
        ]);

        // If the user selected Android, we should also fetch the desired android package name.
        if (answers.platforms.includes('android')) {
            const androidAnswers = await inquirer.prompt([{
                name: 'androidPackage',
                message: 'Android Package Name:',
                default: 'com.example.sampleplugin',
                validate: (packageName) => /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)*$/.test(packageName)
            }]);

            // Append the Android-specific answers to the main answers object
            Object.assign(answers, androidAnswers);
        }

        return answers;
    } catch (error) {
        if (error.name === 'ExitPromptError') {
            console.error('\nCordova Plugin initializer tool as stopped.\n');
            process.exit(1);
        }
    }
}

/**
 * Triggers the creation creation process
 */
gatherPluginInfoByUserInput()
    .then(async answers => {
        // 2. Start the Create Cordova Plugin Process based on User Input
        const createCordovaPlugin = new CreateCordovaPlugin(process.cwd(), answers);
        await createCordovaPlugin.exec();
    })
    .catch(err => {
        console.error('Error:', err);
        process.exit(1);
    });
