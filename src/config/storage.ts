/** Private bucket names. Both are created by supabase/schema.sql. */
export const BUCKETS = {
  covers: "covers",
  previews: "previews",
} as const;

export type BucketName = (typeof BUCKETS)[keyof typeof BUCKETS];
