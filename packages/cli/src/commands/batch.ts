/**
 * Batch conversion command
 */
import { Command } from 'commander';
import { readFileSync, writeFileSync } from 'fs';
import { glob } from 'glob';
import { DesignConverter, Logger, LogLevel } from '@design-to-storybook/core';
import { convertToReact } from '@design-to-storybook/react';
import { writeFiles } from '../utils/fileWriter.js';

const logger = new Logger({ level: LogLevel.INFO, prefix: 'batch' });

export const batchCommand = new Command('batch')
  .description('Batch convert multiple Figma JSON files')
  .requiredOption('-p, --pattern <pattern>', 'Glob pattern for input files')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-f, --framework <framework>', 'Target framework', 'react')
  .option('-t, --typescript', 'Generate TypeScript files', true)
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    const { pattern, output, framework, typescript } = options;
    logger.info(`Searching for files matching: ${pattern}`);
    
    const files = await glob(pattern);
    
    if (files.length === 0) {
      logger.error(`No files found matching: ${pattern}`);
      return;
    }
    
    logger.info(`Found ${files.length} files to convert`);
    
    const converter = new DesignConverter({ framework: framework as 'react' | 'vue' | 'angular', typescript });
    
    let successCount = 0;
    let failCount = 0;
    
    for (const file of files) {
      try {
        logger.info(`Processing: ${file}`);
        const content = readFileSync(file, 'utf-8');
        const data = JSON.parse(content);
        const nodes = Array.isArray(data) ? data : [data];
        
        const result = converter.convert(nodes);
        
        // Generate component and story
        let componentCode = '';
        let storyCode = '';
        
        if (framework === 'react') {
          const reactResult = convertToReact(nodes, { typescript });
          componentCode = reactResult.code;
          storyCode = '';
        }
        
        const componentName = file.replace(/\.json$/, '').split('/').pop() || 'Component';
        
        writeFiles(output, {
          component: componentCode,
          story: storyCode,
          styles: '',
          types: ''
        }, componentName);
        
        successCount++;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to convert ${file}: ${errorMessage}`);
        failCount++;
      }
    }
    
    logger.success(`Batch conversion complete: ${successCount} succeeded, ${failCount} failed`);
  });
