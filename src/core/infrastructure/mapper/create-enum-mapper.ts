// utils/mapper.ts
export function createEnumMapper<T extends string, U extends string>(map: Record<T, U>) {
  // Buat mapping kebalikannya secara otomatis
  const reverseMap = Object.fromEntries(
    Object.entries(map).map(([k, v]) => [v, k])
  ) as Record<U, T>;

  return {
    toPersistence: (key: T): U => map[key],
    toEntity: (key: U): T => reverseMap[key],
    // Helper untuk handle nilai optional/undefined
    toPersistenceSafe: (key?: T | null): U | undefined => (key ? map[key] : undefined),
    toEntitySafe: (key?: U | null): T | undefined => (key ? reverseMap[key] : undefined),
  };
}