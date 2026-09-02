import { getCurrentUser, requireUser } from "@/lib/auth/get-user";
import { prisma } from "@/lib/prisma";

export async function getDefaultUser() {
  const user = await getCurrentUser();
  if (user) {
    return prisma.user.findUniqueOrThrow({
      where: { id: user.id },
    });
  }

  // Fallback to requiring user redirect
  const required = await requireUser();
  return prisma.user.findUniqueOrThrow({
    where: { id: required.id },
  });
}
