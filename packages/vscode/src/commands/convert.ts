import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { DesignNode, PropDefinition, VariantDefinition } from '@design-to-storybook/core';
import type { ReactConvertOptions, VueGeneratorOptions, AngularGeneratorOptions } from '@design-to-storybook/core';

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
  void config.get<string>('styleFormat', 'css'); // Reserved for future use

  // Show progress
  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Converting design...',
    cancellable: false
  }, async (progress) => {
    try {
      progress.report({ message: 'Reading Figma JSON...' });
      const content = fs.readFileSync(filePath, 'utf-8');
      const designData = JSON.parse(content) as DesignNode | DesignNode[];

      progress.report({ message: 'Generating component...' });
      
      // Ensure array format
      const nodes: DesignNode[] = Array.isArray(designData) ? designData : [designData];
      
      // Generate component based on framework
      let componentCode: string;
      let storyCode: string;

      if (framework === 'react') {
        const { generateReactComponent, generateReactStory } = await import('@design-to-storybook/react');
        const reactOptions: Partial<ReactConvertOptions> = { typescript };
        const componentResult = generateReactComponent(nodes, reactOptions);
        const props: PropDefinition[] = [];
        const storyResult = generateReactStory('Button', componentResult.code, props, []);
        componentCode = componentResult.code;
        storyCode = storyResult.storyFile;
      } else if (framework === 'vue') {
        const { VueComponentGenerator, VueStoryGenerator } = await import('@design-to-storybook/vue');
        const vueOptions: Partial<VueGeneratorOptions> = { typescript };
        const componentGenerator = new VueComponentGenerator(vueOptions);
        const storyGenerator = new VueStoryGenerator(vueOptions);
        const componentResult = componentGenerator.generate(nodes[0], []);
        const storyResult = storyGenerator.generate('Button', 'Button.vue', []);
        componentCode = componentResult.sfc;
        storyCode = storyResult.storyFile;
      } else if (framework === 'angular') {
        const { AngularComponentGenerator, AngularStoryGenerator } = await import('@design-to-storybook/angular');
        const angularOptions: Partial<AngularGeneratorOptions> = { typescript };
        const componentGenerator = new AngularComponentGenerator(angularOptions);
        const storyGenerator = new AngularStoryGenerator(angularOptions);
        const componentResult = componentGenerator.generate(nodes[0], []);
        const storyResult = storyGenerator.generate('Button', 'button.component.ts', []);
        componentCode = componentResult.component;
        storyCode = storyResult.storyFile;
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
      const componentFile = path.join(outputPath, `${componentName}${ext}`);
      fs.writeFileSync(componentFile, componentCode);
      
      // Write story file
      const storyExt = typescript ? '.stories.tsx' : '.stories.jsx';
      const storyFile = path.join(outputPath, `${componentName}${storyExt}`);
      fs.writeFileSync(storyFile, storyCode);

      progress.report({ message: 'Done!' });
      vscode.window.showInformationMessage(`Converted to ${componentName} component!`);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Conversion failed: ${errorMessage}`);
    }
  });
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, c) => (c ? c.toUpperCase() : ''))
    .replace(/^(.)/, (c) => c.toUpperCase());
}
