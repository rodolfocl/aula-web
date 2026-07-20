const OWNER_EMAIL = import.meta.env.VITE_OWNER_EMAIL ?? ''

export function isOwner(email) {
  return !!OWNER_EMAIL && email === OWNER_EMAIL
}