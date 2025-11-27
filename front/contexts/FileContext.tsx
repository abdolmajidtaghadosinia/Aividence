
import React, { useState, createContext, useContext, useMemo, ReactNode, useCallback, useEffect, useRef } from 'react';
import { FileData, FileStatus, AudioFileItem, DashboardResponse } from '../types';
import { MOCK_FILES } from '../constants';
import { getDashboardData, checkFileStatus as fetchFileStatus } from '../api/api';

interface FileContextType {
  files: FileData[];
  addFile: (file: FileData) => void;
  getFileById: (id: string) => FileData | undefined;
  updateFile: (fileId: string, updates: Partial<FileData>) => void;
  refreshFiles: () => Promise<void>;
  checkFileStatus: (fileId: string) => Promise<void>;
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
    'PD': FileStatus.Processed,
    'A': FileStatus.Approved,
    'E': FileStatus.Rejected, // خطا را به عنوان رد شده نمایش می‌دهیم
    'R': FileStatus.Rejected,
  };

  // Format date from ISO string to Persian format
  const formatPersianDate = (isoString: string): string => {
    const date = new Date(isoString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // Convert to Persian calendar (approximate)
    const persianYear = year - 621;
    return `${persianYear}/${month}/${day}`;
  };

  return {
    id: apiFile.id.toString(),
    name: apiFile.file_name,
    uploadDate: formatPersianDate(apiFile.uploaded_at),
    type: apiFile.file_type_display,
    subCollection: apiFile.subset_title,
    status: statusMap[apiFile.status] || FileStatus.Pending,
    upload_uuid: apiFile.upload_uuid,
  } as FileData;
};

export const FileProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const previousStatusesRef = useRef<Record<string, FileStatus>>({});
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

  const notifyStatusChange = useCallback((fileName: string, statusLabel: string) => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;

    if (Notification.permission === 'granted') {
      new Notification('وضعیت پردازش به‌روزرسانی شد', {
        body: `${fileName}: ${statusLabel}`,
      });
    }
  }, []);

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
  }, []);

  const syncFiles = useCallback(async (notifyChanges = false) => {
    try {
      if (!hasInitializedRef.current) {
        setLoading(true);
      }
      setError(null);
      const response: DashboardResponse = await getDashboardData();
      const convertedFiles = response.items.map(convertApiFileToFileData);

      if (notifyChanges) {
        convertedFiles.forEach((file) => {
          const previousStatus = previousStatusesRef.current[file.id];
          if (previousStatus && previousStatus !== file.status) {
            const statusLabel = file.status || file.subCollection || 'به‌روزرسانی شد';
            notifyStatusChange(file.name, statusLabel.toString());
          }
        });
      }

      previousStatusesRef.current = convertedFiles.reduce<Record<string, FileStatus>>((acc, file) => {
        acc[file.id] = file.status;
        return acc;
      }, {});

      setFiles(convertedFiles);
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
        updateFile(fileId, { status: newStatus });
      }
    } catch (err: any) {
      console.error('Error checking file status:', err);
    }
  }, [updateFile]);

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
    refreshFiles, 
    checkFileStatus,
    loading, 
    error 
  }), [files, addFile, getFileById, updateFile, refreshFiles, checkFileStatus, loading, error]);

  return <FileContext.Provider value={value}>{children}</FileContext.Provider>;
};
