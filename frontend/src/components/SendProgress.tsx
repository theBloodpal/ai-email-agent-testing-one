import React from 'react';
import type { SendStatusResponse } from '../types';

interface SendProgressProps {
  status: SendStatusResponse;
}

const SendProgress: React.FC<SendProgressProps> = ({ status }) => {
  const { progress, send_in_progress, stop_requested, jobs } = status;

  if (!send_in_progress && jobs.length === 0) {
    return (
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
        <p className="text-gray-500 text-sm">No active send jobs</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Send Progress</h3>
          {stop_requested && (
            <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded">
              Stopping...
            </span>
          )}
          {send_in_progress && (
            <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded">
              In Progress
            </span>
          )}
        </div>

        <div className="grid grid-cols-5 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-purple-600">{progress.total}</div>
            <div className="text-xs text-gray-500">Total</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">{progress.processed}</div>
            <div className="text-xs text-gray-500">Processed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{progress.delivered}</div>
            <div className="text-xs text-gray-500">Delivered</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{progress.failed}</div>
            <div className="text-xs text-gray-500">Failed</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-yellow-600">{progress.bounced}</div>
            <div className="text-xs text-gray-500">Bounced</div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div
              className="bg-purple-600 h-2 rounded-full transition-all"
              style={{ width: `${progress.total > 0 ? (progress.processed / progress.total) * 100 : 0}%` }}
            />
          </div>
        </div>

        {progress.current_email && (
          <p className="mt-2 text-sm text-gray-500">
            Sending to: {progress.current_email}
          </p>
        )}
      </div>

      {/* Active Jobs */}
      {jobs.filter(j => j.in_progress).map(job => (
        <div key={job.job_id} className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{job.from_email}</p>
              <p className="text-sm text-gray-500">{job.subject}</p>
            </div>
            <span className="px-2 py-1 text-xs bg-green-100 text-green-700 rounded">
              Active
            </span>
          </div>
          <div className="mt-3 flex items-center space-x-4 text-sm">
            <span>{job.processed}/{job.total}</span>
            <span className="text-green-600">{job.delivered} sent</span>
            {job.failed > 0 && <span className="text-red-600">{job.failed} failed</span>}
          </div>
        </div>
      ))}

      {/* Last Batch Results */}
      {status.last_batch && (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow">
          <h4 className="font-medium text-gray-900 dark:text-white mb-2">Last Batch Results</h4>
          <div className="text-sm space-y-1">
            <p>From: {status.last_batch.from_email}</p>
            <p>Subject: {status.last_batch.subject}</p>
            <p className="text-gray-500">
              {status.last_batch.delivered} delivered, {status.last_batch.failed} failed, {status.last_batch.bounced} bounced
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SendProgress;