"use client"

import { useEffect, useState } from "react";
import { usePost } from "./hooks/usePost";
import { Heart, MessageCircle, Bookmark, MoreHorizontal, User } from "lucide-react";
import { Button } from "./ui/button";
import { 
    DropdownMenu, 
    DropdownMenuContent, 
    DropdownMenuItem, 
    DropdownMenuTrigger 
} from "./ui/dropdown-menu";

interface PostData {
    account: {
        mediaUri: string;
        content: string;
        likeCount: any;
        commentCount: any;
        createdAt: any;
        creator: any;
    };
    publicKey: any;
}

const HomePagePosts = () => {
    const { allPosts, isLoading, error, fetchAllPosts } = usePost();
    const [likedPosts, setLikedPosts] = useState<Set<string>>(new Set());

    useEffect(() => {
        const fetchPosts = async () => {
            await fetchAllPosts();
        }
        fetchPosts();
    }, []);

    const handleLike = (postId: string) => {
        setLikedPosts(prev => {
            const newSet = new Set(prev);
            if (newSet.has(postId)) {
                newSet.delete(postId);
            } else {
                newSet.add(postId);
            }
            return newSet;
        });
    };

    const formatTimeAgo = (timestamp: any) => {
        const now = Date.now();
        const postTime = timestamp.toNumber() * 1000;
        const diffInSeconds = Math.floor((now - postTime) / 1000);
        
        if (diffInSeconds < 60) return `${diffInSeconds}s`;
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        return `${Math.floor(diffInSeconds / 86400)}d`;
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-20 text-red-500">
                <p>Error loading posts: {error}</p>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto px-4 py-8">
            <div className="space-y-6">
                {allPosts?.map((post: PostData, index: number) => (
                    <div key={post.publicKey.toString()} className="bg-white border border-gray-200 rounded-lg shadow-sm">
                        {/* Post Header */}
                        <div className="flex items-center justify-between p-4 border-b border-gray-100">
                            <div className="flex items-center space-x-3">
                                <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full flex items-center justify-center">
                                    <User className="w-4 h-4 text-white" />
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-gray-900">
                                        User {post.account.creator.toString().slice(0, 8)}...
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {formatTimeAgo(post.account.createdAt)}
                                    </p>
                                </div>
                            </div>
                            
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem>Report</DropdownMenuItem>
                                    <DropdownMenuItem>Copy Link</DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        {/* Post Image */}
                        <div className="relative">
                            <img 
                                src={post.account.mediaUri} 
                                alt="Post" 
                                className="w-full h-auto object-cover"
                                onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                }}
                            />
                        </div>

                        {/* Post Actions */}
                        <div className="p-4 space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-4">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className={`h-8 w-8 ${likedPosts.has(post.publicKey.toString()) ? 'text-red-500' : 'text-gray-600'}`}
                                        onClick={() => handleLike(post.publicKey.toString())}
                                    >
                                        <Heart className={`h-5 w-5 ${likedPosts.has(post.publicKey.toString()) ? 'fill-current' : ''}`} />
                                    </Button>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                                        <MessageCircle className="h-5 w-5" />
                                    </Button>
                                </div>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-600">
                                    <Bookmark className="h-5 w-5" />
                                </Button>
                            </div>

                            {/* Like Count */}
                            <div className="text-sm font-semibold text-gray-900">
                                {post.account.likeCount.toNumber() + (likedPosts.has(post.publicKey.toString()) ? 1 : 0)} likes
                            </div>

                            {/* Post Content */}
                            <div className="space-y-2">
                                <p className="text-sm text-gray-900">
                                    <span className="font-semibold mr-2">
                                        User {post.account.creator.toString().slice(0, 8)}...
                                    </span>
                                    {post.account.content}
                                </p>
                            </div>

                            {/* Comment Count */}
                            <div className="text-sm text-gray-500">
                                View all {post.account.commentCount.toNumber()} comments
                            </div>

                            {/* Timestamp */}
                            <div className="text-xs text-gray-400 uppercase tracking-wide">
                                {formatTimeAgo(post.account.createdAt)}
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {allPosts.length === 0 && (
                <div className="text-center py-20">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                        <MessageCircle className="w-12 h-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No posts yet</h3>
                    <p className="text-gray-500">Be the first to share something amazing!</p>
                </div>
            )}
        </div>
    );
};

export default HomePagePosts;