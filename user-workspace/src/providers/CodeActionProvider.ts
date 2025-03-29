import * as vscode from 'vscode';
import { CodeAnalyzer } from '../utils/CodeAnalyzer';
import { JavaParser } from '../utils/JavaParser';
import { Logger } from '../utils/Logger';

export class CodeActionProvider implements vscode.CodeActionProvider {
    private readonly analyzer: CodeAnalyzer;

    constructor(analyzer: CodeAnalyzer) {
        this.analyzer = analyzer;
    }

    public provideCodeActions(
        document: vscode.TextDocument,
        range: vscode.Range,
        context: vscode.CodeActionContext
    ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
        const actions: vscode.CodeAction[] = [];
        
        context.diagnostics.forEach(diagnostic => {
            switch (diagnostic.code) {
                case 'java.missingOverride':
                    actions.push(this.createOverrideFix(document, diagnostic));
                    break;
                case 'java.missingTransactional':
                    actions.push(this.createTransactionalFix(document, diagnostic));
                    break;
                case 'java.badFieldName':
                    actions.push(this.createFieldRenameFix(document, diagnostic));
                    break;
            }
        });

        return actions;
    }

    private createOverrideFix(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            'Add @Override annotation',
            vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [diagnostic];
        action.edit = new vscode.WorkspaceEdit();
        action.edit.insert(
            document.uri,
            new vscode.Position(diagnostic.range.start.line, 0),
            '@Override\n'
        );
        return action;
    }

    private createTransactionalFix(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            'Add @Transactional annotation',
            vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [diagnostic];
        action.edit = new vscode.WorkspaceEdit();
        action.edit.insert(
            document.uri,
            new vscode.Position(diagnostic.range.start.line, 0),
            '@Transactional\n'
        );
        return action;
    }

    private createFieldRenameFix(
        document: vscode.TextDocument,
        diagnostic: vscode.Diagnostic
    ): vscode.CodeAction {
        const action = new vscode.CodeAction(
            'Rename field to camelCase',
            vscode.CodeActionKind.QuickFix
        );
        action.diagnostics = [diagnostic];
        action.isPreferred = true;
        return action;
    }

    public static register(context: vscode.ExtensionContext, analyzer: CodeAnalyzer) {
        const provider = new CodeActionProvider(analyzer);
        return vscode.languages.registerCodeActionsProvider(
            { language: 'java', scheme: 'file' },
            provider,
            {
                providedCodeActionKinds: [
                    vscode.CodeActionKind.QuickFix,
                    vscode.CodeActionKind.Refactor
                ]
            }
        );
    }
}