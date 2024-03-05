import {
  HTTP_BAD_REQUEST,
  HTTP_CONFLICT,
  HTTP_SUCCESS_GET,
  HTTP_SUCCESS_POST,
  HTTP_UNAUTHORIZE,
} from './constants';

const authentication = {
  type: 'object',
  properties: {
    accessToken: {
      type: 'string',
      example:
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6ImpvaG4uc25vdy5hZG1pbkBtYWlsaW5hdG9yLmNvbSIsInN1YiI6IjEiLCJqdGkiOiI2YzEzYmNhNTE5MGQ4YWQ3OTU1ZmM1MzRhNjY5MTM3NmYyZWY1NWI3MzRlMmExMjk5NzFlNDU1MzU2MmI4ZTVhIiwiaWF0IjoxNjc2NTM0Mjc0LCJleHAiOjE2Nzg5NTM0NzR9.GbKyURJOhxqScct4LWLt65xuxdJPphYHcFC1ooumH_s',
    },
    refreshToken: {
      type: 'string',
      example:
        'DuAitjb1H/pnML7HTU9cnUruoOFT/K2hntcRNUKksaSBEugMyBu64ZPs+Ux8o3hd',
    },
    expiresAt: {
      type: 'number',
      example: 1678953474,
    },
  },
};

export const WORKSPACE_LIST = {
  status: 200,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: { type: 'number', example: 1 },
            workspaceName: { type: 'string', example: 'Mumbai branch' },
            image: {
              type: 'string',
              example:
                'http://localhost:3015/storage/workspaceImage/ea4511080ec78e7e366c74c0db8dbd484.jpg',
            },
            address: {
              type: 'string',
              example:
                'Babu Mistry Commercial Station Road Opp. Meera Jewellers Bhayander',
            },
            country: {
              type: 'string',
              example: 'India',
            },
            state: {
              type: 'string',
              example: 'Gujarat',
            },
            city: {
              type: 'string',
              example: 'Surat',
            },
            pincode: {
              type: 'string',
              example: '388120',
            },
            email: {
              type: 'string',
              example: 'walnutedu@mailinator.com',
            },
            url: {
              type: 'string',
              example: 'https://walnutedu.net/mumbai',
            },
            phone1: {
              type: 'string',
              example: '+91 9878678767',
            },
            phone2: {
              type: 'string',
              example: '+91 9878678768',
            },
          },
        },
      },
    },
  },
};

export const GET_WORKSPACE = {
  status: 200,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          workspaceName: { type: 'string', example: 'Mumbai branch' },
          image: {
            type: 'string',
            example:
              'http://localhost:3015/storage/workspaceImage/ea4511080ec78e7e366c74c0db8dbd484.jpg',
          },
          address: {
            type: 'string',
            example:
              'Babu Mistry Commercial Station Road Opp. Meera Jewellers Bhayander',
          },
          country: {
            type: 'string',
            example: 'India',
          },
          state: {
            type: 'string',
            example: 'Gujarat',
          },
          city: {
            type: 'string',
            example: 'Surat',
          },
          pincode: {
            type: 'string',
            example: '388120',
          },
          email: {
            type: 'string',
            example: 'walnutedu@mailinator.com',
          },
          url: {
            type: 'string',
            example: 'https://walnutedu.net/mumbai',
          },
          phone1: {
            type: 'string',
            example: '+91 9878678767',
          },
          phone2: {
            type: 'string',
            example: '+91 9878678768',
          },
        },
      },
    },
  },
};

export const meta = {
  type: 'object',
  properties: {
    totalItems: {
      type: 'integer',
      example: 12,
    },
    itemsPerPage: {
      type: 'integer',
      example: 1,
    },
    itemCount: {
      type: 'integer',
      example: 1,
    },
    totalPages: {
      type: 'integer',
      example: 1,
    },
    currentPage: {
      type: 'integer',
      example: 1,
    },
  },
};

export const BAD_REQUEST_RESPONSE = {
  status: HTTP_BAD_REQUEST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_BAD_REQUEST,
      },
      message: {
        type: 'string',
        example: 'error message',
      },
      error: {
        type: 'string',
        example: 'Bad Request',
      },
    },
  },
};

