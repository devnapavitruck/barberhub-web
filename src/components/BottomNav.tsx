import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import {
  Box,
  BottomNavigation,
  BottomNavigationAction,
  useTheme,
} from '@mui/material'
import HomeIcon from '@mui/icons-material/Home'
import SearchIcon from '@mui/icons-material/Search'
import PersonIcon from '@mui/icons-material/Person'
import BookOnlineIcon from '@mui/icons-material/BookOnline'
import { ROUTES } from '@/routes'

type Role = 'CLIENTE' | 'BARBERO'

interface Tab {
  label: string
  href: string
  icon: React.ReactNode
}

interface BottomNavProps {
  /** Si se define, sobreescribe el rol detectado desde localStorage */
  forcedRole?: Role
}

export default function BottomNav({ forcedRole }: BottomNavProps) {
  const router = useRouter()
  const theme = useTheme()

  const [role, setRole] = useState<Role>(forcedRole ?? 'CLIENTE')
  const [userId, setUserId] = useState<number | null>(null)

  // Leer rol y userId (o forzar rol si viene por prop)
  useEffect(() => {
    if (forcedRole) {
      setRole(forcedRole)
    } else {
      const storedRole = localStorage.getItem('barberHub:rol')
      if (storedRole === 'CLIENTE' || storedRole === 'BARBERO') {
        setRole(storedRole)
      } else {
        setRole('CLIENTE')
      }
    }

    const rawId = localStorage.getItem('barberHub:userId')
    setUserId(rawId ? Number(rawId) : null)
  }, [forcedRole])

  // Definir pestañas según rol
  const clienteTabs: Tab[] = [
    { label: 'Home', href: ROUTES.CLIENT.DASHBOARD, icon: <HomeIcon /> },
    { label: 'Buscar', href: `${ROUTES.CLIENT.DASHBOARD}/buscar`, icon: <SearchIcon /> },
    { label: 'Mi Perfil', href: ROUTES.CLIENT.PROFILE, icon: <PersonIcon /> },
  ]

  const barberoTabs: Tab[] = [
    { label: 'Home', href: ROUTES.BARBER.DASHBOARD, icon: <HomeIcon /> },
    { label: 'Reservas', href: '/dashboard/barbero/reservas', icon: <BookOnlineIcon /> },
    {
      label: 'Mi Perfil',
      href: userId !== null
        ? ROUTES.BARBER.PROFILE_PUBLIC(userId)
        : ROUTES.BARBER.PROFILE_EDIT,
      icon: <PersonIcon />,
    },
  ]

  const tabs = role === 'BARBERO' ? barberoTabs : clienteTabs

  // Tab activo según la ruta actual
  const path = router.asPath.split('?')[0]
  const match = tabs.find((t) => path.startsWith(t.href))
  const current = match?.href ?? tabs[0].href

  return (
    <Box sx={{ position: 'fixed', bottom: 0, left: 0, width: '100%' }}>
      <BottomNavigation
        showLabels
        value={current}
        onChange={(_, href) => router.push(href)}
        sx={{
          bgcolor: '#111',
          borderTop: `1px solid ${theme.palette.primary.main}`,
          zIndex: 10,
        }}
      >
        {tabs.map((t) => (
          <BottomNavigationAction
            key={t.href}
            label={t.label}
            value={t.href}
            icon={t.icon}
            sx={{
              color: '#888',
              '&.Mui-selected': { color: theme.palette.primary.main },
            }}
          />
        ))}
      </BottomNavigation>
    </Box>
  )
}
