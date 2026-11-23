import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function CommunityLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-32 w-full rounded-2xl" />
      <div className="grid gap-5 lg:grid-cols-4">
        <Skeleton className="h-[480px] w-full lg:col-span-3" />
        <div className="flex flex-col gap-5">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-56 w-full" />
        </div>
      </div>
    </SkeletonPage>
  );
}
