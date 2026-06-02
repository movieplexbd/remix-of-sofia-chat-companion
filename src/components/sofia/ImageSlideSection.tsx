import { SofiaSlide } from '../../types/sofia';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';

interface ImageSlideSectionProps {
  slides: SofiaSlide[];
  selectedId: string | null;
  onSelect: (slide: SofiaSlide) => void;
}

export default function ImageSlideSection({ slides, selectedId, onSelect }: ImageSlideSectionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  if (!slides || slides.length === 0) return null;

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const currentSlide = slides[currentIndex];

  return (
    <div className="px-4 py-6 border-b bg-background relative group">
      <div className="flex items-center justify-between mb-4 px-2">
        <h3 className="font-bold text-lg text-primary">{currentSlide.heading}</h3>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={prevSlide} className="h-8 w-8 rounded-full">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={nextSlide} className="h-8 w-8 rounded-full">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {[currentSlide.image1, currentSlide.image2].map((img, idx) => (
          <div 
            key={idx}
            className="relative aspect-[3/4] rounded-2xl overflow-hidden shadow-lg cursor-pointer transition-all hover:ring-2 hover:ring-primary/50 group/img"
            onClick={() => onSelect(currentSlide)}
          >
            <img 
              src={img} 
              alt={`${currentSlide.heading} ${idx + 1}`} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover/img:scale-110"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/300x400?text=Sofia+Image';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3 opacity-0 group-hover/img:opacity-100 transition-opacity">
              <span className="text-white text-xs font-medium">ট্যাপ করে সিলেক্ট করুন</span>
            </div>
            {selectedId === currentSlide.id && (
              <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1 shadow-md animate-in zoom-in duration-300">
                <CheckCircle2 className="w-4 h-4" />
              </div>
            )}
          </div>
        ))}
      </div>
      
      <div className="flex justify-center gap-1.5 mt-4">
        {slides.map((_, idx) => (
          <div 
            key={idx}
            className={`h-1.5 rounded-full transition-all ${idx === currentIndex ? 'w-6 bg-primary' : 'w-1.5 bg-primary/20'}`}
          />
        ))}
      </div>
    </div>
  );
}
