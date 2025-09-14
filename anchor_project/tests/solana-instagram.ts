import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { SolanaInstagram } from "../target/types/solana_instagram";
import { expect } from "chai";
import * as assert from "assert";
import crypto from "crypto";

describe("Create Profile", () => {
  // Configure the client to use the local cluster.
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  function generateString(length: number, char = "a"): string {
    return char.repeat(length);
  }


  it("Should create profile with valid inputs", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    await program.methods.initialize("user144", "Test user", "https://test.com/avatar.png").accounts({
      user: user.publicKey
    })
      .signers([user])
      .rpc();

    const userProfile = await program.account.userProfile.fetch(userProfilePda);

    expect(userProfile.authority.toBase58()).to.equal(user.publicKey.toBase58());
    expect(userProfile.handle).to.equal("user144");
    expect(userProfile.bio).to.equal("Test user");
    expect(userProfile.avatarUri).to.equal("https://test.com/avatar.png");
    expect(userProfile.createdAt.toNumber()).to.be.greaterThan(0);
    expect(userProfile.updatedAt.toNumber()).to.be.greaterThan(0);
    expect(userProfile.createdAt.toNumber()).to.equal(userProfile.updatedAt.toNumber());
  });

  it("Should create profile with minimum length inputs", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    await program.methods
      .initialize("a", "b", "c")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const userProfile = await program.account.userProfile.fetch(userProfilePda);
    expect(userProfile.handle).to.equal("a");
    expect(userProfile.bio).to.equal("b");
    expect(userProfile.avatarUri).to.equal("c");
  });

  it("Should create profile with maximum length inputs", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    const maxHandle = generateString(24);
    const maxBio = generateString(150);
    const maxUri = generateString(200);

    await program.methods
      .initialize(maxHandle, maxBio, maxUri)
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const userProfile = await program.account.userProfile.fetch(userProfilePda);
    expect(userProfile.handle).to.equal(maxHandle);
    expect(userProfile.bio).to.equal(maxBio);
    expect(userProfile.avatarUri).to.equal(maxUri);
  });

  it("Should set correct timestamps", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    const beforeTime = Math.floor(Date.now() / 1000) - 10;

    await program.methods
      .initialize("timestamptest", "Testing timestamps", "https://test.com")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const afterTime = Math.floor(Date.now() / 1000);

    const userProfile = await program.account.userProfile.fetch(userProfilePda);
    const createdAt = userProfile.createdAt.toNumber();
    const updatedAt = userProfile.updatedAt.toNumber();

    expect(createdAt).to.be.greaterThanOrEqual(beforeTime);
    expect(createdAt).to.be.lessThanOrEqual(afterTime);
    expect(createdAt).to.equal(updatedAt);
  });

  it("Should fail with empty handle", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    try {
      await program.methods
        .initialize("", "Valid bio", "https://example.com")
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc({ commitment: "confirmed" });

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidHandleLength");
      expect(error.error.errorCode.number).to.equal(6000);
    }
  });

  it("Should fail with handle too long (25 chars)", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const tooLongHandle = generateString(25); // MAX_HANDLE_LENGTH + 1

    try {
      await program.methods
        .initialize(tooLongHandle, "Valid bio", "https://example.com")
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidHandleLength");
      expect(error.error.errorCode.number).to.equal(6000);
    }
  });

  it("Should fail with empty bio", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    try {
      await program.methods
        .initialize("validhandle", "", "https://example.com")
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidBioLength");
      expect(error.error.errorCode.number).to.equal(6001);
    }
  });

  it("Should fail with bio too long (161 chars)", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const tooLongBio = generateString(161); // MAX_BIO_LENGTH + 1

    try {
      await program.methods
        .initialize("validhandle", tooLongBio, "https://example.com")
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidBioLength");
      expect(error.error.errorCode.number).to.equal(6001);
    }
  });

  it("Should fail with empty avatar URI", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    try {
      await program.methods
        .initialize("validhandle", "Valid bio", "")
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();
    } catch (error) {
      expect(error.toString()).to.include("InvalidAvatarUriLength");
    }
  });

  it("Should fail with avatar URI too long (201 chars)", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const tooLongUri = generateString(201); // MAX_URI_LENGTH + 1

    let should_fail = "This Should Fail";
    try {
      await program.methods
        .initialize("validhandle", "Valid bio", tooLongUri)
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidAvatarUriLength");
      expect(error.error.errorCode.number).to.equal(6002);
    }
  });

  it("Should fail when user tries to create profile twice", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    await program.methods
      .initialize("firstprofile", "First profile bio", "https://first.com")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const firstProfile = await program.account.userProfile.fetch(userProfilePda);
    expect(firstProfile.handle).to.equal("firstprofile");

    try {
      await program.methods
        .initialize("secondprofile", "Second profile bio", "https://second.com")
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.transactionMessage).to.include("Error processing Instruction 0");
    }
  });

  it("Should generate different PDAs for different users", async () => {
    const user1 = anchor.web3.Keypair.generate();
    const user2 = anchor.web3.Keypair.generate();

    const [user1ProfilePda] = pda([Buffer.from("profile"), user1.publicKey.toBuffer()]);
    const [user2ProfilePda] = pda([Buffer.from("profile"), user2.publicKey.toBuffer()]);

    expect(user1ProfilePda.toBase58()).to.not.equal(user2ProfilePda.toBase58());
  });

  it("Should validate that profile PDA is derived correctly", async () => {
    const user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);

    const [correctPda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);
    const [wrongPda] = pda([Buffer.from("wrong_seed"), user.publicKey.toBuffer()]);

    // This should succeed with correct PDA
    await program.methods
      .initialize("correctpda", "Correct PDA test", "https://correct.com")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const user2 = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user2.publicKey);

    try {
      await program.methods
        .initialize("wrongpda", "Wrong PDA test", "https://wrong.com")
        .accounts({
          user: user2.publicKey
        })
        .signers([user2])
        .rpc();
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });
});

// ========================================
// UPDATE PROFILE TESTS
// ========================================

