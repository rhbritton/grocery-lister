export const serializeData = (data: any): any => {
  if (!data) return data;
  if (typeof data.toMillis === 'function') return data.toMillis();
  if (Array.isArray(data)) return data.map(serializeData);
  if (typeof data === 'object') {
    const serialized: any = {};
    for (const key in data) {
      serialized[key] = serializeData(data[key]);
    }
    return serialized;
  }
  return data;
};