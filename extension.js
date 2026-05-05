
const path = require('node:path')
require('dotenv').config({
	path: path.join(__dirname, '.env')
})

const fs = require('node:fs/promises')
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

function getRecentCommits(workspaceFolder, numOfCommits) {
	return new Promise((resolve, reject) => {
		exec(`git log --oneline -n ${numOfCommits}`, { cwd: workspaceFolder }, (err, stdout, stderr) => {
			if (err || !stdout) {
				reject('No commit history found')
			}
			else {
				resolve(stdout)
			}
		})
	})
}

async function getReadme(workspaceFolder) {
	try {
		const readmePath = path.join(workspaceFolder, 'README.md')
		const data = await fs.readFile(readmePath, 'utf-8')
		return data
	}
	catch (error) {
		return null
	}
}


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

	let resumeContext = vscode.commands.registerCommand('gitwiser.resumeContext', async function () {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath

		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace folder found')
			return
		}

		try {
			const recentCommits = await getRecentCommits(workspaceFolder, 10)
			const readme = await getReadme(workspaceFolder)

			const prompt = `You are an expert developer helping someone resume their project.
			Here is the project README (if available):
			${readme || "No README available"}
			
			Here is the recent git commit history:
			${recentCommits}

			Based on this:
			1. Give a brief summary on what the project is
			1. Summarize what the developer has been working on
			2. Identify the current state of the project
			3. Suggest what they should work on next

			Keep it concise and actionable.`

			const response = await gemini.models.generateContent({
				model: "gemini-flash-latest",
				contents: prompt
			})

			const summary = response.text

			if (!summary) {
				vscode.window.showErrorMessage('Failed to generate context summary')
				return
			}

			const action = await vscode.window.showInformationMessage(
				"GitWiser: Project Context Ready",
				"Show",
				"Copy"
			)

			if (action === 'Show') {
				vscode.window.showInformationMessage(summary)
			}
			else if (action === 'Copy') {
				await vscode.env.clipboard.writeText(summary)
				vscode.window.showInformationMessage('Project Context summary copied to clipboard')
			}
		}

		catch (error) {
			console.log('Error:', error)
			vscode.window.showErrorMessage('AI request failed.')
		}
	})

	context.subscriptions.push(generateCommitMessage);
	context.subscriptions.push(explainGitDiff);
	context.subscriptions.push(resumeContext)
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
