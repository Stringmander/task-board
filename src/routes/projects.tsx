import { Link } from 'react-router'

export function ProjectsPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Projects</h1>
      <p className="mt-2">
        <Link to="/projects/example" className="underline">
          Example project
        </Link>
      </p>
    </>
  )
}
