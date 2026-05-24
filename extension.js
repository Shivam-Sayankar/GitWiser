
const path = require('path')
const fs = require('fs/promises')
const vscode = require('vscode');
const { exec } = require('child_process');
const { GoogleGenAI } = require('@google/genai')

let geminiClient = null

function getGeminiApiKey() {

	const config = vscode.workspace.getConfiguration('gitwiser')

	return (
		config.get('geminiApiKey')
	)
}

function initializeGemini() {
	if (geminiClient) {
		return geminiClient
	}

	const apiKey = getGeminiApiKey()

	if (!apiKey) {
		throw new Error(
			'Gemini API key not found. Configure it in VS Code settings.'
		)
	}

	geminiClient = new GoogleGenAI({
		apiKey
	})

	return geminiClient
}

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

function getCurrentBranch(workspaceFolder) {
	return new Promise((resolve, reject) => {
		exec('git branch --show-current', { cwd: workspaceFolder }, (err, stdout, stderr) => {
			if (err || !stdout) {
				reject(new Error('Could not detect current branch'))
			}
			else {
				resolve(stdout.trim())
			}
		})
	})
}

function getOpenCommitEditor() {
	const allTabs = vscode.workspace.textDocuments

	const target = 'COMMIT_EDITMSG'
	const commitEditorTab = allTabs.find(tab => tab.fileName.endsWith(target));

	if (!commitEditorTab) {
		return null
	}

	else {
		const commitEditorContent = commitEditorTab.getText()

		let commitMessageCopy = commitEditorContent
		commitMessageCopy = commitMessageCopy.split(/\r?\n/).filter((line) => {
			return !line.trimStart().startsWith('#')
		}).join('\n').trim()

		return commitMessageCopy
	}
}

function getCurrentCommit() {
	try {
		const currentCommitMessage = getOpenCommitEditor()

		if (currentCommitMessage) {
			return currentCommitMessage
		}

		else {
			return null
		}
	}
	catch (error) {
		console.log(error)
		return null
	}
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
	catch (error) {
		console.log(error)
		return null
	}
}

