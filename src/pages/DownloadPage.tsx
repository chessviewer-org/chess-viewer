import React from 'react';
import {
  CheckCircle,
  Download,
  Globe,
  Monitor,
  Smartphone,
  Tablet
} from 'lucide-react';
import { useModal } from '@/contexts';

/**
 * @returns {JSX.Element}
 */
function DownloadPage() {
  const { showAlert } = useModal();

  const handleInstallPWA = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      showAlert('Already Installed', 'The app is already installed and running in standalone mode.', 'info');
      return;
    }
    showAlert(
      'Installation Instructions',
      'To install:\n\n1. Click browser menu (⋮)\n2. Select "Install app"\n3. Follow the prompts',
      'info'
    );
  };

  return (
    <div className="w-full pt-16 sm:pt-20 lg:pt-24 pb-8 sm:pb-12 px-[2%] sm:px-[3%] lg:px-[4%]">
      <div className="w-[95%] max-w-6xl mx-auto transition-all duration-500 ease-in-out">
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-5">
            <Download className="w-5 h-5" />
            Get the App
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary mb-4">
            Download Options
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            Access on any device, anywhere
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10 animate-fadeIn">
          <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 border border-border">
            <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center mb-5 text-accent">
              <Globe className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-3">
              Web Application
            </h2>
            <p className="text-text-secondary text-base mb-5 leading-relaxed">
              Use directly in browser. No installation required.
            </p>
            <ul className="space-y-2.5 text-sm text-text-muted mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success shrink-0" />
                Instant access
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success shrink-0" />
                Always updated
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success shrink-0" />
                Works everywhere
              </li>
            </ul>
            <a
              href="/"
              className="block w-full py-3 px-5 bg-accent hover:bg-accent-hover text-bg text-center rounded-xl font-bold shadow-md hover:shadow-lg transition-colors duration-200"
            >
              Use Web App
            </a>
          </div>

          <div className="glass-card p-6 rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-200 border-2 border-secondary">
            <div className="w-14 h-14 bg-secondary/10 rounded-xl flex items-center justify-center mb-5 text-secondary">
              <Smartphone className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-display font-bold text-text-primary mb-3">
              Progressive Web App
            </h2>
            <p className="text-text-secondary text-base mb-5 leading-relaxed">
              Install for offline access and app-like experience.
            </p>
            <ul className="space-y-2.5 text-sm text-text-muted mb-6">
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success shrink-0" />
                Offline support
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success shrink-0" />
                Native feel
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success shrink-0" />
                Home screen icon
              </li>
            </ul>
            <button
              onClick={handleInstallPWA}
              className="block w-full py-3 px-5 bg-surface-elevated hover:bg-surface-hover text-text-primary text-center rounded-xl font-bold border-2 border-secondary hover:shadow-md transition-colors duration-200"
            >
              Install PWA
            </button>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-lg animate-fadeIn">
          <h2 className="text-xl font-display font-bold text-text-primary mb-6 text-center">
            Supported Platforms
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <PlatformCard
              icon={<Monitor className="w-7 h-7" />}
              title="Desktop"
              platforms="Windows, macOS, Linux"
              browsers="Chrome, Firefox, Safari, Edge"
            />
            <PlatformCard
              icon={<Tablet className="w-7 h-7" />}
              title="Tablet"
              platforms="iPad, Android"
              browsers="Safari, Chrome"
            />
            <PlatformCard
              icon={<Smartphone className="w-7 h-7" />}
              title="Mobile"
              platforms="iOS, Android"
              browsers="Safari, Chrome"
            />
          </div>
          <p className="text-center text-text-muted text-sm mt-6 leading-relaxed">
            Modern browser with JavaScript required. PWA available on Chrome,
            Edge, Safari.
          </p>
        </div>
      </div>
    </div>
  );
}

interface PlatformCardProps {
  icon: React.ReactNode;
  title: string;
  platforms: string;
  browsers: string;
}

function PlatformCard({ icon, title, platforms, browsers }: PlatformCardProps) {
  return (
    <div className="text-center p-5 rounded-xl bg-surface-elevated border border-border hover:border-accent transition-colors duration-200">
      <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mx-auto mb-3 text-accent">
        {icon}
      </div>
      <h3 className="text-base font-display font-bold text-text-primary mb-2">
        {title}
      </h3>
      <p className="text-sm text-text-secondary font-medium mb-1">
        {platforms}
      </p>
      <p className="text-xs text-text-muted">{browsers}</p>
    </div>
  );
}

export default DownloadPage;
