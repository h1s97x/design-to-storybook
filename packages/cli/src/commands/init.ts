/**
 * Init Command
 * 
 * Initialize a new Storybook project with Design-to-Storybook
 */

import { Command } from 'commander';
import { mkdir, writeFile } from 'fs/promises';
import { resolve } from 'path';

export const initCommand = new Command('init')
  .description('Initialize a new Storybook project with Design-to-Storybook')
  .argument('[project-name]', 'Name of the project', 'my-design-system')
  .option('-f, --framework <name>', 'UI framework (react, vue, angular)', 'react')
  .option('-t, --template <name>', 'Template to use (default, minimal)', 'default')
  .action(async (projectName: string, options) => {
    await init(projectName, options);
  });

async function init(projectName: string, options: any) {
  console.log(`🚀 Initializing ${projectName}...`);
  console.log('');

  const projectDir = resolve(process.cwd(), projectName);

  try {
    // Create package.json
    const packageJson = {
      name: projectName,
      version: '0.1.0',
      private: true,
      scripts: {
        storybook: 'storybook dev',
        'build-storybook': 'storybook build',
        'design:convert': 'design-to-storybook convert',
      },
      dependencies: {
        react: '^18.2.0',
        'react-dom': '^18.2.0',
      },
      devDependencies: {
        '@storybook/react': '^8.0.0',
        '@storybook/react-vite': '^8.0.0',
        '@storybook/addon-docs': '^8.0.0',
        '@design-to-storybook/cli': '^0.1.0',
        typescript: '^5.5.0',
        '@types/react': '^18.3.0',
        '@types/react-dom': '^18.3.0',
        vite: '^5.0.0',
        '@vitejs/plugin-react': '^4.2.0',
      },
    };

    await mkdir(projectDir, { recursive: true });
    await mkdir(resolve(projectDir, 'src'), { recursive: true });
    await mkdir(resolve(projectDir, 'stories'), { recursive: true });

    // Write package.json
    await writeFile(
      resolve(projectDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );
    console.log('✅ Created package.json');

    // Create tsconfig.json
    const tsconfig = {
      compilerOptions: {
        target: 'ES2020',
        useDefineForClassFields: true,
        lib: ['ES2020', 'DOM', 'DOM.Iterable'],
        module: 'ESNext',
        skipLibCheck: true,
        moduleResolution: 'bundler',
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: 'react-jsx',
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
      },
      include: ['src'],
      references: [{ path: './tsconfig.node.json' }],
    };

    await writeFile(
      resolve(projectDir, 'tsconfig.json'),
      JSON.stringify(tsconfig, null, 2)
    );
    console.log('✅ Created tsconfig.json');

    // Create Storybook config
    const storybookConfig = `import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../stories/**/*.mdx', '../stories/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs'],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
`;

    await mkdir(resolve(projectDir, '.storybook'), { recursive: true });
    await writeFile(
      resolve(projectDir, '.storybook/main.ts'),
      storybookConfig
    );
    console.log('✅ Created .storybook/main.ts');

    // Create preview file
    const previewConfig = `import type { Preview } from '@storybook/react';

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
};

export default preview;
`;

    await writeFile(
      resolve(projectDir, '.storybook/preview.ts'),
      previewConfig
    );
    console.log('✅ Created .storybook/preview.ts');

    // Create example story
    const exampleStory = `import type { Meta, StoryObj } from '@storybook/react';

const meta: Meta = {
  title: 'Example/Introduction',
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj;

export const Primary: Story = {
  args: {
    label: 'Button',
  },
};
`;

    await writeFile(
      resolve(projectDir, 'stories/Introduction.stories.mdx'),
      `# Welcome to your Design System

This project was initialized with **Design-to-Storybook**.

## Next Steps

1. Run \`npm install\` to install dependencies
2. Export your Figma designs using the Design-to-Storybook Figma plugin
3. Run \`npm run design:convert\` to convert designs to components
4. Run \`npm run storybook\` to start developing

## Project Structure

\`\`\`
${projectName}/
├── src/              # Generated components
├── stories/          # Storybook stories
├── .storybook/       # Storybook configuration
└── package.json
\`\`\`
`
    );

    await writeFile(
      resolve(projectDir, 'stories/Introduction.stories.tsx'),
      exampleStory
    );
    console.log('✅ Created example story');

    console.log('');
    console.log('✨ Project initialized successfully!');
    console.log('');
    console.log('Next steps:');
    console.log(`  cd ${projectName}`);
    console.log('  npm install');
    console.log('  npm run storybook');
    console.log('');

  } catch (error) {
    console.error('❌ Initialization failed:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
    }
    process.exit(1);
  }
}
