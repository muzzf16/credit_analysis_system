# API_STANDARD.md

# API Standards - Sistem Analisa Kredit PT BPR BAPERA BATANG

## Overview
This document defines the standards, conventions, and best practices for designing, developing, and maintaining APIs in the Credit Analysis System. All APIs must adhere to these standards to ensure consistency, usability, security, and maintainability across the system.

## API Architecture Principles

### RESTful Design
- **Resources over Actions**: Use nouns to represent resources, HTTP methods for actions
- **Statelessness**: Each request contains all information needed to understand and process it
- **Cacheability**: Responses should define their cacheability
- **Uniform Interface**: Standardized interaction mechanisms
- **Layered System**: Architecture composed of hierarchical layers

### API-First Approach
- Design APIs before implementation
- Use contract-first development with OpenAPI/Specification
- Treat APIs as first-class products with their own lifecycle
- Consumer-driven contract testing

### Consistency
- Consistent naming conventions
- Consistent error handling
- Consistent response formats
- Consistent status code usage
- Consistent security patterns

## API Design Standards

### Resource Naming
- Use **plural nouns** for collections: `/debitur`, `/pengajuan`, `/produk`
- Use **singular nouns** for specific resources: `/debitur/{id}`, `/pengajuan/{id}`
- Use **hyphens** to separate words in URIs: `/debitur-barukan`, not `debiturBarukan` or `debitur_barukan`
- Use **lowercase** letters only
- Avoid file extensions: `.json`, `.xml` (use Content-Type negotiation instead)
- Use **query parameters** for filtering, sorting, pagination
- Use **path parameters** for identifying specific resources
- Use **query parameters** for optional fields or actions

### HTTP Methods
| Method | Use Case | Idempotent | Safe | Example |
|--------|----------|------------|------|---------|
| GET | Retrieve resource/representation | Yes | Yes | `GET /debitur/{id}` |
| POST | Create new resource | No | No | `POST /debitur` |
| PUT | Replace entire resource | Yes | No | `PUT /debitur/{id}` |
| PATCH | Partially update resource | No* | No | `PATCH /debitur/{id}` |
| DELETE | Remove resource | Yes | No | `DELETE /debitur/{id}` |
| HEAD | Get headers only (no body) | Yes | Yes | `HEAD /debitur/{id}` |
| OPTIONS | Get supported methods | Yes | Yes | `OPTIONS /debitur` |

*Note: PATCH can be idempotent depending on implementation

### Status Codes
Use appropriate HTTP status codes:

#### Success (2xx)
- `200 OK`: Standard successful response
- `201 Created`: Resource successfully created (POST/PUT)
- `202 Accepted`: Request accepted for processing (async)
- `204 No Content`: Successful response with no body (DELETE)

#### Client Errors (4xx)
- `400 Bad Request`: Malformed request, validation errors
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Authenticated but insufficient permissions
- `404 Not Found`: Resource not found
- `405 Method Not Allowed`: HTTP method not supported for resource
- `406 Not Acceptable`: Requested format not available
- `409 Conflict`: Request conflicts with current state
- `410 Gone`: Resource permanently removed
- `412 Precondition Failed`: Conditional request failed
- `415 Unsupported Media Type`: Request format not supported
- `422 Unprocessable Entry`: Semantic errors (validation)
- `429 Too Many Requests`: Rate limiting
- `4xx Client Error`: Other client errors

#### Server Errors (5xx)
- `500 Internal Server Error`: Unexpected server error
- `501 Not Implemented`: Requested functionality not implemented
- `502 Bad Gateway`: Invalid response from upstream server
- `503 Service Unavailable`: Server temporarily unavailable
- `504 Gateway Timeout`: Upstream server timeout
- `5xx Server Error`: Other server errors

