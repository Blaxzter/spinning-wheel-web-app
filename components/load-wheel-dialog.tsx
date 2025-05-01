"use client";

import { useState, useEffect } from "react";
import type { WheelData, WheelOption } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Trash,
  Pencil,
  Check,
  X,
  AlertCircle,
  CheckCircle2,
  BookmarkIcon,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  getPredefinedWheelsCatalog,
  loadPredefinedWheel,
} from "@/lib/predefined-wheels";
import type { WheelCatalogItem } from "@/lib/predefined-wheels";

interface LoadWheelDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  savedWheels: { name: string; data: WheelData }[];
  onLoadWheel: (wheelData: WheelData) => void;
  onDeleteWheel: (wheelName: string) => void;
  onRenameWheel: (oldName: string, newName: string) => void;
}

export function LoadWheelDialog({
  isOpen,
  onOpenChange,
  savedWheels,
  onLoadWheel,
  onDeleteWheel,
  onRenameWheel,
}: LoadWheelDialogProps) {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [wheelToDelete, setWheelToDelete] = useState<string | null>(null);
  const [editingWheel, setEditingWheel] = useState<string | null>(null);
  const [newWheelName, setNewWheelName] = useState("");
  const [statusMessage, setStatusMessage] = useState<{
    text: string;
    type: "success" | "error";
  } | null>(null);
  const [wheelCatalog, setWheelCatalog] = useState<WheelCatalogItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);
  const [isLoadingWheel, setIsLoadingWheel] = useState(false);

  // Clear status message after a delay
  useEffect(() => {
    if (statusMessage) {
      const timer = setTimeout(() => {
        setStatusMessage(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [statusMessage]);

  // Load predefined wheels catalog on dialog open
  useEffect(() => {
    if (isOpen) {
      loadWheelCatalog();
    }
  }, [isOpen]);

  // Function to load the wheel catalog
  const loadWheelCatalog = async () => {
    setIsLoadingCatalog(true);
    try {
      const catalog = await getPredefinedWheelsCatalog();
      setWheelCatalog(catalog);
    } catch (error) {
      console.error("Error loading wheel catalog:", error);
      setStatusMessage({
        text: "Failed to load predefined wheels catalog",
        type: "error",
      });
    } finally {
      setIsLoadingCatalog(false);
    }
  };

  // Function to load a specific wheel
  const handleLoadPredefinedWheel = async (filename: string, id: string) => {
    setIsLoadingWheel(true);
    try {
      const wheelData = await loadPredefinedWheel(filename);
      if (wheelData) {
        onLoadWheel({ ...wheelData, slug: id });
        onOpenChange(false);
      } else {
        throw new Error("Failed to load wheel");
      }
    } catch (error) {
      console.error("Error loading predefined wheel:", error);
      setStatusMessage({
        text: "Failed to load predefined wheel",
        type: "error",
      });
    } finally {
      setIsLoadingWheel(false);
    }
  };

  // Start editing a wheel name
  const handleStartEdit = (wheelName: string) => {
    setEditingWheel(wheelName);
    setNewWheelName(wheelName);
  };

  // Confirm renaming a wheel
  const handleConfirmRename = (oldName: string) => {
    if (newWheelName.trim() !== "" && newWheelName !== oldName) {
      onRenameWheel(oldName, newWheelName);
      setStatusMessage({
        text: `Renamed "${oldName}" to "${newWheelName}"`,
        type: "success",
      });
    }
    setEditingWheel(null);
  };

  // Start the delete confirmation process
  const handleDeleteClick = (wheelName: string) => {
    setWheelToDelete(wheelName);
    setDeleteConfirmOpen(true);
  };

  // Confirm wheel deletion
  const confirmDelete = () => {
    if (wheelToDelete) {
      onDeleteWheel(wheelToDelete);
      setStatusMessage({ text: `Deleted "${wheelToDelete}"`, type: "success" });
      setDeleteConfirmOpen(false);
      setWheelToDelete(null);
    }
  };

  // Get a preview of the wheel options (first 3 options)
  const getOptionsPreview = (options: WheelOption[]) => {
    const enabledOptions = options.filter((opt) => opt.enabled);
    const previewOptions = enabledOptions.slice(0, 3);
    const remaining =
      enabledOptions.length > 3 ? ` +${enabledOptions.length - 3} more` : "";

    return (
      <div className="text-sm text-muted-foreground">
        {previewOptions.map((opt) => opt.text).join(", ")}
        {remaining}
      </div>
    );
  };

  // Calculate the last modified date string
  const getLastModifiedString = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString() + " " + date.toLocaleTimeString();
    } catch (e) {
      return "Unknown date";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Load Wheel</DialogTitle>
          <DialogDescription>
            Select a wheel to load or manage your saved wheels
          </DialogDescription>
        </DialogHeader>

        <div className="flex-grow overflow-auto">
          {statusMessage && (
            <div
              className={`mb-4 p-3 rounded-md flex items-center gap-2 ${
                statusMessage.type === "success"
                  ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100"
                  : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100"
              }`}
            >
              {statusMessage.type === "success" ? (
                <CheckCircle2 className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Your Wheels Section */}
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-3">Your Wheels</h3>
            {savedWheels.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-accent/30 rounded-lg">
                <AlertCircle className="h-6 w-6 mb-2" />
                <p>No saved wheels found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {savedWheels.map(({ name, data }) => (
                  <div
                    key={name}
                    className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent/50 transition-colors"
                  >
                    <div
                      className="flex-1 cursor-pointer"
                      onClick={() => {
                        if (editingWheel !== name) {
                          onLoadWheel(data);
                          onOpenChange(false);
                        }
                      }}
                    >
                      {editingWheel === name ? (
                        <Input
                          value={newWheelName}
                          onChange={(e) => setNewWheelName(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              handleConfirmRename(name);
                            } else if (e.key === "Escape") {
                              setEditingWheel(null);
                            }
                          }}
                          autoFocus
                        />
                      ) : (
                        <>
                          <div className="font-medium">{name}</div>
                          {getOptionsPreview(data.options)}
                          <div className="text-xs text-muted-foreground mt-1">
                            Last modified:{" "}
                            {getLastModifiedString(data.lastModified)}
                          </div>
                        </>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {editingWheel === name ? (
                        <>
                          <Button
                            className="ml-4"
                            variant="ghost"
                            size="icon"
                            onClick={() => handleConfirmRename(name)}
                          >
                            <Check className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setEditingWheel(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </>
                      ) : (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartEdit(name);
                            }}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteClick(name);
                            }}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Predefined Wheels Section */}
          <div>
            <h3 className="text-lg font-medium mb-3">Predefined Wheels</h3>
            {isLoadingCatalog ? (
              <div className="flex justify-center items-center py-6">
                <div className="animate-spin h-6 w-6 border-2 border-current border-t-transparent rounded-full"></div>
              </div>
            ) : wheelCatalog.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-muted-foreground bg-accent/30 rounded-lg">
                <AlertCircle className="h-6 w-6 mb-2" />
                <p>No predefined wheels found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wheelCatalog.map((wheel) => (
                  <div
                    key={wheel.id}
                    className="flex items-center justify-between border rounded-lg p-3 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() =>
                      handleLoadPredefinedWheel(wheel.filename, wheel.id)
                    }
                  >
                    <div className="flex-1">
                      <div className="font-medium flex items-center">
                        <BookmarkIcon className="h-4 w-4 mr-2 text-primary" />
                        {wheel.name}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {wheel.previewOptions.join(", ")}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLoadingWheel && (
            <div className="fixed inset-0 bg-background/50 flex items-center justify-center z-50">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Wheel</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{wheelToDelete}"? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
