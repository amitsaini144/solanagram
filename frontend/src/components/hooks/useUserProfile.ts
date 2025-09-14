import { useState, useEffect, useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "@/anchor-idl/idl.json";
import { SolanaInstagram } from "@/anchor-idl/idl";
import { getErrorMessage } from "@/lib/errors";

export interface UserProfile {
  authority: PublicKey;
  handle: string;
  bio: string;
  avatarUri: string;
  createdAt: number;
  updatedAt: number;
  followerCount: number;
  followingCount: number;
}

export function useUserProfile() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const [profile, setProfile] = useState<UserProfile | null>(null);
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

  // Derive PDA for profile
  const profilePda = useMemo(() => {
    if (!wallet) return null;
    return PublicKey.findProgramAddressSync([Buffer.from("profile"), wallet.publicKey.toBuffer()], PROGRAM_ID)[0];
  }, [wallet]);

  const updateProfile = async (handle: string, bio: string, avatarUri: string) => {
    if (!program || !profilePda || !wallet) {
      throw new Error("Program or profile PDA or wallet not available");
    }

      try {
        const tx = await program.methods
          .updateUserProfile(handle, bio, avatarUri)
          .accounts({
            user: wallet.publicKey,
            // profile: profilePda,
            // systemProgram: SystemProgram.programId,
          }).rpc();

      await fetchProfile();

      return { success: true, tx };
    } catch (err: any) {
      const errorMessage = getErrorMessage(err.error?.errorCode?.code);
      return { success: false, error: errorMessage };
    }
  }

  const fetchProfile = async () => {
    if (!program || !profilePda) return;

    setIsLoading(true);
    setError(null);

    try {
      // Use the generated types from idl.ts
      const profileAccount = await program.account.userProfile.fetch(profilePda);

      // Convert the account data to our interface format
      const userProfile: UserProfile = {
        authority: profileAccount.authority,
        handle: profileAccount.handle,
        bio: profileAccount.bio,
        followerCount: profileAccount.followerCount.toNumber(),
        followingCount: profileAccount.followingCount.toNumber(),
        avatarUri: profileAccount.avatarUri,
        createdAt: profileAccount.createdAt.toNumber(),
        updatedAt: profileAccount.updatedAt.toNumber(),
      };

      setProfile(userProfile);
    } catch (err: any) {
      if (err.message.includes("Account does not exist")) {
        setProfile(null);
      } else {
        setError(err.message);
        console.error("Error fetching profile:", err);
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (wallet && program && profilePda) {
      fetchProfile();
    } else {
      setProfile(null);
    }
  }, [wallet, program, profilePda]);

  return {
    profile,
    updateProfile,
    isLoading,
    error,
    profilePda,
    refetch: fetchProfile,
  };
}