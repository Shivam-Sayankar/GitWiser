
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

/**
 * @param {vscode.ExtensionContext} context
 */
function activate(context) {
	console.log('Extension "GitWiser" is now active!');

	let disposable = vscode.commands.registerCommand('gitwiser.generateCommit', async function () {

		const workspaceFolder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

		if (!workspaceFolder) {
			vscode.window.showErrorMessage('NO workspace folder found,')
			return
		}


		exec('git diff --cached', { cwd: workspaceFolder }, async (err, stdout, stderr) => {
			if (err || !stdout) {
				vscode.window.showErrorMessage('No staged changes found')
				return
			}

			const prompt = `You are an expert developer, who has been a guide to countless students.
							For the given git diff, generate a concise and meaningful commit message.
							Follow conventional commit formats if possible
							Git diff:
							${stdout}`

			try {

				const response = await gemini.models.generateContent({
					model: "gemini-3-flash-preview",
					contents: prompt
				})

				const message = response.text

				if (!message) {
					vscode.window.showErrorMessage('Failed to generate commit message')
					return
				}

				const action = await vscode.window.showInformationMessage(
					"GitWiser: Commit message generated",
					"Copy",
					"Show"
				)

				if (action === "Copy") {
					await vscode.env.clipboard.writeText(message)
					vscode.window.showInformationMessage('Copied to clipboard')
				}
				else if (action === "Show") {
					vscode.window.showInformationMessage(message)
				}
			}

			catch (error) {
				console.log("Error: ", error)
				vscode.window.showErrorMessage('AI request failed.')
			}

		})
	})

	context.subscriptions.push(disposable);
}

function deactivate() { }

module.exports = {
	activate,
	deactivate
}
