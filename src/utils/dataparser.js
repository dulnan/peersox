export function decode (data) {
  return JSON.parse(data)
}

export function encode (name, data = {}) {
  return JSON.stringify({ name, data })
}
