import React, { useRef, useState } from 'react';
import { Upload, Camera, AlertCircle, Video } from 'lucide-react';
import { validateImage, compressImage } from '@/utils/imageValidation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/custom-button';

interface ImageUploadProps {
  onImageSelect: (file: File) => void;
  isLoading?: boolean;
  error?: string | null;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  isLoading = false,
  error = null,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [dragActive, setDragActive] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);

  const handleFile = async (file: File) => {
    setLocalError(null);
    
    // Validar imagen
    const validation = await validateImage(file);
    if (!validation.valid) {
      setLocalError(validation.error || 'Imagen no válida');
      return;
    }

    // Comprimir si es necesario
    const processedFile = await compressImage(file);
    onImageSelect(processedFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFile(file);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };

  const startCamera = async () => {
    try {
      setLocalError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: 'environment', // Usar cámara trasera si está disponible
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });
      
      setStream(mediaStream);
      setShowCamera(true);
      
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      setLocalError('No se pudo acceder a la cámara. Verifica los permisos.');
      console.error('Error accessing camera:', err);
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setShowCamera(false);
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');

    if (!context) return;

    // Configurar canvas con las dimensiones del video
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    // Dibujar el frame actual del video en el canvas
    context.drawImage(video, 0, 0);

    // Convertir canvas a blob y crear archivo
    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `photo-${Date.now()}.jpg`, {
          type: 'image/jpeg',
          lastModified: Date.now()
        });
        
        stopCamera();
        handleFile(file);
      }
    }, 'image/jpeg', 0.9);
  };

  // Cleanup al desmontar el componente
  React.useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const displayError = error || localError;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Camera Modal */}
      {showCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl p-6 max-w-lg w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Cámara</h3>
              <Button variant="outline" size="sm" onClick={stopCamera}>
                Cerrar
              </Button>
            </div>
            
            <div className="relative mb-4">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="w-full rounded-lg"
                style={{ maxHeight: '300px' }}
              />
            </div>
            
            <div className="flex justify-center">
              <Button variant="gradient" onClick={capturePhoto}>
                <Camera className="w-4 h-4 mr-2" />
                Capturar Foto
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden elements for photo capture */}
      <canvas ref={canvasRef} className="hidden" />

      <div
        className={cn(
          "relative border-2 border-dashed rounded-2xl p-8 transition-all",
          dragActive
            ? "border-primary bg-primary/5 scale-105"
            : "border-border hover:border-primary/50",
          isLoading && "opacity-50 pointer-events-none",
          displayError && "border-destructive"
        )}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setDragActive(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png"
          onChange={handleChange}
          className="hidden"
          disabled={isLoading}
        />

        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="p-4 bg-primary/10 rounded-full">
            {dragActive ? (
              <Upload className="w-12 h-12 text-primary animate-pulse" />
            ) : (
              <Camera className="w-12 h-12 text-primary" />
            )}
          </div>

          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-foreground">
              {dragActive ? "Suelta la imagen aquí" : "Captura o sube una imagen"}
            </h3>
            <div className="flex flex-col sm:flex-row gap-2 items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Arrastra y suelta o{" "}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-primary hover:text-primary-dark font-medium underline"
                  disabled={isLoading}
                >
                  selecciona un archivo
                </button>
              </p>
              <span className="text-muted-foreground hidden sm:inline">•</span>
              <Button
                variant="outline"
                size="sm"
                onClick={startCamera}
                disabled={isLoading}
                className="flex items-center gap-2"
              >
                <Video className="w-4 h-4" />
                Usar Cámara
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              JPG, PNG • Máx. 5MB • Mín. 200x200px
            </p>
          </div>

          {displayError && (
            <div className="flex items-center gap-2 text-destructive text-sm bg-destructive/10 px-4 py-2 rounded-lg">
              <AlertCircle className="w-4 h-4" />
              <span>{displayError}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};