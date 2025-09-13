"use client";

import React, { useState, useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider, setProvider } from "@coral-xyz/anchor";
import { Button } from "@/components/ui/button";
import idl from "@/anchor-idl/idl.json";
import { SolanaInstagram } from "@/anchor-idl/idl";
import { toast } from "sonner"
import { useUserProfile } from "@/components/hooks/useUserProfile";
import { UploadButton } from "@/utils/uploadthing";

export function CreateProfile() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { refetch } = useUserProfile();

  const [handle, setHandle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUri, setAvatarUri] = useState("");
  const [isLoading, setIsLoading] = useState(false);

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

  setProvider(provider!);

  // Create program instance
  const program = useMemo(() => {
    if (!provider) return null;
    return new Program(idl as SolanaInstagram, provider);
  }, [provider]);

  // Derive PDA for profile
  const profilePda = useMemo(() => {
    if (!wallet) return null;
    return PublicKey.findProgramAddressSync([Buffer.from("profile"), wallet.publicKey.toBuffer()], PROGRAM_ID)[0];
  }, [wallet]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet || !program || !profilePda) {
      toast.error("Wallet not connected or program not ready");
      return;
    }

    setIsLoading(true);

    try {
      // Validate input lengths
      if (handle.length === 0 || handle.length > 24) {
        throw new Error("Handle must be between 1-24 characters");
      }
      if (bio.length === 0 || bio.length > 160) {
        throw new Error("Bio must be between 1-160 characters");
      }
      if (avatarUri.length === 0 || avatarUri.length > 200) {
        throw new Error("Avatar URI must be between 1-200 characters");
      }

      // Create the transaction
      await program.methods
        .initialize(handle, bio, avatarUri)
        .accounts({
          user: wallet.publicKey,
          // profile: profilePda,
          // systemProgram: SystemProgram.programId,
        })
        .rpc()

      setHandle("");
      setBio("");
      setAvatarUri("");
      refetch();

      toast.success("Profile created successfully");
    } catch (err: any) {
      if (err.message.includes("Error processing Instruction 2")) {
        toast.error("Profile already exists");
      } else {
        toast.error("Failed to create profile");
      }
    } finally {
      setIsLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div className="text-center p-8">
        <p className="text-muted-foreground">Please connect your wallet to create a profile</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto p-6 bg-card rounded-lg border">
      <h2 className="text-2xl font-bold mb-6 text-center">Create Your Profile</h2>


      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="handle" className="block text-sm font-medium mb-2">
            Handle
          </label>
          <input
            id="handle"
            type="text"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            className="w-full p-2 border rounded bg-background"
            placeholder="Enter your handle (1-24 chars)"
            maxLength={24}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {handle.length}/24 characters
          </p>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm font-medium mb-2">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            className="w-full p-2 border rounded bg-background"
            placeholder="Tell us about yourself (1-160 chars)"
            maxLength={160}
            rows={3}
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            {bio.length}/160 characters
          </p>
        </div>

        <div>
          <label htmlFor="avatarUri" className="block text-sm font-medium mb-2">
            Upload Your Avatar
          </label>
          <UploadButton
            endpoint="imageUploader"
            onClientUploadComplete={(res) => {
              setAvatarUri(res[0].ufsUrl);
              toast.success("Upload Completed");
            }}
            onUploadError={(error: Error) => {
              toast.error(`ERROR! ${error.message}`);
            }}
          />
        </div>

        <Button
          type="submit"
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? "Creating Profile..." : "Create Profile"}
        </Button>
      </form>

      {profilePda && (
        <div className="mt-4 p-3 bg-muted rounded text-xs">
          <p><strong>Profile PDA:</strong></p>
          <p className="break-all">{profilePda.toBase58()}</p>
        </div>
      )}
    </div>
  );
}