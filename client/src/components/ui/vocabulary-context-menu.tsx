import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";

interface VocabularyContextMenuProps {
  x: number;
  y: number;
  selectedWord: string;
  onAddToVocabulary: (word: string) => void;
  onClose: () => void;
  containerRef: React.RefObject<HTMLElement>;
}

export function VocabularyContextMenu({
  x,
  y,
  selectedWord,
  onAddToVocabulary,
  onClose,
  containerRef,
}: VocabularyContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ left: 0, top: 0 });
  
  // Calculate the proper position when the component mounts or coordinates change
  useEffect(() => {
    if (menuRef.current && containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const menuRect = menuRef.current.getBoundingClientRect();
      
      // Calculate position relative to the container with scroll offsets
      let left = x - containerRect.left + containerRef.current.scrollLeft;
      let top = y - containerRect.top + containerRef.current.scrollTop;
      
      // Ensure the menu doesn't go outside the viewport
      const rightEdge = left + menuRect.width;
      const bottomEdge = top + menuRect.height;
      
      // Adjust if menu would extend outside the right edge of the viewport
      if (rightEdge > window.innerWidth) {
        left = Math.max(0, left - menuRect.width);
      }
      
      // Adjust if menu would extend outside the bottom edge of the viewport
      if (bottomEdge > window.innerHeight) {
        top = Math.max(0, top - menuRect.height);
      }
      
      setPosition({ left, top });
    }
  }, [x, y, containerRef]);
  
  // Handle click outside to close the menu
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose();
      }
    }
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  // Add word to vocabulary and close the menu
  const handleAddToVocabulary = () => {
    onAddToVocabulary(selectedWord);
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="absolute z-50 bg-white dark:bg-gray-800 shadow-md rounded-md border border-gray-200 dark:border-gray-700 py-1 w-56"
      style={{ 
        left: `${position.left}px`, 
        top: `${position.top}px`,
        maxWidth: "90vw" 
      }}
    >
      <div className="px-3 py-2 text-sm font-medium border-b border-gray-200 dark:border-gray-700">
        Selected: <span className="font-bold">{selectedWord}</span>
      </div>
      <div className="p-1">
        <Button
          variant="ghost"
          className="w-full justify-start text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-sm"
          onClick={handleAddToVocabulary}
        >
          Add to Vocabulary
        </Button>
      </div>
    </div>
  );
}