// Mock implementation of vscode API
const vscode = {
    window: {
        showErrorMessage: jest.fn(),
        showInformationMessage: jest.fn(),
        createOutputChannel: () => ({
            appendLine: jest.fn(),
            show: jest.fn()
        })
    },
    workspace: {
        getConfiguration: jest.fn().mockReturnValue({
            get: jest.fn()
        })
    },
    version: '1.75.0'
};

module.exports = vscode;