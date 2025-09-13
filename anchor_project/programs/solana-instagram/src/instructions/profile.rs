use anchor_lang::prelude::*;

use crate::states::*;
use crate::errors::InstagramError;


pub fn initialize_profile(ctx: Context<InitializeProfile>, handle: String, bio: String, avatar_uri: String) -> Result<()> {
    require!((1..=MAX_HANDLE_LENGTH).contains(&handle.len()), InstagramError::InvalidHandleLength);
    require!((1..=MAX_BIO_LENGTH).contains(&bio.len()), InstagramError::InvalidBioLength);
    require!((1..=MAX_URI_LENGTH).contains(&avatar_uri.len()), InstagramError::InvalidAvatarUriLength);

    let profile = &mut ctx.accounts.profile;
    
    profile.authority = ctx.accounts.user.key();
    profile.handle = handle;
    profile.bio = bio;
    profile.avatar_uri = avatar_uri;
    let now = Clock::get()?.unix_timestamp as u64;
    profile.created_at = now;
    profile.updated_at = now;

    Ok(())
}

pub fn update_profile(ctx: Context<UpdateProfile>, handle: Option<String>, bio: Option<String>, avatar_uri: Option<String>) -> Result<()> {
    require!(
        handle.is_some() || bio.is_some() || avatar_uri.is_some(),
        InstagramError::NoFieldsToUpdate
    );

    let profile = &mut ctx.accounts.profile;

    if let Some(h) = handle {
        require!((1..=MAX_HANDLE_LENGTH).contains(&h.len()), InstagramError::InvalidHandleLength);
        profile.handle = h;
    }
    
    if let Some(b) = bio {
        require!((1..=MAX_BIO_LENGTH).contains(&b.len()), InstagramError::InvalidBioLength);
        profile.bio = b;
    }
    
    if let Some(uri) = avatar_uri {
        require!((1..=MAX_URI_LENGTH).contains(&uri.len()), InstagramError::InvalidAvatarUriLength);
        profile.avatar_uri = uri;
    }
    
    profile.updated_at = Clock::get()?.unix_timestamp as u64;
    Ok(())
}

#[derive(Accounts)]
#[instruction(handle: String, bio: String, avatar_uri: String)]
pub struct InitializeProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        init,
        payer = user,
        space = 8 + UserProfile::INIT_SPACE,
        seeds = [b"profile", user.key().as_ref()],
        bump,
    )]
    pub profile: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(handle: Option<String>, bio: Option<String>, avatar_uri: Option<String>)]
pub struct UpdateProfile<'info> {
    #[account(mut)]
    pub user: Signer<'info>,
    #[account(
        mut,
        seeds = [b"profile", user.key().as_ref()],
        bump,
        constraint = profile.authority == user.key()
    )]
    pub profile: Account<'info, UserProfile>,
}