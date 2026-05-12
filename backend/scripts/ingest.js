#!/usr/bin/env node
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { embed } = require('../rag/embed');
const store = require('../rag/store');
const { CHUNK_SIZE, CHUNK_OVERLAP, BATCH_SIZE } = require('../rag/config');
const { chunkText } = require('../rag/chunk');
const { makePointId } = require('../rag/pointId');
const { loadKnowledgeFiles } = require('../rag/knowledgeLoader');
const { validateKnowledgeItems } = require('../rag/knowledgeValidator');

const args = process.argv.slice(2);
const MODE = args.includes('--dry-run')
  ? 'dry-run'
  : args.includes('--recreate')
    ? 'recreate'
    : 'upsert-only';

function buildPoint(item, chunk, chunkIndex, totalChunks, vector) {
  return {
    id: makePointId({
      destination: item.destination,
      city: item.city,
      category: item.category,
      title: item.title,
      chunkIndex,
      text: chunk,
    }),
    vector,
    payload: {
      destination: item.destination,
      city: item.city,
      category: item.category,
      title: item.title ?? null,
      lat: item.lat ?? null,
      lng: item.lng ?? null,
      price_range: item.price_range ?? null,
      tags: item.tags ?? [],
      hours: item.hours ?? null,
      source: item.source ?? null,
      source_file: item.source_file ?? null,
      updated_at: item.updated_at ?? null,
      text: chunk,
      chunk_index: chunkIndex,
      total_chunks: totalChunks,
    },
  };
}

async function createPoints(items, totalChunks) {
  const points = [];
  const failed = [];
  let processed = 0;

  for (const item of items) {
    const chunks = chunkText(item.text);

    for (let i = 0; i < chunks.length; i++) {
      try {
        const vector = await embed(chunks[i]);
        points.push(buildPoint(item, chunks[i], i, chunks.length, vector));
        processed++;
        if (processed % 10 === 0) process.stdout.write(`  ${processed}/${totalChunks}\r`);
      } catch (err) {
        failed.push({ item: `${item.city}/${item.category}`, chunk: i, error: err.message });
      }
    }
  }

  return { points, failed };
}

async function upsertInBatches(points) {
  for (let i = 0; i < points.length; i += BATCH_SIZE) {
    const batch = points.slice(i, i + BATCH_SIZE);
    await store.upsertBatch(batch);
    process.stdout.write(`  ${Math.min(i + BATCH_SIZE, points.length)}/${points.length}\r`);
  }
}

async function main() {
  console.log(`\n[ingest] mode: ${MODE}\n`);

  console.log('Loading knowledge files...');
  const items = loadKnowledgeFiles();
  console.log(`  Total: ${items.length} items\n`);

  console.log('Validating knowledge items...');
  const validationErrors = validateKnowledgeItems(items);
  if (validationErrors.length) {
    console.error('Validation failed:');
    validationErrors.forEach(error => console.error(`  ${error}`));
    process.exit(1);
  }
  console.log('  All items are valid\n');

  const totalChunks = items.reduce((sum, item) => sum + chunkText(item.text).length, 0);
  console.log(`Chunk preview: ${totalChunks} points will be created (size ${CHUNK_SIZE}, overlap ${CHUNK_OVERLAP})\n`);

  if (MODE === 'dry-run') {
    console.log('Dry run complete. No embedding or Qdrant calls were made.\n');
    return;
  }

  console.log('Preparing Qdrant collection...');
  await store.ensureCollection({ recreate: MODE === 'recreate' });
  console.log(`  Collection ready (${MODE})\n`);

  console.log('Creating embeddings...');
  const { points, failed } = await createPoints(items, totalChunks);
  console.log(`\n  Embeddings complete: ${points.length} succeeded, ${failed.length} failed\n`);

  console.log(`Upserting to Qdrant... (batch size: ${BATCH_SIZE})`);
  await upsertInBatches(points);
  console.log('\n  Upsert complete\n');

  console.log('-'.repeat(40));
  console.log(`Complete: ${points.length} points stored`);
  if (failed.length) {
    console.warn(`실패: ${failed.length}건`);
    failed.forEach(item => console.warn(`  ${item.item} 청크[${item.chunk}]: ${item.error}`));
  }
  console.log('-'.repeat(40));
}

main().catch(err => {
  console.error('\n[ingest] error:', err.message);
  process.exit(1);
});
