export const MAX_AVATAR_BYTES = 1024 * 1024
export function isOwnedAvatarPath(path: unknown, userId: string): path is string {
  return typeof path === 'string' && path.startsWith(`${userId}/`) && /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.jpg$/i.test(path)
}
export function validAvatarJpeg(bytes: Uint8Array) {
  if (bytes.length < 12 || bytes.length > MAX_AVATAR_BYTES || bytes[0] !== 0xff || bytes[1] !== 0xd8 || bytes[bytes.length-2] !== 0xff || bytes[bytes.length-1] !== 0xd9) return false
  let offset = 2
  while (offset + 4 < bytes.length) {
    if (bytes[offset++] !== 0xff) return false
    while (bytes[offset] === 0xff) offset++
    const marker = bytes[offset++]
    if (marker === 0xda || marker === 0xd9) return false
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue
    const length = (bytes[offset] << 8) + bytes[offset+1]
    if (length < 2 || offset + length > bytes.length) return false
    if ([0xc0,0xc1,0xc2].includes(marker)) {
      if (length < 8) return false
      const height = (bytes[offset+3] << 8) + bytes[offset+4]
      const width = (bytes[offset+5] << 8) + bytes[offset+6]
      return width > 0 && height > 0 && width <= 1600 && height <= 1600
    }
    offset += length
  }
  return false
}
