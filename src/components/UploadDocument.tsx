"use client";

import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { BACKEND_URL } from '../lib/config';

interface UploadDocumentProps {
  onExtractComplete: (extractedData: any, documentUrls: string[]) => void;
}

export default function UploadDocument({ onExtractComplete }: UploadDocumentProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    setError(null);
    setSuccess(false);
    setIsUploading(true);

    try {
      const publicUrls: string[] = [];

      // 1. Subir todos los archivos a Supabase
      for (const file of acceptedFiles) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        const filePath = `uploads/${fileName}`;

        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('raw_documents')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Error subiendo archivo ${file.name}: ${uploadError.message}`);
        }

        const { data: publicUrlData } = supabase.storage
          .from('raw_documents')
          .getPublicUrl(filePath);

        publicUrls.push(publicUrlData.publicUrl);
      }

      setIsUploading(false);
      setIsAnalyzing(true);

      // 2. Enviar a nuestro Backend (FastAPI) para extraer datos puros
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
      
      // Pasar los datos extraídos al Dashboard para la fase de validación
      if (onExtractComplete) {
        onExtractComplete(resultData.datos_extraidos, resultData.document_urls);
      }

    } catch (err: any) {
      setError(err.message || "Ocurrió un error inesperado.");
    } finally {
      setIsUploading(false);
      setIsAnalyzing(false);
    }
  }, [onExtractComplete]);

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
    <div className="w-full max-w-2xl mx-auto p-6 bg-[#161b22] border border-slate-800 rounded-xl shadow-xl">
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
