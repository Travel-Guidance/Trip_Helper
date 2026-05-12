'use strict';

const { Client } = require('@modelcontextprotocol/sdk/client/index.js');
const { StdioClientTransport } = require('@modelcontextprotocol/sdk/client/stdio.js');
const path = require('path');

const SERVER_MAP = {
  searchKnowledgeBase: path.join(__dirname, '../mcp-servers/knowledgeBaseServer.js'),
  searchRecentInfo: path.join(__dirname, '../mcp-servers/webSearchServer.js'),
  calculateRoute: path.join(__dirname, '../mcp-servers/routeServer.js'),
};

const clientCache = new Map();

async function createClient(serverPath) {
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [serverPath],
    env: process.env,
  });

  const client = new Client({ name: 'air-travel-client', version: '1.0.0' });
  await client.connect(transport);

  client.onclose = () => {
    clientCache.delete(serverPath);
    console.warn(`[mcpClient] 서버 연결 종료, 캐시 삭제: ${path.basename(serverPath)}`);
  };

  clientCache.set(serverPath, client);
  return client;
}

async function getClient(serverPath) {
  return clientCache.get(serverPath) || createClient(serverPath);
}

function parseToolResult(result) {
  const text = result.content?.find(item => item.type === 'text')?.text;
  if (!text) return { error: 'MCP server returned no text content' };

  try {
    return JSON.parse(text);
  } catch {
    return { found: true, answer: text };
  }
}

async function callWithFreshClient(serverPath, toolName, args) {
  const client = await createClient(serverPath);
  const result = await client.callTool({ name: toolName, arguments: args });
  return parseToolResult(result);
}

async function callTool(toolName, args) {
  const serverPath = SERVER_MAP[toolName];
  if (!serverPath) throw new Error(`[mcpClient] Unknown tool: ${toolName}`);

  try {
    const client = await getClient(serverPath);
    const result = await client.callTool({ name: toolName, arguments: args });
    return parseToolResult(result);
  } catch (err) {
    clientCache.delete(serverPath);
    console.warn(`[mcpClient] ${toolName} 호출 실패, 한 번 재시도합니다: ${err.message}`);
    return callWithFreshClient(serverPath, toolName, args);
  }
}

async function closeAll() {
  await Promise.all([...clientCache.values()].map(client => client.close().catch(() => {})));
  clientCache.clear();
}

process.on('SIGINT', async () => { await closeAll(); process.exit(0); });
process.on('SIGTERM', async () => { await closeAll(); process.exit(0); });

module.exports = { callTool, closeAll };
