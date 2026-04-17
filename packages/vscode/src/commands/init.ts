import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';

export async function initCommand() {
  const config = vscode.workspace.getConfiguration('designToStorybook');
  const framework = config.get<string>('framework', 'react');
  
  const choice = await vscode.window.showQuickPick(
    ['Create basic setup', 'Create full setup with examples'],
    { placeHolder: 'Select initialization type' }
  );

  if (!choice) return;

  await vscode.window.withProgress({
    location: vscode.ProgressLocation.Notification,
    title: 'Initializing Design to Storybook...',
    cancellable: false
  }, async (progress) => {
    try {
      const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
      if (!workspaceFolder) {
        throw new Error('No workspace folder open');
      }

      const rootPath = workspaceFolder.uri.fsPath;

      progress.report({ message: 'Creating configuration file...' });
      
      // Create config file
      const configData = {
        $schema: 'https://design-to-storybook.js.org/schema.json',
        framework,
        output: './src/components',
        styleFormat: 'css',
        typescript: true,
        addons: {
          docs: true,
          controls: true,
          actions: true
        }
      };

      fs.writeFileSync(
        path.join(rootPath, 'design-to-storybook.config.json'),
        JSON.stringify(configData, null, 2)
      );

      progress.report({ message: 'Creating components directory...' });
      
      // Create components directory
      const componentsDir = path.join(rootPath, 'src', 'components');
      fs.mkdirSync(componentsDir, { recursive: true });

      if (choice.includes('full')) {
        progress.report({ message: 'Creating example components...' });
        
        // Create example component
        const exampleComponent = `import React from 'react';
import './Button.css';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'destructive';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'medium',
  disabled = false,
  children,
  onClick
}) => {
  return (
    <button
      className={\`button button--\${variant} button--\${size}\`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
`;

        const exampleStory = `import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Button',
  },
};
`;

        fs.writeFileSync(path.join(componentsDir, 'Button.tsx'), exampleComponent);
        fs.writeFileSync(path.join(componentsDir, 'Button.css'), '');
        fs.writeFileSync(path.join(componentsDir, 'Button.stories.tsx'), exampleStory);
      }

      progress.report({ message: 'Done!' });
      
      vscode.window.showInformationMessage(
        'Design to Storybook initialized successfully!',
        'Open Config',
        'Open Components'
      ).then(sel => {
        if (sel === 'Open Config') {
          vscode.commands.executeCommand('vscode.open', 
            vscode.Uri.file(path.join(rootPath, 'design-to-storybook.config.json')));
        } else if (sel === 'Open Components') {
          vscode.commands.executeCommand('revealFileInOS', vscode.Uri.file(componentsDir));
        }
      });

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      vscode.window.showErrorMessage(`Initialization failed: ${message}`);
    }
  });
}
