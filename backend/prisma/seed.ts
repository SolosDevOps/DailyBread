import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function run() {
  console.log("Seeding data...");
  await prisma.friendRequest.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  const passwordPlain = "password123";
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  const [alice, bob, charlie] = await Promise.all([
    prisma.user.create({
      data: {
        username: "alice",
        email: "alice@example.com",
        password: passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "bob",
        email: "bob@example.com",
        password: passwordHash,
      },
    }),
    prisma.user.create({
      data: {
        username: "charlie",
        email: "charlie@example.com",
        password: passwordHash,
      },
    }),
  ]);

  await prisma.post.createMany({
    data: [
      {
        title: "Hello World",
        content: "First post from Alice",
        authorId: alice.id,
      },
      { title: "Bob Post", content: "Thoughts by Bob", authorId: bob.id },
      {
        title: "Another from Alice",
        content: "More content",
        authorId: alice.id,
      },
      {
        title: "Charlie Intro",
        content: "Hi I am Charlie",
        authorId: charlie.id,
      },
    ],
  });

  await prisma.friendRequest.create({
    data: { fromId: alice.id, toId: bob.id, status: "PENDING" },
  });

  console.log("Seeding complete.");
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
