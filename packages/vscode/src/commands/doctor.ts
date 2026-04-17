import * as vscode from 'vscode';
import * as fs from 'fs';

export async function doctorCommand() {
  const output = vscode.window.createOutputChannel('Design to Storybook');
  output.show();

  const log = (message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const prefix = {
      info: 'ℹ',
      success: '✓',
      warning: '⚠',
      error: '✗'
    }[type];
    output.appendLine(`${prefix} ${message}`);
  };

  log('Running diagnostics...', 'info');
  log('', 'info');

  let hasErrors = false;

  // Check Node.js version
  const nodeVersion = process.version;
  const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);
  if (majorVersion >= 18) {
    log(`Node.js version: ${nodeVersion}`, 'success');
  } else {
    log(`Node.js version: ${nodeVersion} (recommend 18+)`, 'warning');
  }

  // Check TypeScript
  const tsConfigPath = vscode.workspace.workspaceFolders?.[0];
  if (tsConfigPath) {
    try {
      const tsConfig = fs.readFileSync(
        vscode.Uri.joinPath(tsConfigPath.uri, 'tsconfig.json').fsPath,
        'utf-8'
      );
      log('TypeScript configuration found', 'success');
    } catch {
      log('TypeScript configuration not found', 'warning');
    }
  }

  // Check dependencies
  if (tsConfigPath) {
    try {
      fs.accessSync(vscode.Uri.joinPath(tsConfigPath.uri, 'node_modules').fsPath);
      log('Dependencies installed (node_modules found)', 'success');
    } catch {
      log('Dependencies not installed (run: pnpm install)', 'error');
      hasErrors = true;
    }
  }

  // Check configuration
  const config = vscode.workspace.getConfiguration('designToStorybook');
  const framework = config.get<string>('framework');
  const outputDir = config.get<string>('outputDirectory');

  log('', 'info');
  log('Configuration:', 'info');
  log(`  Framework: ${framework || 'not set'}`, framework ? 'info' : 'warning');
  log(`  Output directory: ${outputDir || 'not set'}`, outputDir ? 'info' : 'warning');

  // Check Storybook
  if (tsConfigPath) {
    try {
      const pkgPath = vscode.Uri.joinPath(tsConfigPath.uri, 'package.json').fsPath;
      const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
      
      if (pkg.devDependencies?.storybook || pkg.dependencies?.storybook) {
        const version = pkg.devDependencies?.storybook || pkg.dependencies?.storybook;
        log(`Storybook: ${version}`, 'success');
      } else {
        log('Storybook: not installed', 'warning');
      }
    } catch {
      log('package.json not found', 'warning');
    }
  }

  // Check Figma packages
  const hasCore = await checkPackage('@design-to-storybook/core');
  const hasReact = await checkPackage('@design-to-storybook/react');
  const hasCLI = await checkPackage('@design-to-storybook/cli');

  log('', 'info');
  log('Design to Storybook packages:', 'info');
  log(`  @design-to-storybook/core: ${hasCore ? 'installed' : 'not installed'}`, hasCore ? 'success' : 'warning');
  log(`  @design-to-storybook/react: ${hasReact ? 'installed' : 'not installed'}`, hasReact ? 'success' : 'warning');
  log(`  @design-to-storybook/cli: ${hasCLI ? 'installed' : 'not installed'}`, hasCLI ? 'success' : 'warning');

  log('', 'info');
  if (!hasErrors) {
    log('All checks passed!', 'success');
  } else {
    log('Some checks failed. Please fix the issues above.', 'error');
  }

  vscode.window.showInformationMessage(
    hasErrors ? 'Some checks failed. See Output panel for details.' : 'All checks passed!',
    'View Output',
    'Dismiss'
  ).then(selection => {
    if (selection === 'View Output') {
      output.show();
    }
  });
}

async function checkPackage(name: string): Promise<boolean> {
  try {
    require.resolve(name);
    return true;
  } catch {
    return false;
  }
}
