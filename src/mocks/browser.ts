import { setupWorker } from 'msw/browser';
import { profileHandlers } from './handlers/profile';

export const worker = setupWorker(...profileHandlers);
