'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { searchKnowledge } = require('../rag/retrieval');

const server = new McpServer({
  name: 'knowledge-base-server',
  version: '1.0.0',
});

server.tool(
  'searchKnowledgeBase',
  'Search the Qdrant travel knowledge base by semantic query, city, and category.',
  {
    query:     z.string().describe('Search query, for example "Sydney seafood restaurants".'),
    city:      z.string().optional().describe('Optional city filter, for example "시드니" or "Sydney".'),
    category:  z.string().optional().describe('Optional category filter, for example "food" or "activity".'),
    lat:       z.number().optional().describe('Latitude of the day\'s accommodation for proximity filtering.'),
    lon:       z.number().optional().describe('Longitude of the day\'s accommodation for proximity filtering.'),
    radiusKm:  z.number().optional().describe('Search radius in km around the accommodation (default 30).'),
  },
  async ({ query, city, category, lat, lon, radiusKm }) => {
    try {
      const results = await searchKnowledge(query, {
        city:     city || null,
        category: category || null,
        limit:    5,
        lat:      lat ?? null,
        lon:      lon ?? null,
        radiusKm: radiusKm ?? undefined,
      });

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            found: results.length > 0,
            results,
            message: results.length ? undefined : 'No related knowledge was found.',
          }),
        }],
      };
    } catch (err) {
      return {
        content: [{ type: 'text', text: JSON.stringify({ found: false, error: err.message }) }],
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  process.stderr.write(`[knowledgeBaseServer] failed to start: ${err.message}\n`);
  process.exit(1);
});
