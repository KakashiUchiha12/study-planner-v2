const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function fixFileUrls() {
  try {
    console.log('Starting file URL fix...')
    
    // Get all materials that have content with file URLs
    const materials = await prisma.material.findMany({
      where: {
        content: {
          contains: 'C:\\\\Users'
        }
      }
    })
    
    console.log(`Found ${materials.length} materials with Windows file paths`)
    
    for (const material of materials) {
      try {
        const content = JSON.parse(material.content)
        
        if (content.files && Array.isArray(content.files)) {
          let updated = false
          
          // Update each file URL
          for (const file of content.files) {
            if (file.url && file.url.includes('C:\\\\Users')) {
              // Extract the file ID from the path or generate a new one
              const fileName = file.url.split('\\\\').pop()
              const fileId = `file-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
              
              file.url = `/api/files/${fileId}`
              updated = true
              console.log(`Updated file URL for: ${file.name}`)
            }
          }
          
          if (updated) {
            await prisma.material.update({
              where: { id: material.id },
              data: { content: JSON.stringify(content) }
            })
            console.log(`Updated material: ${material.title}`)
          }
        }
      } catch (error) {
        console.error(`Error processing material ${material.id}:`, error)
      }
    }
    
    console.log('File URL fix completed!')
  } catch (error) {
    console.error('Error fixing file URLs:', error)
  } finally {
    await prisma.$disconnect()
  }
}

fixFileUrls()
