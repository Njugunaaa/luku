import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";

import { cn } from "@/lib/utils";

interface ImageSliderProps extends React.HTMLAttributes<HTMLDivElement> {
  images: string[];
  interval?: number;
}

const ImageSlider = React.forwardRef<HTMLDivElement, ImageSliderProps>(
  ({ images, interval = 5000, className, ...props }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0);

    React.useEffect(() => {
      if (images.length === 0) {
        setCurrentIndex(0);
        return;
      }

      setCurrentIndex((prevIndex) => Math.min(prevIndex, images.length - 1));
    }, [images]);

    React.useEffect(() => {
      if (images.length <= 1) return;

      const timer = window.setInterval(() => {
        setCurrentIndex((prevIndex) =>
          prevIndex === images.length - 1 ? 0 : prevIndex + 1
        );
      }, interval);

      return () => window.clearInterval(timer);
    }, [images, interval]);

    if (images.length === 0) {
      return (
        <div
          ref={ref}
          className={cn("relative h-full w-full overflow-hidden bg-background", className)}
          {...props}
        />
      );
    }

    return (
      <div
        ref={ref}
        className={cn("relative h-full w-full overflow-hidden bg-background", className)}
        {...props}
      >
        <AnimatePresence initial={false} mode="wait">
          <motion.img
            key={images[currentIndex]}
            src={images[currentIndex]}
            alt={`Slide ${currentIndex + 1}`}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.7, ease: "easeInOut" }}
            className="absolute inset-0 h-full w-full object-cover"
          />
        </AnimatePresence>

        {images.length > 1 && (
          <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
            {images.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "h-2.5 w-2.5 rounded-full border border-white/40 transition-colors duration-300",
                  currentIndex === index
                    ? "bg-white"
                    : "bg-white/35 hover:bg-white/75"
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>
    );
  }
);

ImageSlider.displayName = "ImageSlider";

export { ImageSlider };