export const UNAUTHORIZE_RESPONSE = {
  status: HTTP_UNAUTHORIZE,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_UNAUTHORIZE },
      message: {
        type: 'string',
        example: 'Unauthorized',
      },
    },
  },
};

export const CONFLICT_RESPONSE = {
  status: HTTP_CONFLICT,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_CONFLICT,
      },
      message: {
        type: 'string',
        example: 'Conflict error message',
      },
      error: {
        type: 'string',
        example: 'Conflict',
      },
    },
  },
};

export const POST_REQUEST_SUCCESS = {
  status: HTTP_SUCCESS_POST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_SUCCESS_POST,
      },
      message: {
        type: 'string',
        example: 'Resource created.',
      },
    },
  },
};

export const PUT_REQUEST_SUCCESS = {
  status: HTTP_SUCCESS_POST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_SUCCESS_GET,
      },
      message: {
        type: 'string',
        example: 'Success.',
      },
    },
  },
};

export const GET_RESPONSE_SUCCESS = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_SUCCESS_GET,
      },
      message: {
        type: 'string',
        example: 'Success.',
      },
    },
  },
};

const taskCard = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      example: 1,
    },
    taskUniqueId: {
      type: 'string',
      example: 'T75860a3a1679900139',
    },
    taskName: {
      type: 'string',
      example: 'John Snow Admin',
    },
    taskDescription: {
      type: 'string',
      example: 'Task description',
    },
    priority: {
      type: 'string',
      example: 'Low',
    },
    status: {
      type: 'string',
      example: 'Assigned',
    },
    startingDateTime: {
      type: 'number',
      example: '1679914083',
    },
    endingDateTime: {
      type: 'number',
      example: '1679914083',
    },
    estimatedTimeInSeconds: {
      type: 'number',
      example: '140',
    },
    assignedToUser: {
      type: 'object',
      properties: {
        profilePic: {
          type: 'string',
          example:
            'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
        },
        name: { type: 'string', example: 'John Snow' },

        userUniqueId: {
          type: 'string',
          example: 'Uhj89dfHj2390',
        },
        id: {
          type: 'number',
          example: 1,
        },
        email: {
          type: 'string',
          example: 'john@gmail.com',
        },
      },
    },
    assignedToTeam: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          profilePic: {
            type: 'string',
            example:
              'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
          },
          name: { type: 'string', example: 'John Snow' },

          userUniqueId: {
            type: 'string',
            example: 'Uhj89dfHj2390',
          },
          id: {
            type: 'number',
            example: 1,
          },
          email: {
            type: 'string',
            example: 'john@gmail.com',
          },
        },
      },
    },
    taskAttachement: {
      type: 'object',
      properties: {
        media: {
          type: 'string',
          example:
            'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
        },
        mediaType: { type: 'string', example: 'image' },
        mediaThumbnail: { type: 'string', example: null },
        seconds: { type: 'number', example: 0 },
        attachmentUniqueId: { type: 'string', example: 'TAksd8934820389203j' },
        userUniqueId: {
          type: 'string',
          example: 'Uhj89dfHj2390',
        },
      },
    },
    totalAttachments: {
      type: 'number',
      example: 0,
    },
    totalComments: {
      type: 'number',
      example: 0,
    },
    totalSubtasks: {
      type: 'number',
      example: 0,
    },
    totalSubtasksCompleted: {
      type: 'number',
      example: 0,
    },
    progressInPerecentage: {
      type: 'string',
      example: '20',
    },
  },
};

export const TASK_KANBAN_VIEW = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_SUCCESS_GET,
      },
      data: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              example: 1,
            },
            title: {
              type: 'string',
              example: 'Assigned',
            },
            color: {
              type: 'string',
              example: '#5051F9',
            },
            bgColor: {
              type: 'string',
              example: '#5051F933',
            },
            cards: {
              type: 'array',
              items: taskCard,
            },
            meta: meta,
          },
        },
      },
    },
  },
};

