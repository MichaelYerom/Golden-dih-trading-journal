// @ts-nocheck
import { PrismaClient as SqliteClient } from "../prisma/sqlite-client";
import { PrismaClient as PostgresClient } from "@prisma/client";

async function runMigration() {
  console.log("============================================================");
  console.log("      SQLITE (dev.db) -> SUPABASE (POSTGRESQL) MIGRATION    ");
  console.log("============================================================");

  const directUrl = process.env.DIRECT_URL || process.env.DATABASE_URL;
  if (!directUrl || directUrl.includes("[YOUR-PROJECT-REF]") || directUrl.startsWith("file:")) {
    console.error("\n❌ Error: Valid Supabase PostgreSQL connection string not detected in environment.");
    console.error("Please set DIRECT_URL or DATABASE_URL in your .env file before running this script.");
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
    console.log("\n[1/7] Connecting to SQLite source database and Supabase Postgres...");
    await sqlite.$connect();
    await postgres.$connect();
    console.log("✓ Connected successfully to both databases.");

    // Step 1: Users
    console.log("\n[2/7] Migrating Users...");
    const users = await sqlite.user.findMany();
    const userMap = new Map<string, string>();
    let migratedUsers = 0;

    for (const u of users) {
      let targetUser = await postgres.user.findUnique({ where: { id: u.id } });
      if (!targetUser) {
        targetUser = await postgres.user.findUnique({ where: { email: u.email } });
      }

      if (targetUser) {
        await postgres.user.update({
          where: { id: targetUser.id },
          data: { name: u.name, email: u.email },
        });
        userMap.set(u.id, targetUser.id);
      } else {
        const created = await postgres.user.create({
          data: {
            id: u.id,
            email: u.email,
            name: u.name,
            createdAt: u.createdAt,
          },
        });
        userMap.set(u.id, created.id);
      }
      migratedUsers++;
    }
    console.log(`✓ Migrated ${migratedUsers} user(s).`);

    // Step 2: Sessions
    console.log("\n[3/7] Migrating Sessions...");
    const sessions = await sqlite.session.findMany();
    let migratedSessions = 0;
    for (const s of sessions) {
      const validUserId = userMap.get(s.userId) || s.userId;
      await postgres.session.upsert({
        where: { id: s.id },
        create: {
          id: s.id,
          userId: validUserId,
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
          userId: validUserId,
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
    console.log(`✓ Migrated ${migratedSessions} session(s).`);

    // Step 3: Tags
    console.log("\n[4/7] Migrating Tags...");
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
    console.log(`✓ Migrated ${migratedTags} tag(s).`);

    // Step 4: Rules
    console.log("\n[5/7] Migrating Rules...");
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
    console.log(`✓ Migrated ${migratedRules} rule(s).`);

    // Step 5: Trades
    console.log("\n[6/7] Migrating Trades...");
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
    console.log(`✓ Migrated ${migratedTrades} trade(s).`);

    // Step 6: Trade Images
    console.log("\n[7/7] Migrating Trade Images & Rule Checks...");
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

    // Step 7: Trade Rule Checks
    const ruleChecks = await sqlite.tradeRuleCheck.findMany();
    let migratedRuleChecks = 0;
    for (const rc of ruleChecks) {
      await postgres.tradeRuleCheck.upsert({
        where: { id: rc.id },
        create: {
          id: rc.id,
          tradeId: rc.tradeId,
          ruleId: rc.ruleId,
          followed: rc.followed,
          createdAt: rc.createdAt,
        },
        update: {
          followed: rc.followed,
        },
      });
      migratedRuleChecks++;
    }

    console.log("\n============================================================");
    console.log("                MIGRATION SUMMARY REPORT                   ");
    console.log("============================================================");
    console.log(`  ✓ Users:             ${migratedUsers}`);
    console.log(`  ✓ Sessions:          ${migratedSessions}`);
    console.log(`  ✓ Tags:              ${migratedTags}`);
    console.log(`  ✓ Rules:             ${migratedRules}`);
    console.log(`  ✓ Trades:            ${migratedTrades}`);
    console.log(`  ✓ Attached Images:   ${migratedImages}`);
    console.log(`  ✓ Rule Checks:       ${migratedRuleChecks}`);
    console.log("============================================================");
    console.log("✨ All data has been successfully migrated to Supabase Postgres!");
    console.log("🔒 Local SQLite backup file 'prisma/dev.db' is preserved intact.\n");
  } catch (error) {
    console.error("\n❌ Migration failed with error:", error);
    process.exit(1);
  } finally {
    await sqlite.$disconnect();
    await postgres.$disconnect();
  }
}

runMigration()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
