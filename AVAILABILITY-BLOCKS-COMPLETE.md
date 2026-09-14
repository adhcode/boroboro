# Availability Blocks Module Complete ✅

The availability blocks module enables listing owners to manage when their items are available or blocked for rental. This is a critical foundation for the bookings system.

## What Was Built

### 1. Availability Blocks Controller
**Location**: `apps/api/src/availability-blocks/availability-blocks.controller.ts`

**Endpoints**:
- `POST /api/v1/listings/:listingId/availability-blocks` - Create availability block (authenticated, owner only)
- `GET /api/v1/listings/:listingId/availability-blocks` - Get all blocks for a listing (public)
- `POST /api/v1/listings/:listingId/availability-blocks/check` - Check availability for date range (public)
- `GET /api/v1/listings/:listingId/availability-blocks/:id` - Get single block (public)
- `PATCH /api/v1/listings/:listingId/availability-blocks/:id` - Update block (authenticated, owner only)
- `DELETE /api/v1/listings/:listingId/availability-blocks/:id` - Delete block (authenticated, owner only)

### 2. Availability Blocks Service
**Location**: `apps/api/src/availability-blocks/availability-blocks.service.ts`

**Key Features**:
- ✅ Date validation (no past dates, end after start, max 365 days)
- ✅ Overlap detection (prevents conflicting date ranges)
- ✅ Ownership validation (only owners can manage their listing's blocks)
- ✅ Smart availability checking (checks for blocked periods in range)
- ✅ Date range filtering (get blocks within specific dates)
- ✅ Public helper method `isListingAvailable()` for bookings module

### 3. Business Logic & Validation

**Date Validation**:
- Start date cannot be in the past
- End date must be after start date
- Maximum range of 365 days per block
- Automatic overlap detection

**Ownership Security**:
- Only listing owners can create/update/delete blocks
- Public read access for availability checking
- Verified through listing ownership lookup

**Overlap Prevention**:
- Checks for any overlapping date ranges
- Prevents double-booking conflicts
- Works for partial overlaps and full encompasses

### 4. DTOs (Data Transfer Objects)

**CreateAvailabilityBlockDto**:
```typescript
{
  startDate: Date;        // Required
  endDate: Date;          // Required
  isBlocked?: boolean;    // Optional, defaults to false
}
```

**UpdateAvailabilityBlockDto**:
- Partial version of Create DTO (all fields optional)

**CheckAvailabilityDto**:
```typescript
{
  startDate: Date;        // Required
  endDate: Date;          // Required
}
```

### 5. Test Coverage

**Unit Tests** (`availability-blocks.service.spec.ts`):
- ✅ 18/18 tests passing
- Service instantiation
- Create block (success + validations)
- Date validation (past dates, order, max range)
- Overlap detection
- Ownership checks
- Check availability (available + unavailable)
- Find all blocks (with date filtering)
- Update block (success + forbidden)
- Delete block (success + forbidden)
- Helper method `isListingAvailable()`

**E2E Tests** (`test/availability-blocks.e2e-spec.ts`):
- Complete integration test suite covering:
  - Creating availability blocks
  - Authentication requirements
  - Date validation rules
  - Overlap prevention
  - Ownership verification
  - Querying blocks with filters
  - Checking availability
  - Update operations
  - Delete operations

## How It Works

### Availability Block Concept

An availability block represents a date range that is either:
- **Available** (`isBlocked: false`) - Listing can be booked during this period
- **Blocked** (`isBlocked: true`) - Listing cannot be booked during this period

### Use Cases

1. **Block off unavailable dates**:
   ```json
   {
     "startDate": "2026-12-20",
     "endDate": "2026-12-27",
     "isBlocked": true
   }
   ```

2. **Mark available periods**:
   ```json
   {
     "startDate": "2026-10-01",
     "endDate": "2026-10-31",
     "isBlocked": false
   }
   ```

3. **Check if dates are available before booking**:
   ```json
   POST /listings/:id/availability-blocks/check
   {
     "startDate": "2026-10-15",
     "endDate": "2026-10-20"
   }
   ```

## API Examples

### Create Availability Block
```bash
curl -X POST http://localhost:3001/api/v1/listings/:listingId/availability-blocks \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "startDate": "2026-10-01T00:00:00.000Z",
    "endDate": "2026-10-07T00:00:00.000Z",
    "isBlocked": true
  }'
```

### Get All Blocks for a Listing
```bash
curl http://localhost:3001/api/v1/listings/:listingId/availability-blocks
```

### Get Blocks in Date Range
```bash
curl "http://localhost:3001/api/v1/listings/:listingId/availability-blocks?startDate=2026-10-01&endDate=2026-10-31"
```

### Check Availability
```bash
curl -X POST http://localhost:3001/api/v1/listings/:listingId/availability-blocks/check \
  -H "Content-Type: application/json" \
  -d '{
    "startDate": "2026-10-15T00:00:00.000Z",
    "endDate": "2026-10-20T00:00:00.000Z"
  }'
```

**Response**:
```json
{
  "isAvailable": false,
  "requestedStartDate": "2026-10-15T00:00:00.000Z",
  "requestedEndDate": "2026-10-20T00:00:00.000Z",
  "blockedPeriods": [
    {
      "id": "...",
      "startDate": "2026-10-01T00:00:00.000Z",
      "endDate": "2026-10-31T00:00:00.000Z",
      "isBlocked": true
    }
  ],
  "message": "Listing has blocked periods within the requested date range"
}
```

### Update Availability Block
```bash
curl -X PATCH http://localhost:3001/api/v1/listings/:listingId/availability-blocks/:blockId \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "isBlocked": false
  }'
```

### Delete Availability Block
```bash
curl -X DELETE http://localhost:3001/api/v1/listings/:listingId/availability-blocks/:blockId \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Integration with Other Modules

### For Bookings Module

The service exports `isListingAvailable()` method:

```typescript
// In bookings service
const isAvailable = await this.availabilityBlocksService.isListingAvailable(
  listingId,
  startDate,
  endDate
);

if (!isAvailable) {
  throw new BadRequestException('Listing is not available for the requested dates');
}
```

### Current Integrations

- ✅ Uses `ListingsModule` to verify ownership
- ✅ Uses `PrismaModule` for database access
- ✅ Uses JWT authentication from `AuthModule`
- ✅ Follows established error handling patterns

## File Structure

```
apps/api/src/availability-blocks/
├── dto/
│   ├── create-availability-block.dto.ts
│   ├── update-availability-block.dto.ts
│   └── check-availability.dto.ts
├── availability-blocks.controller.ts
├── availability-blocks.service.ts
├── availability-blocks.service.spec.ts
└── availability-blocks.module.ts

apps/api/test/
└── availability-blocks.e2e-spec.ts
```

## Business Rules Enforced

1. **No Past Dates**: Start date must be today or future
2. **Logical Order**: End date must be after start date
3. **Reasonable Duration**: Maximum 365 days per block
4. **No Overlaps**: Cannot create overlapping blocks for same listing
5. **Owner Only**: Only listing owners can create/update/delete blocks
6. **Conflict Detection**: Smart overlap checking prevents double bookings

## Edge Cases Handled

- ✅ Partial overlap detection (new block overlaps start/end of existing)
- ✅ Full encompass detection (new block completely contains existing)
- ✅ Update validation (checks overlaps excluding current block)
- ✅ Missing listing error handling
- ✅ Authorization verification
- ✅ Invalid date format handling (via class-transformer)

## Next Steps

With availability blocks complete, the system is ready for:

1. **Bookings Module** ← Next Priority
   - Create booking requests
   - Validate against availability blocks
   - Calculate pricing based on date range
   - Implement booking status workflow
   - Prevent double bookings

2. **Payments Module**
   - Paystack integration
   - Escrow holding
   - Automatic release after return

3. **Messaging Module**
   - Booking-scoped chat
   - Notifications

## Summary

The availability blocks module is **production-ready** with:

- ✅ 6 API endpoints (CRUD + check availability)
- ✅ Comprehensive date validation
- ✅ Overlap detection and prevention
- ✅ Owner authorization
- ✅ 18 passing unit tests
- ✅ Full E2E test suite
- ✅ Helper method exported for bookings
- ✅ Clean architecture
- ✅ Type-safe throughout

**Code committed and pushed to GitHub**: `feat: implement availability blocks module`

This module provides the foundation for the entire booking system by managing when listings can and cannot be rented.
