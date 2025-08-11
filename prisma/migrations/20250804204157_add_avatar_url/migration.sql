-- CreateTable
CREATE TABLE `Usuario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `rol` ENUM('CLIENTE', 'BARBERO') NOT NULL,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Usuario_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerfilCliente` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `nacimiento` DATETIME(3) NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `comuna` VARCHAR(191) NOT NULL,
    `ciudad` VARCHAR(191) NOT NULL,

    UNIQUE INDEX `PerfilCliente_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `PerfilBarbero` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `usuarioId` INTEGER NOT NULL,
    `avatarUrl` VARCHAR(191) NULL,
    `nombres` VARCHAR(191) NOT NULL,
    `apellidos` VARCHAR(191) NOT NULL,
    `telefono` VARCHAR(191) NOT NULL,
    `nacimiento` DATETIME(3) NOT NULL,
    `nombreBarberia` VARCHAR(191) NOT NULL,
    `descripcion` VARCHAR(191) NOT NULL,
    `experiencia` INTEGER NOT NULL,
    `region` VARCHAR(191) NOT NULL,
    `comuna` VARCHAR(191) NOT NULL,
    `ciudad` VARCHAR(191) NOT NULL,
    `direccion` VARCHAR(191) NOT NULL,
    `redesSociales` LONGTEXT NULL,
    `especialidades` LONGTEXT NOT NULL,
    `certificaciones` VARCHAR(191) NULL,
    `idiomas` LONGTEXT NOT NULL,
    `metodosPago` LONGTEXT NULL,
    `politicasCancel` VARCHAR(191) NULL,
    `mostrarConteo` BOOLEAN NOT NULL DEFAULT true,

    UNIQUE INDEX `PerfilBarbero_usuarioId_key`(`usuarioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Servicio` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barberoId` INTEGER NOT NULL,
    `nombre` VARCHAR(191) NOT NULL,
    `duracion` INTEGER NOT NULL,
    `precio` INTEGER NOT NULL,

    INDEX `Servicio_barberoId_fkey`(`barberoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Horario` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barberoId` INTEGER NOT NULL,
    `dia` VARCHAR(191) NOT NULL,
    `inicio` VARCHAR(191) NOT NULL,
    `fin` VARCHAR(191) NOT NULL,
    `pausaInicio` VARCHAR(191) NULL,
    `pausaFin` VARCHAR(191) NULL,

    INDEX `Horario_barberoId_fkey`(`barberoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Reserva` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `barberoId` INTEGER NOT NULL,
    `servicioId` INTEGER NOT NULL,
    `fecha` DATETIME(3) NOT NULL,
    `estado` VARCHAR(191) NOT NULL,
    `motivoCancel` VARCHAR(191) NULL,
    `completadaAt` DATETIME(3) NULL,

    INDEX `Reserva_barberoId_fkey`(`barberoId`),
    INDEX `Reserva_clienteId_fkey`(`clienteId`),
    INDEX `Reserva_servicioId_fkey`(`servicioId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Valoracion` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `reservaId` INTEGER NOT NULL,
    `tijeras` INTEGER NOT NULL,
    `resena` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `Valoracion_reservaId_key`(`reservaId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Favorito` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `clienteId` INTEGER NOT NULL,
    `barberoId` INTEGER NOT NULL,

    INDEX `Favorito_barberoId_fkey`(`barberoId`),
    INDEX `Favorito_clienteId_fkey`(`clienteId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Galeria` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `barberoId` INTEGER NOT NULL,
    `url` VARCHAR(191) NOT NULL,

    INDEX `Galeria_barberoId_fkey`(`barberoId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `PerfilCliente` ADD CONSTRAINT `PerfilCliente_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `PerfilBarbero` ADD CONSTRAINT `PerfilBarbero_usuarioId_fkey` FOREIGN KEY (`usuarioId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Servicio` ADD CONSTRAINT `Servicio_barberoId_fkey` FOREIGN KEY (`barberoId`) REFERENCES `PerfilBarbero`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Horario` ADD CONSTRAINT `Horario_barberoId_fkey` FOREIGN KEY (`barberoId`) REFERENCES `PerfilBarbero`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_barberoId_fkey` FOREIGN KEY (`barberoId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Reserva` ADD CONSTRAINT `Reserva_servicioId_fkey` FOREIGN KEY (`servicioId`) REFERENCES `Servicio`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Valoracion` ADD CONSTRAINT `Valoracion_reservaId_fkey` FOREIGN KEY (`reservaId`) REFERENCES `Reserva`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorito` ADD CONSTRAINT `Favorito_barberoId_fkey` FOREIGN KEY (`barberoId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Favorito` ADD CONSTRAINT `Favorito_clienteId_fkey` FOREIGN KEY (`clienteId`) REFERENCES `Usuario`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Galeria` ADD CONSTRAINT `Galeria_barberoId_fkey` FOREIGN KEY (`barberoId`) REFERENCES `PerfilBarbero`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
