export function decode (data) {
  try {
    return JSON.parse(data)
  } catch (e) {
    return null
  }
}

export function encode (name, data = {}) {
  return JSON.stringify({ name, data })
}
