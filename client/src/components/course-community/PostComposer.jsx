import { useEffect, useRef, useState } from 'react';
import {
  BarChart3,
  ChevronDown,
  Link2,
  Loader2,
  Paperclip,
  Smile,
  Video,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Avatar } from '../ui/Avatar';
import { TiptapEditor } from '../ui/TiptapEditor';
import { POST_CATEGORIES } from './mockData';
import { isRichTextEmpty } from '../../lib/richText';
import { api } from '../../lib/api';

function ToolButton({ icon, label, onClick, disabled = false, text }) {
  const IconComponent = icon;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="inline-flex h-8 min-w-8 items-center justify-center rounded-lg px-2 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {text ? <span className="text-[11px] font-semibold tracking-[0.08em]">{text}</span> : <IconComponent className="h-4 w-4" />}
    </button>
  );
}

export function PostComposer({
  user,
  contextName = 'this community',
  title,
  content,
  category,
  onTitleChange,
  onContentChange,
  onCategoryChange,
  onSubmit,
  isSubmitting,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMediaUploading, setIsMediaUploading] = useState(false);
  const titleInputRef = useRef(null);
  const fileInputRef = useRef(null);
  const editorRef = useRef(null);
  const wasSubmittingRef = useRef(false);
  const hasDraft = title.trim().length > 0 || !isRichTextEmpty(content);
  const isSubmitDisabled = isSubmitting || isMediaUploading || !title.trim() || isRichTextEmpty(content);

  useEffect(() => {
    if (!isOpen) return;
    window.requestAnimationFrame(() => {
      titleInputRef.current?.focus();
    });
  }, [isOpen]);

  useEffect(() => {
    if (!wasSubmittingRef.current && isSubmitting) {
      wasSubmittingRef.current = true;
      return;
    }

    if (wasSubmittingRef.current && !isSubmitting && !hasDraft) {
      setIsOpen(false);
      wasSubmittingRef.current = false;
    }
  }, [hasDraft, isSubmitting]);

  async function handleAttachmentUpload(event) {
    const file = event.target.files?.[0];
    if (!file || !editorRef.current) return;

    setIsMediaUploading(true);
    try {
      const formData = new FormData();
      formData.append('image', file);

      const { data } = await api.post('/upload/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      editorRef.current.chain().focus().setImage({ src: data.url, alt: file.name || 'Uploaded image' }).run();
      toast.success('Image uploaded');
    } catch {
      toast.error('Failed to upload image');
    } finally {
      setIsMediaUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  function handleInsertLink() {
    const url = window.prompt('Paste the link URL');
    if (!url || !editorRef.current) return;
    editorRef.current.chain().focus().insertContent(`<p><a href="${url}">${url}</a></p>`).run();
  }

  function handleInsertVideo() {
    const url = window.prompt('Paste the video URL');
    if (!url || !editorRef.current) return;
    editorRef.current.chain().focus().insertContent(`<p><a href="${url}">Video: ${url}</a></p>`).run();
  }

  function handleInsertPoll() {
    if (!editorRef.current) return;
    editorRef.current.chain().focus().insertContent(
      '<p><strong>Poll</strong></p><ul><li>Option 1</li><li>Option 2</li></ul>'
    ).run();
  }

  function handleInsertEmoji() {
    if (!editorRef.current) return;
    editorRef.current.chain().focus().insertContent('🙂').run();
  }

  function handleInsertGif() {
    const url = window.prompt('Paste a GIF image URL');
    if (!url || !editorRef.current) return;
    editorRef.current.chain().focus().setImage({ src: url, alt: 'GIF' }).run();
  }

  function handleCancel() {
    onTitleChange('');
    onContentChange('');
    onCategoryChange('');
    setIsOpen(false);
  }

  function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitDisabled) return;
    onSubmit();
  }

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="group flex h-[76px] w-full items-center gap-4 rounded-2xl border border-gray-200 bg-white px-4 text-left shadow-card transition-all duration-200 hover:border-gray-300 hover:shadow-[0_8px_28px_rgba(0,0,0,0.06)]"
      >
        <Avatar src={user?.avatar} name={user?.name} size="md" className="shrink-0" />
        <span className="flex-1 text-base font-medium text-gray-400 transition-colors group-hover:text-gray-500">
          Write something
        </span>
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="animate-scale-in rounded-2xl border border-gray-200 bg-white px-4 py-4 shadow-[0_14px_40px_rgba(15,23,42,0.06)] transition-all duration-200 ease-out"
    >
      <div className="flex items-center gap-3">
        <Avatar src={user?.avatar} name={user?.name} size="sm" className="shrink-0" />
        <p className="text-sm text-gray-500">
          <span className="font-semibold text-gray-900">{user?.name || 'You'}</span>
          {' '}posting in{' '}
          <span className="font-semibold text-gray-900">{contextName}</span>
        </p>
      </div>

      <div className="mt-3">
        <input
          ref={titleInputRef}
          type="text"
          value={title}
          onChange={(event) => onTitleChange(event.target.value)}
          placeholder="Title"
          className="w-full border-0 px-0 py-1 text-[19px] font-semibold text-gray-900 placeholder:text-gray-500 focus:outline-none focus:ring-0"
        />
      </div>

      <div className="mt-2">
        <TiptapEditor
          value={content}
          onChange={onContentChange}
          placeholder="Write something..."
          showToolbar={false}
          minHeightClassName="min-h-[108px]"
          className="rounded-none border-0 bg-transparent shadow-none"
          contentClassName="px-0 py-0 text-base leading-7 text-gray-700 [&_p]:mb-0 [&_ul]:mb-0 [&_ol]:mb-0"
          onEditorReady={(editor) => {
            editorRef.current = editor;
          }}
        />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleAttachmentUpload}
        className="hidden"
      />

      <div className="mt-4 flex flex-col gap-3 border-t border-gray-100/80 pt-3 md:flex-row md:items-center md:justify-between">
        <div className="flex min-w-0 flex-wrap items-center gap-1.5">
          <ToolButton icon={Paperclip} label="Attach media" onClick={() => fileInputRef.current?.click()} disabled={isMediaUploading} />
          <ToolButton icon={Link2} label="Insert link" onClick={handleInsertLink} />
          <ToolButton icon={Video} label="Insert video link" onClick={handleInsertVideo} />
          <ToolButton icon={BarChart3} label="Insert poll template" onClick={handleInsertPoll} />
          <ToolButton icon={Smile} label="Insert emoji" onClick={handleInsertEmoji} />
          <ToolButton label="Insert GIF" onClick={handleInsertGif} text="GIF" />

          <div className="relative ml-2 min-w-[170px]">
            <select
              value={category}
              onChange={(event) => onCategoryChange(event.target.value)}
              className="h-9 w-full appearance-none rounded-lg border-0 bg-transparent pr-7 text-sm font-medium text-gray-500 outline-none transition-colors hover:text-gray-700"
            >
              <option value="">Select a category</option>
              {POST_CATEGORIES.filter((item) => item.value !== 'ALL').map((item) => (
                <option key={item.value} value={item.value}>
                  {item.label}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-1 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          </div>

          {isMediaUploading && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-500">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Uploading...
            </span>
          )}
        </div>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-lg px-3 py-2 text-xs font-semibold tracking-[0.08em] text-gray-500 transition-colors hover:text-gray-700"
          >
            CANCEL
          </button>
          <button
            type="submit"
            disabled={isSubmitDisabled}
            className={`rounded-lg px-6 py-2 text-xs font-semibold tracking-[0.08em] transition-colors ${
              isSubmitDisabled
                ? 'cursor-not-allowed bg-gray-200 text-gray-400'
                : 'bg-gray-900 text-white hover:bg-black'
            }`}
          >
            {isSubmitting ? 'POSTING...' : 'POST'}
          </button>
        </div>
      </div>
    </form>
  );
}
