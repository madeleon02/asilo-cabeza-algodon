-- CreateEnum
CREATE TYPE "EstadoInterno" AS ENUM ('activo', 'hospitalizado', 'egresado', 'fallecido');

-- CreateEnum
CREATE TYPE "EstadoSolicitud" AS ENUM ('pendiente', 'asignada', 'en_proceso', 'completada', 'cancelada');

-- CreateEnum
CREATE TYPE "EstadoExamen" AS ENUM ('pendiente', 'realizado', 'cancelado');

-- CreateEnum
CREATE TYPE "EstadoDespacho" AS ENUM ('pendiente', 'despachado', 'cancelado');

-- CreateEnum
CREATE TYPE "EstadoCobro" AS ENUM ('pendiente', 'parcial', 'pagado');

-- CreateEnum
CREATE TYPE "TipoDonante" AS ENUM ('empresa_internacional', 'empresa_nacional', 'gobierno', 'particular');

-- CreateTable
CREATE TABLE "Rol" (
    "id_rol" SERIAL NOT NULL,
    "nombre_rol" TEXT NOT NULL,
    "descripcion" TEXT,

    CONSTRAINT "Rol_pkey" PRIMARY KEY ("id_rol")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "id_usuario" SERIAL NOT NULL,
    "id_rol" INTEGER NOT NULL,
    "username" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "correo" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "ultimo_acceso" TIMESTAMP(3),

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("id_usuario")
);

-- CreateTable
CREATE TABLE "Medico" (
    "id_medico" SERIAL NOT NULL,
    "id_usuario" INTEGER NOT NULL,
    "nombre_completo" TEXT NOT NULL,
    "especialidad" TEXT NOT NULL,
    "num_colegiado" TEXT NOT NULL,
    "pertenece_fundacion" BOOLEAN NOT NULL DEFAULT false,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "Medico_pkey" PRIMARY KEY ("id_medico")
);

-- CreateTable
CREATE TABLE "Familiar" (
    "id_familiar" SERIAL NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "parentesco" TEXT NOT NULL,
    "telefono" TEXT NOT NULL,
    "correo_electronico" TEXT NOT NULL,
    "direccion" TEXT,
    "saldo_pendiente" DECIMAL(10,2) NOT NULL DEFAULT 0,

    CONSTRAINT "Familiar_pkey" PRIMARY KEY ("id_familiar")
);

-- CreateTable
CREATE TABLE "Interno" (
    "id_interno" SERIAL NOT NULL,
    "id_familiar" INTEGER NOT NULL,
    "nombres" TEXT NOT NULL,
    "apellidos" TEXT NOT NULL,
    "dpi" TEXT NOT NULL,
    "fecha_nacimiento" DATE NOT NULL,
    "fecha_ingreso" DATE NOT NULL,
    "estado" "EstadoInterno" NOT NULL DEFAULT 'activo',
    "motivo_ingreso" TEXT,
    "fecha_registro" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Interno_pkey" PRIMARY KEY ("id_interno")
);

-- CreateTable
CREATE TABLE "PsicopatologiaInterno" (
    "id_psicopatologia" SERIAL NOT NULL,
    "id_interno" INTEGER NOT NULL,
    "nombre_condicion" TEXT NOT NULL,
    "descripcion" TEXT,
    "fecha_diagnostico" DATE,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "PsicopatologiaInterno_pkey" PRIMARY KEY ("id_psicopatologia")
);

-- CreateTable
CREATE TABLE "MedicamentoCajon" (
    "id_med_cajon" SERIAL NOT NULL,
    "id_interno" INTEGER NOT NULL,
    "nombre_medicamento" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "tiempo_aplicacion" TEXT,
    "activo" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MedicamentoCajon_pkey" PRIMARY KEY ("id_med_cajon")
);

-- CreateTable
CREATE TABLE "SolicitudReferencia" (
    "id_solicitud" SERIAL NOT NULL,
    "id_interno" INTEGER NOT NULL,
    "id_medico_general" INTEGER NOT NULL,
    "id_medico_especialista" INTEGER,
    "id_enfermero" INTEGER,
    "especialidad_requerida" TEXT NOT NULL,
    "motivo_referencia" TEXT NOT NULL,
    "estado" "EstadoSolicitud" NOT NULL DEFAULT 'pendiente',
    "fecha_creacion" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_cita" TIMESTAMP(3),
    "correo_enviado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "SolicitudReferencia_pkey" PRIMARY KEY ("id_solicitud")
);

