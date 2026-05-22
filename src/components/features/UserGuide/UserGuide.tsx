import { useState } from 'react';

import {
  CheckCircle2,
  Copy,
  Download,
  FileText,
  Image,
  Info,
  Keyboard,
  Layers,
  Lightbulb,
  Maximize2,
  RotateCw,
  Shield,
  Shuffle,
  Sparkles,
  XCircle,
  Zap
} from 'lucide-react';

/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function UserGuide() {
  const [isExpanded, setIsExpanded] = useState(false);
  return (
    <div className="bg-surface rounded-2xl border border-border shadow-2xl overflow-hidden">
      {}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-5 flex items-center justify-between text-left group hover:bg-surface-hover/30 transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-inset"
        aria-expanded={isExpanded}
        aria-controls="user-guide-content"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-accent/60 to-secondary/60 flex items-center justify-center shadow-lg">
            <Info className="w-6 h-6 text-bg" aria-hidden="true" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-text-primary group-hover:text-accent transition-colors flex items-center gap-2">
              User Guide
            </h3>
            <p className="text-sm text-text-muted">
              {isExpanded ? 'Hide guide' : 'Learn how to use this tool'}
            </p>
          </div>
        </div>
        <div
          className={`transform transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
          aria-hidden="true"
        >
          <svg
            className="w-6 h-6 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 9l-7 7-7-7"
            />
          </svg>
        </div>
      </button>

      {}
      {isExpanded && (
        <div
          id="user-guide-content"
          className="px-6 pb-6 space-y-6 animate-fadeIn"
        >
          {}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <Layers className="w-5 h-5 text-blue-400" />
              </div>
              <h4 className="text-lg font-bold text-blue-400">
                Export Quality Levels
              </h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <QualityCard
                icon={<Zap className="w-5 h-5" />}
                level="8x Quality"
                resolution="3,200px × 3,200px"
                fileSize="~86KB - 1MB"
                use="Web & Social Media"
                description="Fast downloads, perfect for online sharing"
                color="green"
              />
              <QualityCard
                icon={<Shield className="w-5 h-5" />}
                level="16x Quality"
                resolution="6,400px × 6,400px"
                fileSize="~255KB - 3MB"
                use="Print & Presentations"
                description="Recommended for most use cases"
                color="blue"
                recommended
              />
              <QualityCard
                icon={<Sparkles className="w-5 h-5" />}
                level="24x Quality"
                resolution="9,600px × 9,600px"
                fileSize="~506KB - 6MB"
                use="Professional Print"
                description="High-resolution for large formats"
                color="purple"
              />
              <QualityCard
                icon={<Maximize2 className="w-5 h-5" />}
                level="32x Quality"
                resolution="12,800px × 12,800px"
                fileSize="~837KB - 6MB+"
                use="Maximum Quality"
                description="Ultra HD, largest file sizes"
                color="red"
              />
            </div>
          </div>

          {}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <Image className="w-5 h-5 text-amber-400" />
              </div>
              <h4 className="text-lg font-bold text-amber-400">File Formats</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormatCard
                icon={<FileText className="w-5 h-5" />}
                format="PNG"
                color="blue"
                pros={[
                  'Transparent background',
                  'Lossless compression',
                  'Best quality'
                ]}
                cons={['Larger file size', 'Slower to load']}
              />
              <FormatCard
                icon={<Download className="w-5 h-5" />}
                format="JPEG"
                color="amber"
                pros={[
                  'Smaller file size',
                  'Universal support',
                  'Fast loading'
                ]}
                cons={['No transparency', 'Lossy compression']}
              />
            </div>
          </div>

          {}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-green-600/20 flex items-center justify-center">
                <Lightbulb className="w-5 h-5 text-green-400" />
              </div>
              <h4 className="text-lg font-bold text-green-400">Pro Tips</h4>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <TipCard
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                text="Coordinates show white on screen, black when exported for print"
              />
              <TipCard
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                text="Validate FEN notation before exporting to ensure accuracy"
              />
              <TipCard
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                text="Use Batch Export to download multiple formats at once"
              />
              <TipCard
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                text="Random button generates creative positions for testing"
              />
              <TipCard
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                text="Higher quality settings may slow down older browsers"
              />
              <TipCard
                icon={<CheckCircle2 className="w-4 h-4 text-green-400" />}
                text="Board size range: 150-600px, adjustable in 50px steps"
              />
            </div>
          </div>

          {}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <Keyboard className="w-5 h-5 text-purple-400" />
              </div>
              <h4 className="text-lg font-bold text-purple-400">
                Quick Actions
              </h4>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ActionCard
                icon={<Copy className="w-4 h-4" />}
                action="Copy Image"
                description="Copy to clipboard instantly"
                color="green"
              />
              <ActionCard
                icon={<FileText className="w-4 h-4" />}
                action="Copy FEN"
                description="Copy position notation"
                color="blue"
              />
              <ActionCard
                icon={<RotateCw className="w-4 h-4" />}
                action="Flip Board"
                description="View from black's perspective"
                color="purple"
              />
              <ActionCard
                icon={<Shuffle className="w-4 h-4" />}
                action="Random Position"
                description="Generate test positions"
                color="pink"
              />
            </div>
          </div>

          {}
          <div className="bg-gradient-to-br from-blue-950/40 to-purple-950/40 rounded-xl p-5 border border-blue-700/30">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-5 h-5 text-blue-400" />
              </div>
              <div className="space-y-2">
                <h5 className="font-bold text-blue-300 text-base">
                  Best Practices
                </h5>
                <ul className="text-sm text-gray-300 space-y-1.5">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>
                      Use <strong>16x quality</strong> for balanced file size
                      and quality
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>
                      Choose <strong>PNG</strong> for transparency or{' '}
                      <strong>JPEG</strong> for smaller files
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>Enable coordinates for instructional diagrams</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-400 mt-0.5">•</span>
                    <span>
                      Test different themes to match your content style
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function QualityCard({
  icon,
  level,
  resolution,
  fileSize,
  use,
  description,
  color,
  recommended
}) {
  const colors = {
    green: 'from-green-600/10 to-green-600/5 border-green-600/30',
    blue: 'from-blue-600/10 to-blue-600/5 border-blue-600/30',
    purple: 'from-purple-600/10 to-purple-600/5 border-purple-600/30',
    red: 'from-red-600/10 to-red-600/5 border-red-600/30'
  };
  const iconColors = {
    green: 'text-green-400',
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    red: 'text-red-400'
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 space-y-3 hover:shadow-lg transition-shadow duration-200 relative`}
    >
      {recommended && (
        <div className="absolute -top-2 -right-2 bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
          Recommended
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className={iconColors[color]}>{icon}</div>
        <h5 className={`font-bold text-base ${iconColors[color]}`}>{level}</h5>
      </div>
      <div className="space-y-1.5">
        <p className="text-xs text-gray-400 font-mono">{resolution}</p>
        <p className="text-xs text-gray-300 font-semibold">{use}</p>
        <p className="text-xs text-gray-400">{description}</p>
        <p className="text-xs text-gray-500 italic">{fileSize}</p>
      </div>
    </div>
  );
}
/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function FormatCard({ icon, format, color, pros, cons }) {
  const colors = {
    blue: 'from-blue-600/10 to-blue-600/5 border-blue-600/30 text-blue-400',
    amber:
      'from-amber-600/10 to-amber-600/5 border-amber-600/30 text-amber-400',
    purple:
      'from-purple-600/10 to-purple-600/5 border-purple-600/30 text-purple-400'
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-xl p-4 space-y-3 hover:shadow-lg transition-shadow duration-200`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h5 className="font-bold text-base">{format}</h5>
      </div>
      <div className="space-y-2">
        <div className="space-y-1">
          {pros.map((pro) => (
            <div
              key={pro}
              className="flex items-start gap-2 text-xs text-green-400"
            >
              <CheckCircle2 className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{pro}</span>
            </div>
          ))}
        </div>
        <div className="space-y-1">
          {cons.map((con) => (
            <div
              key={con}
              className="flex items-start gap-2 text-xs text-red-400"
            >
              <XCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span>{con}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/**
 * @param {Object} props
 * @returns {JSX.Element}
 */
function TipCard({ icon, text }) {
  return (
    <div className="bg-gray-800/50 rounded-lg p-3 flex items-start gap-3 hover:bg-gray-700/50 transition-colors duration-200 border border-gray-700/50">
      <div className="flex-shrink-0 mt-0.5">{icon}</div>
      <p className="text-sm text-gray-300 leading-relaxed">{text}</p>
    </div>
  );
}

function ActionCard({ icon, action, description, color }) {
  const colors = {
    green:
      'from-green-600/10 to-green-600/5 border-green-600/30 text-green-400',
    blue: 'from-blue-600/10 to-blue-600/5 border-blue-600/30 text-blue-400',
    purple:
      'from-purple-600/10 to-purple-600/5 border-purple-600/30 text-purple-400',
    pink: 'from-pink-600/10 to-pink-600/5 border-pink-600/30 text-pink-400'
  };
  return (
    <div
      className={`bg-gradient-to-br ${colors[color]} border rounded-lg p-4 space-y-2 hover:shadow-lg transition-shadow duration-200`}
    >
      <div className="flex items-center gap-2">
        {icon}
        <h6 className="font-bold text-sm">{action}</h6>
      </div>
      <p className="text-xs text-gray-400">{description}</p>
    </div>
  );
}
export default UserGuide;
