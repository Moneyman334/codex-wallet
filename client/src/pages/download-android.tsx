import { Button } from "@/components/ui/button";
import { Download, Smartphone } from "lucide-react";

export default function DownloadAndroid() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-black to-blue-900 flex items-center justify-center p-8">
      <div className="max-w-2xl w-full bg-black/40 backdrop-blur-xl border border-purple-500/30 rounded-2xl p-12 text-center">
        <div className="mb-8">
          <Smartphone className="w-24 h-24 mx-auto mb-6 text-purple-400" />
          <h1 className="text-4xl font-bold text-white mb-4">
            Download Android Build
          </h1>
          <p className="text-gray-300 text-lg mb-2">
            Click the button below to download your Android build file
          </p>
          <p className="text-gray-400 text-sm">
            File: android-build.tar.gz (30MB)
          </p>
        </div>

        <a
          href="/download-android-build"
          download="android-build.tar.gz"
        >
          <Button
            size="lg"
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white text-xl px-12 py-8 h-auto"
            data-testid="button-download-android"
          >
            <Download className="w-8 h-8 mr-4" />
            Download Android Build
          </Button>
        </a>

        <div className="mt-12 pt-8 border-t border-purple-500/20">
          <h2 className="text-white text-xl font-semibold mb-4">
            Next Steps:
          </h2>
          <ol className="text-left text-gray-300 space-y-3">
            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">1</span>
              <span>Download the file to your Mac's Downloads folder</span>
            </li>
            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">2</span>
              <span>Double-click the file to extract the <code className="bg-black/50 px-2 py-1 rounded">android</code> folder</span>
            </li>
            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">3</span>
              <span>Open Android Studio and select "Open" → Choose the <code className="bg-black/50 px-2 py-1 rounded">android</code> folder</span>
            </li>
            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">4</span>
              <span>Build → Generate Signed Bundle/APK → Android App Bundle (.aab)</span>
            </li>
            <li className="flex items-start">
              <span className="bg-purple-600 text-white rounded-full w-6 h-6 flex items-center justify-center mr-3 flex-shrink-0 text-sm">5</span>
              <span>Upload the .aab file to Google Play Console</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}
