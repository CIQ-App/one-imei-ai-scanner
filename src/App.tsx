import React, { useState, useEffect } from 'react';
import { ImageUploader } from './components/ImageUploader';
import { analyzeImage } from './lib/gemini';
import { Auth } from './components/Auth';
import { Sparkles, Loader2, AlertCircle, LogOut, Download } from 'lucide-react';

interface DeviceInfo {
  position: string;
  imei: string;
}

interface ScanResult {
  description: string;
  deviceCount: number;
  devices: DeviceInfo[];
  error?: string;
}

function App() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const authState = localStorage.getItem('isAuthenticated');
    setIsAuthenticated(authState === 'true');
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem('isAuthenticated');
    setIsAuthenticated(false);
  };

  const handleImageSelect = async (imageData: string) => {
    setIsProcessing(true);
    setError(null);
    setResult(null);

    try {
      const analysis = await analyzeImage(imageData);
      console.log('Analysis Result:', analysis);
      setResult(analysis);
    } catch (err) {
      console.error('Image Analysis Error:', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze image. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (!result?.devices?.length) return;

    const csvContent = [
      'Position,IMEI',
      ...result.devices.map(device => `${device.position},${device.imei}`)
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `imei-scan-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  if (!isAuthenticated) {
    return <Auth onAuthSuccess={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-6 px-4 sm:py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6 sm:mb-12">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-4 sm:space-y-0">
          <div className="flex items-center">
            <Sparkles className="w-10 h-10 sm:w-12 sm:h-12 text-blue-500 flex-shrink-0" />
            <div className="ml-3 sm:ml-4">
              <h1 className="text-2xl sm:text-4xl font-bold text-gray-900">IMEI AI Scanner</h1>
              <p className="mt-1 text-sm sm:text-lg text-gray-600">
                Upload a photo of device boxes to scan IMEI numbers
              </p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center px-3 py-2 sm:px-4 sm:py-2 text-sm font-medium text-gray-700 bg-white rounded-md border border-gray-300 hover:bg-gray-50 shadow-sm"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
          {/* Upload Section */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Upload Image</h2>
              <ImageUploader 
                onImageSelect={handleImageSelect}
                isProcessing={isProcessing}
              />
              
              {/* Image Description Section */}
              {result?.description && !isProcessing && !error && (
                <div className="mt-4 sm:mt-6 bg-gray-50 p-3 sm:p-4 rounded-lg border border-gray-100">
                  <h3 className="text-sm font-medium text-gray-500 mb-1 sm:mb-2">Image Description</h3>
                  <p className="text-sm sm:text-base text-gray-700">{result.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Results Section */}
          <div className="w-full lg:w-1/2">
            <div className="bg-white rounded-lg shadow-md p-4 sm:p-6 h-full">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Scan Results</h2>
                {result?.devices?.length > 0 && (
                  <button
                    onClick={handleDownload}
                    className="flex items-center justify-center px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 w-full sm:w-auto"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download CSV
                  </button>
                )}
              </div>
              
              {isProcessing && (
                <div className="flex flex-col items-center justify-center h-48 sm:h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                  <p className="mt-2 text-sm sm:text-base text-gray-600">Analyzing image...</p>
                </div>
              )}

              {!isProcessing && !result && !error && (
                <div className="flex items-center justify-center h-48 sm:h-64 text-sm sm:text-base text-gray-500">
                  Upload an image to see results
                </div>
              )}

              {result && !error && (
                <div className="h-full">
                  {result.error ? (
                    <div className="flex items-center text-amber-600 bg-amber-50 p-3 sm:p-4 rounded-lg text-sm sm:text-base">
                      <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                      <p>{result.error}</p>
                    </div>
                  ) : (
                    <>
                      <div className="mb-4">
                        <p className="text-sm sm:text-base text-gray-700">
                          Devices detected: <span className="font-semibold">{result.deviceCount}</span>
                        </p>
                      </div>
                      
                      {result.devices && result.devices.length > 0 && (
                        <div>
                          <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">Detected Devices:</h3>
                          <ul className="space-y-3">
                            {result.devices.map((device, index) => (
                              <li 
                                key={index}
                                className="bg-gray-50 p-3 sm:p-4 rounded-lg"
                              >
                                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-0">
                                  <span className="text-sm font-medium text-gray-500">
                                    Position: <span className="text-gray-900">{device.position}</span>
                                  </span>
                                  <span className="font-mono text-sm sm:text-base text-gray-700">
                                    IMEI: {device.imei}
                                  </span>
                                </div>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {error && (
                <div className="mt-4 bg-red-50 text-red-700 p-3 sm:p-4 rounded-lg flex items-center text-sm sm:text-base">
                  <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
                  <p>{error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;