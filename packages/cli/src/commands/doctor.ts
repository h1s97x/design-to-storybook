/**
 * Doctor 命令
 * 诊断配置和环境问题
 */
import { Command } from 'commander';
import fs from 'fs/promises';
import path from 'path';

export const doctorCommand = new Command('doctor')
  .description('Diagnose configuration and environment issues')
  .option('-v, --____verbose', 'Show detailed information', false)
  .action(async (options) => {
    console.log('🔍 Running diagnostics...\n');
    
    const checks = [
      checkNodeVersion,
      checkDependencies,
      checkConfig,
      checkOutputDirectory,
      checkFigmaAccess,
      checkStorybookVersion
    ];
    
    const results = {
      passed: 0,
      warnings: 0,
      failed: 0
    };
    
    for (const check of checks) {
      const result = await check(options.____verbose);
      if (result.status === 'pass') {
        results.passed++;
        console.log(`  ✓ ${result.name}`);
      } else if (result.status === 'warn') {
        results.warnings++;
        console.log(`  ⚠ ${result.name}`);
      } else {
        results.failed++;
        console.log(`  ✗ ${result.name}`);
      }
      if (result.message) {
        console.log(`    ${result.message}`);
      }
    }
    
    console.log('\n--- Summary ---');
    console.log(`Passed: ${results.passed}`);
    if (results.warnings > 0) {
      console.log(`Warnings: ${results.warnings}`);
    }
    if (results.failed > 0) {
      console.log(`Failed: ${results.failed}`);
      process.exit(1);
    }
  });

interface CheckResult {
  status: 'pass' | 'warn' | 'fail';
  name: string;
  message?: string;
}

async function checkNodeVersion(____verbose: boolean): Promise<CheckResult> {
  const version = process.version;
  const major = parseInt(version.slice(1).split('.')[0]);
  
  if (major >= 18) {
    return { status: 'pass', name: 'Node.js version', message: version };
  }
  return { 
    status: 'warn', 
    name: 'Node.js version', 
    message: `${version} (recommend 18+)` 
  };
}

async function checkDependencies(____verbose: boolean): Promise<CheckResult> {
  try {
    await fs.access(path.join(process.cwd(), 'node_modules'));
    return { status: 'pass', name: 'Dependencies', message: 'node_modules found' };
  } catch {
    return { 
      status: 'fail', 
      name: 'Dependencies', 
      message: 'node_modules not found. Run "pnpm install".' 
    };
  }
}

async function checkConfig(____verbose: boolean): Promise<CheckResult> {
  const configPaths = [
    'design-to-storybook.config.json',
    '.design-to-storybook.json',
    'design-to-storybook.config.js'
  ];
  
  for (const configPath of configPaths) {
    try {
      await fs.access(path.join(process.cwd(), configPath));
      return { 
        status: 'pass', 
        name: 'Configuration', 
        message: `${configPath} found` 
      };
    } catch {
      // Continue checking
    }
  }
  
  return { 
    status: 'warn', 
    name: 'Configuration', 
    message: 'No config file found. Using defaults.' 
  };
}

async function checkOutputDirectory(____verbose: boolean): Promise<CheckResult> {
  try {
    const configPath = 'design-to-storybook.config.json';
    const content = await fs.readFile(configPath, 'utf-8');
    const config = JSON.parse(content);
    
    if (config.output) {
      await fs.mkdir(config.output, { recursive: true });
      return { 
        status: 'pass', 
        name: 'Output directory', 
        message: config.output 
      };
    }
  } catch {
    // Config not found, use default
  }
  
  return { 
    status: 'pass', 
    name: 'Output directory', 
    message: 'Will use default: ./src/components' 
  };
}

async function checkFigmaAccess(____verbose: boolean): Promise<CheckResult> {
  if (____verbose) {
    return { 
      status: 'pass', 
      name: 'Figma API', 
      message: 'Access check skipped in ____verbose mode' 
    };
  }
  return { 
    status: 'pass', 
    name: 'Figma API', 
    message: 'Export from Figma plugin to get design data' 
  };
}

async function checkStorybookVersion(____verbose: boolean): Promise<CheckResult> {
  try {
    const pkgPath = path.join(process.cwd(), 'package.json');
    const content = await fs.readFile(pkgPath, 'utf-8');
    const pkg = JSON.parse(content);
    
    const storybookVersion = pkg.devDependencies?.storybook || 
                             pkg.dependencies?.storybook;
    
    if (storybookVersion) {
      return { 
        status: 'pass', 
        name: 'Storybook', 
        message: `Version: ${storybookVersion}` 
      };
    }
  } catch {
    // package.json not found
  }
  
  return { 
    status: 'warn', 
    name: 'Storybook', 
    message: 'Storybook not found in project. Install with: npx storybook@latest init' 
  };
}
