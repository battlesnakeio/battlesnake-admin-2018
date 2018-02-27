import express = require('express')
import { Router } from 'express'
import { ensureAuthenticated } from '../passport-auth'
import {
  updateUser,
  findUserByUserName,
  getTeamMembers,
  setTeamMembership,
  addUnknownUserToTeam,
  IUser,
} from '../db/users'
import { updateTeam, getTeam, ITeam } from '../db/teams'
import { createGameWithConfig, SERVER_HOST } from '../game-server'
import * as _ from 'lodash'

export const router = Router()

// Get
router.get('/', ensureAuthenticated, async (req: express.Request, res: express.Response) => {
  const user: IUser = req.user as IUser
  const teamId = user.teamId
  if (!teamId) {
    res.status(500).send('not on a team')
    throw new Error('not on a team') // need to do something about this, otherwise, you get 30s requests
  }
  const team: ITeam = await getTeam(teamId)
  if (!team) {
    throw new Error('team not created')
  }
  res.json(team)
})

// Update
router.post('/', ensureAuthenticated, async (req: express.Request, res: express.Response) => {
  const user: IUser = req.user as IUser
  const teamId = user.teamId
  if (teamId) {
    res.status(500).send('already on a team')
    throw new Error('already on a team')
  }

  const newTeam = await updateTeam({
    captainId: teamId,
    teamName: req.body.teamName,
    snakeUrl: req.body.snakeUrl,
    division: null
  })
  res.json(newTeam)
})

// List members
router.get('/members', ensureAuthenticated, async (req: express.Request, res: express.Response) => {
  const user: IUser = req.user as IUser
  const teamId = user.teamId
  if (!teamId) {
    throw new Error('not on a team')
  }

  // Get a list of team members for this users team
  const members = await getTeamMembers(teamId)
  res.json(members)
})

// Start a bounty game
router.post('/:teamId/start-bounty-game', ensureAuthenticated, async (req: express.Request, res: express.Response) => {
  const teamId = req.params.teamId
  const user: IUser = req.user

  if (!user.bountyCollector) {
    throw new Error('user must be a bounty collector')
  }

  let team: ITeam = null
  try {
    team = await getTeam(teamId)
  } catch (error) {
    console.log(error)
    res.status(500)
    res.json({ error })
    return
  }

  // Collect snakes.
  const snakes = {
    [team.captainId]: team.snakeUrl,
  }
  user.bountyCollector.snakeUrls.values.forEach((snakeUrl, idx) => {
    snakes[`${user.username}-${idx}`] = snakeUrl
  })

  let gameId: string
  try {
    gameId = await createGameWithConfig({
      width: user.bountyCollector.boardWidth,
      height: user.bountyCollector.boardHeight,
      maxFood: 10,
      snakeStartLength: 5,
      decHealthPoints: 1,
      snakes: snakes,
    })
  } catch (error) {
    console.log(error)
    res.status(500)
    res.json({ error })
    return
  }

  res.json({ gameId, gameUrl: `${SERVER_HOST}/${gameId}` })
})

// Info about the team captain
router.get('/captain', ensureAuthenticated, async (req: express.Request, res: express.Response) => {
  const user: IUser = req.user as IUser
  if (!user.teamId) {
    throw new Error('You are not on a team')
  }
  const capt = await findUserByUserName(user.teamId)
  res.json(capt)
})

// Team captains can add users
router.post(
  '/add-user',
  ensureAuthenticated,
  async (req: express.Request, res: express.Response) => {
    // validation
    if (!req.user.teamId) {
      return res.status(400).json({ msg: 'you are not on a team' })
    }
    if (!req.body.username) {
      return res.status(400).json({ msg: 'missing parameter' })
    }
    const userName = req.body.username.toLowerCase()

    const user = await findUserByUserName(userName)
    if (!user) {
      // Its ok to invite users who haven't signed in yet
      const newUser = addUnknownUserToTeam(userName, req.user.teamId)
      return res.json({ status: 'ok' })
    }

    // Don't add user to another team
    if (user.teamId) {
      return res.status(400).json({ msg: 'user already in a team' })
    }

    setTeamMembership(userName, req.user.teamId)
    return res.json({ status: 'ok' })
  }
)

// Team Captains can remove users
router.post(
  '/remove-user',
  ensureAuthenticated,
  async (req: express.Request, res: express.Response) => {
    // Post body : github userid
    // find user (no user, just exit)
    // Remove 'teamMember' param from user (but only if it equals _this_ users team id - prevent booting other users from other teams)
  }
)
