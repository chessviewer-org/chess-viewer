import DiagramWorkspace from '@/components/interactions/Editor/DiagramWorkspace';
import { FairyProblem } from '@/components/interactions/FairySetup/FairyProblem';
import { useHome } from '@/pages/HomePage/hooks/useHome';

export default function FairyChessPage() {
  const home = useHome('fairy');
  return (
    <DiagramWorkspace home={home} variant="fairy">
      <FairyProblem fen={home.fen} onChange={home.handleEditorFenChange} />
    </DiagramWorkspace>
  );
}
