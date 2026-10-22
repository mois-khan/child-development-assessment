import { primeItemBank, liveItemsFor } from '../lib/item-bank';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
  await primeItemBank();
  console.log('s3 vision items:', liveItemsFor('s3', 'vision', 10));
  console.log('s4 vision items:', liveItemsFor('s4', 'vision', 10));
}

run().catch(console.error);
