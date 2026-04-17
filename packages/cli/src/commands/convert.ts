/**
 * Convert command
 */
import { Command } from 'commander';
import { readFileSync } from 'fs';
import { DesignConverter, Logger, LogLevel } from '@design-to-storybook/core';
import { convertToReact } from '@design-to-storybook/react';
import { writeFiles, type GeneratedFile } from '../utils/fileWriter.js';

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
    
    logger.info(`Input: ${input}`);
    logger.info(`Output: ${output}`);
    logger.info(`Framework: ${framework}`);
    
    try {
      const content = readFileSync(input, 'utf-8');
      const designData = JSON.parse(content);
      const nodes = Array.isArray(designData) ? designData : [designData];
      
      const converter = new DesignConverter({ framework: framework as 'react' | 'vue' | 'angular', typescript });
      converter.convert(nodes);
      
      const baseName = input.replace(/\.json$/, '').split('/').pop() || 'Component';
      const files: GeneratedFile[] = [];
      
      if (framework === 'react') {
        const reactResult = convertToReact(nodes, { typescript });
        
        for (const component of reactResult.components) {
          const idx = reactResult.components.indexOf(component);
          const storyContent = reactResult.stories[idx] || '';
          
          files.push({ path: `${component.name || baseName}.tsx`, content: component.code });
          files.push({ path: `${component.name || baseName}.stories.tsx`, content: storyContent });
          
          if (component.styles && component.styles.length > 0) {
            const cssContent = component.styles
              .map((s) => s.css ? Object.entries(s.css).map(([k, v]) => `${k}: ${v}`).join(';\n') : '')
              .filter(Boolean)
              .join('\n\n');
            files.push({ path: `${component.name || baseName}.css`, content: cssContent });
          }
        }
      }
      
      if (files.length > 0) {
        await writeFiles(output, files);
        logger.success(`Converted successfully!`);
        logger.info(`Generated files in: ${output}`);
      } else {
        logger.warn('No files were generated');
      }
      
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      logger.error(`Conversion failed: ${errorMessage}`);
      process.exit(1);
    }
  });
