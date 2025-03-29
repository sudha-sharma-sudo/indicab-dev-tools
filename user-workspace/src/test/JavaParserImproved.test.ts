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
            expect(result.type).toBe('CLASS');
            expect(result.path).toBe(testJavaFile);
            expect(result.name).toBe('SampleClass');
            
            // Verify methods
            expect(result.methods.length).toBeGreaterThan(0);
            expect(result.fields.length).toBeGreaterThan(0);

            // Verify new properties
            if (result.annotations) {
                expect(result.annotations).toBeInstanceOf(Array);
            }
            if (result.dependencies) {
                expect(result.dependencies).toBeInstanceOf(Array);
            }
        });

        it('should parse a Java interface file', async () => {
            const result = await JavaParser.parseFile(testInterfaceFile);
            expect(result.type).toBe('INTERFACE');
            expect(result.methods).toEqual(expect.arrayContaining([
                expect.objectContaining({
                    name: 'interfaceMethod',
                    returnType: 'void'
                }),
                expect.objectContaining({
                    name: 'getValue',
                    returnType: 'String'
                })
            ]));

            // Verify new properties
            if (result.annotations) {
                expect(result.annotations).toBeInstanceOf(Array);
            }
            if (result.dependencies) {
                expect(result.dependencies).toBeInstanceOf(Array);
            }
        });

        it('should parse a Java enum file', async () => {
            const result = await JavaParser.parseFile(testEnumFile);
            expect(result.type).toBe('ENUM');

            // Verify new properties
            if (result.annotations) {
                expect(result.annotations).toBeInstanceOf(Array);
            }
            if (result.dependencies) {
                expect(result.dependencies).toBeInstanceOf(Array);
            }
        });

        it('should throw error for invalid file', async () => {
            await expect(JavaParser.parseFile('nonexistent.java'))
                .rejects
                .toThrow();
        });
    });

    describe('parseFiles', () => {
        it('should parse multiple Java files', async () => {
            const results = await JavaParser.parseFiles([testJavaFile, testInterfaceFile, testEnumFile]);
            expect(results.length).toBe(3);
            expect(results.some(r => r.name === 'SampleClass')).toBe(true);
            expect(results.some(r => r.name === 'SampleInterface')).toBe(true);
            expect(results.some(r => r.name === 'SampleEnum')).toBe(true);
        });

        it('should handle errors in individual files', async () => {
            const results = await JavaParser.parseFiles([testJavaFile, 'invalid.java']);
            expect(results.length).toBe(1);
        });
    });
});