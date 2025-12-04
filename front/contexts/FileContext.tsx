
import React, { useState, createContext, useContext, useMemo, ReactNode, useCallback, useEffect, useRef } from 'react';
import { FileData, FileStatus, AudioFileItem, DashboardResponse } from '../types';
import { MOCK_FILES } from '../constants';
import { getDashboardData, checkFileStatus as fetchFileStatus, getTaskProgress } from '../api/api';

interface FileContextType {
  files: FileData[];
  addFile: (file: FileData) => void;
  getFileById: (id: string) => FileData | undefined;
  updateFile: (fileId: string, updates: Partial<FileData>) => void;
  removeFile: (fileId: string) => void;
  refreshFiles: () => Promise<void>;
  checkFileStatus: (fileId: string) => Promise<void>;
  recentlyAddedFileId: string | null;
  clearRecentlyAddedFile: () => void;
  loading: boolean;
  error: string | null;
}

const FileContext = createContext<FileContextType | null>(null);

export const useFiles = () => {
  const context = useContext(FileContext);
  if (!context) {
    throw new Error("useFiles must be used within a FileProvider");
  }
  return context;
};

// Helper function to convert API data to frontend format
const convertApiFileToFileData = (apiFile: AudioFileItem): FileData => {
  // Map API status to FileStatus enum
  const statusMap: { [key: string]: FileStatus } = {
    'AP': FileStatus.Pending,
    'P': FileStatus.Processing,
    'Pr': FileStatus.Processing,
    'PD': FileStatus.Processed,
    'SU': FileStatus.ServiceUnavailable,
    'A': FileStatus.Approved,
    'E': FileStatus.Rejected, // خطا را به عنوان رد شده نمایش می‌دهیم
    'R': FileStatus.Rejected,
  };

  const statusDisplay = apiFile.status_display || '';
  const mappedStatus = statusMap[apiFile.status]
    || (statusDisplay.includes('پردازش') ? FileStatus.Processing : FileStatus.Pending);

  const uploadedAt = apiFile.uploaded_at;
  const dateObject = uploadedAt ? new Date(uploadedAt) : null;
  const formatter = new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  const timeFormatter = new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false });
  const uploadDate = dateObject ? formatter.format(dateObject) : '';
  const lastUpdatedLabel = dateObject ? `${formatter.format(dateObject)} • ${timeFormatter.format(dateObject)}` : '';

  return {
    id: apiFile.id.toString(),
    name: apiFile.file_name,
    uploadDate,
    uploadedAt,
    lastUpdatedLabel,
    type: apiFile.file_type_display,
    subCollection: apiFile.subset_title,
    status: mappedStatus,
    statusDisplay,
    progressLabel: statusDisplay,
    task_id: apiFile.task_id,
    upload_uuid: apiFile.upload_uuid,
    uploader: apiFile.uploader || undefined,
  } as FileData;
};

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [recentlyAddedFileId, setRecentlyAddedFileId] = useState<string | null>(null);
  const previousFilesRef = useRef<Record<string, FileData>>({});
  const hasInitializedRef = useRef(false);

  const requestNotificationPermission = useCallback(async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'default') {
      try {
        await Notification.requestPermission();
      } catch (err) {
        console.warn('Notification permission request failed:', err);
      }
    }
  }, []);

  const notifyStatusChange = useCallback(
    async (fileName: string, statusLabel: string) => {
      if (typeof window === 'undefined' || !('Notification' in window)) return;

      if (Notification.permission === 'default') {
        await requestNotificationPermission();
      }

      if (Notification.permission === 'granted') {
        new Notification('وضعیت پردازش به‌روزرسانی شد', {
          body: `${fileName}: ${statusLabel}`,
        });
      }
    },
    [requestNotificationPermission]
  );

  const getFileById = useCallback((id: string) => {
    return files.find(f => f.id === id);
  }, [files]);

  const updateFile = useCallback((fileId: string, updates: Partial<FileData>) => {
    setFiles(prevFiles =>
      prevFiles.map(f =>
        f.id === fileId ? { ...f, ...updates } : f
      )
    );
  }, []);

  const addFile = useCallback((file: FileData) => {
    setFiles(prevFiles => [file, ...prevFiles]);
    setRecentlyAddedFileId(file.id);
  }, []);

  const clearRecentlyAddedFile = useCallback(() => {
    setRecentlyAddedFileId(null);
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prevFiles) => prevFiles.filter((file) => file.id !== fileId));
    previousFilesRef.current = Object.keys(previousFilesRef.current).reduce<Record<string, FileData>>((acc, key) => {
      if (key !== fileId) {
        acc[key] = previousFilesRef.current[key];
      }
      return acc;
    }, {});
  }, []);

  const syncFiles = useCallback(async (notifyChanges = false) => {
    try {
      if (!hasInitializedRef.current) {
        setLoading(true);
      }
      setError(null);
      const response: DashboardResponse = await getDashboardData();
      const convertedFiles = response.items.map(convertApiFileToFileData);
      const previousFiles = previousFilesRef.current;

      const processingProgress = await Promise.all(
        convertedFiles.map(async (file) => {
          const previousFile = previousFiles[file.id];
          let mergedFile: FileData = {
            ...file,
            progress: previousFile?.progress,
            progressLabel: previousFile?.progressLabel || file.statusDisplay || previousFile?.statusDisplay,
          };

          if (file.status !== FileStatus.Processing || !file.task_id) {
            return mergedFile;
          }

          try {
            const taskProgress = await getTaskProgress(file.task_id);
            const numericProgress = typeof taskProgress.progress === 'number'
              ? taskProgress.progress
              : parseFloat(String(taskProgress.progress).replace('%', ''));
            const clampedProgress = Number.isFinite(numericProgress) ? numericProgress : mergedFile?.progress ?? 0;
            const finalProgress = taskProgress.is_completed ? 100 : clampedProgress;

            mergedFile = {
              ...mergedFile,
              progress: finalProgress,
              progressLabel: taskProgress.status || (taskProgress.is_completed ? 'پردازش تمام شد' : mergedFile?.progressLabel) || file.statusDisplay,
            } as FileData;
          } catch (progressError) {
            console.warn('Unable to fetch task progress', progressError);
          }

          return mergedFile;
        })
      );

        if (notifyChanges) {
          processingProgress.forEach((file) => {
            const previousFile = previousFiles[file.id];
            if (!previousFile) return;

            const statusChanged = previousFile.status !== file.status;
            const statusDisplayChanged = previousFile.statusDisplay !== file.statusDisplay;
            const progressLabelChanged = previousFile.progressLabel !== file.progressLabel && file.status === FileStatus.Processing;
            const completedProgress = (previousFile.progress ?? 0) < 100 && (file.progress ?? 0) >= 100;

            if (statusChanged || statusDisplayChanged || progressLabelChanged || completedProgress) {
              const statusLabel = file.statusDisplay || file.progressLabel || file.status || 'به‌روزرسانی شد';
              notifyStatusChange(file.name, statusLabel.toString());
            }
          });
        }

      previousFilesRef.current = processingProgress.reduce<Record<string, FileData>>((acc, file) => {
        acc[file.id] = file;
        return acc;
      }, {});

      setFiles(processingProgress);
      hasInitializedRef.current = true;
    } catch (err: any) {
      console.error('Error fetching files:', err);
      setError(err.message || 'خطا در بارگذاری فایل‌ها');
      // Fallback to mock data on error
      setFiles(MOCK_FILES);
    } finally {
      setLoading(false);
    }
  }, [notifyStatusChange]);

  const refreshFiles = useCallback(async () => {
    await syncFiles(true);
  }, [syncFiles]);

  const checkFileStatus = useCallback(async (fileId: string) => {
    try {
      const response = await fetchFileStatus(parseInt(fileId));
      if (response.success) {
        // Map API status to FileStatus enum
        const statusMap: { [key: string]: FileStatus } = {
          'AP': FileStatus.Pending,
          'P': FileStatus.Processing,
          'PD': FileStatus.Processed,
          'A': FileStatus.Approved,
          'E': FileStatus.Rejected,
          'R': FileStatus.Rejected,
        };

        const newStatus = statusMap[response.current_status] || FileStatus.Pending;
        const previousFile = getFileById(fileId);
        updateFile(fileId, { status: newStatus });

        if (previousFile && previousFile.status !== newStatus) {
          const label = response.status_display || newStatus;
          notifyStatusChange(previousFile.name, label.toString());
        }
      }
    } catch (err: any) {
      console.error('Error checking file status:', err);
    }
  }, [getFileById, notifyStatusChange, updateFile]);

  // Load files on mount
  useEffect(() => {
    requestNotificationPermission();
    syncFiles(false);
  }, [requestNotificationPermission, syncFiles]);

  // Keep statuses updated automatically
  useEffect(() => {
    const interval = setInterval(() => {
      syncFiles(true);
    }, 5000);

    return () => clearInterval(interval);
  }, [syncFiles]);
  
  const value = useMemo(() => ({
    files,
    addFile,
    getFileById,
    updateFile,
    removeFile,
    refreshFiles,
    checkFileStatus,
    recentlyAddedFileId,
    clearRecentlyAddedFile,
    loading,
    error
  }), [files, addFile, getFileById, updateFile, removeFile, refreshFiles, checkFileStatus, recentlyAddedFileId, clearRecentlyAddedFile, loading, error]);

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
