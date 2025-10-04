"use client";

import { Button } from "@/components/ui/button";

export function FeedFilters() {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button variant="outline" size="sm">All</Button>
      <Button variant="outline" size="sm">Text</Button>
      <Button variant="outline" size="sm">Images</Button>
      <Button variant="outline" size="sm">Files</Button>
      <Button variant="outline" size="sm">My Communities</Button>
    </div>
  );
}


