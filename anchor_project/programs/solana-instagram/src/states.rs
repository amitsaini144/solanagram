use anchor_lang::prelude::*;


pub const MAX_HANDLE_LENGTH: usize = 24;
pub const MAX_BIO_LENGTH: usize = 160;
pub const MAX_URI_LENGTH: usize = 200;
pub const MAX_TEXT_LENGTH: usize = 280;

#[derive(AnchorSerialize, AnchorDeserialize, Clone, InitSpace, PartialEq)]
pub enum ReactionType {
    Like,
    Dislike,
    Love,
    Haha,
    Wow,
    Sad,
    Angry,
}

#[account]
#[derive(InitSpace)]
pub struct UserProfile {
    pub authority: Pubkey,
    #[max_len(MAX_HANDLE_LENGTH)]
    pub handle: String,
    #[max_len(MAX_BIO_LENGTH)]
    pub bio: String,
    #[max_len(MAX_URI_LENGTH)]
    pub avatar_uri: String,
    pub follower_count: u64,
    pub following_count: u64,
    pub created_at: u64,
    pub updated_at: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Post {
    pub profile: Pubkey,
    pub creator: Pubkey,
    #[max_len(MAX_TEXT_LENGTH)]
    pub content: String,
    #[max_len(MAX_URI_LENGTH)]
    pub media_uri: String,
    pub like_count: u64,
    pub dislike_count: u64,
    pub love_count: u64,
    pub haha_count: u64,
    pub wow_count: u64,
    pub sad_count: u64,
    pub angry_count: u64,
    pub comment_count: u64,
    pub created_at: u64,
    pub updated_at: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Reaction {
    pub post: Pubkey,
    pub reaction_by: Pubkey,
    pub reaction_type: ReactionType,
    pub created_at: u64,
    pub updated_at: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Comment {
    pub post: Pubkey,
    pub comment_by: Pubkey,
    #[max_len(MAX_TEXT_LENGTH)]
    pub content: String,
    pub created_at: u64,
    pub updated_at: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Follow {
    pub follower: Pubkey, // who is following
    pub following: Pubkey, // who is being followed
    pub created_at: u64,
    pub updated_at: u64,
}
