import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import type { DesignNode } from '@design-to-storybook/core';
import { convertToReact } from '@design-to-storybook/react';

export async function convertCommand(uri?: vscode.Uri) {
  const config = vscode.workspace.getConfiguration('designToStorybook');
  
  // Get file to convert
  const fileUri = uri || await vscode.window.showOpenDialog({
    canSelectMany: false,
    filters: { 'Figma JSON': ['json'] }
  }).then(result => result?.[0]);

  if (!fileUri) {
    vscode.window.showErrorMessage('No file selected');
    return;
  }

  const outputDir = config.get<string>('outputDir') || './src/components';
  const framework = config.get<string>('framework') || 'react';

  try {
    // Ensure output directory exists
    await fs.promises.mkdir(outputDir, { recursive: true });
    
    // Read input file
    const content = await fs.promises.readFile(fileUri.fsPath, 'utf-8');
    const designData = JSON.parse(content);
    const nodes: DesignNode[] = Array.isArray(designData) ? designData : [designData];

    const baseName = path.basename(fileUri.fsPath, '.json');

    if (framework === 'react') {
      const result = convertToReact(nodes);
      
      for (const component of result.components) {
        const idx = result.components.indexOf(component);
        const storyContent = result.stories[idx] || '';
        
        await fs.promises.writeFile(
          path.join(outputDir, `${component.name || baseName}.tsx`),
          component.code
        );
        await fs.promises.writeFile(
          path.join(outputDir, `${component.name || baseName}.stories.tsx`),
          storyContent
        );
        
        if (component.styles && component.styles.length > 0) {
          const cssContent = component.styles
            .map((s) => s.css ? Object.entries(s.css).map(([k, v]) => `${k}: ${v}`).join(';\n') : '')
            .filter(Boolean)
            .join('\n\n');
          await fs.promises.writeFile(
            path.join(outputDir, `${component.name || baseName}.css`),
            cssContent
          );
        }
      }
    }

    vscode.window.showInformationMessage(`Converted to ${outputDir}`);
    
  } catch (error) {
    vscode.window.showErrorMessage(`Conversion failed: ${(error as Error).message}`);
  }
}
