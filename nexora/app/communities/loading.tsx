import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function CommunitiesLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-3 w-20 rounded-md" />
      <Skeleton className="h-8 w-72 rounded-xl" />
      <Skeleton className="h-28 w-full" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
        <Skeleton className="h-36 w-full" />
      </div>
    </SkeletonPage>
  );
}
