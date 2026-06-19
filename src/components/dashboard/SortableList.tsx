'use client';
import React, { useState, useRef } from 'react';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SortableItem {
  id: string;
  [key: string]: any;
}

interface SortableListProps {
  items: SortableItem[];
  onReorder: (newItems: SortableItem[]) => void;
  renderItem: (item: SortableItem, index: number) => React.ReactNode;
}

export function SortableList({ items, onReorder, renderItem }: SortableListProps) {
  const [draggedIdx, setDraggedIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const dragNodeRef = useRef<HTMLElement | null>(null);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    dragNodeRef.current = e.currentTarget;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/html', e.currentTarget.parentElement?.innerHTML || '');
    setTimeout(() => {
      setDraggedIdx(idx);
    }, 0);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, idx: number) => {
    e.preventDefault();
    if (idx !== dragOverIdx) {
      setDragOverIdx(idx);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDragEnd = () => {
    if (draggedIdx !== null && dragOverIdx !== null && draggedIdx !== dragOverIdx) {
      const newItems = [...items];
      const [removed] = newItems.splice(draggedIdx, 1);
      newItems.splice(dragOverIdx, 0, removed);
      // Update sort_order implicitly based on new array order
      onReorder(newItems);
    }
    setDraggedIdx(null);
    setDragOverIdx(null);
    dragNodeRef.current = null;
  };

  return (
    <div className="space-y-2">
      {items.map((item, idx) => {
        const isDragged = draggedIdx === idx;
        const isDragOver = dragOverIdx === idx;
        const dropPosition = isDragOver ? (draggedIdx !== null && draggedIdx < idx ? 'bottom' : 'top') : null;

        return (
          <div
            key={item.id}
            draggable
            onDragStart={(e) => handleDragStart(e, idx)}
            onDragEnter={(e) => handleDragEnter(e, idx)}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
            className={cn(
              'group relative flex items-center gap-3 rounded-xl border border-slate-200/60 bg-white p-3 shadow-sm transition-all',
              isDragged && 'opacity-0',
              !isDragged && 'hover:border-blue-200 hover:shadow-md cursor-grab active:cursor-grabbing',
              dropPosition === 'top' && 'border-t-2 border-t-blue-500 rounded-t-none',
              dropPosition === 'bottom' && 'border-b-2 border-b-blue-500 rounded-b-none'
            )}
          >
            <div className="flex items-center justify-center text-slate-300 group-hover:text-slate-500 cursor-grab px-1 shrink-0">
              <GripVertical className="h-5 w-5" />
            </div>
            <div className="flex-1 flex items-center min-w-0">
              {renderItem(item, idx)}
            </div>
          </div>
        );
      })}
      {items.length === 0 && (
        <div className="p-8 text-center text-slate-500 text-sm border-2 border-dashed border-slate-200 rounded-xl">
          No items found. Add one to get started.
        </div>
      )}
    </div>
  );
}
