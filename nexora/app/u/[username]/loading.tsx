import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function PublicProfileLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-4 w-14 rounded-md" />
      <Skeleton className="h-[380px] w-full" />
      <Skeleton className="h-56 w-full" />
    </SkeletonPage>
  );
}
