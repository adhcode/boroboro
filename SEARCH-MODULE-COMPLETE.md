# Search Module - Complete ✅

## Overview
Advanced search functionality with demand logging for analytics. Tracks searches with low results to identify market gaps.

## Endpoints

### 1. Search Listings
```
GET /api/v1/search/listings
```
**Auth**: Optional (for tracking)

**Query Parameters**:
- `query` (string, optional): Text search on title/description
- `category` (string, optional): Filter by category
- `location` (string, optional): Filter by location (case-insensitive)
- `minPrice` (number, optional): Minimum price per day
- `maxPrice` (number, optional): Maximum price per day
- `startDate` (ISO date, optional): Check availability from this date
- `endDate` (ISO date, optional): Check availability until this date
- `page` (number, default: 1): Page number
- `limit` (number, default: 20): Items per page
- `sortBy` (string, default: 'createdAt'): Sort field (createdAt, pricePerDay)
- `sortOrder` (string, default: 'desc'): Sort direction (asc, desc)

**Response**:
```json
{
  "data": [
    {
      "id": "listing-id",
      "title": "Camera Equipment",
      "description": "Professional DSLR camera",
      "category": "Electronics",
      "pricePerDay": 50,
      "depositAmount": 500,
      "location": "Lagos",
      "images": ["url1", "url2"],
      "status": "PUBLISHED",
      "owner": {
        "id": "owner-id",
        "firstName": "John",
        "lastName": "Doe"
      },
      "_count": {
        "bookings": 12
      }
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "limit": 20,
    "totalPages": 3,
    "hasMore": true
  }
}
```

### 2. Get Popular Searches
```
GET /api/v1/search/popular?limit=10
```
**Auth**: None

Returns most frequent searches with low results (unfulfilled demand).

**Response**:
```json
[
  {
    "category": "Electronics",
    "location": "Lagos",
    "searchCount": 45
  },
  {
    "category": "Vehicles",
    "location": "Abuja",
    "searchCount": 32
  }
]
```

### 3. Get Demand Insights (Admin)
```
GET /api/v1/search/insights
```
**Auth**: Required (JWT)

Analytics endpoint showing unfulfilled searches grouped by category and location.

**Response**:
```json
{
  "categoryDemand": [
    {
      "category": "Electronics",
      "unfulfilled_searches": 67
    }
  ],
  "locationDemand": [
    {
      "location": "Lagos",
      "unfulfilled_searches": 89
    }
  ]
}
```

## Features

### 1. **Text Search**
- Searches title and description (case-insensitive)
- Uses PostgreSQL `ILIKE` for flexible matching

### 2. **Filters**
- Category: exact match
- Location: partial match (case-insensitive)
- Price range: min/max filtering
- Date range: checks availability blocks

### 3. **Availability Check**
- When `startDate` and `endDate` provided
- Only returns listings with availability blocks covering the date range
- Integrates with availability_blocks table

### 4. **Pagination**
- Configurable page size (default: 20)
- Returns total count and page metadata
- `hasMore` flag for infinite scroll

### 5. **Sorting**
- By creation date (newest/oldest)
- By price (low to high, high to low)

### 6. **Demand Logging**
- Automatically logs searches with < 3 results
- Captures: query text, category, location, result count
- Silent failure (doesn't break search if logging fails)
- Used for market gap analysis

## Business Logic

### Published Listings Only
Only shows listings with `status = PUBLISHED`. Draft, paused, and archived listings are excluded.

### Automatic Demand Tracking
When search results are low (< 3), the system logs:
- What users searched for
- Which category/location had low supply
- How many results were found

This data powers:
- Popular searches endpoint (most frequent low-result queries)
- Demand insights (unfulfilled demand by category/location)

### Use Cases for Demand Data
1. **Supply recommendations**: Tell users what to list based on demand
2. **Marketing**: Target ads for categories with high unfulfilled demand
3. **Business strategy**: Identify which categories/locations to focus growth on

## Testing

**Unit Tests**: 13/13 passing
- Basic query search
- Category filtering
- Location filtering (case-insensitive)
- Price range filtering
- Date range availability filtering
- Pagination logic
- Sorting (by price, by date)
- Demand logging (low results)
- No logging for sufficient results
- Silent failure on logging errors
- Popular searches aggregation
- Demand insights aggregation

## Example Usage

### Search for electronics in Lagos under $100/day
```bash
curl "http://localhost:3001/api/v1/search/listings?category=Electronics&location=Lagos&maxPrice=100&sortBy=pricePerDay&sortOrder=asc"
```

### Search with availability check
```bash
curl "http://localhost:3001/api/v1/search/listings?startDate=2026-10-01&endDate=2026-10-10&location=Lagos"
```

### Get popular unfulfilled searches
```bash
curl "http://localhost:3001/api/v1/search/popular?limit=20"
```

### Get demand insights (requires auth)
```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3001/api/v1/search/insights"
```

## Architecture Notes

### Why No Full-Text Search Engine?
For v1, PostgreSQL's `ILIKE` is sufficient. Consider Elasticsearch/Algolia if:
- Database grows to 100k+ listings
- Need advanced features (typo tolerance, fuzzy matching, relevance scoring)
- Performance degrades

### Search Query Schema
```prisma
model SearchQuery {
  id          String   @id @default(cuid())
  query       String
  category    String?
  location    String?
  resultCount Int
  createdAt   DateTime @default(now())
}
```

Only stores searches with low results for demand analysis. Not a full search audit log.

## Next Steps

1. ✅ Search module complete
2. 🔜 Payments module (Paystack integration)
3. Consider adding:
   - Autocomplete for locations/categories
   - Search suggestions based on popular queries
   - Saved searches with alerts
   - More sophisticated ranking (by bookings, reviews, etc.)
