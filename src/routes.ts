// src/routes.ts
export const ROUTES = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
  },
  CLIENT: {
    DASHBOARD: '/dashboard/cliente',
    PROFILE: '/dashboard/cliente/perfil',
  },
  BARBER: {
    DASHBOARD: '/dashboard/barbero',
    AGENDA: '/dashboard/barbero/agenda',
    PROFILE_EDIT: '/dashboard/barbero/perfil',
    PROFILE_PUBLIC: (id: number) => `/barbero/${id}`,
    SERVICES: '/dashboard/barbero/servicios',
  },
}
