/*
  Warnings:

  - You are about to drop the column `imgUrl` on the `order_items` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `order_items` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `order_items` DROP COLUMN `imgUrl`,
    DROP COLUMN `name`;
