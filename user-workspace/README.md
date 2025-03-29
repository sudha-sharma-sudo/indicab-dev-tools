# IndiCab Development Tools

VS Code extension for Java full-stack development with IndiCab.

## Features

- Project Explorer with Java package structure visualization
- Automatic detection of:
  - Java source roots
  - Maven/Gradle build files
  - Package hierarchies
- Quick navigation to:
  - Java classes
  - Build files
  - Package directories
- Real-time updates when files change

## Usage

1. Open a Java project in VS Code
2. The Project Explorer will automatically appear in the Explorer view
3. Expand packages to view their classes
4. Click on any item to open it in the editor

## Commands

- `IndiCab: Start` - Activate the extension
- `IndiCab: Refresh` - Refresh the project structure
- `IndiCab: Open File` - Open the selected file in editor

## Requirements

- VS Code 1.75.0 or higher
- Java project with either:
  - Maven (pom.xml)
  - Gradle (build.gradle)
  - Standard Java directory structure

## Extension Settings

No additional configuration required - works out of the box!

## Known Issues

- Large projects may take a few seconds to parse initially
- Only supports standard Java project structures

## Release Notes

### 0.0.1

Initial release with basic project exploration features