export const TASK_KANBAN_VIEW_PAGINATION = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_SUCCESS_GET,
      },
      data: {
        type: 'array',
        items: taskCard,
      },
      meta: meta,
    },
  },
};

export const SUPERADMIN_USER_RESPONSE = {
  status: HTTP_SUCCESS_POST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_SUCCESS_POST,
      },
      message: {
        type: 'string',
        example: 'You are successfully registered',
      },
      data: {
        type: 'object',
        properties: {
          id: {
            type: 'number',
            example: 1,
          },
          name: {
            type: 'string',
            example: 'John Snow Admin',
          },
          email: {
            type: 'string',
            example: 'john.snow.admin@mailinator.com',
          },
          createdAt: { type: 'number', example: 1676049232 },
          authentication: authentication,
        },
      },
    },
  },
};

const taskDetail = {
  type: 'object',
  properties: {
    id: {
      type: 'number',
      example: 1,
    },
    taskUniqueId: {
      type: 'string',
      example: 'T75860a3a1679900139',
    },
    taskName: {
      type: 'string',
      example: 'John Snow Admin',
    },
    taskDescription: {
      type: 'string',
      example: 'Task description',
    },
    toBeDoneAtFrom: {
      type: 'string',
      example: '11:00:00',
    },
    toBeDoneAtTo: {
      type: 'string',
      example: '11:00:00',
    },
    reminderIntervalNumber: {
      type: 'number',
      example: 11,
    },
    reminderInterval: {
      type: 'string',
      example: 'Daily',
    },
    isArchived: {
      type: 'boolean',
      example: 'true',
    },
    isAuthorized: {
      type: 'boolean',
      example: 'true',
    },
    order: {
      type: 'number',
      example: 1,
    },
    repetitionIntervalNumber: {
      type: 'number',
      example: 11,
    },
    repetitionInterval: {
      type: 'string',
      example: 'Daily',
    },
    priority: {
      type: 'string',
      example: 'Low',
    },
    status: {
      type: 'string',
      example: 'Assigned',
    },
    startingDateTime: {
      type: 'number',
      example: '1679914083',
    },
    endingDateTime: {
      type: 'number',
      example: '1679914083',
    },
    estimatedTimeInSeconds: {
      type: 'number',
      example: '140',
    },
    parent: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          example: 1,
        },
        taskUniqueId: {
          type: 'string',
          example: 'T75860a3a1679900139',
        },
        taskName: {
          type: 'string',
          example: 'John Snow Admin',
        },
        taskDescription: {
          type: 'string',
          example: 'Task description',
        },
        toBeDoneAtFrom: {
          type: 'string',
          example: '11:00:00',
        },
        toBeDoneAtTo: {
          type: 'string',
          example: '11:00:00',
        },
        reminderIntervalNumber: {
          type: 'number',
          example: 11,
        },
        reminderInterval: {
          type: 'string',
          example: 'Daily',
        },
        isArchived: {
          type: 'boolean',
          example: 'true',
        },
        isAuthorized: {
          type: 'boolean',
          example: 'true',
        },
        order: {
          type: 'number',
          example: 1,
        },
        repetitionIntervalNumber: {
          type: 'number',
          example: 11,
        },
        repetitionInterval: {
          type: 'string',
          example: 'Daily',
        },
        priority: {
          type: 'string',
          example: 'Low',
        },
        status: {
          type: 'string',
          example: 'Assigned',
        },
        startingDateTime: {
          type: 'number',
          example: '1679914083',
        },
        endingDateTime: {
          type: 'number',
          example: '1679914083',
        },
        estimatedTimeInSeconds: {
          type: 'number',
          example: '140',
        },
      },
    },
    totalSubtasks: {
      type: 'number',
      example: '140',
    },
    assignedToUser: {
      type: 'object',
      properties: {
        profilePic: {
          type: 'string',
          example:
            'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
        },
        name: { type: 'string', example: 'John Snow' },

        userUniqueId: {
          type: 'string',
          example: 'Uhj89dfHj2390',
        },
        id: {
          type: 'number',
          example: 1,
        },
        email: {
          type: 'string',
          example: 'john@gmail.com',
        },
      },
    },
    teamUsers: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          profilePic: {
            type: 'string',
            example:
              'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
          },
          name: { type: 'string', example: 'John Snow' },

          userUniqueId: {
            type: 'string',
            example: 'Uhj89dfHj2390',
          },
          id: {
            type: 'number',
            example: 1,
          },
          email: {
            type: 'string',
            example: 'john@gmail.com',
          },
        },
      },
    },
    tags: {
      type: 'array',
      items: {
        type: 'string',
        example: 'test',
      },
    },
    taskAttachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          media: {
            type: 'string',
            example:
              'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
          },
          mediaType: { type: 'string', example: 'image' },
          mediaThumbnail: { type: 'string', example: null },
          seconds: { type: 'number', example: 0 },
          attachmentUniqueId: {
            type: 'string',
            example: 'TAksd8934820389203j',
          },
        },
      },
    },
    taskCompletedAttachments: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          media: {
            type: 'string',
            example:
              'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
          },
          mediaType: { type: 'string', example: 'image' },
          mediaThumbnail: { type: 'string', example: null },
          seconds: { type: 'number', example: 0 },
          attachmentUniqueId: {
            type: 'string',
            example: 'TAksd8934820389203j',
          },
        },
      },
    },
    progressInPerecentage: {
      type: 'string',
      example: '20',
    },
  },
};

