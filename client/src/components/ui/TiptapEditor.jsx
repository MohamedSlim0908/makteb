import { useEffect, useRef, useState } from 'react';
import { EditorContent, useEditor } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import Placeholder from '@tiptap/extension-placeholder';
import StarterKit from '@tiptap/starter-kit';
import {
  Bold,
  Heading2,
  Image as ImageIcon,
  Italic,
  List,
  ListOrdered,
  Loader2,
  Quote,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { api } from '../../lib/api';

const EditorImage = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,
  selectable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        class: 'my-4 w-full rounded-xl border border-gray-200 object-cover',
      }),
    ];
  },

  addCommands() {
    return {
      setImage:
        (attributes) =>
        ({ commands }) =>
          commands.insertContent({
            type: this.name,
            attrs: attributes,
          }),
    };
  },
});

function ToolbarButton({ isActive, icon, label, onClick, disabled = false }) {
  const IconComponent = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-lg border text-sm transition-colors ${
        isActive
          ? 'border-gray-900 bg-gray-900 text-white'
          : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50 hover:text-gray-700'
      } disabled:cursor-not-allowed disabled:opacity-50`}
    >
      <IconComponent className="h-4 w-4" />
    </button>
  );
}

export function TiptapEditor({
  value,
  onChange,
  placeholder = 'Write something...',
  className = '',
  minHeightClassName = 'min-h-[160px]',
  onUploadStateChange,
  onEditorReady,
  showToolbar = true,
  contentClassName = '',
  autoFocus = false,
}) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  const editor = useEditor({
    immediatelyRender: false,
    autofocus: autoFocus ? 'end' : false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
      Placeholder.configure({
        placeholder,
      }),
      EditorImage,
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: [
          'prose prose-sm max-w-none focus:outline-none',
          minHeightClassName,
          'px-4 py-3 text-sm text-gray-700',
          '[&_.is-editor-empty:first-child::before]:pointer-events-none',
          '[&_.is-editor-empty:first-child::before]:float-left',
          '[&_.is-editor-empty:first-child::before]:h-0',
          '[&_.is-editor-empty:first-child::before]:text-gray-400',
          '[&_.is-editor-empty:first-child::before]:content-[attr(data-placeholder)]',
          contentClassName,
        ].join(' '),
      },
    },
    onUpdate({ editor: activeEditor }) {
      onChange?.(activeEditor.getHTML());
    },
  });

  useEffect(() => {
    onUploadStateChange?.(isUploading);
  }, [isUploading, onUploadStateChange]);

  useEffect(() => {
    onEditorReady?.(editor);
    return () => onEditorReady?.(null);
  }, [editor, onEditorReady]);

  useEffect(() => {
    if (!editor) return;
    const nextValue = value || '';
    if (editor.getHTML() === nextValue) return;
    editor.commands.setContent(nextValue, false);
  }, [editor, value]);

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !editor) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      editor.chain().focus().setImage({ src: data.url, alt: file.name || 'Uploaded image' }).run();
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  return (
    <div className={`${showToolbar ? 'rounded-xl border border-gray-200 bg-white' : 'bg-transparent'} ${className}`}>
      {showToolbar && (
        <div className="flex flex-wrap items-center gap-2 border-b border-gray-100 px-3 py-2">
          <ToolbarButton
            isActive={editor?.isActive('heading', { level: 2 })}
            icon={Heading2}
            label="Heading"
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={!editor}
          />
          <ToolbarButton
            isActive={editor?.isActive('bold')}
            icon={Bold}
            label="Bold"
            onClick={() => editor?.chain().focus().toggleBold().run()}
            disabled={!editor}
          />
          <ToolbarButton
            isActive={editor?.isActive('italic')}
            icon={Italic}
            label="Italic"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            disabled={!editor}
          />
          <ToolbarButton
            isActive={editor?.isActive('bulletList')}
            icon={List}
            label="Bullet list"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            disabled={!editor}
          />
          <ToolbarButton
            isActive={editor?.isActive('orderedList')}
            icon={ListOrdered}
            label="Ordered list"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            disabled={!editor}
          />
          <ToolbarButton
            isActive={editor?.isActive('blockquote')}
            icon={Quote}
            label="Quote"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
            disabled={!editor}
          />
          <ToolbarButton
            isActive={false}
            icon={ImageIcon}
            label="Upload image"
            onClick={() => fileInputRef.current?.click()}
            disabled={!editor || isUploading}
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />

          {isUploading && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading...
            </span>
          )}
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
