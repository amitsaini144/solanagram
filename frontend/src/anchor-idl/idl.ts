/**
 * Program IDL in camelCase format in order to be used in JS/TS.
 *
 * Note that this is only a type helper and is not the actual IDL. The original
 * IDL can be found at `target/idl/solana_instagram.json`.
 */
export type SolanaInstagram = {
  "address": "o7WMnMvBfhf21mXMeoi2yAdmfiCsEaKGZE3DHT1E1qF",
  "metadata": {
    "name": "solanaInstagram",
    "version": "0.1.0",
    "spec": "0.1.0",
    "description": "Created with Anchor"
  },
  "instructions": [
    {
      "name": "createComment",
      "discriminator": [
        236,
        232,
        11,
        180,
        70,
        206,
        73,
        145
      ],
      "accounts": [
        {
          "name": "commenter",
          "writable": true,
          "signer": true
        },
        {
          "name": "comment",
          "writable": true
        },
        {
          "name": "post",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "content",
          "type": "string"
        }
      ]
    },
    {
      "name": "createPost",
      "discriminator": [
        123,
        92,
        184,
        29,
        231,
        24,
        15,
        202
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "post",
          "writable": true
        },
        {
          "name": "profile"
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "mediaUri",
          "type": "string"
        },
        {
          "name": "content",
          "type": "string"
        }
      ]
    },
    {
      "name": "createReaction",
      "discriminator": [
        130,
        167,
        113,
        146,
        55,
        159,
        61,
        144
      ],
      "accounts": [
        {
          "name": "reactioner",
          "writable": true,
          "signer": true
        },
        {
          "name": "reaction",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  114,
                  101,
                  97,
                  99,
                  116,
                  105,
                  111,
                  110
                ]
              },
              {
                "kind": "account",
                "path": "post"
              },
              {
                "kind": "account",
                "path": "reactioner"
              }
            ]
          }
        },
        {
          "name": "post",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "reactionType",
          "type": {
            "defined": {
              "name": "reactionType"
            }
          }
        }
      ]
    },
    {
      "name": "deleteUserPost",
      "discriminator": [
        178,
        32,
        186,
        226,
        33,
        220,
        83,
        31
      ],
      "accounts": [
        {
          "name": "creator",
          "writable": true,
          "signer": true
        },
        {
          "name": "post",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "followUserProfile",
      "discriminator": [
        128,
        153,
        235,
        244,
        81,
        20,
        17,
        23
      ],
      "accounts": [
        {
          "name": "follower",
          "writable": true,
          "signer": true
        },
        {
          "name": "follow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  108,
                  108,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "follower"
              },
              {
                "kind": "account",
                "path": "following_profile.authority",
                "account": "userProfile"
              }
            ]
          }
        },
        {
          "name": "followerProfile",
          "writable": true
        },
        {
          "name": "followingProfile",
          "writable": true
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": []
    },
    {
      "name": "initialize",
      "discriminator": [
        175,
        175,
        109,
        31,
        13,
        152,
        155,
        237
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        },
        {
          "name": "systemProgram",
          "address": "11111111111111111111111111111111"
        }
      ],
      "args": [
        {
          "name": "handle",
          "type": "string"
        },
        {
          "name": "bio",
          "type": "string"
        },
        {
          "name": "avatarUri",
          "type": "string"
        }
      ]
    },
    {
      "name": "unfollowUserProfile",
      "discriminator": [
        42,
        193,
        95,
        142,
        226,
        144,
        42,
        125
      ],
      "accounts": [
        {
          "name": "follower",
          "writable": true,
          "signer": true
        },
        {
          "name": "follow",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  102,
                  111,
                  108,
                  108,
                  111,
                  119
                ]
              },
              {
                "kind": "account",
                "path": "follower"
              },
              {
                "kind": "account",
                "path": "following_profile.authority",
                "account": "userProfile"
              }
            ]
          }
        },
        {
          "name": "followerProfile",
          "writable": true
        },
        {
          "name": "followingProfile",
          "writable": true
        }
      ],
      "args": []
    },
    {
      "name": "updateUserProfile",
      "discriminator": [
        79,
        75,
        114,
        130,
        68,
        123,
        180,
        11
      ],
      "accounts": [
        {
          "name": "user",
          "writable": true,
          "signer": true
        },
        {
          "name": "profile",
          "writable": true,
          "pda": {
            "seeds": [
              {
                "kind": "const",
                "value": [
                  112,
                  114,
                  111,
                  102,
                  105,
                  108,
                  101
                ]
              },
              {
                "kind": "account",
                "path": "user"
              }
            ]
          }
        }
      ],
      "args": [
        {
          "name": "handle",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "bio",
          "type": {
            "option": "string"
          }
        },
        {
          "name": "avatarUri",
          "type": {
            "option": "string"
          }
        }
      ]
    }
  ],
  "accounts": [
    {
      "name": "comment",
      "discriminator": [
        150,
        135,
        96,
        244,
        55,
        199,
        50,
        65
      ]
    },
    {
      "name": "follow",
      "discriminator": [
        222,
        247,
        253,
        60,
        70,
        4,
        164,
        51
      ]
    },
    {
      "name": "post",
      "discriminator": [
        8,
        147,
        90,
        186,
        185,
        56,
        192,
        150
      ]
    },
    {
      "name": "reaction",
      "discriminator": [
        226,
        61,
        100,
        191,
        223,
        221,
        142,
        139
      ]
    },
    {
      "name": "userProfile",
      "discriminator": [
        32,
        37,
        119,
        205,
        179,
        180,
        13,
        194
      ]
    }
  ],
  "errors": [
    {
      "code": 6000,
      "name": "invalidHandleLength",
      "msg": "Invalid handle length"
    },
    {
      "code": 6001,
      "name": "invalidBioLength",
      "msg": "Invalid bio length"
    },
    {
      "code": 6002,
      "name": "invalidAvatarUriLength",
      "msg": "Invalid avatar uri length"
    },
    {
      "code": 6003,
      "name": "invalidContentLength",
      "msg": "Invalid content length"
    },
    {
      "code": 6004,
      "name": "invalidMediaUriLength",
      "msg": "Invalid media uri length"
    },
    {
      "code": 6005,
      "name": "invalidReactionType",
      "msg": "Invalid reaction type"
    },
    {
      "code": 6006,
      "name": "invalidCommentLength",
      "msg": "Invalid comment length"
    },
    {
      "code": 6007,
      "name": "invalidFollowLength",
      "msg": "Invalid follow length"
    },
    {
      "code": 6008,
      "name": "invalidPostLength",
      "msg": "Invalid post length"
    },
    {
      "code": 6009,
      "name": "profileAlreadyExists",
      "msg": "Profile already exists"
    },
    {
      "code": 6010,
      "name": "noFieldsToUpdate",
      "msg": "No fields to update"
    },
    {
      "code": 6011,
      "name": "cannotFollowSelf",
      "msg": "Cannot follow self"
    },
    {
      "code": 6012,
      "name": "unauthorized",
      "msg": "unauthorized"
    }
  ],
  "types": [
    {
      "name": "comment",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "post",
            "type": "pubkey"
          },
          {
            "name": "commentBy",
            "type": "pubkey"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "updatedAt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "follow",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "follower",
            "type": "pubkey"
          },
          {
            "name": "following",
            "type": "pubkey"
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "updatedAt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "post",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "profile",
            "type": "pubkey"
          },
          {
            "name": "creator",
            "type": "pubkey"
          },
          {
            "name": "content",
            "type": "string"
          },
          {
            "name": "mediaUri",
            "type": "string"
          },
          {
            "name": "likeCount",
            "type": "u64"
          },
          {
            "name": "dislikeCount",
            "type": "u64"
          },
          {
            "name": "loveCount",
            "type": "u64"
          },
          {
            "name": "hahaCount",
            "type": "u64"
          },
          {
            "name": "wowCount",
            "type": "u64"
          },
          {
            "name": "sadCount",
            "type": "u64"
          },
          {
            "name": "angryCount",
            "type": "u64"
          },
          {
            "name": "commentCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "updatedAt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "reaction",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "post",
            "type": "pubkey"
          },
          {
            "name": "reactionBy",
            "type": "pubkey"
          },
          {
            "name": "reactionType",
            "type": {
              "defined": {
                "name": "reactionType"
              }
            }
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "updatedAt",
            "type": "u64"
          }
        ]
      }
    },
    {
      "name": "reactionType",
      "type": {
        "kind": "enum",
        "variants": [
          {
            "name": "like"
          },
          {
            "name": "dislike"
          },
          {
            "name": "love"
          },
          {
            "name": "haha"
          },
          {
            "name": "wow"
          },
          {
            "name": "sad"
          },
          {
            "name": "angry"
          }
        ]
      }
    },
    {
      "name": "userProfile",
      "type": {
        "kind": "struct",
        "fields": [
          {
            "name": "authority",
            "type": "pubkey"
          },
          {
            "name": "handle",
            "type": "string"
          },
          {
            "name": "bio",
            "type": "string"
          },
          {
            "name": "avatarUri",
            "type": "string"
          },
          {
            "name": "followerCount",
            "type": "u64"
          },
          {
            "name": "followingCount",
            "type": "u64"
          },
          {
            "name": "createdAt",
            "type": "u64"
          },
          {
            "name": "updatedAt",
            "type": "u64"
          }
        ]
      }
    }
  ]
};