### Versioning
- **URI Versioning**: `/api/v1/resource` (recommended for public APIs)
- **Header Versioning**: `Accept: application/vnd.api+json;version=1`
- **Media Type Versioning**: `Accept: application/vnd.company.app-v1+json`
- **Query Parameter Versioning**: `/resource?version=1` (less preferred)
- **Version in Request Body**: Least preferred

Our standard: **URI Versioning** (`/api/v1/`, `/api/v2/`)
- Major version when breaking changes occur
- Minor version for backward-compatible additions
- Patch version not typically reflected in URI

### Request/Response Format
- **Primary Format**: JSON (`application/json`)
- **Alternative Formats**: Support XML if specifically required (`application/xml`)
- **Character Encoding**: UTF-8 always
- **Date/Time Format**: ISO 8601 (`YYYY-MM-DDTHH:mm:ss.sssZ`)
- **Boolean Values**: JSON boolean (`true`/`false`)
- **Null Values**: Use `null` for absent values
- **Empty Collections**: Return empty array `[]` or object `{}` (not `null`)
- **Pretty Printing**: Not used in production; only for debugging

### Field Naming Convention
- Use **camelCase** for JSON property names (standard for JavaScript/JSON)
- Match database column names where reasonable (with translation layer)
- Use descriptive, meaningful names
- Avoid abbreviations unless widely understood (id, url, etc.)
- Boolean fields: prefix with `is`, `has`, `can`, `should` (e.g., `isActive`)
- Collections: use plural names (e.g., `items`, `documents`)
- Money values: represent as strings or numbers with currency metadata
- IDs: strings (to accommodate UUIDs) or numbers (for sequential IDs)

## API Endpoint Structure

### Base URL Pattern
```
{scheme}://{host}:{port}/{base_path}/{version}/{resource}[/{id}][?query_params]
```

Examples:
- `https://api.bprbaperabatang.com/api/v1/debitur/123`
- `http://localhost:5000/api/v1/pengajuan?status=DISETUJUI&limit=50`

### Standard Endpoints per Resource
For each resource, provide these standard endpoints:

#### Collection Endpoints
- `GET /{resource}`: List resources (with filtering, sorting, pagination)
- `POST /{resource}`: Create new resource

#### Item Endpoints
- `GET /{resource}/{id}`: Get specific resource
- `PUT /{resource}/{id}`: Replace entire resource
- `PATCH /{resource}/{id}`: Partially update resource
- `DELETE /{resource}/{id}`: Delete resource

### Common Query Parameters
| Parameter | Type | Description | Example |
|-----------|------|-------------|---------|
| `limit` | integer | Maximum number of results to return | `limit=50` |
| `offset` | integer | Number of results to skip | `offset=100` |
| `page` | integer | Page number (1-based) | `page=3` |
| `size` | integer | Page size (alternative to limit) | `size=25` |
| `sort` | string | Sort field(s) | `sort=nama` or `sort=-tanggal,created_at` |
| `fields` | string | Comma-separated list of fields to return | `fields=id,nama,email` |
| `expand` | string | Related resources to include | `expand=debitur,produk` |
| `filter` | string | Filter criteria (implementation-specific) | `filter=status:eq:DISETUJUI` |
| `q` | string | Search query | `q=john+doe` |
| `from` | date | Start date for range filters | `from=2026-01-01` |
| `to` | date | End date for range filters | `to=2026-12-31` |

### Standard Response Envelope
All API responses should follow a consistent envelope format:

#### Success Response
```json
{
  "success": true,
  "message": "Optional human-readable message",
  "data": {
    // Resource-specific data goes here
  },
  "metadata": {
    "timestamp": "2026-06-27T10:30:00Z",
    "version": "1.0.0",
    "requestId": "unique-request-identifier"
  }
}
```

