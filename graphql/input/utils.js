import { Notification, Contract } from './connectors'
import diff from 'deep-diff'
import _ from 'lodash'

const d = diff.diff

const addNotification = (id, user, action, changes) => {
  Notification.create({
    relatedUser: user._id,
    relatedContract: id,
    masterEntityID: user.masterEntityID,
    action,
    changes
  })
}

const detectChanges = async newContract => {
  let oldContract = await Contract.find({ _id: newContract.id })
    .populate('assignedTo')
    .lean()
  let cleanedOld = _.omit(oldContract[0], [
    'statuses',
    'masterEntityID',
    '_id',
    '__v'
  ])
  cleanedOld.assignedTo = _.omit(cleanedOld.assignedTo, [
    '__v',
    'masterEntityID',
    '_id'
  ])
  let cleanedNew = _.omit(newContract, 'id', 'statuses')
  cleanedNew.assignedTo = _.omit(cleanedNew.assignedTo, 'id')
  return d(cleanedOld, cleanedNew)
}

const filterDiff = differences => {
  let arr = []
  differences.forEach(function (change) {
    let o = {}
    // Item edited
    if (change.kind === 'E') {
      if (change.path[0] === 'comments' && change.path[2] === 'text') {
        o.attr = change.path[0]
        o.added = change.rhs
        o.removed = change.lhs
      }
      if (change.path[0] !== 'comments') {
        o.attr = change.path[0]
        o.added = change.rhs
        o.removed = change.lhs
      }
      arr.push(o)
    }
    if (change.kind === 'A') {
      // Item added to existing array
      if (change.item.kind === 'N') {
        o.attr = change.path[0]
        if (change.path[0] === 'comments') o.added = change.item.rhs.text
        else o.added = change.item.rhs
        arr.push(o)
      }
      // Deleted item
      if (change.item.kind === 'D') {
        o.attr = change.path[0]
        if (change.path[0] === 'comments') o.removed = change.item.lhs.text
        else o.removed = change.item.lhs
        arr.push(o)
      }
    }
    // New item
    if (change.kind === 'N') {
      o.attr = change.path[0]
      if (change.path[0] === 'comments') o.added = change.rhs[0].text
      else o.added = change.rhs[0]
      arr.push(o)
    }
  })
  return arr
}

const sortDiff = arr => {
  _.forEach(arr, a => {
    if (_.isObject(a.added)) {
      a.addedObject = a.added
      a.added = 'OBJECT_TYPE'
    }
    if (_.isObject(a.removed)) {
      a.removedObject = a.removed
      a.removed = 'OBJECT_TYPE'
    }
  })
  return arr
}

export { addNotification, detectChanges, filterDiff, sortDiff }
