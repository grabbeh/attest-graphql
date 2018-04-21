import { Contract, User, MasterEntity, Notification } from './connectors'
import { GraphQLScalarType } from 'graphql'
import { Kind } from 'graphql/language'
import _ from 'lodash'
import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import mongoose from 'mongoose'
import { addNotification, detectChanges, filterDiff, sortDiff } from './utils'

const resolvers = {
  Date: new GraphQLScalarType({
    name: 'Date',
    description: 'Date custom scalar type',
    parseValue (value) {
      return new Date(value) // value from the client
    },
    serialize (value) {
      return value.getTime() // value sent to the client
    },
    parseLiteral (ast) {
      if (ast.kind === Kind.INT) {
        return parseInt(ast.value, 10) // ast value is always in string format
      }
      return null
    }
  }),
  Query: {
    contracts: async (root, args, { user }) => {
      return Contract.find({
        masterEntityID: user.masterEntityID,
        active: true
      })
    },
    contract: async (root, { id }) => {
      let contract = await Contract.findById(id)
      return contract
    },
    notificationsForContract: async (root, { id }) => {
      let notifications = await Notification.find({ relatedContract: id })
        .populate('relatedContract')
        .populate('relatedUser')
        .sort('-createdAt')
      return notifications
    },
    currentLawyers: async (root, args, { user }) => {
      let contracts = await Contract.find({
        masterEntityID: user.masterEntityID
      }).populate('assignedTo')
      let lawyers = _.uniq(_.map(_.map(contracts, 'assignedTo'), 'name'))
      let updatedLawyers = lawyers.map(name => {
        let checked = false
        return {
          name,
          checked
        }
      })
      return updatedLawyers
    },
    currentTags: async (root, args, { user }) => {
      let contracts = await Contract.find({
        masterEntityID: user.masterEntityID
      })
      let tags = _.uniq(
        _.map(_.flatten(_.concat(_.map(contracts, 'tags'))), 'name')
      )
      let entity = await MasterEntity.findById(user.masterEntityID)

      let updatedTags = tags.map(name => {
        let color = 'blue'
        let checked = false
        entity.tags.map(i => {
          if (i.name === name) {
            color = i.color
          }
        })
        return {
          color,
          name,
          checked
        }
      })
      return updatedTags
    },
    currentBusinessUnits: async (root, args, { user }) => {
      let contracts = await Contract.find({
        masterEntityID: user.masterEntityID
      })
      let businessUnits = _.uniq(
        _.map(_.map(contracts, 'businessUnit'), 'name')
      )
      let entity = await MasterEntity.findById(user.masterEntityID)
      let updatedUnits = businessUnits.map(name => {
        let color = 'blue'
        let checked = false
        entity.businessUnits.map(i => {
          if (i.name === name) {
            color = i.color
          }
        })
        return {
          color,
          name,
          checked
        }
      })
      return updatedUnits
    },
    currentStatuses: async (root, args, { user }) => {
      let contracts = await Contract.find({
        masterEntityID: user.masterEntityID
      })
      let statuses = _.uniq(_.map(_.map(contracts, 'currentStatus'), 'name'))
      let entity = await MasterEntity.findById(user.masterEntityID)
      let updatedStatuses = statuses.map(name => {
        let color = 'blue'
        let checked = false
        entity.statuses.map(i => {
          if (i.name === name) {
            color = i.color
          }
        })
        return {
          color,
          name,
          checked
        }
      })
      return updatedStatuses
    },
    masterEntity: async (root, args, { user }) => {
      let entity = await MasterEntity.findById(user.masterEntityID)
      return entity
    },

    user: async (root, { id }, { user }) => {
      // request user by ID as part of invite confirmation
      if (id) {
        return User.findById(id)
      } else if (user) {
        let fullUser = await User.findById(user._id)
        return fullUser
      }
      return null
    },
    allUsers: async (root, args, { user }) => {
      return User.find({ masterEntityID: user.masterEntityID })
    },
    unseenNotifications: async (root, args, { user }) => {
      if (user) {
        return Notification.find()
          .and([
            {
              masterEntityID: user.masterEntityID
            },
            {
              seenBy: { $ne: user._id.toString() }
            }
          ])
          .exec()
      }
      return null
    },
    activeNotifications: async (
      root,
      args,
      { user: { masterEntityID, _id } }
    ) => {
      return Notification.find()
        .and([
          {
            masterEntityID: masterEntityID
          },
          {
            readBy: { $ne: _id.toString() }
          }
        ])
        .populate('relatedContract')
        .populate('relatedUser')
        .sort('-createdAt')
        .exec()
    }
  },
  Mutation: {
    deactivateNotification: async (root, { id }, { user }) => {
      let notification = await Notification.findById(id)
      notification.readBy.push(user._id)
      return Notification.findByIdAndUpdate(id, notification, {
        new: true
      })
    },
    updateSeenNotifications: async (
      root,
      args,
      { user: { masterEntityID, _id } }
    ) => {
      // find all notifications where the user id is not in the 'seenBy' field
      // then add user id into those fields and save
      // update so
      let prevUnseenNotifications = await Notification.find().and([
        {
          masterEntityID: masterEntityID
        },
        {
          seenBy: { $ne: _id.toString() }
        }
      ])
      prevUnseenNotifications.forEach(n => {
        n.seenBy.push(_id.toString())
        n.save()
      })
      return 'Operation completed'
    },
    updateMasterEntity: (root, { masterEntity }, { user }) => {
      return MasterEntity.findByIdAndUpdate(user.masterEntityID, masterEntity, {
        new: true
      })
    },
    updateContract: async (root, { contract }, { user }) => {
      let differences = await detectChanges(_.cloneDeep(contract))
      let filtered = filterDiff(differences)
      let sorted = sortDiff(filtered)
      contract.assignedTo = contract.assignedTo.id
      contract.updatedAt = new Date()
      addNotification(contract.id, user, 'updated contract', sorted)
      return Contract.findByIdAndUpdate(contract.id, contract, {
        new: true
      })
    },
    addContract: async (root, { contract }, { user }) => {
      contract.assignedTo = contract.assignedTo.id
      contract.masterEntityID = user.masterEntityID
      let newContract = await Contract.create(contract)
      addNotification(newContract.id, user, 'added contract')
      return newContract
    },
    deleteContract: async (root, { id }, { user }) => {
      addNotification(id, user, 'deleted contract')
      let contract = await Contract.findById(id).lean()
      contract.active = false
      return Contract.findByIdAndUpdate(id, contract, { new: true })
    },
    deleteUser: (root, { id }) => {
      return User.remove({ _id: id })
    },
    createInitialAccount: async (root, { name, email, password }) => {
      const newMasterEntity = await MasterEntity.create({ name })
      const existingUser = await User.findOne({ email })
      if (existingUser) {
        throw new Error('Email already registered')
      }
      password = await bcrypt.hash(password, 10)
      let masterEntityID = newMasterEntity._id
      let acceptedInvite = true
      let user = { email, password, masterEntityID, acceptedInvite }
      return User.create(user)

      // Maybe just let user create account w/out validation for now
    },
    addUser: async (root, { user }, context) => {
      user.masterEntityID = context.user.masterEntityID
      if (user.password) user.password = await bcrypt.hash(user.password, 10)
      return User.create(user)
    },
    updateUser: async (root, { user }, context) => {
      return User.findByIdAndUpdate(user.id, user, {
        new: true
      })
    },
    acceptInvite: async (root, { user: { id, password } }, context) => {
      let u = await User.findById(id)
      u.acceptedInvite = true
      u.password = await bcrypt.hash(password, 10)
      return User.findByIdAndUpdate(id, u, {
        new: true
      })
    },
    login: async (root, { email, password }, { SECRET }) => {
      const user = await User.findOne({ email })
      if (!user) {
        throw new Error('Unknown user')
      }
      const isValid = await bcrypt.compare(password, user.password)
      if (!isValid) {
        throw new Error('Invalid password')
      }
      const token = jwt.sign({ user }, SECRET, {
        expiresIn: '365d'
      })
      return token
    }
  },
  Status: {
    color: async (status, args, { user }) => {
      let entity = await MasterEntity.findById(user.masterEntityID)
      let color = status.color
      entity.statuses.forEach(s => {
        if (s.name === status.name) color = s.color
      })
      return color
    }
  },
  Tag: {
    color: async (tag, args, { user }) => {
      let entity = await MasterEntity.findById(user.masterEntityID)
      let color = tag.color
      entity.tags.forEach(t => {
        if (t.name === tag.name) color = t.color
      })
      return color
    }
  },
  BusinessUnit: {
    color: async (businessUnit, args, { user }) => {
      let entity = await MasterEntity.findById(user.masterEntityID)
      let color = businessUnit.color
      entity.businessUnits.forEach(b => {
        if (b.name === businessUnit.name) color = b.color
      })
      return color
    }
  },
  Contract: {
    assignedTo: async contract => {
      if (mongoose.Types.ObjectId.isValid(contract.assignedTo)) {
        let user = await User.findById(contract.assignedTo)
        return user
      } else {
        return { name: 'Unassigned', email: 'Unassigned', id: 'Unassigned' }
      }
    },
    favourite: (contract, args, { user }) => {
      let favourite = false
      if (_.includes(user.favourites, contract.id)) {
        favourite = true
        return favourite
      }
      return favourite
    }
  },
  Notification: {
    unseen: (notification, args, { user }) => {
      let unseen = true
      if (_.includes(notification.seenBy, user._id.toString())) {
        unseen = false
        return unseen
      }
      return unseen
    }
  }
}

export default resolvers
