import { Skeleton, SkeletonPage } from "@/components/skeleton";

export default function MessagesLoading() {
  return (
    <SkeletonPage>
      <Skeleton className="h-3 w-20 rounded-md" />
      <Skeleton className="h-8 w-56 rounded-xl" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
      <Skeleton className="h-16 w-full" />
    </SkeletonPage>
  );
}
