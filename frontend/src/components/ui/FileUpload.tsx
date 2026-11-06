import { useRef, type ChangeEvent } from 'react';

type FileUploadProps = { accept?: string; multiple?: boolean; disabled?: boolean; onFiles: (files: File[]) => void; label?: string };
export function FileUpload({ accept, multiple = false, disabled = false, onFiles, label = 'Choose files' }: FileUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    onFiles(Array.from(event.currentTarget.files ?? []));
    event.currentTarget.value = '';
  };
  return <div className="file-upload">
    <input ref={inputRef} type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={handleChange} />
    <button type="button" disabled={disabled} onClick={() => inputRef.current?.click()}>{label}</button>
  </div>;
}
