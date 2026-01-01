/**
 * Convert chat-style JSONL ({"messages":[{role:"user", content:"..."},{role:"assistant", ...}]})
 * into Knowledge records and upsert into the database.
 *
 * Usage:
 *   tsx scripts/importChatLogsAsKnowledge.ts --source admissions --type faq /path/to/file.jsonl [...]
 *
 * Notes:
 * - source and type can be passed via flags; defaults are derived from filename if omitted.
 * - id is synthesized from source-type-name to avoid duplicates on reruns.
 */
import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import readline from 'readline';
import minimist from 'minimist';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

type ChatLine = {
  messages?: { role: string; content: string }[];
};

async function importFile(filePath: string, defaultSource?: string, defaultType?: string) {
  const abs = path.resolve(filePath);
  if (!fs.existsSync(abs)) {
    console.error(`File not found: ${abs}`);
    return;
  }

  const inferredSource = defaultSource || path.basename(abs).split('.')[0];
  const inferredType = defaultType || 'faq';

  const rl = readline.createInterface({
    input: fs.createReadStream(abs),
    crlfDelay: Infinity,
  });

  let count = 0;
  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    try {
      const parsed: ChatLine = JSON.parse(trimmed);
      const userMsg = parsed.messages?.find((m) => m.role === 'user')?.content || 'untitled';
      const assistantMsg = parsed.messages?.find((m) => m.role === 'assistant')?.content || '';
      const name = userMsg;
      const text = assistantMsg;

      if (!text) {
        console.warn('Skipping line with no assistant content:', line);
        continue;
      }

      const id = `${inferredSource}-${inferredType}-${name}`
        .toLowerCase()
        .replace(/\s+/g, '-')
        .slice(0, 190); // keep id length reasonable

      await prisma.knowledge.upsert({
        where: { id },
        update: { text, source: inferredSource, type: inferredType, name },
        create: {
          id,
          source: inferredSource,
          type: inferredType,
          name,
          text,
        },
      });
      count += 1;
    } catch (err) {
      console.error('Failed to parse line:', line, err);
    }
  }

  console.log(`Imported ${count} records from ${abs} (source=${inferredSource}, type=${inferredType})`);
}

async function main() {
  const args = minimist(process.argv.slice(2), {
    string: ['source', 'type'],
    alias: { s: 'source', t: 'type' },
  });

  const files = args._;
  if (!files.length) {
    console.error('Usage: tsx scripts/importChatLogsAsKnowledge.ts --source admissions --type faq <file1.jsonl> <file2.jsonl> ...');
    process.exit(1);
  }

  for (const file of files) {
    await importFile(file, args.source, args.type);
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

