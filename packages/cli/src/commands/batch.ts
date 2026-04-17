/**
 * Batch conversion command
 */
import { Command } from 'commander';
import { readFileSync, readdirSync, statSync } from 'fs';
import { join, basename } from 'path';
import { Logger, LogLevel } from '@design-to-storybook/core';
import { convertToReact } from '@design-to-storybook/react';
import { writeFiles, type GeneratedFile } from '../utils/fileWriter.js';

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
    
    const files = findFiles(pattern);
    
    if (files.length === 0) {
      logger.error(`No files found matching: ${pattern}`);
      return;
    }
    
    logger.info(`Found ${files.length} files to convert`);
    
    let successCount = 0;
    let failCount = 0;
    
    for (const file of files) {
      try {
        logger.info(`Processing: ${file}`);
        const content = readFileSync(file, 'utf-8');
        const data = JSON.parse(content);
        const nodes = Array.isArray(data) ? data : [data];
        
        const componentName = basename(file, '.json');
        
        if (framework === 'react') {
          const reactResult = convertToReact(nodes, { typescript });
          
          // Write each component and its story
          for (const component of reactResult.components) {
            const idx = reactResult.components.indexOf(component);
            const storyContent = reactResult.stories[idx] || '';
            
            const files: GeneratedFile[] = [
              { path: `${component.name || componentName}.tsx`, content: component.code },
              { path: `${component.name || componentName}.stories.tsx`, content: storyContent }
            ];
            
            if (component.styles && component.styles.length > 0) {
              const cssContent = component.styles
                .map((s) => s.css ? Object.entries(s.css).map(([k, v]) => `${k}: ${v}`).join(';\n') : '')
                .filter(Boolean)
                .join('\n\n');
              files.push({ path: `${component.name || componentName}.css`, content: cssContent });
            }
            
            await writeFiles(output, files);
          }
        }
        
        successCount++;
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : String(err);
        logger.error(`Failed to convert ${file}: ${errorMessage}`);
        failCount++;
      }
    }
    
    logger.success(`Batch conversion complete: ${successCount} succeeded, ${failCount} failed`);
  });

/**
 * Find files matching a glob pattern (simple implementation)
 */
const findFiles = (pattern: string): string[] => {
  // Simple glob implementation for **/*.json pattern
  const files: string[] = [];
  const normalizedPattern = pattern.replace(/\\/g, '/');
  
  if (normalizedPattern.includes('**')) {
    const [baseDir, , ext] = normalizedPattern.split('**/');
    const searchExt = ext || '*.json';
    const searchDir = baseDir || '.';
    
    const walkDir = (dir: string) => {
      try {
        const entries = readdirSync(dir);
        for (const entry of entries) {
          const fullPath = join(dir, entry);
          const stat = statSync(fullPath);
          if (stat.isDirectory()) {
            walkDir(fullPath);
          } else if (entry.endsWith(searchExt.replace('*', ''))) {
            files.push(fullPath);
          }
        }
      } catch {
        // Ignore permission errors
      }
    };
    
    walkDir(searchDir);
  } else {
    files.push(pattern);
  }
  
  return files;
};
