const path = require("node:path")

module.exports = {
    target: "node",
    mode: "production",
    entry: "./extension.js",
    output: {
        filename: "extension.js",
        path: path.resolve(__dirname, "dist"),
        libraryTarget: "commonjs2",
        clean: true
    },
    externals: {
        vscode: "commonjs vscode"
    }
}