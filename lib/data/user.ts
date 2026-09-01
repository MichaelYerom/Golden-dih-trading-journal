import { prisma } from "@/lib/prisma";

export async function getDefaultUser() {
  const defaultEmail = "default@replayjournal.local";
  let user = await prisma.user.findUnique({
    where: { email: defaultEmail },
  });

  if (!user) {
    user = await prisma.user.create({
      data: {
        email: defaultEmail,
        name: "Default Trader",
      },
    });
  }

  return user;
}
