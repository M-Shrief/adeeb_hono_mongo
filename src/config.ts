import { loadEnvFile } from 'node:process';
import fs from 'node:fs';
// utils
import { logger } from './utils/logger.js';


loadEnvFile('.env');

export const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
} = process.env


export const NODE_ENV = process.env.NODE_ENV as "dev" | "prod"

export const {VALKEY_HOST, VALKEY_PASSWORD, VALKEY_PORT} = process.env

export let JWT_PRIVATE_KEY: string = '';
export let JWT_PUBLIC_KEY: string = '';

if (process.env.JWT_PRIVATE_PATH && process.env.JWT_PUBLIC_PATH) {
  JWT_PRIVATE_KEY = fs
    .readFileSync(process.env.JWT_PRIVATE_PATH!)
    .toString()
    .trim();
  JWT_PUBLIC_KEY = fs.readFileSync(process.env.JWT_PUBLIC_PATH!).toString().trim();
} else {
  console.error('JWT Private key is not defined');
  console.error('JWT Public key is not defined');
}
