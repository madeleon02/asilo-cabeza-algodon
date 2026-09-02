const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('Creando datos iniciales...');

  // Crear roles
  const roles = [
    { nombre_rol: 'administrador', descripcion: 'Administrador del asilo' },
    { nombre_rol: 'director', descripcion: 'Director del asilo' },
    { nombre_rol: 'medico_general', descripcion: 'Médico general del asilo' },
    { nombre_rol: 'enfermero', descripcion: 'Enfermero del asilo' },
    { nombre_rol: 'fundacion', descripcion: 'Personal de la fundación' },
    { nombre_rol: 'medico_especialista', descripcion: 'Médico especialista de la fundación' },
    { nombre_rol: 'laboratorista', descripcion: 'Laboratorista de la fundación' },
    { nombre_rol: 'farmaceutico', descripcion: 'Farmacéutico de la fundación' },
  ];

  for (const rol of roles) {
    await prisma.rol.upsert({
      where: { nombre_rol: rol.nombre_rol },
      update: {},
      create: rol
    });
  }
  console.log('✅ Roles creados');

  // Obtener roles
  const rolAdmin = await prisma.rol.findUnique({ where: { nombre_rol: 'administrador' } });
  const rolDirector = await prisma.rol.findUnique({ where: { nombre_rol: 'director' } });
  const rolMedicoG = await prisma.rol.findUnique({ where: { nombre_rol: 'medico_general' } });
  const rolEnfermero = await prisma.rol.findUnique({ where: { nombre_rol: 'enfermero' } });
  const rolFundacion = await prisma.rol.findUnique({ where: { nombre_rol: 'fundacion' } });
  const rolMedicoE = await prisma.rol.findUnique({ where: { nombre_rol: 'medico_especialista' } });
  const rolLab = await prisma.rol.findUnique({ where: { nombre_rol: 'laboratorista' } });
  const rolFarma = await prisma.rol.findUnique({ where: { nombre_rol: 'farmaceutico' } });

  // Crear usuarios
  const password = await bcrypt.hash('Admin123!', 12);

  const usuarios = [
    { username: 'admin', nombre_completo: 'Administrador Sistema', correo: 'admin@asilo.com', id_rol: rolAdmin.id_rol },
    { username: 'director', nombre_completo: 'Director General', correo: 'director@asilo.com', id_rol: rolDirector.id_rol },
    { username: 'medico.general', nombre_completo: 'Dr. Roberto Samayoa', correo: 'rsamayoa@asilo.com', id_rol: rolMedicoG.id_rol },
    { username: 'enfermero1', nombre_completo: 'Licda. Carmen López', correo: 'clopez@asilo.com', id_rol: rolEnfermero.id_rol },
    { username: 'fundacion1', nombre_completo: 'Personal Fundación', correo: 'fundacion@asilo.com', id_rol: rolFundacion.id_rol },
    { username: 'especialista1', nombre_completo: 'Dra. Ana Leticia Ruiz', correo: 'aruiz@fundacion.com', id_rol: rolMedicoE.id_rol },
    { username: 'laboratorio1', nombre_completo: 'Lab. Mario García', correo: 'mgarcia@fundacion.com', id_rol: rolLab.id_rol },
    { username: 'farmacia1', nombre_completo: 'Farm. Luis Pérez', correo: 'lperez@fundacion.com', id_rol: rolFarma.id_rol },
  ];

  for (const u of usuarios) {
    await prisma.usuario.upsert({
      where: { username: u.username },
      update: {},
      create: { ...u, password_hash: password }
    });
  }
  console.log('✅ Usuarios creados');
  console.log('');
  console.log('Credenciales de acceso (todos usan la misma contraseña):');
  console.log('Contraseña: Admin123!');
  usuarios.forEach(u => console.log(`  ${u.username} → ${u.nombre_completo}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());