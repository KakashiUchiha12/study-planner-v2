# Real-Time Thumbnail Generation System

This project now includes a powerful, client-side thumbnail generation system that creates beautiful thumbnails for any file type without requiring external services.

## 🚀 Features

- **Client-Side Processing**: No external API calls, works offline
- **Multiple File Types**: Images, PDFs, Videos, Text files, Office documents
- **Real-Time Generation**: Instant thumbnails as soon as files are selected
- **High Quality**: WebP format with optimized compression
- **Privacy-Focused**: Files never leave the user's browser

## 📁 Supported File Formats

### Full Thumbnail Support
- **Images**: JPEG, PNG, GIF, WebP, BMP
- **PDFs**: First page rendered using PDF.js
- **Videos**: First frame snapshot (MP4, WebM, MOV, AVI)
- **Text Files**: Styled preview with content preview (TXT, MD, JSON, etc.)

### Fallback Icons
- **Office Documents**: DOCX, XLSX, PPTX (with file-type icons)
- **Other Files**: Generic file icons

## 🛠️ How to Use

### 1. Basic Thumbnail Generation

```typescript
import { generateThumbnail } from '@/app/(lib)/thumbnails';

// Generate thumbnail for any file
const thumbnail = await generateThumbnail(file);
// Returns: data URL (image/webp) that can be used immediately
```

### 2. Dropzone Component

```typescript
import { DropzoneThumbs } from '@/app/components/DropzoneThumbs';

// Use the component anywhere in your app
<DropzoneThumbs />
```

### 3. Integration with Documents

The documents page now automatically generates thumbnails when files are uploaded:

1. Select a file in the upload dialog
2. Thumbnail is generated automatically
3. Document is created with the thumbnail
4. Thumbnail is displayed in the document card

## 🏗️ Architecture

### Core Files

- **`app/(lib)/thumbnails.ts`**: Main thumbnail generation logic
- **`app/(lib)/pdf.worker.ts`**: PDF.js worker configuration
- **`app/components/DropzoneThumbs.tsx`**: Dropzone component with thumbnails
- **`app/thumbnail-demo/page.tsx`**: Demo page showcasing all features

### Thumbnail Generation Process

1. **File Type Detection**: Automatically detects MIME type
2. **Specialized Processing**: 
   - Images: Resized with proper aspect ratio
   - PDFs: First page rendered to canvas
   - Videos: First frame captured
   - Text: Styled preview generated
3. **Canvas Processing**: All thumbnails processed through HTML5 Canvas
4. **Output**: WebP data URL ready for immediate use

## 📱 Demo Pages

- **`/thumbnail-demo`**: Full demo with all features
- **`/documents`**: Documents page with integrated thumbnails

## 🔧 Configuration

### Thumbnail Dimensions
Default: 480x360 pixels (aspect ratio: 4:3)
```typescript
const THUMB_W = 480;
const THUMB_H = 360;
```

### Output Format
- **Format**: WebP with 90% quality
- **Size**: Optimized for web use
- **Fallback**: PNG for browsers without WebP support

## 🚀 Performance Tips

1. **Lazy Loading**: Thumbnails are loaded only when needed
2. **Memory Management**: Proper cleanup of object URLs and canvases
3. **Error Handling**: Graceful fallbacks for unsupported files
4. **Batch Processing**: Multiple files processed efficiently

## 🔒 Privacy & Security

- **No External Calls**: Everything happens in the browser
- **File Isolation**: Files are never uploaded to external services
- **Local Processing**: All thumbnail generation is local
- **Data URLs**: Thumbnails are data URLs, not file uploads

## 🐛 Troubleshooting

### Common Issues

1. **PDF Thumbnails Not Working**
   - Ensure `pdfjs-dist` is installed
   - Check browser console for PDF.js errors

2. **Video Thumbnails Failing**
   - Videos must be valid and loadable
   - Some codecs may not be supported

3. **Large Files**
   - Very large files may cause memory issues
   - Consider file size limits in your UI

### Browser Support

- **Modern Browsers**: Full support (Chrome, Firefox, Safari, Edge)
- **Canvas API**: Required for thumbnail generation
- **File API**: Required for file handling
- **WebP**: Recommended for best compression

## 📈 Future Enhancements

- [ ] Server-side thumbnail generation for consistency
- [ ] Thumbnail caching and persistence
- [ ] Custom thumbnail dimensions
- [ ] Batch thumbnail generation
- [ ] Advanced video thumbnail options

## 🤝 Contributing

When adding new file type support:

1. Add detection logic in `generateThumbnail()`
2. Create specialized thumbnail function
3. Update documentation
4. Add tests if applicable

## 📄 License

This thumbnail system is part of the StudyPlanner application and follows the same license terms.
