/*
  Warnings:

  - You are about to alter the column `estado` on the `Reserva` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(1))`.

*/
-- AlterTable
ALTER TABLE `Reserva` ADD COLUMN `notas` VARCHAR(191) NULL,
    MODIFY `estado` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') NOT NULL DEFAULT 'PENDING';
