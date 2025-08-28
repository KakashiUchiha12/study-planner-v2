// Mock upload service for testing file uploads without external services
export interface MockUploadResult {
  url: string
  uploadedBy: string
  // Add file data for local previews
  fileObject?: File
  fileName: string
  fileType: string
  fileSize: number
}

export interface MockUploadProgress {
  progress: number
  uploaded: number
  total: number
}

// Store uploaded files in memory for local previews
const uploadedFiles = new Map<string, File>()

export const simulateUploadProgress = async (
  file: File,
  onProgress?: (progress: MockUploadProgress) => void
): Promise<MockUploadResult> => {
  const total = file.size
  let uploaded = 0
  const chunkSize = Math.max(1, Math.floor(total / 100))
  
  return new Promise((resolve) => {
    const interval = setInterval(() => {
      uploaded += chunkSize
      if (uploaded >= total) {
        uploaded = total
        clearInterval(interval)
        
        // Create a unique ID for the file
        const fileId = `${file.name}-${Date.now()}`
        
        // Store the file for local access
        uploadedFiles.set(fileId, file)
        
        // Create a local object URL for preview
        const objectUrl = URL.createObjectURL(file)
        
        resolve({
          url: objectUrl,
          uploadedBy: 'test-user',
          fileObject: file,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size
        })
      } else {
        onProgress?.({
          progress: Math.round((uploaded / total) * 100),
          uploaded,
          total
        })
      }
    }, 50) // Simulate upload speed
  })
}

export const mockUploadFiles = async (
  endpoint: string,
  options: { files: File[] }
): Promise<MockUploadResult[]> => {
  const results: MockUploadResult[] = []
  
  for (const file of options.files) {
    try {
      const result = await simulateUploadProgress(file, (progress) => {
        console.log(`Upload progress for ${file.name}: ${progress.progress}%`)
      })
      results.push(result)
    } catch (error) {
      console.error(`Failed to upload ${file.name}:`, error)
      // Create fallback result with file data
      const fileId = `error-${file.name}-${Date.now()}`
      uploadedFiles.set(fileId, file)
      const objectUrl = URL.createObjectURL(file)
      
      results.push({
        url: objectUrl,
        uploadedBy: 'test-user',
        fileObject: file,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size
      })
    }
  }
  
  return results
}

// Function to get stored file by ID
export const getUploadedFile = (fileId: string): File | undefined => {
  return uploadedFiles.get(fileId)
}

// Function to clean up object URLs when files are no longer needed
export const cleanupFileUrl = (url: string) => {
  if (url.startsWith('blob:')) {
    URL.revokeObjectURL(url)
  }
}

export const validateFile = (file: File): { valid: boolean; error?: string } => {
  const maxSize = 10 * 1024 * 1024 // 10MB
  const allowedTypes = [
    'image/', 'application/pdf', 'text/', 'video/', 'audio/',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-excel'
  ]
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      error: `File size (${(file.size / 1024 / 1024).toFixed(1)}MB) exceeds limit of 10MB` 
    }
  }
  
  const isAllowedType = allowedTypes.some(type => 
    file.type.startsWith(type) || file.type === type
  )
  
  if (!isAllowedType) {
    return { 
      valid: false, 
      error: `File type ${file.type} is not supported` 
    }
  }
  
  return { valid: true }
}
