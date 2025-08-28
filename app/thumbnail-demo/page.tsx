"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function ThumbnailDemoPage() {
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>Thumbnail Demo</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Thumbnail functionality has been moved to a different location.</p>
        </CardContent>
      </Card>
    </div>
  )
}
