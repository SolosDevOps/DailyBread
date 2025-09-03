import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function run() {
  console.log("Deleting all posts and related data...");

  // Clear posts and related data in correct order (respecting foreign keys)
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();

  // Reset the SQLite sequence for posts table
  await prisma.$executeRaw`DELETE FROM sqlite_sequence WHERE name='Post';`;

  console.log("All posts and related data have been deleted and IDs reset.");
  await prisma.user.deleteMany();

  // All users will have the same password for testing
  const passwordPlain = "password123";
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  console.log("🔑 Creating users with password: password123");

  // Create 5 users
  const users = await Promise.all([
    prisma.user.create({
      data: {
        username: "alice_wonder",
        email: "alice@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=1",
      },
    }),
    prisma.user.create({
      data: {
        username: "bob_builder",
        email: "bob@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=2",
      },
    }),
    prisma.user.create({
      data: {
        username: "charlie_dev",
        email: "charlie@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=3",
      },
    }),
    prisma.user.create({
      data: {
        username: "diana_artist",
        email: "diana@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=4",
      },
    }),
    prisma.user.create({
      data: {
        username: "eve_photographer",
        email: "eve@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=5",
      },
    }),
  ]);

  const [alice, bob, charlie, diana, eve] = users;

  console.log("📝 Creating posts...");

  // Create 3 posts for each user
  const postTemplates = [
    [
      { title: "First Post", content: "This is the first post by " },
      { title: "Second Post", content: "This is the second post by " },
      { title: "Third Post", content: "This is the third post by " },
    ],
    [
      { title: "First Post", content: "This is the first post by " },
      { title: "Second Post", content: "This is the second post by " },
      { title: "Third Post", content: "This is the third post by " },
    ],
    [
      { title: "First Post", content: "This is the first post by " },
      { title: "Second Post", content: "This is the second post by " },
      { title: "Third Post", content: "This is the third post by " },
    ],
    [
      { title: "First Post", content: "This is the first post by " },
      { title: "Second Post", content: "This is the second post by " },
      { title: "Third Post", content: "This is the third post by " },
    ],
    [
      { title: "First Post", content: "This is the first post by " },
      { title: "Second Post", content: "This is the second post by " },
      { title: "Third Post", content: "This is the third post by " },
    ],
  ];
  for (let i = 0; i < users.length; i++) {
    const user = users[i];
    for (let j = 0; j < 3; j++) {
      await prisma.post.create({
        data: {
          title: postTemplates[i][j].title,
          content: postTemplates[i][j].content + user.username,
          authorId: user.id,
        },
      });
    }
  }
  // ...existing code...

  // No friend requests for this test seed

  console.log("✅ Seeding complete!");
  console.log("\n🔑 USER CREDENTIALS:");
  console.log("All users have the password: password123");
  console.log("\n👤 Available Users:");
  users.forEach((u) => {
    console.log(`- ${u.username} (${u.email})`);
  });
  console.log("\n📝 Each user has 3 posts created");
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
