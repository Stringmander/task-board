import { NavLink, Outlet } from 'react-router'
import { ApiStatus } from '@/components/api-status'

const links = [
  { to: '/login', label: 'Login' },
  { to: '/register', label: 'Register' },
  { to: '/projects', label: 'Projects' },
]

export function RootLayout() {
  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <nav aria-label="Main">
          <ul className="flex gap-4">
            {links.map(({ to, label }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  className={({ isActive }) =>
                    isActive ? 'font-semibold underline' : 'hover:underline'
                  }
                >
                  {label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
        <ApiStatus />
      </header>
      <main className="p-6">
        <Outlet />
      </main>
    </div>
  )
}
