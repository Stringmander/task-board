import { useParams } from 'react-router';

export function ProjectDetailPage() {
  const { id } = useParams();
  return <h1 className="text-2xl font-semibold">Project {id}</h1>;
}
