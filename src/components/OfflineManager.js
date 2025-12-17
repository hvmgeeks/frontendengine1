import React, { useState, useEffect } from 'react';
import { Modal, message, Progress } from 'antd';
import { TbDownload, TbTrash, TbDatabase, TbWifi, TbWifiOff, TbVideo, TbBrain, TbUser } from 'react-icons/tb';
import { getQuizStorageInfo, clearAllOfflineQuizzes, deleteOfflineQuiz } from '../utils/offlineQuiz';
import { getStorageUsed, getAllDownloadedVideos, deleteOfflineVideo } from '../utils/offlineVideo';
import { getAuthData, clearAuthData } from '../utils/offlineAuth';

const OfflineManager = ({ visible, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [quizInfo, setQuizInfo] = useState(null);
  const [videoInfo, setVideoInfo] = useState(null);
  const [authInfo, setAuthInfo] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (visible) {
      loadStorageInfo();
    }
  }, [visible]);

  const loadStorageInfo = async () => {
    setLoading(true);
    try {
      const [quiz, video, auth] = await Promise.all([
        getQuizStorageInfo(),
        getStorageUsed(),
        getAuthData()
      ]);

      setQuizInfo(quiz);
      setVideoInfo(video);
      setAuthInfo(auth);
    } catch (error) {
      console.error('Error loading storage info:', error);
      message.error('Failed to load storage information');
    } finally {
      setLoading(false);
    }
  };

  const handleClearQuizzes = async () => {
    Modal.confirm({
      title: 'Clear All Quizzes?',
      content: 'This will delete all downloaded quizzes. You can download them again later.',
      okText: 'Clear All',
      okType: 'danger',
      onOk: async () => {
        try {
          await clearAllOfflineQuizzes();
          message.success('All quizzes cleared');
          loadStorageInfo();
        } catch (error) {
          message.error('Failed to clear quizzes');
        }
      }
    });
  };

  const handleDeleteQuiz = async (quizId) => {
    try {
      await deleteOfflineQuiz(quizId);
      message.success('Quiz deleted');
      loadStorageInfo();
    } catch (error) {
      message.error('Failed to delete quiz');
    }
  };

  const handleDeleteVideo = async (videoUrl) => {
    try {
      await deleteOfflineVideo(videoUrl);
      message.success('Video deleted');
      loadStorageInfo();
    } catch (error) {
      message.error('Failed to delete video');
    }
  };

  const totalStorageMB = parseFloat(quizInfo?.totalSizeMB || 0) + parseFloat(videoInfo?.totalSizeMB || 0);

  return (
    <Modal
      title={
        <div className="flex items-center gap-2">
          <TbDatabase className="w-6 h-6 text-blue-600" />
          <span>Offline Storage Manager</span>
          <div className={`ml-auto flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            isOnline ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
          }`}>
            {isOnline ? <TbWifi className="w-4 h-4" /> : <TbWifiOff className="w-4 h-4" />}
            {isOnline ? 'Online' : 'Offline'}
          </div>
        </div>
      }
      open={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <div className="space-y-6">
        {/* Storage Overview */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border border-blue-200">
          <h3 className="text-lg font-bold text-gray-800 mb-3">Storage Overview</h3>
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TbBrain className="w-5 h-5 text-purple-600" />
                <span className="text-sm text-gray-600">Quizzes</span>
              </div>
              <div className="text-2xl font-bold text-purple-600">{quizInfo?.totalQuizzes || 0}</div>
              <div className="text-xs text-gray-500">{quizInfo?.totalSizeMB || 0} MB</div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TbVideo className="w-5 h-5 text-blue-600" />
                <span className="text-sm text-gray-600">Videos</span>
              </div>
              <div className="text-2xl font-bold text-blue-600">{videoInfo?.videoCount || 0}</div>
              <div className="text-xs text-gray-500">{videoInfo?.totalSizeMB || 0} MB</div>
            </div>

            <div className="bg-white p-3 rounded-lg shadow-sm">
              <div className="flex items-center gap-2 mb-2">
                <TbUser className="w-5 h-5 text-green-600" />
                <span className="text-sm text-gray-600">Auth Data</span>
              </div>
              <div className="text-2xl font-bold text-green-600">{authInfo?.user ? '✓' : '✗'}</div>
              <div className="text-xs text-gray-500">{authInfo?.rememberMe ? 'Saved' : 'Not saved'}</div>
            </div>
          </div>

          <div className="mt-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-600">Total Storage Used</span>
              <span className="font-bold text-gray-800">{totalStorageMB.toFixed(2)} MB</span>
            </div>
            <Progress
              percent={Math.min((totalStorageMB / 100) * 100, 100)}
              strokeColor={{
                '0%': '#3b82f6',
                '100%': '#8b5cf6',
              }}
              showInfo={false}
            />
          </div>
        </div>

        {/* Downloaded Quizzes */}
        {quizInfo && quizInfo.totalQuizzes > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TbBrain className="w-5 h-5 text-purple-600" />
                Downloaded Quizzes ({quizInfo.totalQuizzes})
              </h3>
              <button
                onClick={handleClearQuizzes}
                className="px-3 py-1 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600 transition-colors flex items-center gap-1"
              >
                <TbTrash className="w-4 h-4" />
                Clear All
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2">
              {quizInfo.quizzes.map((quiz) => (
                <div key={quiz.id} className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between hover:border-purple-300 transition-colors">
                  <div className="flex-1">
                    <div className="font-semibold text-gray-800">{quiz.name}</div>
                    <div className="text-xs text-gray-500">
                      {quiz.subject} • Downloaded {new Date(quiz.downloadedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteQuiz(quiz.id)}
                    className="px-2 py-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <TbTrash className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Downloaded Videos */}
        {videoInfo && videoInfo.videoCount > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                <TbVideo className="w-5 h-5 text-blue-600" />
                Downloaded Videos ({videoInfo.videoCount})
              </h3>
            </div>
            <div className="text-sm text-gray-600 bg-blue-50 p-3 rounded-lg border border-blue-200">
              <p>You have {videoInfo.videoCount} video(s) downloaded for offline viewing.</p>
              <p className="mt-1">Total size: {videoInfo.totalSizeMB} MB</p>
              <p className="mt-2 text-xs text-gray-500">
                To manage individual videos, go to the Video Lessons page.
              </p>
            </div>
          </div>
        )}

        {/* Auth Info */}
        {authInfo && authInfo.user && (
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
              <TbUser className="w-5 h-5 text-green-600" />
              Login Information
            </h3>
            <div className="bg-green-50 p-3 rounded-lg border border-green-200">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-gray-800">{authInfo.user.name}</div>
                  <div className="text-sm text-gray-600">{authInfo.user.email}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {authInfo.rememberMe ? '✓ Stay logged in enabled' : 'Session only'}
                  </div>
                </div>
                <div className="text-green-600 text-2xl">✓</div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {(!quizInfo || quizInfo.totalQuizzes === 0) &&
         (!videoInfo || videoInfo.videoCount === 0) &&
         (!authInfo || !authInfo.user) && (
          <div className="text-center py-8">
            <TbDownload className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-600 mb-2">No Offline Content</h3>
            <p className="text-sm text-gray-500">
              Download quizzes and videos to access them offline
            </p>
          </div>
        )}

        {/* Tips */}
        <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
          <h4 className="font-bold text-yellow-800 mb-2">💡 Offline Mode Tips</h4>
          <ul className="text-sm text-yellow-700 space-y-1">
            <li>• Download quizzes and videos while online to access them offline</li>
            <li>• Your login session is saved for offline access</li>
            <li>• Quiz results will sync when you're back online</li>
            <li>• Clear unused content to free up storage space</li>
          </ul>
        </div>
      </div>
    </Modal>
  );
};

export default OfflineManager;
