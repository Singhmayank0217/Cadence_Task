/** Join conditional class names without pulling in a dependency. */
export function cn(...values) {
  return values.flat(Infinity).filter(Boolean).join(' ')
}
