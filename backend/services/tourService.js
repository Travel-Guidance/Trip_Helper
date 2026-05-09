const { requireEnv } = require('../utils/env')
const { createError } = require('../utils/errors')

const PHOTO_CACHE_TTL = 60 * 60 * 1000;
const photoUriCache = new Map();

const PAID_TYPES = new Set([
  'amusement_park',
  'aquarium',
  'art_gallery',
  'museum',
  'stadium',
  'tourist_attraction',
  'zoo',
  'performing_arts_theater',
]);

const FREE_TYPES = new Set([
  'park',
  'natural_feature',
  'church',
  'hindu_temple',
  'mosque',
  'synagogue',
  'place_of_worship',
]);

function inferTourHints(place) {
  const types = place.types || [];
  const hasPaidType = types.some(type => PAID_TYPES.has(type));
  const hasFreeType = types.some(type => FREE_TYPES.has(type));
  const reviewCount = Number(place.userRatingCount || 0);

  return {
    reservationLevel: hasPaidType || place.websiteUri || reviewCount > 3000 ? '예약 권장' : '예약 불필요 가능',
    costLevel: hasPaidType && !hasFreeType ? '입장료 가능성 있음' : '무료 가능성 높음',
  };
}

function normalizeReviews(reviews) {
  return (reviews || [])
    .map(review => ({
      authorName: review.authorAttribution?.displayName || 'Google 사용자',
      authorUri: review.authorAttribution?.uri || '',
      authorPhotoUri: review.authorAttribution?.photoUri || '',
      rating: review.rating || null,
      text: review.text?.text || review.originalText?.text || '',
      relativeTime: review.relativePublishTimeDescription || '',
      publishTime: review.publishTime || '',
      googleMapsUri: review.googleMapsUri || '',
    }))
    .filter(review => review.text || review.rating)
    .slice(0, 10);
}

function normalizePlace(place) {
  const hints = inferTourHints(place);
  const photoNames = (place.photos || []).map(photo => photo.name).filter(Boolean).slice(0, 5);
  return {
    id: place.id,
    name: place.displayName?.text || '',
    address: place.formattedAddress || '',
    rating: place.rating || null,
    reviewCount: place.userRatingCount || 0,
    types: place.types || [],
    openNow: place.regularOpeningHours?.openNow ?? null,
    openingHours: place.regularOpeningHours?.weekdayDescriptions || [],
    editorialSummary: place.editorialSummary?.text || '',
    phoneNumber: place.internationalPhoneNumber || place.nationalPhoneNumber || '',
    websiteUri: place.websiteUri || '',
    googleMapsUri: place.googleMapsUri || '',
    coordinates: place.location ? { latitude: place.location.latitude, longitude: place.location.longitude } : null,
    photoUrl: photoNames[0] ? `/api/tours/photo?name=${encodeURIComponent(photoNames[0])}` : '',
    photos: photoNames.map(name => `/api/tours/photo?name=${encodeURIComponent(name)}`),
    reservationLevel: hints.reservationLevel,
    costLevel: hints.costLevel,
    reviews: normalizeReviews(place.reviews),
  };
}

async function searchTours({ query = 'Tokyo tourist attractions', pageToken = '' }) {
  const key = requireEnv('GOOGLE_MAPS_API_KEY')
  const cleanQuery = String(query || 'Tokyo tourist attractions').trim();
  const cleanPageToken = String(pageToken || '').trim();
  const textQuery = /tour|attraction|landmark|museum|aquarium/i.test(cleanQuery)
    ? cleanQuery
    : `${cleanQuery} tourist attractions`;

  const body = {
    textQuery,
    languageCode: 'ko',
    pageSize: 12,
  };

  if (cleanPageToken) body.pageToken = cleanPageToken;

  const response = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'nextPageToken',
        'places.id',
        'places.displayName',
        'places.formattedAddress',
        'places.rating',
        'places.userRatingCount',
        'places.types',
        'places.photos',
        'places.websiteUri',
        'places.googleMapsUri',
        'places.location',
        'places.regularOpeningHours',
        'places.editorialSummary',
        'places.internationalPhoneNumber',
        'places.nationalPhoneNumber',
      ].join(','),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Places ${response.status}: ${text}`);
  }

  const json = await response.json();
  const tours = (json.places || []).map(normalizePlace);
  return { query: cleanQuery, tours, nextPageToken: json.nextPageToken || null };
}

async function getTourDetail(placeId) {
  const key = requireEnv('GOOGLE_MAPS_API_KEY')
  const cleanPlaceId = String(placeId || '').trim()
  if (!cleanPlaceId) throw createError('placeId가 필요합니다.', 400)

  const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(cleanPlaceId)}?languageCode=ko`, {
    headers: {
      'X-Goog-Api-Key': key,
      'X-Goog-FieldMask': [
        'id',
        'displayName',
        'formattedAddress',
        'rating',
        'userRatingCount',
        'types',
        'photos',
        'websiteUri',
        'googleMapsUri',
        'location',
        'regularOpeningHours',
        'editorialSummary',
        'reviews',
        'internationalPhoneNumber',
        'nationalPhoneNumber',
      ].join(','),
    },
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Google Place Details ${response.status}: ${text}`);
  }

  const place = await response.json();
  return normalizePlace(place);
}

async function getTourPhotoUri(name) {
  const key = requireEnv('GOOGLE_MAPS_API_KEY')
  const cleanName = String(name || '').trim()
  if (!cleanName.startsWith('places/')) throw createError('사진 리소스 이름이 필요합니다.', 400)

  const cached = photoUriCache.get(cleanName);
  if (cached && cached.expiresAt > Date.now()) return cached.uri;
  photoUriCache.delete(cleanName);

  const url = `https://places.googleapis.com/v1/${encodeURI(cleanName)}/media?maxWidthPx=800&skipHttpRedirect=true&key=${encodeURIComponent(key)}`;
  const response = await fetch(url);
  if (!response.ok) {
    const text = await response.text();
    throw createError(`Google Place Photo ${response.status}: ${text}`, response.status);
  }

  const json = await response.json();
  if (json.photoUri) {
    photoUriCache.set(cleanName, {
      uri: json.photoUri,
      expiresAt: Date.now() + PHOTO_CACHE_TTL,
    });
  }
  return json.photoUri;
}

module.exports = { searchTours, getTourDetail, getTourPhotoUri };
