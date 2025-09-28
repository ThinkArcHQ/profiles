# Slug Generation Service

This service provides functionality for generating and managing unique user profile slugs according to the requirements.

## Features

- **Slug Generation**: Convert user names to URL-friendly slugs
- **Uniqueness Checking**: Ensure slugs are unique in the database
- **Validation**: Validate slug format according to requirements
- **Update Support**: Update existing user slugs safely

## Requirements Compliance

- **Requirement 1.1**: Generate unique slug based on user name
- **Requirement 1.2**: Contain only lowercase letters, numbers, and hyphens
- **Requirement 1.3**: Append numbers for uniqueness (e.g., "john-doe-2")

## Usage

### Basic Usage

```typescript
import { generateSlug, validateSlug, isSlugAvailable } from '@/lib/services/slug-service';

// Generate a unique slug
const slug = await generateSlug('John Doe'); // Returns: "john-doe"

// Validate slug format
const isValid = validateSlug('john-doe'); // Returns: true

// Check availability
const available = await isSlugAvailable('john-doe'); // Returns: boolean
```

### Utility Functions

```typescript
import { previewSlug, canMakeValidSlug } from '@/lib/utils/slug-utils';

// Preview what a slug would look like
const preview = previewSlug('John Doe'); // Returns: "john-doe"

// Check if a name can make a valid slug
const canMake = canMakeValidSlug('John Doe'); // Returns: true
```

### Service Class

```typescript
import { slugService } from '@/lib/services/slug-service';

// Use the service instance directly
const slug = await slugService.generateSlug('John Doe');
await slugService.updateSlug('user123', 'new-slug');
```

## Slug Format Rules

- **Length**: 3-50 characters
- **Characters**: Only lowercase letters (a-z), numbers (0-9), and hyphens (-)
- **Structure**: Cannot start or end with hyphens
- **Hyphens**: No consecutive hyphens allowed

## Examples

| Input Name | Generated Slug |
|------------|----------------|
| "John Doe" | "john-doe" |
| "Mary-Jane Watson" | "mary-jane-watson" |
| "Dr. John Smith Jr." | "dr-john-smith-jr" |
| "José María" | "jos-mara" |
| "User 123" | "user-123" |
| "AB" | "ab0" (padded) |

## Error Handling

The service throws descriptive errors for various scenarios:

- `Invalid slug format generated from name`: When input produces no valid characters
- `Slug is already taken`: When trying to update to an existing slug
- `Failed to check slug availability`: Database connection issues
- `Unable to generate unique slug after 9999 attempts`: Safety limit reached

## Testing

The service includes comprehensive unit tests covering:

- Slug validation logic
- Name-to-slug conversion
- Uniqueness checking
- Error scenarios
- Edge cases

Run tests with:
```bash
npm run test:run -- src/lib/services/__tests__/
```

## Database Integration

The service integrates with the existing Drizzle ORM setup and requires:

- `profiles` table with `slug` column (unique constraint)
- `workosUserId` for user identification
- Database connection via `@/lib/db/connection`