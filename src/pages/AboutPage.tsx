import {
  CheckCircle,
  Code,
  Copy,
  Crown,
  FileText,
  Info,
  Layers,
  Maximize2,
  RotateCw,
  Shield,
  Shuffle,
  Zap
} from 'lucide-react';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function AboutPage() {
  return (
    <div className="w-full pt-16 sm:pt-20 lg:pt-24 3xl:pt-32 pb-8 sm:pb-12 px-[2%] sm:px-[3%] lg:px-[4%]">
      <div className="w-[95%] max-w-600 mx-auto space-y-6 lg:space-y-10 transition-all duration-500 ease-in-out">
        <div className="text-center mb-10 animate-fadeIn">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm font-semibold mb-5">
            <Crown className="w-5 h-5" />
            Professional Tool
          </div>
          <h1 className="text-4xl sm:text-5xl font-display font-bold text-text-primary mb-4">
            About
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto leading-relaxed">
            Professional ChessVision for players, coaches, and content creators
          </p>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-lg animate-fadeIn">
          <div className="space-y-5 text-text-secondary leading-relaxed">
            <p>
              A modern web application for creating high-quality chess diagrams
              from FEN notation. Built with performance and usability in mind.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 my-6">
              <div className="p-5 rounded-xl bg-accent/5 border border-accent/20">
                <h3 className="flex items-center gap-2 text-base font-bold text-accent mb-2">
                  <CheckCircle className="w-5 h-5" />
                  Ultra-HD Export
                </h3>
                <p className="text-sm">Up to 32x quality (12,800px)</p>
              </div>
              <div className="p-5 rounded-xl bg-accent/5 border border-accent/20">
                <h3 className="flex items-center gap-2 text-base font-bold text-accent mb-2">
                  <CheckCircle className="w-5 h-5" />
                  Privacy First
                </h3>
                <p className="text-sm">All processing in browser</p>
              </div>
              <div className="p-5 rounded-xl bg-accent/5 border border-accent/20">
                <h3 className="flex items-center gap-2 text-base font-bold text-accent mb-2">
                  <CheckCircle className="w-5 h-5" />
                  Multiple Formats
                </h3>
                <p className="text-sm">PNG, JPEG, clipboard</p>
              </div>
              <div className="p-5 rounded-xl bg-accent/5 border border-accent/20">
                <h3 className="flex items-center gap-2 text-base font-bold text-accent mb-2">
                  <CheckCircle className="w-5 h-5" />
                  Full FEN Support
                </h3>
                <p className="text-sm">Complete notation support</p>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-6">
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-text-primary mb-2">
                  <Code className="w-5 h-5 text-accent" />
                  Technology
                </h3>
                <p className="text-sm">
                  Built with React 19 and HTML5 Canvas for high-performance
                  rendering.
                </p>
              </div>
              <div>
                <h3 className="flex items-center gap-2 text-base font-bold text-text-primary mb-2">
                  <Shield className="w-5 h-5 text-success" />
                  Privacy
                </h3>
                <p className="text-sm">
                  Your positions never leave your device. Everything runs
                  locally.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card p-6 sm:p-8 rounded-2xl shadow-lg animate-fadeIn">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center">
              <Info className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h2 className="text-xl font-display font-bold text-text-primary">
                How to Use
              </h2>
              <p className="text-sm text-text-muted">
                Quick guide to creating diagrams
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-text-primary mb-3">
                <Layers className="w-5 h-5 text-accent" />
                Export Quality
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <QualityCard level="1-4x" label="Web" desc="Fast" />
                <QualityCard level="8x" label="HD" desc="3200px" />
                <QualityCard level="16x" label="Print" desc="6400px" />
                <QualityCard level="32x" label="Ultra" desc="12800px" />
              </div>
            </div>

            <div>
              <h3 className="flex items-center gap-2 text-base font-semibold text-text-primary mb-3">
                <Zap className="w-5 h-5 text-accent" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                <ActionCard
                  icon={<FileText className="w-5 h-5" />}
                  title="PNG"
                  desc="Transparent"
                />
                <ActionCard
                  icon={<FileText className="w-5 h-5" />}
                  title="JPEG"
                  desc="White bg"
                />
                <ActionCard
                  icon={<Copy className="w-5 h-5" />}
                  title="Copy"
                  desc="Clipboard"
                />
                <ActionCard
                  icon={<RotateCw className="w-5 h-5" />}
                  title="Flip"
                  desc="Rotate"
                />
                <ActionCard
                  icon={<Shuffle className="w-5 h-5" />}
                  title="Random"
                  desc="Position"
                />
                <ActionCard
                  icon={<Maximize2 className="w-5 h-5" />}
                  title="Batch"
                  desc="Multi-export"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function QualityCard({ level, label, desc }) {
  return (
    <div className="p-3 rounded-lg bg-surface-elevated border border-border hover:border-accent text-center transition-colors duration-200">
      <div className="text-lg font-bold text-accent mb-0.5">{level}</div>
      <div className="text-sm font-semibold text-text-primary mb-0.5">
        {label}
      </div>
      <div className="text-xs text-text-muted">{desc}</div>
    </div>
  );
}

function ActionCard({ icon, title, desc }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-lg bg-surface-elevated border border-border hover:border-accent transition-colors duration-200">
      <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center text-accent shrink-0">
        {icon}
      </div>
      <div className="text-left">
        <div className="text-sm font-semibold text-text-primary">{title}</div>
        <div className="text-xs text-text-muted">{desc}</div>
      </div>
    </div>
  );
}
export default AboutPage;
