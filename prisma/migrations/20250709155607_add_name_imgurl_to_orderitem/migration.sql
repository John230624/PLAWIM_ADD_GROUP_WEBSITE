/*
  Warnings:

  - Added the required column `name` to the `order_items` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order_items` ADD COLUMN `imgUrl` TEXT NULL,
    ADD COLUMN `name` VARCHAR(255) NOT NULL;
