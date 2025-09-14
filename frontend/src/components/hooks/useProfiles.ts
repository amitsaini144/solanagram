import { useState, useEffect, useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "@/anchor-idl/idl.json";
import { SolanaInstagram } from "@/anchor-idl/idl";
import { getErrorMessage } from "@/lib/errors";
import { UserProfile } from "./useUserProfile";

export interface ProfileWithFollowStatus extends UserProfile {
  isFollowing: boolean;
  followPda: PublicKey | null;
}

export function useProfiles() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [profiles, setProfiles] = useState<ProfileWithFollowStatus[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Program ID from your Anchor.toml
  const PROGRAM_ID = new PublicKey("o7WMnMvBfhf21mXMeoi2yAdmfiCsEaKGZE3DHT1E1qF");

  // Create Anchor provider
  const provider = useMemo(() => {
    if (!wallet) return null;
    return new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
  }, [connection, wallet]);

  // Create program instance
  const program = useMemo(() => {
    if (!provider) return null;
    return new Program<SolanaInstagram>(idl as SolanaInstagram, provider);
  }, [provider]);

  // Derive PDA for follow relationship
  const deriveFollowPda = (follower: PublicKey, following: PublicKey): PublicKey => {
    return PublicKey.findProgramAddressSync([
      Buffer.from("follow"),
      follower.toBuffer(),
      following.toBuffer()
    ], PROGRAM_ID)[0];
  };

  // Check if current user follows a specific profile
  const checkFollowStatus = async (profileAuthority: PublicKey): Promise<{ isFollowing: boolean; followPda: PublicKey | null }> => {
    if (!wallet) return { isFollowing: false, followPda: null };

    try {
      const followPda = deriveFollowPda(wallet.publicKey, profileAuthority);
      await program?.account.follow.fetch(followPda);
      return { isFollowing: true, followPda };
    } catch (err) {
      return { isFollowing: false, followPda: null };
    }
  };

  // Fetch all profiles
  const fetchAllProfiles = async () => {
    if (!program || !wallet) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all user profiles
      const allProfiles = await program.account.userProfile.all();
      
      // Filter out current user's profile and add follow status
      const profilesWithStatus: ProfileWithFollowStatus[] = [];
      
      for (const profileAccount of allProfiles) {
        const profileData = profileAccount.account;
        
        // Skip current user's profile
        if (profileData.authority.equals(wallet.publicKey)) {
          continue;
        }

        const userProfile: UserProfile = {
          authority: profileData.authority,
          handle: profileData.handle,
          bio: profileData.bio,
          avatarUri: profileData.avatarUri,
          followerCount: profileData.followerCount.toNumber(),
          followingCount: profileData.followingCount.toNumber(),
          createdAt: profileData.createdAt.toNumber(),
          updatedAt: profileData.updatedAt.toNumber(),
        };

        // Check follow status
        const followStatus = await checkFollowStatus(profileData.authority);

        profilesWithStatus.push({
          ...userProfile,
          isFollowing: followStatus.isFollowing,
          followPda: followStatus.followPda,
        });
      }

      setProfiles(profilesWithStatus);
    } catch (err: any) {
      setError(err.message);
      console.error("Error fetching profiles:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Follow a user
  const followUser = async (profileAuthority: PublicKey) => {
    if (!program || !wallet) {
      throw new Error("Program or wallet not available");
    }

    try {
      // Derive PDAs
      const followPda = deriveFollowPda(wallet.publicKey, profileAuthority);
      const followerProfilePda = PublicKey.findProgramAddressSync([
        Buffer.from("profile"),
        wallet.publicKey.toBuffer()
      ], PROGRAM_ID)[0];
      const followingProfilePda = PublicKey.findProgramAddressSync([
        Buffer.from("profile"),
        profileAuthority.toBuffer()
      ], PROGRAM_ID)[0];

      // Call follow_user_profile instruction
      const tx = await program.methods
        .followUserProfile()
        .accounts({
          follower: wallet.publicKey,
        //   follow: followPda,
          followerProfile: followerProfilePda,
          followingProfile: followingProfilePda,
        //   systemProgram: SystemProgram.programId,
        })
        .rpc();

      // Update local state
      await fetchAllProfiles();
      return { success: true, tx };
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.error?.errorCode?.code);
      return { success: false, error: errorMessage };
    }
  };

  // Unfollow a user
  const unfollowUser = async (profileAuthority: PublicKey) => {
    if (!program || !wallet) {
      throw new Error("Program or wallet not available");
    }

    try {
      // Derive PDAs
      const followPda = deriveFollowPda(wallet.publicKey, profileAuthority);
      const followerProfilePda = PublicKey.findProgramAddressSync([
        Buffer.from("profile"),
        wallet.publicKey.toBuffer()
      ], PROGRAM_ID)[0];
      const followingProfilePda = PublicKey.findProgramAddressSync([
        Buffer.from("profile"),
        profileAuthority.toBuffer()
      ], PROGRAM_ID)[0];

      // Call unfollow_user_profile instruction
      const tx = await program.methods
        .unfollowUserProfile()
        .accounts({
          follower: wallet.publicKey,
        //   follow: followPda,
          followerProfile: followerProfilePda,
          followingProfile: followingProfilePda,
        })
        .rpc();

      // Update local state
      await fetchAllProfiles();
      return { success: true, tx };
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.error?.errorCode?.code);
      return { success: false, error: errorMessage };
    }
  };

  useEffect(() => {
    if (wallet && program) {
      fetchAllProfiles();
    } else {
      setProfiles([]);
    }
  }, [wallet, program]);

  return {
    profiles,
    isLoading,
    error,
    followUser,
    unfollowUser,
    refetch: fetchAllProfiles,
  };
}