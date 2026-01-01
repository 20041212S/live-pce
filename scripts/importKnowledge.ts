import 'dotenv/config';
import fs from 'fs';
import readline from 'readline';
import path from 'path';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function importFile(filePath: string) {
  const absolutePath = path.resolve(filePath);
  if (!fs.existsSync(absolutePath)) {
    console.error(`File not found: ${absolutePath}`);
    return;
  }

  const rl = readline.createInterface({
    input: fs.createReadStream(absolutePath),
    crlfDelay: Infinity,
  });

  let count = 0;
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const record = JSON.parse(trimmed);
      const { source, type, name, text } = record;
      if (!source || !type || !name || !text) {
        console.warn('Skipping invalid line (missing fields):', record);
        continue;
      }

      await prisma.knowledge.upsert({
        where: {
          // Uniqueness by source + name + type to avoid duplicates
          // You can adjust this to your needs (add a unique constraint in schema if desired)
          id: `${source}-${type}-${name}`.toLowerCase().replace(/\s+/g, '-'),
        },
        update: {
          text,
        },
        create: {
          id: `${source}-${type}-${name}`.toLowerCase().replace(/\s+/g, '-'),
          source,
          type,
          name,
          text,
        },
      });
      count += 1;
    } catch (err) {
      console.error('Failed to parse line:', line, err);
    }
  }

  console.log(`Imported ${count} records from ${filePath}`);
}

async function main() {
  const files = process.argv.slice(2);
  if (files.length === 0) {
    console.error('Usage: tsx scripts/importKnowledge.ts <file1.jsonl> <file2.jsonl> ...');
    process.exit(1);
  }

  for (const file of files) {
    await importFile(file);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

