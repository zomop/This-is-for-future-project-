import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function HomeLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-3 w-16 rounded-md" />
      <Skeleton className="h-8 w-64 rounded-xl" />
      <Skeleton className="h-20 w-full" />
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-64 w-full lg:col-span-2" />
        <Skeleton className="h-64 w-full" />
      </div>
      <Skeleton className="h-40 w-full" />
    </SkeletonPage>
  );
}
