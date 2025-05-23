// for nestjs testing
import 'reflect-metadata';
import { config } from 'dotenv';

config({ path: '../.env.test' });
console.log('Environment variables loaded from .env.test file.');