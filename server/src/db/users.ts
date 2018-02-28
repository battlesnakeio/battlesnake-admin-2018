import { getDocumentClient } from './client'

export interface IBountyCollector {
  snakeUrls: string[]
  boardWidth: number
  boardHeight: number
  maxFood: number
  snakeStartLength: number
  decHealthPoints: number
  pinTail: boolean
}

export interface IUser {
  // Info from Github
  displayName: string | null
  username: string

  // If the user is a captain then they'll be a team
  id?: string // might be null: user could be invited, but not signed in yet
  isTeamCaptain: boolean
  teamId?: string

  bountyCollector?: IBountyCollector
}

const setDefaults = (u: IUser): IUser => {
  const user: IUser = {
    username: u.username,
    id: u.id || null,
    displayName: u.displayName || null,
    isTeamCaptain: u.isTeamCaptain || false,
    teamId: u.teamId || null,
    bountyCollector: null,
  }
  return user
}

const USER_TABLE = 'users'

export async function updateUser(u: IUser): Promise<IUser> {
  const user = setDefaults(u)
  const params = {
    TableName: USER_TABLE,
    Key: {
      username: user.username,
    },
    UpdateExpression: 'set displayName = :dn, id = :id, isTeamCaptain = :tc',
    ExpressionAttributeValues: {
      ':dn': user.displayName,
      ':id': user.id,
      ':tc': user.isTeamCaptain,
    },
    ReturnValues: 'ALL_NEW',
  }
  const res = await getDocumentClient()
    .update(params)
    .promise()
  return res.Attributes as IUser
}

// Creates a user who might not have signed in yet, and adds them to a team
export async function addUnknownUserToTeam(username: string, teamId: string) {
  const params = {
    TableName: USER_TABLE,
    Key: {
      username,
    },
    UpdateExpression: 'set username = :un, teamId =:tm',
    ExpressionAttributeValues: {
      ':un': username.toLowerCase(),
      ':tm': teamId,
    },
    ReturnValues: 'ALL_NEW',
  }
  const res = await getDocumentClient()
    .update(params)
    .promise()
  return res.Attributes as IUser
}

export async function setTeamCaptain(user: IUser, captain: boolean): Promise<IUser> {
  const teamId = captain ? user.username : null
  const params = {
    TableName: USER_TABLE,
    Key: {
      username: user.username,
    },
    UpdateExpression: 'set id = :id, isTeamCaptain = :tc, teamId = :tm',
    ExpressionAttributeValues: {
      ':id': user.id,
      ':tc': captain,
      ':tm': teamId,
    },
    ReturnValues: 'ALL_NEW',
  }
  const res = await getDocumentClient()
    .update(params)
    .promise()
  return res.Attributes as IUser
}

export async function setTeamMembership(username: string, teamId: string | null): Promise<IUser> {
  const params = {
    TableName: USER_TABLE,
    Key: {
      username,
    },
    UpdateExpression: 'set teamId = :tm',
    ExpressionAttributeValues: {
      ':tm': teamId,
    },
    ReturnValues: 'ALL_NEW',
  }
  const res = await getDocumentClient()
    .update(params)
    .promise()
  return res.Attributes as IUser
}

export async function findUserByUserName(id: string): Promise<IUser> {
  const params = {
    TableName: USER_TABLE,
    Key: {
      username: id,
    },
  }
  const item = await getDocumentClient()
    .get(params)
    .promise()
  return item.Item as IUser
}

export async function getTeamMembers(teamId: string): Promise<IUser[]> {
  const params = {
    TableName: USER_TABLE,
    IndexName: 'membership',
    KeyConditionExpression: '#tm = :tid',
    ExpressionAttributeNames: {
      '#tm': 'teamId',
    },
    ExpressionAttributeValues: {
      ':tid': teamId,
    },
  }

  const result = await getDocumentClient()
    .query(params)
    .promise()
  return result.Items as IUser[]
}

export async function setAsBountyCollector(username: string, collector: IBountyCollector): Promise<IUser> {
  const params = {
    TableName: USER_TABLE,
    Key: {
      username: username,
    },
    UpdateExpression: 'set bountyCollector = :dn, id = :id, isTeamCaptain = :tc',
    ExpressionAttributeValues: {
      ':dn': {
        M: collector,
      },
    },
    ReturnValues: 'ALL_NEW',
  }
  const result = await getDocumentClient()
    .update(params)
    .promise()
  return result.Attributes as IUser
}
