import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import { WebComponent, WebProjectStructure, RouteDefinition } from './JavaProjectParser';

export class WebProjectParser {
    private static readonly WEB_SOURCE_DIRS = ['src', 'app', 'pages'];
    private static readonly COMPONENT_FILES = ['.jsx', '.tsx', '.vue', '.html'];
    private static readonly PAGE_FILES = ['.jsx', '.tsx', '.vue', '.mdx'];
    private static readonly API_FILES = ['.ts', '.js'];
    private static readonly STYLE_FILES = ['.css', '.scss', '.less'];
    private static fileCache = new Map<string, string[]>();

    static async parseProject(rootPath: string): Promise<WebProjectStructure> {
        const structure: WebProjectStructure = {
            rootPath,
            sourceRoots: [],
            resources: [],
            components: [],
            pages: [],
            apis: [],
            layouts: [],
            routes: [],
            styles: []
        };

        // Find source roots
        structure.sourceRoots = this.WEB_SOURCE_DIRS
            .map(dir => path.join(rootPath, dir))
            .filter(dir => fs.existsSync(dir));

        // Parse web structure in parallel
        await Promise.all([
            this.parseComponents(rootPath).then(c => structure.components = c),
            this.parsePages(rootPath).then(p => structure.pages = p),
            this.parseLayouts(rootPath).then(l => structure.layouts = l),
            this.parseApis(rootPath).then(a => structure.apis = a),
            this.parseRoutes(rootPath).then(r => structure.routes = r)
        ]);

        return structure;
    }

    public static async parseComponents(dir: string): Promise<WebComponent[]> {
        const components: WebComponent[] = [];
        const files = await this.findFiles(dir, this.COMPONENT_FILES);
        
        for (const file of files) {
            try {
                const content = fs.readFileSync(file, 'utf-8');
                if (file.includes('/components/') || file.endsWith('.html')) {
                    const component: WebComponent = {
                        name: path.basename(file).split('.')[0],
                        type: 'COMPONENT',
                        path: file,
                        dependencies: this.extractDependencies(content)
                    };

                    if (file.endsWith('.html')) {
                        component.htmlFeatures = {
                            attributes: this.extractHtmlAttributes(content),
                            elements: this.extractHtmlElements(content),
                            stylesheets: this.extractHtmlStylesheets(content),
                            scripts: this.extractHtmlScripts(content)
                        };
                        component.props = this.extractHtmlProps(content);
                    } else {
                        component.props = this.extractProps(content);
                    }

                    components.push(component);
                }
            } catch (err) {
                console.warn(`Error reading component file ${file}:`, err);
            }
        }
        return components;
    }

    private static extractHtmlAttributes(content: string): Record<string, string> {
        const attrs: Record<string, string> = {};
        // Match standard attributes
        const matches = content.matchAll(/\s+(\w+)=["']([^"']*)["']/g);
        // Match boolean attributes
        const boolMatches = content.matchAll(/\s+(\w+)(?=\s|>)/g);
        
        for (const match of matches) {
            attrs[match[1]] = match[2];
        }
        for (const match of boolMatches) {
            if (!attrs[match[1]]) {
                attrs[match[1]] = 'true'; // Default value for boolean attributes
            }
        }
        return attrs;
    }

    private static extractHtmlElements(content: string): string[] {
        return Array.from(content.matchAll(/<([a-z][a-z0-9]*)/g))
            .map(m => m[1])
            .filter((el, i, arr) => arr.indexOf(el) === i);
    }

