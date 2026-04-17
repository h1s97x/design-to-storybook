/**
 * Convert Command
 * 
 * Converts Figma design JSON to Storybook components
 */

import { Command } from 'commander';
import { readFile } from 'fs/promises';
import { resolve } from 'path';
import { stylesToCSS } from '@design-to-storybook/core';
import { convertToReact } from '@design-to-storybook/react';
import { writeFiles } from '../utils/fileWriter.js';
import type { DesignNode, PluginExport } from '@design-to-storybook/core';

export const convertCommand = new Command('convert')
  .description('Convert Figma design JSON to Storybook components')
  .argument('<input>', 'Path to Figma design JSON file')
  .option('-o, --output <dir>', 'Output directory', './components')
  .option('-f, --framework <name>', 'Target framework (react, vue, angular)', 'react')
  .option('-s, --style <type>', 'Style format (css, tailwind, styled)', 'css')
  .option('--include-stories', 'Include Storybook story files', true)
  .option('--include-docs', 'Include MDX documentation', false)
  .option('--extract-tokens', 'Extract design tokens', true)
  .option('-v, --verbose', 'Verbose output')
  .action(async (input: string, options) => {
    await convert(input, options);
  });

async function convert(input: string, options: ConvertOptions) {
  const { verbose, output, framework, style } = options;

  if (verbose) {
    console.log('🔄 Design-to-Storybook Converter');
    console.log('─'.repeat(50));
    console.log(`Input: ${input}`);
    console.log(`Output: ${output}`);
    console.log(`Framework: ${framework}`);
    console.log(`Style: ${style}`);
    console.log('');
  }

  try {
    // Read and parse input file
    if (verbose) console.log('📖 Reading design file...');
    const content = await readFile(resolve(input), 'utf-8');
    const data = JSON.parse(content) as PluginExport;

    if (verbose) {
      console.log(`✅ Found ${data.nodes.length} design nodes`);
      console.log(`   Source: ${data.source.fileName}`);
      console.log('');
    }

    // Extract nodes
    const nodes: DesignNode[] = data.nodes;
    
    if (nodes.length === 0) {
      console.error('❌ No design nodes found in input file');
      process.exit(1);
    }

    // Convert to React (currently only React is fully implemented)
    if (verbose) console.log('⚙️  Converting to React components...');
    const { components, stories } = convertToReact(nodes, {
      styleFormat: style,
    });

    if (verbose) {
      console.log(`✅ Generated ${components.length} components`);
      console.log(`   Generated ${stories.length} stories`);
      console.log('');
    }

    // Prepare files to write
    const files: { path: string; content: string }[] = [];

    // Add components
    for (const component of components) {
      // Component file
      files.push({
        path: `${component.name}/${component.name}.tsx`,
        content: component.code,
      });

      // CSS file (if not using Tailwind or styled-components)
      if (style === 'css' && component.styles.length > 0) {
        files.push({
          path: `${component.name}/${component.name}.css`,
          content: stylesToCSS(component.styles),
        });
      }
    }

    // Add stories
    if (includeStories) {
      for (let i = 0; i < components.length && i < stories.length; i++) {
        files.push({
          path: `${components[i].name}/${components[i].name}.stories.tsx`,
          content: stories[i],
        });
      }
    }

    // Write files
    if (verbose) console.log('💾 Writing files...');
    await writeFiles(output, files);

    if (verbose) {
      console.log(`✅ Wrote ${files.length} files to ${output}`);
      console.log('');
    }

    // Summary
    console.log('✨ Conversion complete!');
    console.log('');
    console.log('Generated files:');
    for (const file of files) {
      console.log(`   - ${file.path}`);
    }

    if (extractTokens && data.styles) {
      console.log('');
      console.log('📦 Design tokens extracted:');
      if (data.styles.colors?.length) {
        console.log(`   - ${data.styles.colors.length} colors`);
      }
      if (data.styles.typography?.length) {
        console.log(`   - ${data.styles.typography.length} typography styles`);
      }
      if (data.styles.spacing?.length) {
        console.log(`   - ${data.styles.spacing.length} spacing values`);
      }
    }

  } catch (error) {
    console.error('❌ Conversion failed:');
    if (error instanceof Error) {
      console.error(`   ${error.message}`);
      if (verbose && error.stack) {
        console.error(error.stack);
      }
    }
    process.exit(1);
  }
}