-- CreateTable
CREATE TABLE "VisitaMedica" (
    "id_visita" SERIAL NOT NULL,
    "id_solicitud" INTEGER NOT NULL,
    "id_interno" INTEGER NOT NULL,
    "id_medico_especialista" INTEGER NOT NULL,
    "fecha_visita" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "motivo_visita" TEXT NOT NULL,
    "diagnostico" TEXT NOT NULL,
    "observaciones" TEXT,
    "costo_consulta" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" TEXT NOT NULL DEFAULT 'en_proceso',

    CONSTRAINT "VisitaMedica_pkey" PRIMARY KEY ("id_visita")
);

-- CreateTable
CREATE TABLE "ExamenSolicitado" (
    "id_examen" SERIAL NOT NULL,
    "id_visita" INTEGER NOT NULL,
    "nombre_examen" TEXT NOT NULL,
    "descripcion" TEXT,
    "costo_examen" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado" "EstadoExamen" NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "ExamenSolicitado_pkey" PRIMARY KEY ("id_examen")
);

-- CreateTable
CREATE TABLE "ResultadoLaboratorio" (
    "id_resultado" SERIAL NOT NULL,
    "id_examen" INTEGER NOT NULL,
    "id_laboratorista" INTEGER NOT NULL,
    "resultado_texto" TEXT NOT NULL,
    "valores_referencia" TEXT,
    "fecha_resultado" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "ResultadoLaboratorio_pkey" PRIMARY KEY ("id_resultado")
);

-- CreateTable
CREATE TABLE "Prescripcion" (
    "id_prescripcion" SERIAL NOT NULL,
    "id_visita" INTEGER NOT NULL,
    "nombre_medicamento" TEXT NOT NULL,
    "cantidad" TEXT NOT NULL,
    "dosis" TEXT NOT NULL,
    "tiempo_aplicacion" TEXT NOT NULL,
    "costo_medicamento" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "estado_despacho" "EstadoDespacho" NOT NULL DEFAULT 'pendiente',

    CONSTRAINT "Prescripcion_pkey" PRIMARY KEY ("id_prescripcion")
);

-- CreateTable
CREATE TABLE "DespachoFarmacia" (
    "id_despacho" SERIAL NOT NULL,
    "id_prescripcion" INTEGER NOT NULL,
    "id_farmaceutico" INTEGER NOT NULL,
    "fecha_despacho" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "observaciones" TEXT,

    CONSTRAINT "DespachoFarmacia_pkey" PRIMARY KEY ("id_despacho")
);

-- CreateTable
CREATE TABLE "CobroFamiliar" (
    "id_cobro" SERIAL NOT NULL,
    "id_familiar" INTEGER NOT NULL,
    "id_interno" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto_total" DECIMAL(10,2) NOT NULL,
    "monto_pagado" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "saldo_pendiente" DECIMAL(10,2) NOT NULL,
    "fecha_cobro" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estado" "EstadoCobro" NOT NULL DEFAULT 'pendiente',
    "fecha_pago_completo" DATE,

    CONSTRAINT "CobroFamiliar_pkey" PRIMARY KEY ("id_cobro")
);

-- CreateTable
CREATE TABLE "Donacion" (
    "id_donacion" SERIAL NOT NULL,
    "id_usuario_registro" INTEGER NOT NULL,
    "tipo_donante" "TipoDonante" NOT NULL,
    "nombre_donante" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_donacion" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,

    CONSTRAINT "Donacion_pkey" PRIMARY KEY ("id_donacion")
);

-- CreateTable
CREATE TABLE "GastoOperativo" (
    "id_gasto" SERIAL NOT NULL,
    "id_usuario_registro" INTEGER NOT NULL,
    "categoria" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_gasto" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "proveedor" TEXT,

    CONSTRAINT "GastoOperativo_pkey" PRIMARY KEY ("id_gasto")
);

-- CreateTable
CREATE TABLE "PagoFundacion" (
    "id_pago_fundacion" SERIAL NOT NULL,
    "id_usuario_registro" INTEGER NOT NULL,
    "monto" DECIMAL(10,2) NOT NULL,
    "fecha_pago" DATE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "descripcion" TEXT,

    CONSTRAINT "PagoFundacion_pkey" PRIMARY KEY ("id_pago_fundacion")
);

