import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function run() {
  console.log("Seeding data...");

  // Clear existing data in correct order (respecting foreign keys)
  await prisma.friendRequest.deleteMany();
  await prisma.friendship.deleteMany();
  await prisma.like.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.post.deleteMany();
  await prisma.user.deleteMany();

  // All users will have the same password for testing
  const passwordPlain = "password123";
  const passwordHash = await bcrypt.hash(passwordPlain, 10);

  console.log("🔑 Creating users with password: password123");

  // Create diverse fake users
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
    prisma.user.create({
      data: {
        username: "frank_chef",
        email: "frank@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=6",
      },
    }),
    prisma.user.create({
      data: {
        username: "grace_writer",
        email: "grace@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=7",
      },
    }),
    prisma.user.create({
      data: {
        username: "henry_musician",
        email: "henry@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=8",
      },
    }),
    prisma.user.create({
      data: {
        username: "fakeuser",
        email: "fakeuser@example.com",
        password: passwordHash,
        profilePicture: "https://i.pravatar.cc/150?img=9",
      },
    }),
  ]);

  const [alice, bob, charlie, diana, eve, frank, grace, henry] = users;

  console.log("📝 Creating posts...");

  // Create posts from different users
  await prisma.post.createMany({
    data: [
      // Alice's posts
      {
        title: "Welcome to DailyBread!",
        content:
          "Just joined this amazing platform. Looking forward to connecting with everyone! 🌟",
        authorId: alice.id,
      },
      {
        title: "Morning Coffee Thoughts",
        content:
          "There's something magical about the first cup of coffee in the morning. What's your favorite way to start the day?",
        authorId: alice.id,
      },

      // Bob's posts
      {
        title: "Building Dreams",
        content:
          "Working on a new construction project today. There's satisfaction in creating something that will last for generations.",
        authorId: bob.id,
      },
      {
        title: "Tool Tuesday",
        content:
          "Pro tip: Always invest in quality tools. They'll save you time, money, and frustration in the long run! 🔨",
        authorId: bob.id,
      },

      // Charlie's posts
      {
        title: "Code Review Best Practices",
        content:
          "Just finished an excellent code review session. Remember: be kind, be constructive, and always learn something new!",
        authorId: charlie.id,
      },
      {
        title: "JavaScript Tips",
        content:
          "Did you know you can use the nullish coalescing operator (??) to provide fallback values? Much cleaner than || in many cases!",
        authorId: charlie.id,
      },

      // Diana's posts
      {
        title: "Art in Progress",
        content:
          "Working on a new abstract piece today. The interplay of colors is absolutely mesmerizing! 🎨",
        authorId: diana.id,
      },
      {
        title: "Creative Inspiration",
        content:
          "Sometimes the best art comes from the most unexpected moments. Keep your eyes open for inspiration everywhere!",
        authorId: diana.id,
      },

      // Eve's posts
      {
        title: "Golden Hour Magic",
        content:
          "Captured the most stunning sunset today. The way light plays with shadows never ceases to amaze me! 📸",
        authorId: eve.id,
      },
      {
        title: "Street Photography Tips",
        content:
          "Street photography is all about patience and being ready for the perfect moment. Always carry your camera!",
        authorId: eve.id,
      },

      // Frank's posts
      {
        title: "Today's Special",
        content:
          "Experimenting with a new fusion recipe - Italian pasta with Asian flavors. The combination is absolutely divine! 🍝",
        authorId: frank.id,
      },
      {
        title: "Cooking Philosophy",
        content:
          "Good food is not just about taste, it's about bringing people together and creating memories. What's your favorite comfort food?",
        authorId: frank.id,
      },

      // Grace's posts
      {
        title: "Writer's Block",
        content:
          "Struggling with writer's block today, but sometimes the best stories come from the most challenging moments. Keep writing! ✍️",
        authorId: grace.id,
      },
      {
        title: "Reading Recommendations",
        content:
          "Just finished an incredible book that completely changed my perspective. What book has had the biggest impact on your life?",
        authorId: grace.id,
      },

      // Henry's posts
      {
        title: "Late Night Jam Session",
        content:
          "There's something magical about creating music in the quiet hours of the night. The creativity just flows! 🎵",
        authorId: henry.id,
      },
      {
        title: "Music Theory Monday",
        content:
          "Understanding music theory doesn't limit creativity - it gives you more tools to express what's in your heart.",
        authorId: henry.id,
      },
    ],
  });

  // Create some friend requests for testing
  await prisma.friendRequest.createMany({
    data: [
      { fromId: alice.id, toId: henry.id, status: "PENDING" },
      { fromId: charlie.id, toId: eve.id, status: "PENDING" },
      { fromId: diana.id, toId: frank.id, status: "PENDING" },
    ],
  });

  console.log("✅ Seeding complete!");
  console.log("\n🔑 USER CREDENTIALS:");
  console.log("All users have the password: password123");
  console.log("\n👤 Available Users:");
  console.log("- alice_wonder (alice@example.com)");
  console.log("- bob_builder (bob@example.com)");
  console.log("- charlie_dev (charlie@example.com)");
  console.log("- diana_artist (diana@example.com)");
  console.log("- eve_photographer (eve@example.com)");
  console.log("- frank_chef (frank@example.com)");
  console.log("- grace_writer (grace@example.com)");
  console.log("- henry_musician (henry@example.com)");
  console.log("\n� Each user has 2 posts created");
  console.log("🤝 Some friend requests created for testing");
  console.log(
    "\n💡 You can test the follow system by manually following users in the app!"
  );
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
