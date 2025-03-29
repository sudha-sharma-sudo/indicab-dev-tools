import * as vscode from 'vscode';
import { ProjectExplorer } from './views/ProjectExplorer';

export function activate(context: vscode.ExtensionContext) {
    // Register project explorer view
    const projectExplorer = new ProjectExplorer(context);
    vscode.window.registerTreeDataProvider(
        'indicabProjectExplorer', 
        projectExplorer
    );

    // Register commands
    const startCommand = vscode.commands.registerCommand('indicab.start', () => {
        vscode.window.showInformationMessage('IndiCab Development Tools activated!');
    });
    context.subscriptions.push(startCommand);
}

export function deactivate() {}