"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "./ui/button";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface CloudinaryUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  type?: "foto" | "actividad";
  className?: string;
}

export function CloudinaryUploader({
  value,
  onChange,
  onRemove,
  type = "foto",
  className,
}: CloudinaryUploaderProps) {
  // Usamos las variables de entorno específicas según el tipo
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    type === "actividad"
      ? process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_ACTIVIDADES
      : process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET_FOTOS;

  const isActividad = type === "actividad";

  // Verificar que tenemos las variables necesarias
  if (!cloudName) {
    console.error("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME no está definido");
    return (
      <div className="text-red-500 text-sm">
        Error: Cloudinary Cloud Name no configurado
      </div>
    );
  }

  if (!uploadPreset) {
    console.error(`Upload preset para tipo "${type}" no está definido`);
    return (
      <div className="text-red-500 text-sm">
        Error: Upload preset no configurado para {type}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {value && (
        <div
          className={`relative mx-auto ${
            isActividad ? "w-full h-48 md:h-64" : "w-24 h-24"
          }`}
        >
          <Image
            src={value}
            alt={isActividad ? "Banner de la actividad" : "Foto del miembro"}
            fill
            className={`object-cover border-2 border-border dark:border-gray-600 ${
              isActividad ? "rounded-lg" : "rounded-full"
            }`}
          />
          {onRemove && (
            <Button
              type="button"
              onClick={onRemove}
              variant="destructive"
              size="sm"
              className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0"
            >
              <X className="h-2 w-2" />
            </Button>
          )}
        </div>
      )}

      <CldUploadWidget
        uploadPreset={uploadPreset}
        options={{
          multiple: false,
          resourceType: "image",
          sources: ["local", "camera"],
          maxFileSize: 5000000, // 5MB
          clientAllowedFormats: ["jpg", "png", "jpeg", "webp"],
          cloudName: cloudName,
        }}
        onSuccess={(result) => {
          if (typeof result.info === "object" && result.info?.secure_url) {
            onChange(result.info.secure_url);
          }
        }}
        onError={() => {
          alert(
            "Error al subir la imagen. Verifica la configuración de Cloudinary."
          );
        }}
      >
        {({ open }) => (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              open();
            }}
            className={`w-full text-xs ${className}`}
            size="sm"
          >
            <Upload className="h-3 w-3 mr-1" />
            {value ? "Cambiar" : isActividad ? "Subir Banner" : "Subir"}
          </Button>
        )}
      </CldUploadWidget>
    </div>
  );
}
