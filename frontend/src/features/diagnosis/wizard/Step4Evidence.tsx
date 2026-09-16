import React from 'react';
import { UploadCloud, X, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useDiagnosisWizard } from './DiagnosisWizardContext';

interface Props {
  onNext: () => void;
  onPrev: () => void;
}

export const Step4Evidence: React.FC<Props> = ({ onNext, onPrev }) => {
  const { uploadedImages, setUploadedImages } = useDiagnosisWizard();

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    // In a real app we'd validate file sizes/types here
    
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        if (uploadEvent.target?.result) {
          setUploadedImages([
            ...uploadedImages,
            { url: uploadEvent.target!.result as string, name: file.name, file },
          ]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setUploadedImages(uploadedImages.filter((_, i) => i !== index));
  };

  const canProceed = uploadedImages.length > 0;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="border-b pb-4">
        <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
          <UploadCloud className="text-emerald-600" />
          Evidence Upload
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Upload clear images of the affected plant parts. Good evidence is required for accurate AI analysis.
        </p>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3 text-blue-800 text-sm">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <strong>Photo Guidelines:</strong> Ensure good lighting, avoid blur, and try to capture both the healthy and affected tissue in the frame if possible.
        </div>
      </div>

      <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:bg-slate-50 transition-colors">
        <UploadCloud className="w-12 h-12 text-slate-400 mx-auto mb-4" />
        <h3 className="text-sm font-semibold text-slate-700">Drag & Drop images here</h3>
        <p className="text-xs text-slate-500 mt-1 mb-4">Support for JPG, PNG (Max 10MB per file)</p>
        
        <input
          type="file"
          id="file-upload"
          multiple
          accept="image/*"
          className="hidden"
          onChange={handleImageFileChange}
        />
        <label
          htmlFor="file-upload"
          className="inline-block bg-white border border-slate-300 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-50 cursor-pointer shadow-sm transition-all"
        >
          Browse Files
        </label>
      </div>

      {uploadedImages.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mt-6">
          {uploadedImages.map((img, idx) => (
            <div key={idx} className="relative group rounded-lg overflow-hidden border border-slate-200 shadow-sm aspect-square bg-slate-100">
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => removeImage(idx)}
                  className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 shadow-lg transform hover:scale-105 transition-all"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="absolute bottom-0 left-0 right-0 bg-black/60 p-2 text-[10px] text-white truncate">
                {img.name}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex justify-between pt-6 border-t mt-8">
        <button
          onClick={onPrev}
          className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-6 py-2 rounded-lg font-medium transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <button
          onClick={onNext}
          disabled={!canProceed}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next: Quality Check
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
