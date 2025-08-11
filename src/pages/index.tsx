// src/pages/index.tsx

import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import Image from 'next/image';
import { Box, Button, Typography, useTheme } from '@mui/material';
import { motion, useScroll, useTransform } from 'framer-motion';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import StarIcon from '@mui/icons-material/Star';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import InstagramIcon from '@mui/icons-material/Instagram';
import FacebookIcon from '@mui/icons-material/Facebook';
import TwitterIcon from '@mui/icons-material/Twitter';

// Creamos un MotionButton que acepte cualquier prop (component, href, etc.)
const MotionButton = motion(Button as React.ComponentType<any>);

export default function Home() {
  const theme = useTheme();
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 300], ['0%', '20%']);

  return (
    <>
      <Head>
        <title>BarberHub – Encuentra tu Barbero Ideal</title>
        <meta
          name="description"
          content="BarberHub conecta barberos con clientes en Chile. Reservas rápidas, perfiles confiables y valoraciones reales."
        />
        <meta property="og:title" content="BarberHub – Encuentra tu Barbero Ideal" />
        <meta
          property="og:description"
          content="BarberHub conecta barberos con clientes en Chile. Reservas rápidas, perfiles confiables y valoraciones reales."
        />
        <meta property="og:image" content="/images/barbero_cliente.jpg" />
        <meta property="og:url" content="https://tudominio.com" />
        <meta name="twitter:card" content="summary_large_image" />
      </Head>

      {/* 1. HEADER */}
      <Box
        component="header"
        sx={{
          position: 'fixed',
          top: 0,
          width: '100%',
          height: 64,
          px: 2,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          backgroundColor: 'background.paper',
          boxShadow: 1,
          zIndex: 1200,
        }}
      >
        <motion.div
          initial={{ scale: 0.8, rotate: -5 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Image
            src="/images/logo-transparente.png"
            alt="BarberHub Logo"
            width={120}
            height={40}
            style={{ objectFit: 'contain' }}
          />
        </motion.div>

        {/* Botón de login dorado */}
        <MotionButton
          component={Link}
          href="/login"
          variant="outlined"
          sx={{
            textTransform: 'none',
            fontFamily: 'Montserrat, sans-serif',
            fontWeight: 900,
            border: `2px solid ${theme.palette.primary.main}`,
            color: theme.palette.primary.main,
            '&:hover': {
              bgcolor: 'rgba(212,175,55,0.1)',
            },
          }}
        >
          Iniciar Sesión
        </MotionButton>
      </Box>

      {/* 2. Spacer */}
      <Box sx={{ height: 64 }} />

      {/* 3. HERO */}
      <motion.div style={{ backgroundPositionY: bgY }}>
        <Box
          component="section"
          sx={{
            position: 'relative',
            height: { xs: '50vh', sm: '70vh' },
            backgroundImage: 'url(/images/barbero_cliente.jpg)',
            backgroundSize: 'cover',
            backgroundPosition: 'center top',
            backgroundRepeat: 'no-repeat',
            backgroundAttachment: 'fixed',
          }}
        >
          {/* overlay */}
          <Box
            sx={{
              position: 'absolute',
              inset: 0,
              background:
                'linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.75))',
              zIndex: 1,
            }}
          />
          <Box
            sx={{
              position: 'relative',
              zIndex: 2,
              height: '100%',
              px: { xs: 2, sm: 4 },
              pt: { xs: '60px', sm: '100px' },
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            {/* TÍTULO */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3, duration: 1 }}
            >
              <Typography
                variant="h2"
                sx={{
                  color: theme.palette.primary.main,
                  fontWeight: 900,
                  typography: { xs: 'h5', sm: 'h4', md: 'h2' },
                  lineHeight: 1.2,
                  fontFamily: 'Montserrat, sans-serif',
                }}
              >
                BarberHub: Encuentra tu Barbero Ideal en Segundos
              </Typography>
            </motion.div>

            {/* SUBTÍTULO */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6, duration: 1 }}
            >
              <Typography
                variant="body1"
                sx={{
                  color: '#FFF',
                  mt: 2,
                  maxWidth: 600,
                  typography: { xs: 'body2', sm: 'body1' },
                  lineHeight: 1.5,
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 800,
                }}
              >
                Conecta con barberos confiables en Chile. Reservas rápidas, perfiles detallados y valoraciones reales.
              </Typography>
            </motion.div>

            {/* BOTONES CTA */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9, duration: 1 }}
              style={{
                display: 'flex',
                gap: 16,
                flexWrap: 'wrap',
                justifyContent: 'center',
                marginTop: 24,
              }}
            >
              <MotionButton
                component={Link}
                href="/register?rol=CLIENTE"
                variant="outlined"
                size="large"
                whileHover={{ translateY: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.97 }}
                sx={{
                  textTransform: 'none',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  minWidth: { xs: '100%', sm: '200px' },
                  py: 1.25,
                  border: `2px solid ${theme.palette.primary.main}`,
                  color: theme.palette.primary.main,
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
                }}
              >
                SOY CLIENTE: REGÍSTRATE
              </MotionButton>

              <MotionButton
                component={Link}
                href="/register?rol=BARBERO"
                variant="outlined"
                size="large"
                whileHover={{ translateY: -2, boxShadow: '0 8px 16px rgba(0,0,0,0.2)' }}
                whileTap={{ scale: 0.97 }}
                sx={{
                  textTransform: 'none',
                  fontFamily: 'Montserrat, sans-serif',
                  fontWeight: 900,
                  minWidth: { xs: '100%', sm: '200px' },
                  py: 1.25,
                  border: `2px solid ${theme.palette.primary.main}`,
                  color: theme.palette.primary.main,
                  bgcolor: 'transparent',
                  '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
                }}
              >
                SOY BARBERO: REGÍSTRATE
              </MotionButton>
            </motion.div>
          </Box>
        </Box>
      </motion.div>

      {/* 4. ¿Cómo Usar BarberHub? */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <Box
          component="section"
          sx={{
            mt: { xs: 2, sm: 4 },
            bgcolor: '#000',
            px: { xs: 2, sm: 4 },
            py: { xs: 6, sm: 10 },
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: theme.palette.primary.main,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              typography: { xs: 'h5', sm: 'h4', md: 'h3' },
              mb: { xs: 4, sm: 6 },
            }}
          >
            ¿Cómo Usar BarberHub?
          </Typography>
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'row', sm: 'row' },
              overflowX: { xs: 'auto', sm: 'visible' },
              gap: { xs: 2, sm: 4 },
              pb: { xs: 2, sm: 0 },
            }}
          >
            {[
              { Icon: PersonAddIcon, title: 'Regístrate en 1 minuto', text: 'Crea tu cuenta rápidamente.' },
              { Icon: SearchIcon, title: 'Busca y Reserva', text: 'Elige barbero, día y hora.' },
              { Icon: StarIcon, title: 'Valora y Repite', text: 'Deja tu valoración y vuelve cuando quieras.' },
            ].map(({ Icon, title, text }, i) => (
              <Box
                key={i}
                sx={{
                  minWidth: { xs: 240, sm: 'auto' },
                  bgcolor: '#111',
                  border: `1px solid ${theme.palette.primary.main}`,
                  borderRadius: 2,
                  p: 3,
                  flexShrink: 0,
                }}
              >
                <Icon
                  sx={{
                    fontSize: 48,
                    color: theme.palette.primary.main,
                    mb: 2,
                    display: 'block',
                    mx: 'auto',
                  }}
                />
                <Typography
                  variant="h6"
                  sx={{
                    color: theme.palette.primary.main,
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 800,
                    mb: 1,
                  }}
                >
                  {title}
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: '#FFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 400,
                  }}
                >
                  {text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </motion.div>

      {/* 5. Por Qué Elegirnos */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <Box
          component="section"
          sx={{
            mt: { xs: 2, sm: 4 },
            bgcolor: '#000',
            px: { xs: 2, sm: 4 },
            py: { xs: 6, sm: 10 },
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: theme.palette.primary.main,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              typography: { xs: 'h5', sm: 'h4', md: 'h3' },
              mb: { xs: 4, sm: 6 },
            }}
          >
            Por Qué Elegirnos
          </Typography>
          <Box
            component="ul"
            sx={{
              listStyle: 'none',
              p: 0,
              m: 0,
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 3,
              maxWidth: 800,
              mx: 'auto',
            }}
          >
            {[
              'Disponibilidad: Encuentra barberos libres ahora.',
              'Confianza: Perfiles con galerías y reseñas (1 a 5 estrellas).',
              'Mobile-First: Accede desde tu celular, fácil y rápido.',
              'Local: Empezamos en Chile, con ubicaciones por región/comuna.',
            ].map((text, i) => (
              <Box
                key={i}
                component="li"
                sx={{
                  display: 'flex',
                  alignItems: 'flex-start',
                }}
              >
                <CheckCircleIcon
                  sx={{
                    color: theme.palette.primary.main,
                    mt: '4px',
                    mr: 1.5,
                  }}
                />
                <Typography
                  variant="body1"
                  sx={{
                    color: '#FFF',
                    fontFamily: 'Montserrat, sans-serif',
                    fontWeight: 800,
                  }}
                >
                  {text}
                </Typography>
              </Box>
            ))}
          </Box>
        </Box>
      </motion.div>

      {/* 6. Únete como Barbero */}
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.8 }}
      >
        <Box
          component="section"
          sx={{
            mt: { xs: 2, sm: 4 },
            bgcolor: '#000',
            px: { xs: 2, sm: 4 },
            py: { xs: 6, sm: 10 },
            textAlign: 'center',
          }}
        >
          <Typography
            variant="h3"
            sx={{
              color: theme.palette.primary.main,
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              typography: { xs: 'h5', sm: 'h4', md: 'h3' },
              mb: { xs: 3, sm: 4 },
            }}
          >
            Únete como Barbero
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: '#FFF',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 400,
              mb: { xs: 4, sm: 6 },
              maxWidth: 600,
              mx: 'auto',
              lineHeight: 1.5,
            }}
          >
            Visibiliza tu talento, gestiona reservas y haz crecer tu negocio con BarberHub. Es gratis y tarda menos de 30 segundos.
          </Typography>
          <Button
            component={motion.button}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98, boxShadow: 'inset 0 0 8px rgba(0,0,0,0.2)' }}
            variant="outlined"
            size="large"
            sx={{
              textTransform: 'none',
              fontFamily: 'Montserrat, sans-serif',
              fontWeight: 900,
              minWidth: { xs: '100%', sm: '240px' },
              py: 1.5,
              border: `2px solid ${theme.palette.primary.main}`,
              color: theme.palette.primary.main,
              bgcolor: 'transparent',
              mb: { xs: 0, sm: 6 },
              '&:hover': { bgcolor: 'rgba(212,175,55,0.1)' },
            }}
          >
            Registrarme como Barbero
          </Button>
          <Box
            sx={{
              display: 'flex',
              gap: 2,
              overflowX: 'auto',
              pt: 2,
              pb: { xs: 2, sm: 0 },
            }}
          >
            {['maquina.jpg', 'maquinas.jpg', 'mostrador.jpg'].map((img, i) => (
              <Box
                key={i}
                component="img"
                src={`/images/${img}`}
                alt={img}
                sx={{
                  width: 120,
                  height: 120,
                  borderRadius: 2,
                  objectFit: 'cover',
                  flexShrink: 0,
                }}
              />
            ))}
          </Box>
        </Box>
      </motion.div>

      {/* FOOTER */}
