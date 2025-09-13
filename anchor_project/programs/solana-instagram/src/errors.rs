use anchor_lang::prelude::*;

#[error_code]

pub enum InstagramError {
    #[msg("Invalid handle length")]
    InvalidHandleLength,
    #[msg("Invalid bio length")]
    InvalidBioLength,
    #[msg("Invalid avatar uri length")]
    InvalidAvatarUriLength,
    #[msg("Invalid content length")]
    InvalidContentLength,
    #[msg("Invalid media uri length")]
    InvalidMediaUriLength,
    #[msg("Invalid reaction type")]
    InvalidReactionType,
    #[msg("Invalid comment length")]
    InvalidCommentLength,
    #[msg("Invalid follow length")]
    InvalidFollowLength,
    #[msg("Invalid post length")]
    InvalidPostLength,
    #[msg("Profile already exists")]
    ProfileAlreadyExists,
    #[msg("No fields to update")]
    NoFieldsToUpdate,
    #[msg("Cannot follow self")]
    CannotFollowSelf,
    #[msg("Unauthorized")]
    Unauthorized,
}
