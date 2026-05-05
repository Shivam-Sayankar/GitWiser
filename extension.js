
const path = require('node:path')
require('dotenv').config({
	path: path.join(__dirname, '.env')
})

const vscode = require('vscode');
const { exec } = require('child_process');
const { GoogleGenAI } = require('@google/genai')

const gemini = new GoogleGenAI({
	apiKey: process.env.GEMINI_API_KEY
})

function getStagedDiff(workspaceFolder) {
	return new Promise((resolve, reject) => {
		exec('git diff --cached', { cwd: workspaceFolder }, (err, stdout, stderr) => {
			if (err || !stdout) {
				reject('No staged changes found')
			}
			else {
				resolve(stdout)
			}
		})
	})
}

function getRecentCommits() { }

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Extension "GitWiser" is now active!');

	// Generate Commit Message
	let generateCommitMessage = vscode.commands.registerCommand('gitwiser.generateCommit', async function () {

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

		if (!workspaceFolder) {
			vscode.window.showErrorMessage('NO workspace folder found,')
			return
		}

		try {

			const diff = await getStagedDiff(workspaceFolder)

			const prompt = `You are an expert developer, who has been a guide to countless students.
							For the given git diff, generate a concise and meaningful commit message.
							Follow conventional commit formats if possible
							Git diff:
							${diff}`

			const response = await gemini.models.generateContent({
				model: "gemini-flash-latest",
				contents: prompt
			})

			const commitMessage = response.text

			if (!commitMessage) {
				vscode.window.showErrorMessage('Failed to generate commit message')
				return
			}

			const action = await vscode.window.showInformationMessage(
				"GitWiser: Commit message generated",
				"Copy",
				"Show"
			)

			if (action === "Copy") {
				await vscode.env.clipboard.writeText(commitMessage)
				vscode.window.showInformationMessage('Copied to clipboard')
			}
			else if (action === "Show") {
				vscode.window.showInformationMessage(commitMessage)
			}
		}

		catch (error) {
			console.log("Error: ", error)
			vscode.window.showErrorMessage('AI request failed.')
		}
	})

	let explainGitDiff = vscode.commands.registerCommand('gitwiser.explainDiffChanges', async function () {

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

		if (!workspaceFolder) {
			vscode.window.showErrorMessage('NO workspace folder found,')
			return
		}

		try {
			const diff = await getStagedDiff(workspaceFolder)

			const prompt = `You are an experienced developer and guide to many developers/students
Explain the following git diff in simple and clear English.
Focus on:
- What changes were made
- Why they might have been made
- Keep it concise

Git diff:
${diff}`

			const response = await gemini.models.generateContent({
				model: "gemini-flash-latest",
				contents: prompt
			})

			const explanation = response.text

			if (!explanation) {
				vscode.window.showErrorMessage('Failed to generate Explanation')
				return
			}

			const action = await vscode.window.showInformationMessage(
				"Gitwiser: Explanation generated",
				"Show",
				"Copy"
			)

			if (action === "Show") {
				vscode.window.showInformationMessage(explanation)
			}
			else if (action === 'Copy') {
				await vscode.env.clipboard.writeText(explanation)
				vscode.window.showInformationMessage('Explanation Copied to Clipboard')
			}
		}

		catch (error) {
			console.log("Error: ", error)
			vscode.window.showErrorMessage('AI request failed.')
		}

	})

	context.subscriptions.push(generateCommitMessage);
	context.subscriptions.push(explainGitDiff);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
