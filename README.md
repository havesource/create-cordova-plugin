<!--
    Copyright 2025 Bryan Ellis

    Licensed under the Apache License, Version 2.0 (the "License");
    you may not use this file except in compliance with the License.
    You may obtain a copy of the License at

        http://www.apache.org/licenses/LICENSE-2.0

    Unless required by applicable law or agreed to in writing, software
    distributed under the License is distributed on an "AS IS" BASIS,
    WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
    See the License for the specific language governing permissions and
    limitations under the License.
-->

# @havesource/create-cordova-plugin

A scaffolding tool for generating a basic structure for a Cordova plugin.

## How to Use

### Without Installing Globally or to a Project-Scope

```bash
% npm init @havesource/cordova-plugin
```

### Using a Global Installation

```bash
% npm install -g @havesource/cordova-plugin
% create-cordova-plugin
```

### Using a Project-Scope Installation

```bash
% npm install @havesource/cordova-plugin
% npx create-cordova-plugin
```

## About the CLI Input Prompts

1. **ID (npm package & directory name): (cordova-plugin-sample)**

   This is the directory and plugin name.

   The following area will be set:

   - `package.json` for the `name` and `cordova.id` fields.
   - `plugin.xml` for the `id` attribute.

2. **Readable Name: (Cordova Sample Plugin)**

   This is a human-readable name for the plugin, which is set in the `name` element of the `plugin.xml` file.

3. **Description: (A sample Cordova plugin.)**

   A brief description of your plugin, which will be added to the `description` field in the npm `package.json` and `plugin.xml` files.

4. **License (SPDX format)**

   Specify the license your plugin will use, following the SPDX format.

   It will be added to the `license` field in the npm `package.json` and `plugin.xml` files.

   If you have a custom or proprietary license, enter `"SEE LICENSE IN LICENSE"`, and be sure to create a `LICENSE` file.

5. **Author**

   This is optional.

   If provided, it will be added to the `author` field in the npm `package.json` and `plugin.xml` files.

   When empty, the `author` field will still be created but with empty values.

6. **Supported Platform: (Press <space> to select, <a> to toggle all, <i> to invert selection, and <enter> to proceed)**

   Select the platforms that your plugin will support.

   The tool will populate the `platforms` section in the `package.json`, the corresponding `platform` elements in the `plugin.xml`, and create mocked native folders and files.

7. **API Name: (SamplePlugin)**

   This will be the name used when creating the native class files of the supported platform you pick and the front-end JS API of your plugin.

8. **Android Package Name: (com.example.sampleplugin)**

   This prompt appears if you selected Android as a supported platform.
   Enter the package name that will be used for the Android plugin code. This should be distinct from your app’s package name.
