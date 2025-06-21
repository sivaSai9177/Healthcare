#!/usr/bin/env bun
/**
 * CLI Utilities
 * 
 * Helper functions for command-line scripts:
 * - Argument parsing
 * - User prompts
 * - Confirmation dialogs
 * - Progress indicators
 */

import { ValidationError } from './error-handler';
import { logger } from './logger';
import { COLORS, EMOJI } from '../config/constants';
import readline from 'readline';

interface ParsedArgs {
  _: string[]; // Positional arguments
  [key: string]: any; // Named arguments
}

/**
 * Parse command-line arguments
 */
export function parseArgs(argv: string[] = process.argv.slice(2)): ParsedArgs {
  const args: ParsedArgs = { _: [] };
  
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    
    if (arg.startsWith('--')) {
      // Long option: --key=value or --key value
      const [key, value] = arg.slice(2).split('=');
      
      if (value !== undefined) {
        args[key] = parseValue(value);
      } else if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
        args[key] = parseValue(argv[++i]);
      } else {
        args[key] = true; // Boolean flag
      }
    } else if (arg.startsWith('-') && arg.length > 1) {
      // Short option: -k value or multiple flags -abc
      const flags = arg.slice(1);
      
      if (flags.length === 1) {
        // Single flag
        if (i + 1 < argv.length && !argv[i + 1].startsWith('-')) {
          args[flags] = parseValue(argv[++i]);
        } else {
          args[flags] = true;
        }
      } else {
        // Multiple flags
        for (const flag of flags) {
          args[flag] = true;
        }
      }
    } else {
      // Positional argument
      args._.push(arg);
    }
  }
  
  return args;
}

/**
 * Parse value to appropriate type
 */
function parseValue(value: string): any {
  // Boolean
  if (value === 'true') return true;
  if (value === 'false') return false;
  
  // Number
  const num = Number(value);
  if (!isNaN(num)) return num;
  
  // Array (comma-separated)
  if (value.includes(',')) {
    return value.split(',').map(v => parseValue(v.trim()));
  }
  
  // String
  return value;
}

/**
 * Validate required arguments
 */
export function requireArgs(
  args: ParsedArgs,
  required: string[],
  usage?: string
): void {
  const missing = required.filter(arg => !(arg in args));
  
  if (missing.length > 0) {
    logger.error(`Missing required arguments: ${missing.join(', ')}`);
    
    if (usage) {

    }
    
    throw new ValidationError('Missing required arguments');
  }
}

/**
 * Create readline interface
 */
function createInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

/**
 * Prompt user for input
 */
export async function prompt(
  message: string,
  defaultValue?: string
): Promise<string> {
  const rl = createInterface();
  
  return new Promise((resolve) => {
    const question = defaultValue 
      ? `${message} ${COLORS.dim}(${defaultValue})${COLORS.reset}: `
      : `${message}: `;
    
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim() || defaultValue || '');
    });
  });
}

/**
 * Prompt for password (hidden input)
 */
export async function promptPassword(
  message: string = 'Password'
): Promise<string> {
  const rl = createInterface();
  
  // Disable echo
  if (process.stdin.isTTY) {
    process.stdin.setRawMode(true);
  }
  
  return new Promise((resolve) => {
    let password = '';
    
    process.stdout.write(`${message}: `);
    
    process.stdin.on('data', (char) => {
      const key = char.toString();
      
      switch (key) {
        case '\n':
        case '\r':
        case '\u0004': // Ctrl-D
          process.stdin.removeAllListeners('data');
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdout.write('\n');
          rl.close();
          resolve(password);
          break;
        case '\u0003': // Ctrl-C
          process.stdin.removeAllListeners('data');
          if (process.stdin.isTTY) {
            process.stdin.setRawMode(false);
          }
          process.stdout.write('\n');
          rl.close();
          process.exit(0);
          break;
        case '\u007f': // Backspace
          if (password.length > 0) {
            password = password.slice(0, -1);
            process.stdout.write('\b \b');
          }
          break;
        default:
          password += key;
          process.stdout.write('*');
      }
    });
  });
}

/**
 * Confirm action with user
 */
export async function confirm(
  message: string,
  defaultValue: boolean = false
): Promise<boolean> {
  const hint = defaultValue ? 'Y/n' : 'y/N';
  const answer = await prompt(`${message} ${COLORS.dim}(${hint})${COLORS.reset}`);
  
  if (!answer) return defaultValue;
  
  return answer.toLowerCase().startsWith('y');
}

/**
 * Select from options
 */
export async function select<T extends string>(
  message: string,
  options: T[],
  defaultIndex: number = 0
): Promise<T> {

  options.forEach((option, index) => {
    const prefix = index === defaultIndex ? `${EMOJI.arrow} ` : '  ';

  });
  
  const answer = await prompt('\nSelect an option', String(defaultIndex + 1));
  const index = parseInt(answer) - 1;
  
  if (index < 0 || index >= options.length) {
    throw new ValidationError('Invalid selection');
  }
  
  return options[index];
}

/**
 * Multi-select from options
 */
export async function multiSelect<T extends string>(
  message: string,
  options: T[],
  defaultSelected: number[] = []
): Promise<T[]> {

  options.forEach((option, index) => {
    const isSelected = defaultSelected.includes(index);
    const prefix = isSelected ? `${EMOJI.check} ` : '  ';

  });
  
  const answer = await prompt(
    '\nSelect options',
    defaultSelected.map(i => i + 1).join(',')
  );
  
  const indices = answer
    .split(',')
    .map(s => parseInt(s.trim()) - 1)
    .filter(i => i >= 0 && i < options.length);
  
  return indices.map(i => options[i]);
}

/**
 * Show spinner while executing async function
 */
export async function withSpinner<T>(
  message: string,
  fn: () => Promise<T>
): Promise<T> {
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let i = 0;
  
  const interval = setInterval(() => {
    process.stdout.write(`\r${COLORS.cyan}${frames[i]} ${message}${COLORS.reset}`);
    i = (i + 1) % frames.length;
  }, 80);
  
  try {
    const result = await fn();
    clearInterval(interval);
    process.stdout.write(`\r${EMOJI.success} ${message}\n`);
    return result;
  } catch (error) {
    clearInterval(interval);
    process.stdout.write(`\r${EMOJI.error} ${message}\n`);
    throw error;
  }
}

/**
 * Format duration in human-readable format
 */
export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ${Math.floor((ms % 60000) / 1000)}s`;
  return `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m`;
}

/**
 * Measure execution time
 */
export async function measureTime<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  
  try {
    const result = await fn();
    const duration = Date.now() - start;
    logger.debug(`${name} completed in ${formatDuration(duration)}`);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.debug(`${name} failed after ${formatDuration(duration)}`);
    throw error;
  }
}

/**
 * Print help text
 */
export function printHelp(sections: {
  usage?: string;
  description?: string;
  options?: {
    flag: string;
    description: string;
    default?: any;
  }[];
  examples?: string[];
}) {
  if (sections.usage) {

  }
  
  if (sections.description) {

  }
  
  if (sections.options && sections.options.length > 0) {

    const maxFlagLength = Math.max(...sections.options.map(o => o.flag.length));
    
    sections.options.forEach(option => {
      const flag = option.flag.padEnd(maxFlagLength + 2);
      let line = `  ${flag} ${option.description}`;
      
      if (option.default !== undefined) {
        line += ` ${COLORS.dim}(default: ${option.default})${COLORS.reset}`;
      }

    });
  }
  
  if (sections.examples && sections.examples.length > 0) {

    sections.examples.forEach(example => {

    });
  }
}