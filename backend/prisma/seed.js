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

  // Contraseñas únicas por usuario
  const credenciales = [
    { username: 'admin',          password: 'Asilo@Admin2025',     nombre_completo: 'Administrador Sistema',  correo: 'admin@asilo.com',        id_rol: rolAdmin.id_rol },
    { username: 'director',       password: 'Director@2025!',      nombre_completo: 'Director General',       correo: 'director@asilo.com',     id_rol: rolDirector.id_rol },
    { username: 'medico.general', password: 'MedGen@Roberto25',    nombre_completo: 'Dr. Roberto Samayoa',    correo: 'rsamayoa@asilo.com',     id_rol: rolMedicoG.id_rol },
    { username: 'enfermero1',     password: 'Enferm@Carmen25',     nombre_completo: 'Licda. Carmen López',    correo: 'clopez@asilo.com',       id_rol: rolEnfermero.id_rol },
    { username: 'fundacion1',     password: 'Fund@Asilo2025!',     nombre_completo: 'Personal Fundación',     correo: 'fundacion@asilo.com',    id_rol: rolFundacion.id_rol },
    { username: 'especialista1',  password: 'Esp@AnaRuiz25!',      nombre_completo: 'Dra. Ana Leticia Ruiz', correo: 'aruiz@fundacion.com',    id_rol: rolMedicoE.id_rol },
    { username: 'laboratorio1',   password: 'Lab@Mario2025!',      nombre_completo: 'Lab. Mario García',     correo: 'mgarcia@fundacion.com',  id_rol: rolLab.id_rol },
    { username: 'farmacia1',      password: 'Farm@Luis2025!',      nombre_completo: 'Farm. Luis Pérez',      correo: 'lperez@fundacion.com',   id_rol: rolFarma.id_rol },
  ];

  for (const u of credenciales) {
    const hash = await bcrypt.hash(u.password, 12);
    await prisma.usuario.upsert({
      where: { username: u.username },
      update: { password_hash: hash },
      create: {
        username: u.username,
        nombre_completo: u.nombre_completo,
        correo: u.correo,
        id_rol: u.id_rol,
        password_hash: hash,
      }
    });
  }

  console.log('✅ Usuarios creados con contraseñas únicas');
  console.log('');
  console.log('Credenciales de acceso:');
  credenciales.forEach(u => console.log(`  ${u.username.padEnd(16)} → ${u.password}`));
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
