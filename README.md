## 🧙‍♂️ GitWiser: AI-powered Git Assistant for VS Code

GitWiser is a VS Code extension that helps developers generate meaningful commits, understand code changes, and quickly regain repository context directly inside VS Code.

It solves a common problem developers face:

- “What should I write in this commit?”
- “What exactly changed here?”

And then comes the classic developer moment:

> **"When you open your unfinished project from months ago"**
>
> _"I don't understand my own code!? What was I even working on?!"_

GitWiser acts as a lightweight AI layer on top of your Git workflow, helping you write better commits, understand changes, and quickly regain project context.

> ℹ️ **GitWiser requires a Gemini API key to use AI-powered features.**
>
> Get your API key from [Google AI Studio](https://aistudio.google.com/app/apikey)

## 🤖 Commands

### 1. GitWiser: Generate Commit Message

Generates commit messages using:

- staged git diff
- current branch
- repository contribution guidelines

Also suggests workflow improvements based on repository contribution guidelines

---

### 2. GitWiser: Refine Commit Message

Improves existing commit messages while preserving developer intent.

Uses:

- staged git diff
- current branch
- contribution guidelines

Works directly with Git’s `COMMIT_EDITMSG` workflow inside VS Code.

---

### 3. GitWiser: Explain Changes

Explains staged git changes in simple, human-readable language.

Useful when:

- reviewing changes

---

### 4. GitWiser: Resume Project Context

Analyzes:

- recent commits
- project history
- repository documentation

to help developers quickly regain context when returning to a project.

## 📋 Features

### 🟣 Repository Context Awareness

GitWiser uses multiple sources of repository context including:

- staged diffs
- Git branches
- commit history
- `README.md`
- `CONTRIBUTING.md`

to generate more relevant and repository-consistent responses.

### 🟣 Native VS Code Markdown Preview

Outputs are rendered directly inside VS Code using native markdown previews for a clean and readable workflow.

### 🟣 Lightweight Workflow Integration

Designed to work alongside existing Git workflows without requiring external tools or Git hooks.

### 🟣 Contribution Guide Awareness

GitWiser understands repository contribution conventions through `CONTRIBUTING.md` analysis.

### 📝 Example Workflow

1. Stage your changes
   ```
   git add file1, file2, file3...
   ```
2. Open the Command Palette

   ```bash
   Ctrl + Shift + P
   ```

3. Run

   ```
   GitWiser: Generate Commit Message
   ```

4. Instantly receive a formatted AI-generated commit suggestion inside VS Code.

## 🪛 Setup

1. Install GitWiser from the VS Code Marketplace
2. Open VS Code Settings
3. Search for:
   ```bash
   GitWiser: Gemini API Key
   ```
4. Paste your Gemini API key

   Get your Gemini API key from: [Google AI Studio](https://aistudio.google.com/app/apikey)

## 💡 Why GitWiser?

While tools like Copilot can assist with code, GitWiser focuses specifically on:

- Git workflows
- Repository context recovery
- Commit quality
- reducing developer cognitive load

Most developers rely on scattered tools or manual effort to understand their own project history. GitWiser brings that context directly into the editor.

> It acts as a **lightweight AI assistant for version control workflows**.

## 🔮 Future Improvements

- Explanations for previous commits and Git history
- Interactive chat-based repository assistance
- Additional repository context sources
- Customizable output styles
- GitHub integration
- Inline commit refinement workflows

## Logo & Icon Attributes

- Wizard/Witch icon created by <a href="https://www.flaticon.com/free-icons/witch" title="witch icons">Victoruler - Flaticon</a>
- GitHub logo by <a href="https://www.flaticon.com/free-icons/github" title="github icons">Laisa Islam Ani - Flaticon</a>

> Icons modified with custom gradient and combined to create GitWiser logo.

## Additional Documentation

- [CHANGELOG](./CHANGELOG.md)
- [CONTRIBUTING](./CONTRIBUTING.md)
