export type FileValidationOptions = {
  maxBytes?: number;
  allowedTypes?: readonly string[];
  allowedExtensions?: readonly string[];
};

export function validateFile(file: File, options: FileValidationOptions = {}): string | null {
  if (options.maxBytes !== undefined && file.size > options.maxBytes) {
    return `File must be smaller than ${Math.ceil(options.maxBytes / (1024 * 1024))} MB.`;
  }
  const extension = file.name.split('.').pop()?.toLowerCase();
  if (options.allowedTypes?.length && !options.allowedTypes.includes(file.type)) {
    return 'This file type is not supported.';
  }
  if (options.allowedExtensions?.length && (!extension || !options.allowedExtensions.includes(extension))) {
    return 'This file extension is not supported.';
  }
  return null;
}
