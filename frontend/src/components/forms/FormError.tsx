export function FormError({ message }: { message?: string }) {
  return message ? <p className="form-error" role="alert">{message}</p> : null;
}
