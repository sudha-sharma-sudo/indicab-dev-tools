# IndiCab Development Tools Extension Deployment Guide

## Prerequisites
1. Node.js (v16.x or higher)
2. Visual Studio Code (v1.75 or higher)
3. VS Code Extension Manager (`vsce`): `npm install -g @vscode/vsce`
4. Microsoft Publisher Account (for marketplace access)

## Build Process
1. Install dependencies:
```bash
npm install
```

2. Compile TypeScript:
```bash
npm run compile
```

3. Run tests:
```bash
npm test
```

## Packaging the Extension
1. Update version in `package.json` following SemVer:
```json
"version": "0.0.1" → "0.0.2"
```

2. Create production package:
```bash
vsce package
```
This will generate `indicab-dev-tools-0.0.2.vsix`

## Publishing to Marketplace
1. Login to publisher account:
```bash
vsce login <publisher-name>
```

2. Publish extension:
```bash
vsce publish
```

3. For manual publishing:
- Upload the `.vsix` file to: https://marketplace.visualstudio.com/manage

## Marketplace Metadata Requirements
Ensure these fields are properly set in `package.json`:
- `displayName`: Human-readable name
- `description`: Detailed extension purpose
- `categories`: At least one valid category
- `repository`: Source code location
- `icon`: (Recommended) 128x128 PNG in root directory
- `galleryBanner`: (Recommended) Marketplace banner settings

## CI/CD Setup (Optional)
Add this to your GitHub Actions workflow:
```yaml
name: Release
on:
  push:
    tags:
      - 'v*'
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: 16
    - run: npm install
    - run: npm run compile
    - run: npm test
    - run: npm install -g @vscode/vsce
    - run: vsce package
    - uses: actions/upload-artifact@v3
      with:
        name: extension
        path: *.vsix
```

## Verification Checklist
- [ ] All required fields in package.json
- [ ] LICENSE file present
- [ ] README.md contains:
  - Features overview
  - Installation instructions
  - Usage examples
  - Configuration options
- [ ] .vscodeignore excludes:
  - test files
  - development configurations
  - unnecessary assets

## Troubleshooting
- **Invalid publisher**: Ensure you're logged in with `vsce login`
- **Missing files**: Verify `.vscodeignore` exclusions
- **Version conflicts**: Delete `node_modules` and reinstall
- **Authentication**: Generate new PAT if publishing fails