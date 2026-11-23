import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function GlobalLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-28 w-full rounded-2xl" />
      <Skeleton className="h-[520px] w-full" />
      <Skeleton className="h-4 w-48 rounded-md" />
    </SkeletonPage>
  );
}
