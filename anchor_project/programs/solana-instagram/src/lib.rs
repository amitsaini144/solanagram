#![allow(unexpected_cfgs)]


use crate::instructions::*;
use crate::states::*;
use anchor_lang::prelude::*;

pub mod errors;
pub mod states;
pub mod instructions;

declare_id!("o7WMnMvBfhf21mXMeoi2yAdmfiCsEaKGZE3DHT1E1qF");

#[program]
pub mod solana_instagram {
    use super::*;

    pub fn initialize(ctx: Context<InitializeProfile>, handle: String, bio: String, avatar_uri: String) -> Result<()> {
        initialize_profile(ctx, handle, bio, avatar_uri)
    }

    pub fn update_user_profile(ctx: Context<UpdateProfile>, handle: Option<String>, bio: Option<String>, avatar_uri: Option<String>) -> Result<()> {
        update_profile(ctx, handle, bio, avatar_uri)
    }

    pub fn create_post(ctx: Context<AddPost>, media_uri: String, content: String) -> Result<()> {
        add_post(ctx, media_uri, content)
    }

    pub fn delete_user_post(ctx: Context<DeletePost>) -> Result<()> {
        delete_post(ctx)
    }

    pub fn create_comment(ctx: Context<AddComment>, content: String) -> Result<()> {
        add_comment(ctx, content)
    }

    pub fn create_reaction(ctx: Context<AddReaction>, reaction_type: ReactionType) -> Result<()> {
        add_reaction(ctx, reaction_type)
    }

    pub fn follow_user_profile(ctx: Context<FollowUser>) -> Result<()> {
        follow_user(ctx)
    }

}
