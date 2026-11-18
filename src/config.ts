import { loadEnvFile } from 'node:process';
import fs from 'node:fs';
// utils


loadEnvFile('.env');

export const {
  DB_HOST,
  DB_PORT,
  DB_USER,
  DB_PASSWORD,
  DB_NAME,
  DB_MIGRATION_FOLDER,
} = process.env

export const DB_URL = `postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}`

export const NODE_ENV = process.env.NODE_ENV as "dev" | "prod"

export const {VALKEY_HOST, VALKEY_PASSWORD, VALKEY_PORT} = process.env

export let ACCESS_JWT_PRIVATE_KEY: string = '';
export let ACCESS_JWT_PUBLIC_KEY: string = '';

if (process.env.ACCESS_JWT_PRIVATE_PATH && process.env.ACCESS_JWT_PUBLIC_PATH) {
  ACCESS_JWT_PRIVATE_KEY = fs.readFileSync(process.env.ACCESS_JWT_PRIVATE_PATH!).toString().trim();
  ACCESS_JWT_PUBLIC_KEY = fs.readFileSync(process.env.ACCESS_JWT_PUBLIC_PATH!).toString().trim();
} else {
  console.error('Access JWT Private key is not defined');
  console.error('Access JWT Public key is not defined');
}

export let REFRESH_JWT_PRIVATE_KEY: string = '';
export let REFRESH_JWT_PUBLIC_KEY: string = '';

if (process.env.REFRESH_JWT_PRIVATE_PATH && process.env.REFRESH_JWT_PUBLIC_PATH) {
  REFRESH_JWT_PRIVATE_KEY = fs.readFileSync(process.env.REFRESH_JWT_PRIVATE_PATH!).toString().trim();
  REFRESH_JWT_PUBLIC_KEY = fs.readFileSync(process.env.REFRESH_JWT_PUBLIC_PATH!).toString().trim();
} else {
  console.error('Refresh JWT Private key is not defined');
  console.error('Refresh JWT Public key is not defined');
}

