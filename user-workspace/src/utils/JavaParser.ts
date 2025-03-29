import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { Logger } from './Logger';

export interface JavaMethod {
    name: string;
    returnType: string;
    parameters: Array<{name: string, type: string}>;
    visibility: 'public'|'private'|'protected';
}

export interface JavaClass {
    name: string;
    type: 'CLASS'|'INTERFACE'|'ENUM'|'RECORD';
    path: string;
    methods: JavaMethod[];
    fields: Array<{
        name: string;
        type: string;
        visibility: 'public'|'private'|'protected';
    }>;
    imports: string[];
    annotations: string[];
    dependencies?: string[]; // Make optional for backward compatibility
}

export class JavaParser {
    private static readonly CLASS_REGEX = /^\s*(?:public|private|protected)?\s*(?:class|interface|enum|record)\s+(\w+)\s*[<\w\s,>]*[\s\{]/gm;
    private static readonly METHOD_REGEX = /(?:public|private|protected)\s+([\w<>,\s]+)\s+(\w+)\s*\(([^)]*)\)/g;
    private static readonly FIELD_REGEX = /(?:public|private|protected)\s+([\w<>,\s]+)\s+(\w+)\s*[;=]/g;
    private static readonly IMPORT_REGEX = /^import\s+(?:static\s+)?([\w\.]+)\s*;/gm;
    private static readonly ANNOTATION_REGEX = /@(\w+)(?:\(([^)]*)\))?/g;
    private static fileCache = new Map<string, {mtime: number, content: JavaClass}>();

    static clearCache(): void {
        this.fileCache.clear();
        Logger.debug('JavaParser cache cleared');
    }

    static async parseFile(filePath: string): Promise<JavaClass> {
        try {
            const content = await fs.promises.readFile(filePath, 'utf-8');
            const stats = await fs.promises.stat(filePath);
            
            const cached = this.fileCache.get(filePath);
            if (cached && cached.mtime >= stats.mtimeMs) {
                return cached.content;
            }

            const parsed = this.parseClassStructure(content, filePath);
            this.fileCache.set(filePath, {
                mtime: stats.mtimeMs,
                content: parsed
            });
            return parsed;
        } catch (err) {
            Logger.error(`Failed to parse Java file ${filePath}`, err as Error);
            throw err;
        }
    }

    static async parseFiles(filePaths: string[]): Promise<JavaClass[]> {
        return Promise.all(
            filePaths.map(filePath => 
                this.parseFile(filePath)
                    .catch(err => {
                        Logger.error(`Failed to parse file ${filePath}`, err as Error);
                        return null;
                    })
            )
        ).then(results => results.filter(Boolean) as JavaClass[]);
    }

    private static parseClassStructure(content: string, filePath: string): JavaClass {
        this.CLASS_REGEX.lastIndex = 0;
        const classNameMatch = this.CLASS_REGEX.exec(content);
        if (!classNameMatch) {
            throw new Error('No valid Java class found in file');
        }

        const isInterface = content.includes('interface ');
        const isEnum = content.includes('enum ');
        const isRecord = content.includes('record ');

        const methods = isRecord ? this.extractRecordComponents(content) : this.extractMethods(content);
        const fields = this.extractFields(content);
        const imports = this.extractImports(content);

        return {
            name: classNameMatch[1],
            type: isInterface ? 'INTERFACE' : isEnum ? 'ENUM' : isRecord ? 'RECORD' : 'CLASS',
            path: filePath,
            methods,
            fields,
            imports,
            annotations: this.extractAnnotations(content)
        };
    }

    private static extractRecordComponents(content: string): JavaMethod[] {
        const components: JavaMethod[] = [];
        const recordMatch = /record\s+\w+\s*\(([^)]*)\)/.exec(content);
        if (!recordMatch) return components;

        const componentRegex = /(\w+)\s+(\w+)\s*(?:,|\))/g;
        let match;
        while ((match = componentRegex.exec(recordMatch[1])) !== null) {
            components.push({
                name: match[2],
                returnType: match[1],
                parameters: [],
                visibility: 'public'
            });
        }
        return components.concat(this.extractMethods(content));
    }

    private static extractMethods(content: string): JavaMethod[] {
        const methods: JavaMethod[] = [];
        let match;
        
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

    private static extractFields(content: string) {
        const fields = [];
        let match;
        this.FIELD_REGEX.lastIndex = 0;
        
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
        const imports = [];
        let match;
        this.IMPORT_REGEX.lastIndex = 0;
        
        while ((match = this.IMPORT_REGEX.exec(content)) !== null) {
            imports.push(match[1]);
        }
        return imports;
    }

    private static extractAnnotations(content: string): string[] {
        const annotations = [];
        let match;
        this.ANNOTATION_REGEX.lastIndex = 0;
        
        while ((match = this.ANNOTATION_REGEX.exec(content)) !== null) {
            annotations.push(match[1]);
        }
        return annotations;
    }

    private static parseParameters(paramString: string) {
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
}