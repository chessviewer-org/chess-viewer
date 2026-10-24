import DiagramWorkspace from '@/components/interactions/Editor/DiagramWorkspace';
import { useHome } from './hooks/useHome';

export default function HomePage() {
  const home = useHome();
  return <DiagramWorkspace home={home} />;
}
