/**
 * When to show a field's error:
 * - after the form was submitted, always;
 * - before that, only once the person typed something and left the field.
 * Empty fields don't complain on blur, so the layout never jumps under the
 * pointer (e.g. while clicking "Forgot password?" or a link below).
 */
export function fieldError(form, name) {
  const value = form.values[name]
  const hasValue = typeof value === 'string' ? value.trim() !== '' : Boolean(value)
  if (form.submitCount > 0 || (form.touched[name] && hasValue)) return form.errors[name]
  return undefined
}
