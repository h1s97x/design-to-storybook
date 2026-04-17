/**
 * Design-to-Storybook CLI
 * 
 * Command-line interface for converting Figma designs to Storybook components
 */

import { Command } from 'commander';
import { convertCommand } from './commands/convert.js';
import { initCommand } from './commands/init.js';
import { watchCommand } from './commands/watch.js';
import { batchCommand } from './commands/batch.js';
import { configCommand } from './commands/config.js';
import { doctorCommand } from './commands/doctor.js';
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
program.addCommand(watchCommand);
program.addCommand(batchCommand);
program.addCommand(configCommand);
program.addCommand(doctorCommand);

program.parse();
