import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

export interface JavaProjectStructure {
    rootPath: string;
    sourceRoots: string[];
    packages: JavaPackage[];
    buildFiles: BuildFile[];
}

export interface JavaPackage {
    name: string;
    path: string;
    classes: JavaClass[];
}

export interface JavaClass {
    name: string;
    type: 'CLASS' | 'INTERFACE' | 'ENUM';
    path: string;
    methods: JavaMethod[];
    fields: JavaField[];
    imports?: string[];
    annotations?: string[];
    dependencies?: string[];
}

export interface JavaMethod {
    name: string;
    returnType: string;
    parameters: {name: string, type: string}[];
    visibility?: 'public' | 'private' | 'protected';
}

export interface JavaField {
    name: string;
    type: string;
    visibility?: 'public' | 'private' | 'protected';
}

export interface JavaImport {
    path: string;
    isStatic: boolean;
}

export interface BuildFile {
    type: 'MAVEN' | 'GRADLE';
    path: string;
}

export class JavaProjectParser {
    private static readonly JAVA_SOURCE_DIRS = ['src/main/java', 'src'];
    private static readonly BUILD_FILES = ['pom.xml', 'build.gradle'];

    public static async parseProject(projectPath: string): Promise<JavaProjectStructure> {
        const structure: JavaProjectStructure = {
            rootPath: projectPath,
            sourceRoots: [],
            packages: [],
            buildFiles: []
        };

        // Find build files
        structure.buildFiles = this.findBuildFiles(projectPath);

        // Find source roots
        structure.sourceRoots = await this.findSourceRoots(projectPath);

        // Parse packages and classes
        for (const sourceRoot of structure.sourceRoots) {
            const packages = await this.parsePackages(sourceRoot);
            structure.packages.push(...packages);
        }

        return structure;
    }

    public static findBuildFiles(projectPath: string): BuildFile[] {
        return this.BUILD_FILES
            .map(file => {
                const buildType: 'MAVEN' | 'GRADLE' = file === 'pom.xml' ? 'MAVEN' : 'GRADLE';
                return {
                    path: path.join(projectPath, file),
                    type: buildType
                };
            })
            .filter(buildFile => fs.existsSync(buildFile.path));
    }

    private static async findSourceRoots(projectPath: string): Promise<string[]> {
        const sourceRoots: string[] = [];
        
        for (const dir of this.JAVA_SOURCE_DIRS) {
            const fullPath = path.join(projectPath, dir);
            if (fs.existsSync(fullPath)) {
                sourceRoots.push(fullPath);
            }
        }

        // Fallback to project root if no standard source dirs found
        if (sourceRoots.length === 0) {
            sourceRoots.push(projectPath);
        }

        return sourceRoots;
    }

    private static async parsePackages(sourceRoot: string): Promise<JavaPackage[]> {
        const packages: JavaPackage[] = [];
        await this.walkDirectory(sourceRoot, async (filePath, stats) => {
            if (stats.isDirectory()) {
                const relPath = path.relative(sourceRoot, filePath);
                const packageName = relPath.replace(/\//g, '.');
                
                const javaFiles = fs.readdirSync(filePath)
                    .filter(f => f.endsWith('.java'))
                    .map(f => path.join(filePath, f));

                if (javaFiles.length > 0) {
                    const classes = await Promise.all(javaFiles.map(f => this.parseJavaFile(f)));
                    packages.push({
                        name: packageName,
                        path: filePath,
                        classes: classes.filter(c => c !== null) as JavaClass[]
                    });
                }
            }
        });

        return packages;
    }

    private static async parseJavaFile(filePath: string): Promise<JavaClass | null> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const className = path.basename(filePath, '.java');
            
            // Simple parsing (would be enhanced with proper Java parser in future)
            const isInterface = content.includes('interface ');
            const isEnum = content.includes('enum ');
            
            return {
                name: className,
                type: isInterface ? 'INTERFACE' : isEnum ? 'ENUM' : 'CLASS',
                path: filePath,
                methods: this.extractMethods(content),
                fields: this.extractFields(content)
            };
        } catch (err) {
            console.error(`Error parsing Java file ${filePath}:`, err);
            return null;
        }
    }

    private static extractMethods(content: string): JavaMethod[] {
        // Simplified method extraction
        const methodRegex = /(public|private|protected)\s+([\w<>]+)\s+(\w+)\s*\(([^)]*)\)/g;
        const methods: JavaMethod[] = [];
        let match;
        
        while ((match = methodRegex.exec(content)) !== null) {
            const returnType = match[2];
            const name = match[3];
            const params = match[4].split(',').map(p => {
                const parts = p.trim().split(/\s+/);
                return {
                    name: parts[parts.length - 1],
                    type: parts.slice(0, -1).join(' ')
                };
            }).filter(p => p.name && p.type);

            methods.push({
                name,
                returnType,
                parameters: params
            });
        }

        return methods;
    }

    private static extractFields(content: string): JavaField[] {
        // Simplified field extraction
        const fieldRegex = /(public|private|protected)\s+([\w<>]+)\s+(\w+)\s*[;=]/g;
        const fields: JavaField[] = [];
        let match;
        
        while ((match = fieldRegex.exec(content)) !== null) {
            fields.push({
                name: match[3],
                type: match[2]
            });
        }

        return fields;
    }

    private static async walkDirectory(dir: string, callback: (filePath: string, stats: fs.Stats) => Promise<void>): Promise<void> {
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            await callback(filePath, stats);
            if (stats.isDirectory()) {
                await this.walkDirectory(filePath, callback);
            }
        }
    }
}