async function getContributionGuide(workspaceFolder) {
	try {
		const contributionGuidePath = path.join(workspaceFolder, 'CONTRIBUTING.md')
		const data = await fs.readFile(contributionGuidePath, 'utf-8')
		return data
	}
	catch (error) {
		console.log(error)
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

	let refineCommitMessage = vscode.commands.registerCommand('gitwiser.refineCommit', async function () {
		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('No workspace folder found,')
			return
		}

		try {
			await runWithProgress("GitWiser: Refining Commit Message", async () => {
				const diff = await getStagedDiff(workspaceFolder)
				const currentBranch = await getCurrentBranch(workspaceFolder)
				const contributionGuide = await getContributionGuide(workspaceFolder)
				const currentCommitMessage = getCurrentCommit()

				if (!currentCommitMessage) {
					vscode.window.showErrorMessage(
						`No active commit message found.
				
						Tip:
						Run \`git commit\` without \`-m\` to open the commit message editor inside VS Code, then try refining it again.`
							.replaceAll('\t', '')
					)
					return
				}

				const prompt = `
				You are an experienced software engineer helping improve git commit messages.

				You will be given:
				- the original commit message
				- staged git diff
				- current git branch
				- repository contribution guidelines

				Your task:
				1. Refine the commit message for clarity, specificity, and consistency.
				2. Follow any commit conventions mentioned in the contribution guidelines.
				3. Preserve the original intent of the developer.
				4. Ensure the message accurately reflects the actual code changes.
				5. Do not invent changes that are not present in the git diff.
				6. Keep the message concise and professional.

				Then briefly explain:
				- what was improved
				- why the refined message is clearer or more accurate

				Current Commit Message:
				${currentCommitMessage}

				Git Diff:
				${diff}

				Current Branch:
				${currentBranch}

				Contribution Guide:
				${contributionGuide || "No contribution guide available"}

				Return markdown output in the following structure:

				## Refined Commit Message
				\`\`\`bash
				<refined message>
				\`\`\`

				## Original Commit Message
				\`\`\`bash
				<original message>
				\`\`\`

				## What Changed
				- <change1>
				- <change2>

				## Workflow Suggestions
				<suggestions like changing branch, branch naming or anything else that the user missed out from the contribution guide, If no workflow suggestion is necessary, drop this section entirely>
				`.trim().replaceAll('\t', '')

				const gemini = initializeGemini()
				const response = await gemini.models.generateContent({
					model: "gemini-flash-latest",
					contents: prompt
				})

				const refinedCommitFeedback = response.text
				if (!refinedCommitFeedback) {
					throw new Error('Failed to refine commit message')
				}

				await showMarkdownPreview(
					refinedCommitFeedback,
					"GitWiser Commit Refinement"
				)
			})
		}
		catch (error) {
			console.log("Error: ", error)
			vscode.window.showErrorMessage(error.message || 'Something Went Wrong.')
		}
	})

	let generateCommitMessage = vscode.commands.registerCommand('gitwiser.generateCommit', async function () {

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
		if (!workspaceFolder) {
			vscode.window.showErrorMessage('NO workspace folder found,')
			return
		}

		try {

			await runWithProgress("GitWiser: Generating Commit Message...", async () => {

				const diff = await getStagedDiff(workspaceFolder)
				const currentBranch = await getCurrentBranch(workspaceFolder)
				const contributionGuide = await getContributionGuide(workspaceFolder)
				const prompt = `
				You are an expert software engineer helping generate high-quality Git commit messages.

				Your task:
				1. Analyze the staged git diff
				2. Follow commit conventions mentioned in the contribution guide if available
				3. Otherwise follow conventional commit standards
				4. Consider the current branch name while generating the commit message
				5. If the contribution guide suggests a different branching strategy, mention it separately as a short suggestion

				Current Branch:
				${currentBranch}

				Contribution Guide:
				${contributionGuide || "No contribution guide available"}

				Git Diff:
				${diff}

				Return ONLY the following format:

				COMMIT_MESSAGE:
				<commit message>

				WORKFLOW_SUGGESTION:
				<suggestions like changing branch, branch naming or anything else that the user missed out from the contribution guide, If no workflow suggestion is necessary, return "None">
				`.trim().replaceAll('\t', '')

				const gemini = initializeGemini()
				const response = await gemini.models.generateContent({
					model: "gemini-flash-latest",
					contents: prompt
				})

				const commitMessage = response.text
				if (!commitMessage) {
					throw new Error('Failed to generate commit message')
				}

				const commitMatch = commitMessage.match(/COMMIT_MESSAGE:\s*([\s\S]*?)WORKFLOW_SUGGESTION:/)
				const suggestionMatch = commitMessage.match(/WORKFLOW_SUGGESTION:\s*([\s\S]*)/)

				const parsedCommit = commitMatch?.[1]?.trim() || "Unable to generate commit message"
				const parsedSuggestion = suggestionMatch?.[1]?.trim() || "None"

				let markdownOutput = `
				## Suggested Commit Message
				\`\`\`bash
				${parsedCommit}
				\`\`\`
				`

				if (parsedSuggestion !== "None") {
					markdownOutput += `

					## Workflow Suggestions
					${parsedSuggestion}`
				}

				markdownOutput = markdownOutput.trim().replaceAll('\t', '')

				await showMarkdownPreview(
					markdownOutput,
					"GitWiser Commit Message"
				)
			})

			vscode.window.showInformationMessage('GitWiser: Commit message generated successfully.')
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
								${diff}`.trim().replaceAll('\t', '')

				const gemini = initializeGemini()
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

								Keep it concise and actionable.`.trim().replaceAll('\t', '')

				const gemini = initializeGemini()
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

	context.subscriptions.push(refineCommitMessage)
	context.subscriptions.push(generateCommitMessage)
	context.subscriptions.push(explainGitDiff)
	context.subscriptions.push(resumeContext)
}


function deactivate() { }

module.exports = {
	activate,
	deactivate
}
