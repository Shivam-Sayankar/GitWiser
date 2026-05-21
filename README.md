## 🧙‍♂️ GitWiser: AI-powered Git Assistant for VS Code

GitWiser is a VS Code extension that helps developers understand repository context, generate meaningful commits, and regain project workflow context directly inside VS Code.

It solves a common problem developers face:

- “What should I write in this commit?”
- “What exactly changed here?”

And then comes the classic developer moment:

> **"When you open your unfinished project from months ago"**
>
> _"I don't understand my own code!? What was I even working on?!"_

GitWiser acts as a lightweight AI layer on top of your Git workflow, helping you write better commits, understand changes, and quickly regain context when returning to a project.

## 📋 Features

### 🟣 AI Commit Message Generation

- Analyzes staged Git changes
- Supports repository-specific commit conventions through awareness of `CONTRIBUTING.md`.
- Generates concise, conventional commit messages
- Removes the guesswork from writing commits

### 🟣 Explain Code Changes

- Converts Git diffs into human-readable explanations
- Helps quickly understand what changed and why
- Especially useful when revisiting unfamiliar code

### 🟣 Resume Project Context

- Analyzes recent commits + README
- Summarizes current project state
- Suggests what to work on next

### 🟣 Native Markdown Preview Output

- Outputs are rendered using VS Code’s built-in markdown preview
- Uses virtual documents (no file clutter)
- Clean, readable, and developer-friendly UI

### 🟣 Smooth UX

- Progress indicators for AI operations
- Minimal interruptions (no unnecessary popups)
- One command execution → immediate result

## ⌨️ Available Commands

### 1. GitWiser: Generate Commit Message

Generates repository-aware commit messages using:

- staged git diff
- current branch
- contribution guidelines

Also suggests workflow improvements based on repository contribution guidelines

---

### 2. GitWiser: Explain Changes

Explains staged git changes in simple, human-readable language.

---

### 3. GitWiser: Resume Project Context

Analyzes:

- recent commits
- project history
- repository documentation

to help developers quickly resume work on a project.

## ⚙️ How It Works

GitWiser combines multiple sources of context:

- Git staged diff (`git diff --cached`)
- Current Git branch
- Recent commit history (`git log`)
- Project README (`README.md`)
- Contribution guidelines (`CONTRIBUTING.md`)

This repository context is sent to an LLM (**Gemini**), which generates:

- Commit messages
- Code explanations
- Project summaries

The output is rendered using a custom **virtual document system**:

- Uses a custom URI scheme (`gitwiser:`)
- Implements `TextDocumentContentProvider`
- Displays results in VS Code’s native markdown preview

## 📝 Example Workflow

1. Stage your changes
   ```
   git add file1, file2, file3...
   ```
2. Run:

   Hit - `Ctrl + Shift + P` and search for

   ```
   GitWiser: Generate Commit Message
   ```

3. Instantly see a formatted commit suggestion in a markdown preview tab

## 🪛 Installation & Setup

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

3. Create a `.env` file:

   > Firstly, get your Gemini API key from [here](https://aistudio.google.com/app/apikey)

   ```env
   GEMINI_API_KEY=your_api_key_here
   ```

4. Run extension:
   - Press `F5` in VS Code
   - Open your project folder
   - Hit - `Ctrl + Shift + P` and search for

     ```
     GitWiser: Generate Commit Message
     ```

## 📄 Additional Documentation

- [CHANGELOG](./CHANGELOG.md)

## 💡 Why GitWiser?

While tools like Copilot can assist with code, GitWiser focuses specifically on:

- Git workflows
- Developer context recovery
- Reducing cognitive load

Most developers rely on scattered tools or manual effort to understand their own code history. GitWiser brings that context directly into the editor.

> It acts as a **lightweight AI assistant for version control workflows**.

## 🔮 Future Improvements

- Interactive chat-based repository assistance
- Support for additional context sources (e.g., key config files like package.json for node projects)
- Customizable output styles
- Integration with GitHub repositories
