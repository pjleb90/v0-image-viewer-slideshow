"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Play, Pause, ChevronLeft, ChevronRight, ImageIcon, Loader2, Volume2, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { cn } from "@/lib/utils";

const SLIDESHOW_INTERVALS = [
  { label: "2 seconds", value: 2000 },
  { label: "3 seconds", value: 3000 },
  { label: "5 seconds", value: 5000 },
  { label: "10 seconds", value: 10000 },
];

export function ImageViewer() {
  const [imageFolders, setImageFolders] = useState<Record<string, string[]>>({});
  const [selectedFolder, setSelectedFolder] = useState<string>("");
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [intervalSpeed, setIntervalSpeed] = useState(3000);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingFolders, setIsFetchingFolders] = useState(true);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio("/audio/background.mp3");
    audioRef.current.loop = true;
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Toggle audio playback
  const toggleAudio = () => {
    if (!audioRef.current) return;
    
    if (isAudioPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsAudioPlaying(!isAudioPlaying);
  };

  const images = imageFolders[selectedFolder] || [];
  const folderNames = Object.keys(imageFolders);

  // Fetch image folders from API
  useEffect(() => {
    async function fetchFolders() {
      try {
        const response = await fetch("/api/images");
        const data = await response.json();
        setImageFolders(data.folders || {});
        
        // Select first folder by default
        const folders = Object.keys(data.folders || {});
        if (folders.length > 0) {
          setSelectedFolder(folders[0]);
        }
      } catch (error) {
        console.error("Failed to fetch image folders:", error);
      } finally {
        setIsFetchingFolders(false);
      }
    }
    fetchFolders();
  }, []);

  const goToNext = useCallback(() => {
    if (images.length === 0) return;
    setIsLoading(true);
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const goToPrev = useCallback(() => {
    if (images.length === 0) return;
    setIsLoading(true);
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  // Handle folder change
  const handleFolderChange = (folder: string) => {
    setSelectedFolder(folder);
    setCurrentIndex(0);
    setIsPlaying(false);
    setIsLoading(true);
  };

  // Slideshow effect
  useEffect(() => {
    if (!isPlaying || images.length === 0) return;

    const interval = setInterval(goToNext, intervalSpeed);
    return () => clearInterval(interval);
  }, [isPlaying, intervalSpeed, goToNext, images.length]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") goToNext();
      if (e.key === "ArrowLeft") goToPrev();
      if (e.key === " ") {
        e.preventDefault();
        setIsPlaying((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [goToNext, goToPrev]);

  // Loading state while fetching folders
  if (isFetchingFolders) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
          <p className="text-muted-foreground">Loading image folders...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full bg-background">
      {/* Main Image Area */}
      <div className="relative flex-1 flex items-center justify-center overflow-hidden">
        {/* Image Container */}
        <div className="relative w-full h-full">
          {images.length > 0 ? (
            <>
              {/* Current Image */}
              <div
                key={`${selectedFolder}-${currentIndex}`}
                className={cn(
                  "absolute inset-0 flex items-center justify-center transition-opacity duration-500",
                  isLoading ? "opacity-0" : "opacity-100"
                )}
              >
                <img
                  src={images[currentIndex]}
                  alt={`${selectedFolder} image ${currentIndex + 1}`}
                  className="max-w-full max-h-full object-contain"
                  onLoad={() => setIsLoading(false)}
                  onError={() => setIsLoading(false)}
                />
              </div>

              {/* Loading State */}
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full animate-spin" />
                </div>
              )}

              {/* Navigation Arrows */}
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm"
                onClick={goToPrev}
              >
                <ChevronLeft className="h-6 w-6" />
                <span className="sr-only">Previous image</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full bg-background/50 hover:bg-background/80 backdrop-blur-sm md:right-[340px]"
                onClick={goToNext}
              >
                <ChevronRight className="h-6 w-6" />
                <span className="sr-only">Next image</span>
              </Button>

              {/* Image Counter */}
              <div className="absolute bottom-4 left-4 px-3 py-1.5 rounded-full bg-background/70 backdrop-blur-sm text-sm font-medium">
                {currentIndex + 1} / {images.length}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-muted-foreground">
              <ImageIcon className="h-16 w-16" />
              <p>{folderNames.length === 0 ? "No image folders found" : "No images in this folder"}</p>
              <p className="text-sm">Add images to public/images/[folder-name]/</p>
            </div>
          )}
        </div>
      </div>

      {/* Right Sidebar Controls */}
      <div className="w-80 border-l border-border bg-card p-6 flex flex-col gap-6">
        <div className="space-y-2">
          <h1 className="text-xl font-semibold tracking-tight">Image Viewer</h1>
          <p className="text-sm text-muted-foreground">
            Select a folder and start the slideshow
          </p>
        </div>

        {/* Folder Selection */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Image Folder</label>
          <Select value={selectedFolder} onValueChange={handleFolderChange}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a folder" />
            </SelectTrigger>
            <SelectContent>
              {folderNames.map((folder) => (
                <SelectItem key={folder} value={folder}>
                  {folder} ({imageFolders[folder].length} images)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Slideshow Speed */}
        <div className="space-y-3">
          <label className="text-sm font-medium">Slideshow Speed</label>
          <Select
            value={intervalSpeed.toString()}
            onValueChange={(val) => setIntervalSpeed(parseInt(val))}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SLIDESHOW_INTERVALS.map((interval) => (
                <SelectItem
                  key={interval.value}
                  value={interval.value.toString()}
                >
                  {interval.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Play/Pause Button */}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={() => setIsPlaying((prev) => !prev)}
          disabled={images.length === 0}
        >
          {isPlaying ? (
            <>
              <Pause className="h-5 w-5" />
              Pause Slideshow
            </>
          ) : (
            <>
              <Play className="h-5 w-5" />
              Start Slideshow
            </>
          )}
        </Button>

        {/* Progress Slider */}
        {images.length > 1 && (
          <div className="space-y-3">
            <label className="text-sm font-medium">Navigate</label>
            <Slider
              value={[currentIndex]}
              min={0}
              max={images.length - 1}
              step={1}
              onValueChange={(value) => {
                setCurrentIndex(value[0]);
                setIsLoading(true);
              }}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Image 1</span>
              <span>Image {images.length}</span>
            </div>
          </div>
        )}

        {/* Thumbnail Grid */}
        {images.length > 0 && (
          <div className="space-y-3 flex-1 overflow-hidden">
            <label className="text-sm font-medium">Thumbnails</label>
            <div className="grid grid-cols-3 gap-2 overflow-y-auto max-h-[300px] pr-1">
              {images.map((img, idx) => (
                <button
                  key={img}
                  onClick={() => {
                    setCurrentIndex(idx);
                    setIsLoading(true);
                  }}
                  className={cn(
                    "relative aspect-video rounded-md overflow-hidden border-2 transition-all",
                    currentIndex === idx
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-transparent hover:border-muted-foreground/30"
                  )}
                >
                  <img
                    src={img}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Keyboard Shortcuts */}
        <div className="mt-auto pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground">
            Keyboard shortcuts: ← → to navigate, Space to play/pause
          </p>
        </div>

        {/* Audio Control */}
        <Button
          variant="outline"
          size="lg"
          className="w-full gap-2"
          onClick={toggleAudio}
        >
          {isAudioPlaying ? (
            <>
              <VolumeX className="h-5 w-5" />
              Stop Music
            </>
          ) : (
            <>
              <Volume2 className="h-5 w-5" />
              Play Music
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
