import { createUploadthing, type FileRouter } from "uploadthing/next"

const f = createUploadthing()

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
  // Define as many FileRoutes as you like, each with a unique routeSlug
  studyMaterialUploader: f({ image: { maxFileSize: "4MB", maxFileCount: 5 }, pdf: { maxFileSize: "16MB", maxFileCount: 10 } })
    // Set permissions and file types for this FileRoute
    .middleware(async ({ req }) => {
      // This code runs on your server before upload
      // Whatever is returned here is accessible in onUploadComplete as `metadata`
      return { userId: "user-id" } // You can get this from your auth
    })
    .onUploadComplete(async ({ metadata, file }) => {
      // This code RUNS ON YOUR SERVER after upload
      console.log("Upload complete for userId:", metadata.userId)
      console.log("file url", file.url)
      
      // Return anything you want to be accessible on the client
      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
