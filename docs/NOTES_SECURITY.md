# Notes Feature - Security Documentation

## Overview
The Notes feature allows both Admins and Members to create, view, edit, and delete personal notes with rich text formatting. This document outlines the security measures implemented to protect against XSS and SQL Injection attacks.

## Security Measures

### 1. XSS (Cross-Site Scripting) Protection

#### HTML Sanitization
All rich text content is sanitized using **DOMPurify** before being stored in the database and when displayed to users.

**Implementation:**
- Location: `/lib/sanitize.ts`
- Library: `isomorphic-dompurify` (works in both browser and Node.js)
- Allowed HTML tags: `p`, `br`, `strong`, `em`, `u`, `s`, `h1-h6`, `ul`, `ol`, `li`, `blockquote`, `code`, `pre`, `a`, `hr`
- Allowed attributes: Only `href`, `target`, and `rel` for links
- Data attributes: Disabled
- URL validation: Uses strict URI regexp to prevent javascript: and other dangerous protocols

**Example:**
```typescript
export function sanitizeHtml(html: string): string {
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', ...],
    ALLOWED_ATTR: ['href', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}
```

#### Server-Side Sanitization
All note content is sanitized on the server before being saved to the database:

- **Create Note**: `/app/api/notes/route.ts` - POST handler
- **Update Note**: `/app/api/notes/[id]/route.ts` - PATCH handler

Both handlers call `sanitizeHtml()` before saving content to MongoDB.

#### Title Sanitization
Note titles are also sanitized to remove any HTML tags:

```typescript
export function sanitizeTitle(title: string): string {
  return title.replace(/<[^>]*>/g, '').trim();
}
```

### 2. SQL Injection Protection

#### MongoDB with Mongoose
The application uses **MongoDB** with **Mongoose ODM**, which provides built-in protection against injection attacks:

1. **Parameterized Queries**: Mongoose automatically escapes values in queries
2. **Schema Validation**: Strict schema definitions prevent unexpected data types
3. **Type Casting**: Mongoose enforces type constraints defined in schemas

**Note Model:**
```typescript
const NoteSchema = new Schema<INote>({
  title: {
    type: String,
    required: [true, 'Note title is required'],
    trim: true,
  },
  content: {
    type: String,
    required: [true, 'Note content is required'],
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Note must have a creator'],
  },
}, { timestamps: true });
```

#### Input Validation with Zod
All API inputs are validated using **Zod** schemas before processing:

```typescript
const createNoteSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1),
});
```

This ensures:
- Type safety
- Length constraints
- Required field enforcement
- Invalid data rejection before database operations

### 3. Authorization & Access Control

#### User-Scoped Notes
Notes are strictly scoped to the user who created them:

- **Create**: Automatically associates note with authenticated user
- **Read**: Users can only fetch their own notes
- **Update**: Users can only update notes they created
- **Delete**: Users can only delete notes they created

**Access Control Example:**
```typescript
// Verify ownership before allowing update/delete
if (note.createdBy.toString() !== authResult.user!._id.toString()) {
  return NextResponse.json(
    { error: 'Access denied' },
    { status: 403 }
  );
}
```

#### JWT Authentication
All API routes require valid JWT authentication:

```typescript
export async function GET(request: NextRequest) {
  const authResult = await requireAuth(request);
  if (!authResult.authenticated) {
    return authResult.response;
  }
  // ... proceed with authenticated request
}
```

## Rich Text Editor Configuration

The **Tiptap** editor is configured with safe extensions only:

- StarterKit: Basic formatting (bold, italic, headings, lists)
- Link: URL links with `target="_blank"` and `rel="noopener noreferrer"`
- Placeholder: User-friendly placeholders

**Link Security:**
```typescript
Link.configure({
  openOnClick: false,
  HTMLAttributes: {
    target: '_blank',
    rel: 'noopener noreferrer',  // Prevents tabnabbing
  },
})
```

## API Endpoints

### POST /api/notes
- Creates a new note
- Sanitizes title and content
- Associates with authenticated user
- Returns sanitized note

### GET /api/notes
- Lists user's notes with optional search
- Filters by authenticated user ID
- Returns only user's own notes

### GET /api/notes/[id]
- Fetches specific note
- Verifies ownership
- Returns note if authorized

### PATCH /api/notes/[id]
- Updates note title and/or content
- Sanitizes updated content
- Verifies ownership
- Returns updated note

### DELETE /api/notes/[id]
- Deletes note
- Verifies ownership
- Returns success message

## Testing Security

### XSS Prevention Tests

Try creating a note with malicious content:

```html
<!-- Attempt 1: Script injection -->
<script>alert('XSS')</script>

<!-- Attempt 2: Event handler -->
<img src="x" onerror="alert('XSS')">

<!-- Attempt 3: Javascript URL -->
<a href="javascript:alert('XSS')">Click me</a>
```

**Expected Behavior**: All malicious code is stripped, leaving only safe HTML tags.

### SQL Injection Tests

Try searching with SQL-like injection:

```
'; DROP TABLE notes; --
' OR '1'='1
```

**Expected Behavior**: Mongoose treats these as literal strings in the regex search, no SQL execution occurs.

## Best Practices Followed

1. ✅ **Defense in Depth**: Multiple layers of security (sanitization, validation, authorization)
2. ✅ **Whitelist Approach**: Only allowing specific safe HTML tags rather than blacklisting dangerous ones
3. ✅ **Server-Side Validation**: Never trust client-side validation alone
4. ✅ **Principle of Least Privilege**: Users can only access their own notes
5. ✅ **Input Validation**: Strict schema validation with Zod
6. ✅ **Output Encoding**: DOMPurify handles safe rendering
7. ✅ **Secure Defaults**: Links open in new tab with noopener noreferrer

## Dependencies

- **isomorphic-dompurify**: v2.35.0 - XSS sanitization
- **@tiptap/react**: v3.18.0 - Rich text editor
- **@tiptap/starter-kit**: v3.18.0 - Basic editor features
- **mongoose**: v9.1.5 - MongoDB ODM with injection protection
- **zod**: v4.3.6 - Input validation

## Conclusion

The Notes feature implements comprehensive security measures to protect against both XSS and SQL injection attacks. By combining DOMPurify sanitization, Mongoose's built-in protections, strict input validation, and proper access controls, the system ensures that user data remains secure while providing a rich text editing experience.
