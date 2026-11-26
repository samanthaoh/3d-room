export const roomPresets = [
  { id: 'compact', name: 'Compact room', width: 3, depth: 3, height: 2.7 },
  { id: 'bedroom', name: 'Bedroom', width: 4, depth: 3.5, height: 2.7 },
  { id: 'living', name: 'Living room', width: 5, depth: 4, height: 2.7 },
  { id: 'open', name: 'Open space', width: 7, depth: 5, height: 3 },
];
export function parseDimensions(values) {
  const dimensions = {};
  const errors = {};
  for (const [key, label] of [['width', 'Width'], ['depth', 'Length'], ['height', 'Height']]) {
    const value = values[key];
    const number = Number(value);
    if ((typeof value !== 'string' && typeof value !== 'number') || String(value).trim() === '' || !Number.isFinite(number) || number < 1 || number > 30) errors[key] = `${label} must be between 1 and 30 metres.`;
    else dimensions[key] = number;
  }
  return { dimensions: Object.keys(errors).length ? null : dimensions, errors };
}
