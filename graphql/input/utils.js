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
    '__v',
    'favourite',
    'active'
  ])
  cleanedOld.assignedTo = _.omit(cleanedOld.assignedTo, [
    '__v',
    'masterEntityID',
    '_id',
    'acceptedInvite',
    'favourites',
    'createdAt',
    'createdAt',
    'updatedAt'
  ])
  cleanedOld.currentStatus = _.omit(cleanedOld.currentStatus, 'date')
  let cleanedNew = _.omit(newContract, 'id', 'statuses', 'favourite', 'active')
  cleanedNew.assignedTo = _.omit(
    cleanedNew.assignedTo,
    'id',
    'acceptedInvite',
    'favourites'
  )
  cleanedNew.currentStatus = _.omit(cleanedNew.currentStatus, 'date')

  cleanedOld.comments = _.map(cleanedOld.comments, i => {
    return {
      name: i.text
    }
  })
  cleanedNew.comments = _.map(cleanedNew.comments, i => {
    return {
      name: i.text
    }
  })

  return d(cleanedOld, cleanedNew)
}

const filterDiff = differences => {
  let arr = []
  differences.forEach(change => {
    let o = {}
    // Item edited
    // excluded items where array is involved because movement of valid item
    // registers as edit when it shouldn't
    if (
      change.kind === 'E' &&
      change.path[0] !== 'tags' &&
      change.path[0] !== 'comments'
    ) {
      o.attr = change.path
      o.added = change.rhs
      o.removed = change.lhs
      //   }
      arr.push(o)
    }
    if (change.kind === 'A') {
      if (change.item.kind === 'N') {
        o.attr = [...change.path, change.index]

        o.added = change.item.rhs
        arr.push(o)
      }
      // Deleted item
      if (change.item.kind === 'D') {
        o.attr = [...change.path, change.index]
        o.removed = change.item.lhs
        arr.push(o)
      }
    }
    // New item
    if (change.kind === 'N') {
      o.attr = change.path
      // if (change.path[0] === 'comments') o.added = change.rhs[0].text
      /* else */ o.added = change.rhs[0]
      arr.push(o)
    }
  })
  return arr
}

const sortDiff = arr => {
  let withIDs = _.map(arr, i => {
    if (i) {
      let copy = _.clone(i.attr)
      let id = null
      if (copy.length === 2 && _.isNumber(copy[1])) {
        id = _.join(copy, ':')
        return _.assign(i, { id })
      } else if (copy.length === 3 && copy[0] === 'tags') {
        copy.pop()
        id = _.join(copy, ':')
        return _.assign(i, { id })
      } else {
        copy.pop()
        let id = _.join(copy, ':')
        return _.assign(i, { id })
      }
    }
  })

  let o = _.values(_.groupBy(withIDs, 'id'))
  let res = _.map(o, m => {
    return _.map(m, i => {
      let type = _.last(i.attr)
      let attr = _.first(i.attr)
      // set  added as i.added if i.added is object, otherwise create object from value
      let added = _.isObject(i.added) ? i.added : { [type]: i.added }
      let removed = _.isObject(i.removed) ? i.removed : { [type]: i.removed }
      return {
        attr,
        added,
        removed
      }
    })
  })
  let y = _.map(res, i => _.merge.apply(_, i))
  return y
}

export { addNotification, detectChanges, filterDiff, sortDiff }
