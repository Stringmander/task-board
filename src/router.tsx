import { createBrowserRouter, Navigate } from 'react-router';
import { LoginPage } from '@/routes/login';
import { ProjectDetailPage } from '@/routes/project-detail';
import { ProjectsPage } from '@/routes/projects';
import { RegisterPage } from '@/routes/register';
import { RootLayout } from '@/routes/root-layout';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      { index: true, element: <Navigate to="/projects" replace /> },
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'projects', element: <ProjectsPage /> },
      { path: 'projects/:id', element: <ProjectDetailPage /> },
    ],
  },
]);
