# Changelog

All notable changes to GitWiser will be documented in this file.

## [0.0.1] - Initial MVP Release

### Added

- AI-powered commit message generation using Gemini API
- Repository-aware commit suggestions using:
  - staged Git diff
  - current Git branch
  - `CONTRIBUTING.md`
- Workflow suggestions based on repository contribution guidelines
- Git diff explanation feature in human-readable format
- Project context reconstruction using:
  - recent commit history
  - `README.md`
- Native markdown preview rendering using VS Code virtual documents
- Progress notifications for AI-powered operations

### Improved

- Structured AI output parsing for consistent markdown rendering
- Cleaner markdown-based UI inside VS Code
- Async helper architecture for Git and file operations

### Technical Highlights

- Integrated Google Gemini API using `@google/genai`
- Implemented custom `TextDocumentContentProvider`
- Added repository-context prompt engineering workflow
