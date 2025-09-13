use anchor_lang::prelude::*;

use crate::states::*;
use crate::states::ReactionType;


pub fn add_reaction(ctx: Context<AddReaction>, reaction_type: ReactionType) -> Result<()> {

    let reactioner = &mut ctx.accounts.reactioner;
    let reaction = &mut ctx.accounts.reaction;
    let post = &mut ctx.accounts.post;
    
    reaction.post = post.key();
    reaction.reaction_by = reactioner.key();
    reaction.reaction_type = reaction_type.clone();

    let now = Clock::get()?.unix_timestamp as u64;
    reaction.created_at = now;
    reaction.updated_at = now;

    match reaction_type {
        ReactionType::Like => post.like_count = post.like_count.saturating_add(1),
        ReactionType::Dislike => post.dislike_count = post.dislike_count.saturating_add(1),
        ReactionType::Love => post.love_count = post.love_count.saturating_add(1),
        ReactionType::Haha => post.haha_count = post.haha_count.saturating_add(1),
        ReactionType::Wow => post.wow_count = post.wow_count.saturating_add(1),
        ReactionType::Sad => post.sad_count = post.sad_count.saturating_add(1),
        ReactionType::Angry => post.angry_count = post.angry_count.saturating_add(1),
    }

    post.updated_at = now;
    Ok(())
}

#[derive(Accounts)]
#[instruction(reaction_type: ReactionType)]
pub struct AddReaction<'info> {
    #[account(mut)]
    pub reactioner: Signer<'info>,
    #[account(
        init,
        payer = reactioner,
        space = 8 + Reaction::INIT_SPACE,
        seeds = [
            b"reaction",
            post.key().as_ref(),
            reactioner.key().as_ref()],
        bump,
    )]
    pub reaction: Account<'info, Reaction>,
    #[account(mut)]
    pub post: Account<'info, Post>,
    pub system_program: Program<'info, System>,
}