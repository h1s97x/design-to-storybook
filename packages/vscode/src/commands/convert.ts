import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function convertCommand(uri?: vscode.Uri) {
  const config = vscode.workspace.getConfiguration('designToStorybook');
  
  // Get file to convert
  let filePath: string;
  if (uri) {
    filePath = uri.fsPath;
  } else if (vscode.window.activeTextEditor) {
    filePath = vscode.window.activeTextEditor.document.uri.fsPath;
  } else {
    vscode.window.showErrorMessage('No file selected');
    return;
  }

  // Validate file
  if (!filePath.endsWith('.json')) {
    vscode.window.showErrorMessage('Please select a Figma JSON file (.json)');
    return;
  }

  // Read config
  const framework = config.get<string>('framework', 'react');
  const outputDir = config.get<string>('outputDirectory', './src/components');
  const typescript = config.get<boolean>('typescript', true);
  const styleFormat = config.get<string>('styleFormat', 'css');

  // Show progress
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Converting design...',
    cancellable: false
  }, async (progress) => {
    try {
      progress.report({ message: 'Reading Figma JSON...' });
      const content = fs.readFileSync(filePath, 'utf-8');
      const designData = JSON.parse(content);

      progress.report({ message: 'Generating component...' });
      
      // Import converters based on framework
      let componentCode: string;
      let storyCode: string;

      if (framework === 'react') {
        const { ReactComponentGenerator } = await import('@design-to-storybook/react');
        const generator = new ReactComponentGenerator();
        const result = generator.generate(designData);
        componentCode = result.component;
        storyCode = result.story;
      } else if (framework === 'vue') {
        const { VueComponentGenerator } = await import('@design-to-storybook/vue');
        const generator = new VueComponentGenerator();
        const result = generator.generate(designData);
        componentCode = result.sfc;
        storyCode = result.storyFile;
      } else if (framework === 'angular') {
        const { AngularComponentGenerator } = await import('@design-to-storybook/angular');
        const generator = new AngularComponentGenerator();
        const result = generator.generate(designData);
        componentCode = result.component;
        storyCode = result.storyFile;
      } else {
        throw new Error(`Unsupported framework: ${framework}`);
      }

      progress.report({ message: 'Writing files...' });
      
      // Create output directory
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder open');
      }
      
      const outputPath = path.join(workspaceFolder.uri.fsPath, outputDir);
      fs.mkdirSync(outputPath, { recursive: true });

      // Generate file names
      const baseName = path.basename(filePath, '.json');
      const componentName = toPascalCase(baseName);
      const ext = typescript ? '.tsx' : '.jsx';

      // Write component file
      const componentPath = path.join(outputPath, `${componentName}${ext}`);
      fs.writeFileSync(componentPath, componentCode);

      // Write story file
      const storyPath = path.join(outputPath, `${componentName}.stories${ext}`);
      fs.writeFileSync(storyPath, storyCode);

      progress.report({ message: 'Done!' });
      
      // Show success message
      const choice = await vscode.window.showInformationMessage(
        `Successfully converted to ${framework} component!`,
        'Open Component',
        'Open Story',
        'Open Folder'
      );

      if (choice === 'Open Component') {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(componentPath));
      } else if (choice === 'Open Story') {
        vscode.commands.executeCommand('vscode.open', vscode.Uri.file(storyPath));
      } else if (choice === 'Open Folder') {
        vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(outputPath));
      }

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Conversion failed: ${message}`);
    }
  });
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}