#### List Response (with pagination)
```json
{
  "success": true,
  "message": "Retrieved 25 of 128 debitur records",
  "data": [
    {
      "id": "d1e2f3g4-h5i6-j7k8-l9m0-n1o2p3q4r5s6",
      "nik": "1234567890123456",
      "nama": "John Doe",
      // ... other fields
    }
    // ... more items
  ],
  "metadata": {
    "timestamp": "2026-06-27T10:30:00Z",
    "version": "1.0.0",
    "requestId": "unique-request-identifier",
    "pagination": {
      "limit": 25,
      "offset": 0,
      "count": 25,
      "total": 128,
      "page": 1,
      "pages": 6
    }
  }
}
```

#### Error Response
```json
{
  "success": false,
  "message": "Validation failed",
  "errors": [
    {
      "field": "email",
      "code": "INVALID_FORMAT",
      "message": "Email address is not valid"
    },
    {
      "field": "password",
      "code": "TOO_SHORT",
      "message": "Password must be at least 8 characters"
    }
  ],
  "metadata": {
    "timestamp": "2026-06-27T10:30:00Z",
    "version": "1.0.0",
    "requestId": "unique-request-identifier"
  }
}
```

## Data Types and Formats

### Standard Data Types
| Type | JSON Type | Format/Example | Description |
|------|-----------|----------------|-------------|
| String | string | `"John Doe"` | Text data |
| Integer | number | `42` | Whole number |
| Long | number | `9223372036854775807` | 64-bit integer |
| Float | number | `3.14159` | Floating point |
| Decimal | string | `"12345.67"` | Exact decimal (monetary values) |
| Boolean | boolean | `true` | True/false |
| Date | string | `"2026-06-27"` | ISO 8601 date |
| DateTime | string | `"2026-06-27T10:30:00Z"` | ISO 8601 UTC datetime |
| Timestamp | string | `"2026-06-27T10:30:00.123Z"` | ISO 8601 with milliseconds |
| Duration | string | `"P1Y2M3DT4H5M6S"` | ISO 8601 duration |
| UUID | string | `"550e8400-e29b-41d4-a716-446655440000"` | Universally unique identifier |
| Email | string | `"user@example.com"` | Email address |
| URL | string | `"https://example.com"` | Uniform Resource Locator |
| Phone | string | `"+62-21-1234-5678"` | Phone number |
| Currency Object | object | `{ "value": "10000.00", "currency": "IDR" }` | Monetary value with currency |
| Array | array | `[1, 2, 3]` | Ordered list |
| Object | object | `{ "key": "value" }` | Key-value map |

### Special Formats
#### Monetary Values
Always represent monetary values as strings to prevent precision loss:
```json
{
  "jumlahPinjaman": {
    "value": "150000000",
    "currency": "IDR"
  }
}
```
Or as a single string with currency code:
```json
{
  "jumlahPinjaman": "150000000 IDR"
}
```

#### Timestamps
Always use UTC timezone (Z suffix):
```json
{
  "tanggalPengajuan": "2026-06-27T10:30:00Z",
  "createdAt": "2026-06-27T10:30:00.123Z"
}
```

#### Pagination Metadata
Standard pagination metadata in response:
```json
{
  "pagination": {
    "limit": 25,
    "offset": 0,
    "count": 25,
    "total": 128,
    "page": 1,
    "pages": 6,
    "hasNext": true,
    "hasPrevious": false
  }
}
```

## Security Standards

### Authentication
- **Token-Based Authentication**: Use JWT or similar token-based mechanism
- **HTTPS Only**: All API endpoints must be accessible only via HTTPS
- **Token Transmission**: Bearer token in Authorization header
  ```
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
  ```
- **Token Expiration**: 
  - Access tokens: 15-30 minutes
  - Refresh tokens: 24 hours or more (with rotation)
- **Password Handling**: Never return passwords or password hashes in API responses

### Authorization
- **Role-Based Access Control (RBAC)**: Check permissions at API level
- **Resource-Based Access Control**: Verify user owns or has access to specific resource
- **Principle of Least Privilege**: Grant minimum necessary permissions
- **Access Denied**: Return 403 Forbidden for authorized users lacking permissions
- **Authentication Required**: Return 401 Unauthorized for missing/invalid tokens

