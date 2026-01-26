// utils/mapper.ts
export function createMapper<T extends string, U extends string>(map: Record<T, U>) {
  // Buat mapping kebalikannya secara otomatis
  const reverseMap = Object.fromEntries(
    Object.entries(map).map(([k, v]) => [v, k])
  ) as Record<U, T>;

  return {
    toPrisma: (key: T): U => map[key],
    toEntity: (key: U): T => reverseMap[key],
    // Helper untuk handle nilai optional/undefined
    toPrismaSafe: (key?: T | null): U | undefined => (key ? map[key] : undefined),
    toEntitySafe: (key?: U | null): T | undefined => (key ? reverseMap[key] : undefined),
  };
}