"use client";

import React, { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2, Camera, Trash2, RotateCw, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BACKEND_URL } from '../lib/config';

interface UploadDocumentProps {
  onExtractComplete: (extractedData: any, documentUrls: string[]) => void;
}

interface CapturedPhoto {
  id: string;
  dataUrl: string;
  blob: Blob;
}

export default function UploadDocument({ onExtractComplete }: UploadDocumentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Estados de Cámara
  const [showCamera, setShowCamera] = useState(false);
  const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [cameraError, setCameraError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Iniciar la Cámara
  const startCamera = async (mode = facingMode) => {
    setCameraError(null);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: mode, width: { ideal: 1920 }, height: { ideal: 1080 } },
        audio: false
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err: any) {
      console.error("Error al acceder a la cámara:", err);
      setCameraError("No se pudo acceder a la cámara. Por favor verifica los permisos.");
    }
  };

  // Activar vista de Cámara
  const handleOpenCamera = () => {
    setShowCamera(true);
    setCapturedPhotos([]);
    setError(null);
    startCamera(facingMode);
  };

  // Detener y cerrar Cámara
  const handleCloseCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowCamera(false);
    setCapturedPhotos([]);
  };

  // Alternar cámara frontal/trasera (útil en móviles/tablets)
  const toggleCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  // Capturar foto actual del stream
  const capturePhoto = () => {
    if (!videoRef.current) return;

    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Dibujar el frame actual
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Convertir a Data URL para previsualización
    const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

    // Convertir a Blob para subida a Supabase
    canvas.toBlob((blob) => {
      if (blob) {
        const id = Math.random().toString(36).substring(2, 9) + "_" + Date.now();
        setCapturedPhotos(prev => [...prev, { id, dataUrl, blob }]);
      }
    }, 'image/jpeg', 0.95);
  };

  // Eliminar una foto capturada específica
  const removePhoto = (id: string) => {
    setCapturedPhotos(prev => prev.filter(photo => photo.id !== id));
  };

  // Procesar y enviar archivos
  const processAndUploadFiles = async (filesToUpload: { file?: File; blob?: Blob; name: string }[]) => {
    setError(null);
    setSuccess(false);
    setIsUploading(true);

    try {
      const publicUrls: string[] = [];

      // 1. Subir archivos a Supabase
      for (const item of filesToUpload) {
        const fileExt = item.name.split('.').pop() || 'jpg';
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const uploadPayload = item.file || item.blob;
        if (!uploadPayload) continue;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('raw_documents')
          .upload(filePath, uploadPayload);

        if (uploadError) {
          throw new Error(`Error subiendo archivo ${item.name}: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('raw_documents')
          .getPublicUrl(filePath);

        publicUrls.push(publicUrlData.publicUrl);
      }

      setIsUploading(false);
      setIsAnalyzing(true);

      // 2. Enviar a FastAPI para procesamiento e IA
      const response = await fetch(`${BACKEND_URL}/api/extract`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ document_urls: publicUrls }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Error en la extracción de IA');
      }

      const resultData = await response.json();
      setSuccess(true);
      
      // Apagar cámara
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setShowCamera(false);

      if (onExtractComplete) {
        onExtractComplete(resultData.datos_extraidos, resultData.document_urls);
      }

    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  };

  // Manejador del Dropzone para archivos cargados
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;
    const items = acceptedFiles.map(file => ({ file, name: file.name }));
    await processAndUploadFiles(items);
  }, [onExtractComplete]);

  // Enviar las fotos capturadas con la cámara
  const handleAnalyzeCapturedPhotos = async () => {
    if (capturedPhotos.length === 0) return;
    const items = capturedPhotos.map((photo, index) => ({
      blob: photo.blob,
      name: `captura_pagina_${index + 1}.jpg`
    }));
    await processAndUploadFiles(items);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({ 
    onDrop,
    accept: {
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'application/pdf': ['.pdf'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls']
    },
    multiple: true
  });

  return (
    <div className="w-full max-w-3xl mx-auto p-6 bg-[#161b22] border border-slate-800 rounded-xl shadow-xl">
      
      {/* MODO SUBIR ARCHIVO TRADICIONAL */}
      {!showCamera && (
        <>
          <h3 className="text-xl font-medium text-white mb-6 text-center">
            Subir Estado Financiero para Análisis
          </h3>
          
          <div 
            {...getRootProps()} 
            className={`border-2 border-dashed rounded-xl p-12 text-center cursor-pointer transition-all duration-200
              ${isDragActive ? 'border-indigo-500 bg-indigo-500/10' : 'border-slate-700 hover:border-indigo-400 hover:bg-slate-800/50'}
              ${(isUploading || isAnalyzing) ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input {...getInputProps()} />
            
            {isUploading || isAnalyzing ? (
              <div className="flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-12 h-12 text-indigo-400 animate-spin" />
                <p className="text-indigo-300 font-medium">
                  {isUploading ? "Subiendo archivo seguro a la nube..." : "La IA de OpenAI está extrayendo y analizando los datos..."}
                </p>
                {isAnalyzing && (
                  <p className="text-slate-400 text-sm">Este proceso puede tardar hasta 60 segundos.</p>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center space-y-4">
                <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-2">
                  <UploadCloud className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-slate-200 font-medium text-lg">
                  Arrastra y suelta tus documentos aquí
                </p>
                <p className="text-slate-400 text-sm">
                  o haz clic para seleccionar archivos (PNG, JPG, PDF, Excel)
                </p>
              </div>
            )}
          </div>

          {!isUploading && !isAnalyzing && (
            <div className="mt-6 flex flex-col items-center">
              <div className="text-slate-500 text-sm mb-4">— O BIEN —</div>
              <button 
                onClick={handleOpenCamera}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-lg transition-colors font-medium shadow-lg shadow-indigo-500/20"
              >
                <Camera size={18} />
                Tomar Fotos con la Cámara (Varias Hojas)
              </button>
            </div>
          )}
        </>
      )}

      {/* MODO CAPTURA DESDE CÁMARA */}
      {showCamera && (
        <div className="flex flex-col space-y-6">
          <div className="flex justify-between items-center border-b border-slate-800 pb-4">
            <div>
              <h3 className="text-lg font-medium text-white flex items-center gap-2">
                <Camera size={20} className="text-indigo-400" />
                Capturador de Documentos
              </h3>
              <p className="text-slate-400 text-xs mt-1">Toma fotos claras y nítidas de cada hoja del reporte</p>
            </div>
            <button 
              onClick={handleCloseCamera}
              className="text-slate-400 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-colors"
              disabled={isUploading || isAnalyzing}
            >
              <X size={20} />
            </button>
          </div>

          {cameraError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-400 text-sm">
              {cameraError}
            </div>
          )}

          {/* Video Stream Container */}
          <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              className="w-full h-full object-cover transform scale-x-100"
            />
            
            {/* Camera Overlay Guide */}
            <div className="absolute inset-8 border border-white/20 rounded pointer-events-none flex items-center justify-center">
              <div className="text-white/40 text-xs font-mono border border-white/10 px-3 py-1 bg-black/40 rounded uppercase tracking-widest">
                Alinea el documento aquí
              </div>
            </div>

            {/* Camera Control Overlays */}
            {!isUploading && !isAnalyzing && (
              <button 
                onClick={toggleCamera}
                className="absolute bottom-4 right-4 bg-slate-900/80 hover:bg-slate-800 text-white p-3 rounded-full border border-slate-700/50 transition-colors shadow-lg"
                title="Cambiar Cámara"
              >
                <RotateCw size={18} />
              </button>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <button
              onClick={capturePhoto}
              disabled={isUploading || isAnalyzing}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-xl font-bold transition-all shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50"
            >
              <Camera size={20} />
              Capturar Página ({capturedPhotos.length})
            </button>
          </div>

          {/* Thumbnails Gallery of Captured Pages */}
          {capturedPhotos.length > 0 && (
            <div className="bg-[#0f111a] border border-slate-800 rounded-xl p-4">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm font-semibold text-slate-300">Páginas capturadas ({capturedPhotos.length})</span>
                <span className="text-[10px] text-slate-500 italic">Revisa la nitidez antes de analizar</span>
              </div>
              
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-3 max-h-48 overflow-y-auto pr-1">
                {capturedPhotos.map((photo, index) => (
                  <div key={photo.id} className="relative group aspect-[3/4] bg-slate-800 rounded border border-slate-700 overflow-hidden shadow-md">
                    <img 
                      src={photo.dataUrl} 
                      alt={`Captura ${index + 1}`} 
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded leading-none">
                      Pág {index + 1}
                    </div>
                    
                    {!isUploading && !isAnalyzing && (
                      <button
                        onClick={() => removePhoto(photo.id)}
                        className="absolute top-1 right-1 bg-rose-600/90 hover:bg-rose-500 text-white p-1 rounded transition-colors"
                        title="Eliminar captura"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {/* Final submission of photos */}
              <div className="mt-5 flex justify-end gap-3 border-t border-slate-800/80 pt-4">
                <button
                  onClick={handleCloseCamera}
                  disabled={isUploading || isAnalyzing}
                  className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors text-sm font-medium border border-slate-700"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAnalyzeCapturedPhotos}
                  disabled={isUploading || isAnalyzing}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-2.5 rounded-lg font-bold text-sm transition-all disabled:opacity-50"
                >
                  {isUploading || isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    <>
                      Analizar {capturedPhotos.length} {capturedPhotos.length === 1 ? 'Página' : 'Páginas'}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Loader inline when processing camera photos */}
          {(isUploading || isAnalyzing) && capturedPhotos.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 space-y-3">
              <Loader2 className="w-10 h-10 text-indigo-400 animate-spin" />
              <p className="text-indigo-300 font-medium text-sm">
                {isUploading ? "Subiendo capturas a la nube..." : "Analizando y extrayendo balance de las imágenes..."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Alertas de Estado */}
      {error && (
        <div className="mt-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-start gap-3 text-rose-400">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mt-6 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-start gap-3 text-emerald-400">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium">¡Análisis completado con éxito! El dashboard ha sido actualizado con los nuevos datos.</p>
        </div>
      )}
    </div>
  );
}
