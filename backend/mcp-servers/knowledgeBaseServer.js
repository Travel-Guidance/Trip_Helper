'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');
const { searchKnowledge } = require('../rag/retrieval');

const CITY_ALIASES = {
  시드니: '시드니',
  sydney: '시드니',
  멜버른: '멜버른',
  melbourne: '멜버른',
  골드코스트: '골드코스트',
  'gold coast': '골드코스트',
  케언즈: '케언즈',
  cairns: '케언즈',
  브리즈번: '브리즈번',
  brisbane: '브리즈번',
  퍼스: '퍼스',
  perth: '퍼스',
  애들레이드: '애들레이드',
  adelaide: '애들레이드',
  울루루: '울루루',
  uluru: '울루루',
};

function resolveCityFilter(city) {
  return CITY_ALIASES[String(city || '').trim().toLowerCase()] || city || null;
}

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
      const cityFilter = city ? resolveCityFilter(city) || city : null;
      const results = await searchKnowledge(query, {
        city:     cityFilter,
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
            city: cityFilter,
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
