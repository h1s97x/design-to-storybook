/**
 * Convert command
 */
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { DesignConverter, Logger, LogLevel } from '@design-to-storybook/core';
import { convertToReact } from '@design-to-storybook/react';
import { writeFiles } from '../utils/fileWriter.js';

const logger = new Logger({ level: LogLevel.INFO, prefix: 'convert' });

export const convertCommand = new Command('convert')
  .description('Convert a Figma JSON file to component code')
  .requiredOption('-i, --input <path>', 'Input Figma JSON file path')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-f, --framework <framework>', 'Target framework', 'react')
  .option('-t, --typescript', 'Generate TypeScript files', true)
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    const { input, output, framework, typescript } = options;
    void options.verbose; // Reserved for future use
    
    logger.info(`Input: ${input}`);
    logger.info(`Output: ${output}`);
    logger.info(`Framework: ${framework}`);
    
    try {
      const content = readFileSync(input, 'utf-8');
      const designData = JSON.parse(content);
      const nodes = Array.isArray(designData) ? designData : [designData];
      
      const converter = new DesignConverter({ framework: framework as 'react' | 'vue' | 'angular', typescript });
      const result = converter.convert(nodes);
      
      // Generate component based on framework
      let componentCode = '';
      let storyCode = '';
      let cssCode = '';
      
      if (framework === 'react') {
        const reactResult = convertToReact(nodes, { typescript });
        componentCode = reactResult.code;
        cssCode = reactResult.styles.map((s) => s.css).join('\n');
        // Generate basic story
        const componentName = 'Component';
        storyCode = `import { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from './${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Components/${componentName}',
  component: ${componentName},
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {
  args: {},
};
`;
      }
      
      const baseName = input.replace(/\.json$/, '').split('/').pop() || 'Component';
      writeFiles(output, {
        component: componentCode,
        story: storyCode,
        styles: cssCode,
        types: ''
      }, baseName);
      
      logger.success(`Converted successfully!`);
      logger.info(`Generated files in: ${output}`);
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Conversion failed: ${errorMessage}`);
      process.exit(1);
    }
  });
