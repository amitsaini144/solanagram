
export const INSTAGRAM_ERRORS: { [key: string]: string } = {
    // Profile errors
    'InvalidHandleLength': 'Handle must be between 1-24 characters',
    'InvalidBioLength': 'Bio must be between 1-160 characters', 
    'InvalidAvatarUriLength': 'Avatar URI must be between 1-200 characters',
    'NoFieldsToUpdate': 'Please provide at least one field to update',
    
    // Post errors
    'InvalidContentLength': 'Content must be between 1-280 characters',
    'InvalidMediaUriLength': 'Media URI must be between 1-200 characters',
    
    // General errors
    'ConstraintSeeds': 'Invalid account validation',
    'AccountNotInitialized': 'Account not initialized',
    'AccountAlreadyInitialized': 'Account already exists',
  };
  
  export function getErrorMessage(errorCode: string): string {
    return INSTAGRAM_ERRORS[errorCode] || errorCode;
  }