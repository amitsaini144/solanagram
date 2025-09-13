use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::InstagramError;


// FOLLOW someone
pub fn follow_user(ctx: Context<FollowUser>) -> Result<()> {
    let follow = &mut ctx.accounts.follow;
    let follower_profile = &mut ctx.accounts.follower_profile;
    let following_profile = &mut ctx.accounts.following_profile;
    
    // Prevent self-following
    require!(
        ctx.accounts.follower.key() != following_profile.authority,
        InstagramError::CannotFollowSelf
    );
    
    follow.follower = ctx.accounts.follower.key();
    follow.following = following_profile.authority;
    
    let now = Clock::get()?.unix_timestamp as u64;
    follow.created_at = now;
    follow.updated_at = now;

    // Update both profiles
    follower_profile.following_count = follower_profile.following_count.saturating_add(1);
    following_profile.follower_count = following_profile.follower_count.saturating_add(1);
    
    follower_profile.updated_at = now;
    following_profile.updated_at = now;
    
    Ok(())
}

#[derive(Accounts)]
pub struct FollowUser<'info> {
    #[account(mut)]
    pub follower: Signer<'info>,
    #[account(
        init,
        payer = follower,
        space = 8 + Follow::INIT_SPACE,
        seeds = [
            b"follow",
            follower.key().as_ref(),
            following_profile.authority.as_ref()
        ],
        bump,
    )]
    pub follow: Account<'info, Follow>,
    #[account(
        mut,
        constraint = follower_profile.authority == follower.key()
    )]
    pub follower_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub following_profile: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>,
}