### Input Validation
- **Validate All Inputs**: Never trust client input
- **Whitelist Approach**: Accept only known good values
- **Type Validation**: Ensure correct data types
- **Range Validation**: Check numerical boundaries
- **Format Validation**: Validate emails, URLs, dates, etc.
- **Length Validation**: Check string/array lengths
- **Presence Validation**: Verify required fields are present
- **Business Rule Validation**: Validate against domain-specific rules

### Output Encoding
- **JSON Encoding**: Properly escape JSON strings
- **Context-Specific Encoding**: Encode data appropriately for its use context
- **Avoid Injection**: Prevent injection attacks through proper handling

### Rate Limiting
- **Per-Client Limits**: Limit requests per client/IP
- **Per-User Limits**: Limit requests per authenticated user
- **Tiered Limits**: Different limits for different user types
- **Response Headers**: Include rate limit information
  ```
  X-RateLimit-Limit: 1000
  X-RateLimit-Remaining: 999
  X-RateLimit-Reset: 1623456789
  ```
- **Status Code**: Return 429 Too Many Requests when limit exceeded

### CORS (Cross-Origin Resource Sharing)
- **Explicit Origins**: Specify allowed origins explicitly
- **Limited Methods**: Specify allowed HTTP methods
- **Limited Headers**: Specify allowed request headers
- **Credentials**: Control whether credentials are included
- **Pre-flight Cache**: Cache pre-flight responses appropriately

### Security Headers
Implement these security headers in all API responses:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `X-XSS-Protection: 1; mode=block`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'none';` (for API endpoints)
- `Referrer-Policy: strict-origin-when-cross-origin`

## Error Handling

### Error Response Structure
As previously defined, all error responses should follow:
```json
{
  "success": false,
  "message": "Human-readable error summary",
  "errors": [
    {
      "field": "fieldName",
      "code": "ERROR_CODE",
      "message": "Detailed error message"
    }
  ],
  "metadata": {
    "timestamp": "2026-06-27T10:30:00Z",
    "version": "1.0.0",
    "requestId": "unique-request-identifier"
  }
}
```

### Standard Error Codes
| Error Code | HTTP Status | Description |
|------------|-------------|-------------|
| VALIDATION_ERROR | 400 | Input validation failed |
| REQUIRED_FIELD | 400 | Required field missing |
| INVALID_FORMAT | 400 | Value doesn't match expected format |
| INVALID_VALUE | 400 | Value outside allowed range/set |
| DUPLICATE_RESOURCE | 409 | Resource already exists |
| RESOURCE_NOT_FOUND | 404 | Requested resource not found |
| UNAUTHORIZED | 401 | Authentication required/failed |
| FORBIDDEN | 403 | Insufficient permissions |
| METHOD_NOT_ALLOWED | 405 | HTTP method not supported |
| NOT_ACCEPTABLE | 406 | Requested format not available |
| CONFLICT | 409 | Request conflicts with state |
| PRECONDITION_FAILED | 412 | Precondition not met |
| UNSUPPORTED_MEDIA_TYPE | 415 | Request media type not supported |
| UNPROCESSABLE_ENTITY | 422 | Semantic errors |
| TOO_MANY_REQUESTS | 429 | Rate limit exceeded |
| INTERNAL_SERVER_ERROR | 500 | Unexpected server error |
| NOT_IMPLEMENTED | 501 | Feature not implemented |
| BAD_GATEWAY | 502 | Invalid upstream response |
| SERVICE_UNAVAILABLE | 503 | Service temporarily unavailable |
| GATEWAY_TIMEOUT | 504 | Upstream timeout |

### Exception Handling
- **Don't Expose Stack Traces**: Never return internal error details to clients
- **Log Internally**: Log full error details server-side for debugging
- **Provide Correlation ID**: Include request ID in all responses for tracing
- **Fail Fast**: Validate early and return appropriate errors
- **Consistent Messaging**: Use consistent, user-friendly error messages

## Documentation Standards

### OpenAPI/Swagger Specification
- **Format**: Use OpenAPI 3.0 (or higher) specification
- **Location**: `/api-docs.json` or `/api-docs.yaml` endpoint
- **UI**: Provide Swagger UI or ReDoc interface at `/docs`
- **Versions**: Maintain separate specs for each API version
- **Components**: Reuse schemas, parameters, responses through components
- **Security Schemes**: Define authentication methods clearly
- **Examples**: Provide realistic examples for requests and responses
- **Descriptions**: Include clear, concise descriptions for all elements

### Documentation Requirements
- **Endpoint Description**: Clear purpose and usage
- **Parameters**: Detailed description of all parameters (path, query, header, body)
- **Responses**: All possible responses with examples
- **Authentication**: Required authentication method and scopes
- **Rate Limiting**: Rate limit information if applicable
- **Examples**: Realistic request/response examples
- **Error Codes**: Possible error conditions and their meanings
- **Changelog**: History of changes for each version

### API Documentation Structure
```
/api-docs/
  /v1/
    openapi.json
    index.html (Swagger UI)
  /v2/
    openapi.json
    index.html
