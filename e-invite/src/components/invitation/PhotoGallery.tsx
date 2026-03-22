"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import Image from "next/image";

interface PhotoGalleryProps {
  photos: string[];
  fontFamily?: string;
}

export default function PhotoGallery({
  photos,
  fontFamily = "Playfair Display",
}: PhotoGalleryProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  if (!photos || photos.length === 0) return null;

  return (
    <section className="py-16 px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.8 }}
        className="text-center mb-10"
      >
        <h2
          className="text-3xl md:text-4xl text-[#c9a96e] mb-3"
          style={{ fontFamily: "Great Vibes" }}
        >
          Our Gallery
        </h2>
        <div className="w-16 h-[1px] bg-[#c9a96e] mx-auto" />
      </motion.div>

      {/* Masonry-style grid */}
      <div className="max-w-4xl mx-auto grid grid-cols-2 md:grid-cols-3 gap-3">
        {photos.map((photo, i) => (
          <motion.div
            key={photo}
            className={`relative overflow-hidden rounded-lg cursor-pointer ${
              i % 5 === 0 ? "row-span-2" : ""
            }`}
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ scale: 1.03 }}
            onClick={() => setSelectedPhoto(photo)}
          >
            <div
              className={`relative w-full ${
                i % 5 === 0 ? "h-64 md:h-80" : "h-40 md:h-48"
              }`}
            >
              <Image
                src={photo}
                alt={`Wedding photo ${i + 1}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 50vw, 33vw"
              />
              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/0 hover:bg-black/20 transition-colors duration-300" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Lightbox */}
      {selectedPhoto && (
        <motion.div
          className="fixed inset-0 z-[200] bg-black/90 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setSelectedPhoto(null)}
        >
          <motion.div
            className="relative max-w-3xl max-h-[80vh] w-full"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", damping: 25 }}
          >
            <Image
              src={selectedPhoto}
              alt="Wedding photo"
              width={800}
              height={600}
              className="object-contain w-full h-auto max-h-[80vh] rounded-lg"
            />
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white rounded-full flex items-center justify-center text-black text-lg cursor-pointer shadow-lg"
            >
              &times;
            </button>
          </motion.div>
        </motion.div>
      )}
    </section>
  );
}
