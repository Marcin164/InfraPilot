export const buildQuery = (params: Record<string, any>) => {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (!value || value.length === 0) return;

    if (Array.isArray(value)) {
      value.forEach((v) => searchParams.append(key, v));
    } else {
      searchParams.append(key, String(value));
    }
  });

  return searchParams.toString();
};
