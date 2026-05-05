
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
				reject(new Error('No staged changes found'))
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
				reject(new Error('No commit history found'))
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
	catch {
		return null
	}
}

async function showMarkdownPreview(content, title = "GitWiser Output") {

	const safeTitle = title.replace(/\s+/g, "_")

	const uri = vscode.Uri.parse(
		`gitwiser:${safeTitle}.md?${encodeURIComponent(content)}`
	)

	const doc = await vscode.workspace.openTextDocument(uri)
	await vscode.window.showTextDocument(doc, { preview: true })
	await vscode.commands.executeCommand('markdown.showPreview', uri)
}

const gitWiserContentProvider = {
	provideTextDocumentContent(uri) {
		return decodeURIComponent(uri.query)
	}
}

async function runWithProgress(title, task) {
	return vscode.window.withProgress(
		{
			location: vscode.ProgressLocation.Notification,
			title,
			cancellable: false
		},
		async () => {
			return await task()
		}
	)
}

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Extension "GitWiser" is now active!');

	context.subscriptions.push(
		vscode.workspace.registerTextDocumentContentProvider('gitwiser', gitWiserContentProvider)
	)

	// Generate Commit Message
	let generateCommitMessage = vscode.commands.registerCommand('gitwiser.generateCommit', async function () {

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('NO workspace folder found,')
			return
		}

		try {

			await runWithProgress("GitWiser: Generating Commit Message...", async () => {

				const diff = await getStagedDiff(workspaceFolder)
				const prompt = `You are an expert developer, who has been a guide to countless students.
								For the given git diff, generate a concise and meaningful commit message.
								Follow conventional commit formats if possible
								Git diff:
								${diff}`.trim()

				const response = await gemini.models.generateContent({
					model: "gemini-flash-latest",
					contents: prompt
				})

				const commitMessage = response.text
				if (!commitMessage) {
					throw new Error('Failed to generate commit message')
				}

				await showMarkdownPreview(
					`## Suggested Commit Message\n\n\`\`\`\n${commitMessage}\n\`\`\``,
					"GitWiser Commit Message"
				)
			})

			vscode.window.showInformationMessage('GitWiser: Generated Suitable Commit Message.')
		}

		catch (error) {
			console.log("Error: ", error)
			vscode.window.showErrorMessage(error.message || 'Something Went Wrong.')
		}
	})

	let explainGitDiff = vscode.commands.registerCommand('gitwiser.explainDiffChanges', async function () {

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('NO workspace folder found,')
			return
		}

		try {

			await runWithProgress("GitWiser: Explaining changes...", async () => {

				const diff = await getStagedDiff(workspaceFolder)
				const prompt = `You are an experienced developer and guide to many developers/students
								Explain the following git diff in simple and clear English.
								Focus on:
								- What changes were made
								- Why they might have been made
								- Keep it concise

								Git diff:
								${diff}`.trim()

				const response = await gemini.models.generateContent({
					model: "gemini-flash-latest",
					contents: prompt
				})

				const explanation = response.text
				if (!explanation) {
					throw new Error('Failed to generate Explanation')
				}

				await showMarkdownPreview(explanation, "GitWiser Diff Explanation")
			})

			vscode.window.showInformationMessage('GitWiser: Generated Changes Explanation.')
		}

		catch (error) {
			console.log("Error: ", error)
			vscode.window.showErrorMessage(error.message || 'Something Went Wrong.')
		}
	})

	let resumeContext = vscode.commands.registerCommand('gitwiser.resumeContext', async function () {

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace folder found')
			return
		}

		try {
			await runWithProgress("GitWiser: Reconstructing Project Context...", async () => {

				const recentCommits = await getRecentCommits(workspaceFolder, 10)
				const readme = await getReadme(workspaceFolder)
				const prompt = `You are an expert developer helping someone resume their project.
								Here is the project README (if available):
								${readme || "No README available"}
								
								Here is the recent git commit history:
								${recentCommits}

								Based on this:
								1. Give a brief summary of the project
								2. Summarize what the developer has been working on
								3. Identify the current state of the project
								4. Suggest what they should work on next

								Keep it concise and actionable.`.trim()

				const response = await gemini.models.generateContent({
					model: "gemini-flash-latest",
					contents: prompt
				})

				const summary = response.text
				if (!summary) {
					throw new Error('Failed to generate context summary')
				}

				await showMarkdownPreview(summary, "GitWiser Project Context")
			})

			vscode.window.showInformationMessage('GitWiser: Generated Project Context Summary.')
		}

		catch (error) {
			console.log('Error:', error)
			vscode.window.showErrorMessage(error.message || 'Something Went Wrong.')
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