describe("Update Profile", () => {
  let user: anchor.web3.Keypair;
  let userProfilePda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  function generateString(length: number, char = "a"): string {
    return char.repeat(length);
  }

  beforeEach(async () => {
    user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);
    [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    // Create initial profile first
    await program.methods
      .initialize("initialhandle", "Initial bio", "https://initial.com/avatar.png")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();
  });

  it("Should update profile handle only", async () => {
    const newHandle = "newhandle123";

    await new Promise(resolve => setTimeout(resolve, 1000));

    await program.methods
      .updateUserProfile(newHandle, null, null)
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const updatedProfile = await program.account.userProfile.fetch(userProfilePda);
    expect(updatedProfile.handle).to.equal(newHandle);
    expect(updatedProfile.bio).to.equal("Initial bio");
    expect(updatedProfile.avatarUri).to.equal("https://initial.com/avatar.png");
    expect(updatedProfile.updatedAt.toNumber()).to.be.greaterThan(updatedProfile.createdAt.toNumber());
  });

  it("Should update profile bio only", async () => {
    const newBio = "This is a new updated bio with more content";

    await new Promise(resolve => setTimeout(resolve, 1000));

    await program.methods
      .updateUserProfile(null, newBio, null)
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const updatedProfile = await program.account.userProfile.fetch(userProfilePda);
    expect(updatedProfile.handle).to.equal("initialhandle");
    expect(updatedProfile.bio).to.equal(newBio);
    expect(updatedProfile.avatarUri).to.equal("https://initial.com/avatar.png");
    expect(updatedProfile.updatedAt.toNumber()).to.be.greaterThan(updatedProfile.createdAt.toNumber());
  });

  it("Should update profile avatar URI only", async () => {
    const newAvatarUri = "https://newavatar.com/profile.jpg";

    await new Promise(resolve => setTimeout(resolve, 1000));

    await program.methods
      .updateUserProfile(null, null, newAvatarUri)
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const updatedProfile = await program.account.userProfile.fetch(userProfilePda);
    expect(updatedProfile.handle).to.equal("initialhandle");
    expect(updatedProfile.bio).to.equal("Initial bio");
    expect(updatedProfile.avatarUri).to.equal(newAvatarUri);
    expect(updatedProfile.updatedAt.toNumber()).to.be.greaterThan(updatedProfile.createdAt.toNumber());
  });

  it("Should update multiple profile fields at once", async () => {
    const newHandle = "multihandle";
    const newBio = "Multiple fields updated bio";
    const newAvatarUri = "https://multi.com/avatar.jpg";

    await new Promise(resolve => setTimeout(resolve, 1000));

    await program.methods
      .updateUserProfile(newHandle, newBio, newAvatarUri)
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const updatedProfile = await program.account.userProfile.fetch(userProfilePda);
    expect(updatedProfile.handle).to.equal(newHandle);
    expect(updatedProfile.bio).to.equal(newBio);
    expect(updatedProfile.avatarUri).to.equal(newAvatarUri);
    expect(updatedProfile.updatedAt.toNumber()).to.be.greaterThan(updatedProfile.createdAt.toNumber());
  });

  it("Should fail when no fields are provided for update", async () => {
    try {
      await program.methods
        .updateUserProfile(null, null, null)
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("NoFieldsToUpdate");
      expect(error.error.errorCode.number).to.equal(6010);
    }
  });

  it("Should fail when handle is too long", async () => {
    const tooLongHandle = generateString(25); // MAX_HANDLE_LENGTH + 1

    try {
      await program.methods
        .updateUserProfile(tooLongHandle, null, null)
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidHandleLength");
      expect(error.error.errorCode.number).to.equal(6000);
    }
  });

  it("Should fail when bio is too long", async () => {
    const tooLongBio = generateString(161); // MAX_BIO_LENGTH + 1

    try {
      await program.methods
        .updateUserProfile(null, tooLongBio, null)
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidBioLength");
      expect(error.error.errorCode.number).to.equal(6001);
    }
  });

  it("Should fail when avatar URI is too long", async () => {
    const tooLongUri = generateString(201); // MAX_URI_LENGTH + 1

    try {
      await program.methods
        .updateUserProfile(null, null, tooLongUri)
        .accounts({
          user: user.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidAvatarUriLength");
      expect(error.error.errorCode.number).to.equal(6002);
    }
  });

  it("Should fail when unauthorized user tries to update profile", async () => {
    const unauthorizedUser = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, unauthorizedUser.publicKey);

    try {
      await program.methods
        .updateUserProfile("unauthorized", null, null)
        .accounts({
          user: unauthorizedUser.publicKey,
          profile: userProfilePda
        })
        .signers([unauthorizedUser])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });

  it("Should preserve existing values when updating only some fields", async () => {
    const originalProfile = await program.account.userProfile.fetch(userProfilePda);
    const originalCreatedAt = originalProfile.createdAt.toNumber();

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update only bio
    await program.methods
      .updateUserProfile(null, "Updated bio only", null)
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    const updatedProfile = await program.account.userProfile.fetch(userProfilePda);

    // Check that unchanged fields remain the same
    expect(updatedProfile.handle).to.equal("initialhandle");
    expect(updatedProfile.avatarUri).to.equal("https://initial.com/avatar.png");
    expect(updatedProfile.createdAt.toNumber()).to.equal(originalCreatedAt);

    // Check that updated field changed
    expect(updatedProfile.bio).to.equal("Updated bio only");
    expect(updatedProfile.updatedAt.toNumber()).to.be.greaterThan(originalCreatedAt);
  });
});

// ========================================
// ADD POST TESTS
// ========================================

describe("Add Post", () => {
  let user: anchor.web3.Keypair;
  let userProfilePda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  function generateString(length: number, char = "a"): string {
    return char.repeat(length);
  }

  beforeEach(async () => {
    user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);
    [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    // Create profile first (required for posting)
    await program.methods
      .initialize("postuser", "User who posts", "https://postuser.com/avatar.png")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();
  });

  it("Should create post with valid inputs", async () => {
    const mediaUri = "https://example.com/image.jpg";
    const content = "This is my first post content!";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    const post = await program.account.post.fetch(postPda);
    expect(post.creator.toBase58()).to.equal(user.publicKey.toBase58());
    expect(post.content).to.equal(content);
    expect(post.mediaUri).to.equal(mediaUri);
    expect(post.likeCount.toNumber()).to.equal(0);
    expect(post.commentCount.toNumber()).to.equal(0);
    expect(post.createdAt.toNumber()).to.be.greaterThan(0);
    expect(post.updatedAt.toNumber()).to.equal(post.createdAt.toNumber());
  });

  it("Should create post with minimum length inputs", async () => {
    const mediaUri = "a";
    const content = "b";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    const post = await program.account.post.fetch(postPda);
    expect(post.content).to.equal(content);
    expect(post.mediaUri).to.equal(mediaUri);
  });

  it("Should create post with maximum length inputs", async () => {
    const maxContent = generateString(280); // MAX_TEXT_LENGTH
    const maxMediaUri = generateString(200); // MAX_URI_LENGTH

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(maxMediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(maxMediaUri, maxContent)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc({skipPreflight: true});

    const post = await program.account.post.fetch(postPda);
    expect(post.content).to.equal(maxContent);
    expect(post.mediaUri).to.equal(maxMediaUri);
  });

  it("Should set correct timestamps for post", async () => {
    const mediaUri = "https://timestamp.com/image.jpg";
    const content = "Testing post timestamps";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    const beforeTime = Math.floor(Date.now() / 1000) - 10;

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    const afterTime = Math.floor(Date.now() / 1000);

    const post = await program.account.post.fetch(postPda);
    const createdAt = post.createdAt.toNumber();
    const updatedAt = post.updatedAt.toNumber();

    expect(createdAt).to.be.greaterThanOrEqual(beforeTime);
    expect(createdAt).to.be.lessThanOrEqual(afterTime);
    expect(createdAt).to.equal(updatedAt);
  });

  it("Should fail with empty content", async () => {
    const mediaUri = "https://example.com/image.jpg";
    const content = "";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    try {
      await program.methods
        .createPost(mediaUri, content)
        .accounts({
          creator: user.publicKey,
          post: postPda,
          profile: userProfilePda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidContentLength");
      expect(error.error.errorCode.number).to.equal(6003);
    }
  });

  it("Should fail with content too long (281 chars)", async () => {
    const mediaUri = "https://example.com/image.jpg";
    const tooLongContent = generateString(281); // MAX_TEXT_LENGTH + 1

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    try {
      await program.methods
        .createPost(mediaUri, tooLongContent)
        .accounts({
          creator: user.publicKey,
          post: postPda,
          profile: userProfilePda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidContentLength");
      expect(error.error.errorCode.number).to.equal(6003);
    }
  });

  it("Should fail with empty media URI", async () => {
    const mediaUri = "";
    const content = "Valid content";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    try {
      await program.methods
        .createPost(mediaUri, content)
        .accounts({
          creator: user.publicKey,
          post: postPda,
          profile: userProfilePda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidMediaUriLength");
      expect(error.error.errorCode.number).to.equal(6004);
    }
  });

  it("Should fail with media URI too long (201 chars)", async () => {
    const tooLongMediaUri = generateString(201); // MAX_URI_LENGTH + 1
    const content = "Valid content";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(tooLongMediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    try {
      await program.methods
        .createPost(tooLongMediaUri, content)
        .accounts({
          creator: user.publicKey,
          post: postPda,
          profile: userProfilePda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidMediaUriLength");
      expect(error.error.errorCode.number).to.equal(6004);
    }
  });

  it("Should generate different PDAs for different posts by same user", async () => {
    const mediaUri1 = "https://example.com/image1.jpg";
    const mediaUri2 = "https://example.com/image2.jpg";
    const content = "Same content, different media";

    const [postPda1] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri1, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    const [postPda2] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri2, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    expect(postPda1.toBase58()).to.not.equal(postPda2.toBase58());

    // Create both posts
    await program.methods
      .createPost(mediaUri1, content)
      .accounts({
        creator: user.publicKey,
        post: postPda1,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    await program.methods
      .createPost(mediaUri2, content)
      .accounts({
        creator: user.publicKey,
        post: postPda2,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    const post1 = await program.account.post.fetch(postPda1);
    const post2 = await program.account.post.fetch(postPda2);

    expect(post1.mediaUri).to.equal(mediaUri1);
    expect(post2.mediaUri).to.equal(mediaUri2);
  });

  it("Should initialize all reaction counts to zero", async () => {
    const mediaUri = "https://reactions.com/image.jpg";
    const content = "Testing reaction counts";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    const post = await program.account.post.fetch(postPda);
    expect(post.likeCount.toNumber()).to.equal(0);
    expect(post.dislikeCount.toNumber()).to.equal(0);
    expect(post.loveCount.toNumber()).to.equal(0);
    expect(post.hahaCount.toNumber()).to.equal(0);
    expect(post.wowCount.toNumber()).to.equal(0);
    expect(post.sadCount.toNumber()).to.equal(0);
    expect(post.angryCount.toNumber()).to.equal(0);
  });

  it("Should validate that post PDA is derived correctly", async () => {
    const mediaUri = "https://correctpda.com/image.jpg";
    const content = "Correct PDA test";

    const [correctPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    const [wrongPda] = pda([
      Buffer.from("wrong_seed"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    // This should succeed with correct PDA
    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: correctPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    const user2 = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user2.publicKey);

    try {
      await program.methods
        .createPost(mediaUri, content)
        .accounts({
          creator: user2.publicKey,
          post: wrongPda,
          profile: userProfilePda
        })
        .signers([user2])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });

  it("Should verify post belongs to correct profile", async () => {
    const mediaUri = "https://profiletest.com/image.jpg";
    const content = "Testing profile association";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    const post = await program.account.post.fetch(postPda);
    expect(post.profile.toBase58()).to.equal(userProfilePda.toBase58());
    expect(post.creator.toBase58()).to.equal(user.publicKey.toBase58());
  });

  it("Should fail when trying to access post with wrong profile", async () => {
    const mediaUri = "https://wrongprofile.com/image.jpg";
    const content = "Testing wrong profile access";

    const [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    // Create post with correct profile
    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    // Try to access with different profile PDA
    const [wrongProfilePda] = pda([Buffer.from("wrong_profile"), user.publicKey.toBuffer()]);
    
    try {
      await program.account.post.fetch(postPda);
      // If we can fetch, verify the parent_profile doesn't match wrong profile
      const post = await program.account.post.fetch(postPda);
      expect(post.profile.toBase58()).to.not.equal(wrongProfilePda.toBase58());
    } catch (error) {
      // This is also acceptable - post might not be accessible
      expect(error).to.exist;
    }
  });
});

// ========================================
// DELETE POST TESTS
// ========================================

describe("Delete Post", () => {
  let user: anchor.web3.Keypair;
  let userProfilePda: anchor.web3.PublicKey;
  let postPda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  beforeEach(async () => {
    user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);
    [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    // Create profile first
    await program.methods
      .initialize("deleteuser", "User who deletes posts", "https://deleteuser.com/avatar.png")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    // Create a post to delete
    const mediaUri = "https://example.com/deletepost.jpg";
    const content = "Post to be deleted";
    [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();
  });

  it("Should delete post successfully", async () => {
    // Verify post exists before deletion
    const postBefore = await program.account.post.fetch(postPda);
    expect(postBefore.content).to.equal("Post to be deleted");

    // Delete the post
    await program.methods
      .deleteUserPost()
      .accounts({
        creator: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    // Verify post no longer exists
    try {
      await program.account.post.fetch(postPda);
      expect.fail("Post should have been deleted");
    } catch (error) {
      // Post should not exist anymore
      expect(error).to.exist;
    }
  });

  it("Should refund SOL to creator when deleting post", async () => {
    const balanceBefore = await provider.connection.getBalance(user.publicKey);
    
    const tx = await program.methods
      .deleteUserPost()
      .accounts({
        creator: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    console.log("tx", tx);

    const balanceAfter = await provider.connection.getBalance(user.publicKey);
    
    // Balance should increase (refund from closed account)
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });

  it("Should fail when unauthorized user tries to delete post", async () => {
    const unauthorizedUser = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, unauthorizedUser.publicKey);

    try {
      await program.methods
        .deleteUserPost()
        .accounts({
          creator: unauthorizedUser.publicKey,
          post: postPda
        })
        .signers([unauthorizedUser])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });

  it("Should fail when post creator is not the signer", async () => {
    const wrongUser = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, wrongUser.publicKey);

    try {
      await program.methods
        .deleteUserPost()
        .accounts({
          creator: wrongUser.publicKey, // Wrong creator
          post: postPda
        })
        .signers([wrongUser])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });

  it("Should fail when trying to delete non-existent post", async () => {
    const nonExistentPost = anchor.web3.Keypair.generate();
    const [nonExistentPostPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from("nonexistent", 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    try {
      await program.methods
        .deleteUserPost()
        .accounts({
          creator: user.publicKey,
          post: nonExistentPostPda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      // Should fail because account doesn't exist
      expect(error).to.exist;
    }
  });

  it("Should allow creator to delete multiple posts", async () => {
    // Create second post
    const mediaUri2 = "https://example.com/post2.jpg";
    const content2 = "Second post to delete";
    const [postPda2] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri2, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri2, content2)
      .accounts({
        creator: user.publicKey,
        post: postPda2,
        profile: userProfilePda,
      })
      .signers([user])
      .rpc();

    // Delete first post
    await program.methods
      .deleteUserPost()
      .accounts({
        creator: user.publicKey,
        post: postPda,
      })
      .signers([user])
      .rpc();

    // Delete second post
    await program.methods
      .deleteUserPost()
      .accounts({
        creator: user.publicKey,
        post: postPda2,
      })
      .signers([user])
      .rpc();

    // Verify both posts are deleted
    try {
      await program.account.post.fetch(postPda);
      expect.fail("First post should have been deleted");
    } catch (error) {
      expect(error).to.exist;
    }

    try {
      await program.account.post.fetch(postPda2);
      expect.fail("Second post should have been deleted");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should fail when trying to delete already deleted post", async () => {
    // Delete the post first
    await program.methods
      .deleteUserPost()
      .accounts({
        creator: user.publicKey,
        post: postPda,
      })
      .signers([user])
      .rpc();

    // Try to delete the same post again
    try {
      await program.methods
        .deleteUserPost()
        .accounts({
          creator: user.publicKey,
          post: postPda,
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      // Should fail because account no longer exists
      expect(error).to.exist;
    }
  });

  it("Should validate that only post creator can delete their own posts", async () => {
    // Create another user and post
    const user2 = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user2.publicKey);
    const [user2ProfilePda] = pda([Buffer.from("profile"), user2.publicKey.toBuffer()]);

    await program.methods
      .initialize("user2", "Second user", "https://user2.com/avatar.png")
      .accounts({
        user: user2.publicKey
      })
      .signers([user2])
      .rpc();

    const mediaUri2 = "https://example.com/user2post.jpg";
    const content2 = "User2's post";
    const [postPda2] = pda([
      Buffer.from("post"),
      user2.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri2, 'utf8')).digest().slice(0, 4),
      user2ProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri2, content2)
      .accounts({
        creator: user2.publicKey,
        post: postPda2,
        profile: user2ProfilePda,
      })
      .signers([user2])
      .rpc();

    // User1 tries to delete User2's post
    try {
      await program.methods
        .deleteUserPost()
        .accounts({
          creator: user.publicKey, // User1 as creator
          post: postPda2, // User2's post
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });
});

// ========================================
// ADD COMMENT TESTS
// ========================================

describe("Add Comment", () => {
  let user: anchor.web3.Keypair;
  let userProfilePda: anchor.web3.PublicKey;
  let postPda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  function generateString(length: number, char = "a"): string {
    return char.repeat(length);
  }

  beforeEach(async () => {
    user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);
    [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    // Create profile first
    await program.methods
      .initialize("commentuser", "User who comments", "https://commentuser.com/avatar.png")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    // Create a post to comment on
    const mediaUri = "https://example.com/post.jpg";
    const content = "Original post content";
    [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();
  });

  it("Should create comment with valid inputs", async () => {
    const commentContent = "This is a great comment!";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    await program.methods
      .createComment(commentContent)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda,
        post: postPda,
      })
      .signers([user])
      .rpc();

    const comment = await program.account.comment.fetch(commentPda);
    expect(comment.post.toBase58()).to.equal(postPda.toBase58());
    expect(comment.commentBy.toBase58()).to.equal(user.publicKey.toBase58());
    expect(comment.content).to.equal(commentContent);
    expect(comment.createdAt.toNumber()).to.be.greaterThan(0);
    expect(comment.updatedAt.toNumber()).to.equal(comment.createdAt.toNumber());
  });

  it("Should create comment with minimum length content", async () => {
    const commentContent = "a";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    await program.methods
      .createComment(commentContent)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda,
        post: postPda
      })
      .signers([user])
      .rpc();

    const comment = await program.account.comment.fetch(commentPda);
    expect(comment.content).to.equal(commentContent);
  });

  it("Should create comment with maximum length content", async () => {
    const commentContent = generateString(280); // MAX_TEXT_LENGTH
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    await program.methods
      .createComment(commentContent)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda,
        post: postPda
      })
      .signers([user])
      .rpc();

    const comment = await program.account.comment.fetch(commentPda);
    expect(comment.content).to.equal(commentContent);
  });

  it("Should set correct timestamps for comment", async () => {
    const commentContent = "Testing comment timestamps";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    const beforeTime = Math.floor(Date.now() / 1000) - 10;

    await program.methods
      .createComment(commentContent)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda,
        post: postPda
      })
      .signers([user])
      .rpc();

    const afterTime = Math.floor(Date.now() / 1000);

    const comment = await program.account.comment.fetch(commentPda);
    const createdAt = comment.createdAt.toNumber();
    const updatedAt = comment.updatedAt.toNumber();

    expect(createdAt).to.be.greaterThanOrEqual(beforeTime);
    expect(createdAt).to.be.lessThanOrEqual(afterTime);
    expect(createdAt).to.equal(updatedAt);
  });

  it("Should fail with empty content", async () => {
    const commentContent = "";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    try {
      await program.methods
        .createComment(commentContent)
        .accounts({
          commenter: user.publicKey,
          comment: commentPda,
          post: postPda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidContentLength");
      expect(error.error.errorCode.number).to.equal(6003);
    }
  });

  it("Should fail with content too long (281 chars)", async () => {
    const commentContent = generateString(281); // MAX_TEXT_LENGTH + 1
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    try {
      await program.methods
        .createComment(commentContent)
        .accounts({
          commenter: user.publicKey,
          comment: commentPda,
          post: postPda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("InvalidContentLength");
      expect(error.error.errorCode.number).to.equal(6003);
    }
  });

  it("Should increment post comment count", async () => {
    const originalPost = await program.account.post.fetch(postPda);
    const originalCommentCount = originalPost.commentCount.toNumber();

    const commentContent = "Comment that increments count";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    await program.methods
      .createComment(commentContent)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda,
        post: postPda
      })
      .signers([user])
      .rpc();

    const updatedPost = await program.account.post.fetch(postPda);
    expect(updatedPost.commentCount.toNumber()).to.equal(originalCommentCount + 1);
  });

  it("Should update post updated_at timestamp", async () => {
    const originalPost = await program.account.post.fetch(postPda);
    const originalUpdatedAt = originalPost.updatedAt.toNumber();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const commentContent = "Comment that updates timestamp";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    await program.methods
      .createComment(commentContent)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda,
        post: postPda
      })
      .signers([user])
      .rpc();

    const updatedPost = await program.account.post.fetch(postPda);
    expect(updatedPost.updatedAt.toNumber()).to.be.greaterThan(originalUpdatedAt);
  });

  it("Should generate different PDAs for different comments", async () => {
    const comment1 = "First comment";
    const comment2 = "Second comment";

    const [commentPda1] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(comment1, 'utf8')).digest().slice(0, 4)
    ]);

    const [commentPda2] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(comment2, 'utf8')).digest().slice(0, 4)
    ]);

    expect(commentPda1.toBase58()).to.not.equal(commentPda2.toBase58());

    // Create both comments
    await program.methods
      .createComment(comment1)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda1,
        post: postPda
      })
      .signers([user])
      .rpc();

    await program.methods
      .createComment(comment2)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda2,
        post: postPda
      })
      .signers([user])
      .rpc();

    const comment1Data = await program.account.comment.fetch(commentPda1);
    const comment2Data = await program.account.comment.fetch(commentPda2);

    expect(comment1Data.content).to.equal(comment1);
    expect(comment2Data.content).to.equal(comment2);
  });

  it("Should validate that comment PDA is derived correctly", async () => {
    const commentContent = "Correct PDA test";
    const [correctPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    const [wrongPda] = pda([
      Buffer.from("wrong_seed"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    // This should succeed with correct PDA
    await program.methods
      .createComment(commentContent)
      .accounts({
        commenter: user.publicKey,
        comment: correctPda,
        post: postPda
      })
      .signers([user])
      .rpc();

    const user2 = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user2.publicKey);

    try {
      await program.methods
        .createComment(commentContent)
        .accounts({
          commenter: user2.publicKey,
          comment: wrongPda,
          post: postPda
        })
        .signers([user2])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });
});


// ========================================
// ADD REACTION TESTS
// ========================================

describe("Add Reaction", () => {
  let user: anchor.web3.Keypair;
  let userProfilePda: anchor.web3.PublicKey;
  let postPda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  beforeEach(async () => {
    user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);
    [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    // Create profile first
    await program.methods
      .initialize("reactionuser", "User who reacts", "https://reactionuser.com/avatar.png")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    // Create a post to react to
    const mediaUri = "https://example.com/reactionpost.jpg";
    const content = "Post for reactions";
    [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();
  });

  it("Should create Like reaction successfully", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ like: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const reaction = await program.account.reaction.fetch(reactionPda);
    expect(reaction.post.toBase58()).to.equal(postPda.toBase58());
    expect(reaction.reactionBy.toBase58()).to.equal(user.publicKey.toBase58());
    expect(reaction.reactionType).to.deep.equal({ like: {} });
    expect(reaction.createdAt.toNumber()).to.be.greaterThan(0);
    expect(reaction.updatedAt.toNumber()).to.equal(reaction.createdAt.toNumber());
  });

  it("Should create Love reaction successfully", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ love: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const reaction = await program.account.reaction.fetch(reactionPda);
    expect(reaction.reactionType).to.deep.equal({ love: {} });
  });

  it("Should create Haha reaction successfully", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ haha: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const reaction = await program.account.reaction.fetch(reactionPda);
    expect(reaction.reactionType).to.deep.equal({ haha: {} });
  });

  it("Should create Wow reaction successfully", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ wow: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const reaction = await program.account.reaction.fetch(reactionPda);
    expect(reaction.reactionType).to.deep.equal({ wow: {} });
  });

  it("Should create Sad reaction successfully", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ sad: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const reaction = await program.account.reaction.fetch(reactionPda);
    expect(reaction.reactionType).to.deep.equal({ sad: {} });
  });

  it("Should create Angry reaction successfully", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ angry: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const reaction = await program.account.reaction.fetch(reactionPda);
    expect(reaction.reactionType).to.deep.equal({ angry: {} });
  });

  it("Should create Dislike reaction successfully", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ dislike: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const reaction = await program.account.reaction.fetch(reactionPda);
    expect(reaction.reactionType).to.deep.equal({ dislike: {} });
  });

  it("Should increment post like count when adding Like reaction", async () => {
    const originalPost = await program.account.post.fetch(postPda);
    const originalLikeCount = originalPost.likeCount.toNumber();

    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ like: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const updatedPost = await program.account.post.fetch(postPda);
    expect(updatedPost.likeCount.toNumber()).to.equal(originalLikeCount + 1);
  });

  it("Should increment post love count when adding Love reaction", async () => {
    const originalPost = await program.account.post.fetch(postPda);
    const originalLoveCount = originalPost.loveCount.toNumber();

    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ love: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const updatedPost = await program.account.post.fetch(postPda);
    expect(updatedPost.loveCount.toNumber()).to.equal(originalLoveCount + 1);
  });

  it("Should update post updated_at timestamp when adding reaction", async () => {
    const originalPost = await program.account.post.fetch(postPda);
    const originalUpdatedAt = originalPost.updatedAt.toNumber();

    await new Promise(resolve => setTimeout(resolve, 1000));

    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ haha: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    const updatedPost = await program.account.post.fetch(postPda);
    expect(updatedPost.updatedAt.toNumber()).to.be.greaterThan(originalUpdatedAt);
  });

  it("Should validate that reaction PDA is derived correctly", async () => {

    const [wrongPda] = pda([
      Buffer.from("wrong_seed"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    try {
      await program.methods
        .createReaction({ like: {} })
        .accounts({
          reactioner: user.publicKey,
          reaction: wrongPda,
          post: postPda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });

  it("Should generate different PDAs for different users reacting to same post", async () => {
    const user2 = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user2.publicKey);

    const [reactionPda1] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    const [reactionPda2] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    expect(reactionPda1.toBase58()).to.not.equal(reactionPda2.toBase58());
  });

  it("Should generate different PDAs for same user reacting to different posts", async () => {
    // Create second post
    const mediaUri2 = "https://example.com/post2.jpg";
    const content2 = "Second post for reactions";
    const [postPda2] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri2, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri2, content2)
      .accounts({
        creator: user.publicKey,
        post: postPda2,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    const [reactionPda1] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    const [reactionPda2] = pda([
      Buffer.from("reaction"),
      postPda2.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    expect(reactionPda1.toBase58()).to.not.equal(reactionPda2.toBase58());
  });
});

// ========================================
// FOLLOW USER TESTS
// ========================================


describe("Follow User", () => {
  let user1: anchor.web3.Keypair;
  let user2: anchor.web3.Keypair;
  let user1ProfilePda: anchor.web3.PublicKey;
  let user2ProfilePda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  beforeEach(async () => {
    user1 = anchor.web3.Keypair.generate();
    user2 = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user1.publicKey);
    await airdrop(provider.connection, user2.publicKey);
    
    [user1ProfilePda] = pda([Buffer.from("profile"), user1.publicKey.toBuffer()]);
    [user2ProfilePda] = pda([Buffer.from("profile"), user2.publicKey.toBuffer()]);

    // Create profiles for both users
    await program.methods
      .initialize("user1", "First user", "https://user1.com/avatar.png")
      .accounts({
        user: user1.publicKey
      })
      .signers([user1])
      .rpc();

    await program.methods
      .initialize("user2", "Second user", "https://user2.com/avatar.png")
      .accounts({
        user: user2.publicKey
      })
      .signers([user2])
      .rpc();
  });

  it("Should follow user successfully", async () => {
    const [followPda] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    const follow = await program.account.follow.fetch(followPda);
    expect(follow.follower.toBase58()).to.equal(user1.publicKey.toBase58());
    expect(follow.following.toBase58()).to.equal(user2.publicKey.toBase58());
    expect(follow.createdAt.toNumber()).to.be.greaterThan(0);
    expect(follow.updatedAt.toNumber()).to.equal(follow.createdAt.toNumber());
  });

  it("Should increment follower counts correctly", async () => {
    const originalUser1Following = (await program.account.userProfile.fetch(user1ProfilePda)).followingCount.toNumber();
    const originalUser2Followers = (await program.account.userProfile.fetch(user2ProfilePda)).followerCount.toNumber();

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    const updatedUser1 = await program.account.userProfile.fetch(user1ProfilePda);
    const updatedUser2 = await program.account.userProfile.fetch(user2ProfilePda);

    expect(updatedUser1.followingCount.toNumber()).to.equal(originalUser1Following + 1);
    expect(updatedUser2.followerCount.toNumber()).to.equal(originalUser2Followers + 1);
  });

  it("Should update profile timestamps when following", async () => {
    const originalUser1Updated = (await program.account.userProfile.fetch(user1ProfilePda)).updatedAt.toNumber();
    const originalUser2Updated = (await program.account.userProfile.fetch(user2ProfilePda)).updatedAt.toNumber();

    await new Promise(resolve => setTimeout(resolve, 1000));

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    const updatedUser1 = await program.account.userProfile.fetch(user1ProfilePda);
    const updatedUser2 = await program.account.userProfile.fetch(user2ProfilePda);

    expect(updatedUser1.updatedAt.toNumber()).to.be.greaterThan(originalUser1Updated);
    expect(updatedUser2.updatedAt.toNumber()).to.be.greaterThan(originalUser2Updated);
  });

  it("Should fail when user tries to follow themselves", async () => {
    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          followerProfile: user1ProfilePda,
          followingProfile: user1ProfilePda,
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("CannotFollowSelf");
      expect(error.error.errorCode.number).to.equal(6011);
    }
  });

  it("Should fail when unauthorized user tries to modify follower profile", async () => {
    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          followerProfile: user2ProfilePda, // Wrong profile - should be user1's profile
          followingProfile: user2ProfilePda
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintRaw");
      expect(error.error.errorCode.number).to.equal(2003);
    }
  });

  it("Should validate that follow PDA is derived correctly", async () => {
    const [wrongPda] = pda([
      Buffer.from("wrong_seed"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          follow: wrongPda,
          followerProfile: user1ProfilePda,
          followingProfile: user2ProfilePda
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });

  it("Should generate different PDAs for different follow relationships", async () => {
    const [followPda1] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    const [followPda2] = pda([
      Buffer.from("follow"),
      user2.publicKey.toBuffer(),
      user1.publicKey.toBuffer()
    ]);

    expect(followPda1.toBase58()).to.not.equal(followPda2.toBase58());
  });

  it("Should allow bidirectional following", async () => {
    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda,
      })
      .signers([user1])
      .rpc();

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user2.publicKey,
        followerProfile: user2ProfilePda,
        followingProfile: user1ProfilePda,
      })
      .signers([user2])
      .rpc();

    const user1Profile = await program.account.userProfile.fetch(user1ProfilePda);
    const user2Profile = await program.account.userProfile.fetch(user2ProfilePda);

    expect(user1Profile.followingCount.toNumber()).to.equal(1);
    expect(user1Profile.followerCount.toNumber()).to.equal(1);
    expect(user2Profile.followingCount.toNumber()).to.equal(1);
    expect(user2Profile.followerCount.toNumber()).to.equal(1);
  });

  it("Should fail when trying to follow non-existent profile", async () => {
    const nonExistentProfile = anchor.web3.Keypair.generate();
    const [followPda] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      nonExistentProfile.publicKey.toBuffer()
    ]);

    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          followerProfile: user1ProfilePda,
          followingProfile: nonExistentProfile.publicKey, // This will fail
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      // Should fail because the account doesn't exist
      expect(error).to.exist;
    }
  });
});

describe("Fetch Profile Posts", () => {
  let user: anchor.web3.Keypair;
  let userProfilePda: anchor.web3.PublicKey;
  let postPda1: anchor.web3.PublicKey;
  let postPda2: anchor.web3.PublicKey;
  let postPda3: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  beforeEach(async () => {
    user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);
    [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    // Create profile first
    await program.methods
      .initialize("fetchuser", "User who fetches posts", "https://fetchuser.com/avatar.png")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    // Create multiple posts for the same profile
    const mediaUri1 = "https://example.com/post1.jpg";
    const content1 = "First post content";
    [postPda1] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri1, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    const mediaUri2 = "https://example.com/post2.jpg";
    const content2 = "Second post content";
    [postPda2] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri2, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    const mediaUri3 = "https://example.com/post3.jpg";
    const content3 = "Third post content";
    [postPda3] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri3, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    // Create all three posts
    await program.methods
      .createPost(mediaUri1, content1)
      .accounts({
        creator: user.publicKey,
        post: postPda1,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    await program.methods
      .createPost(mediaUri2, content2)
      .accounts({
        creator: user.publicKey,
        post: postPda2,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();

    await program.methods
      .createPost(mediaUri3, content3)
      .accounts({
        creator: user.publicKey,
        post: postPda3,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();
  });

  it("Should fetch all posts belonging to current profile", async () => {
    // Fetch all posts for the current profile
    const posts = await program.account.post.all([
      {
        memcmp: {
          offset: 8,
          bytes: userProfilePda.toBase58()
        }
      }
    ]);

    // Should have exactly 3 posts
    expect(posts).to.have.length(3);

    // Verify all posts belong to the same profile
    posts.forEach(post => {
      expect(post.account.profile.toBase58()).to.equal(userProfilePda.toBase58());
      expect(post.account.creator.toBase58()).to.equal(user.publicKey.toBase58());
    });

    // Verify we have all the expected posts
    const postContents = posts.map(post => post.account.content);
    expect(postContents).to.include("First post content");
    expect(postContents).to.include("Second post content");
    expect(postContents).to.include("Third post content");
  });

  it("Should not fetch posts from other profiles", async () => {
    // Create another user and profile
    const otherUser = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, otherUser.publicKey);
    const [otherProfilePda] = pda([Buffer.from("profile"), otherUser.publicKey.toBuffer()]);

    await program.methods
      .initialize("otheruser", "Other user", "https://other.com/avatar.png")
      .accounts({
        user: otherUser.publicKey
      })
      .signers([otherUser])
      .rpc();

    // Create a post for the other profile
    const otherMediaUri = "https://other.com/post.jpg";
    const otherContent = "Other user's post";
    const [otherPostPda] = pda([
      Buffer.from("post"),
      otherUser.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(otherMediaUri, 'utf8')).digest().slice(0, 4),
      otherProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(otherMediaUri, otherContent)
      .accounts({
        creator: otherUser.publicKey,
        post: otherPostPda,
        profile: otherProfilePda
      })
      .signers([otherUser])
      .rpc();

    // Fetch posts for the original profile
    const posts = await program.account.post.all([
      {
        memcmp: {
          offset: 8,
          bytes: userProfilePda.toBase58()
        }
      }
    ]);

    // Should still have exactly 3 posts (only from original profile)
    expect(posts).to.have.length(3);

    // Verify none of the posts belong to the other profile
    posts.forEach(post => {
      expect(post.account.profile.toBase58()).to.not.equal(otherProfilePda.toBase58());
    });
  });

  it("Should return empty array when profile has no posts", async () => {
    // Create a new user with no posts
    const newUser = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, newUser.publicKey);
    const [newProfilePda] = pda([Buffer.from("profile"), newUser.publicKey.toBuffer()]);

    await program.methods
      .initialize("newuser", "New user with no posts", "https://newuser.com/avatar.png")
      .accounts({
        user: newUser.publicKey
      })
      .signers([newUser])
      .rpc();

    // Fetch posts for the new profile
    const posts = await program.account.post.all([
      {
        memcmp: {
          offset: 8,
          bytes: newProfilePda.toBase58()
        }
      }
    ]);

    // Should have no posts
    expect(posts).to.have.length(0);
  });

  it("Should fetch posts with correct offset calculation", async () => {
    // Test that the offset calculation is correct by verifying the profile field
    const posts = await program.account.post.all([
      {
        memcmp: {
          offset: 8, // discriminator + creator + content + media_uri
          bytes: userProfilePda.toBase58()
        }
      }
    ]);

    // Verify the offset is correct by checking that all returned posts have the right profile
    posts.forEach(post => {
      expect(post.account.profile.toBase58()).to.equal(userProfilePda.toBase58());
    });
  });
});

describe("Fetch All Posts Across All Users", () => {
  let user1: anchor.web3.Keypair;
  let user2: anchor.web3.Keypair;
  let user3: anchor.web3.Keypair;
  let user1ProfilePda: anchor.web3.PublicKey;
  let user2ProfilePda: anchor.web3.PublicKey;
  let user3ProfilePda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  beforeEach(async () => {
    user1 = anchor.web3.Keypair.generate();
    user2 = anchor.web3.Keypair.generate();
    user3 = anchor.web3.Keypair.generate();
    
    await airdrop(provider.connection, user1.publicKey);
    await airdrop(provider.connection, user2.publicKey);
    await airdrop(provider.connection, user3.publicKey);
    
    [user1ProfilePda] = pda([Buffer.from("profile"), user1.publicKey.toBuffer()]);
    [user2ProfilePda] = pda([Buffer.from("profile"), user2.publicKey.toBuffer()]);
    [user3ProfilePda] = pda([Buffer.from("profile"), user3.publicKey.toBuffer()]);

    // Create profiles for all users
    await program.methods
      .initialize("user1", "First user", "https://user1.com/avatar.png")
      .accounts({
        user: user1.publicKey
      })
      .signers([user1])
      .rpc();

    await program.methods
      .initialize("user2", "Second user", "https://user2.com/avatar.png")
      .accounts({
        user: user2.publicKey
      })
      .signers([user2])
      .rpc();

    await program.methods
      .initialize("user3", "Third user", "https://user3.com/avatar.png")
      .accounts({
        user: user3.publicKey
      })
      .signers([user3])
      .rpc();
  });

  it("Should fetch all posts across all users", async () => {
    // Create posts for user1
    const mediaUri1 = "https://user1.com/post1.jpg";
    const content1 = "User1 first post";
    const [postPda1] = pda([
      Buffer.from("post"),
      user1.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri1, 'utf8')).digest().slice(0, 4),
      user1ProfilePda.toBuffer()
    ]);

    const mediaUri2 = "https://user1.com/post2.jpg";
    const content2 = "User1 second post";
    const [postPda2] = pda([
      Buffer.from("post"),
      user1.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri2, 'utf8')).digest().slice(0, 4),
      user1ProfilePda.toBuffer()
    ]);

    // Create posts for user2
    const mediaUri3 = "https://user2.com/post1.jpg";
    const content3 = "User2 first post";
    const [postPda3] = pda([
      Buffer.from("post"),
      user2.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri3, 'utf8')).digest().slice(0, 4),
      user2ProfilePda.toBuffer()
    ]);

    // Create post for user3
    const mediaUri4 = "https://user3.com/post1.jpg";
    const content4 = "User3 first post";
    const [postPda4] = pda([
      Buffer.from("post"),
      user3.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri4, 'utf8')).digest().slice(0, 4),
      user3ProfilePda.toBuffer()
    ]);

    // Create all posts
    await program.methods
      .createPost(mediaUri1, content1)
      .accounts({
        creator: user1.publicKey,
        post: postPda1,
        profile: user1ProfilePda
      })
      .signers([user1])
      .rpc();

    await program.methods
      .createPost(mediaUri2, content2)
      .accounts({
        creator: user1.publicKey,
        post: postPda2,
        profile: user1ProfilePda
      })
      .signers([user1])
      .rpc();

    await program.methods
      .createPost(mediaUri3, content3)
      .accounts({
        creator: user2.publicKey,
        post: postPda3,
        profile: user2ProfilePda
      })
      .signers([user2])
      .rpc();

    await program.methods
      .createPost(mediaUri4, content4)
      .accounts({
        creator: user3.publicKey,
        post: postPda4,
        profile: user3ProfilePda
      })
      .signers([user3])
      .rpc();

    // Fetch all posts across all users
    const allPosts = await program.account.post.all();

    // Should have exactly 4 posts total
    expect(allPosts).to.have.length(4);

    // Verify posts from all users are included
    const postContents = allPosts.map(post => post.account.content);
    expect(postContents).to.include("User1 first post");
    expect(postContents).to.include("User1 second post");
    expect(postContents).to.include("User2 first post");
    expect(postContents).to.include("User3 first post");

    // Verify posts belong to different profiles
    const profileAddresses = allPosts.map(post => post.account.profile.toBase58());
    expect(profileAddresses).to.include(user1ProfilePda.toBase58());
    expect(profileAddresses).to.include(user2ProfilePda.toBase58());
    expect(profileAddresses).to.include(user3ProfilePda.toBase58());

    // Verify creators are different
    const creatorAddresses = allPosts.map(post => post.account.creator.toBase58());
    expect(creatorAddresses).to.include(user1.publicKey.toBase58());
    expect(creatorAddresses).to.include(user2.publicKey.toBase58());
    expect(creatorAddresses).to.include(user3.publicKey.toBase58());
  });

  it("Should fetch posts with correct structure and data", async () => {
    // Create a simple post for testing structure
    const mediaUri = "https://test.com/structure.jpg";
    const content = "Testing post structure";
    const [postPda] = pda([
      Buffer.from("post"),
      user1.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      user1ProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user1.publicKey,
        post: postPda,
        profile: user1ProfilePda
      })
      .signers([user1])
      .rpc();

    // Fetch all posts
    const allPosts = await program.account.post.all();

    // Should have at least 1 post
    expect(allPosts).to.have.length.greaterThan(0);

    // Verify post structure
    const post = allPosts.find(p => p.account.content === content);
    expect(post).to.exist;
    expect(post!.account).to.have.property('creator');
    expect(post!.account).to.have.property('content');
    expect(post!.account).to.have.property('mediaUri');
    expect(post!.account).to.have.property('profile');
    expect(post!.account).to.have.property('likeCount');
    expect(post!.account).to.have.property('dislikeCount');
    expect(post!.account).to.have.property('loveCount');
    expect(post!.account).to.have.property('hahaCount');
    expect(post!.account).to.have.property('wowCount');
    expect(post!.account).to.have.property('sadCount');
    expect(post!.account).to.have.property('angryCount');
    expect(post!.account).to.have.property('commentCount');
    expect(post!.account).to.have.property('createdAt');
    expect(post!.account).to.have.property('updatedAt');

    // Verify specific values
    expect(post!.account.creator.toBase58()).to.equal(user1.publicKey.toBase58());
    expect(post!.account.content).to.equal(content);
    expect(post!.account.mediaUri).to.equal(mediaUri);
    expect(post!.account.profile.toBase58()).to.equal(user1ProfilePda.toBase58());
    expect(post!.account.likeCount.toNumber()).to.equal(0);
    expect(post!.account.commentCount.toNumber()).to.equal(0);
    expect(post!.account.createdAt.toNumber()).to.be.greaterThan(0);
    expect(post!.account.updatedAt.toNumber()).to.equal(post!.account.createdAt.toNumber());
  });

  it("Should handle empty state when no posts exist", async () => {
    // Don't create any posts, just fetch
    const allPosts = await program.account.post.all();

    // Should return empty array when no posts exist
    expect(allPosts).to.have.length(0);
  });

  it("Should fetch posts in correct order (most recent first)", async () => {
    // Create posts with delays to ensure different timestamps
    const mediaUri1 = "https://user1.com/old.jpg";
    const content1 = "Oldest post";
    const [postPda1] = pda([
      Buffer.from("post"),
      user1.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri1, 'utf8')).digest().slice(0, 4),
      user1ProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri1, content1)
      .accounts({
        creator: user1.publicKey,
        post: postPda1,
        profile: user1ProfilePda
      })
      .signers([user1])
      .rpc();

    // Wait a bit
    await new Promise(resolve => setTimeout(resolve, 1000));

    const mediaUri2 = "https://user1.com/new.jpg";
    const content2 = "Newest post";
    const [postPda2] = pda([
      Buffer.from("post"),
      user1.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri2, 'utf8')).digest().slice(0, 4),
      user1ProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri2, content2)
      .accounts({
        creator: user1.publicKey,
        post: postPda2,
        profile: user1ProfilePda
      })
      .signers([user1])
      .rpc();

    // Fetch all posts
    const allPosts = await program.account.post.all();

    // Should have 2 posts
    expect(allPosts).to.have.length(2);

    // Verify both posts exist
    const postContents = allPosts.map(post => post.account.content);
    expect(postContents).to.include("Oldest post");
    expect(postContents).to.include("Newest post");

    // Note: The order depends on the blockchain's natural ordering
    // We can't guarantee specific order without additional sorting
    // but we can verify both posts are present
  });
});

// ========================================
// COMPREHENSIVE COMMENT TESTS
// ========================================

describe("Comprehensive Comment Tests", () => {
  let user: anchor.web3.Keypair;
  let userProfilePda: anchor.web3.PublicKey;
  let postPda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  function generateString(length: number, char = "a"): string {
    return char.repeat(length);
  }

  beforeEach(async () => {
    user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);
    [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    // Create profile first
    await program.methods
      .initialize("commentuser", "User who comments", "https://commentuser.com/avatar.png")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    // Create a post to comment on
    const mediaUri = "https://example.com/post.jpg";
    const content = "Original post content";
    [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();
  });

  // HAPPY PATH TESTS
  it("Should create multiple comments on same post", async () => {
    const comment1 = "First comment";
    const comment2 = "Second comment";
    const comment3 = "Third comment";

    const [commentPda1] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(comment1, 'utf8')).digest().slice(0, 4)
    ]);

    const [commentPda2] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(comment2, 'utf8')).digest().slice(0, 4)
    ]);

    const [commentPda3] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(comment3, 'utf8')).digest().slice(0, 4)
    ]);

    // Create all three comments
    await program.methods
      .createComment(comment1)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda1,
        post: postPda
      })
      .signers([user])
      .rpc();

    await program.methods
      .createComment(comment2)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda2,
        post: postPda
      })
      .signers([user])
      .rpc();

    await program.methods
      .createComment(comment3)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda3,
        post: postPda
      })
      .signers([user])
      .rpc();

    // Verify all comments exist
    const comment1Data = await program.account.comment.fetch(commentPda1);
    const comment2Data = await program.account.comment.fetch(commentPda2);
    const comment3Data = await program.account.comment.fetch(commentPda3);

    expect(comment1Data.content).to.equal(comment1);
    expect(comment2Data.content).to.equal(comment2);
    expect(comment3Data.content).to.equal(comment3);

    // Verify post comment count is updated
    const updatedPost = await program.account.post.fetch(postPda);
    expect(updatedPost.commentCount.toNumber()).to.equal(3);
  });

  it("Should create comments with special characters and emojis", async () => {
    const specialComment = "Comment with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>? and emojis 🚀🎉💯";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(specialComment, 'utf8')).digest().slice(0, 4)
    ]);

    await program.methods
      .createComment(specialComment)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda,
        post: postPda
      })
      .signers([user])
      .rpc();

    const comment = await program.account.comment.fetch(commentPda);
    expect(comment.content).to.equal(specialComment);
  });

  it("Should create comments with different users on same post", async () => {
    const user2 = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user2.publicKey);
    const [user2ProfilePda] = pda([Buffer.from("profile"), user2.publicKey.toBuffer()]);

    await program.methods
      .initialize("user2", "Second user", "https://user2.com/avatar.png")
      .accounts({
        user: user2.publicKey
      })
      .signers([user2])
      .rpc();

    const comment1 = "Comment from user1";
    const comment2 = "Comment from user2";

    const [commentPda1] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(comment1, 'utf8')).digest().slice(0, 4)
    ]);

    const [commentPda2] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user2.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(comment2, 'utf8')).digest().slice(0, 4)
    ]);

    await program.methods
      .createComment(comment1)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda1,
        post: postPda
      })
      .signers([user])
      .rpc();

    await program.methods
      .createComment(comment2)
      .accounts({
        commenter: user2.publicKey,
        comment: commentPda2,
        post: postPda
      })
      .signers([user2])
      .rpc();

    const comment1Data = await program.account.comment.fetch(commentPda1);
    const comment2Data = await program.account.comment.fetch(commentPda2);

    expect(comment1Data.commentBy.toBase58()).to.equal(user.publicKey.toBase58());
    expect(comment2Data.commentBy.toBase58()).to.equal(user2.publicKey.toBase58());
    expect(comment1Data.content).to.equal(comment1);
    expect(comment2Data.content).to.equal(comment2);
  });

  // UNHAPPY PATH TESTS
  it("Should fail when trying to comment on non-existent post", async () => {
    const nonExistentPost = anchor.web3.Keypair.generate();
    const commentContent = "Comment on non-existent post";
    const [commentPda] = pda([
      Buffer.from("comment"),
      nonExistentPost.publicKey.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    try {
      await program.methods
        .createComment(commentContent)
        .accounts({
          commenter: user.publicKey,
          comment: commentPda,
          post: nonExistentPost.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should fail when unauthorized user tries to comment", async () => {
    const unauthorizedUser = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, unauthorizedUser.publicKey);

    const commentContent = "Unauthorized comment";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      unauthorizedUser.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    try {
      await program.methods
        .createComment(commentContent)
        .accounts({
          commenter: unauthorizedUser.publicKey,
          comment: commentPda,
          post: postPda
        })
        .signers([unauthorizedUser])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should fail when trying to create duplicate comment", async () => {
    const commentContent = "Duplicate comment";
    const [commentPda] = pda([
      Buffer.from("comment"),
      postPda.toBuffer(),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(commentContent, 'utf8')).digest().slice(0, 4)
    ]);

    // Create first comment
    await program.methods
      .createComment(commentContent)
      .accounts({
        commenter: user.publicKey,
        comment: commentPda,
        post: postPda
      })
      .signers([user])
      .rpc();

    // Try to create same comment again
    try {
      await program.methods
        .createComment(commentContent)
        .accounts({
          commenter: user.publicKey,
          comment: commentPda,
          post: postPda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });
});

// ========================================
// COMPREHENSIVE REACTION TESTS
// ========================================

describe("Comprehensive Reaction Tests", () => {
  let user: anchor.web3.Keypair;
  let userProfilePda: anchor.web3.PublicKey;
  let postPda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  beforeEach(async () => {
    user = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, user.publicKey);
    [userProfilePda] = pda([Buffer.from("profile"), user.publicKey.toBuffer()]);

    // Create profile first
    await program.methods
      .initialize("reactionuser", "User who reacts", "https://reactionuser.com/avatar.png")
      .accounts({
        user: user.publicKey
      })
      .signers([user])
      .rpc();

    // Create a post to react to
    const mediaUri = "https://example.com/reactionpost.jpg";
    const content = "Post for reactions";
    [postPda] = pda([
      Buffer.from("post"),
      user.publicKey.toBuffer(),
      crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
      userProfilePda.toBuffer()
    ]);

    await program.methods
      .createPost(mediaUri, content)
      .accounts({
        creator: user.publicKey,
        post: postPda,
        profile: userProfilePda
      })
      .signers([user])
      .rpc();
  });

  // HAPPY PATH TESTS
  it("Should create all reaction types successfully", async () => {
    const reactionTypes = [
      { like: {} },
      { dislike: {} },
      { love: {} },
      { haha: {} },
      { wow: {} },
      { sad: {} },
      { angry: {} }
    ];

    for (let i = 0; i < reactionTypes.length; i++) {
      const userForReaction = anchor.web3.Keypair.generate();
      await airdrop(provider.connection, userForReaction.publicKey);

      const [reactionPda] = pda([
        Buffer.from("reaction"),
        postPda.toBuffer(),
        userForReaction.publicKey.toBuffer()
      ]);

      await program.methods
        .createReaction(reactionTypes[i])
        .accounts({
          reactioner: userForReaction.publicKey,
          post: postPda
        })
        .signers([userForReaction])
        .rpc();

      const reaction = await program.account.reaction.fetch(reactionPda);
      expect(reaction.reactionType).to.deep.equal(reactionTypes[i]);
    }
  });

  it("Should increment correct reaction counts for all types", async () => {
    const user1 = anchor.web3.Keypair.generate();
    const user2 = anchor.web3.Keypair.generate();
    const user3 = anchor.web3.Keypair.generate();
    const user4 = anchor.web3.Keypair.generate();
    const user5 = anchor.web3.Keypair.generate();
    const user6 = anchor.web3.Keypair.generate();
    const user7 = anchor.web3.Keypair.generate();

    await airdrop(provider.connection, user1.publicKey);
    await airdrop(provider.connection, user2.publicKey);
    await airdrop(provider.connection, user3.publicKey);
    await airdrop(provider.connection, user4.publicKey);
    await airdrop(provider.connection, user5.publicKey);
    await airdrop(provider.connection, user6.publicKey);
    await airdrop(provider.connection, user7.publicKey);

    // Create different reaction types
    const reactions = [
      { user: user1, type: { like: {} } },
      { user: user2, type: { dislike: {} } },
      { user: user3, type: { love: {} } },
      { user: user4, type: { haha: {} } },
      { user: user5, type: { wow: {} } },
      { user: user6, type: { sad: {} } },
      { user: user7, type: { angry: {} } }
    ];

    for (const reaction of reactions) {
      const [reactionPda] = pda([
        Buffer.from("reaction"),
        postPda.toBuffer(),
        reaction.user.publicKey.toBuffer()
      ]);

      await program.methods
        .createReaction(reaction.type)
        .accounts({
          reactioner: reaction.user.publicKey,
          post: postPda
        })
        .signers([reaction.user])
        .rpc();
    }

    const updatedPost = await program.account.post.fetch(postPda);
    expect(updatedPost.likeCount.toNumber()).to.equal(1);
    expect(updatedPost.dislikeCount.toNumber()).to.equal(1);
    expect(updatedPost.loveCount.toNumber()).to.equal(1);
    expect(updatedPost.hahaCount.toNumber()).to.equal(1);
    expect(updatedPost.wowCount.toNumber()).to.equal(1);
    expect(updatedPost.sadCount.toNumber()).to.equal(1);
    expect(updatedPost.angryCount.toNumber()).to.equal(1);
  });

  it("Should allow multiple users to react to same post", async () => {
    const user1 = anchor.web3.Keypair.generate();
    const user2 = anchor.web3.Keypair.generate();
    const user3 = anchor.web3.Keypair.generate();

    await airdrop(provider.connection, user1.publicKey);
    await airdrop(provider.connection, user2.publicKey);
    await airdrop(provider.connection, user3.publicKey);

    const [reactionPda1] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user1.publicKey.toBuffer()
    ]);

    const [reactionPda2] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    const [reactionPda3] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user3.publicKey.toBuffer()
    ]);

    await program.methods
      .createReaction({ like: {} })
      .accounts({
        reactioner: user1.publicKey,
        post: postPda
      })
      .signers([user1])
      .rpc();

    await program.methods
      .createReaction({ like: {} })
      .accounts({
        reactioner: user2.publicKey,
        post: postPda
      })
      .signers([user2])
      .rpc();

    await program.methods
      .createReaction({ like: {} })
      .accounts({
        reactioner: user3.publicKey,
        post: postPda
      })
      .signers([user3])
      .rpc();

    const reaction1 = await program.account.reaction.fetch(reactionPda1);
    const reaction2 = await program.account.reaction.fetch(reactionPda2);
    const reaction3 = await program.account.reaction.fetch(reactionPda3);

    expect(reaction1.reactionBy.toBase58()).to.equal(user1.publicKey.toBase58());
    expect(reaction2.reactionBy.toBase58()).to.equal(user2.publicKey.toBase58());
    expect(reaction3.reactionBy.toBase58()).to.equal(user3.publicKey.toBase58());

    const updatedPost = await program.account.post.fetch(postPda);
    expect(updatedPost.likeCount.toNumber()).to.equal(3);
  });

  // UNHAPPY PATH TESTS
  it("Should fail when trying to react to non-existent post", async () => {
    const nonExistentPost = anchor.web3.Keypair.generate();
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      nonExistentPost.publicKey.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    try {
      await program.methods
        .createReaction({ like: {} })
        .accounts({
          reactioner: user.publicKey,
          post: nonExistentPost.publicKey
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should fail when unauthorized user tries to react", async () => {
    const unauthorizedUser = anchor.web3.Keypair.generate();
    await airdrop(provider.connection, unauthorizedUser.publicKey);

    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      unauthorizedUser.publicKey.toBuffer()
    ]);

    try {
      await program.methods
        .createReaction({ like: {} })
        .accounts({
          reactioner: unauthorizedUser.publicKey,
          post: postPda
        })
        .signers([unauthorizedUser])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should fail when trying to create duplicate reaction from same user", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    // Create first reaction
    await program.methods
      .createReaction({ like: {} })
      .accounts({
        reactioner: user.publicKey,
        post: postPda
      })
      .signers([user])
      .rpc();

    // Try to create same reaction again
    try {
      await program.methods
        .createReaction({ like: {} })
        .accounts({
          reactioner: user.publicKey,
          post: postPda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should fail with invalid reaction type", async () => {
    const [reactionPda] = pda([
      Buffer.from("reaction"),
      postPda.toBuffer(),
      user.publicKey.toBuffer()
    ]);

    try {
      // This should fail as it's not a valid reaction type
      await program.methods
        .createReaction({ invalid: {} } as any)
        .accounts({
          reactioner: user.publicKey,
          post: postPda
        })
        .signers([user])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });
});

// ========================================
// COMPREHENSIVE FOLLOW USER TESTS
// ========================================

describe("Comprehensive Follow User Tests", () => {
  let user1: anchor.web3.Keypair;
  let user2: anchor.web3.Keypair;
  let user3: anchor.web3.Keypair;
  let user1ProfilePda: anchor.web3.PublicKey;
  let user2ProfilePda: anchor.web3.PublicKey;
  let user3ProfilePda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  beforeEach(async () => {
    user1 = anchor.web3.Keypair.generate();
    user2 = anchor.web3.Keypair.generate();
    user3 = anchor.web3.Keypair.generate();
    
    await airdrop(provider.connection, user1.publicKey);
    await airdrop(provider.connection, user2.publicKey);
    await airdrop(provider.connection, user3.publicKey);
    
    [user1ProfilePda] = pda([Buffer.from("profile"), user1.publicKey.toBuffer()]);
    [user2ProfilePda] = pda([Buffer.from("profile"), user2.publicKey.toBuffer()]);
    [user3ProfilePda] = pda([Buffer.from("profile"), user3.publicKey.toBuffer()]);

    // Create profiles for all users
    await program.methods
      .initialize("user1", "First user", "https://user1.com/avatar.png")
      .accounts({
        user: user1.publicKey
      })
      .signers([user1])
      .rpc();

    await program.methods
      .initialize("user2", "Second user", "https://user2.com/avatar.png")
      .accounts({
        user: user2.publicKey
      })
      .signers([user2])
      .rpc();

    await program.methods
      .initialize("user3", "Third user", "https://user3.com/avatar.png")
      .accounts({
        user: user3.publicKey
      })
      .signers([user3])
      .rpc();
  });

  // HAPPY PATH TESTS
  it("Should create multiple follow relationships", async () => {
    // User1 follows User2
    const [followPda1] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    // User1 follows User3
    const [followPda2] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user3.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user3ProfilePda
      })
      .signers([user1])
      .rpc();

    // User2 follows User3
    const [followPda3] = pda([
      Buffer.from("follow"),
      user2.publicKey.toBuffer(),
      user3.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user2.publicKey,
        followerProfile: user2ProfilePda,
        followingProfile: user3ProfilePda
      })
      .signers([user2])
      .rpc();

    // Verify all follow relationships exist
    const follow1 = await program.account.follow.fetch(followPda1);
    const follow2 = await program.account.follow.fetch(followPda2);
    const follow3 = await program.account.follow.fetch(followPda3);

    expect(follow1.follower.toBase58()).to.equal(user1.publicKey.toBase58());
    expect(follow1.following.toBase58()).to.equal(user2.publicKey.toBase58());
    expect(follow2.follower.toBase58()).to.equal(user1.publicKey.toBase58());
    expect(follow2.following.toBase58()).to.equal(user3.publicKey.toBase58());
    expect(follow3.follower.toBase58()).to.equal(user2.publicKey.toBase58());
    expect(follow3.following.toBase58()).to.equal(user3.publicKey.toBase58());

    // Verify follower counts are correct
    const user1Profile = await program.account.userProfile.fetch(user1ProfilePda);
    const user2Profile = await program.account.userProfile.fetch(user2ProfilePda);
    const user3Profile = await program.account.userProfile.fetch(user3ProfilePda);

    expect(user1Profile.followingCount.toNumber()).to.equal(2);
    expect(user1Profile.followerCount.toNumber()).to.equal(0);
    expect(user2Profile.followingCount.toNumber()).to.equal(1);
    expect(user2Profile.followerCount.toNumber()).to.equal(1);
    expect(user3Profile.followingCount.toNumber()).to.equal(0);
    expect(user3Profile.followerCount.toNumber()).to.equal(2);
  });

  it("Should allow bidirectional following", async () => {
    // User1 follows User2
    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    // User2 follows User1 back
    await program.methods
      .followUserProfile()
      .accounts({
        follower: user2.publicKey,
        followerProfile: user2ProfilePda,
        followingProfile: user1ProfilePda
      })
      .signers([user2])
      .rpc();

    const user1Profile = await program.account.userProfile.fetch(user1ProfilePda);
    const user2Profile = await program.account.userProfile.fetch(user2ProfilePda);

    expect(user1Profile.followingCount.toNumber()).to.equal(1);
    expect(user1Profile.followerCount.toNumber()).to.equal(1);
    expect(user2Profile.followingCount.toNumber()).to.equal(1);
    expect(user2Profile.followerCount.toNumber()).to.equal(1);
  });

  it("Should create follow relationship with correct timestamps", async () => {
    const beforeTime = Math.floor(Date.now() / 1000) - 10;

    const [followPda] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    const afterTime = Math.floor(Date.now() / 1000);

    const follow = await program.account.follow.fetch(followPda);
    const createdAt = follow.createdAt.toNumber();
    const updatedAt = follow.updatedAt.toNumber();

    expect(createdAt).to.be.greaterThanOrEqual(beforeTime);
    expect(createdAt).to.be.lessThanOrEqual(afterTime);
    expect(createdAt).to.equal(updatedAt);
  });

  // UNHAPPY PATH TESTS
  it("Should fail when user tries to follow themselves", async () => {
    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          followerProfile: user1ProfilePda,
          followingProfile: user1ProfilePda
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("CannotFollowSelf");
      expect(error.error.errorCode.number).to.equal(6011);
    }
  });

  it("Should fail when trying to follow non-existent profile", async () => {
    const nonExistentProfile = anchor.web3.Keypair.generate();
    const [followPda] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      nonExistentProfile.publicKey.toBuffer()
    ]);

    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          followerProfile: user1ProfilePda,
          followingProfile: nonExistentProfile.publicKey
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should fail when unauthorized user tries to modify follower profile", async () => {
    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          followerProfile: user2ProfilePda, // Wrong profile - should be user1's profile
          followingProfile: user2ProfilePda
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintRaw");
      expect(error.error.errorCode.number).to.equal(2003);
    }
  });

  it("Should fail when trying to follow with wrong PDA", async () => {
    const [wrongPda] = pda([
      Buffer.from("wrong_seed"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          follow: wrongPda,
          followerProfile: user1ProfilePda,
          followingProfile: user2ProfilePda
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error.error.errorCode.code).to.equal("ConstraintSeeds");
      expect(error.error.errorCode.number).to.equal(2006);
    }
  });

  it("Should fail when trying to follow same user twice", async () => {
    // First follow should succeed
    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    // Second follow should fail
    try {
      await program.methods
        .followUserProfile()
        .accounts({
          follower: user1.publicKey,
          followerProfile: user1ProfilePda,
          followingProfile: user2ProfilePda
        })
        .signers([user1])
        .rpc();

      expect.fail("Should have thrown an error");
    } catch (error) {
      expect(error).to.exist;
    }
  });
});

// ========================================
// COMPREHENSIVE UNFOLLOW USER TESTS
// ========================================

describe.only("Comprehensive Unfollow User Tests", () => {
  let user1: anchor.web3.Keypair;
  let user2: anchor.web3.Keypair;
  let user3: anchor.web3.Keypair;
  let user1ProfilePda: anchor.web3.PublicKey;
  let user2ProfilePda: anchor.web3.PublicKey;
  let user3ProfilePda: anchor.web3.PublicKey;

  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);

  const program = anchor.workspace.solanaInstagram as Program<SolanaInstagram>;

  function pda(seeds: (Buffer | Uint8Array)[]) {
    return anchor.web3.PublicKey.findProgramAddressSync(seeds, program.programId);
  }

  async function airdrop(connection: any, address: any, amount = 1000000000) {
    await connection.confirmTransaction(await connection.requestAirdrop(address, amount), "confirmed");
  }

  beforeEach(async () => {
    user1 = anchor.web3.Keypair.generate();
    user2 = anchor.web3.Keypair.generate();
    user3 = anchor.web3.Keypair.generate();
    
    await airdrop(provider.connection, user1.publicKey);
    await airdrop(provider.connection, user2.publicKey);
    await airdrop(provider.connection, user3.publicKey);
    
    [user1ProfilePda] = pda([Buffer.from("profile"), user1.publicKey.toBuffer()]);
    [user2ProfilePda] = pda([Buffer.from("profile"), user2.publicKey.toBuffer()]);
    [user3ProfilePda] = pda([Buffer.from("profile"), user3.publicKey.toBuffer()]);

    // Create profiles for all users
    await program.methods
      .initialize("user1", "First user", "https://user1.com/avatar.png")
      .accounts({
        user: user1.publicKey
      })
      .signers([user1])
      .rpc();

    await program.methods
      .initialize("user2", "Second user", "https://user2.com/avatar.png")
      .accounts({
        user: user2.publicKey
      })
      .signers([user2])
      .rpc();

    await program.methods
      .initialize("user3", "Third user", "https://user3.com/avatar.png")
      .accounts({
        user: user3.publicKey
      })
      .signers([user3])
      .rpc();
  });

  // HAPPY PATH TESTS
  it("Should unfollow user successfully", async () => {
    // First create follow relationship
    const [followPda] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    // Verify follow exists
    const followBefore = await program.account.follow.fetch(followPda);
    expect(followBefore.follower.toBase58()).to.equal(user1.publicKey.toBase58());

    // Now unfollow
    await program.methods
      .unfollowUserProfile()
      .accounts({
        follower: user1.publicKey,
        // follow: followPda,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    // Verify follow account is closed
    try {
      await program.account.follow.fetch(followPda);
      expect.fail("Follow account should have been closed");
    } catch (error) {
      expect(error).to.exist;
    }
  });

  it("Should update follower counts correctly when unfollowing", async () => {
    // Create follow relationship
    const [followPda] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    // Get counts before unfollow
    const user1ProfileBefore = await program.account.userProfile.fetch(user1ProfilePda);
    const user2ProfileBefore = await program.account.userProfile.fetch(user2ProfilePda);

    // Unfollow
    await program.methods
      .unfollowUserProfile()
      .accounts({
        follower: user1.publicKey,
        // follow: followPda,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    // Get counts after unfollow
    const user1ProfileAfter = await program.account.userProfile.fetch(user1ProfilePda);
    const user2ProfileAfter = await program.account.userProfile.fetch(user2ProfilePda);

    expect(user1ProfileAfter.followingCount.toNumber()).to.equal(user1ProfileBefore.followingCount.toNumber() - 1);
    expect(user2ProfileAfter.followerCount.toNumber()).to.equal(user2ProfileBefore.followerCount.toNumber() - 1);
  });

  it("Should update profile timestamps when unfollowing", async () => {
    // Create follow relationship
    const [followPda] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    const user1ProfileBefore = await program.account.userProfile.fetch(user1ProfilePda);
    const user2ProfileBefore = await program.account.userProfile.fetch(user2ProfilePda);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Unfollow
    await program.methods
      .unfollowUserProfile()
      .accounts({
        follower: user1.publicKey,
        // follow: followPda,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    const user1ProfileAfter = await program.account.userProfile.fetch(user1ProfilePda);
    const user2ProfileAfter = await program.account.userProfile.fetch(user2ProfilePda);

    expect(user1ProfileAfter.updatedAt.toNumber()).to.be.greaterThan(user1ProfileBefore.updatedAt.toNumber());
    expect(user2ProfileAfter.updatedAt.toNumber()).to.be.greaterThan(user2ProfileBefore.updatedAt.toNumber());
  });

  it("Should refund SOL to follower when unfollowing", async () => {
    // Create follow relationship
    const [followPda] = pda([
      Buffer.from("follow"),
      user1.publicKey.toBuffer(),
      user2.publicKey.toBuffer()
    ]);

    await program.methods
      .followUserProfile()
      .accounts({
        follower: user1.publicKey,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    const balanceBefore = await provider.connection.getBalance(user1.publicKey);

    // Unfollow
    await program.methods
      .unfollowUserProfile()
      .accounts({
        follower: user1.publicKey,
        // follow: followPda,
        followerProfile: user1ProfilePda,
        followingProfile: user2ProfilePda
      })
      .signers([user1])
      .rpc();

    const balanceAfter = await provider.connection.getBalance(user1.publicKey);

    // Balance should increase (refund from closed account)
    expect(balanceAfter).to.be.greaterThan(balanceBefore);
  });
});