import { useState, useEffect, useMemo } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey, Transaction, SystemProgram } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import idl from "@/anchor-idl/idl.json";
import { SolanaInstagram } from "@/anchor-idl/idl";
import crypto from "crypto";
import { getErrorMessage } from "@/lib/errors";
import { useUserProfile } from "./useUserProfile";

export interface Post {
    profile: PublicKey,
    creator: PublicKey,
    content: string,
    media_uri: string,
    like_count: number,
    dislike_count: number,
    love_count: number,
    haha_count: number,
    wow_count: number,
    sad_count: number,
    angry_count: number,
    comment_count: number,
    created_at: number,
    updated_at: number,
}

export function usePost() {
    const { connection } = useConnection();
    const wallet = useAnchorWallet();
    const [post, setPost] = useState<Post | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [posts, setPosts] = useState([]);
    const [allPosts, setAllPosts] = useState([]);
    const { profilePda } = useUserProfile();

    const PROGRAM_ID = new PublicKey("o7WMnMvBfhf21mXMeoi2yAdmfiCsEaKGZE3DHT1E1qF");

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

    // Derive PDA for post (utility function)
    const derivePostPda = (mediaUri: string, profilePda: PublicKey): PublicKey | null => {
        if (!wallet) return null;
        return PublicKey.findProgramAddressSync([
            Buffer.from("post"),
            wallet.publicKey.toBuffer(),
            crypto.createHash('sha256').update(Buffer.from(mediaUri, 'utf8')).digest().slice(0, 4),
            profilePda.toBuffer()
        ], PROGRAM_ID)[0];
    };

    // Create post function
    const createPost = async (mediaUri: string, content: string) => {
        if (!program || !wallet || !profilePda) {
            throw new Error("Program or wallet not available");
        }

        try {
            // Derive PDA for post
            const postPda = derivePostPda(mediaUri, profilePda);
            if (!postPda) {
                throw new Error("Failed to derive post PDA");
            }

            // Create the post
            const tx = await program.methods
                .createPost(mediaUri, content)
                .accounts({
                    creator: wallet.publicKey,
                    post: postPda,
                    profile: profilePda,
                    // system_program: SystemProgram.programId,
                })
                .rpc();

            return { success: true, tx };
        } catch (err: any) {
            const errorMessage = getErrorMessage(err.error?.errorCode?.code);
            return { success: false, error: errorMessage };
        }
    };

    // Fetch post data by PDA
    const fetchPost = async (mediaUri: string) => {
        if (!program || !profilePda) return;

        try {
            const postPda = derivePostPda(mediaUri, profilePda);
            if (!postPda) {
                throw new Error("Failed to derive post PDA");
            }

            const postAccount = await program.account.post.fetch(postPda);

            // Convert the account data to our interface format
            const userPost: Post = {
                profile: postAccount.profile,
                creator: postAccount.creator,
                content: postAccount.content,
                media_uri: postAccount.mediaUri,
                like_count: postAccount.likeCount.toNumber(),
                dislike_count: postAccount.dislikeCount.toNumber(),
                love_count: postAccount.loveCount.toNumber(),
                haha_count: postAccount.hahaCount.toNumber(),
                wow_count: postAccount.wowCount.toNumber(),
                sad_count: postAccount.sadCount.toNumber(),
                angry_count: postAccount.angryCount.toNumber(),
                comment_count: postAccount.commentCount.toNumber(),
                created_at: postAccount.createdAt.toNumber(),
                updated_at: postAccount.updatedAt.toNumber(),
            };

            setPost(userPost);
            return userPost;
        } catch (err: any) {
            const errorMessage = getErrorMessage(err.error?.errorCode?.code);
            return { success: false, error: errorMessage };
        }
    };

    const fetchAllUserPosts = async () => {
        if (!program || !wallet || !profilePda) return;

        try {
            const userPosts = await program.account.post.all([
                {
                    memcmp: {
                        offset: 8,
                        bytes: profilePda.toBase58()
                    }
                }
            ]);
            setPosts(userPosts as unknown as any);
        } catch (err: any) {
            const errorMessage = getErrorMessage(err.error?.errorCode?.code);
            setError(errorMessage);
        }
    }

    const fetchAllPosts = async () => {
        if (!program || !wallet) {
            return;
        }

        try {
            const allPostsResponse = await program.account.post.all();

            setAllPosts(allPostsResponse as unknown as any);
        } catch (err: any) {
            console.error("Error fetching posts:", err);
        }
    }


    const deletePost = async (mediaUri: string) => {
        if (!program || !wallet || !profilePda) return;

        const postPda = derivePostPda(mediaUri, profilePda);
        if (!postPda) {
            throw new Error("Failed to derive post PDA");
        }

        try {
            const tx = await program.methods
                .deleteUserPost()
                .accounts({
                    creator: wallet?.publicKey,
                    post: postPda,
                })
                .rpc();
            return { success: true, tx };
        } catch (err: any) {
            const errorMessage = getErrorMessage(err.error?.errorCode?.code);
            console.log("errorMessage", errorMessage);
            return { success: false, error: errorMessage };
        }
    }

    return {
        post,
        posts,
        allPosts,
        isLoading,
        error,
        createPost,
        fetchPost,
        derivePostPda,
        refetchAllPosts: fetchAllUserPosts,
        deletePost,
        fetchAllPosts,
    };
}