/**
 * Run this file to seed the database: pnpm db:seed
 */
import { getDb } from "@/lib/db"
import { runSeed } from "@/lib/db/seed"

runSeed(getDb())
