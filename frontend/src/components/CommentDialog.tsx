"use client";

import { useState, useEffect } from "react";
import { useConnection, useAnchorWallet } from "@solana/wallet-adapter-react";
import { PublicKey } from "@solana/web3.js";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { useComments } from "./hooks/useComments";
import { useUserProfile } from "./hooks/useUserProfile";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Send, User } from "lucide-react";

interface CommentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  postPda: PublicKey;
  postCreator: PublicKey;
}

export default function CommentDialog({ isOpen, onClose, postPda, postCreator }: CommentDialogProps) {
  const { connection } = useConnection();
  const wallet = useAnchorWallet();
  const { comments, isLoading, error, addComment, fetchCommentsForPost } = useComments();
  const { profile } = useUserProfile();
  const [newComment, setNewComment] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen && postPda) {
      fetchCommentsForPost(postPda);
    }
  }, [isOpen, postPda]);

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error("Please enter a comment");
      return;
    }

    if (!wallet) {
      toast.error("Please connect your wallet");
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await addComment(postPda, newComment.trim());
      
      if (result.success) {
        setNewComment("");
        toast.success("Comment added successfully");
      } else {
        toast.error(result.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("An error occurred while adding comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const commentTime = timestamp * 1000;
    const diffInSeconds = Math.floor((now - commentTime) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    return `${Math.floor(diffInSeconds / 86400)}d`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Comments</DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>Error loading comments: {error}</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>No comments yet. Be the first to comment!</p>
            </div>
          ) : (
            comments.map((comment, index) => (
              <div key={index} className="flex space-x-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <span className="font-semibold text-sm">
                      User {comment.commentBy.toString().slice(0, 8)}...
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(comment.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add Comment Section */}
        <div className="border-t pt-4">
          {wallet ? (
            <div className="flex space-x-2">
              <Input
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleAddComment();
                  }
                }}
                disabled={isSubmitting}
                className="flex-1"
              />
              <Button
                onClick={handleAddComment}
                disabled={isSubmitting || !newComment.trim()}
                size="icon"
              >
                {isSubmitting ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-4">
              Please connect your wallet to add comments
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}