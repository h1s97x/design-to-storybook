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
