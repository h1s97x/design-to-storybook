/**
 * Design-to-Storybook CLI
 * 
 * Command-line interface for converting Figma designs to Storybook components
 */

import { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import { initCommand } from './commands/init.js';
import pkg from '../package.json' with { type: 'json' };
const { version } = pkg;

const program = new Command();

program
  .name('design-to-storybook')
  .description('Convert Figma designs to production-ready Storybook components')
  .version(version);

// Register commands
program.addCommand(convertCommand);
program.addCommand(initCommand);

program.parse();
