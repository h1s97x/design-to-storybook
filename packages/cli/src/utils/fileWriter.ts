/**
 * File Writer Utility
 * 
 * Helper functions for writing generated files
 */

import { mkdir, writeFile } from 'fs/promises';
import { resolve, dirname } from 'path';

export interface GeneratedFile {
  path: string;
  content: string;
}

/**
 * Write multiple files to disk
 */
export async function writeFiles(
  baseDir: string,
  files: GeneratedFile[]
): Promise<void> {
  // Create output directory
  await mkdir(resolve(baseDir), { recursive: true });

  // Write each file
  for (const file of files) {
    const filePath = resolve(baseDir, file.path);
    const fileDir = dirname(filePath);

    // Ensure directory exists
    await mkdir(fileDir, { recursive: true });

    // Write file
    await writeFile(filePath, file.content, 'utf-8');
  }
}

/**
 * Create a directory structure
 */
export async function ensureDirectory(dirPath: string): Promise<void> {
  await mkdir(resolve(dirPath), { recursive: true });
}

/**
 * Write a single file
 */
export async function writeSingleFile(
  dirPath: string,
  fileName: string,
  content: string
): Promise<void> {
  await ensureDirectory(dirPath);
  const filePath = resolve(dirPath, fileName);
  await writeFile(filePath, content, 'utf-8');
}

/**
 * Convert a Figma JSON file to component code
 */
export async function convertFile(
  inputPath: string,
  outputDir: string,
  options: {
    framework?: 'react' | 'vue' | 'angular';
    typescript?: boolean;
    styleFormat?: 'css' | 'scss' | 'tailwind';
  } = {}
): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  const { convertDesign } = await import('@design-to-storybook/core');

  // Read input file
  const content = await fs.readFile(inputPath, 'utf-8');
  const design = JSON.parse(content);

  // Convert design
  const result = convertDesign(design, {
    ...options,
    componentName: path.basename(inputPath, path.extname(inputPath))
  });

  // Write output files
  await ensureDirectory(outputDir);

  const files = [
    { path: path.join(outputDir, 'Component.tsx' as string), content: result.component },
    { path: path.join(outputDir, 'Component.stories.tsx' as string), content: result.story },
    { path: path.join(outputDir, 'Component.css' as string), content: result.styles },
  ];

  if (result.types) {
    files.push({ path: path.join(outputDir, 'types.ts' as string), content: result.types });
  }

  await writeFiles(outputDir, files as GeneratedFile[]);
}
