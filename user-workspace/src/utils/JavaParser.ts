import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { ASTNode, ASTWalker } from './ASTUtils';
import { JavaClass, JavaMethod, JavaField, JavaImport } from './JavaProjectParser';

export class JavaParser {
    private static readonly CLASS_REGEX = /^\s*(?:public|private|protected)?\s*(?:class|interface|enum)\s+(\w+)[\s\{]/gm;
    private static readonly METHOD_REGEX = /(?:public|private|protected)\s+([\w<>]+)\s+(\w+)\s*\(([^)]*)\)/g;
    private static readonly FIELD_REGEX = /(?:public|private|protected)\s+([\w<>]+)\s+(\w+)\s*[;=]/g;
    private static readonly IMPORT_REGEX = /^import\s+([\w\.]+)\s*;/gm;

    static parseClassStructure(content: string, filePath: string): JavaClass {
        // Reset regex state
        this.CLASS_REGEX.lastIndex = 0;
        const classNameMatch = this.CLASS_REGEX.exec(content);
        if (!classNameMatch) {
            throw new Error('No valid Java class found in file');
        }

        // Determine type from content
        const isInterface = content.includes('interface ');
        const isEnum = content.includes('enum ');

        return {
            name: classNameMatch[1],
            type: isInterface ? 'INTERFACE' : isEnum ? 'ENUM' : 'CLASS',
            path: filePath,
            methods: this.extractMethods(content),
            fields: this.extractFields(content),
            imports: this.extractImports(content)
        };
    }

    static parseDependencies(content: string): string[] {
        return this.extractImports(content)
            .map(imp => imp.split('.').slice(0, -1).join('.'));
    }

    private static extractMethods(content: string): JavaMethod[] {
        const methods: JavaMethod[] = [];
        let match;
        
        // Handle interface methods (no modifiers)
        const interfaceMethodRegex = /(?:^|\s)(\w+)\s+(\w+)\s*\(([^)]*)\)\s*(?:;|\{)/g;
        const regex = content.includes('interface ') ? interfaceMethodRegex : this.METHOD_REGEX;
        
        while ((match = regex.exec(content)) !== null) {
            methods.push({
                name: match[2],
                returnType: match[1],
                parameters: this.parseParameters(match[3]),
                visibility: content.includes('interface ') ? 'public' : 
                          match[0].trim().split(' ')[0] as 'public'|'private'|'protected'
            });
        }

        return methods;
    }

    private static extractFields(content: string): JavaField[] {
        const fields: JavaField[] = [];
        let match;
        
        while ((match = this.FIELD_REGEX.exec(content)) !== null) {
            fields.push({
                name: match[2],
                type: match[1],
                visibility: match[0].trim().split(' ')[0] as 'public'|'private'|'protected'
            });
        }

        return fields;
    }

    private static extractImports(content: string): string[] {
        const imports: string[] = [];
        let match;
        
        while ((match = this.IMPORT_REGEX.exec(content)) !== null) {
            imports.push(match[1]);
        }

        return imports;
    }

    private static parseParameters(paramString: string): {name: string, type: string}[] {
        return paramString.split(',')
            .map(p => p.trim())
            .filter(p => p.length > 0)
            .map(p => {
                const parts = p.split(/\s+/);
                return {
                    name: parts[parts.length - 1],
                    type: parts.slice(0, -1).join(' ')
                };
            });
    }

    static async parseFile(filePath: string): Promise<JavaClass> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            return this.parseClassStructure(content, filePath);
        } catch (err) {
            throw new Error(`Failed to parse Java file ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
        }
    }

    static async parseFiles(filePaths: string[]): Promise<JavaClass[]> {
        const results = await Promise.all(
            filePaths.map(filePath => 
                this.parseFile(filePath)
                    .catch(err => {
                        console.error(err);
                        return null;
                    })
            )
        );
        return results.filter((result): result is JavaClass => result !== null);
    }

    static async parseProjectFiles(projectRoot: string): Promise<JavaClass[]> {
        const javaFiles = await this.findJavaFiles(projectRoot);
        return this.parseFiles(javaFiles);
    }

    private static async findJavaFiles(dir: string): Promise<string[]> {
        const files: string[] = [];
        const entries = await fs.promises.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
            const fullPath = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                files.push(...await this.findJavaFiles(fullPath));
            } else if (entry.isFile() && entry.name.endsWith('.java')) {
                files.push(fullPath);
            }
        }
        
        return files;
    }
}