export const TASK_DETAIL = {
  status: HTTP_SUCCESS_POST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_SUCCESS_GET,
      },
      data: taskDetail,
    },
  },
};

export const SUBTASKS = {
  status: HTTP_SUCCESS_POST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: {
        type: 'number',
        example: HTTP_SUCCESS_GET,
      },
      data: {
        type: 'array',
        items: taskDetail,
      },
      meta: meta,
    },
  },
};

const admin = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    profilePic: {
      type: 'string',
      example:
        'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
    },
    name: { type: 'string', example: 'John Snow Admin' },
    email: {
      type: 'string',
      example: 'john.snow.admin@mailinator.com',
    },
    adminUniqueId: {
      type: 'string',
      example: 'Ahj89dfHj2390',
    },
    createdAt: {
      type: 'number',
      example: 1676049232,
    },
  },
};

export const ADMIN_RESPONSE = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: {
        type: 'array',
        items: admin,
      },
    },
  },
};

export const TASK_CREATE_SUCCESS = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      message: { type: 'string', example: 'Task created' },
      data: {
        type: 'object',
        properties: {
          taskUniqueId: {
            type: 'string',
            example: 'T7959a71e1680085584',
          },
        },
      },
    },
  },
};

export const ADMIN_LOGIN_RESPONSE = {
  status: HTTP_SUCCESS_POST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_POST },
      message: { type: 'string', example: 'You are successfully logged in' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'John Snow Admin' },
          email: {
            type: 'string',
            example: 'john.snow.admin@mailinator.com',
          },
          createdAt: { type: 'number', example: 1676049232 },
          authentication: authentication,
        },
      },
    },
  },
};

export const USER_LOGIN_RESPONSE = {
  status: HTTP_SUCCESS_POST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_POST },
      message: { type: 'string', example: 'You are successfully logged in' },
      data: {
        type: 'object',
        properties: {
          id: { type: 'number', example: 1 },
          name: { type: 'string', example: 'John Snow User' },
          email: {
            type: 'string',
            example: 'john.snow.user@mailinator.com',
          },
          createdAt: { type: 'number', example: 1676049232 },
          authentication: authentication,
        },
      },
    },
  },
};

export const GET_ADMIN = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: admin,
    },
  },
};

const role = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    roleName: { type: 'string', example: 'Management' },
    roleDescription: {
      type: 'string',
      example: 'Lorem ipsum dolor sit amet consectetur. Porttitor do',
    },
    isAuthorized: {
      type: 'boolean',
      example: false,
    },
  },
};

export const ROLE_LISTING = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: {
        type: 'array',
        items: role,
      },
    },
  },
};

