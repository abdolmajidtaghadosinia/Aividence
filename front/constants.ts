import { FileStatus, FileData, User, DictionaryTerm } from './types';

export const toPersianDigits = (n: number | string): string => {
    if (n === undefined || n === null) return '';
    const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(n).replace(/[0-9]/g, (d) => persianDigits[parseInt(d, 10)]);
};

export const MOCK_USER: User = {
  name: 'محمد رضایی',
  role: 'ناظر',
  employeeId: '981234',
  department: 'فناوری اطلاعات',
};

export const MOCK_FILES: FileData[] = [
  {
    id: '1',
    name: 'فایل_نمونه_۱.pdf',
    uploadDate: '۱۴۰۳/۰۴/۳۰',
    type: 'صورت جلسه',
    subCollection: 'مالی',
    status: FileStatus.Pending,
    duration: 320,
    uploader: 'علی',
    originalText: 'این متن استخراج شده اولیه برای فایل نمونه یک است.',
    editedText: 'این متن ویرایش شده برای فایل نمونه یک است.',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    extractedPhrases: ['آنبوردینگ', 'فرایند سازمانی', 'انتقال دانش']
  },
  {
    id: '2',
    name: 'گزارش ماهانه.docx',
    uploadDate: '۱۴۰۳/۰۴/۲۹',
    type: 'درس آموخته',
    subCollection: 'آموزش',
    status: FileStatus.Processing,
    duration: 450,
    uploader: 'سارا',
  },
  {
    id: '3',
    name: 'صورتجلسه با نام خیلی خیلی طولانی جهت تست نمایش.mp3',
    uploadDate: '۱۴۰۳/۰۴/۲۸',
    type: 'صورت جلسه',
    subCollection: 'فنی',
    status: FileStatus.Approved,
    duration: 600,
    uploader: 'محمد',
    originalText: 'این متن استخراج شده اولیه برای صورتجلسه طولانی است.',
    editedText: 'این متن ویرایش شده برای صورتجلسه طولانی است.',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    extractedPhrases: ['جلسه فنی', 'پروژه', 'تایید نهایی']
  },
  {
    id: '4',
    name: 'پیش فاکتور.png',
    uploadDate: '۱۴۰۳/۰۴/۲۷',
    type: 'درس آموخته',
    subCollection: 'منابع انسانی',
    status: FileStatus.Rejected,
    duration: 180,
    uploader: 'رضا',
  },
  {
    id: '5',
    name: 'جلسه_بررسی_بودجه.wav',
    uploadDate: '۱۴۰۳/۰۴/۲۶',
    type: 'صورت جلسه',
    subCollection: 'مالی',
    status: FileStatus.Approved,
    duration: 720,
    uploader: 'مریم',
  },
];


export const STATUS_STYLES: { [key in FileStatus]: { bg: string; text: string; dot: string } } = {
  [FileStatus.Approved]: { bg: 'bg-green-100', text: 'text-green-700', dot: 'bg-green-500' },
  [FileStatus.Pending]: { bg: 'bg-yellow-100', text: 'text-yellow-700', dot: 'bg-yellow-500' },
  [FileStatus.Processing]: { bg: 'bg-sky-100', text: 'text-sky-700', dot: 'bg-sky-500' },
  [FileStatus.Processed]: { bg: 'bg-purple-100', text: 'text-purple-700', dot: 'bg-purple-500' },
  [FileStatus.Rejected]: { bg: 'bg-red-100', text: 'text-red-700', dot: 'bg-red-500' },
};


export const MOCK_DICTIONARY_TERMS: DictionaryTerm[] = [
  { id: '1', term: 'آنبوردینگ', description: 'فرایند جذب و آموزش نیروهای جدید.', subCollection: 'منابع انسانی' },
  { id: '2', term: 'فرایند سازمانی', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'روابط عمومی' },
  { id: '3', term: 'انتقال دانش', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'فنی' },
  { id: '4', term: 'مدیریت پروژه', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'مالی' },
  { id: '5', term: 'فرایند جذب', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'منابع انسانی' },
  { id: '6', term: 'داده‌کاوی', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'فنی' },
  { id: '7', term: 'ارتباطات داخلی', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'روابط عمومی' },
  { id: '8', term: 'ارزیابی عملکرد', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'منابع انسانی' },
  { id: '9', term: 'برنامه‌ریزی مالی', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'مالی' },
  { id: '10', term: 'اتوماسیون اداری', description: 'توضیح درباره این عبارت بنویسید...', subCollection: 'فنی' },
];