```

## Performance and Optimization

### Response Size Management
- **Pagination**: Implement for collections that may grow large
- **Field Selection**: Allow clients to request specific fields (`fields=` parameter)
- **Compression**: Enable gzip/deflate compression for responses
- **Caching**: Implement appropriate caching headers (ETag, Last-Modified, Cache-Control)
- **Lazy Loading**: For related resources, provide links rather than embedding by default

### Caching Strategy
- **Cache-Control Headers**: Set appropriate cache directives
- **ETag/Last-Modified**: Support conditional requests
- **Vary Header**: Include when response varies by request headers
- **Shared vs Private**: Distinguish between shared (CDN) and private (browser) cacheability
- **Stale-While-Revalidate**: Consider for improving perceived performance

### Compression
- **Enable Gzip/Deflate**: For text-based responses (JSON, XML)
- **Minimum Size Threshold**: Only compress responses above certain size (e.g., 1KB)
- **Vary Header**: Include `Accept-Encoding` in Vary header when compression used
- **Compression Level**: Balance compression ratio with CPU usage

### Large Payload Handling
- **Streaming**: For very large responses, consider streaming
- **Pagination**: Break large lists into pages
- **Async Processing**: For operations that generate large results, use 202 Accepted with polling/webhook
- **File Downloads**: Use appropriate content types and headers for file transfers

## Implementation Guidelines

### Technology Stack
- **Language**: Node.js with Express or TypeScript
- **Framework**: Express.js, Fastify, or NestJS
- **Validation**: Joi, Yup, or class-validator
- **Documentation**: Swagger/OpenAPI tools (swagger-ui, redoc)
- **Testing**: Jest, Mocha, Chai, Supertest
- **Authentication**: jsonwebtoken, passport.js, or similar
- **Rate Limiting**: express-rate-limit or similar
- **Helmet**: For security headers
- **CORS**: cors middleware

### Code Organization
```
src/
├── api/
│   ├── v1/
│   │   ├── routes/
│   │   │   ├── debitur.routes.js
│   │   │   ├── pengajuan.routes.js
│   │   │   └── ...
│   │   ├── controllers/
│   │   │   ├── debitur.controller.js
│   │   │   ├── pengajuan.controller.js
│   │   │   └── ...
│   │   ├── middleware/
│   │   │   ├── auth.middleware.js
│   │   │   ├── validation.middleware.js
│   │   │   └── ...
│   │   ├── services/
│   │   │   ├── debitur.service.js
│   │   │   ├── pengajuan.service.js
│   │   │   └── ...
│   │   └── validators/
│   │       ├── debitur.validator.js
│   │       ├── pengajuan.validator.js
│   │       └── ...
│   └── v2/
│       └── ... (similar structure)
├── config/
├── middleware/
├── models/
├── services/
├── utils/
└── app.js
```

### Controller Responsibilities
- Handle HTTP concerns (request/response)
- Validate input (delegate to validation layer)
- Authorize access (check permissions)
- Call service layer for business logic
- Format response according to API standards
- Handle errors appropriately

### Service Layer Responsibilities
- Implement business logic
- Handle data transactions
- Coordinate between multiple repositories/models
- Apply business rules and validation
- Handle exceptions appropriately
- Return domain objects or DTOs

### Validation Layer
- Validate request data against schema
- Check required fields, data types, ranges, formats
- Return structured validation errors
- Can be implemented as middleware or within controllers

### Error Handling Middleware
- Catch and format all errors
- Convert domain exceptions to appropriate HTTP responses
- Log errors appropriately (don't expose sensitive info)
- Return standardized error response format
- Ensure no sensitive data leaks in error messages

## Testing Standards

### Unit Tests
- Test controller logic in isolation
- Mock service dependencies
- Test validation logic
- Test error handling paths
- Use testing frameworks like Jest, Mocha, or Vitest

### Integration Tests
- Test API endpoints with real server
- Test against test database
- Test authentication and authorization flows
- Test validation and error handling
- Use supertest or similar for HTTP testing

### Contract Tests
- Verify API conforms to OpenAPI specification
- Use tools like Pact or Dredd
- Test both provider and consumer sides

### Performance Tests
- Load testing with tools like k6, Artillery, or JMeter
- Stress testing to find breaking points
- Soak testing for memory leaks
- Spike testing for traffic bursts

### Security Tests
- Penetration testing for common vulnerabilities
- SQL injection testing
- XSS testing (though less relevant for pure JSON APIs)
- Authentication bypass attempts
- Authorization boundary testing
- Rate limiting effectiveness testing

## Deployment and Versioning

### Deployment Strategies
- **Blue/Green Deployment**: Minimize downtime
- **Rolling Update**: Gradual replacement of instances
- **Canary Release**: Gradual rollout to subset of users
- **Feature Toggles**: Enable/disable features without redeploy

### Versioning Strategy
- **URI Versioning**: `/api/v1/`, `/api/v2/`
- **Backward Compatibility**: Maintain older versions for deprecation period
- **Deprecation Headers**: Use `Deprecation` and `Sunset` headers
- **Version in Documentation**: Clear versioning in API docs
- **Semantic Versioning**: Align with semantic versioning principles

### API Lifecycle
1. **Design**: Define contract with OpenAPI
2. **Develop**: Implement according to contract
3. **Test**: Validate against contract and requirements
4. **Release**: Deploy to production
5. **Deprecate**: Mark old versions as deprecated
6. **Retire**: Remove after notice period

### Deprecation Policy
- **Notice Period**: Minimum 3 months for breaking changes
- **Headers**: Include `Deprecation: true` and `Sunset: <date>` headers
- **Documentation**: Clearly mark deprecated endpoints
- **Communication**: Notify consumers via multiple channels
- **Migration Path**: Provide clear migration guidance

## Monitoring and Observability

### Metrics to Collect
- **Request Metrics**:
  - Request count (by endpoint, method, status code)
  - Request duration (percentiles: 50th, 95th, 99th)
  - Request size (payload)
  - Response size (payload)
- **Error Metrics**:
  - Error count (by type, status code)
  - Error rate (percentage of requests)
- **Business Metrics**:
  - Domain-specific KPIs
  - Conversion rates
  - Usage patterns
- **System Metrics**:
  - CPU/memory usage
  - Database connection pool usage
  - Cache hit/miss ratios
  - External service call metrics

### Logging
- **Request Logging**:
  - Method, path, query string
  - Status code, response time
  - Request ID (for tracing)
  - User ID (if authenticated)
  - IP address
  - User agent
- **Error Logging**:
  - Full stack trace (in secure logs)
  - Context information
  - Request ID
  - Timestamp
- **Audit Logging**:
  - Who performed what action on what resource
  - Before/after values for sensitive changes
  - Timestamp and IP address

### Distributed Tracing
- **Trace ID**: Generate and propagate through all services
- **Span IDs**: For individual service operations
- **Attributes**: Add relevant context to spans
- **Export**: Send to tracing system (Jaeger, Zipkin, etc.)
- **Correlation**: Enable tracing across service boundaries

### Health Checks
- **Liveness Probe**: Is the service running?
- **Readiness Probe**: Is the service ready to accept traffic?
- **Dependency Checks**: Database, cache, external services
- **Endpoint**: Typically `/health` or `/healthz`
- **Response**: Simple JSON indicating status

## API Consumption Guidelines

### For Internal Consumers
- **Use Generated Clients**: When available, use SDKs/client libraries
- **Follow Conventions**: Adhere to established patterns in codebase
- **Handle Errors Properly**: Implement robust error handling
- **Respect Rate Limits**: Implement retry with backoff when needed
- **Cache Appropriately**: Use ETag/Last-Modified for conditional requests
- **Secure Tokens**: Store and transmit tokens securely
- **Timeouts**: Implement reasonable request timeouts

### For External Consumers
- **Documentation**: Provide clear, comprehensive documentation
- **SDKs**: Offer client libraries in popular languages
- **Examples**: Provide code examples for common operations
- **Support**: Offer support channels (email, portal, etc.)
- **Change Notification**: Notify of upcoming changes in advance
- **Sandbox**: Provide test/sandbox environment for experimentation
- **Rate Limits**: Clearly document rate limit policies
- **SLAs**: Publish availability and performance expectations

## Appendix A: Example Endpoint Specification

### Get Debitur Details
```
GET /api/v1/debitur/{id}
```

**Description**: Retrieve detailed information about a specific debitur (borrower).

**Parameters**:
| Name | Type | Location | Required | Description |
|------|------|----------|----------|-------------|
| id | string | path | Yes | UUID of the debitur to retrieve |
| expand | string | query | No | Comma-separated list of related resources to include (e.g., "pengajuan,survey") |

**Headers**:
- `Authorization: Bearer <jwt-token>`
- `Accept: application/json`

**Success Response**:
```
Code: 200 OK
Content: {
  "success": true,
  "message": "Debitur retrieved successfully",
  "data": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nik": "1234567890123456",
    "nama": "John Doe",
    "tanggalLahir": "1990-05-15",
    "jenisKelamin": "L",
    "alamat": "Jalan Contoh No. 123",
    "rtRw": "001/002",
    "kelurahan": "Melayu",
    "kecamatan": "Medan Barat",
    "kotaKabupaten": "Medan",
    "provinsi": "Sumatera Utara",
    "kodePos": "20111",
    "telepon": "+62-812-3456-7890",
    "email": "john.doe@example.com",
    "pekerjaan": "Software Engineer",
    "pendapatanPerbulan": {
      "value": "15000000",
      "currency": "IDR"
    },
    "statusPerkawinan": "KAWIN",
    "jumlahTanggungan": 2,
    "createdAt": "2026-01-15T08:30:00Z",
    "updatedAt": "2026-06-20T14:22:00Z"
  },
  "metadata": {
    "timestamp": "2026-06-27T10:30:00Z",
    "version": "1.0.0",
    "requestId": "a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8"
  }
}
```

**Error Responses**:
- `400 Bad Request`: Invalid UUID format
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: User lacks permission to view this debitur
- `404 Not Found`: Debitur with specified ID not found
- `500 Internal Server Error`: Unexpected server error

## Appendix B: Common Response Headers

### Standard Response Headers
| Header | Description | Example |
|--------|-------------|---------|
| Content-Type | MIME type of response body | `application/json; charset=utf-8` |
| Content-Length | Length of response body in bytes | `1024` |
| Date | Timestamp of response generation | `Sun, 27 Jun 2026 10:30:00 GMT` |
| X-Request-ID | Unique identifier for request tracing | `a1b2c3d4-e5f6-7890-g1h2-i3j4k5l6m7n8` |
| X-Content-Type-Options | Prevent MIME type sniffing | `nosniff` |
| X-Frame-Options | Clickjacking protection | `DENY` |
| X-XSS-Protection | XSS protection | `1; mode=block` |
| Strict-Transport-Security | HSTS policy | `max-age=31536000; includeSubDomains` |
| ETag | Entity tag for caching | `"abc123def456"` |
| Last-Modified | Last modification timestamp | `Sun, 26 Jun 2026 15:45:00Z` |
| Cache-Control | Caching directives | `private, max-age=3600` |
| Allow | Supported HTTP methods for resource | `GET, POST, PUT, PATCH, DELETE` |
| Retry-After | Seconds to wait before retrying (for 503/429) | `60` |
| Link | Link headers for pagination/related resources | `<https://api.example.com/api/v1/debitur?page=2>; rel="next"` |

