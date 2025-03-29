import { WebProjectParser } from '../utils/WebProjectParser';
import * as path from 'path';

describe('WebProjectParser', () => {
  const testProjectPath = path.resolve(__dirname, '../../test-fixtures/web-project');

  it('should parse web project structure', async () => {
    const structure = await WebProjectParser.parseProject(testProjectPath);
    
    expect(structure.components.length).toBeGreaterThanOrEqual(2); // Button.tsx and Button.html
    expect(structure.pages.length).toBeGreaterThanOrEqual(1); // At least Home.tsx
    expect(structure.layouts.length).toBeGreaterThanOrEqual(1); // Main.tsx
    expect(structure.apis.length).toBeGreaterThanOrEqual(1); // users.ts
    console.log('Found styles:', structure.styles);
    expect(structure.styles.length).toBe(2); // Should find both main.css and variables.css
    const stylePaths = structure.styles.map(s => s.path);
    expect(stylePaths).toContain(expect.stringContaining('main.css'));
    expect(stylePaths).toContain(expect.stringContaining('variables.css'));
  });

  it('should parse HTML files as components', async () => {
    const htmlComponents = await WebProjectParser.parseComponents(
      path.join(testProjectPath, 'src')
    );
    expect(htmlComponents).toEqual(expect.arrayContaining([
      expect.objectContaining({
        type: 'COMPONENT',
        path: expect.stringContaining('.html')
      })
    ]));
  });

  it('should parse MDX files as pages', async () => {
    const structure = await WebProjectParser.parseProject(testProjectPath);
    const mdxPage = structure.pages.find(p => p.path.endsWith('.mdx'));
    expect(mdxPage).toBeDefined();
    expect(mdxPage?.name).toBe('About');
  });

  it('should extract CSS imports', async () => {
    const structure = await WebProjectParser.parseProject(testProjectPath);
    const mainStyle = structure.styles.find(s => s.path.includes('main.css'));
    expect(mainStyle?.dependencies).toContain('variables.css');
  });
});