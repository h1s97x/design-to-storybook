import * as vscode from 'vscode';
import { convertCommand } from './commands/convert';
import { initCommand } from './commands/init';
import { doctorCommand } from './commands/doctor';

export function activate(context: vscode.ExtensionContext) {
  // Register commands
  const commands = [
    vscode.commands.registerCommand('design-to-storybook.convert', convertCommand),
    vscode.commands.registerCommand('design-to-storybook.init', initCommand),
    vscode.commands.registerCommand('design-to-storybook.doctor', doctorCommand),
    vscode.commands.registerCommand('design-to-storybook.openDocs', () => {
      vscode.env.openExternal(vscode.Uri.parse('https://design-to-storybook.js.org'));
    })
  ];

  commands.forEach(cmd => context.subscriptions.push(cmd));

  // Show welcome message on first activation
  const state = context.globalState.get('hasActivatedBefore');
  if (!state) {
    vscode.window.showInformationMessage(
      'Design to Storybook: Use the command palette (Ctrl+Shift+P) to access commands',
      'Open Documentation',
      'Got it'
    ).then(selection => {
      if (selection === 'Open Documentation') {
        vscode.commands.executeCommand('design-to-storybook.openDocs');
      }
    });
    context.globalState.update('hasActivatedBefore', true);
  }
}

export function deactivate() {}
