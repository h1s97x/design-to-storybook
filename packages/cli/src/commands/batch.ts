/**
 * Batch 命令
 * 批量转换多个文件
 */
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';
import { DesignConverter, Logger, ConversionError } from '@design-to-storybook/core';
const logger = new Logger({ level: 'info', prefix: 'batch' });

export const batchCommand = new Command('batch')
  .description('Batch convert multiple files')
  .requiredOption('-i, --input <path>', 'Input directory or file pattern')
  .requiredOption('-o, --output <path>', 'Output directory')
  .option('-f, --framework <framework>', 'Target framework (react|vue|angular)', 'react')
  .option('-t, --typescript', 'Generate TypeScript files', true)
  .option('--pattern <pattern>', 'File pattern to match', '*.json')
  .option('--parallel <number>', 'Number of parallel conversions', '4')
  .option('--skip-errors', 'Skip files that fail to convert', false)
  .action(async (options) => {
    const { input, output, framework, typescript, pattern, parallel, skipErrors } = options;
    
    logger.info(`Batch converting files from ${input}`);
    logger.info(`Output directory: ${output}`);
    logger.info(`Framework: ${framework}`);
    
    const converter = new DesignConverter({ framework, typescript });
    
    // Find all matching files
    const files = await findFiles(input, pattern);
    logger.info(`Found ${files.length} files to convert`);
    
    const results = {
      success: 0,
      failed: 0,
      skipped: 0,
      errors: [] as ConversionError[]
    };
    
    // Process files in parallel batches
    const batchSize = parseInt(parallel);
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const batchPromises = batch.map(async (file) => {
        try {
          await convertSingleFile(file, output, converter);
          results.success++;
          logger.success(`✓ ${file}`);
        } catch (error) {
          results.failed++;
          const err = error as ConversionError;
          results.errors.push(err);
          
          if (skipErrors) {
            logger.warn(`✗ ${file}: ${err.message}`);
          } else {
            throw error;
          }
        }
      });
      
      await Promise.all(batchPromises);
      logger.info(`Progress: ${Math.min(i + batchSize, files.length)}/${files.length}`);
    }
    
    // Print summary
    logger.info('\n--- Conversion Summary ---');
    logger.info(`Total: ${files.length}`);
    logger.success(`Success: ${results.success}`);
    if (results.failed > 0) {
      logger.error(`Failed: ${results.failed}`);
    }
    if (results.skipped > 0) {
      logger.warn(`Skipped: ${results.skipped}`);
    }
    
    if (results.errors.length > 0) {
      logger.info('\n--- Errors ---');
      results.errors.forEach((err, index) => {
        logger.error(`${index + 1}. ${err.context?.fileName || 'Unknown'}: ${err.message}`);
      });
    }
  });

async function findFiles(input: string, pattern: string): Promise<string[]> {
  const files: string[] = [];
  
  try {
    const stat = await fs.stat(input);
    
    if (stat.isDirectory()) {
      const allFiles = await fs.readdir(input);
      files.push(
        ...allFiles
          .filter(f => f.endsWith('.json'))
          .map(f => path.join(input, f))
      );
    } else if (stat.isFile() && input.endsWith('.json')) {
      files.push(input);
    }
  } catch (error) {
    // Handle glob patterns or multiple paths
    const parts = input.split(',');
    for (const part of parts) {
      const trimmed = part.trim();
      if (trimmed.endsWith('.json')) {
        try {
          await fs.access(trimmed);
          files.push(trimmed);
        } catch {
          logger.warn(`File not found: ${trimmed}`);
        }
      }
    }
  }
  
  return files;
}

async function convertSingleFile(
  inputPath: string,
  outputDir: string,
  converter: DesignConverter
): Promise<void> {
  const content = await fs.readFile(inputPath, 'utf-8');
  const designData = JSON.parse(content);
  
  const componentName = path.basename(inputPath, '.json');
  const result = converter.convert(designData);
  
  // Write output files
  await fs.mkdir(outputDir, { recursive: true });
  
  // Write component file
  const componentExt = inputPath.includes('typescript') || inputPath.includes('ts') ? '.tsx' : '.jsx';
  await fs.writeFile(
    path.join(outputDir, `${componentName}${componentExt}`),
    result.component
  );
  
  // Write story file
  await fs.writeFile(
    path.join(outputDir, `${componentName}.stories.tsx`),
    result.story
  );
}
