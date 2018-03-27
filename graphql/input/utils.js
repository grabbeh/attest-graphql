import { Notification, Contract } from './connectors'
import diff from 'deep-diff'

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
  let cleanedOld = _.omit(oldContract[0], ['masterEntityID', '_id', '__v'])
  cleanedOld.assignedTo = _.omit(cleanedOld.assignedTo, [
    '__v',
    'masterEntityID',
    '_id'
  ])
  let cleanedNew = _.omit(newContract, 'id')
  cleanedNew.assignedTo = _.omit(cleanedNew.assignedTo, 'id')
  return d(cleanedOld, cleanedNew)
}

export { addNotification, detectChanges }
