const _ = require('lodash')
const debug = require('debug')('cypress:server:saved_state')
const md5 = require('md5')
const path = require('path')
const Promise = require('bluebird')
const sanitize = require('sanitize-filename')

const appData = require('./util/app_data')
const cwd = require('./cwd')
const FileUtil = require('./util/file')
const fs = require('./util/fs')

const stateFiles = {}

const whitelist = `
appWidth
appHeight
appX
appY
autoScrollingEnabled
browserWidth
browserHeight
browserX
browserY
isAppDevToolsOpen
isBrowserDevToolsOpen
reporterWidth
showedOnBoardingModal
preferredOpener
`.trim().split(/\s+/)

const toHashName = function (projectRoot) {
  if (!projectRoot) {
    throw new Error('Missing project path')
  }

  if (!path.isAbsolute(projectRoot)) {
    throw new Error(`Expected project absolute path, not just a name ${projectRoot}`)
  }

  const name = sanitize(path.basename(projectRoot))
  const hash = md5(projectRoot)

  return `${name}-${hash}`
}

const formStatePath = (projectRoot) => {
  return Promise.try(() => {
    debug('making saved state from %s', cwd())

    if (projectRoot) {
      debug('for project path %s', projectRoot)

      return projectRoot
    }

    debug('missing project path, looking for project here')

    const cypressJsonPath = cwd('cypress.json')

    return fs.pathExistsAsync(cypressJsonPath)
    .then((found) => {
      if (found) {
        debug('found cypress file %s', cypressJsonPath)
        projectRoot = cwd()
      }

      return projectRoot
    })
  }).then((projectRoot) => {
    const fileName = 'state.json'

    if (projectRoot) {
      debug(`state path for project ${projectRoot}`)

      return path.join(toHashName(projectRoot), fileName)
    }

    debug('state path for global mode')

    return path.join('__global__', fileName)
  })
}

const normalizeAndWhitelistSet = (set, key, value) => {
  const valueObject = (() => {
    if (_.isString(key)) {
      const tmp = {}

      tmp[key] = value

      return tmp
    }

    return key
  })()

  const invalidKeys = _.filter(_.keys(valueObject), (key) => {
    return !_.includes(whitelist, key)
  })

  if (invalidKeys.length) {
    // eslint-disable-next-line no-console
    console.error(`WARNING: attempted to save state for non-whitelisted key(s): ${invalidKeys.join(', ')}. All keys must be whitelisted in server/lib/saved_state.js`)
  }

  return set(_.pick(valueObject, whitelist))
}

const create = (projectRoot, isTextTerminal) => {
  if (isTextTerminal) {
    debug('noop saved state')

    return Promise.resolve(FileUtil.noopFile)
  }

  return formStatePath(projectRoot)
  .then((statePath) => {
    const fullStatePath = appData.projectsPath(statePath)

    debug('full state path %s', fullStatePath)
    if (stateFiles[fullStatePath]) {
      return stateFiles[fullStatePath]
    }

    debug('making new state file around %s', fullStatePath)
    const stateFile = new FileUtil({
      path: fullStatePath,
    })

    stateFile.set = _.wrap(stateFile.set.bind(stateFile), normalizeAndWhitelistSet)

    stateFiles[fullStatePath] = stateFile

    return stateFile
  })
}

module.exports = {
  create,
  formStatePath,
  toHashName,
}
