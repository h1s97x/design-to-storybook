/**
 * Config 命令
 * 管理配置文件
 */
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';

export const configCommand = new Command('config')
  .description('Manage configuration');

// Init default config
configCommand
  .command('init')
  .description('Create default configuration file')
  .option('-p, --path <path>', 'Output path', 'design-to-storybook.config.json')
  .option('-t, --typescript', 'Generate TypeScript config')
  .action(async (options) => {
    const config = {
      $schema: 'https://design-to-storybook.js.org/schema.json',
      framework: 'react',
      output: './src/components',
      styleFormat: 'css' as const,
      typescript: true,
      addons: {
        docs: true,
        controls: true,
        actions: true
      },
      transformations: {
        colors: true,
        spacing: true,
        typography: true,
        shadows: true
      },
      naming: {
        convention: 'camelCase' as const,
        prefix: ''
      }
    };
    
    const content = options.typescript
      ? `export default ${JSON.stringify(config, null, 2)} as const;\n`
      : JSON.stringify(config, null, 2);
    
    await fs.writeFile(options.path, content);
    console.log(`✓ Configuration file created: ${options.path}`);
  });

// Show current config
configCommand
  .command('show')
  .description('Show current configuration')
  .option('-c, --config <path>', 'Config file path', 'design-to-storybook.config.json')
  .action(async (options) => {
    try {
      const content = await fs.readFile(options.config, 'utf-8');
      console.log(JSON.stringify(JSON.parse(content), null, 2));
    } catch (error) {
      console.error(`✗ Config file not found: ${options.config}`);
      console.log('Run "design-to-storybook config init" to create one.');
    }
  });

// Validate config
configCommand
  .command('validate')
  .description('Validate configuration file')
  .option('-c, --config <path>', 'Config file path', 'design-to-storybook.config.json')
  .action(async (options) => {
    try {
      const content = await fs.readFile(options.config, 'utf-8');
      const config = JSON.parse(content);
      
      const errors: string[] = [];
      
      // Validate required fields
      if (!config.framework) {
        errors.push('Missing required field: framework');
      }
      if (!config.output) {
        errors.push('Missing required field: output');
      }
      
      // Validate framework
      const validFrameworks = ['react', 'vue', 'angular', 'svelte'];
      if (config.framework && !validFrameworks.includes(config.framework)) {
        errors.push(`Invalid framework: ${config.framework}. Must be one of: ${validFrameworks.join(', ')}`);
      }
      
      // Validate style format
      const validFormats = ['css', 'scss', 'tailwind', 'styled-components', 'emotion'];
      if (config.styleFormat && !validFormats.includes(config.styleFormat)) {
        errors.push(`Invalid styleFormat: ${config.styleFormat}. Must be one of: ${validFormats.join(', ')}`);
      }
      
      if (errors.length === 0) {
        console.log('✓ Configuration is valid');
        console.log(JSON.stringify(config, null, 2));
      } else {
        console.error('✗ Configuration validation failed:');
        errors.forEach(err => console.error(`  - ${err}`));
        process.exit(1);
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        console.error(`✗ Config file not found: ${options.config}`);
        process.exit(1);
      }
      console.error(`✗ Invalid JSON: ${(error as Error).message}`);
      process.exit(1);
    }
  });
