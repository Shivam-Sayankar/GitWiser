# Contributing to GitWiser

Thank you for contributing to GitWiser.

This document explains the local development workflow for the extension.

## ⚙️ How GitWiser Works

GitWiser combines multiple sources of repository context including:

- staged Git diffs (`git diff --cached`)
- current Git branch
- recent commit history (`git log`)
- repository documentation (`README.md`)
- contribution guidelines (`CONTRIBUTING.md`)

This repository context is sent to **Gemini**, which generates:

- commit messages
- commit refinements
- code explanations
- project summaries

Outputs are rendered using VS Code's native markdown preview system through virtual documents.

## 🪛 Local Development Setup

1. Clone the repository

   ```
   git clone https://github.com/Shivam-Sayankar/GitWiser.git
   ```

   or

   ```
   git clone git@github.com:Shivam-Sayankar/GitWiser.git
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure Gemini API Key
   - Get your Gemini API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

   - Create or update `.vscode/settings.json`
   - Save your Gemini API Key in `settings.json` as

     ```javascript
     {
        "gitwiser.geminiApiKey": "<YOUR-API-KEY>"
     }
     ```

   - Make sure `.vscode/settings.json` is added to `.gitignore`

4. Bundle the extension:

   ```bash
   npm run build
   ```

   Webpack bundles the extension into:

   ```bash
   dist/extension.js
   ```

5. Run the extension locally
   - Open the project in VS Code
   - Press F5

   A new Extension Development Host window will open where you can test GitWiser.

## 📦 Packaging the Extension

- Build the extension

  ```bash
  npm run build
  ```

- Package the built extension code

  ```bash
  vsce package
  ```

- This generates

  ```bash
  gitwiser-0.0.X.vsix
  ```

- Install locally using

  ```bash
  code --install-extension gitwiser-0.0.X.vsix
  ```

## 🧪 Testing Workflow

### Recommended testing workflow:

1. Open a Git repository
2. Stage some changes
3. Run GitWiser commands from the Command Palette
4. Verify markdown preview output

## Additional Documentation

- [README](./README.md)
- [CHANGELOG](./CHANGELOG.md)
