"use client";

import React, { useState, useEffect } from "react";
import { useUserProfile } from "@/components/hooks/useUserProfile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { UploadButton } from "@/utils/uploadthing";
import { EditProfileDialog } from "@/components/EditProfileDialog";
import { CreatePostDialog } from "@/components/CreatePostDialog";
import { usePost } from "./hooks/usePost";
import { Post } from "./hooks/usePost";
import { CreateProfile } from "./CreateProfile";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Trash2 } from "lucide-react";

export function FullProfile() {
    const { profile, updateProfile, isLoading, error, refetch } = useUserProfile();
    const { posts, refetchAllPosts, deletePost } = usePost();

    useEffect(() => {
        const posts = async () => {
            await refetchAllPosts();
        }
        posts();
    }, [profile]);

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Loading...</h1>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4 text-red-600">Error</h1>
                    <p className="text-muted-foreground mb-4">{error}</p>
                    <Button onClick={refetch}>Retry</Button>
                </div>
            </div>
        );
    }

    if (!profile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-screen pt-20">
                <div className="text-center">
                    <h1 className="text-4xl font-bold mb-4">Create your profile</h1>
                    <p className="text-muted-foreground mb-4">You need to create your profile to start using the app</p>
                    <CreateProfile />
                </div>
            </div>
        );
    }

    const handleDeletePost = async (mediaUri: string) => {
        const result = await deletePost(mediaUri);
        if (!result?.success) {
            toast.error(result?.error || "Failed to delete post");
            return;
        }
        toast.success("Post deleted successfully!");
        await refetchAllPosts();
    }

    return (
        <div className="min-h-screen pt-6">
            {/* Profile Header Section */}
            <div className="max-w-4xl mx-auto px-2 py-10 md:p-6">
                <div className="flex items-start space-x-6 mb-8">
                    {/* Profile Photo */}
                    <div className="flex-shrink-0">
                        {profile.avatarUri ? (
                            <img
                                src={profile.avatarUri}
                                alt="Profile Avatar"
                                className="w-32 h-32 rounded-full object-cover border-4 border-border"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        ) : (
                            <div className="w-32 h-32 rounded-full bg-muted flex items-center justify-center border-4 border-border">
                                <span className="text-4xl text-muted-foreground">👤</span>
                            </div>
                        )}
                    </div>

                    {/* Profile Info */}
                    <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-4">
                            <h1 className="text-3xl font-bold">@{profile.handle}</h1>
                            <EditProfileDialog
                                profile={profile}
                                updateProfile={updateProfile}
                                refetch={refetch}
                            />
                        </div>
                        <p className="text-lg text-muted-foreground mb-2">{profile.bio}</p>
                        <div className="flex space-x-2 my-1">
                            <Badge variant="secondary" className="text-sm">
                                {profile.followerCount} followers
                            </Badge>
                            <Badge variant="secondary" className="text-sm">
                                {profile.followingCount} following
                            </Badge>
                        </div>
                        <div className="flex space-x-6 text-sm text-muted-foreground">
                            <span><strong>Member since:</strong> {new Date(profile.createdAt * 1000).toLocaleDateString()}</span>
                            <span><strong>Last updated:</strong> {new Date(profile.updatedAt * 1000).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>

                {/* Divider */}
                <div className="border-t border-border "></div>

                {/* Posts Section */}
                <div className="mb-8">
                    {posts.length > 0 && <div className="flex items-center justify-end my-2"><CreatePostDialog refetchAllPosts={refetchAllPosts} /></div>}

                    {posts.length > 0 ? (
                        <div className="grid grid-cols-3 gap-px">
                            {posts.map((post: any) => (
                                <div key={post.account.mediaUri} className="relative group">
                                    <img src={post.account.mediaUri} alt="Post" className="w-80 h-60 object-cover" />
                                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button
                                                    variant="secondary"
                                                    size="icon"
                                                    className="h-8 w-8 bg-black/50 hover:bg-black/70 text-white border-0"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end" className="min-w-[100px] w-auto">
                                                <DropdownMenuItem
                                                    onClick={() => handleDeletePost(post.account.mediaUri)}
                                                    className="text-destructive focus:text-destructive"
                                                >
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <>
                            <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
                            <CreatePostDialog refetchAllPosts={refetchAllPosts} />
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}