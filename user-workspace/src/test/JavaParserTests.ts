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import * as path from 'path';
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
            
            // Verify methods
            expect(result.methods).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'method1',
                        returnType: 'void',
                        parameters: [{
                            name: 'param',
                            type: 'String'
                        }]
                    }),
                    expect.objectContaining({
                        name: 'getField1',
                        returnType: 'String',
                        parameters: []
                    })
                ])
            );

            // Verify fields
            expect(result.fields).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'field1',
                        type: 'String',
                        visibility: 'private'
                    }),
                    expect.objectContaining({
                        name: 'field2',
                        type: 'int',
                        visibility: 'public'
                    })
                ])
            );
        });


            const result = await JavaParser.parseFile(testInterfaceFile);
            expect(result.type).toBe('INTERFACE');
            expect(result.methods).toEqual(
                expect.arrayContaining([
                    expect.objectContaining({
                        name: 'interfaceMethod',
                        returnType: 'void'
                    }),
                    expect.objectContaining({
                        name: 'getValue',
                        returnType: 'String'
                    }),
                    expect.objectContaining({
                        name: 'setValue',
                        returnType: 'void'
                    })
                ])
            );
        });
        it('should parse a Java enum file', async () => {
            const result = await JavaParser.parseFile(testEnumFile);
            expect(result.type).toBe('ENUM');
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