// @ts-nocheck
import { PrismaClient as SqliteClient } from "../prisma/sqlite-client";
import { PrismaClient as PostgresClient } from "@prisma/client";

async function runAttachData() {
  console.log("============================================================");
  console.log("   ATTACH SQLITE (dev.db) BACKUP DATA TO AUTHENTICATED USER ");
  console.log("============================================================");

  const targetIdentifier = process.argv[2];
  if (!targetIdentifier || targetIdentifier.trim() === "") {
    console.error("\n❌ Error: Please provide your Supabase User ID (UUID) or Email as an argument.");
    console.log("Usage: npx tsx scripts/attach-data-to-user.ts <your-email-or-user-uuid>");
    console.log("Example: npx tsx scripts/attach-data-to-user.ts trader@example.com\n");
    process.exit(1);
  }

  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!directUrl) {
    console.error("\n❌ Error: DATABASE_URL or DIRECT_URL not found in .env");
    process.exit(1);
  }

  const sqlite = new SqliteClient({
    datasources: {
      db: {
        url: "file:./dev.db",
      },
    },
  });

  const postgres = new PostgresClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
  });

  try {
    console.log("\n[1/6] Connecting to SQLite dev.db and Supabase Postgres...");
    await sqlite.$connect();
    await postgres.$connect();
    console.log("✓ Connected successfully.");

    // Find target user in Supabase Postgres
    console.log(`\n[2/6] Looking up target user "${targetIdentifier}" in Supabase...`);
    const targetUser = await postgres.user.findFirst({
      where: {
        OR: [
          { id: targetIdentifier.trim() },
          { email: targetIdentifier.trim() },
        ],
      },
    });

    if (!targetUser) {
      console.error(`\n❌ User "${targetIdentifier}" not found in database.`);
      console.log("Please sign up in the app first at http://localhost:3000/auth/signup, then run this command.");
      process.exit(1);
    }

    console.log(`✓ Found user: ${targetUser.name} (${targetUser.email}) [ID: ${targetUser.id}]`);

    // Migrate Tags
    console.log("\n[3/6] Restoring Tags...");
    const tags = await sqlite.tag.findMany();
    let migratedTags = 0;
    for (const t of tags) {
      await postgres.tag.upsert({
        where: { id: t.id },
        create: {
          id: t.id,
          category: t.category,
          name: t.name,
          color: t.color,
          createdAt: t.createdAt,
        },
        update: {
          name: t.name,
          color: t.color,
        },
      });
      migratedTags++;
    }
    console.log(`✓ Restored ${migratedTags} tag(s).`);

    // Migrate Sessions with new targetUser.id
    console.log("\n[4/6] Restoring Sessions for target user...");
    const sessions = await sqlite.session.findMany();
    let migratedSessions = 0;
    for (const s of sessions) {
      await postgres.session.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          userId: targetUser.id,
          name: s.name,
          instrument: s.instrument,
          periodStart: s.periodStart,
          periodEnd: s.periodEnd,
          startingBalance: s.startingBalance,
          status: s.status,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
        },
        update: {
          userId: targetUser.id,
          name: s.name,
          instrument: s.instrument,
          periodStart: s.periodStart,
          periodEnd: s.periodEnd,
          startingBalance: s.startingBalance,
          status: s.status,
          updatedAt: s.updatedAt,
        },
      });
      migratedSessions++;
    }
    console.log(`✓ Restored ${migratedSessions} session(s) owned by ${targetUser.email}.`);

    // Migrate Rules
    console.log("\n[5/6] Restoring Rules...");
    const rules = await sqlite.rule.findMany();
    let migratedRules = 0;
    for (const r of rules) {
      await postgres.rule.upsert({
        where: { id: r.id },
        create: {
          id: r.id,
          sessionId: r.sessionId,
          text: r.text,
          createdAt: r.createdAt,
        },
        update: {
          text: r.text,
        },
      });
      migratedRules++;
    }
    console.log(`✓ Restored ${migratedRules} rule(s).`);

    // Migrate Trades & Images & Checks
    console.log("\n[6/6] Restoring Trades, Screenshots & Compliance Checks...");
    const trades = await sqlite.trade.findMany();
    let migratedTrades = 0;
    for (const t of trades) {
      await postgres.trade.upsert({
        where: { id: t.id },
        create: {
          id: t.id,
          sessionId: t.sessionId,
          symbol: t.symbol,
          direction: t.direction,
          entryAt: t.entryAt,
          exitAt: t.exitAt,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          stopLoss: t.stopLoss,
          rMultiple: t.rMultiple,
          grossPnl: t.grossPnl,
          result: t.result,
          notes: t.notes,
          createdAt: t.createdAt,
          htfBias: t.htfBias,
          newsToday: t.newsToday,
          riskPercent: t.riskPercent,
          drawDirection: t.drawDirection,
          setupModel: t.setupModel,
          emotionalState: t.emotionalState,
          rulesFollowed: t.rulesFollowed,
          rr: t.rr,
          htfBiasTagId: t.htfBiasTagId,
          emotionalStateTagId: t.emotionalStateTagId,
          drawDirectionTagId: t.drawDirectionTagId,
        },
        update: {
          symbol: t.symbol,
          direction: t.direction,
          entryAt: t.entryAt,
          exitAt: t.exitAt,
          entryPrice: t.entryPrice,
          exitPrice: t.exitPrice,
          stopLoss: t.stopLoss,
          rMultiple: t.rMultiple,
          grossPnl: t.grossPnl,
          result: t.result,
          notes: t.notes,
          htfBias: t.htfBias,
          newsToday: t.newsToday,
          riskPercent: t.riskPercent,
          drawDirection: t.drawDirection,
          setupModel: t.setupModel,
          emotionalState: t.emotionalState,
          rulesFollowed: t.rulesFollowed,
          rr: t.rr,
        },
      });
      migratedTrades++;
    }

    const images = await sqlite.tradeImage.findMany();
    let migratedImages = 0;
    for (const img of images) {
      await postgres.tradeImage.upsert({
        where: { id: img.id },
        create: {
          id: img.id,
          tradeId: img.tradeId,
          url: img.url,
          label: img.label,
          createdAt: img.createdAt,
        },
        update: {
          url: img.url,
          label: img.label,
        },
      });
      migratedImages++;
    }

    const checks = await sqlite.tradeRuleCheck.findMany();
    let migratedChecks = 0;
    for (const c of checks) {
      await postgres.tradeRuleCheck.upsert({
        where: { id: c.id },
        create: {
          id: c.id,
          tradeId: c.tradeId,
          ruleId: c.ruleId,
          followed: c.followed,
          createdAt: c.createdAt,
        },
        update: {
          followed: c.followed,
        },
      });
      migratedChecks++;
    }

    console.log("\n============================================================");
    console.log("             RESTORATION COMPLETE SUMMARY REPORT            ");
    console.log("============================================================");
    console.log(`  ✓ Target Owner:      ${targetUser.name} (${targetUser.email})`);
    console.log(`  ✓ Sessions Restored: ${migratedSessions}`);
    console.log(`  ✓ Trades Restored:   ${migratedTrades}`);
    console.log(`  ✓ Images Restored:   ${migratedImages}`);
    console.log(`  ✓ Rules Restored:    ${migratedRules}`);
    console.log(`  ✓ Rule Checks:       ${migratedChecks}`);
    console.log(`  ✓ Tags Restored:     ${migratedTags}`);
    console.log("============================================================");
    console.log("✨ All data from dev.db is now attached to your account!");
    console.log("🔒 Original SQLite backup file 'prisma/dev.db' remains untouched.\n");
  } catch (error) {
    console.error("\n❌ Error attaching data to user:", error);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

runAttachData()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
