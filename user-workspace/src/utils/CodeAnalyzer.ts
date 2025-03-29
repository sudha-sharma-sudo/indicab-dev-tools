import * as vscode from 'vscode';
import { JavaParser, JavaClass } from './JavaParser';
import { Logger } from './Logger';

export class CodeAnalyzer {
    private readonly diagnosticCollection: vscode.DiagnosticCollection;

    constructor() {
        this.diagnosticCollection = vscode.languages.createDiagnosticCollection('java-issues');
    }

    public analyzeDocument(document: vscode.TextDocument): vscode.Diagnostic[] {
        const diagnostics: vscode.Diagnostic[] = [];
        const javaClass = JavaParser.parseFile(document.uri.fsPath);
        
        if (!javaClass) {
            Logger.warn(`Failed to parse Java file: ${document.fileName}`);
            return diagnostics;
        }

        // Clear previous issues
        javaClass.issues = [];
        javaClass.hasIssues = false;

        // Check for missing @Override annotations
        this.checkForMissingOverrides(javaClass, document, diagnostics);

        // Check for Spring best practices
        this.checkSpringBestPractices(javaClass, document, diagnostics);

        // Check for code style violations
        this.checkCodeStyle(javaClass, document, diagnostics);

        return diagnostics;
    }

    private checkForMissingOverrides(
        javaClass: JavaClass,
        document: vscode.TextDocument,
        diagnostics: vscode.Diagnostic[]
    ) {
        javaClass.methods.forEach(method => {
            if (method.isOverride && !method.annotations?.includes('Override')) {
                const range = this.findMethodRange(document, method.name);
                if (range) {
                    const message = 'Method should be annotated with @Override';
                    diagnostics.push(this.createDiagnostic(
                        range,
                        message,
                        'java.missingOverride',
                        vscode.DiagnosticSeverity.Warning
                    ));
                    javaClass.issues?.push(message);
                    javaClass.hasIssues = true;
                }
            }
        });
    }

    private checkSpringBestPractices(
        javaClass: JavaClass,
        document: vscode.TextDocument,
        diagnostics: vscode.Diagnostic[]
    ) {
        if (javaClass.springComponent?.type === 'SERVICE') {
            const hasTransactional = javaClass.methods.some(method => 
                method.annotations?.includes('Transactional')
            );
            
            if (!hasTransactional) {
                const range = new vscode.Range(
                    new vscode.Position(0, 0),
                    new vscode.Position(0, 0)
                );
                diagnostics.push(this.createDiagnostic(
                    range,
                    'Service methods should be @Transactional',
                    'java.missingTransactional',
                    vscode.DiagnosticSeverity.Warning
                ));
                javaClass.issues?.push('Missing @Transactional on service methods');
                javaClass.hasIssues = true;
            }
        }
    }

    private checkCodeStyle(
        javaClass: JavaClass,
        document: vscode.TextDocument,
        diagnostics: vscode.Diagnostic[]
    ) {
        // Example: Check for field naming conventions
        javaClass.fields.forEach(field => {
            if (!/^[a-z][a-zA-Z0-9]*$/.test(field.name)) {
                const range = this.findFieldRange(document, field.name);
                if (range) {
                    const message = 'Field names should follow camelCase convention';
                    diagnostics.push(this.createDiagnostic(
                        range,
                        message,
                        'java.badFieldName',
                        vscode.DiagnosticSeverity.Hint
                    ));
                    javaClass.issues?.push(message);
                    javaClass.hasIssues = true;
                }
            }
        });
    }

    private createDiagnostic(
        range: vscode.Range,
        message: string,
        code: string,
        severity: vscode.DiagnosticSeverity
    ): vscode.Diagnostic {
        const diagnostic = new vscode.Diagnostic(range, message, severity);
        diagnostic.code = code;
        diagnostic.source = 'IndiCab';
        return diagnostic;
    }

    private findMethodRange(document: vscode.TextDocument, methodName: string): vscode.Range | null {
        const text = document.getText();
        const methodRegex = new RegExp(`(public|private|protected)\\s+[\\w<>]+\\s+${methodName}\\s*\\(`);
        const match = methodRegex.exec(text);
        
        if (match) {
            const position = document.positionAt(match.index);
            return new vscode.Range(position, position);
        }
        return null;
    }

    private findFieldRange(document: vscode.TextDocument, fieldName: string): vscode.Range | null {
        const text = document.getText();
        const fieldRegex = new RegExp(`(public|private|protected)\\s+[\\w<>]+\\s+${fieldName}\\s*[;=]`);
        const match = fieldRegex.exec(text);
        
        if (match) {
            const position = document.positionAt(match.index);
            return new vscode.Range(position, position);
        }
        return null;
    }

    public clearDiagnostics() {
        this.diagnosticCollection.clear();
    }

    public dispose() {
        this.diagnosticCollection.dispose();
    }
}