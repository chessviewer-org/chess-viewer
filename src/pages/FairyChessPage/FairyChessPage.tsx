import DiagramWorkspace from '@/components/interactions/Editor/DiagramWorkspace';
import { useHome } from '@/pages/HomePage/hooks/useHome';

export default function FairyChessPage() {
  return <DiagramWorkspace home={useHome('fairy')} variant="fairy" />;
}
