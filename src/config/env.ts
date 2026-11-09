import dotenv from 'dotenv';
import path from 'path';

// Load .env from the project root into process.env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing ${name} in .env`);
  return value;
}

export const env = {
  uiBaseUrl: process.env.UI_BASE_URL || 'https://www.saucedemo.com',
  apiBaseUrl: process.env.API_BASE_URL || 'https://restful-booker.herokuapp.com',
  sauceUser: required('SAUCE_USER'),
  saucePassword: required('SAUCE_PASSWORD'),
  bookerUser: required('BOOKER_USER'),
  bookerPassword: required('BOOKER_PASSWORD'),
  databaseUrl: process.env.DATABASE_URL || '',
};

// Other practice sites used by element tests
export const SITES = {
  theInternet: 'https://the-internet.herokuapp.com',
  practice: 'https://testautomationpractice.blogspot.com',
  dummyJson: 'https://dummyjson.com',
  jsonPlaceholder: 'https://jsonplaceholder.typicode.com',
};