use anchor_lang::prelude::*;

use crate::states::*;


// UNFOLLOW someone
pub fn unfollow_user(ctx: Context<UnfollowUser>) -> Result<()> {
    let follower_profile = &mut ctx.accounts.follower_profile;
    let following_profile = &mut ctx.accounts.following_profile;
    
    let now = Clock::get()?.unix_timestamp as u64;
    
    // Update both profiles
    follower_profile.following_count = follower_profile.following_count.saturating_sub(1);
    following_profile.follower_count = following_profile.follower_count.saturating_sub(1);
    
    follower_profile.updated_at = now;
    following_profile.updated_at = now;
    
    Ok(())
}

#[derive(Accounts)]
pub struct UnfollowUser<'info> {
    #[account(mut)]
    pub follower: Signer<'info>,
    #[account(
        mut,
        close = follower,
        seeds = [b"follow", follower.key().as_ref(), following_profile.authority.as_ref()],
        bump,
        constraint = follow.follower == follower.key()
    )]
    pub follow: Account<'info, Follow>,
    #[account(
        mut,
        constraint = follower_profile.authority == follower.key()
    )]
    pub follower_profile: Account<'info, UserProfile>,
    #[account(mut)]
    pub following_profile: Account<'info, UserProfile>,
}

// Helper function to check if user A follows user B
pub fn is_following(_ctx: Context<IsFollowing>) -> Result<bool> {
    // The follow account existing means they are following
    Ok(true)
}

#[derive(Accounts)]
pub struct IsFollowing<'info> {
    #[account(
        seeds = [b"follow", follower.key().as_ref(), following.key().as_ref()],
        bump,
    )]
    pub follow: Account<'info, Follow>,
    /// CHECK: This is just used for the seed
    pub follower: AccountInfo<'info>,
    /// CHECK: This is just used for the seed  
    pub following: AccountInfo<'info>,
}