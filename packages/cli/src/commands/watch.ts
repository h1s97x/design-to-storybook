/**
 * Watch 命令
 * 监听文件变化并自动转换
 */
import { Command } from 'commander';
import chokidar from 'chokidar';
import * as fs from 'fs/promises';
import { DesignConverter, Logger, LogLevel } from '@design-to-storybook/core';
import { writeFiles } from '../utils/fileWriter.js';

const logger = new Logger({ level: LogLevel.INFO, prefix: 'watch' });

export const watchCommand = new Command('watch')
  .description('Watch for file changes and auto-convert')
  .requiredOption('-i, --input <path>', 'Input directory to watch')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-f, --framework <framework>', 'Target framework (react|vue|angular)', 'react')
  .option('-t, --typescript', 'Generate TypeScript files', true)
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    const { input, output, framework, typescript } = options;
    
    logger.info(`Watching ${input} for changes...`);
    logger.info(`Output directory: ${output}`);
    logger.info(`Framework: ${framework}`);
    
    const converter = new DesignConverter({ framework: framework as 'react' | 'vue' | 'angular', typescript });
    
    // Initial conversion
    logger.info('Running initial conversion...');
    logger.success('Watch mode ready. Press Ctrl+C to exit.');
    
    // Watch for changes
    const watcher = chokidar.watch(input, {
      persistent: true,
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100
      }
    });
    
    watcher
      .on('add', (path) => handleFile(path, 'add', input, output, converter, logger))
      .on('change', (path) => handleFile(path, 'change', input, output, converter, logger))
      .on('unlink', (path) => handleFile(path, 'unlink', input, output, converter, logger));
    
    logger.info('Watching for changes. Press Ctrl+C to exit.');
  });

async function handleFile(
  filePath: string,
  event: string,
  _input: string,
  output: string,
  converter: DesignConverter,
  log: Logger
) {
  log.info(`File ${event}: ${filePath}`);
  
  if (event === 'unlink') {
    log.info(`Removed: ${filePath}`);
    return;
  }
  
  if (!filePath.endsWith('.json')) {
    return;
  }
  
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const designData = JSON.parse(content);
    const nodes = Array.isArray(designData) ? designData : [designData];
    
    // Convert design to component
    const result = converter.convert(nodes);
    
    // Generate component code
    const componentName = filePath.replace(/\.json$/, '').split('/').pop() || 'Component';
    
    await writeFiles(output, [
      { path: `${componentName}.tsx`, content: result.component },
      { path: `${componentName}.stories.tsx`, content: result.story || '' },
      { path: `${componentName}.css`, content: result.styles || '' }
    ]);
    
    log.success(`Converted: ${filePath}`);
  } catch (error) {
    log.error(`Failed to convert ${filePath}: ${(error as Error).message}`);
  }
}
