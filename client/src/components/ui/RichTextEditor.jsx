import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';

/** CKEditor 5 wrapper (PRD §14) — HTML hasil editor selalu disanitasi di backend sebelum disimpan. */
export default function RichTextEditor({ value, onChange }) {
  return (
    <div className="overflow-hidden rounded-lg border border-edge focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-200 [&_.ck-editor__editable_inline]:min-h-[200px]">
      <CKEditor
        editor={ClassicEditor}
        data={value || ''}
        onChange={(_event, editor) => onChange(editor.getData())}
        config={{ placeholder: 'Tulis konten di sini…' }}
      />
    </div>
  );
}