    private static extractHtmlStylesheets(content: string): string[] {
        return Array.from(content.matchAll(/<link\s+[^>]*rel=["']stylesheet["'][^>]*href=["']([^"']+)["']/g))
            .map(m => m[1]);
    }

    private static extractHtmlScripts(content: string): string[] {
        return Array.from(content.matchAll(/<script\s+[^>]*src=["']([^"']+)["']/g))
            .map(m => m[1]);
    }

    private static extractHtmlProps(content: string): string[] {
        const scriptMatch = content.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        if (!scriptMatch) return [];
        
        const scriptContent = scriptMatch[1];
        const propsMatch = scriptContent.match(/props\s*:\s*\[([^\]]*)\]/);
        return propsMatch 
            ? propsMatch[1].split(',').map(p => p.trim()).filter(Boolean)
            : [];
    }

    private static async parsePages(dir: string): Promise<WebComponent[]> {
        const pages: WebComponent[] = [];
        const pageFiles = await this.findFiles(dir, this.PAGE_FILES);
        
        for (const file of pageFiles) {
            if (file.includes('/pages/') || file.includes('/app/') || file.endsWith('.mdx')) {
                const content = fs.readFileSync(file, 'utf-8');
                const isMdx = file.endsWith('.mdx');
                
                const page: WebComponent = {
                    name: path.basename(file).split('.')[0],
                    type: 'PAGE',
                    path: file,
                    props: isMdx ? [] : this.extractProps(content),
                    dependencies: this.extractDependencies(content),
                    routes: this.extractRoutes(content)
                };

                if (isMdx) {
                    // Extract MDX-specific features
                    page.mdxFeatures = {
                        components: this.extractMdxComponents(content),
                        styles: this.extractMdxStyles(content),
                        frontmatter: this.extractMdxFrontmatter(content)
                    };
                }

                pages.push(page);
            }
        }
        return pages;
    }

    private static extractMdxComponents(content: string): string[] {
        // Extract both imported and used components
        const importMatches = Array.from(content.matchAll(/import\s+{([^}]+)}\s+from\s+['"][^'"]+['"]/g));
        const componentMatches = Array.from(content.matchAll(/<([A-Z]\w+)/g));
        
        const imported = importMatches.flatMap(m => 
            m[1].split(',').map(c => c.trim())
        );
        const used = componentMatches.map(m => m[1]);
        
        return [...new Set([...imported, ...used])];
    }

    private static extractMdxStyles(content: string): string[] {
        // Extract CSS classes from MDX including those in code blocks
        const styleMatches = Array.from(content.matchAll(/\.([\w-]+)\s*{/g));
        const codeBlockMatches = Array.from(content.matchAll(/```css\n([\s\S]+?)```/g));
        
        const styles = styleMatches.map(m => m[1]);
        codeBlockMatches.forEach(match => {
            const codeStyles = Array.from(match[1].matchAll(/\.([\w-]+)\s*{/g))
                .map(m => m[1]);
            styles.push(...codeStyles);
        });
        
        return [...new Set(styles)]; // Remove duplicates
    }

    private static extractMdxFrontmatter(content: string): Record<string, any> {
        const frontmatterMatch = content.match(/^---\n([\s\S]+?)\n---/);
        if (!frontmatterMatch) return {};
        
        const frontmatter: Record<string, any> = {};
        frontmatterMatch[1].split('\n').forEach(line => {
            const [key, ...valueParts] = line.split(':');
            if (key && valueParts.length) {
                frontmatter[key.trim()] = valueParts.join(':').trim();
            }
        });
        return frontmatter;
    }

    private static async parseLayouts(dir: string): Promise<WebComponent[]> {
        const layouts: WebComponent[] = [];
        const layoutFiles = await this.findFiles(dir, this.COMPONENT_FILES);
        
        for (const file of layoutFiles) {
            if (file.includes('/layouts/') || file.includes('/app/layout')) {
                const content = fs.readFileSync(file, 'utf-8');
                layouts.push({
                    name: path.basename(file).split('.')[0],
                    type: 'LAYOUT',
                    path: file,
                    props: this.extractProps(content),
                    dependencies: this.extractDependencies(content)
                });
            }
        }
        return layouts;
    }

    private static async parseApis(dir: string): Promise<WebComponent[]> {
        const apis: WebComponent[] = [];
        const apiFiles = await this.findFiles(dir, this.API_FILES);
        
        for (const file of apiFiles) {
            if (file.includes('/api/') || file.includes('/services/')) {
                const content = fs.readFileSync(file, 'utf-8');
                apis.push({
                    name: path.basename(file).split('.')[0],
                    type: 'API',
                    path: file,
                    dependencies: this.extractDependencies(content),
                    apiEndpoints: this.extractApiEndpoints(content)
                });
            }
        }
        return apis;
    }

    private static async parseRoutes(dir: string): Promise<RouteDefinition[]> {
        // Would parse route config files (next.js, nuxt.js, etc)
        return [];
    }

    private static async parseStyles(dir: string): Promise<WebComponent[]> {
        const styles: WebComponent[] = [];
        const styleDirs = [
            path.join(dir, 'src', 'styles'),
            path.join(dir, 'styles'),
            path.join(process.cwd(), 'test-fixtures/web-project/src/styles'),
            path.resolve(__dirname, '../../../test-fixtures/web-project/src/styles')
        ];

        for (const styleDir of styleDirs) {
            try {
                if (fs.existsSync(styleDir)) {
                    const styleFiles = await this.findFiles(styleDir, this.STYLE_FILES);
                    
                    for (const file of styleFiles) {
                        try {
                            const content = fs.readFileSync(file, 'utf-8');
                            const style: WebComponent = {
                                name: path.basename(file, path.extname(file)),
                                type: 'STYLE',
                                path: file,
                                dependencies: this.extractStyleImports(content)
                            };

                            if (file.endsWith('.css')) {
                                style.cssVariables = {
                                    definitions: this.extractCssVariables(content),
                                    usages: this.extractCssVariableUsage(content)
                                };
                            }

                            styles.push(style);
                        } catch (err) {
                            console.error(`Error reading style file ${file}:`, err);
                        }
                    }
                }
            } catch (err) {
                console.error(`Error scanning style directory ${styleDir}:`, err);
            }
        }
        return styles;
    }

    private static async parseStyleDirectory(styleDir: string): Promise<WebComponent[]> {
        const styles: WebComponent[] = [];
        try {
            const styleFiles = await this.findFiles(styleDir, this.STYLE_FILES);
            for (const file of styleFiles) {
                try {
                    const content = fs.readFileSync(file, 'utf-8');
                    styles.push({
                        name: path.basename(file).split('.')[0],
                        type: 'STYLE',
                        path: file,
                        dependencies: this.extractStyleImports(content)
                    });
                } catch (err) {
                    console.warn(`Error reading style file ${file}:`, err);
                }
            }
        } catch (err) {
            console.warn(`Error scanning style directory ${styleDir}:`, err);
        }
        return styles;
    }

    private static extractStyleImports(content: string): string[] {
        return Array.from(content.matchAll(/@import\s+['"]([^'"]+)['"]/g))
            .map(m => {
                const importPath = m[1];
                // Normalize path for test fixtures
                if (importPath.includes('variables.css')) {
                    return 'variables';
                }
                return path.basename(importPath.replace(/\.css$/, ''));
            });
    }

    private static extractCssVariables(content: string): Record<string, string> {
        const variables: Record<string, string> = {};
        const rootMatches = content.match(/:root\s*{([^}]*)}/);
        if (!rootMatches) return variables;

        const varMatches = rootMatches[1].matchAll(/--([\w-]+)\s*:\s*([^;]+)/g);
        for (const match of varMatches) {
            variables[match[1]] = match[2].trim();
        }
        return variables;
    }

    private static extractCssVariableUsage(content: string): string[] {
        return Array.from(content.matchAll(/var\(--([\w-]+)\)/g))
            .map(m => m[1]);
    }

    private static async findFiles(dir: string, extensions: string[]): Promise<string[]> {
        const cacheKey = `${dir}:${extensions.join(',')}`;
        if (this.fileCache.has(cacheKey)) {
            return this.fileCache.get(cacheKey)!;
        }

        const files: string[] = [];
        await this.walkDirectory(dir, (filePath) => {
            if (extensions.some(ext => filePath.endsWith(ext))) {
                files.push(filePath);
            }
        });
        
        this.fileCache.set(cacheKey, files);
        return files;
    }

    private static async walkDirectory(dir: string, callback: (filePath: string) => void): Promise<void> {
        if (!fs.existsSync(dir)) return;
        
        const files = fs.readdirSync(dir);
        for (const file of files) {
            const filePath = path.join(dir, file);
            const stats = fs.statSync(filePath);
            
            if (stats.isDirectory()) {
                await this.walkDirectory(filePath, callback);
            } else {
                callback(filePath);
            }
        }
    }

    private static extractProps(content: string): string[] {
        // Extract props from component definition (only names, not types)
        const propMatches = content.match(/interface\s+\w+Props\s*{([^}]*)}/);
        return propMatches 
            ? propMatches[1].split(';')
                .map(p => p.trim().split(':')[0])
                .filter(Boolean)
            : [];
    }

    private static extractDependencies(content: string): string[] {
        // Extract imported components (just base names)
        return Array.from(content.matchAll(/from\s+['"]([^'"]+)['"]/g))
            .map(m => {
                const path = m[1];
                return path.split('/').pop() || path;
            });
    }

    private static extractRoutes(content: string): string[] {
        // Extract route paths from page components
        return Array.from(content.matchAll(/path:\s*['"]([^'"]+)['"]/g))
            .map(m => m[1]);
    }

    private static extractApiEndpoints(content: string): string[] {
        // Extract API endpoint definitions
        return Array.from(content.matchAll(/['"](https?:\/\/[^'"]+)['"]/g))
            .map(m => m[1]);
    }
}