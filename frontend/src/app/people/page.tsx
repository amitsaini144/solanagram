"use client";

import { useProfiles } from "@/components/hooks/useProfiles";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { useState } from "react";
import { toast } from "sonner";
import { PublicKey, SystemProgram } from "@solana/web3.js";


export default function PeoplePage() {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { profiles, isLoading, error, followUser, unfollowUser } = useProfiles();
  const [loadingStates, setLoadingStates] = useState<Record<string, boolean>>({});

  const handleFollow = async (profileAuthority: string, isCurrentlyFollowing: boolean) => {
    if (!wallet) {
      toast.error("Please connect your wallet first");
      return;
    }

    setLoadingStates(prev => ({ ...prev, [profileAuthority]: true }));

    try {
      const result = isCurrentlyFollowing
        ? await unfollowUser(new PublicKey(profileAuthority))
        : await followUser(new PublicKey(profileAuthority));

      if (result.success) {
        toast.success(isCurrentlyFollowing ? "Unfollowed successfully" : "Followed successfully");
      } else {
        toast.error(result.error || "Operation failed");
      }
    } catch (error) {
      console.error("Follow/Unfollow error:", error);
      toast.error("An error occurred");
    } finally {
      setLoadingStates(prev => ({ ...prev, [profileAuthority]: false }));
    }
  };

  if (!wallet) {
    return (
      <div className="min-h-screen pt-20">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6">People</h1>
          <div className="text-center py-12">
            <p className="text-muted-foreground text-lg">
              Please connect your wallet to discover and connect with other users.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-20">
      <div className="max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold mb-6">People</h1>
        <p className="text-muted-foreground mb-8">
          Discover and connect with other users on SolanaGram.
        </p>

        {isLoading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-muted-foreground mt-2">Loading profiles...</p>
          </div>
        )}

        {error && (
          <div className="text-center py-12">
            <p className="text-red-500">Error: {error}</p>
          </div>
        )}

        {!isLoading && !error && profiles.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No other users found. Be the first to create a profile!</p>
          </div>
        )}

        {!isLoading && profiles.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {profiles.map((profile) => (
              <Card key={profile.authority.toString()} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-4">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={profile.avatarUri} alt={profile.handle} />
                      <AvatarFallback>
                        {profile.handle.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-lg truncate">@{profile.handle}</h3>
                      <div className="flex space-x-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {profile.followerCount} followers
                        </Badge>
                        <Badge variant="secondary" className="text-xs">
                          {profile.followingCount} following
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                    {profile.bio || "No bio available"}
                  </p>
                  <Button
                    onClick={() => handleFollow(profile.authority.toString(), profile.isFollowing)}
                    disabled={loadingStates[profile.authority.toString()]}
                    variant={profile.isFollowing ? "outline" : "default"}
                    className="w-full"
                  >
                    {loadingStates[profile.authority.toString()] ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                        <span>Loading...</span>
                      </div>
                    ) : profile.isFollowing ? (
                      "Unfollow"
                    ) : (
                      "Follow"
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}