import * as path from 'path';
import { JavaParser } from '../utils/JavaParser';
import { JavaClass } from '../utils/JavaProjectParser';

describe('JavaParser', () => {
    const testJavaFile = path.join(__dirname, '../../test-fixtures/SampleClass.java');
    const testInterfaceFile = path.join(__dirname, '../../test-fixtures/SampleInterface.java');
    const testEnumFile = path.join(__dirname, '../../test-fixtures/SampleEnum.java');

    describe('parseFile', () => {
        it('should parse a Java class file', async () => {
            const result = await JavaParser.parseFile(testJavaFile);
            expect(result).toMatchObject({
                name: 'SampleClass',
                type: 'CLASS',
                path: testJavaFile
            });
            expect(result?.methods?.length).toBeGreaterThan(0);
            expect(result?.fields?.length).toBeGreaterThan(0);
        });

        it('should parse a Java interface file', async () => {
            const result = await JavaParser.parseFile(testInterfaceFile);
            expect(result?.type).toBe('INTERFACE');
        });

        it('should parse a Java enum file', async () => {
            const result = await JavaParser.parseFile(testEnumFile);
            expect(result?.type).toBe('ENUM');
        });

        it('should throw error for invalid file', async () => {
            await expect(JavaParser.parseFile('nonexistent.java'))
                .rejects
                .toThrow();
        });
    });

    describe('parseFiles', () => {
        it('should parse multiple Java files', async () => {
            const results = await Promise.all([testJavaFile, testInterfaceFile].map(f => JavaParser.parseFile(f)));
            expect(results.length).toBe(2);
            expect(results[0]?.name).toBe('SampleClass');
            expect(results[1]?.name).toBe('SampleInterface');
        });

        it('should handle errors in individual files', async () => {
            const results = await Promise.all([testJavaFile, 'invalid.java'].map(f => JavaParser.parseFile(f)));
            expect(results.filter(r => r !== null).length).toBe(1);
        });
    });
});