-- CreateIndex
CREATE UNIQUE INDEX "Rol_nombre_rol_key" ON "Rol"("nombre_rol");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_username_key" ON "Usuario"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Usuario_correo_key" ON "Usuario"("correo");

-- CreateIndex
CREATE UNIQUE INDEX "Medico_id_usuario_key" ON "Medico"("id_usuario");

-- CreateIndex
CREATE UNIQUE INDEX "Medico_num_colegiado_key" ON "Medico"("num_colegiado");

-- CreateIndex
CREATE UNIQUE INDEX "Familiar_correo_electronico_key" ON "Familiar"("correo_electronico");

-- CreateIndex
CREATE UNIQUE INDEX "Interno_dpi_key" ON "Interno"("dpi");

-- CreateIndex
CREATE UNIQUE INDEX "VisitaMedica_id_solicitud_key" ON "VisitaMedica"("id_solicitud");

-- CreateIndex
CREATE UNIQUE INDEX "ResultadoLaboratorio_id_examen_key" ON "ResultadoLaboratorio"("id_examen");

-- CreateIndex
CREATE UNIQUE INDEX "DespachoFarmacia_id_prescripcion_key" ON "DespachoFarmacia"("id_prescripcion");

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_id_rol_fkey" FOREIGN KEY ("id_rol") REFERENCES "Rol"("id_rol") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Medico" ADD CONSTRAINT "Medico_id_usuario_fkey" FOREIGN KEY ("id_usuario") REFERENCES "Usuario"("id_usuario") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Interno" ADD CONSTRAINT "Interno_id_familiar_fkey" FOREIGN KEY ("id_familiar") REFERENCES "Familiar"("id_familiar") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PsicopatologiaInterno" ADD CONSTRAINT "PsicopatologiaInterno_id_interno_fkey" FOREIGN KEY ("id_interno") REFERENCES "Interno"("id_interno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MedicamentoCajon" ADD CONSTRAINT "MedicamentoCajon_id_interno_fkey" FOREIGN KEY ("id_interno") REFERENCES "Interno"("id_interno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudReferencia" ADD CONSTRAINT "SolicitudReferencia_id_interno_fkey" FOREIGN KEY ("id_interno") REFERENCES "Interno"("id_interno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudReferencia" ADD CONSTRAINT "SolicitudReferencia_id_medico_general_fkey" FOREIGN KEY ("id_medico_general") REFERENCES "Medico"("id_medico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SolicitudReferencia" ADD CONSTRAINT "SolicitudReferencia_id_medico_especialista_fkey" FOREIGN KEY ("id_medico_especialista") REFERENCES "Medico"("id_medico") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaMedica" ADD CONSTRAINT "VisitaMedica_id_solicitud_fkey" FOREIGN KEY ("id_solicitud") REFERENCES "SolicitudReferencia"("id_solicitud") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaMedica" ADD CONSTRAINT "VisitaMedica_id_interno_fkey" FOREIGN KEY ("id_interno") REFERENCES "Interno"("id_interno") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VisitaMedica" ADD CONSTRAINT "VisitaMedica_id_medico_especialista_fkey" FOREIGN KEY ("id_medico_especialista") REFERENCES "Medico"("id_medico") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExamenSolicitado" ADD CONSTRAINT "ExamenSolicitado_id_visita_fkey" FOREIGN KEY ("id_visita") REFERENCES "VisitaMedica"("id_visita") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoLaboratorio" ADD CONSTRAINT "ResultadoLaboratorio_id_examen_fkey" FOREIGN KEY ("id_examen") REFERENCES "ExamenSolicitado"("id_examen") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Prescripcion" ADD CONSTRAINT "Prescripcion_id_visita_fkey" FOREIGN KEY ("id_visita") REFERENCES "VisitaMedica"("id_visita") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DespachoFarmacia" ADD CONSTRAINT "DespachoFarmacia_id_prescripcion_fkey" FOREIGN KEY ("id_prescripcion") REFERENCES "Prescripcion"("id_prescripcion") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroFamiliar" ADD CONSTRAINT "CobroFamiliar_id_familiar_fkey" FOREIGN KEY ("id_familiar") REFERENCES "Familiar"("id_familiar") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CobroFamiliar" ADD CONSTRAINT "CobroFamiliar_id_interno_fkey" FOREIGN KEY ("id_interno") REFERENCES "Interno"("id_interno") ON DELETE RESTRICT ON UPDATE CASCADE;
