"use client";

import { CldUploadWidget } from "next-cloudinary";
import { Button } from "./ui/button";
import { Upload, X } from "lucide-react";
import Image from "next/image";

interface CloudinaryUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
}

export function CloudinaryUploader({
  value,
  onChange,
  onRemove,
}: CloudinaryUploaderProps) {
  // Usamos las variables de entorno que ahora funcionan correctamente
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET;

  return (
    <div className="space-y-3">
      {value && (
        <div className="relative w-24 h-24 mx-auto">
          <Image
            src={value}
            alt="Foto del miembro"
            fill
            className="object-cover rounded-full border-2 border-gray-200"
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
          clientAllowedFormats: ["image"],
          cloudName: cloudName,
        }}
        onSuccess={(result) => {
          if (typeof result.info === "object" && result.info?.secure_url) {
            onChange(result.info.secure_url);
          }
        }}
      >
        {({ open }) => (
          <Button
            type="button"
            variant="outline"
            onClick={() => open()}
            className="w-full text-xs"
            size="sm"
          >
            <Upload className="h-3 w-3 mr-1" />
            {value ? "Cambiar" : "Subir"}
          </Button>
        )}
      </CldUploadWidget>
    </div>
  );
}
