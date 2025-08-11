/*
  Warnings:

  - You are about to drop the column `completadaAt` on the `Reserva` table. All the data in the column will be lost.
  - You are about to drop the column `motivoCancel` on the `Reserva` table. All the data in the column will be lost.
  - Added the required column `hora` to the `Reserva` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Reserva` DROP COLUMN `completadaAt`,
    DROP COLUMN `motivoCancel`,
    ADD COLUMN `completada_at` DATETIME(3) NULL,
    ADD COLUMN `hora` VARCHAR(191) NOT NULL,
    ADD COLUMN `motivo_cancelación` VARCHAR(191) NULL;
