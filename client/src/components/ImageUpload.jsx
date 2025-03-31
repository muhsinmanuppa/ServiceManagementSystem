import { useState, useRef } from 'react';

const ImageUpload = ({ 
  existingImages = [], 
  onImagesChange, 
  maxImages = 5,
  accept = "image/*" 
}) => {
  const [previewUrls, setPreviewUrls] = useState(existingImages);
  const fileInputRef = useRef(null);

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    
    // Validate file count
    if (files.length + previewUrls.length > maxImages) {
      alert(`Maximum ${maxImages} images allowed`);
      return;
    }
    
    // Validate file types and size
    const validFiles = files.filter(file => {
      const isValid = file.type.startsWith('image/');
      const isWithinSize = file.size <= 5 * 1024 * 1024; // 5MB limit
      return isValid && isWithinSize;
    });

    if (validFiles.length !== files.length) {
      alert('Some files were skipped. Only images under 5MB are allowed.');
    }

    // Create preview URLs
    const newPreviewUrls = validFiles.map(file => URL.createObjectURL(file));
    setPreviewUrls([...previewUrls, ...newPreviewUrls]);
    
    // Pass files to parent component
    onImagesChange([...existingImages, ...validFiles]);
  };

  const removeImage = (index) => {
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);
    setPreviewUrls(updatedPreviews);
    
    // Get current files and remove the one at index
    const currentFiles = fileInputRef.current.files;
    const remainingFiles = Array.from(currentFiles).filter((_, i) => i !== index);
    onImagesChange(remainingFiles);
  };

  return (
    <div>
      <div className="d-flex flex-wrap gap-2 mb-3">
        {previewUrls.map((url, index) => (
          <div key={index} className="position-relative" style={{ width: '100px', height: '100px' }}>
            <img
              src={url}
              alt={`Preview ${index + 1}`}
              className="img-thumbnail"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
            <button
              type="button"
              className="btn btn-danger btn-sm position-absolute top-0 end-0"
              onClick={() => removeImage(index)}
              style={{ padding: '0.1rem 0.4rem' }}
            >
              ×
            </button>
          </div>
        ))}
      </div>

      {previewUrls.length < maxImages && (
        <div className="mb-3">
          <input
            type="file"
            className="form-control"
            accept={accept}
            multiple
            onChange={handleFileSelect}
            ref={fileInputRef}
          />
          <small className="text-muted d-block mt-1">
            Maximum {maxImages} images. Each image should be less than 5MB.
          </small>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
