import { PrismaClient } from "@prisma/client";

async function applyRlsMigration() {
  console.log("============================================================");
  console.log("         APPLYING ROW LEVEL SECURITY (RLS) MIGRATION        ");
  console.log("============================================================");

  const connectionUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  console.log("Connecting using database URL:", connectionUrl?.replace(/:[^:@]+@/, ":***@"));

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: connectionUrl,
      },
    },
  });

  const tables = [
    "User",
    "Session",
    "Tag",
    "Trade",
    "TradeImage",
    "Rule",
    "TradeRuleCheck",
    "_TradeSetupTags",
  ];

  try {
    await prisma.$connect();
    console.log("✓ Connected to Supabase PostgreSQL.");

    for (const table of tables) {
      console.log(`Enabling RLS on public."${table}"...`);
      await prisma.$executeRawUnsafe(`ALTER TABLE public."${table}" ENABLE ROW LEVEL SECURITY;`);
      console.log(`✓ Enabled RLS on public."${table}"`);
    }

    console.log("\n--- Verifying RLS Status in Postgres pg_tables ---");
    const rlsStatus = await prisma.$queryRaw<
      Array<{ tablename: string; rowsecurity: boolean }>
    >`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename ASC;
    `;

    console.table(rlsStatus);

    console.log("\n============================================================");
    console.log("✓ ALL TABLES NOW HAVE ROW LEVEL SECURITY (RLS) ENABLED!");
    console.log("============================================================");
  } catch (err: any) {
    console.error("Migration error:", err);
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

applyRlsMigration()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
