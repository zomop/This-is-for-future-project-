import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function ProfileLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-3 w-20 rounded-md" />
      <Skeleton className="h-8 w-72 rounded-xl" />
      <Skeleton className="h-[380px] w-full" />
      <Skeleton className="h-72 w-full" />
    </SkeletonPage>
  );
}
