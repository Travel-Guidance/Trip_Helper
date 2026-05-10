'use strict';

const toolDefinitions = [
  {
    name: 'searchKnowledgeBase',
    description: 'Search the travel knowledge base for destination, food, activity, transport, and local tip information.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Search query, such as "Sydney seafood restaurants" or "Cairns snorkeling tour".',
        },
        city: {
          type: 'STRING',
          description: 'Optional city name to filter results (e.g. Sydney, Tokyo, Paris). Only useful when the knowledge base contains data for that city.',
        },
        category: {
          type: 'STRING',
          description: 'Optional category filter: landmark, nature, food, activity, transport, culture, shopping, accommodation, tips, itinerary, safety.',
        },
        lat: {
          type: 'NUMBER',
          description: 'Latitude of the day\'s accommodation. Pass this to restrict results to nearby places.',
        },
        lon: {
          type: 'NUMBER',
          description: 'Longitude of the day\'s accommodation. Pass this to restrict results to nearby places.',
        },
        radiusKm: {
          type: 'NUMBER',
          description: 'Search radius in km from the accommodation (default 30). Increase for rural destinations.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'searchRecentInfo',
    description: 'Search the web for current travel information such as prices, opening status, events, and seasonal notices.',
    parameters: {
      type: 'OBJECT',
      properties: {
        query: {
          type: 'STRING',
          description: 'Search query, such as "Sydney Opera House tour price" or "Great Barrier Reef current conditions".',
        },
        country: {
          type: 'STRING',
          description: 'Optional country context. Defaults to Australia.',
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'calculateRoute',
    description: 'Calculate travel distance and duration between two places for itinerary route planning.',
    parameters: {
      type: 'OBJECT',
      properties: {
        origin: {
          type: 'STRING',
          description: 'Starting point, such as "Sydney Opera House".',
        },
        destination: {
          type: 'STRING',
          description: 'Destination point, such as "Bondi Beach".',
        },
        mode: {
          type: 'STRING',
          description: 'Travel mode: driving, walking, or transit. Defaults to transit.',
        },
      },
      required: ['origin', 'destination'],
    },
  },
];

module.exports = { toolDefinitions };