<Box
  component="footer"
  sx={{
    bgcolor: '#111',
    color: '#888',
    px: { xs: 2, sm: 4 },
    py: 6,
    textAlign: 'center',
  }}
>
  {/* enlaces */}
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 4 }}>
    <Link href="/terminos" passHref>
      <Typography
        // ya no component="a"
        sx={{
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'color 0.3s',
          '&:hover': { color: theme.palette.primary.main },
        }}
      >
        Términos
      </Typography>
    </Link>
    <Link href="/privacidad" passHref>
      <Typography
        sx={{
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'color 0.3s',
          '&:hover': { color: theme.palette.primary.main },
        }}
      >
        Privacidad
      </Typography>
    </Link>
    <Link href="/contacto" passHref>
      <Typography
        sx={{
          textDecoration: 'none',
          cursor: 'pointer',
          transition: 'color 0.3s',
          '&:hover': { color: theme.palette.primary.main },
        }}
      >
        Contacto
      </Typography>
    </Link>
  </Box>

  {/* redes sociales */}
  <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 2 }}>
    <InstagramIcon
      sx={{
        cursor: 'pointer',
        transition: 'color 0.3s',
        '&:hover': { color: theme.palette.primary.main },
      }}
    />
    <FacebookIcon
      sx={{
        cursor: 'pointer',
        transition: 'color 0.3s',
        '&:hover': { color: theme.palette.primary.main },
      }}
    />
    <TwitterIcon
      sx={{
        cursor: 'pointer',
        transition: 'color 0.3s',
        '&:hover': { color: theme.palette.primary.main },
      }}
    />
  </Box>

  {/* copyright */}
  <Typography variant="body2" sx={{ fontFamily: 'Montserrat, sans-serif' }}>
    © 2025 BarberHub. Todos los derechos reservados.
  </Typography>
</Box>

    </>
  );
}


