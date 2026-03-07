import DOMPurify from 'dompurify';
import './TiptapEditor.css';

// RichContent renders user-generated HTML safely.
// All content is sanitized with DOMPurify before rendering
// to prevent XSS attacks. This is the ONLY safe way to
// render HTML from Tiptap or any user input.

export function RichContent({ content, className = '' }) {
  if (!content) return null;

  // Sanitize HTML — strips <script>, event handlers, etc.
  const sanitizedHTML = DOMPurify.sanitize(content);

  return (
    <div
      className={`rich-content ${className}`}
      // Safe: content is sanitized by DOMPurify above
      dangerouslySetInnerHTML={{ __html: sanitizedHTML }}
    />
  );
}
