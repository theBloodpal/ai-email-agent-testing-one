import React, { useState, useEffect, useRef } from 'react';
import { Upload, FileText, Send, CheckCircle, X } from 'lucide-react';
import {
  uploadExcel,
  generateMessage,
  enhanceMessage,
  previewMessages,
  sendMessages,
  getSendStatus,
} from '../api';
import SendProgress from '../components/SendProgress';
import type { SendStatusResponse, ExcelUploadResponse, PreviewItem } from '../types';

const SendEmailsPage: React.FC = () => {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState<ExcelUploadResponse | null>(null);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [objective, setObjective] = useState('');
  const [subject, setSubject] = useState('');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [previews, setPreviews] = useState<PreviewItem[]>([]);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<SendStatusResponse | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadStatus();
    const interval = setInterval(loadStatus, 2000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const res = await getSendStatus();
      setStatus(res.data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedFile(file);
    setLoading(true);
    try {
      const res = await uploadExcel(file);
      setUploadData(res.data);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Upload failed');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      setAttachments([...attachments, ...Array.from(files)]);
    }
  };

  const handleGenerate = async () => {
    if (!objective) return;
    setLoading(true);
    try {
      const res = await generateMessage(objective);
      setMessageTemplate(res.data.message);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async () => {
    if (!messageTemplate) return;
    setLoading(true);
    try {
      const res = await enhanceMessage(messageTemplate);
      setMessageTemplate(res.data.message);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handlePreview = async () => {
    if (!messageTemplate) return;
    setLoading(true);
    try {
      const res = await previewMessages(messageTemplate, 5);
      setPreviews(res.data.previews || []);
      setShowPreview(true);
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSend = async () => {
    if (!subject || !messageTemplate) return;
    setSending(true);
    try {
      await sendMessages(subject, messageTemplate);
      await loadStatus();
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Send failed');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Send Bulk Emails</h1>

      {/* Step 1: Upload Excel */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Upload size={20} className="mr-2" />
          Step 1: Upload Contact Excel
        </h2>

        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-purple-500 transition-colors"
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls"
            onChange={handleFileUpload}
            className="hidden"
          />
          <FileText className="mx-auto text-gray-400 mb-2" size={48} />
          <p className="text-gray-600 dark:text-gray-300">
            {uploadedFile ? uploadedFile.name : 'Click to upload Excel file'}
          </p>
        </div>

        {uploadData && (
          <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <CheckCircle className="text-green-600 mb-2" size={20} />
            <p className="text-sm text-green-700 dark:text-green-400">
              Loaded {uploadData.rows_count} rows with columns: {uploadData.columns.join(', ')}
            </p>
            {uploadData.first_name_column && (
              <p className="text-sm text-green-700 dark:text-green-400">
                Detected first name column: <strong>{uploadData.first_name_column}</strong>
              </p>
            )}
            <p className="text-sm text-green-700 dark:text-green-400">
              Detected email column: <strong>{uploadData.email_column || 'None'}</strong>
            </p>
          </div>
        )}
      </div>

      {/* Step 2: Attachments */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Upload size={20} className="mr-2" />
          Step 2: Attachments (Optional)
        </h2>

        <input
          ref={attachInputRef}
          type="file"
          multiple
          onChange={handleAttachFiles}
          className="hidden"
        />
        <button
          onClick={() => attachInputRef.current?.click()}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Add Attachments
        </button>

        {attachments.length > 0 && (
          <div className="mt-4 space-y-2">
            {attachments.map((f, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-2 rounded">
                <span className="text-sm">{f.name}</span>
                <button onClick={() => setAttachments(attachments.filter((_, j) => j !== i))}>
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Step 3: Message */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Send size={20} className="mr-2" />
          Step 3: Create Message
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              placeholder="Email subject line"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Objective / Key Message
            </label>
            <textarea
              value={objective}
              onChange={(e) => setObjective(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              rows={3}
              placeholder="What is the main message you want to convey?"
            />
            <button
              onClick={handleGenerate}
              disabled={loading || !objective}
              className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              Generate Template
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Message Template (use {"{{first_name}}"} for personalization)
            </label>
            <textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white font-mono text-sm"
              rows={8}
              placeholder="Hi {first_name},&#10;&#10;Your message here..."
            />
            <div className="mt-2 flex gap-2">
              <button
                onClick={handleEnhance}
                disabled={loading || !messageTemplate}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
              >
                AI Enhance
              </button>
              <button
                onClick={handlePreview}
                disabled={loading || !messageTemplate}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
              >
                Preview
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Message Previews</h3>
              <button onClick={() => setShowPreview(false)} className="text-gray-500">
                <X size={24} />
              </button>
            </div>
            <div className="space-y-4">
              {previews.map((p, i) => (
                <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                  <p className="text-sm font-medium text-gray-500 mb-2">
                    To: {Object.values(p.recipient).join(', ')}
                  </p>
                  <div className="bg-gray-50 dark:bg-gray-700 p-3 rounded text-sm whitespace-pre-wrap">
                    {p.message}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Step 4: Send */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6 border border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Send size={20} className="mr-2" />
          Step 4: Send
        </h2>

        <button
          onClick={handleSend}
          disabled={sending || !uploadData || !subject || !messageTemplate}
          className="px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50"
        >
          {sending ? 'Sending...' : `Send to ${uploadData?.rows_count || 0} Recipients`}
        </button>
      </div>

      {/* Progress */}
      {status && <SendProgress status={status} />}
    </div>
  );
};

export default SendEmailsPage;