export const GET_ROLE = {
  status: HTTP_SUCCESS_POST,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_POST },
      data: role,
    },
  },
};

// export const USER_LOGIN_RESPONSE = {
//   status: HTTP_SUCCESS_POST,
//   schema: {
//     type: 'object',
//     description: 'Response',
//     properties: {
//       statusCode: { type: 'number', example: HTTP_SUCCESS_POST },
//       message: { type: 'string', example: 'You are successfully logged in' },
//       data: {
//         type: 'object',
//         properties: {
//           id: { type: 'number', example: 1 },
//           name: { type: 'string', example: 'John Snow' },
//           email: {
//             type: 'string',
//             example: 'johnsnow@mailinator.com',
//           },
//           createdAt: { type: 'number', example: 1676049232 },
//           authentication: authentication,
//         },
//       },
//     },
//   },
// };

const user = {
  type: 'object',
  properties: {
    id: { type: 'number', example: 1 },
    profilePic: {
      type: 'string',
      example:
        'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
    },
    name: { type: 'string', example: 'John Snow' },
    email: {
      type: 'string',
      example: 'john.snow@mailinator.com',
    },
    userUniqueId: {
      type: 'string',
      example: 'Uhj89dfHj2390',
    },
    createdAt: {
      type: 'number',
      example: 1676049232,
    },
  },
};

export const USERS_LISTING = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: {
        type: 'array',
        items: user,
      },
    },
  },
};

const comment = {
  type: 'object',
  properties: {
    commentUniqueId: {
      type: 'string',
      example: 'commentUniqueId',
    },
    comment: {
      type: 'string',
      example: 'Hello! there',
    },
    isPrivate: {
      type: 'boolean',
      example: false,
    },
    createdAt: {
      type: 'number',
      example: 123456789,
    },
    commentedBy: {
      type: 'string',
      example: 'User',
    },
    user: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 1 },
        profilePic: {
          type: 'string',
          example:
            'https://lh3.googleusercontent.com/a/ALm5wu2zkA6mtV2aFwQ5s9LRFLHH3XnE6UkNrm7JlYay=s96-c',
        },
        name: { type: 'string', example: 'John Snow' },
        email: {
          type: 'string',
          example: 'john.snow@mailinator.com',
        },
        userUniqueId: {
          type: 'string',
          example: 'Uhj89dfHj2390',
        },
      },
    },
  },
};

export const COMMENT_LISTING = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: {
        type: 'array',
        items: comment,
      },
      meta: meta,
    },
  },
};

const classes = {
  type: 'object',
  properties: {
    classUniqueId: {
      type: 'string',
      example: 'commentUniqueId',
    },
    className: {
      type: 'string',
      example: 'Class A',
    },
    numberOfDivisions: {
      type: 'number',
      example: 10,
    },
    createdAt: {
      type: 'number',
      example: 123456789,
    },

    divisions: {
      type: 'array',
      items: {
        type: 'string',
        example: 'DivisionA',
      },
    },
  },
};

export const CLASS_LISTING = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: {
        type: 'array',
        items: classes,
      },
      meta: meta,
    },
  },
};

export const GET_COMMENT = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      message: { type: 'string', example: 'success' },
      data: comment,
    },
  },
};

const academicYear = {
  type: 'object',
  properties: {
    academicYearId: {
      type: 'number',
      example: 1,
    },
    from: {
      type: 'string',
      example: '2023-07-01',
    },
    to: {
      type: 'string',
      example: '2024-07-31',
    },
    createdAt: {
      type: 'number',
      example: 123456789,
    },
    label: {
      type: 'string',
      example: 'Academic year 2023-2024',
    },
    isDefault: {
      type: 'boolean',
      example: true,
    },
  },
};

export const ACADEMIC_YEAR_LISTING = {
  status: HTTP_SUCCESS_GET,
  schema: {
    type: 'object',
    description: 'Response',
    properties: {
      statusCode: { type: 'number', example: HTTP_SUCCESS_GET },
      data: {
        type: 'array',
        items: academicYear,
      },
    },
  },
};
