import { prisma } from "@/lib/prisma";

export async function getDefaultUser() {
  const defaultEmail = "default@replayjournal.local";

  return prisma.user.upsert({
    where: { email: defaultEmail },
    update: {},
    create: {
      email: defaultEmail,
      name: "Default Trader",
    },
  });
}
