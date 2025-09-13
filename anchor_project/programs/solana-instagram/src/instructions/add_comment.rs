use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::hash;

use crate::states::*;
use crate::errors::InstagramError;


pub fn add_comment(ctx: Context<AddComment>, content: String) -> Result<()> {
    require!((1..=MAX_TEXT_LENGTH).contains(&content.len()), InstagramError::InvalidContentLength);

    let commenter = &mut ctx.accounts.commenter;
    let comment = &mut ctx.accounts.comment;
    let post = &mut ctx.accounts.post;
    
    comment.post = post.key();
    comment.comment_by = commenter.key();
    comment.content = content;

    let now = Clock::get()?.unix_timestamp as u64;
    comment.created_at = now;
    comment.updated_at = now;

    post.comment_count = post.comment_count.saturating_add(1);
    post.updated_at = now;

    Ok(())
}

#[derive(Accounts)]
#[instruction(content: String)]
pub struct AddComment<'info> {
    #[account(mut)]
    pub commenter: Signer<'info>,
    #[account(
        init,
        payer = commenter,
        space = 8 + Comment::INIT_SPACE,
        seeds = [
            b"comment", 
            post.key().as_ref(), 
            commenter.key().as_ref(), 
            &hash(content.as_bytes()).to_bytes()[..4]
        ],
        bump,
    )]
    pub comment: Account<'info, Comment>,
    #[account(mut)]
    pub post: Account<'info, Post>,
    pub system_program: Program<'info, System>,
}