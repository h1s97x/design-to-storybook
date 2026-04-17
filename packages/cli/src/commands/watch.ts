/**
 * Watch 命令
 * 监听文件变化并自动转换
 */
import { Command } from 'commander';
import chokidar from 'chokidar';
import { convertFile } from '../utils/fileWriter.js';
import { DesignConverter, Logger } from '@design-to-storybook/core';
const logger = new Logger({ level: 'info', prefix: 'watch' });

export const watchCommand = new Command('watch')
  .description('Watch for file changes and auto-convert')
  .requiredOption('-i, --input <path>', 'Input directory to watch')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-f, --framework <framework>', 'Target framework (react|vue|angular)', 'react')
  .option('-t, --typescript', 'Generate TypeScript files', true)
  .option('--verbose', 'Enable verbose logging', false)
  .action(async (options) => {
    const { input, output, framework, typescript, verbose } = options;
    
    logger.info(`Watching ${input} for changes...`);
    logger.info(`Output directory: ${output}`);
    logger.info(`Framework: ${framework}`);
    
    const converter = new DesignConverter({ framework, typescript });
    
    // Initial conversion
    logger.info('Running initial conversion...');
    await processDirectory(input, output, converter);
    
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
      .on('add', (path) => handleFile(path, 'add', input, output, converter, verbose))
      .on('change', (path) => handleFile(path, 'change', input, output, converter, verbose))
      .on('unlink', (path) => handleFile(path, 'unlink', input, output, converter, verbose));
    
    logger.info('Watching for changes. Press Ctrl+C to exit.');
  });

async function processDirectory(input: string, output: string, converter: DesignConverter) {
  // Implementation for processing directory
  logger.info(`Processing directory: ${input}`);
}

async function handleFile(
  filePath: string,
  event: string,
  input: string,
  output: string,
  converter: DesignConverter,
  verbose: boolean
) {
  if (verbose) {
    logger.info(`File ${event}: ${filePath}`);
  }
  
  if (event === 'unlink') {
    logger.info(`Removed: ${filePath}`);
    return;
  }
  
  if (!filePath.endsWith('.json')) {
    return;
  }
  
  try {
    await convertFile(filePath, output, converter);
    logger.success(`Converted: ${filePath}`);
  } catch (error) {
    logger.error(`Failed to convert ${filePath}: ${(error as Error).message}`);
  }
}
