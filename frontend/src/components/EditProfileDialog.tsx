"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { UploadButton } from "@/utils/uploadthing";
import { toast } from "sonner";
import { UserProfile, useUserProfile } from "@/components/hooks/useUserProfile";

interface EditProfileDialogProps {
    profile: UserProfile;
    updateProfile: (handle: string, bio: string, avatarUri: string) => Promise<any>;
    refetch: () => Promise<void>;
}

export function EditProfileDialog({ profile, updateProfile, refetch }: EditProfileDialogProps) {
    const [handle, setHandle] = useState(profile.handle || "");
    const [bio, setBio] = useState(profile.bio || "");
    const [avatarUri, setAvatarUri] = useState(profile.avatarUri || "");
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setHandle(profile.handle || "");
            setBio(profile.bio || "");
            setAvatarUri(profile.avatarUri || "");
        }
    }, [isOpen, profile.handle, profile.bio, profile.avatarUri]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!profile) return;

        setIsLoading(true);

        try {
            const result = await updateProfile(handle, bio, avatarUri);
            if (!result.success) {
                toast.error(result?.error);
                return;
            }

            toast.success("Profile updated successfully!");
            setIsOpen(false);

            await refetch();
        } catch (error: any) {
            toast.error(`Failed to update profile: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleImageUpload = (res: any) => {
        if (res && res[0]) {
            setAvatarUri(res[0].url);
            toast.success("Image uploaded successfully!");
        }
        setIsUploading(false);
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    Edit Profile
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                    <DialogDescription>
                        Make changes to your profile here. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="handle">Handle</Label>
                            <Input
                                id="handle"
                                value={handle}
                                onChange={(e) => setHandle(e.target.value)}
                                placeholder="Enter your handle"
                                maxLength={24}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="bio">Bio</Label>
                            <Input
                                id="bio"
                                value={bio}
                                onChange={(e) => setBio(e.target.value)}
                                placeholder="Tell us about yourself"
                                maxLength={160}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>Profile Picture</Label>
                            <div className="flex items-center gap-4">
                                {avatarUri && (
                                    <img
                                        src={avatarUri}
                                        alt="Profile"
                                        className="w-16 h-16 rounded-full object-cover"
                                    />
                                )}
                                <UploadButton
                                    endpoint="imageUploader"
                                    onClientUploadComplete={handleImageUpload}
                                    onUploadError={(error: Error) => {
                                        toast.error(`Upload failed: ${error.message}`);
                                        setIsUploading(false);
                                    }}
                                    onUploadBegin={() => setIsUploading(true)}
                                    appearance={{
                                        button: "bg-primary text-primary-foreground hover:bg-primary/90 px-3 py-2 text-sm font-medium disabled:opacity-50"
                                    }}
                                    content={{
                                        button: isUploading ? "Uploading..." : "Upload Image"
                                    }}
                                    disabled={isUploading}
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : "Save changes"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}