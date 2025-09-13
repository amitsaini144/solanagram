use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

use crate::states::*;
use crate::errors::InstagramError;


pub fn add_post(ctx: Context<AddPost>, media_uri: String, content: String) -> Result<()> {
    require!((1..=MAX_TEXT_LENGTH).contains(&content.len()), InstagramError::InvalidContentLength);
    require!((1..=MAX_URI_LENGTH).contains(&media_uri.len()), InstagramError::InvalidMediaUriLength);

    let post = &mut ctx.accounts.post;
    let profile = &mut ctx.accounts.profile;
    
    post.creator = ctx.accounts.creator.key();
    post.content = content;
    post.media_uri = media_uri;
    post.profile = profile.key();
    post.like_count = 0;
    post.comment_count = 0;

    let now = Clock::get()?.unix_timestamp as u64;
    post.created_at = now;
    post.updated_at = now;

    Ok(())
}

pub fn delete_post(_ctx: Context<DeletePost>) -> Result<()> {
    Ok(())
}

#[derive(Accounts)]
#[instruction(media_uri: String)]
pub struct AddPost<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        init,
        payer = creator,
        space = 8 + Post::INIT_SPACE,
        seeds = [
            b"post",
            creator.key().as_ref(),
            &hash(media_uri.as_bytes()).to_bytes()[..4],
            profile.key().as_ref()
        ],
        bump,
    )]
    pub post: Account<'info, Post>,
    pub profile: Account<'info, UserProfile>,
    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
pub struct DeletePost<'info> {
    #[account(mut)]
    pub creator: Signer<'info>,
    #[account(
        mut,
        close = creator,
        seeds = [
            b"post",
            creator.key().as_ref(),
            &hash(post.media_uri.as_bytes()).to_bytes()[..4],
            post.profile.as_ref()
        ],
        bump,
        constraint = post.creator == creator.key()
    )]
    pub post: Account<'info, Post>,
    pub system_program: Program<'info, System>,
}
