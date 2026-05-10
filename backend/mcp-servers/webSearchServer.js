'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

const server = new McpServer({
  name: 'web-search-server',
  version: '1.0.0',
});

server.tool(
  'searchRecentInfo',
  'Search current travel information with Tavily. Falls back to coarse local guidance when no API key is configured.',
  {
    query: z.string().describe('Search query, for example "Sydney Opera House tour price".'),
    country: z.string().optional().describe('Country context. Defaults to Australia.'),
  },
  async ({ query, country }) => {
    const resolvedCountry = country || 'the destination country';
    if (!TAVILY_API_KEY) {
      return { content: [{ type: 'text', text: JSON.stringify(simulateFallback(query)) }] };
    }

    try {
      const response = await fetch('https://api.tavily.com/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          api_key: TAVILY_API_KEY,
          query: `${query} ${resolvedCountry} travel guide`,
          search_depth: 'basic',
          max_results: 5,
          include_answer: true,
          include_raw_content: false,
        }),
      });

      if (!response.ok) throw new Error(`Tavily ${response.status}`);
      const data = await response.json();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            found: true,
            answer: data.answer || null,
            results: (data.results || []).map(result => ({
              title: result.title,
              url: result.url,
              content: result.content?.slice(0, 300),
            })),
          }),
        }],
      };
    } catch {
      return { content: [{ type: 'text', text: JSON.stringify(simulateFallback(query)) }] };
    }
  }
);

function simulateFallback(query) {
  const lower = String(query || '').toLowerCase();
  const snippets = [
    {
      test: ['opera', '오페라'],
      answer: 'Sydney Opera House guided tours commonly run during the day. Check the official site before booking because schedules and prices change.',
    },
    {
      test: ['reef', '리프', 'barrier'],
      answer: 'Great Barrier Reef day tours vary by season and weather. Confirm reef conditions and operator notices close to the travel date.',
    },
    {
      test: ['uluru', '울룰루'],
      answer: 'Uluru-Kata Tjuta National Park requires a park pass. Sunrise and sunset tours are popular and should be booked early.',
    },
    {
      test: ['coffee', '커피', 'melbourne'],
      answer: 'Melbourne specialty coffee spots are concentrated around the CBD, Fitzroy, Collingwood, and Carlton.',
    },
  ];

  const matched = snippets.find(item => item.test.some(keyword => lower.includes(keyword)));
  const answer = matched?.answer || 'Current information could not be verified. Check official operator pages before final booking.';

  return {
    found: true,
    answer,
    results: [{ title: `${query} travel information`, content: answer }],
    simulated: true,
  };
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(err => {
  process.stderr.write(`[webSearchServer] failed to start: ${err.message}\n`);
  process.exit(1);
});