### Response Headers for Specific Cases
#### Pagination Links
```
Link: <https://api.example.com/api/v1/debitur?page=2&limit=25>; rel="next",
      <https://api.example.com/api/v1/debitur?page=5&limit=25>; rel="last"
```

#### Authentication Challenges
```
WWW-Authenticate: Bearer realm="api", error="invalid_token"
```

#### Rate Limiting Information
```
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1623456789
```

#### Deprecation Notices
```
Deprecation: true
Sunset: Wed, 01 Jan 2027 00:00:00 GMT
Link: <https://api.example.com/api/v2/debitur>; rel="successor-version"
```

## Appendix C: Implementation Checklist

### Design Phase
- [ ] Resource modeling completed
- [ ] API endpoints designed following REST principles
- [ ] Request/response schemas defined
- [ ] Error cases identified and documented
- [ ] Security requirements defined
- [ ] Performance considerations addressed
- [ ] OpenAPI/Swagger specification created
- [ ] API documentation written

### Development Phase
- [ ] Project structure follows standards
- [ ] Controllers handle HTTP concerns only
- [ ] Business logic in service layer
- [ ] Validation implemented at appropriate layer
- [ ] Authentication middleware implemented
- [ ] Authorization checks performed
- [ ] Input validation for all endpoints
- [ ] Output formatting consistent with standards
- [ ] Error handling middleware implemented
- [ ] Logging implemented appropriately
- [ ] Security headers applied (via helmet or similar)
- [ ] CORS configured appropriately
- [ ] Rate limiting implemented
- [ ] Unit tests written for controllers and services
- [ ] Integration tests written for API endpoints
- [ ] API specification matches implementation

### Deployment Phase
- [ ] Configuration management implemented
- [ ] Environment-specific configs handled
- [ ] Database migrations tested
- [ ] Backup and recovery procedures verified
- [ ] Monitoring and alerting configured
- [ ] Logging centralized and configured
- [ ] Health check endpoints implemented
- [ ] Performance benchmarks conducted
- [ ] Security scan passed
- [ ] Load testing completed
- [ ] Documentation published and accessible
- [ ] Deprecation notices included if applicable
- [ ] Rollback plan tested and verified

### Post-Deployment Complete: API ready for consumer use

---
*Document ini adalah bagian dari Living Specification untuk Sistem Analisa Kredit PT BPR BAPERA BATANG. 
Diperbarui terakhir: 2026-06-27*